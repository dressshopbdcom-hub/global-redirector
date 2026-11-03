
import { Redis } from '@upstash/redis';

export const config = {
  runtime: 'edge',
};

const redis = Redis.fromEnv();

const DURATION = 6 * 60 * 60; // 6 hours

const LINK1 = process.env.LINK_1;
const LINK2 = process.env.LINK_2;
const SECRET = process.env.IP_HASH_SECRET;

const encoder = new TextEncoder();

let hmacKeyPromise = null;

function validUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
}

function getClientIP(req) {
  // Trust Vercel's infrastructure header only.
  const forwarded = req.headers.get('x-vercel-forwarded-for');

  if (!forwarded) return null;

  const ip = forwarded.split(',')[0].trim();

  return ip || null;
}

function getHmacKey() {
  if (!hmacKeyPromise) {
    hmacKeyPromise = crypto.subtle.importKey(
      'raw',
      encoder.encode(SECRET),
      {
        name: 'HMAC',
        hash: 'SHA-256',
      },
      false,
      ['sign']
    );
  }

  return hmacKeyPromise;
}

async function hashIP(ip) {
  const key = await getHmacKey();

  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(ip)
  );

  const bytes = new Uint8Array(signature);

  let hash = '';

  for (let i = 0; i < bytes.length; i++) {
    hash += bytes[i].toString(16).padStart(2, '0');
  }

  return hash;
}

function redirect(url) {
  return new Response(null, {
    status: 302,
    headers: {
      Location: url,
      'Cache-Control': 'private, no-store, max-age=0',
      Pragma: 'no-cache',
      Expires: '0',
      'X-Robots-Tag': 'noindex, nofollow',
    },
  });
}

function errorResponse(message, status) {
  return new Response(message, {
    status,
    headers: {
      'Cache-Control': 'no-store',
    },
  });
}

export default async function handler(req) {

  // Allow GET and HEAD only.
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return errorResponse('Method Not Allowed', 405);
  }

  // Validate environment variables.
  if (
    !validUrl(LINK1) ||
    !validUrl(LINK2) ||
    !SECRET ||
    SECRET.length < 32
  ) {
    return errorResponse('Configuration Error', 500);
  }

  // HEAD must not consume first visits.
  if (req.method === 'HEAD') {
    return redirect(LINK2);
  }

  // Get visitor IP.
  const ip = getClientIP(req);

  if (!ip) {
    return redirect(LINK2);
  }

  try {

    // Hash IP using HMAC-SHA256.
    const hash = await hashIP(ip);

    // Unique Redis key for each IP.
    const key = `saim:ip:v3:${hash}`;

    // First visit wins; expire after 6 hours.
    const result = await redis.set(
      key,
      '1',
      {
        nx: true,
        ex: DURATION,
      }
    );

    // First visit = LINK1
    // Existing IP = LINK2
    return redirect(result === 'OK' ? LINK1 : LINK2);

  } catch (error) {

    // Fail safely if Redis fails.
    console.error('Redirect Error:', error);

    return redirect(LINK2);
  }
}
