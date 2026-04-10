// In-memory rate limiting (resets on cold start)
const attempts = new Map();

function getIP(request) {
  return request.headers.get('CF-Connecting-IP') ||
         request.headers.get('X-Forwarded-For')?.split(',')[0]?.trim() || 'unknown';
}

function checkRateLimit(ip) {
  const now = Date.now();
  const record = attempts.get(ip) || { count: 0, firstAttempt: now, lockedUntil: 0 };

  if (record.lockedUntil > now) {
    return { blocked: true, waitSec: Math.ceil((record.lockedUntil - now) / 1000) };
  }

  if (now - record.firstAttempt > 15 * 60 * 1000) {
    record.count = 0; record.firstAttempt = now;
  }

  record.count++;
  if (record.count >= 20) record.lockedUntil = now + 60 * 60 * 1000;
  else if (record.count >= 10) record.lockedUntil = now + 5 * 60 * 1000;
  else if (record.count >= 5) record.lockedUntil = now + 30 * 1000;

  attempts.set(ip, record);
  return { blocked: false };
}

async function sha256hex(str) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('');
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function onRequestPost(context) {
  const ip = getIP(context.request);
  const rateCheck = checkRateLimit(ip);

  if (rateCheck.blocked) {
    return new Response(JSON.stringify({ success: false, error: `Too many attempts. Try again in ${rateCheck.waitSec}s` }), {
      status: 429, headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }

  const body = await context.request.json();
  const { password } = body || {};
  if (!password) return new Response(JSON.stringify({ success: false }), { status: 400, headers: corsHeaders });

  const hash = await sha256hex(password);
  const correctHash = '927a3aed189d610b2e151c4208913b3ed0cb38f6be613756819b1513c8924d7f'; // 'henry'

  if (hash === correctHash) {
    attempts.delete(ip);
    const token = Array.from(crypto.getRandomValues(new Uint8Array(16))).map(b=>b.toString(16).padStart(2,'0')).join('');
    return new Response(JSON.stringify({ success: true, token }), {
      status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }

  await new Promise(r => setTimeout(r, 1000));
  return new Response(JSON.stringify({ success: false }), { status: 401, headers: corsHeaders });
}

export async function onRequestOptions() {
  return new Response(null, { status: 200, headers: corsHeaders });
}
