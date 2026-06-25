export default async function handler(req, res) {
  // Allow requests from any origin (needed for iPad Safari)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  const { url } = req.query;
  if (!url) {
    return res.status(400).send('Missing url parameter');
  }

  try {
    const response = await fetch(decodeURIComponent(url));
    if (!response.ok) {
      return res.status(response.status).send('Upstream error');
    }
    const text = await response.text();
    res.setHeader('Content-Type', 'text/calendar');
    res.status(200).send(text);
  } catch (e) {
    res.status(500).send('Proxy error: ' + e.message);
  }
}
