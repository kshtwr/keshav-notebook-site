// Vercel serverless function behind the sticky note and the tic-tac-toe.
// Set ANTHROPIC_API_KEY in Vercel (Project → Settings → Environment Variables). Without it the site
// still works: the note falls back to its offline answers and the tic-tac-toe plays on its own.
const SYSTEM = "You are a sticky note inside Keshav Tiwari's portfolio website. Only answer questions about Keshav and his work, using the facts in the message, or play tic-tac-toe when asked. Politely decline anything else.";
const hits = new Map(); // light per-instance rate limit: 20 requests a minute per visitor

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0] || 'anon';
  const now = Date.now(), h = (hits.get(ip) || []).filter(t => now - t < 60000);
  if (h.length >= 20) return res.status(429).json({ error: 'slow down' });
  hits.set(ip, [...h, now]);
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return res.status(503).json({ error: 'not configured' });
  const prompt = req.body && req.body.prompt;
  if (typeof prompt !== 'string' || !prompt || prompt.length > 12000) return res.status(400).json({ error: 'bad request' });
  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({ model: process.env.ANTHROPIC_MODEL || 'claude-haiku-5-5', max_tokens: 160, system: SYSTEM, messages: [{ role: 'user', content: prompt }] })
    });
    const j = await r.json();
    if (!r.ok) return res.status(502).json({ error: 'upstream' });
    res.status(200).json({ text: (j.content || []).map(c => c.text || '').join('').trim() });
  } catch (e) {
    res.status(502).json({ error: 'upstream' });
  }
}
