
import { Redis } from '@upstash/redis';

export const config = {
  runtime: 'edge',
};

const redis = Redis.fromEnv();

const DURATION = 6 * 60 * 60;

const LINK1 = process.env.LINK_1;
const LINK2 = process.env.LINK_2;
const SECRET = process.env.IP_HASH_SECRET;

function validUrl(value) {
  try {
    const url = new URL(value);
    return ['https:', 'http:'].includes(url.protocol);
  } catch {
    return false;
  }
}

function getClientIP(req) {
  // Only trust headers supplied by your
  // verified hosting/proxy infrastructure.
  const ip = req.headers.get('x-vercel-forwarded-for');

  if (ip) {
    return ip.split(',')[0].trim();
  }

  return null;
}

let hmacKeyPromise;

function getHmacKey() {
  if (!hmacKeyPromise) {
    const encoder = new TextEncoder();

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
    new TextEncoder().encode(ip)
  );

  return Array.from(new Uint8Array(signature))
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('');
}

function redirect(destination) {
  return new Response(null, {
    status: 302,
    headers: {
      Location: destination,
      'Cache-Control': 'private, no-store, max-age=0',
      'Pragma': 'no-cache',
      'Expires': '0',
      'X-Robots-Tag': 'noindex, nofollow',
    },
  });
}

export default async function handler(req) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return new Response('Method Not Allowed', {
      status: 405,
      headers: {
        Allow: 'GET, HEAD',
      },
    });
  }

  if (
    !validUrl(LINK1) ||
    !validUrl(LINK2) ||
    !SECRET ||
    SECRET.length < 32
  ) {
    return new Response('Configuration Error', {
      status: 500,
    });
  }

  // HEAD requests must not consume first visits.
  if (req.method === 'HEAD') {
    return redirect(LINK2);
  }

  const ip = getClientIP(req);

  if (!ip) {
    return redirect(LINK2);
  }

  try {
    const hash = await hashIP(ip);

    const key = `saim:ip:v2:${hash}`;

    const result = await redis.set(
      key,
      '1',
      {
        nx: true,
        ex: DURATION,
      }
    );

    return redirect(
      result === 'OK' ? LINK1 : LINK2
    );

  } catch (error) {
    console.error('Redis Error:', error);

    return redirect(LINK2);
  }
}
