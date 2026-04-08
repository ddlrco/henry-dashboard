import { createHash } from 'crypto';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { password } = req.body || {};
  if (!password) return res.status(400).json({ success: false });

  // Hash the submitted password and compare to stored hash
  const hash = createHash('sha256').update(password).digest('hex');
  const correctHash = '7e4a47f80a31de444b9e4a07fae982e7f75e40949e8399a37e413b2fb392839c'; // sha256 of @agenthenry123

  if (hash === correctHash) {
    // Generate a session token
    const token = createHash('sha256').update(Date.now().toString() + Math.random().toString()).digest('hex').substring(0, 32);
    return res.status(200).json({ success: true, token });
  }

  return res.status(401).json({ success: false });
}
