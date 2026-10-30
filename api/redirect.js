
import { Redis } from '@upstash/redis';

export const config = {
  runtime: 'edge',
};

const redis = Redis.fromEnv();

const DURATION = 12 * 60 * 60; // 12 hours
const COOKIE_AGE = 30 * 24 * 60 * 60; // 30 days

const LINK1 = process.env.LINK_1;
const LINK2 = process.env.LINK_2;

function validUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
}

export default async function handler(req) {

  // Allow GET and HEAD only
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return new Response('Method Not Allowed', {
      status: 405,
      headers: { 'Allow': 'GET, HEAD' },
    });
  }

  // Validate redirect URLs
  if (!validUrl(LINK1) || !validUrl(LINK2)) {
    return new Response('Invalid redirect configuration', {
      status: 500,
    });
  }

  // Read visitor cookie
  const cookies = req.headers.get('cookie') || '';

  const match = cookies.match(
    /(?:^|;\s*)saim_visitor=([a-f0-9-]{36})(?:;|$)/i
  );

  let visitorId = match ? match[1] : null;

  // Validate UUID
  const validId = visitorId &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(visitorId);

  const isNewVisitor = !validId;

  if (isNewVisitor) {
    visitorId = crypto.randomUUID();
  }

  const headers = new Headers({
    'Cache-Control': 'no-store, no-cache, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
  });

  // Save visitor cookie
  if (isNewVisitor) {
    headers.set(
      'Set-Cookie',
      `saim_visitor=${visitorId}; Max-Age=${COOKIE_AGE}; Path=/; Secure; HttpOnly; SameSite=Lax`
    );
  }

  let destination;

  try {
    // Atomic visitor tracking
    const result = await redis.set(
      `saim:${visitorId}`,
      '1',
      {
        nx: true,
        ex: DURATION,
      }
    );

    // First visit or 12-hour expiry
    destination = result === 'OK' ? LINK1 : LINK2;

  } catch (error) {
    // Redis failure fallback
    console.error('Redis Redirect Error:', error);
    destination = LINK2;
  }

  // Fast HTTP redirect
  headers.set('Location', destination);

  return new Response(null, {
    status: 302,
    headers,
  });
}
