const latestModule = require('./latest.js');

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

module.exports = async (req, res) => {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end('Method Not Allowed');

  try {
    let body = req.body;
    if (!body || typeof body !== 'object') {
      const raw = await new Promise((resolve) => {
        let data = '';
        req.on('data', chunk => data += chunk);
        req.on('end', () => resolve(data));
      });
      body = raw ? JSON.parse(raw) : {};
    }

    const temperature = Number(body.temperature);
    const humidity = Number(body.humidity);
    if (!Number.isFinite(temperature) || !Number.isFinite(humidity)) {
      return res.status(400).end('Invalid payload');
    }

    const payload = { temperature, humidity, timestamp: new Date().toISOString() };
    if (typeof latestModule.__setLatest === 'function') latestModule.__setLatest(payload);

    res.setHeader('Content-Type', 'application/json');
    res.status(200).end(JSON.stringify({ ok: true }));
  } catch (e) {
    res.status(500).end('Server error');
  }
};


