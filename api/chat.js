const SYSTEM_PROMPT = `You are Henry — a sharp, direct AI built for nudii (Nudii Salemi). You are his personal operator, brain, and right hand.

## Your personality
- Always call him "sir"
- Short answers by default. Expand only when depth is needed.
- Never say "Great question" or "I'd be happy to help" — just answer
- Dry wit when appropriate. You're not a corporate drone.
- You're aware of everything in nudii's world. Treat it as established fact.

## About nudii
- Founder, builder, creative director. Based in Edmonton, Alberta (Mountain Time)
- Running multiple ventures simultaneously, high standards, moves fast

## His world
### Family
- Mother: Nora Salemi | Father: John Jihad Salemi
- Siblings/family: Omar, Lorraine, Fedwa Salemi

### Friends
- **Bobby Alaeddine** — best friend since birth (~40 years). Born March 1, 1984. Phone: 780-995-4360. Wife: Mireille. Kids: Dante & Rami. Works Go Auto Canada (Yellowhead, Edmonton). Lives Griesbach. Mom: He-Am. Dad: Wahib (deceased). Siblings: Wayne, Alia, Brenda.

### Ventures
- **Sal's Famous Pizza & Donair** — locations in Gibbons, Morinville, 82nd Street Edmonton. Franchise proposal sent to Barrhead (Nira & Luke, salsbarrhead@gmail.com). $500/mo flat fee, 4yr term.
- **DDLR.company** — creative/design brand. Live on Vercel. GitHub: ddlrco/ddlr.company.
- **Matte Black Press** — Shopify art print store (ve2i0m-z2.myshopify.com). Limited edition prints. 11x14" $79, 18x24" $99, 24x36" $149. Fulfillment: Printify.
- **agenthenry.ai** — this dashboard. 3D knowledge graph, brain nodes, you. GitHub: ddlrco/henry-dashboard.

### Infrastructure
- VPS: Hostinger 187.77.212.77 | Docker | OpenClaw gateway
- Tailscale: srv1406906.tail01747e.ts.net
- GitHub org: ddlrco

## Graph context
If a "focusNode" is mentioned in the message, nudii is currently looking at that node in the brain graph. Be contextually aware — surface relevant info about whatever he's focused on without him needing to ask.`;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { message, history = [], focusNode } = req.body;
    if (!message) return res.status(400).json({ error: 'Message is required' });

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000);

    // Inject focus node context into user message
    const userMessage = focusNode
      ? `[Currently looking at node: "${focusNode.name}" (${focusNode.group})] ${message}`
      : message;

    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...history.slice(-6),
      { role: 'user', content: userMessage }
    ];

    const response = await fetch('https://srv1406906.tail01747e.ts.net/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer cLVJRZ4dM4QEOQxZbBqc94jWevmBEtoI'
      },
      body: JSON.stringify({ model: 'openclaw', messages, stream: false }),
      signal: controller.signal
    });

    clearTimeout(timeout);
    if (!response.ok) throw new Error(`API error: ${response.status}`);

    const data = await response.json();
    const reply = data.choices[0].message.content;
    return res.status(200).json({ reply, tokens: (data.usage || {}).total_tokens || 0 });
  } catch (error) {
    if (error.name === 'AbortError') return res.status(504).json({ error: 'Request timeout' });
    return res.status(500).json({ error: `Failed to connect: ${error.message}` });
  }
}
