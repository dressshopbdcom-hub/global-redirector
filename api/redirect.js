
import { kv } from '@vercel/kv';

export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  const LINK1 = "https://chatgpt.com/";
  const LINK2 = "https://console.upstash.com/";

  const COOKIE = "saim_visitor";
  const DURATION = 12 * 60 * 60;

  try {
    const cookieHeader = req.headers.get('cookie') || '';
    const match = cookieHeader.match(
      /(?:^|;\s*)saim_visitor=([a-f0-9-]{36})(?:;|$)/
    );

    const visitorId = match
      ? match[1]
      : crypto.randomUUID();

    const key = `saim:${visitorId}`;

    const result = await kv.set(key, '1', {
      nx: true,
      ex: DURATION
    });

    const destination = result === 'OK' ? LINK1 : LINK2;

    return new Response(null, {
      status: 302,
      headers: {
        'Location': destination,
        'Set-Cookie': `${COOKIE}=${visitorId}; Max-Age=${DURATION}; Path=/; Secure; HttpOnly; SameSite=Lax`,
        'Cache-Control': 'no-store'
      }
    });

  } catch (error) {
    return new Response('Redirect service error', {
      status: 503
    });
  }
}
