(() => {
  const DEFAULTS = {
    deviceBaseUrl: '',
    dataPath: '/sensor',
    pollSeconds: 5,
  };

  const els = {
    temp: document.getElementById('tempValue'),
    hum: document.getElementById('humValue'),
    heat: document.getElementById('heatIndexValue'),
    deviceUrl: document.getElementById('deviceUrl'),
    lastUpdate: document.getElementById('lastUpdate'),
    pollingEvery: document.getElementById('pollingEvery'),
    statusBadge: document.getElementById('statusBadge'),
    settingsBtn: document.getElementById('settingsBtn'),
    settingsDialog: document.getElementById('settingsDialog'),
    deviceBaseUrlInput: document.getElementById('deviceBaseUrl'),
    dataPathInput: document.getElementById('dataPath'),
    pollIntervalInput: document.getElementById('pollInterval'),
    saveSettings: document.getElementById('saveSettings'),
  };

  let pollTimer = null;

  function loadConfig() {
    try {
      const raw = localStorage.getItem('esp-monitor-config');
      if (!raw) return { ...DEFAULTS };
      const cfg = JSON.parse(raw);
      return { ...DEFAULTS, ...cfg };
    } catch (e) {
      return { ...DEFAULTS };
    }
  }

  function saveConfig(cfg) {
    localStorage.setItem('esp-monitor-config', JSON.stringify(cfg));
  }

  function updateStatus(connected) {
    if (connected) {
      els.statusBadge.textContent = 'Connected';
      els.statusBadge.classList.remove('badge--disconnected');
      els.statusBadge.classList.add('badge--connected');
    } else {
      els.statusBadge.textContent = 'Disconnected';
      els.statusBadge.classList.remove('badge--connected');
      els.statusBadge.classList.add('badge--disconnected');
    }
  }

  function setMetrics(data) {
    const { temperature, humidity, heatIndex } = data;
    els.temp.textContent = isFinite(temperature) ? Number(temperature).toFixed(1) : '--';
    els.hum.textContent = isFinite(humidity) ? Number(humidity).toFixed(1) : '--';
    const h = isFinite(heatIndex) ? Number(heatIndex).toFixed(1) : (isFinite(temperature) && isFinite(humidity) ? computeHeatIndex(Number(temperature), Number(humidity)).toFixed(1) : '--');
    els.heat.textContent = h;
  }

  // Rothfusz regression (approximate) for heat index in °C
  function computeHeatIndex(tC, rh) {
    const tF = tC * 9/5 + 32;
    const HI = -42.379 + 2.04901523*tF + 10.14333127*rh - 0.22475541*tF*rh
      - 6.83783e-3*tF*tF - 5.481717e-2*rh*rh + 1.22874e-3*tF*tF*rh
      + 8.5282e-4*tF*rh*rh - 1.99e-6*tF*tF*rh*rh;
    return (HI - 32) * 5/9;
  }

  async function fetchData(baseUrl, path) {
    const url = new URL(path, baseUrl).toString();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    try {
      const res = await fetch(url, { signal: controller.signal, cache: 'no-store' });
      clearTimeout(timeout);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();
      return normalizeData(data);
    } catch (e) {
      clearTimeout(timeout);
      throw e;
    }
  }

  function normalizeData(d) {
    // Support flexible keys from ESP firmware
    return {
      temperature: pickNum(d.temperature, d.temp, d.t),
      humidity: pickNum(d.humidity, d.hum, d.h),
      heatIndex: pickNum(d.heatIndex, d.hi),
      timestamp: d.timestamp || d.time || Date.now(),
    };
  }

  function pickNum(...vals) {
    for (const v of vals) {
      if (v === undefined || v === null) continue;
      const n = Number(v);
      if (isFinite(n)) return n;
    }
    return undefined;
  }

  function startPolling(cfg) {
    stopPolling();
    if (!cfg.deviceBaseUrl) {
      updateStatus(false);
      return;
    }
    els.deviceUrl.textContent = new URL(cfg.dataPath, cfg.deviceBaseUrl).toString();
    els.pollingEvery.textContent = `${cfg.pollSeconds}s`;

    const run = async () => {
      try {
        const data = await fetchData(cfg.deviceBaseUrl, cfg.dataPath);
        setMetrics(data);
        updateStatus(true);
        const ts = typeof data.timestamp === 'number' ? new Date(data.timestamp) : new Date();
        els.lastUpdate.textContent = ts.toLocaleString();
      } catch (e) {
        updateStatus(false);
      }
    };

    run();
    pollTimer = setInterval(run, Math.max(2, Number(cfg.pollSeconds)) * 1000);
  }

  function stopPolling() {
    if (pollTimer) {
      clearInterval(pollTimer);
      pollTimer = null;
    }
  }

  function openSettings(cfg) {
    els.deviceBaseUrlInput.value = cfg.deviceBaseUrl;
    els.dataPathInput.value = cfg.dataPath;
    els.pollIntervalInput.value = cfg.pollSeconds;
    els.settingsDialog.showModal();
  }

  function wireUI() {
    els.settingsBtn.addEventListener('click', () => openSettings(loadConfig()));
    els.saveSettings.addEventListener('click', (ev) => {
      ev.preventDefault();
      const cfg = {
        deviceBaseUrl: els.deviceBaseUrlInput.value.trim().replace(/\/$/, ''),
        dataPath: els.dataPathInput.value.trim().startsWith('/') ? els.dataPathInput.value.trim() : '/' + els.dataPathInput.value.trim(),
        pollSeconds: Math.max(2, Number(els.pollIntervalInput.value || 5)),
      };
      saveConfig(cfg);
      els.settingsDialog.close();
      startPolling(cfg);
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    wireUI();
    const cfg = loadConfig();
    if (!cfg.deviceBaseUrl) {
      // Nudge to set up on first load
      setTimeout(() => openSettings(cfg), 300);
    }
    startPolling(cfg);
  });
})();


