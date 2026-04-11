export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    console.log('Sending to OpenClaw:', message);

    // Call OpenClaw API with timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000); // 25s timeout

    const response = await fetch('https://srv1406906.tail01747e.ts.net/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer cLVJRZ4dM4QEOQxZbBqc94jWevmBEtoI'
      },
      body: JSON.stringify({
        model: 'openclaw',
        messages: [{ role: 'user', content: message }],
        stream: false
      }),
      signal: controller.signal
    });

    clearTimeout(timeout);

    console.log('OpenClaw response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenClaw error:', errorText);
      throw new Error(`OpenClaw API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('OpenClaw reply:', data.choices[0].message.content.substring(0, 100));
    const reply = data.choices[0].message.content;

    const usage = data.usage || {};
    return res.status(200).json({ reply, tokens: usage.total_tokens || 0 });
  } catch (error) {
    console.error('Proxy error:', error.message);
    if (error.name === 'AbortError') {
      return res.status(504).json({ error: 'Request timeout - OpenClaw took too long to respond' });
    }
    return res.status(500).json({ error: `Failed to connect: ${error.message}` });
  }
}
