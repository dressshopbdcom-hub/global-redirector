import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  // আপনার ১০টি লিংক নিচে সিরিয়াল অনুযায়ী বসিয়ে দিন
  const links = [
    "https://viral.reelsvideos.top/viral11vip/?utm_source=Saim&utm_medium=SIAM1",
    "https://viral.reelsvideos.top/viral11vip/?utm_source=Saim&utm_medium=SIAM2",
    "https://viral.reelsvideos.top/viral11vip/?utm_source=Saim&utm_medium=SIAM3",
    "https://viral.reelsvideos.top/viral11vip/?utm_source=Saim&utm_medium=SIAM4",
    "https://viral.reelsvideos.top/viral11vip/?utm_source=Saim&utm_medium=SIAM5",
    "https://vip.mixclips.top/mix44vip/?utm_source=Saim&utm_medium=SIAM6",
    "https://vip.mixclips.top/mix44vip/?utm_source=Saim&utm_medium=SIAM7",
    "https://vip.mixclips.top/mix44vip/?utm_source=Saim&utm_medium=SIAM8",
    "https://vip.mixclips.top/mix44vip/?utm_source=Saim&utm_medium=SIAM9",
    "https://vip.mixclips.top/mix44vip/?utm_source=Saim&utm_medium=SIAM10"
  ];

  try {
    let currentIndex = await kv.get('redirect_index');
    if (currentIndex === null || currentIndex === undefined) {
      currentIndex = 0;
    } else {
      currentIndex = parseInt(currentIndex);
    }

    const selectedLink = links[currentIndex];

    let nextIndex = currentIndex + 1;
    if (nextIndex >= links.length) {
      nextIndex = 0; // ১০ নম্বর লিংকের পর আবার ১ নম্বর লিংকে ফিরে যাবে
    }

    await kv.set('redirect_index', nextIndex);
    return res.redirect(307, selectedLink);
  } catch (error) {
    return res.redirect(307, links[0]);
  }
}
