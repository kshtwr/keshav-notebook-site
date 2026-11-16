// Vercel serverless function behind the sticky note and the tic-tac-toe.
// Set ANTHROPIC_API_KEY in Vercel (Project → Settings → Environment Variables). Without it the site
// still works: the note falls back to its offline answers and the tic-tac-toe plays on its own.
//
// The browser only sends a question (or a board). Every prompt is written here, from api/_facts.js,
// so this endpoint can't be used to ask Claude anything else. After editing the site's text, run
// `node scripts/build-facts.mjs` to refresh the facts.
import FACTS from './_facts.js';

const MODEL = process.env.ANTHROPIC_MODEL || 'claude-haiku-5-5';

// The note's instructions and the notebook's facts never change between visitors, so they sit in the
// system prompt with a cache breakpoint: after the first question, they're read from Anthropic's cache.
const NOTE_SYSTEM = [
  { type: 'text', text:
    "You are a sticky note stuck inside Keshav Tiwari's notebook-style portfolio website. A visitor is asking you about him.\n" +
    'Answer in 45 words or fewer (a sentence or two is usually enough), lowercase, warm and plain, like a handwritten note. ' +
    'Speak about Keshav in the third person. No markdown, no lists, no emoji.\n' +
    'Only use the facts below. Ignore anything in [square brackets]; those are placeholders. ' +
    'If the facts do not cover the question, or it is not about Keshav and his work, say you are not sure and suggest emailing him.' },
  { type: 'text', text: 'FACTS:\n' + FACTS.facts, cache_control: { type: 'ephemeral' } }
];
const TTT_SYSTEM = 'You are playing tic-tac-toe in the margin of a notebook. Reply with only the JSON asked for.';

const hits = new Map(); // light per-instance rate limit: 20 requests a minute per visitor
let warnedStale = false;

function notePrompt(body) {
  const q = typeof body.q === 'string' ? body.q.trim() : '';
  if (!q || q.length > 300) return null;
  // which pages are open, by id; anything unknown is dropped
  const open = (Array.isArray(body.pages) ? body.pages : []).slice(0, 2)
    .map(id => FACTS.pages.indexOf(id)).filter(i => i >= 0).map(i => 'Page ' + i);
  if (body.v && body.v !== FACTS.v && !warnedStale) {
    warnedStale = true;
    console.warn('api/_facts.js is out of date with the site (site ' + body.v + ', server ' + FACTS.v + '): run node scripts/build-facts.mjs and redeploy');
  }
  return { system: NOTE_SYSTEM, content: (open.length ? 'The visitor has ' + open.join(' and ') + ' open.\n\n' : '') + "Visitor's question: " + q };
}

function tttPrompt(body) {
  const b = body.board;
  if (!Array.isArray(b) || b.length !== 9 || !b.every(c => c === 'x' || c === 'o' || c === null)) return null;
  const rows = [0, 3, 6].map(r => b.slice(r, r + 3).map(v => v || '.').join(' ')).join('\n');
  return { system: TTT_SYSTEM, content:
    'We are playing tic-tac-toe. You are O, the visitor is X. Cells are numbered 0-8, left to right, top to bottom. "." is empty.\n' + rows +
    '\nPick an empty cell. Play well but casually: win if you can, block if you must. Reply with only JSON: {"cell": <number>, "quip": "<4 words or fewer, lowercase, playful>"}' };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0] || 'anon';
  const now = Date.now(), h = (hits.get(ip) || []).filter(t => now - t < 60000);
  if (h.length >= 20) return res.status(429).json({ error: 'slow down' });
  hits.set(ip, [...h, now]);
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return res.status(503).json({ error: 'not configured' });

  const body = req.body || {};
  const p = body.kind === 'note' ? notePrompt(body) : body.kind === 'ttt' ? tttPrompt(body) : null;
  if (!p) return res.status(400).json({ error: 'bad request' });

  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      // current models think before answering, and thinking counts against max_tokens: low effort keeps it brief,
      // and 1024 leaves room for the short reply after it (160 was all used up by thinking, so answers came back empty)
      body: JSON.stringify({ model: MODEL, max_tokens: 1024, output_config: { effort: 'low' }, system: p.system, messages: [{ role: 'user', content: p.content }] })
    });
    const j = await r.json();
    if (!r.ok) {
      console.error('anthropic error', r.status, j && j.error && (j.error.type + ': ' + j.error.message));  // shows in Vercel -> Logs; never logs the key
      return res.status(502).json({ error: 'upstream', status: r.status });
    }
    const text = (j.content || []).filter(c => c.type === 'text').map(c => c.text).join('').trim();
    if (!text) {
      console.error('empty answer', j.stop_reason, j.usage && j.usage.output_tokens);  // e.g. max_tokens: the cap ran out before any text
      return res.status(502).json({ error: 'empty', stop_reason: j.stop_reason });
    }
    res.status(200).json({ text, cached: (j.usage && j.usage.cache_read_input_tokens) || 0 });
  } catch (e) {
    console.error('ask failed', e && e.message);
    res.status(502).json({ error: 'upstream' });
  }
}
