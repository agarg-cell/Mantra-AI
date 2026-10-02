const DEFAULT_SYSTEM = `You are a helpful AI assistant for Mantra AI, an AI-powered Patient Flywheel System for healthcare practices. Help users understand the platform's three modules:
1. Flywheel Agents – dormant lead revival, no-show prevention, treatment plan recovery
2. Admin AI – AI front desk, smart scheduling, intake automation
3. Revenue Cycle – eligibility checks, billing optimization, denial management
Be concise, knowledgeable, and helpful. Direct users to book a strategy call at https://calendly.com/ankur824/30min when appropriate.`;

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { prompt, history = [], systemPrompt } = req.body;

  if (!prompt) return res.status(400).json({ error: 'Prompt required' });
  if (!process.env.ANTHROPIC_API_KEY) return res.status(500).json({ error: 'API key not configured' });

  try {
    // Build messages: prior history + current user message
    const messages = [
      ...history.map(m => ({ role: m.role, content: m.content })),
      { role: 'user', content: prompt }
    ];

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1024,
        stream: true,
        system: systemPrompt || DEFAULT_SYSTEM,
        messages,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      return res.status(response.status).json({ error: err });
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(decoder.decode(value, { stream: true }));
    }

    res.end();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
