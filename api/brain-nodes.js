// Brain nodes API — returns pending nodes queued by the VPS agent
// The VPS pushes nodes to this endpoint via POST, dashboard polls GET every 10s

const pendingNodes = [];

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'POST') {
    // VPS pushes new nodes here
    const { nodes, token } = req.body || {};
    if (token !== process.env.OPENCLAW_TOKEN && token !== 'cLVJRZ4dM4QEOQxZbBqc94jWevmBEtoI') {
      return res.status(401).json({ error: 'unauthorized' });
    }
    if (Array.isArray(nodes)) {
      pendingNodes.push(...nodes);
      // Keep max 200 pending
      while (pendingNodes.length > 200) pendingNodes.shift();
    }
    return res.status(200).json({ ok: true, queued: pendingNodes.length });
  }

  if (req.method === 'GET') {
    // Dashboard polls — return and clear pending nodes
    const nodes = pendingNodes.splice(0, pendingNodes.length);
    return res.status(200).json({ nodes });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
