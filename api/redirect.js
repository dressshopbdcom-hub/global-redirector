import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  const links = [
    "https://www.google.com",
    "https://www.facebook.com",
    "https://www.youtube.com",
    "https://www.wikipedia.org"
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
      nextIndex = 0;
    }

    await kv.set('redirect_index', nextIndex);
    return res.redirect(307, selectedLink);
  } catch (error) {
    return res.redirect(307, links[0]);
  }
}
