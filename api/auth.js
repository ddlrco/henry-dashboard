import { createHash } from 'crypto';

// In-memory rate limiting (resets on cold start, but effective during active use)
const attempts = new Map(); // IP -> { count, firstAttempt, lockedUntil }

function getIP(req) {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 
         req.headers['x-real-ip'] || 
         req.socket?.remoteAddress || 
         'unknown';
}

function checkRateLimit(ip) {
  const now = Date.now();
  const record = attempts.get(ip) || { count: 0, firstAttempt: now, lockedUntil: 0 };
  
  // Check if locked out
  if (record.lockedUntil > now) {
    const waitSec = Math.ceil((record.lockedUntil - now) / 1000);
    return { blocked: true, waitSec };
  }
  
  // Reset window after 15 minutes
  if (now - record.firstAttempt > 15 * 60 * 1000) {
    record.count = 0;
    record.firstAttempt = now;
  }
  
  record.count++;
  
  // Escalating lockouts
  if (record.count >= 20) {
    record.lockedUntil = now + 60 * 60 * 1000; // 1 hour
  } else if (record.count >= 10) {
    record.lockedUntil = now + 5 * 60 * 1000; // 5 minutes
  } else if (record.count >= 5) {
    record.lockedUntil = now + 30 * 1000; // 30 seconds
  }
  
  attempts.set(ip, record);
  return { blocked: false };
}

function clearRateLimit(ip) {
  attempts.delete(ip);
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const ip = getIP(req);
  
  // Check rate limit
  const rateCheck = checkRateLimit(ip);
  if (rateCheck.blocked) {
    return res.status(429).json({ 
      success: false, 
      error: `Too many attempts. Try again in ${rateCheck.waitSec}s` 
    });
  }

  const { password } = req.body || {};
  if (!password) return res.status(400).json({ success: false });

  // Hash the submitted password and compare to stored hash
  const hash = createHash('sha256').update(password).digest('hex');
  const correctHash = 'f075b4923797d1d814690a797783c89c5a069f32c5f51d2fba07bbaf04251563';

  if (hash === correctHash) {
    clearRateLimit(ip); // Reset on success
    const token = createHash('sha256').update(Date.now().toString() + Math.random().toString()).digest('hex').substring(0, 32);
    return res.status(200).json({ success: true, token });
  }

  // Intentional delay on failure (slow down brute force)
  await new Promise(r => setTimeout(r, 1000));
  return res.status(401).json({ success: false });
}
