import { kv } from '@vercel/kv';

export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  const links = [
    "https://vip.mixclips.top/mix44vip/?utm_source=Saim&utm_medium=SIAM1",
    "https://vip.mixclips.top/mix44vip/?utm_source=Saim&utm_medium=SIAM2",
    "https://vip.mixclips.top/mix44vip/?utm_source=Saim&utm_medium=SIAM3",
    "https://vip.mixclips.top/mix44vip/?utm_source=Saim&utm_medium=SIAM4",
    "https://vip.mixclips.top/mix44vip/?utm_source=Saim&utm_medium=SIAM5",
    "https://vip.mixclips.top/mix44vip/?utm_source=Saim&utm_medium=SIAM6",
    "https://vip.mixclips.top/mix44vip/?utm_source=Saim&utm_medium=SIAM7",
    "https://vip.mixclips.top/mix44vip/?utm_source=Saim&utm_medium=SIAM8",
    "https://vip.mixclips.top/mix44vip/?utm_source=Saim&utm_medium=SIAM9",
    "https://vip.mixclips.top/mix44vip/?utm_source=Saim&utm_medium=SIAM10",
    "https://vip.mixclips.top/mix44vip/?utm_source=Saim&utm_medium=SIAM11",
    "https://vip.mixclips.top/mix44vip/?utm_source=Saim&utm_medium=SIAM12",
    "https://vip.mixclips.top/mix44vip/?utm_source=Saim&utm_medium=SIAM13",
    "https://vip.mixclips.top/mix44vip/?utm_source=Saim&utm_medium=SIAM14",
    "https://vip.mixclips.top/mix44vip/?utm_source=Saim&utm_medium=SIAM15"
  ];

  try {
    const nextIndex = await kv.incr('redirect_index');
    const selectedIndex = (nextIndex - 1) % links.length;

    return Response.redirect(links[selectedIndex], 302);
  } catch (error) {
    return Response.redirect(links[0], 302);
  }
}
