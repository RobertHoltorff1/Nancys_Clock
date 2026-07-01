// api/proxy.js — Vercel serverless function
// Fetches the Google Calendar iCal URL server-side, bypassing CORS restrictions.
// Deployed automatically by Vercel when this file is in the /api folder.

export default async function handler(req, res) {
  const { url } = req.query;
  if (!url) {
    return res.status(400).send('Missing ?url= parameter');
  }

  try {
    const target = decodeURIComponent(url);
    const r = await fetch(target, {
      headers: {
        // Mimic a real browser so Google doesn't block the request
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/calendar, text/plain, */*',
      },
    });

    const text = await r.text();

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'no-store, no-cache');
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.status(r.status).send(text);

  } catch (e) {
    res.status(500).send('Proxy error: ' + e.message);
  }
}
