import { kv } from '@vercel/kv';

// এটি কোডকে ব্রাউজারের সবচেয়ে নিকটবর্তী সার্ভারে রান করাবে (Super Fast)
export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  const links = [
    "https://link1.com",
    "https://link2.com",
    "https://link3.com",
    "https://link4.com",
    "https://link5.com",
    "https://link6.com",
    "https://link7.com",
    "https://link8.com",
    "https://link9.com",
    "https://link10.com"
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
