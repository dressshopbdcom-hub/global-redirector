import { Redis } from '@upstash/redis';
import { parse, serialize } from 'cookie';
import crypto from 'crypto';

// Vercel KV / Upstash-এর যুক্ত থাকা নাম অনুযায়ী
const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

export default async function handler(req, res) {
    const LINK_1 = "https://example.com/link-1";
    const LINK_2 = "https://example.com/link-2";
    const TWELVE_HOURS_MS = 12 * 60 * 60 * 1000; // ১২ ঘণ্টা

    const userAgent = req.headers['user-agent'] || '';
    const isFacebookApp = userAgent.includes('FBAN') || userAgent.includes('FBAV');

    const cookies = parse(req.headers.cookie || '');
    let visitorId = cookies.visitor_id;

    if (!visitorId) {
        visitorId = crypto.randomUUID();
        const cookieString = serialize('visitor_id', visitorId, {
            httpOnly: true,
            secure: true,
            maxAge: 60 * 60 * 24 * 30, // ৩০ দিন
            path: '/'
        });
        res.setHeader('Set-Cookie', cookieString);
    }

    const redisKey = `visitor:${visitorId}`;
    const now = Date.now();
    const visitStartTime = await redis.get(redisKey);

    // ১. প্রথম ভিজিট অথবা আগের ভিজিটের ১২ ঘণ্টা পার হয়ে গেলে
    if (!visitStartTime || (now - parseInt(visitStartTime, 10)) > TWELVE_HOURS_MS) {
        await redis.set(redisKey, now, { ex: 86400 });
        
        res.writeHead(302, { Location: LINK_1 });
        return res.end();
    } 
    
    // ২. ১২ ঘণ্টার ভেতরে পুনরায় ভিজিট করলে
    else {
        if (isFacebookApp) {
            res.writeHead(302, { Location: LINK_1 });
            return res.end();
        } else {
            res.writeHead(302, { Location: LINK_2 });
            return res.end();
        }
    }
}
