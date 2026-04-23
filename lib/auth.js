// Tiny JWT (HS256) helper — no external deps.
//
// Sessions are stateless: the token is an HMAC-signed JWT with an expiry.
// No server-side storage, no cold-start issues, no Redis dependency.
//
// AUTH_SECRET env var is required. Treat it like an API key.

import { createHmac, timingSafeEqual } from "crypto";

const b64url = (buf) =>
  Buffer.from(buf).toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");

const b64urlDecode = (str) =>
  Buffer.from(str.replace(/-/g, "+").replace(/_/g, "/"), "base64");

export function signToken(payload, secret, ttlSeconds = 60 * 60 * 12) {
  const header = { alg: "HS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const body = { ...payload, iat: now, exp: now + ttlSeconds };
  const head = b64url(JSON.stringify(header));
  const claims = b64url(JSON.stringify(body));
  const sig = b64url(createHmac("sha256", secret).update(`${head}.${claims}`).digest());
  return `${head}.${claims}.${sig}`;
}

export function verifyToken(token, secret) {
  if (!token || typeof token !== "string") return { ok: false, reason: "missing" };
  const parts = token.split(".");
  if (parts.length !== 3) return { ok: false, reason: "malformed" };
  const [head, claims, sig] = parts;
  const expected = b64url(createHmac("sha256", secret).update(`${head}.${claims}`).digest());
  // constant-time compare
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return { ok: false, reason: "bad_signature" };
  let payload;
  try {
    payload = JSON.parse(b64urlDecode(claims).toString("utf8"));
  } catch {
    return { ok: false, reason: "bad_claims" };
  }
  const now = Math.floor(Date.now() / 1000);
  if (typeof payload.exp !== "number" || payload.exp < now) return { ok: false, reason: "expired" };
  return { ok: true, payload };
}

/**
 * Extract + verify the session token from an incoming request.
 * Looks for "Authorization: Bearer <token>" first, falls back to the
 * "x-henry-auth" header (backward-compatible if the client sends it that way).
 *
 * Returns { ok: true, payload } on success,
 * or { ok: false, status: 401|500, error: string } on failure.
 *
 * On failure, call-site should `return res.status(status).json({ error })`.
 */
export function requireAuth(req) {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    return { ok: false, status: 500, error: "AUTH_SECRET not configured" };
  }
  const h = req.headers || {};
  const bearer = (h.authorization || h.Authorization || "").replace(/^Bearer\s+/i, "");
  const alt = h["x-henry-auth"] || h["X-Henry-Auth"] || "";
  const token = bearer || alt;
  if (!token) return { ok: false, status: 401, error: "unauthorized" };
  const result = verifyToken(token, secret);
  if (!result.ok) return { ok: false, status: 401, error: `unauthorized (${result.reason})` };
  return { ok: true, payload: result.payload };
}
