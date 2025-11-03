const tempEl = document.getElementById('tempValue');
const humEl = document.getElementById('humValue');
const updatedEl = document.getElementById('updatedAt');
const statusEl = document.getElementById('connectionStatus');
const pollInput = document.getElementById('pollInterval');
const toggleBtn = document.getElementById('toggleLive');

const chartCtx = document.getElementById('trendChart').getContext('2d');
const chartData = {
  labels: [],
  datasets: [
    {
      label: 'Temp (°C)',
      data: [],
      borderColor: '#0ea5e9',
      backgroundColor: 'rgba(14,165,233,0.15)',
      tension: 0.25,
      pointRadius: 0,
    },
    {
      label: 'Humidity (%)',
      data: [],
      borderColor: '#22c55e',
      backgroundColor: 'rgba(34,197,94,0.12)',
      tension: 0.25,
      pointRadius: 0,
    },
  ],
};

const trendChart = new Chart(chartCtx, {
  type: 'line',
  data: chartData,
  options: {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: { ticks: { color: '#8ea0b6' }, grid: { color: 'rgba(255,255,255,0.04)' } },
      y: { ticks: { color: '#8ea0b6' }, grid: { color: 'rgba(255,255,255,0.04)' } },
    },
    plugins: {
      legend: { labels: { color: '#8ea0b6' } },
    },
  },
});

let timerId = null;

function setConnected(connected) {
  statusEl.textContent = connected ? 'Connected' : 'Disconnected';
  statusEl.classList.toggle('badge-connected', connected);
  statusEl.classList.toggle('badge-disconnected', !connected);
}

async function fetchLatest() {
  try {
    const res = await fetch('/api/latest', { cache: 'no-store' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const payload = await res.json();
    if (!payload || payload.temperature == null || payload.humidity == null) {
      setConnected(false);
      return;
    }
    setConnected(true);
    const t = Number(payload.temperature);
    const h = Number(payload.humidity);
    const ts = payload.timestamp ? new Date(payload.timestamp) : new Date();

    tempEl.textContent = `${t.toFixed(1)} °C`;
    humEl.textContent = `${h.toFixed(1)} %`;
    updatedEl.textContent = ts.toLocaleString();

    const label = ts.toLocaleTimeString();
    chartData.labels.push(label);
    chartData.datasets[0].data.push(t);
    chartData.datasets[1].data.push(h);

    // Keep last 60 points
    const MAX = 60;
    if (chartData.labels.length > MAX) {
      chartData.labels.shift();
      chartData.datasets.forEach(d => d.data.shift());
    }
    trendChart.update();
  } catch (e) {
    setConnected(false);
  }
}

function start() {
  const sec = Math.max(2, Math.min(120, Number(pollInput.value) || 5));
  if (timerId) clearInterval(timerId);
  fetchLatest();
  timerId = setInterval(fetchLatest, sec * 1000);
  toggleBtn.textContent = 'Stop';
}

function stop() {
  if (timerId) clearInterval(timerId);
  timerId = null;
  toggleBtn.textContent = 'Start';
}

toggleBtn.addEventListener('click', () => {
  if (timerId) stop(); else start();
});

document.getElementById('testForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const temperature = Number(document.getElementById('testTemp').value);
  const humidity = Number(document.getElementById('testHum').value);
  try {
    const res = await fetch('/api/push', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ temperature, humidity })
    });
    if (res.ok) fetchLatest();
  } catch {}
});

// Auto-start polling
start();


