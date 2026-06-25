export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { url } = req.query;
  if (!url) {
    return res.status(400).send('Missing url parameter');
  }

  // Try up to 3 times with increasing timeouts
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), attempt * 5000);
      
      const response = await fetch(decodeURIComponent(url), {
        signal: controller.signal,
        headers: { 'User-Agent': 'NancysClock/1.0' }
      });
      
      clearTimeout(timeout);
      
      if (!response.ok) {
        if (attempt < 3) continue;
        return res.status(response.status).send('Upstream error');
      }
      
      const text = await response.text();
      res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
      res.setHeader('Cache-Control', 'no-cache');
      return res.status(200).send(text);
      
    } catch (e) {
      if (attempt === 3) {
        return res.status(500).send('Proxy error after 3 attempts: ' + e.message);
      }
      // Wait briefly before retry
      await new Promise(r => setTimeout(r, 1000 * attempt));
    }
  }
}
