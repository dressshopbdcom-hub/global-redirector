
import { Redis } from '@upstash/redis';

export const config = {
  runtime: 'edge',
};

const redis = Redis.fromEnv();

const DURATION = 6 * 60 * 60; // 6 hours

const LINK1 = (process.env.LINK_1 || '').trim();
const LINK2 = (process.env.LINK_2 || '').trim();
const SECRET = process.env.IP_HASH_SECRET || '';

const KEY_PREFIX = 'saim:ip:v5:';

const encoder = new TextEncoder();

let hmacKeyPromise;

function validUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' ||
           url.protocol === 'http:';
  } catch {
    return false;
  }
}

// Get verified Vercel visitor IP
function getClientIP(req) {
  const ip =
    req.headers.get('x-vercel-forwarded-for') ||
    req.headers.get('x-real-ip');

  if (!ip) return null;

  return ip.split(',')[0].trim() || null;
}

// Import HMAC key once per runtime instance
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

// Secure IP hashing
async function hashIP(ip) {
  const key = await getHmacKey();

  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(ip)
  );

  return Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// Redirect response
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

  // Allow only GET and HEAD
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return errorResponse('Method Not Allowed', 405);
  }

  // Validate environment variables
  if (
    !validUrl(LINK1) ||
    !validUrl(LINK2) ||
    SECRET.length < 32
  ) {
    return errorResponse('Configuration Error', 500);
  }

  // HEAD requests do not consume first visits
  if (req.method === 'HEAD') {
    return redirect(LINK2);
  }

  // Get visitor IP
  const ip = getClientIP(req);

  // Do not silently classify everyone as the same visitor
  if (!ip) {
    return errorResponse('Visitor IP Not Available', 503);
  }

  try {

    // Generate secure IP hash
    const hash = await hashIP(ip);

    // New namespace for clean testing
    const key = `${KEY_PREFIX}${hash}`;

    // First visit only, expire automatically after 6 hours
    const result = await redis.set(
      key,
      '1',
      {
        nx: true,
        ex: DURATION,
      }
    );

    // First visit = LINK1
    // Repeat visit = LINK2
    if (result === 'OK') {
      return redirect(LINK1);
    }

    return redirect(LINK2);

  } catch (error) {

    console.error('Redirect System Error:', error);

    // Safe fallback
    return redirect(LINK2);
  }
}
