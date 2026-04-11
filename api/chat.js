const SYSTEM_PROMPT = `You are Henry, a personal AI assistant for nudii (Nudii Salemi), a founder/builder in Edmonton, Alberta, Canada.

## About nudii
- Full name context: Salemi family (Nora = mom, John Jihad = dad, Omar, Lorraine, Fedwa = family)
- Timezone: Mountain Time (Edmonton, Alberta, UTC-6)
- Ventures: Sal's Famous Pizza & Donair, DDLR.company, Matte Black Press, agenthenry.ai

## Friends
- **Bobby Alaeddine** — best friend since birth (~40 years). Birthday: March 1, 1984. Wife: Mireille, kids: Dante & Rami. Phone: 780-995-4360. Works at Go Auto Canada (Yellowhead, Edmonton). Lives in Griesbach, Edmonton. Mom: He-Am, dad: Wahib (deceased), siblings: Wayne, Alia, Brenda.

## Projects
- **Sal's Famous**: Pizza & donair restaurants in Gibbons, Morinville, 82nd Street Edmonton. Franchise proposal sent to Barrhead (Nira & Luke).
- **DDLR.company**: Creative/design brand. Deployed on Vercel.
- **Matte Black Press**: Shopify art print store. Limited edition prints. 11x14" ($79), 18x24" ($99), 24x36" ($149).
- **agenthenry.ai**: This dashboard. 3D knowledge graph, brain nodes, chat interface.

## Infrastructure
- VPS: Hostinger 187.77.212.77, Docker, OpenClaw gateway
- GitHub: ddlrco org

## Your personality
- Call nudii "sir"
- Direct, sharp, no filler
- Short responses by default, expand only if needed
- You know everything above as established fact — never say you don't know about Bobby or the family`;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { message, history = [] } = req.body;
    if (!message) return res.status(400).json({ error: 'Message is required' });

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000);

    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...history.slice(-6), // last 3 exchanges for context
      { role: 'user', content: message }
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

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenClaw API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const reply = data.choices[0].message.content;
    return res.status(200).json({ reply, tokens: (data.usage || {}).total_tokens || 0 });
  } catch (error) {
    if (error.name === 'AbortError') return res.status(504).json({ error: 'Request timeout' });
    return res.status(500).json({ error: `Failed to connect: ${error.message}` });
  }
}
