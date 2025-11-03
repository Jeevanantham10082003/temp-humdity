const http = require('http');
const fs = require('fs');
const path = require('path');

let latest = null;

const MIME = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
};

function send(res, code, body, type = 'text/plain') {
  res.writeHead(code, {
    'Content-Type': type,
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  res.end(body);
}

function serveStatic(req, res) {
  const urlPath = req.url === '/' ? '/index.html' : req.url;
  const filePath = path.join(__dirname, decodeURIComponent(urlPath.split('?')[0]));
  if (!filePath.startsWith(__dirname)) return send(res, 403, 'Forbidden');
  fs.readFile(filePath, (err, data) => {
    if (err) return send(res, 404, 'Not Found');
    const ext = path.extname(filePath);
    send(res, 200, data, MIME[ext] || 'application/octet-stream');
  });
}

const server = http.createServer((req, res) => {
  if (req.method === 'OPTIONS') return send(res, 200, '');
  if (req.url.startsWith('/api/latest')) {
    return send(res, 200, JSON.stringify(latest || {}), 'application/json');
  }
  if (req.url.startsWith('/api/push')) {
    if (req.method !== 'POST') return send(res, 405, 'Method Not Allowed');
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      try {
        const json = JSON.parse(body || '{}');
        const temperature = Number(json.temperature);
        const humidity = Number(json.humidity);
        if (!Number.isFinite(temperature) || !Number.isFinite(humidity)) return send(res, 400, 'Invalid payload');
        latest = { temperature, humidity, timestamp: new Date().toISOString() };
        return send(res, 200, JSON.stringify({ ok: true }), 'application/json');
      } catch (e) {
        return send(res, 400, 'Bad JSON');
      }
    });
    return;
  }
  serveStatic(req, res);
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server on http://localhost:${PORT}`));


