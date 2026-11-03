
import { Redis } from '@upstash/redis';

export const config = {
  runtime: 'edge',
};

const redis = Redis.fromEnv();

const DURATION = 6 * 60 * 60; // 6 hours

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

function getClientIP(req) {
  // Cloudflare visitor IP
  const cfIP = req.headers.get('cf-connecting-ip');

  if (cfIP) return cfIP.trim();

  // Vercel visitor IP
  const forwarded = req.headers.get('x-forwarded-for');

  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  const realIP = req.headers.get('x-real-ip');

  if (realIP) return realIP.trim();

  return null;
}

async function hashIP(ip) {
  const data = new TextEncoder().encode(ip);
  const hash = await crypto.subtle.digest('SHA-256', data);

  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export default async function handler(req) {

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return new Response('Method Not Allowed', {
      status: 405,
      headers: { Allow: 'GET, HEAD' },
    });
  }

  if (!validUrl(LINK1) || !validUrl(LINK2)) {
    return new Response('Invalid redirect configuration', {
      status: 500,
    });
  }

  // Get visitor IP
  const ip = getClientIP(req);

  if (!ip) {
    return new Response('Unable to identify visitor IP', {
      status: 503,
    });
  }

  const headers = new Headers({
    'Cache-Control': 'no-store, no-cache, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
  });

  let destination;

  try {

    // Hash IP for privacy
    const visitorHash = await hashIP(ip);

    // Global IP-based tracking
    const result = await redis.set(
      `saim:ip:${visitorHash}`,
      '1',
      {
        nx: true,
        ex: DURATION,
      }
    );

    // First visit = Link 1
    // Next 6 hours = Link 2
    destination = result === 'OK' ? LINK1 : LINK2;

  } catch (error) {

    console.error('Redis Redirect Error:', error);

    destination = LINK2;
  }

  headers.set('Location', destination);

  return new Response(null, {
    status: 302,
    headers,
  });
}
