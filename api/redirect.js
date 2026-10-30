
import { Redis } from '@upstash/redis';

export const config = {
  runtime: 'edge',
};

const redis = Redis.fromEnv();

export default async function handler(req) {
  const LINK1 = "https://vip.mixclips.top/mix44vip/?utm_source=Saim&utm_medium=SIAM1";
  const LINK2 = "https://vip.mixclips.top/mix44vip/?utm_source=Saim&utm_medium=SIAM2";

  const DURATION = 43200;

  try {
    const cookies = req.headers.get('cookie') || '';
    const match = cookies.match(
      /(?:^|;\s*)saim_visitor=([a-f0-9-]{36})(?:;|$)/
    );

    const visitorId = match
      ? match[1]
      : crypto.randomUUID();

    const key = `saim:${visitorId}`;

    const result = await redis.set(key, '1', {
      nx: true,
      ex: DURATION,
    });

    const destination = result === 'OK' ? LINK1 : LINK2;

    return new Response(null, {
      status: 302,
      headers: {
        'Location': destination,
        'Set-Cookie': `saim_visitor=${visitorId}; Max-Age=${DURATION}; Path=/; Secure; HttpOnly; SameSite=Lax`,
        'Cache-Control': 'no-store',
      },
    });

  } catch (error) {
    return new Response('Redirect service error', {
      status: 503,
    });
  }
}
