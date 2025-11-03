// Simple in-memory store for latest reading when hosted on Node/Vercel
let latest = null;

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

module.exports = (req, res) => {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  res.setHeader('Content-Type', 'application/json');
  res.status(200).end(JSON.stringify(latest || {}));
};

// Expose a way for push.js to share memory during dev server usage
module.exports.__setLatest = (value) => { latest = value; };


