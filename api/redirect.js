import { kv } from '@vercel/kv';

// এটি কোডকে ব্রাউজারের সবচেয়ে নিকটবর্তী সার্ভারে রান করাবে (Super Fast)
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
    "https://vip.mixclips.top/mix44vip/?utm_source=Saim&utm_medium=SIAM10"
  ];

  try {
    let currentIndex = await kv.get('redirect_index');
    currentIndex = currentIndex !== null ? parseInt(currentIndex) : 0;

    const selectedLink = links[currentIndex] || links[0];
    let nextIndex = (currentIndex + 1) % links.length;

    // ডাটাবেস ব্যাকগ্রাউন্ডে সেভ হতে থাকবে
    await kv.set('redirect_index', nextIndex);

    // চোখের পলকে রিডাইরেক্ট করবে
    return Response.redirect(selectedLink, 302);
  } catch (error) {
    return Response.redirect(links[0], 302);
  }
}
