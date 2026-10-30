const { Redis } = require('@upstash/redis');
const { parse, serialize } = require('cookie');
const crypto = require('crypto');

const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

module.exports = async function handler(req, res) {
    const LINK_1 = "https://example.com/link-1";
    const LINK_2 = "https://example.com/link-2";
    const TWELVE_HOURS_MS = 12 * 60 * 60 * 1000; // ১২ ঘণ্টা

    // User-Agent check kora
    const userAgent = req.headers['user-agent'] || '';
    const isFacebookLite = userAgent.toLowerCase().includes('lite');
    // Main Facebook App (Lite ba onno browser baade)
    const isMainFacebookApp = (userAgent.includes('FBAN') || userAgent.includes('FBAV')) && !isFacebookLite;

    // Cookie parse kora
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

    // ১. Prothom visit ba 12 hours par hoye gele
    if (!visitStartTime || (now - parseInt(visitStartTime, 10)) > TWELVE_HOURS_MS) {
        await redis.set(redisKey, now, { ex: 86400 });
        
        // Jodi Main Facebook App diye prothom bar ashe -> Link 1
        if (isMainFacebookApp) {
            res.writeHead(302, { Location: LINK_1 });
            return res.end();
        } else {
            // Jodi prothom bar e Lite ba onno browser diye ashe, tahole Link 2 ba Link 1 rakhte paren
            res.writeHead(302, { Location: LINK_1 });
            return res.end();
        }
    } 
    
    // ২. 12 ghontar vetor abar dukle, ba Facebook Lite / onno browser diye dukle -> Link 2
    else {
        res.writeHead(302, { Location: LINK_2 });
        return res.end();
    }
};
