// api/proxy.js — Vercel serverless function
// Uses Node's built-in https module (works on all Node versions).

const https = require('https');
const http  = require('http');

module.exports = function handler(req, res) {
  const { url } = req.query;
  if (!url) return res.status(400).send('Missing ?url= parameter');

  let target;
  try { target = decodeURIComponent(url); } 
  catch(e) { return res.status(400).send('Bad URL'); }

  const lib = target.startsWith('https') ? https : http;

  const options = {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/calendar, text/plain, */*',
    }
  };

  const request = lib.get(target, options, (upstream) => {
    // Follow one level of redirect (Google sometimes redirects)
    if ((upstream.statusCode === 301 || upstream.statusCode === 302) && upstream.headers.location) {
      const redirect = upstream.headers.location;
      const lib2 = redirect.startsWith('https') ? https : http;
      lib2.get(redirect, options, (r2) => {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Cache-Control', 'no-store');
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.status(r2.statusCode);
        r2.pipe(res);
      }).on('error', (e) => res.status(500).send('Redirect error: ' + e.message));
      return;
    }

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.status(upstream.statusCode);
    upstream.pipe(res);
  });

  request.on('error', (e) => res.status(500).send('Request error: ' + e.message));
  request.setTimeout(15000, () => {
    request.destroy();
    res.status(504).send('Upstream timeout');
  });
};
