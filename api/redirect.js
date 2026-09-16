import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  // আপনার ১০টি লিংক নিচে সিরিয়াল অনুযায়ী বসিয়ে দিন
  const links = [
    "instagram.com",
    "facebook.com",
    "youtube.com",
    "google.com/",
    "microsoft.com ",
    "x.com",
    "linkedin.com",
    "netflix.com ",
    "wikipedia.org",
    "amazon.com"
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
