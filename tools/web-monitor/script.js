// --- Web Monitor Logic Engine ---

document.addEventListener('DOMContentLoaded', () => {
  // --- Translation Dictionary (English & Indonesian) ---
  const translations = {
    en: {
      toolTitle: 'Web Monitor',
      toolSubtitle: 'Monitor website availability & latencies privately',
      addSite: 'Add Site',
      metricTotal: 'Total Sites',
      metricOnline: 'Online',
      metricOffline: 'Offline',
      metricLatency: 'Avg Latency',
      monitoredList: 'Monitored Sites',
      resetDefaults: 'Reset to Defaults',
      noSites: 'No sites monitored. Add your first site to begin!',
      historyLogs: 'Activity Logs',
      clearLogs: 'Clear',
      noLogs: 'No logs available yet.',
      addSiteTitle: 'Add Site',
      editSiteTitle: 'Edit Site',
      labelName: 'Site Name',
      labelUrl: 'URL Address',
      labelInterval: 'Check Interval',
      labelMethod: 'Check Method',
      labelProxy: 'Proxy URL (Optional)',
      labelAlerts: 'Enable Alerts',
      alertSoundLabel: 'Audio Alarm',
      alertPushLabel: 'Push Notification',
      cancelBtn: 'Cancel',
      saveBtn: 'Save',
      int10s: '10 Seconds',
      int30s: '30 Seconds',
      int1m: '1 Minute',
      int5m: '5 Minutes',
      int15m: '15 Minutes',
      methodNocors: 'Standard (No-CORS)',
      methodProxy: 'CORS Proxy',
      statusOnline: 'Online',
      statusOffline: 'Offline',
      statusChecking: 'Checking...',
      toastSiteAdded: 'Site added successfully!',
      toastSiteUpdated: 'Site updated successfully!',
      toastSiteDeleted: 'Site deleted successfully!',
      toastLogsCleared: 'Activity logs cleared!',
      toastDefaultsReset: 'Sites list reset to sample data!',
      toastPermDenied: 'Push notification permission denied.',
      notifTitleOffline: '⚠️ Website Offline!',
      notifBodyOffline: 'is OFFLINE! Latency could not be retrieved.',
      notifTitleOnline: '✅ Website Online!',
      notifBodyOnline: 'is back ONLINE. Response time:',
      logMsgOffline: 'went OFFLINE (connection failed or timed out)',
      logMsgOnline: 'went ONLINE with latency',
      tabWebsites: 'Websites',
      tabAnalytics: 'User Analytics',
      metricTotalLaunches: 'Total Opened',
      metricPopularTool: 'Most Popular',
      metricLastActiveTool: 'Last Used',
      metricTrackingState: 'Tracking Status',
      trackingLocal: 'Local Only',
      usageChartTitle: 'Tool Usage Statistics',
      resetAnalytics: 'Reset Stats',
      recentToolActivity: 'Tool Launch History',
      noAnalyticsLogs: 'No activity logged yet.',
      toastAnalyticsReset: 'Usage statistics reset!',
      exportSites: 'Export',
      importSites: 'Import',
      toastExportSuccess: 'Site configurations exported successfully!',
      toastImportSuccess: 'Site configurations imported successfully!',
      toastImportError: 'Invalid configuration file.'
    },
    id: {
      toolTitle: 'Pemantau Situs Web',
      toolSubtitle: 'Monitor ketersediaan & latensi situs secara privat',
      addSite: 'Tambah Situs',
      metricTotal: 'Total Situs',
      metricOnline: 'Online',
      metricOffline: 'Offline',
      metricLatency: 'Avg Latensi',
      monitoredList: 'Situs yang Dipantau',
      resetDefaults: 'Reset ke Contoh',
      noSites: 'Belum ada situs yang dipantau. Tambahkan situs pertama Anda!',
      historyLogs: 'Log Aktivitas',
      clearLogs: 'Bersihkan',
      noLogs: 'Belum ada aktivitas log.',
      addSiteTitle: 'Tambah Situs',
      editSiteTitle: 'Edit Situs',
      labelName: 'Nama Situs',
      labelUrl: 'Alamat URL',
      labelInterval: 'Interval Cek',
      labelMethod: 'Metode Cek',
      labelProxy: 'Proksi URL (Opsional)',
      labelAlerts: 'Aktifkan Alarm',
      alertSoundLabel: 'Alarm Suara',
      alertPushLabel: 'Notifikasi Push',
      cancelBtn: 'Batal',
      saveBtn: 'Simpan',
      int10s: '10 Detik',
      int30s: '30 Detik',
      int1m: '1 Menit',
      int5m: '5 Menit',
      int15m: '15 Menit',
      methodNocors: 'Standar (No-CORS)',
      methodProxy: 'Proksi CORS',
      statusOnline: 'Aktif',
      statusOffline: 'Mati',
      statusChecking: 'Memeriksa...',
      toastSiteAdded: 'Situs berhasil ditambahkan!',
      toastSiteUpdated: 'Situs berhasil diperbarui!',
      toastSiteDeleted: 'Situs berhasil dihapus!',
      toastLogsCleared: 'Log aktivitas dibersihkan!',
      toastDefaultsReset: 'Daftar situs di-reset ke contoh bawaan!',
      toastPermDenied: 'Izin notifikasi push ditolak.',
      notifTitleOffline: '⚠️ Situs Tidak Aktif!',
      notifBodyOffline: 'tidak aktif! Latensi tidak dapat diambil.',
      notifTitleOnline: '✅ Situs Aktif Kembali!',
      notifBodyOnline: 'aktif kembali. Waktu respons:',
      logMsgOffline: 'mati / OFFLINE (koneksi gagal atau habis waktu)',
      logMsgOnline: 'aktif / ONLINE dengan latensi',
      tabWebsites: 'Pemantau Situs',
      tabAnalytics: 'Analisis Penggunaan',
      metricTotalLaunches: 'Total Dibuka',
      metricPopularTool: 'Alat Terpopuler',
      metricLastActiveTool: 'Terakhir Digunakan',
      metricTrackingState: 'Status Pelacakan',
      trackingLocal: 'Lokal',
      usageChartTitle: 'Grafik Penggunaan Alat',
      resetAnalytics: 'Reset Statistik',
      recentToolActivity: 'Log Penggunaan Alat',
      noAnalyticsLogs: 'Belum ada aktivitas alat.',
      toastAnalyticsReset: 'Statistik penggunaan berhasil di-reset!',
      exportSites: 'Ekspor',
      importSites: 'Impor',
      toastExportSuccess: 'Konfigurasi situs berhasil diekspor!',
      toastImportSuccess: 'Konfigurasi situs berhasil diimpor!',
      toastImportError: 'File konfigurasi tidak valid.'
    }
  };

  // --- State Variables ---
  let currentLang = 'id';
  let sites = [];
  let logs = [];
  let pollIntervals = {}; // Store timer references
  let globalMuted = false;
  let audioCtx = null;

  // --- Sample/Default Sites (to pre-load immediately on first launch) ---
  const defaultSites = [
    {
      id: 'default-google',
      name: 'Google Indonesia',
      url: 'https://www.google.co.id',
      interval: 10000, // 10s
      method: 'nocors',
      proxy: '',
      alertSound: true,
      alertPush: false,
      history: [45, 48, 52, 42, 50, 48, 47, 49, 44, 46],
      status: 'online',
      lastChecked: '--:--:--',
      avgLatency: 47
    },
    {
      id: 'default-github',
      name: 'GitHub Portal',
      url: 'https://github.com',
      interval: 30000, // 30s
      method: 'nocors',
      proxy: '',
      alertSound: false,
      alertPush: true,
      history: [110, 115, 120, 108, 125, 118, 122, 114, 116, 112],
      status: 'online',
      lastChecked: '--:--:--',
      avgLatency: 116
    },
    {
      id: 'default-broken',
      name: 'Simulated Broken Web',
      url: 'https://simulated-offline-test-site.example',
      interval: 10000, // 10s
      method: 'nocors',
      proxy: '',
      alertSound: true,
      alertPush: false,
      history: [0, 0, 0, 0, 0, 0, 0, 0],
      status: 'offline',
      lastChecked: '--:--:--',
      avgLatency: 0
    }
  ];

  // --- DOM Elements ---
  const addSiteBtn = document.getElementById('addSiteBtn');
  const muteAllBtn = document.getElementById('muteAllBtn');
  const muteIcon = document.getElementById('muteIcon');
  const resetDefaultsBtn = document.getElementById('resetDefaultsBtn');
  const clearLogsBtn = document.getElementById('clearLogsBtn');
  
  const metricTotalVal = document.getElementById('metricTotalVal');
  const metricOnlineVal = document.getElementById('metricOnlineVal');
  const metricOfflineVal = document.getElementById('metricOfflineVal');
  const metricLatencyVal = document.getElementById('metricLatencyVal');
  
  const sitesGrid = document.getElementById('sitesGrid');
  const logsList = document.getElementById('logsList');
  const emptyState = document.getElementById('emptyState');
  const emptyLogs = document.getElementById('emptyLogs');
  
  const siteModal = document.getElementById('siteModal');
  const siteForm = document.getElementById('siteForm');
  const modalTitle = document.getElementById('modalTitle');
  const closeModalBtn = document.getElementById('closeModalBtn');
  const cancelModalBtn = document.getElementById('cancelModalBtn');
  
  const editSiteIdInput = document.getElementById('editSiteId');
  const siteNameInput = document.getElementById('siteName');
  const siteUrlInput = document.getElementById('siteUrl');
  const siteIntervalInput = document.getElementById('siteInterval');
  const siteMethodInput = document.getElementById('siteMethod');
  const siteProxyInput = document.getElementById('siteProxy');
  const proxyInputGroup = document.getElementById('proxyInputGroup');
  const alertSoundInput = document.getElementById('alertSound');
  const alertPushInput = document.getElementById('alertPush');

  // Tabs and Analytics Elements
  const tabWebsites = document.getElementById('tabWebsites');
  const tabAnalytics = document.getElementById('tabAnalytics');
  const sitesMetricsRow = document.getElementById('sitesMetricsRow');
  const analyticsMetricsRow = document.getElementById('analyticsMetricsRow');
  const workspaceWebsites = document.getElementById('workspaceWebsites');
  const workspaceAnalytics = document.getElementById('workspaceAnalytics');
  const usageChartCanvas = document.getElementById('usageChartCanvas');
  const analyticsLogsList = document.getElementById('analyticsLogsList');
  const resetAnalyticsBtn = document.getElementById('resetAnalyticsBtn');
  const emptyAnalyticsLogs = document.getElementById('emptyAnalyticsLogs');

  const metricTotalLaunchesVal = document.getElementById('metricTotalLaunchesVal');
  const metricPopularToolVal = document.getElementById('metricPopularToolVal');
  const metricLastActiveToolVal = document.getElementById('metricLastActiveToolVal');

  // Export/Import Elements
  const exportSitesBtn = document.getElementById('exportSitesBtn');
  const importSitesBtn = document.getElementById('importSitesBtn');
  const importFileInput = document.getElementById('importFileInput');

  // --- Initialize Tool ---
  const init = () => {
    // Get language param
    const urlParams = new URLSearchParams(window.location.search);
    const langParam = urlParams.get('lang');
    if (langParam === 'en' || langParam === 'id') {
      currentLang = langParam;
    } else {
      currentLang = localStorage.getItem('lang') === 'en' ? 'en' : 'id';
    }

    // Apply translations
    applyLanguage(currentLang);

    // Load Mute State
    globalMuted = localStorage.getItem('monitor_muted') === 'true';
    updateMuteUi();

    // Load Data
    const cachedSites = localStorage.getItem('monitor_sites');
    const cachedLogs = localStorage.getItem('monitor_logs');
    
    if (cachedSites) {
      sites = JSON.parse(cachedSites);
    } else {
      sites = JSON.parse(JSON.stringify(defaultSites)); // Clone defaults
      localStorage.setItem('monitor_sites', JSON.stringify(sites));
    }

    if (cachedLogs) {
      logs = JSON.parse(cachedLogs);
    } else {
      logs = [];
    }

    // Setup tab listeners
    tabWebsites.addEventListener('click', () => switchTab('websites'));
    tabAnalytics.addEventListener('click', () => switchTab('analytics'));
    resetAnalyticsBtn.addEventListener('click', resetAnalyticsData);

    // Setup Export/Import listeners
    exportSitesBtn.addEventListener('click', exportSitesData);
    importSitesBtn.addEventListener('click', () => importFileInput.click());
    importFileInput.addEventListener('change', importSitesData);

    // Render components
    renderSites();
    renderLogs();
    updateMetrics();

    // Start polling intervals
    startAllPolling();

    // Register push notification check
    if (Notification.permission === 'default') {
      // Prompt on user action if alertPush is enabled
    }
  };

  // --- Segmented Tab Switcher Controller ---
  const switchTab = (tabKey) => {
    if (tabKey === 'websites') {
      tabWebsites.classList.add('active');
      tabAnalytics.classList.remove('active');
      
      sitesMetricsRow.style.display = 'grid';
      analyticsMetricsRow.style.display = 'none';
      
      workspaceWebsites.style.display = 'grid';
      workspaceAnalytics.style.display = 'none';
      
      // Force redrawing cards sparklines
      sites.forEach(site => drawSparkline(site));
    } else {
      tabWebsites.classList.remove('active');
      tabAnalytics.classList.add('active');
      
      sitesMetricsRow.style.display = 'none';
      analyticsMetricsRow.style.display = 'grid';
      
      workspaceWebsites.style.display = 'none';
      workspaceAnalytics.style.display = 'grid';
      
      // Render user activity charts
      renderAnalytics();
    }
  };

  // --- Translation Engine ---
  const applyLanguage = (lang) => {
    currentLang = lang;
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (translations[lang] && translations[lang][key]) {
        if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
          el.placeholder = translations[lang][key];
        } else {
          el.textContent = translations[lang][key];
        }
      }
    });
  };

  // PostMessage Event Listener from parent window
  window.addEventListener('message', (e) => {
    if (e.data) {
      if (e.data.type === 'syncTheme') {
        if (e.data.dark) {
          document.body.className = 'dark-theme';
        } else {
          document.body.className = '';
        }
        // Force redraw active charts depending on tab
        if (tabAnalytics.classList.contains('active')) {
          renderAnalytics();
        } else {
          sites.forEach(site => drawSparkline(site));
        }
      } else if (e.data.type === 'syncLang') {
        applyLanguage(e.data.lang);
        if (tabAnalytics.classList.contains('active')) {
          renderAnalytics();
        }
      } else if (e.data.type === 'syncAnalytics') {
        if (tabAnalytics.classList.contains('active')) {
          renderAnalytics();
        }
      }
    }
  });

  // Safe PostMessage to parent toast triggers
  const showToast = (message) => {
    window.parent.postMessage({ type: 'showToast', message }, '*');
  };

  // --- Web Audio API Alerts (Offline Warning) ---
  const playAlarm = () => {
    if (globalMuted) return;
    try {
      if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      
      const now = audioCtx.currentTime;
      
      // Apple-style double alarm chime (F5, C6)
      const osc1 = audioCtx.createOscillator();
      const osc2 = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(698.46, now); // F5
      osc1.frequency.setValueAtTime(1046.50, now + 0.18); // C6
      
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(349.23, now); // F4 sub harmonic
      
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(0.18, now + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      
      gainNode.gain.setValueAtTime(0, now + 0.45);
      gainNode.gain.linearRampToValueAtTime(0.15, now + 0.5);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.95);
      
      osc1.connect(gainNode);
      osc2.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 1.0);
      osc2.stop(now + 1.0);
    } catch (err) {
      console.warn('Web Audio synthesis failed:', err);
    }
  };

  // --- Push Notifications ---
  const triggerPushNotification = (title, body) => {
    if (Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body,
          icon: '../../favicon.png'
        });
      } catch (err) {
        console.warn('Web Notification instantiation failed', err);
      }
    }
  };

  const requestNotificationPermission = () => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        if (permission === 'denied') {
          showToast(translations[currentLang].toastPermDenied);
        }
      });
    }
  };

  // --- Ping Core Controller ---
  const performPingCheck = async (site) => {
    // Intercept simulated offline website to avoid network errors
    if (site.url === 'https://simulated-offline-test-site.example') {
      return new Promise(resolve => {
        setTimeout(() => {
          resolve({ online: false, latency: 0 });
        }, 1200); // simulate delay
      });
    }

    const start = performance.now();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8-second cutoff

    try {
      if (site.method === 'nocors') {
        // no-cors mode returns opaque responses, but is 100% bypass of client CORS
        await fetch(site.url, { 
          mode: 'no-cors', 
          cache: 'no-store', 
          signal: controller.signal 
        });
      } else {
        // CORS Proxy method
        const proxyBase = site.proxy || 'https://api.allorigins.win/get?url=';
        const finalUrl = proxyBase + encodeURIComponent(site.url);
        await fetch(finalUrl, { 
          cache: 'no-store', 
          signal: controller.signal 
        });
      }
      
      clearTimeout(timeoutId);
      const latency = Math.round(performance.now() - start);
      return { online: true, latency };
    } catch (err) {
      clearTimeout(timeoutId);
      return { online: false, latency: 0 };
    }
  };

  // --- Polling Lifecycle ---
  const startPolling = (site) => {
    // Clear existing timer if any
    if (pollIntervals[site.id]) {
      clearInterval(pollIntervals[site.id]);
    }

    // Set polling trigger
    const intervalTime = parseInt(site.interval) || 30000;
    
    // Execute immediately on startup
    executeCheck(site.id);
    
    pollIntervals[site.id] = setInterval(() => {
      executeCheck(site.id);
    }, intervalTime);
  };

  const startAllPolling = () => {
    sites.forEach(site => {
      startPolling(site);
    });
  };

  const stopPolling = (siteId) => {
    if (pollIntervals[siteId]) {
      clearInterval(pollIntervals[siteId]);
      delete pollIntervals[siteId];
    }
  };

  const stopAllPolling = () => {
    Object.keys(pollIntervals).forEach(id => {
      clearInterval(pollIntervals[id]);
    });
    pollIntervals = {};
  };

  // Execute a single check action
  const executeCheck = async (siteId) => {
    const siteIdx = sites.findIndex(s => s.id === siteId);
    if (siteIdx === -1) return;

    const site = sites[siteIdx];
    const prevStatus = site.status;
    
    // UI feedback: transition to checking status
    site.status = 'checking';
    updateCardStatusUi(site);

    const result = await performPingCheck(site);
    
    // Re-verify site still exists in array (avoid race conditions during deletes)
    const latestSiteIdx = sites.findIndex(s => s.id === siteId);
    if (latestSiteIdx === -1) return;
    
    const latestSite = sites[latestSiteIdx];
    latestSite.status = result.online ? 'online' : 'offline';
    latestSite.lastChecked = new Date().toLocaleTimeString();

    // Push into history queue (max 15 items)
    if (!latestSite.history) latestSite.history = [];
    latestSite.history.push(result.latency);
    if (latestSite.history.length > 15) {
      latestSite.history.shift();
    }

    // Recalculate average latency
    const validHistory = latestSite.history.filter(h => h > 0);
    if (validHistory.length > 0) {
      const sum = validHistory.reduce((a, b) => a + b, 0);
      latestSite.avgLatency = Math.round(sum / validHistory.length);
    } else {
      latestSite.avgLatency = 0;
    }

    // Check status changes to trigger log & notification alerts
    if (prevStatus !== 'checking' && prevStatus !== latestSite.status) {
      logStatusChange(latestSite, result.latency);
    }

    // Save sites configuration
    localStorage.setItem('monitor_sites', JSON.stringify(sites));
    
    // Update dashboard visual stats
    updateMetrics();
    updateCardStatusUi(latestSite);
    drawSparkline(latestSite);
  };

  // --- Logs and Warnings ---
  const logStatusChange = (site, latency) => {
    const now = new Date().toLocaleTimeString();
    let message = '';
    const t = translations[currentLang];

    if (site.status === 'online') {
      message = `${t.logMsgOnline} ${latency} ms`;
      
      // Trigger alerts if enabled
      if (site.alertPush) {
        triggerPushNotification(
          `${t.notifTitleOnline} ${site.name}`,
          `${site.url} ${t.notifBodyOnline} ${latency} ms`
        );
      }
    } else {
      message = t.logMsgOffline;
      
      if (site.alertSound) {
        playAlarm();
      }
      
      if (site.alertPush) {
        triggerPushNotification(
          `${t.notifTitleOffline} ${site.name}`,
          `${site.url} ${t.notifBodyOffline}`
        );
      }
    }

    const logEntry = {
      time: now,
      siteName: site.name,
      status: site.status,
      message
    };

    logs.unshift(logEntry);
    
    // Cap logs length at 50
    if (logs.length > 50) {
      logs.pop();
    }

    localStorage.setItem('monitor_logs', JSON.stringify(logs));
    renderLogs();
  };

  // --- Render Functions ---
  const renderSites = () => {
    // Clean nodes but keep emptyState template
    const cardNodes = sitesGrid.querySelectorAll('.site-card');
    cardNodes.forEach(node => node.remove());

    if (sites.length === 0) {
      emptyState.style.display = 'flex';
      return;
    }

    emptyState.style.display = 'none';

    sites.forEach(site => {
      const card = createSiteCardElement(site);
      sitesGrid.appendChild(card);
      // Wait slightly for DOM injection and draw the canvas sparkline
      setTimeout(() => {
        drawSparkline(site);
      }, 50);
    });
  };

  const createSiteCardElement = (site) => {
    const card = document.createElement('article');
    card.className = 'site-card animate-fade-in';
    card.id = `card-${site.id}`;
    
    const t = translations[currentLang];

    card.innerHTML = `
      <div class="site-card-header">
        <div class="site-info-wrapper">
          <h3 class="site-name" title="${site.name}">${site.name}</h3>
          <span class="site-url" title="${site.url}">${site.url}</span>
        </div>
        <div class="status-badge checking">
          <span class="status-dot"></span>
          <span class="status-text">${t.statusChecking}</span>
        </div>
      </div>
      
      <div class="site-stats-row">
        <div class="stat-item">
          <span class="stat-label">Latensi</span>
          <span class="stat-value site-latency-val">-- ms</span>
        </div>
        
        <div class="sparkline-container">
          <canvas class="sparkline-canvas" id="canvas-${site.id}"></canvas>
          <span class="sparkline-label" data-i18n="uptime">Uptime Trend</span>
        </div>
      </div>

      <div class="card-actions">
        <div class="action-left">
          <button class="btn-card-action alert-sound-toggle ${site.alertSound ? 'active-alert' : ''}" title="${t.alertSoundLabel}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M11 5L6 9H2v6h4l5 4V5z"></path>
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" class="sound-waves"></path>
            </svg>
          </button>
          <button class="btn-card-action alert-push-toggle ${site.alertPush ? 'active-alert' : ''}" title="${t.alertPushLabel}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
            </svg>
          </button>
        </div>
        <div class="action-right">
          <button class="btn-card-action edit-btn" title="Edit Site">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
          </button>
          <button class="btn-card-action danger-btn delete-btn" title="Delete Site">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              <line x1="10" y1="11" x2="10" y2="17"></line>
              <line x1="14" y1="11" x2="14" y2="17"></line>
            </svg>
          </button>
        </div>
      </div>
    `;

    // Connect Card Interactions
    card.querySelector('.alert-sound-toggle').addEventListener('click', (e) => {
      e.stopPropagation();
      toggleCardAlert(site.id, 'sound');
    });

    card.querySelector('.alert-push-toggle').addEventListener('click', (e) => {
      e.stopPropagation();
      requestNotificationPermission();
      toggleCardAlert(site.id, 'push');
    });

    card.querySelector('.edit-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      openEditModal(site);
    });

    card.querySelector('.delete-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      deleteSite(site.id);
    });

    return card;
  };

  const updateCardStatusUi = (site) => {
    const card = document.getElementById(`card-${site.id}`);
    if (!card) return;

    const t = translations[currentLang];
    const badge = card.querySelector('.status-badge');
    const badgeText = badge.querySelector('.status-text');
    const latencyVal = card.querySelector('.site-latency-val');
    
    // Clear classes
    badge.className = 'status-badge';

    if (site.status === 'online') {
      badge.classList.add('online');
      badgeText.textContent = t.statusOnline;
      
      const lastLatency = site.history && site.history.length > 0 ? site.history[site.history.length - 1] : 0;
      latencyVal.textContent = `${lastLatency} ms`;
      latencyVal.className = 'stat-value site-latency-val text-green';
    } else if (site.status === 'offline') {
      badge.classList.add('offline');
      badgeText.textContent = t.statusOffline;
      
      latencyVal.textContent = '--';
      latencyVal.className = 'stat-value site-latency-val text-red';
    } else {
      badge.classList.add('checking');
      badgeText.textContent = t.statusChecking;
      latencyVal.className = 'stat-value site-latency-val';
    }
  };

  const renderLogs = () => {
    logsList.innerHTML = '';
    
    if (logs.length === 0) {
      emptyLogs.style.display = 'block';
      return;
    }

    emptyLogs.style.display = 'none';

    logs.forEach(log => {
      const item = document.createElement('div');
      item.className = `log-item ${log.status}`;
      item.innerHTML = `
        <span class="log-time">[${log.time}]</span>
        <span class="log-msg"><strong>${log.siteName}</strong> ${log.message}</span>
      `;
      logsList.appendChild(item);
    });
  };

  // Update Global Summary Metric Boxes
  const updateMetrics = () => {
    const total = sites.length;
    const online = sites.filter(s => s.status === 'online').length;
    const offline = sites.filter(s => s.status === 'offline').length;
    
    const onlineSites = sites.filter(s => s.status === 'online' && s.avgLatency > 0);
    let avg = 0;
    if (onlineSites.length > 0) {
      const sum = onlineSites.reduce((acc, curr) => acc + curr.avgLatency, 0);
      avg = Math.round(sum / onlineSites.length);
    }

    metricTotalVal.textContent = total;
    metricOnlineVal.textContent = online;
    metricOfflineVal.textContent = offline;
    metricLatencyVal.textContent = total === 0 || online === 0 ? '-- ms' : `${avg} ms`;
  };

  // --- High-DPI Sparkline Canvas Renderer ---
  const drawSparkline = (site) => {
    const canvas = document.getElementById(`canvas-${site.id}`);
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const width = 90;
    const height = 24;

    // Scale canvas pixels for high-DPI screens
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, width, height);

    const history = site.history || [];
    if (history.length < 2) {
      // Draw standard flat checking line
      ctx.beginPath();
      ctx.moveTo(0, height / 2);
      ctx.lineTo(width, height / 2);
      ctx.strokeStyle = 'var(--text-tertiary)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      return;
    }

    // Determine min/max height range bounds
    const cleanHistory = history.map(h => (site.status === 'offline' ? 0 : h));
    const maxVal = Math.max(...cleanHistory, 80); // Cap bottom range at 80ms minimum for scaling view
    const activePings = cleanHistory.filter(h => h > 0);
    const minVal = activePings.length > 0 ? Math.min(...activePings) : 10;
    const range = maxVal - minVal || 10;

    const padding = 3;
    const chartHeight = height - padding * 2;
    const xStep = width / (history.length - 1);

    const points = history.map((val, index) => {
      const x = index * xStep;
      let y = height / 2;
      
      if (site.status === 'offline') {
        y = height - padding; // flat baseline offline
      } else if (val > 0) {
        y = height - padding - ((val - minVal) / range) * chartHeight;
      } else {
        // offline values inside history show as flat zero
        y = height - padding;
      }
      return { x, y };
    });

    // Draw Line Area Gradient Fill
    ctx.beginPath();
    ctx.moveTo(points[0].x, height);
    points.forEach(pt => ctx.lineTo(pt.x, pt.y));
    ctx.lineTo(points[points.length - 1].x, height);
    ctx.closePath();
    
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    if (site.status === 'online') {
      grad.addColorStop(0, 'rgba(48, 209, 88, 0.3)');
      grad.addColorStop(1, 'rgba(48, 209, 88, 0)');
      ctx.fillStyle = grad;
    } else {
      grad.addColorStop(0, 'rgba(255, 69, 58, 0.3)');
      grad.addColorStop(1, 'rgba(255, 69, 58, 0)');
      ctx.fillStyle = grad;
    }
    ctx.fill();

    // Draw Line stroke
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    points.forEach(pt => ctx.lineTo(pt.x, pt.y));
    
    ctx.strokeStyle = site.status === 'online' ? 'var(--color-green)' : 'var(--color-red)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw last check dot indicator
    const lastPt = points[points.length - 1];
    ctx.beginPath();
    ctx.arc(lastPt.x - 2, lastPt.y, 3, 0, 2 * Math.PI);
    ctx.fillStyle = site.status === 'online' ? 'var(--color-green)' : 'var(--color-red)';
    ctx.fill();
  };

  // --- Modal Forms Controller ---
  const openAddModal = () => {
    modalTitle.textContent = translations[currentLang].addSiteTitle;
    editSiteIdInput.value = '';
    siteForm.reset();
    proxyInputGroup.classList.add('hidden');
    
    siteModal.classList.add('active');
  };

  const openEditModal = (site) => {
    modalTitle.textContent = translations[currentLang].editSiteTitle;
    editSiteIdInput.value = site.id;
    siteNameInput.value = site.name;
    siteUrlInput.value = site.url;
    siteIntervalInput.value = site.interval;
    siteMethodInput.value = site.method;
    siteProxyInput.value = site.proxy || '';
    
    if (site.method === 'proxy') {
      proxyInputGroup.classList.remove('hidden');
    } else {
      proxyInputGroup.classList.add('hidden');
    }

    alertSoundInput.checked = site.alertSound;
    alertPushInput.checked = site.alertPush;

    siteModal.classList.add('active');
  };

  const closeModal = () => {
    siteModal.classList.remove('active');
  };

  // Form submit handler
  siteForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const id = editSiteIdInput.value;
    const name = siteNameInput.value.trim();
    const url = siteUrlInput.value.trim();
    const interval = parseInt(siteIntervalInput.value);
    const method = siteMethodInput.value;
    const proxy = siteProxyInput.value.trim();
    const alertSound = alertSoundInput.checked;
    const alertPush = alertPushInput.checked;

    if (!name || !url) return;

    if (id) {
      // Edit mode
      const idx = sites.findIndex(s => s.id === id);
      if (idx !== -1) {
        sites[idx] = {
          ...sites[idx],
          name,
          url,
          interval,
          method,
          proxy,
          alertSound,
          alertPush
        };
        showToast(translations[currentLang].toastSiteUpdated);
        // Restart polling loop with new interval/configurations
        startPolling(sites[idx]);
      }
    } else {
      // Add mode
      const newSite = {
        id: 'site-' + Date.now(),
        name,
        url,
        interval,
        method,
        proxy,
        alertSound,
        alertPush,
        history: [],
        status: 'checking',
        lastChecked: '--:--:--',
        avgLatency: 0
      };
      sites.push(newSite);
      showToast(translations[currentLang].toastSiteAdded);
      startPolling(newSite);
    }

    localStorage.setItem('monitor_sites', JSON.stringify(sites));
    renderSites();
    updateMetrics();
    closeModal();
  });

  // Toggle single card alarm alerts
  const toggleCardAlert = (siteId, alertType) => {
    const idx = sites.findIndex(s => s.id === siteId);
    if (idx === -1) return;

    if (alertType === 'sound') {
      sites[idx].alertSound = !sites[idx].alertSound;
      const card = document.getElementById(`card-${siteId}`);
      if (card) {
        const btn = card.querySelector('.alert-sound-toggle');
        btn.classList.toggle('active-alert');
      }
    } else if (alertType === 'push') {
      sites[idx].alertPush = !sites[idx].alertPush;
      const card = document.getElementById(`card-${siteId}`);
      if (card) {
        const btn = card.querySelector('.alert-push-toggle');
        btn.classList.toggle('active-alert');
      }
    }

    localStorage.setItem('monitor_sites', JSON.stringify(sites));
  };

  const deleteSite = (siteId) => {
    stopPolling(siteId);
    sites = sites.filter(s => s.id !== siteId);
    localStorage.setItem('monitor_sites', JSON.stringify(sites));
    
    renderSites();
    updateMetrics();
    showToast(translations[currentLang].toastSiteDeleted);
  };

  // --- Trigger Listeners & Actions ---
  addSiteBtn.addEventListener('click', openAddModal);
  closeModalBtn.addEventListener('click', closeModal);
  cancelModalBtn.addEventListener('click', closeModal);
  
  // Close modal on background touch/click
  siteModal.addEventListener('click', (e) => {
    if (e.target === siteModal) closeModal();
  });

  siteMethodInput.addEventListener('change', () => {
    if (siteMethodInput.value === 'proxy') {
      proxyInputGroup.classList.remove('hidden');
    } else {
      proxyInputGroup.classList.add('hidden');
    }
  });

  // Global Audio Mute button controller
  muteAllBtn.addEventListener('click', () => {
    globalMuted = !globalMuted;
    localStorage.setItem('monitor_muted', globalMuted);
    updateMuteUi();
  });

  const updateMuteUi = () => {
    if (globalMuted) {
      muteAllBtn.classList.add('active-alert');
      // Draw muted icon waves strike-through
      muteIcon.innerHTML = `
        <path d="M11 5L6 9H2v6h4l5 4V5z"></path>
        <line x1="23" y1="9" x2="17" y2="15"></line>
        <line x1="17" y1="9" x2="23" y2="15"></line>
      `;
    } else {
      muteAllBtn.classList.remove('active-alert');
      muteIcon.innerHTML = `
        <path d="M11 5L6 9H2v6h4l5 4V5z"></path>
        <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
      `;
    }
  };

  resetDefaultsBtn.addEventListener('click', () => {
    stopAllPolling();
    sites = JSON.parse(JSON.stringify(defaultSites));
    localStorage.setItem('monitor_sites', JSON.stringify(sites));
    
    renderSites();
    updateMetrics();
    startAllPolling();
    showToast(translations[currentLang].toastDefaultsReset);
  });

  // Tool names translation mapping
  const toolNames = {
    en: {
      password: 'Password Generator',
      renamer: 'Batch Renamer Pro',
      compressor: 'Media Compressor',
      'bg-remover': 'Background Remover',
      'image-to-pdf': 'Image to PDF',
      'pdf-to-docs': 'PDF to Docs',
      'video-to-uhd': 'UHD Video Upscaler',
      'watermark-remover': 'Watermark Remover',
      'qr-code-master': 'QR Code Master',
      'ai-workflow-assistant': 'AI Workflow Assistant',
      'metadata-cleaner': 'Metadata Cleaner',
      'web-monitor': 'Web Monitor'
    },
    id: {
      password: 'Generator Kata Sandi',
      renamer: 'Batch Renamer Pro',
      compressor: 'Kompresor Media',
      'bg-remover': 'Penghapus Latar Belakang',
      'image-to-pdf': 'Gambar ke PDF',
      'pdf-to-docs': 'PDF ke Dokumen',
      'video-to-uhd': 'Peningkat Video UHD',
      'watermark-remover': 'Hapus Watermark Video',
      'qr-code-master': 'Master Kode QR',
      'ai-workflow-assistant': 'Asisten Alur Kerja AI',
      'metadata-cleaner': 'Penghapus Metadata',
      'web-monitor': 'Pemantau Situs Web'
    }
  };

  // Render User Analytics Tab
  const renderAnalytics = () => {
    let analyticsData = localStorage.getItem('toolsuf_analytics');
    if (analyticsData) {
      analyticsData = JSON.parse(analyticsData);
    } else {
      analyticsData = { launchCount: {}, history: [] };
    }

    const counts = analyticsData.launchCount || {};
    const historyList = analyticsData.history || [];

    // Calculate metrics
    const totalLaunches = Object.values(counts).reduce((acc, curr) => acc + curr, 0);
    
    let popularToolKey = '-';
    let maxLaunchCount = 0;
    Object.entries(counts).forEach(([key, val]) => {
      if (val > maxLaunchCount) {
        maxLaunchCount = val;
        popularToolKey = key;
      }
    });
    
    const isEn = currentLang === 'en';
    const popularToolName = popularToolKey !== '-' ? (toolNames[currentLang][popularToolKey] || popularToolKey) : '-';
    const popularDisplay = popularToolKey !== '-' ? `${popularToolName} (${maxLaunchCount}x)` : '-';

    let lastActiveTool = '-';
    if (historyList.length > 0) {
      const lastToolKey = historyList[0].tool;
      const lastToolName = toolNames[currentLang][lastToolKey] || lastToolKey;
      const lastTime = new Date(historyList[0].time).toLocaleTimeString();
      lastActiveTool = `${lastToolName} @ ${lastTime}`;
    }

    metricTotalLaunchesVal.textContent = totalLaunches;
    metricPopularToolVal.textContent = popularDisplay;
    metricPopularToolVal.title = popularDisplay;
    metricLastActiveToolVal.textContent = lastActiveTool;
    metricLastActiveToolVal.title = lastActiveTool;

    // Render Recent Analytics Logs
    analyticsLogsList.innerHTML = '';
    if (historyList.length === 0) {
      emptyAnalyticsLogs.style.display = 'block';
    } else {
      emptyAnalyticsLogs.style.display = 'none';
      historyList.forEach(item => {
        const logItem = document.createElement('div');
        logItem.className = 'log-item online'; // Greenish styling for usage logs
        const toolName = toolNames[currentLang][item.tool] || item.tool;
        const timeStr = new Date(item.time).toLocaleTimeString();
        const dateStr = new Date(item.time).toLocaleDateString();
        logItem.innerHTML = `
          <span class="log-time">[${dateStr} ${timeStr}]</span>
          <span class="log-msg"><strong>${toolName}</strong> ${isEn ? 'was opened' : 'berhasil dibuka'}</span>
        `;
        analyticsLogsList.appendChild(logItem);
      });
    }

    // Render Canvas Bar Chart
    drawAnalyticsChart(counts);
  };

  // Draw Horizontal Bar Chart
  const drawAnalyticsChart = (counts) => {
    const canvas = usageChartCanvas;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const container = canvas.parentElement;

    // Retrieve container height/width
    const width = container.clientWidth - 48; // accounting for card padding
    const height = Math.max(container.clientHeight - 48, 380);

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, width, height);

    const isDark = document.body.classList.contains('dark-theme');
    const toolsKeys = Object.keys(toolNames[currentLang]);
    const maxCount = Math.max(...Object.values(counts), 1);

    const rowHeight = height / toolsKeys.length;
    const barHeight = rowHeight * 0.55;
    const labelWidth = width < 480 ? 110 : 170;
    const maxBarWidth = width - labelWidth - 30;

    toolsKeys.forEach((key, idx) => {
      const count = counts[key] || 0;
      const name = toolNames[currentLang][key] || key;
      const y = idx * rowHeight + (rowHeight - barHeight) / 2;

      // Draw label name text
      ctx.fillStyle = isDark ? '#FCFCFD' : '#1C1C1E';
      ctx.font = '500 ' + (width < 480 ? '10px' : '12px') + ' -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';

      // Truncate text label if too long for screen
      let displayName = name;
      const maxTextW = labelWidth - 10;
      if (ctx.measureText(displayName).width > maxTextW) {
        while (displayName.length > 0 && ctx.measureText(displayName + '...').width > maxTextW) {
          displayName = displayName.slice(0, -1);
        }
        displayName += '...';
      }

      ctx.fillText(displayName, 0, y + barHeight / 2);

      // Draw horizontal bar gutters
      const barX = labelWidth;
      const barW = (count / maxCount) * maxBarWidth;

      ctx.beginPath();
      if (ctx.roundRect) {
        ctx.roundRect(barX, y, maxBarWidth, barHeight, 4);
      } else {
        ctx.rect(barX, y, maxBarWidth, barHeight);
      }
      ctx.fillStyle = isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.03)';
      ctx.fill();

      // Draw active data bar
      if (count > 0) {
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(barX, y, barW, barHeight, 4);
        } else {
          ctx.rect(barX, y, barW, barHeight);
        }

        const grad = ctx.createLinearGradient(barX, y, barX + barW, y);
        grad.addColorStop(0, '#007AFF');
        grad.addColorStop(1, '#8E5AFF'); // Apple accent gradient
        ctx.fillStyle = grad;
        ctx.fill();

        // Draw counter badge text
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '700 10px -apple-system, BlinkMacSystemFont, sans-serif';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        
        if (barW > 24) {
          ctx.fillText(count.toString(), barX + barW - 6, y + barHeight / 2);
        } else {
          ctx.fillStyle = isDark ? '#FCFCFD' : '#1C1C1E';
          ctx.textAlign = 'left';
          ctx.fillText(count.toString(), barX + barW + 6, y + barHeight / 2);
        }
      } else {
        // Zero count placeholder
        ctx.fillStyle = 'var(--text-secondary)';
        ctx.font = '500 10px -apple-system, BlinkMacSystemFont, sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText('0', barX + 6, y + barHeight / 2);
      }
    });
  };

  // Reset Analytics counter data
  const resetAnalyticsData = () => {
    localStorage.removeItem('toolsuf_analytics');
    renderAnalytics();
    showToast(translations[currentLang].toastAnalyticsReset);
  };

  clearLogsBtn.addEventListener('click', () => {
    logs = [];
    localStorage.removeItem('monitor_logs');
    renderLogs();
    showToast(translations[currentLang].toastLogsCleared);
  });

  // Run init
  init();
});
