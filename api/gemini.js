// api/gemini.js
// Vercel serverless function — proxies requests to Google's Gemini API.
// The API key stays here (server-side env variable) and never reaches
// the browser. The HTML/JS on the client just calls:
//   fetch('/api/gemini?model=gemini-3.5-flash', { method:'POST', body: ... })

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: { message: 'Only POST is allowed.' } });
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: { message: 'GEMINI_API_KEY env variable set nahi hai (Vercel > Settings > Environment Variables).' } });
    return;
  }

  const model = (req.query && req.query.model) || 'gemini-3.5-flash';

  // Vercel already parses JSON bodies into req.body for Node functions.
  let body = req.body;
  if (!body || typeof body === 'string') {
    try { body = JSON.parse(body || '{}'); } catch (e) { body = {}; }
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${apiKey}`;

  try {
    const geminiResp = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body)
    });

    const data = await geminiResp.json();
    res.status(geminiResp.status).json(data);
  } catch (err) {
    console.error('Gemini proxy error:', err);
    res.status(502).json({ error: { message: 'Gemini API tak pahunchne mein error: ' + (err && err.message ? err.message : String(err)) } });
  }
}
