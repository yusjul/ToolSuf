// --- Web Monitor Logic Engine (Single Website Monitor) ---

// =============================================================================
// KONFIGURASI WEBSITE YANG DIPANTAU (SINGLE SITE MONITORING)
// =============================================================================
// Ubah objek di bawah ini jika ingin mengganti website yang dipantau:
const MONITORED_SITE = {
  name: "Website Saya",
  url: "https://domain-saya.com"
};

const CHECK_INTERVAL = 30000; // 30 detik interval monitoring
const MAX_HISTORY = 30; // Maksimal 30 check riwayat latensi
const BACKEND_API_BASE = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ? 'http://localhost:3001/api/web-monitor'
  : '/api/web-monitor';

// =============================================================================
// KONFIGURASI AUTENTIKASI WEB MONITOR
// =============================================================================
const AUTH_CONFIG = {
  username: "yusjul",
  password: "yusjul2024"
};

const AUTH_SESSION_KEY = 'isAuthenticated';
const STORAGE_KEY = 'toolsuf_single_monitor_v1';

const isAuthenticated = () => {
  try {
    return sessionStorage.getItem(AUTH_SESSION_KEY) === 'true';
  } catch (e) {
    return false;
  }
};

const setSessionAuthenticated = (val) => {
  try {
    if (val) {
      sessionStorage.setItem(AUTH_SESSION_KEY, 'true');
    } else {
      sessionStorage.removeItem(AUTH_SESSION_KEY);
    }
  } catch (e) {
    console.warn('sessionStorage error:', e);
  }
};

document.addEventListener('DOMContentLoaded', () => {
  // --- Translation Dictionary (Indonesian & English) ---
  const translations = {
    id: {
      toolTitle: 'Pemantau Situs Web',
      toolSubtitle: 'Monitor ketersediaan & latensi situs secara privat',
      logoutBtn: 'Keluar',
      tabWebsites: 'Pemantau Situs',
      tabAnalytics: 'Analisis Penggunaan',
      tabMaintenance: 'Pemeliharaan Fitur',
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
      metricTotalFeatures: 'Total Alat',
      metricActiveFeatures: 'Alat Normal',
      metricMaintenanceFeatures: 'Maintenance',
      metricGlobalStatus: 'Kunci Global',
      globalOff: 'Non-aktif',
      globalOn: 'AKTIF',
      maintenanceTitle: 'Pemeliharaan Fitur',
      maintenanceSubtitle: 'Atur status akses dan pemeliharaan untuk setiap tool ToolSuf',
      resetMaintenance: 'Aktifkan Semua',
      globalBannerTitle: 'Mode Pemeliharaan Global',
      globalBannerDesc: 'Kunci dan masukkan seluruh tool ke mode maintenance secara bersamaan',
      resetMsgBtn: 'Gunakan Bawaan',
      saveMsgBtn: 'Simpan Pesan',
      statusNormal: 'Aktif',
      statusMnt: 'Maintenance',
      toastMntToggled: 'Status pemeliharaan fitur berhasil diperbarui!',
      toastGlobalMntToggled: 'Mode pemeliharaan global berhasil diubah!',
      toastMntResetAll: 'Semua fitur berhasil diaktifkan kembali!',
      toastMsgSaved: 'Pesan pemeliharaan berhasil disimpan!'
    },
    en: {
      toolTitle: 'Web Monitor',
      toolSubtitle: 'Monitor website availability & latencies privately',
      logoutBtn: 'Logout',
      tabWebsites: 'Web Monitor',
      tabAnalytics: 'User Analytics',
      tabMaintenance: 'Feature Maintenance',
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
      metricTotalFeatures: 'Total Tools',
      metricActiveFeatures: 'Normal Tools',
      metricMaintenanceFeatures: 'In Maintenance',
      metricGlobalStatus: 'Global Lock',
      globalOff: 'Inactive',
      globalOn: 'ACTIVE',
      maintenanceTitle: 'Feature Maintenance',
      maintenanceSubtitle: 'Manage access and maintenance mode for all ToolSuf tools',
      resetMaintenance: 'Activate All',
      globalBannerTitle: 'Global Maintenance Mode',
      globalBannerDesc: 'Lock and put all ToolSuf tools into maintenance mode simultaneously',
      resetMsgBtn: 'Use Default Message',
      saveMsgBtn: 'Save Message',
      statusNormal: 'Active',
      statusMnt: 'Maintenance',
      toastMntToggled: 'Feature maintenance status updated!',
      toastGlobalMntToggled: 'Global maintenance mode updated!',
      toastMntResetAll: 'All tools set to normal active mode!',
      toastMsgSaved: 'Maintenance message saved!'
    }
  };

  const currentLang = 'id';

  // --- Storage Helper ---
  const loadStoredData = () => {
    let savedTheme = 'dark'; // Req 6 Default: Dark Mode
    try {
      const explicitTheme = localStorage.getItem('theme');
      if (explicitTheme === 'dark' || explicitTheme === 'light') {
        savedTheme = explicitTheme;
      }
    } catch (e) {}

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (savedTheme) parsed.theme = savedTheme;
        return parsed;
      }
    } catch (e) {}
    return {
      history: [],
      uptime: { totalChecks: 0, onlineChecks: 0 },
      logs: [],
      theme: savedTheme,
      muted: false
    };
  };

  const saveStoredData = (data) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      if (data && data.theme) {
        localStorage.setItem('theme', data.theme);
      }
    } catch (e) {}
  };

  let state = loadStoredData();
  let monitorTimer = null;
  let isChecking = false;
  let lastStatus = null;
  let audioCtx = null;
  let cachedPublicIp = null;
  let isDashboardInitialized = false;

  // --- DOM Element References ---
  const loginView = document.getElementById('loginView');
  const dashboardView = document.getElementById('dashboardView');
  const loginForm = document.getElementById('loginForm');
  const loginUsernameInput = document.getElementById('loginUsername');
  const loginPasswordInput = document.getElementById('loginPassword');
  const loginAlert = document.getElementById('loginAlert');
  const loginBtn = document.getElementById('loginBtn');
  const loginBtnText = document.getElementById('loginBtnText');
  const loginBtnSpinner = document.getElementById('loginBtnSpinner');
  const togglePasswordBtn = document.getElementById('togglePassword');
  const eyeIcon = document.getElementById('eyeIcon');
  const eyeOffIcon = document.getElementById('eyeOffIcon');

  // Header Elements & Device Tracking Elements (Req 11)
  const deviceInfoBtn = document.getElementById('deviceInfoBtn');
  const devicePopover = document.getElementById('devicePopover');
  const devicePopoverWrapper = document.getElementById('devicePopoverWrapper');
  const headerDeviceBadge = document.getElementById('headerDeviceBadge');
  const popoverCounterBadge = document.getElementById('popoverCounterBadge');
  const deviceSessionsListPopover = document.getElementById('deviceSessionsListPopover');
  const activeDevicesCountBadge = document.getElementById('activeDevicesCountBadge');
  const connectedDevicesList = document.getElementById('connectedDevicesList');
  const refreshDevicesBtn = document.getElementById('refreshDevicesBtn');
  const testEmailBtn = document.getElementById('testEmailBtn');
  const muteAllBtn = document.getElementById('muteAllBtn');
  const muteIcon = document.getElementById('muteIcon');
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  const themeIcon = document.getElementById('themeIcon');
  const moreActionsBtn = document.getElementById('moreActionsBtn');
  const appleMoreMenu = document.getElementById('appleMoreMenu');
  const moreMenuWrapper = document.getElementById('moreMenuWrapper');
  const menuItemDevices = document.getElementById('menuItemDevices');
  const menuItemNotifications = document.getElementById('menuItemNotifications');
  const menuItemSound = document.getElementById('menuItemSound');
  const menuItemSoundIcon = document.getElementById('menuItemSoundIcon');
  const menuItemSoundLabel = document.getElementById('menuItemSoundLabel');
  const menuItemSoundBadge = document.getElementById('menuItemSoundBadge');
  const menuItemTheme = document.getElementById('menuItemTheme');
  const menuItemThemeIcon = document.getElementById('menuItemThemeIcon');
  const menuItemThemeLabel = document.getElementById('menuItemThemeLabel');
  const menuItemThemeBadge = document.getElementById('menuItemThemeBadge');
  const menuItemLogout = document.getElementById('menuItemLogout');
  const toolUsageList = document.getElementById('toolUsageList');
  const guideAccordionToggle = document.getElementById('guideAccordionToggle');
  const guideAccordionContent = document.getElementById('guideAccordionContent');
  const accordionChevron = document.getElementById('accordionChevron');
  const deviceBottomSheet = document.getElementById('deviceBottomSheet');
  const closeDeviceSheetBtn = document.getElementById('closeDeviceSheetBtn');
  const mobileSheetDevicesList = document.getElementById('mobileSheetDevicesList');
  const mobileSheetActiveCount = document.getElementById('mobileSheetActiveCount');

  // Monitored Site Hero Elements
  const monitoredSiteName = document.getElementById('monitoredSiteName');
  const monitoredSiteUrl = document.getElementById('monitoredSiteUrl');
  const monitoredSiteUrlText = document.getElementById('monitoredSiteUrlText');
  const monitoredStatusPill = document.getElementById('monitoredStatusPill');
  const monitoredStatusText = document.getElementById('monitoredStatusText');
  const manualCheckBtn = document.getElementById('manualCheckBtn');

  // 5 Single Metrics Elements
  const metricStatusIcon = document.getElementById('metricStatusIcon');
  const metricStatusVal = document.getElementById('metricStatusVal');
  const metricLatencyVal = document.getElementById('metricLatencyVal');
  const metricUptimeVal = document.getElementById('metricUptimeVal');
  const metricAvgLatencyVal = document.getElementById('metricAvgLatencyVal');
  const metricLastCheckVal = document.getElementById('metricLastCheckVal');
  const mobileLastCheckVal = document.getElementById('mobileLastCheckVal');

  // Chart & Logs Elements
  const latencyChartSvg = document.getElementById('latencyChartSvg');
  const chartMinMaxLabel = document.getElementById('chartMinMaxLabel');
  const chartTooltip = document.getElementById('chartTooltip');
  const logsList = document.getElementById('logsList');
  const emptyLogs = document.getElementById('emptyLogs');
  const clearLogsBtn = document.getElementById('clearLogsBtn');

  // Tabs Elements
  const tabWebsites = document.getElementById('tabWebsites');
  const tabAnalytics = document.getElementById('tabAnalytics');
  const tabMaintenance = document.getElementById('tabMaintenance');
  const workspaceWebsites = document.getElementById('workspaceWebsites');
  const workspaceAnalytics = document.getElementById('workspaceAnalytics');
  const workspaceMaintenance = document.getElementById('workspaceMaintenance');

  // Analytics Elements
  const metricTotalLaunchesVal = document.getElementById('metricTotalLaunchesVal');
  const metricPopularToolVal = document.getElementById('metricPopularToolVal');
  const metricLastActiveToolVal = document.getElementById('metricLastActiveToolVal');
  const usageChartCanvas = document.getElementById('usageChartCanvas');
  const analyticsLogsList = document.getElementById('analyticsLogsList');
  const emptyAnalyticsLogs = document.getElementById('emptyAnalyticsLogs');
  const resetAnalyticsBtn = document.getElementById('resetAnalyticsBtn');

  // Maintenance Elements
  const globalMaintenanceSwitch = document.getElementById('globalMaintenanceSwitch');
  const resetAllMaintenanceBtn = document.getElementById('resetAllMaintenanceBtn');
  const maintenanceSearchInput = document.getElementById('maintenanceSearchInput');
  const maintenanceGrid = document.getElementById('maintenanceGrid');
  const metricTotalFeaturesVal = document.getElementById('metricTotalFeaturesVal');
  const metricActiveFeaturesVal = document.getElementById('metricActiveFeaturesVal');
  const metricMaintenanceFeaturesVal = document.getElementById('metricMaintenanceFeaturesVal');
  const metricGlobalStatusVal = document.getElementById('metricGlobalStatusVal');
  const maintenanceMsgModal = document.getElementById('maintenanceMsgModal');
  const editMaintenanceFeatureId = document.getElementById('editMaintenanceFeatureId');
  const maintenanceFeatureNameDisplay = document.getElementById('maintenanceFeatureNameDisplay');
  const maintenanceCustomMsgInput = document.getElementById('maintenanceCustomMsgInput');
  const closeMaintenanceMsgBtn = document.getElementById('closeMaintenanceMsgBtn');
  const cancelMaintenanceMsgBtn = document.getElementById('cancelMaintenanceMsgBtn');
  const resetMaintenanceMsgBtn = document.getElementById('resetMaintenanceMsgBtn');
  const maintenanceMsgForm = document.getElementById('maintenanceMsgForm');

  // --- Toast Notification Helper ---
  const showToast = (message) => {
    let container = document.getElementById('toastContainer');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toastContainer';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = 'toast-message';
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => {
      toast.classList.add('fade-out');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  };

  // --- Sound Alert Helper ---
  const playAlertSound = () => {
    if (state.muted) return;
    try {
      if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(220, audioCtx.currentTime + 0.35);
      gain.gain.setValueAtTime(0.25, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.35);
    } catch (e) {}
  };

  const updateMuteUi = () => {
    if (muteAllBtn && muteIcon) {
      if (state.muted) {
        muteAllBtn.classList.add('active-alert');
        muteIcon.innerHTML = `
          <path d="M11 5L6 9H2v6h4l5 4V5z"></path>
          <line x1="23" y1="9" x2="17" y2="15"></line>
          <line x1="17" y1="9" x2="23" y2="15"></line>
        `;
        muteAllBtn.title = 'Sound: Muted';
      } else {
        muteAllBtn.classList.remove('active-alert');
        muteIcon.innerHTML = `
          <path d="M11 5L6 9H2v6h4l5 4V5z"></path>
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
        `;
        muteAllBtn.title = 'Sound: Active';
      }
    }
    if (menuItemSoundBadge) {
      menuItemSoundBadge.textContent = state.muted ? 'Mati' : 'Nyala';
    }
  };

  // --- Theme Controller (Dark / Light Mode) ---
  const applyTheme = (theme) => {
    state.theme = theme;
    saveStoredData(state);
    if (theme === 'light') {
      document.body.classList.remove('dark-theme');
      document.body.classList.add('light-theme');
      if (themeIcon) {
        // Moon icon for light mode
        themeIcon.innerHTML = `
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
        `;
      }
      if (themeToggleBtn) themeToggleBtn.title = 'Ganti ke Mode Gelap';
      if (menuItemThemeBadge) menuItemThemeBadge.textContent = 'Terang';
    } else {
      document.body.classList.remove('light-theme');
      document.body.classList.add('dark-theme');
      if (themeIcon) {
        // Sun icon for dark mode
        themeIcon.innerHTML = `
          <circle cx="12" cy="12" r="5"></circle>
          <line x1="12" y1="1" x2="12" y2="3"></line>
          <line x1="12" y1="21" x2="12" y2="23"></line>
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
          <line x1="1" y1="12" x2="3" y2="12"></line>
          <line x1="21" y1="12" x2="23" y2="12"></line>
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
        `;
      }
      if (themeToggleBtn) themeToggleBtn.title = 'Ganti ke Mode Terang';
      if (menuItemThemeBadge) menuItemThemeBadge.textContent = 'Gelap';
    }
  };

  // --- Device Info Detection (Req 15, 16, 17) ---
  const getDeviceInfo = () => {
    const ua = navigator.userAgent || '';
    let device = 'Desktop PC';
    let os = 'Windows';
    let browser = 'Browser';

    if (/android/i.test(ua)) {
      device = 'Android Device';
      os = 'Android';
    } else if (/ipad|iphone|ipod/i.test(ua)) {
      device = 'Apple Mobile';
      os = 'iOS';
    } else if (/macintosh|mac os x/i.test(ua)) {
      device = 'Mac';
      os = 'macOS';
    } else if (/windows nt 10.0/i.test(ua)) {
      device = 'Windows PC';
      os = 'Windows 11';
    } else if (/windows nt 6.3/i.test(ua)) {
      device = 'Windows PC';
      os = 'Windows 8.1';
    } else if (/windows nt 6.1/i.test(ua)) {
      device = 'Windows PC';
      os = 'Windows 7';
    } else if (/linux/i.test(ua)) {
      device = 'Linux PC';
      os = 'Linux';
    }

    if (/edg\//i.test(ua)) {
      browser = 'Edge';
    } else if (/chrome|crios/i.test(ua) && !/opr|opera/i.test(ua)) {
      browser = 'Chrome';
    } else if (/firefox|fxios/i.test(ua)) {
      browser = 'Firefox';
    } else if (/safari/i.test(ua) && !/chrome/i.test(ua)) {
      browser = 'Safari';
    } else if (/opr|opera/i.test(ua)) {
      browser = 'Opera';
    }

    const resolution = `${window.screen.width} × ${window.screen.height}`;
    return { device, os, browser, resolution };
  };

  const fetchPublicIp = async () => {
    if (cachedPublicIp) return cachedPublicIp;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);
      const res = await fetch('https://api.ipify.org?format=json', { signal: controller.signal });
      clearTimeout(timeoutId);
      if (res.ok) {
        const data = await res.json();
        if (data && data.ip && !data.ip.startsWith('127.') && !data.ip.startsWith('192.168.')) {
          cachedPublicIp = data.ip;
          return data.ip;
        }
      }
    } catch (e) {
      try {
        const controller2 = new AbortController();
        const timeoutId2 = setTimeout(() => controller2.abort(), 4000);
        const res2 = await fetch('https://ipapi.co/json/', { signal: controller2.signal });
        clearTimeout(timeoutId2);
        if (res2.ok) {
          const data2 = await res2.json();
          if (data2 && data2.ip && !data2.ip.startsWith('127.') && !data2.ip.startsWith('192.168.')) {
            cachedPublicIp = data2.ip;
            return data2.ip;
          }
        }
      } catch (err) {}
    }
    return 'Tidak tersedia';
  };

  const renderDeviceInfoPanel = async () => {
    const info = getDeviceInfo();
    if (deviceTypeVal) deviceTypeVal.textContent = info.device;
    if (deviceOsBrowserVal) deviceOsBrowserVal.textContent = `${info.os} · ${info.browser}`;
    if (deviceResolutionVal) deviceResolutionVal.textContent = info.resolution;
    if (devicePublicIpVal) {
      devicePublicIpVal.textContent = 'Memeriksa...';
      const ip = await fetchPublicIp();
      devicePublicIpVal.textContent = ip;
    }
  };

  // --- Realtime Pinging Engine (Req 6, 7, 8, 23) ---
  const performCheck = async () => {
    const url = MONITORED_SITE.url;
    const start = performance.now();

    // 1. Coba lewat backend server lokal (port 3001) jika aktif untuk akurasi tinggi & bebas CORS
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      const backendRes = await fetch(`${BACKEND_API_BASE}/ping`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (backendRes.ok) {
        const data = await backendRes.json();
        if (data && data.success && data.result) {
          const res = data.result;
          if (res.online) {
            return { status: 'ONLINE', latency: res.latency || 1, error: null };
          } else if (res.statusCode >= 500) {
            return { status: 'ERROR', latency: res.latency || 0, error: res.error || 'Server Error' };
          } else {
            return { status: 'OFFLINE', latency: 0, error: res.error || 'Host Unreachable' };
          }
        }
      }
    } catch (e) {
      // Backend lokal tidak aktif, fallback ke browser client check
    }

    // 2. Client Browser Fallback
    if (!navigator.onLine) {
      return { status: 'OFFLINE', latency: 0, error: 'Tidak Ada Koneksi Internet' };
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      // no-cors fetch allows detecting reachability
      await fetch(url, {
        mode: 'no-cors',
        cache: 'no-store',
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      const latency = Math.max(1, Math.round(performance.now() - start));
      return { status: 'ONLINE', latency, error: null };
    } catch (err) {
      if (err.name === 'AbortError') {
        return { status: 'OFFLINE', latency: 0, error: 'Connection Timeout' };
      }
      if (!navigator.onLine) {
        return { status: 'OFFLINE', latency: 0, error: 'Koneksi Terputus' };
      }
      if (err instanceof TypeError && err.message.includes('Failed to fetch')) {
        return { status: 'BLOCKED', latency: 0, error: 'CORS / Browser Policy Blocked' };
      }
      return { status: 'ERROR', latency: 0, error: err.message || 'Check Error' };
    }
  };

  // --- Format Time Helper ---
  const formatTime = (date = new Date()) => {
    const pad = (n) => String(n).padStart(2, '0');
    return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
  };

  // --- Add Log Helper (Req 13) ---
  const addLog = (type, text) => {
    const entry = {
      time: formatTime(),
      type, // 'online' | 'offline' | 'error' | 'blocked' | 'info'
      text
    };
    if (!state.logs) state.logs = [];
    state.logs.unshift(entry);
    if (state.logs.length > 50) state.logs.pop();
    saveStoredData(state);
    renderLogs();
  };

  const renderLogs = () => {
    if (!logsList) return;
    const logs = state.logs || [];
    if (logs.length === 0) {
      if (emptyLogs) emptyLogs.style.display = 'block';
      logsList.innerHTML = '<div class="empty-logs" id="emptyLogs">Belum ada aktivitas log.</div>';
      return;
    }
    if (emptyLogs) emptyLogs.style.display = 'none';
    logsList.innerHTML = '';
    logs.forEach(l => {
      const item = document.createElement('div');
      item.className = `log-item ${l.type === 'online' ? 'online' : (l.type === 'info' ? 'info' : 'offline')}`;
      
      // Clean verbose messages (Req 17, 27)
      let text = l.text || '';
      if (/berubah status menjadi ONLINE/i.test(text)) text = 'Online';
      else if (/berubah status menjadi OFFLINE/i.test(text)) text = 'Offline';
      else if (/berubah status menjadi ERROR/i.test(text)) text = 'Error';
      else if (/status tetap ONLINE/i.test(text)) text = 'Online';
      else if (/Pemeriksaan manual dijalankan/i.test(text)) text = 'Cek manual';
      else if (/Monitoring ketersediaan dimulai/i.test(text)) text = 'Monitoring aktif';

      item.innerHTML = `
        <div class="log-item-left">
          <span class="log-dot" style="background: ${l.type === 'online' ? 'var(--color-green)' : (l.type === 'info' ? 'var(--accent-color)' : 'var(--color-red)')};"></span>
          <span class="log-msg">${escapeHtml(text)}</span>
        </div>
        <span class="log-item-time">${escapeHtml(l.time)}</span>
      `;
      logsList.appendChild(item);
    });
  };

  // --- Update Single Site UI (Req 4, 5, 7, 8, 10, 11, 12) ---
  const updateStatusPill = (status) => {
    if (!monitoredStatusPill || !monitoredStatusText) return;
    const norm = (status || '').toUpperCase();
    let display = 'Online';
    if (norm === 'OFFLINE') display = 'Offline';
    else if (norm === 'ERROR') display = 'Error';
    else if (norm === 'CHECKING' || norm === 'MEMERIKSA' || norm === 'MEMERIKSA...') display = 'Memeriksa';

    monitoredStatusPill.className = `site-status-pill ${norm.toLowerCase()}`;
    monitoredStatusText.textContent = display;

    if (metricStatusVal) {
      metricStatusVal.textContent = display;
      metricStatusVal.className = `metric-value ${norm === 'ONLINE' ? 'text-green' : (norm === 'OFFLINE' ? 'text-red' : 'text-orange')}`;
    }

    if (metricStatusIcon) {
      metricStatusIcon.className = `metric-icon ${norm === 'ONLINE' ? 'green' : (norm === 'OFFLINE' ? 'red' : 'orange')}`;
    }
  };

  const updateMetrics = (lastResult = null) => {
    // 1. Latensi (Req 8)
    if (metricLatencyVal) {
      if (lastResult && lastResult.status === 'ONLINE' && lastResult.latency > 0) {
        metricLatencyVal.textContent = `${lastResult.latency} ms`;
      } else {
        metricLatencyVal.textContent = '--';
      }
    }

    // 2. Uptime (Req 10, 27)
    if (metricUptimeVal) {
      const uptime = state.uptime || { totalChecks: 0, onlineChecks: 0 };
      if (uptime.totalChecks < 2) {
        metricUptimeVal.textContent = '--';
      } else {
        const pct = ((uptime.onlineChecks / uptime.totalChecks) * 100).toFixed(1);
        metricUptimeVal.textContent = `${pct}%`;
      }
    }

    // 3. Avg Latensi (Req 11)
    if (metricAvgLatencyVal) {
      const history = state.history || [];
      const valid = history.filter(h => h.status === 'ONLINE' && h.latency > 0);
      if (valid.length === 0) {
        metricAvgLatencyVal.textContent = '--';
      } else {
        const sum = valid.reduce((acc, curr) => acc + curr.latency, 0);
        const avg = Math.round(sum / valid.length);
        metricAvgLatencyVal.textContent = `${avg} ms`;
      }
    }

    // 4. Last Check (Req 12, 13, 14, 27)
    const history = state.history || [];
    const lastCheckTime = (history.length > 0 && history[0].time) ? history[0].time : '--';
    if (metricLastCheckVal) {
      metricLastCheckVal.textContent = lastCheckTime;
    }
    if (mobileLastCheckVal) {
      mobileLastCheckVal.textContent = lastCheckTime;
    }
  };

  // --- Latency History SVG Chart (Req 9) ---
  const drawLatencyChart = () => {
    if (!latencyChartSvg) return;
    const history = (state.history || []).slice().reverse(); // Urutan kronologis dari lama ke baru
    const valid = history.filter(h => h.latency > 0);

    const svgWidth = 600;
    const svgHeight = 220;
    const padLeft = 46;
    const padRight = 20;
    const padTop = 20;
    const padBottom = 34;

    const plotW = svgWidth - padLeft - padRight;
    const plotH = svgHeight - padTop - padBottom;

    if (history.length === 0) {
      if (chartMinMaxLabel) chartMinMaxLabel.textContent = 'Min: -- · Max: --';
      latencyChartSvg.innerHTML = `
        <text x="${svgWidth / 2}" y="${svgHeight / 2}" text-anchor="middle" fill="var(--text-secondary)" font-size="13" font-family="inherit">
          Belum ada riwayat latensi. Menunggu monitoring...
        </text>
      `;
      return;
    }

    const minLatency = valid.length > 0 ? Math.min(...valid.map(v => v.latency)) : 50;
    const maxLatency = valid.length > 0 ? Math.max(...valid.map(v => v.latency)) : 200;
    const range = Math.max(maxLatency - minLatency, 20);

    if (chartMinMaxLabel) {
      chartMinMaxLabel.textContent = valid.length > 0
        ? `Min: ${minLatency} ms · Max: ${maxLatency} ms · Terakhir: ${history[history.length - 1].latency || '--'} ms`
        : 'Min: -- · Max: --';
    }

    // Grid lines
    let gridSvg = '';
    const gridSteps = 4;
    for (let i = 0; i <= gridSteps; i++) {
      const yVal = padTop + (plotH / gridSteps) * i;
      const latVal = Math.round(maxLatency - (range / gridSteps) * i);
      gridSvg += `
        <line x1="${padLeft}" y1="${yVal}" x2="${svgWidth - padRight}" y2="${yVal}" stroke="var(--border-color)" stroke-width="1" stroke-dasharray="3 3"/>
        <text x="${padLeft - 8}" y="${yVal + 4}" text-anchor="end" fill="var(--text-tertiary)" font-size="10" font-family="inherit">${latVal}ms</text>
      `;
    }

    // Calculate Coordinates
    const points = history.map((item, idx) => {
      const x = padLeft + (idx / Math.max(history.length - 1, 1)) * plotW;
      const y = item.status === 'ONLINE' && item.latency > 0
        ? padTop + ((maxLatency - item.latency) / range) * plotH
        : svgHeight - padBottom;
      return { x, y, item, idx };
    });

    // Area & Line Path
    let linePathD = `M ${points[0].x} ${points[0].y}`;
    points.slice(1).forEach(pt => {
      linePathD += ` L ${pt.x} ${pt.y}`;
    });

    const areaPathD = `${linePathD} L ${points[points.length - 1].x} ${svgHeight - padBottom} L ${points[0].x} ${svgHeight - padBottom} Z`;

    // Dots & Hover Interactivity
    let dotsSvg = '';
    points.forEach(pt => {
      const isOnline = pt.item.status === 'ONLINE' && pt.item.latency > 0;
      const color = isOnline ? 'var(--accent-color)' : 'var(--color-red)';
      dotsSvg += `
        <circle cx="${pt.x}" cy="${pt.y}" r="4" fill="${color}" stroke="var(--bg-secondary)" stroke-width="2" class="chart-point" data-idx="${pt.idx}" style="cursor: pointer; transition: r 0.15s ease;"/>
      `;
    });

    latencyChartSvg.innerHTML = `
      <defs>
        <linearGradient id="latencyAreaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="var(--accent-color)" stop-opacity="0.28"/>
          <stop offset="100%" stop-color="var(--accent-color)" stop-opacity="0.0"/>
        </linearGradient>
      </defs>
      ${gridSvg}
      <path d="${areaPathD}" fill="url(#latencyAreaGrad)"/>
      <path d="${linePathD}" fill="none" stroke="var(--accent-color)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
      ${dotsSvg}
    `;

    // Tooltip listeners on chart points
    const pointElements = latencyChartSvg.querySelectorAll('.chart-point');
    pointElements.forEach(el => {
      el.addEventListener('mouseenter', (e) => {
        const idx = parseInt(el.getAttribute('data-idx'));
        const pt = points[idx];
        if (!pt || !chartTooltip) return;
        el.setAttribute('r', '6');
        chartTooltip.style.display = 'block';
        chartTooltip.innerHTML = `
          <div><strong>${pt.item.time}</strong></div>
          <div>Status: <span class="${pt.item.status === 'ONLINE' ? 'text-green' : 'text-red'}">${pt.item.status}</span></div>
          <div>Latensi: <strong>${pt.item.latency > 0 ? pt.item.latency + ' ms' : '--'}</strong></div>
        `;
        const rect = latencyChartSvg.getBoundingClientRect();
        const svgPtX = (pt.x / svgWidth) * rect.width;
        const svgPtY = (pt.y / svgHeight) * rect.height;
        chartTooltip.style.left = `${svgPtX}px`;
        chartTooltip.style.top = `${svgPtY}px`;
      });
      el.addEventListener('mouseleave', () => {
        el.setAttribute('r', '4');
        if (chartTooltip) chartTooltip.style.display = 'none';
      });
    });
  };

  // --- Monitoring Execution Loop (Req 6, 21, 22) ---
  const executeCheck = async () => {
    if (isChecking) return;
    isChecking = true;

    if (monitoredStatusPill && monitoredStatusText) {
      monitoredStatusPill.className = 'site-status-pill checking';
      monitoredStatusText.textContent = 'MEMERIKSA...';
    }

    try {
      const result = await performCheck();
      const nowStr = formatTime();

      // Uptime calculation (Req 10)
      if (!state.uptime) state.uptime = { totalChecks: 0, onlineChecks: 0 };
      state.uptime.totalChecks += 1;
      if (result.status === 'ONLINE') {
        state.uptime.onlineChecks += 1;
      }

      // Latency history queue (Req 9)
      if (!state.history) state.history = [];
      state.history.unshift({
        time: nowStr,
        latency: result.latency,
        status: result.status
      });
      if (state.history.length > MAX_HISTORY) {
        state.history.pop();
      }

      // Status Change & Error Logging (Req 13)
      if (lastStatus && lastStatus !== result.status) {
        if (result.status === 'ONLINE') {
          addLog('online', `Website kembali ONLINE (${result.latency} ms)`);
        } else if (result.status === 'OFFLINE') {
          addLog('offline', `Website OFFLINE (${result.error || 'Host Unreachable'})`);
          playAlertSound();
        } else if (result.status === 'BLOCKED') {
          addLog('blocked', `Website BLOCKED (CORS / Policy restriction)`);
        } else {
          addLog('error', `Website ERROR (${result.error || 'Server Error'})`);
        }
      } else if (!lastStatus) {
        // Log check pertama
        if (result.status === 'ONLINE') {
          addLog('online', `Website ONLINE (${result.latency} ms)`);
        } else {
          addLog('offline', `Website status: ${result.status} (${result.error || ''})`);
        }
      }

      lastStatus = result.status;
      saveStoredData(state);

      // Realtime UI updates (Req 22)
      updateStatusPill(result.status);
      updateMetrics(result);
      drawLatencyChart();
    } catch (err) {
      console.warn('executeCheck error:', err);
    } finally {
      isChecking = false;
    }
  };

  const startMonitoring = () => {
    // Single loop guarantee (Req 21)
    if (monitorTimer) {
      clearInterval(monitorTimer);
      monitorTimer = null;
    }

    addLog('info', `Monitoring aktif untuk ${MONITORED_SITE.name} (${CHECK_INTERVAL / 1000}s interval)`);
    executeCheck();
    monitorTimer = setInterval(executeCheck, CHECK_INTERVAL);
  };

  const stopMonitoring = () => {
    if (monitorTimer) {
      clearInterval(monitorTimer);
      monitorTimer = null;
    }
    addLog('info', 'Monitoring dihentikan.');
  };

  // --- Tab Navigation Controller ---
  const switchTab = (tabName) => {
    const tabs = [
      { id: 'websites', btn: tabWebsites, view: workspaceWebsites },
      { id: 'analytics', btn: tabAnalytics, view: workspaceAnalytics },
      { id: 'maintenance', btn: tabMaintenance, view: workspaceMaintenance }
    ];

    tabs.forEach(t => {
      if (t.id === tabName) {
        if (t.btn) t.btn.classList.add('active');
        if (t.view) {
          t.view.style.display = t.id === 'websites' ? 'flex' : 'grid';
          t.view.classList.add('active');
        }
      } else {
        if (t.btn) t.btn.classList.remove('active');
        if (t.view) {
          t.view.style.display = 'none';
          t.view.classList.remove('active');
        }
      }
    });

    if (tabName === 'analytics') {
      renderAnalytics();
    } else if (tabName === 'maintenance') {
      renderMaintenance();
    } else if (tabName === 'websites') {
      drawLatencyChart();
    }
  };

  // --- User Analytics Controller ---
  const toolNames = {
    id: {
      password: 'Generator Kata Sandi',
      renamer: 'Batch Renamer Pro',
      compressor: 'Kompresor Media',
      'bg-remover': 'Penghapus Latar Belakang',
      'image-to-pdf': 'Gambar ke PDF',
      'pdf-to-docs': 'PDF ke Dokumen',
      'pdf-compressor': 'Kompresor PDF',
      'video-to-uhd': 'Peningkat Video UHD',
      'watermark-remover': 'Hapus Watermark Video',
      'qr-code-master': 'Master Kode QR',
      'ai-workflow-assistant': 'Asisten Alur Kerja AI',
      'metadata-cleaner': 'Penghapus Metadata'
    }
  };

  const renderAnalytics = () => {
    let analyticsData = null;
    try {
      const raw = localStorage.getItem('toolsuf_analytics');
      if (raw) analyticsData = JSON.parse(raw);
    } catch (e) {}

    const counts = (analyticsData && analyticsData.launchCount) || {};
    const historyList = (analyticsData && analyticsData.history) || [];

    const totalLaunches = Object.values(counts).reduce((acc, curr) => acc + curr, 0);

    let popularToolKey = '-';
    let maxLaunchCount = 0;
    Object.entries(counts).forEach(([key, val]) => {
      if (val > maxLaunchCount) {
        maxLaunchCount = val;
        popularToolKey = key;
      }
    });

    const popularToolName = popularToolKey !== '-' ? (toolNames.id[popularToolKey] || popularToolKey) : '-';
    const popularDisplay = popularToolKey !== '-' ? `${popularToolName} (${maxLaunchCount}x)` : '-';

    let lastActiveTool = '-';
    if (historyList.length > 0) {
      const lastToolKey = historyList[0].tool;
      const lastName = toolNames.id[lastToolKey] || lastToolKey;
      const lastTime = new Date(historyList[0].time).toLocaleTimeString();
      lastActiveTool = `${lastName} @ ${lastTime}`;
    }

    if (metricTotalLaunchesVal) metricTotalLaunchesVal.textContent = totalLaunches;
    if (metricPopularToolVal) {
      metricPopularToolVal.textContent = popularDisplay;
      metricPopularToolVal.title = popularDisplay;
    }
    if (metricLastActiveToolVal) {
      metricLastActiveToolVal.textContent = lastActiveTool;
      metricLastActiveToolVal.title = lastActiveTool;
    }

    // Render Clean Tool Usage List (Section L)
    if (toolUsageList) {
      const toolsKeys = Object.keys(toolNames.id);
      const sortedTools = toolsKeys.map(key => ({
        key,
        name: toolNames.id[key] || key,
        count: counts[key] || 0
      })).sort((a, b) => b.count - a.count);

      toolUsageList.innerHTML = sortedTools.map(item => `
        <div class="tool-usage-row">
          <div class="tool-usage-row-left">
            <span class="tool-usage-name">${escapeHtml(item.name)}</span>
          </div>
          <span class="tool-usage-badge">${item.count}</span>
        </div>
      `).join('');
    }

    // Render Compact Analytics Logs (Section M)
    if (analyticsLogsList) {
      if (historyList.length === 0) {
        analyticsLogsList.innerHTML = '<div class="empty-logs" id="emptyAnalyticsLogs">Belum ada aktivitas alat.</div>';
      } else {
        analyticsLogsList.innerHTML = historyList.map(item => {
          const name = toolNames.id[item.tool] || item.tool;
          const d = new Date(item.time);
          const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          return `
            <div class="analytics-log-row">
              <div class="analytics-log-info">
                <span class="analytics-log-title">${escapeHtml(name)}</span>
                <span class="analytics-log-desc">Berhasil dibuka</span>
              </div>
              <span class="analytics-log-time">${timeStr}</span>
            </div>
          `;
        }).join('');
      }
    }

    drawAnalyticsChart(counts);
  };

  const drawAnalyticsChart = (counts) => {
    const canvas = usageChartCanvas;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const container = canvas.parentElement;

    const width = container.clientWidth - 48;
    const height = Math.max(container.clientHeight - 48, 380);

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    const isDark = document.body.classList.contains('dark-theme');
    const toolsKeys = Object.keys(toolNames.id);
    const maxCount = Math.max(...Object.values(counts), 1);

    const rowHeight = height / toolsKeys.length;
    const barHeight = rowHeight * 0.55;
    const labelWidth = width < 480 ? 110 : 170;
    const maxBarWidth = width - labelWidth - 30;

    toolsKeys.forEach((key, idx) => {
      const count = counts[key] || 0;
      const name = toolNames.id[key] || key;
      const y = idx * rowHeight + (rowHeight - barHeight) / 2;

      ctx.fillStyle = isDark ? '#FCFCFD' : '#1C1C1E';
      ctx.font = '500 ' + (width < 480 ? '10px' : '12px') + ' -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';

      let displayName = name;
      const maxTextW = labelWidth - 10;
      if (ctx.measureText(displayName).width > maxTextW) {
        while (displayName.length > 0 && ctx.measureText(displayName + '...').width > maxTextW) {
          displayName = displayName.slice(0, -1);
        }
        displayName += '...';
      }
      ctx.fillText(displayName, 0, y + barHeight / 2);

      const barX = labelWidth;
      const barW = (count / maxCount) * maxBarWidth;

      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(barX, y, maxBarWidth, barHeight, 4);
      else ctx.rect(barX, y, maxBarWidth, barHeight);
      ctx.fillStyle = isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.03)';
      ctx.fill();

      if (count > 0) {
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(barX, y, barW, barHeight, 4);
        else ctx.rect(barX, y, barW, barHeight);
        const grad = ctx.createLinearGradient(barX, y, barX + barW, y);
        grad.addColorStop(0, '#007AFF');
        grad.addColorStop(1, '#8E5AFF');
        ctx.fillStyle = grad;
        ctx.fill();

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
        ctx.fillStyle = 'var(--text-secondary)';
        ctx.font = '500 10px -apple-system, BlinkMacSystemFont, sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText('0', barX + 6, y + barHeight / 2);
      }
    });
  };

  // --- Feature Maintenance Controller (Req: web-monitor removed) ---
  const FEATURE_ICONS = {
    'password': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>',
    'renamer': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>',
    'compressor': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="4 14 10 14 10 20"></polyline><polyline points="20 10 14 10 14 4"></polyline><line x1="14" y1="10" x2="21" y2="3"></line><line x1="3" y1="21" x2="10" y2="14"></line></svg>',
    'bg-remover': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="6" cy="6" r="3"></circle><circle cx="6" cy="18" r="3"></circle><line x1="20" y1="4" x2="8.12" y2="15.88"></line><line x1="14.47" y1="14.48" x2="20" y2="20"></line><line x1="8.12" y1="8.12" x2="12" y2="12"></line></svg>',
    'image-to-pdf': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>',
    'pdf-to-docs': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>',
    'pdf-compressor': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><polyline points="12 18 12 12"></polyline><polyline points="9 15 12 18 15 15"></polyline></svg>',
    'video-to-uhd': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"></rect><line x1="7" y1="2" x2="7" y2="22"></line><line x1="17" y1="2" x2="17" y2="22"></line><line x1="2" y1="12" x2="22" y2="12"></line><line x1="2" y1="7" x2="7" y2="7"></line><line x1="2" y1="17" x2="7" y2="17"></line><line x1="17" y1="17" x2="22" y2="17"></line><line x1="17" y1="7" x2="22" y2="7"></line></svg>',
    'watermark-remover': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"></path></svg>',
    'qr-code-master': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>',
    'ai-workflow-assistant': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"></path></svg>',
    'metadata-cleaner': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><circle cx="12" cy="14" r="3"></circle><line x1="12" y1="14" x2="12.01" y2="14"></line></svg>'
  };

  const notifyMaintenanceChange = () => {
    window.dispatchEvent(new Event('toolsuf-maintenance-changed'));
    try {
      if (window.parent && window.parent !== window) {
        window.parent.dispatchEvent(new Event('toolsuf-maintenance-changed'));
      }
    } catch (e) {}
  };

  const renderMaintenance = () => {
    if (!maintenanceGrid) return;
    if (typeof ToolSufMaintenance === 'undefined') {
      maintenanceGrid.innerHTML = '<div class="empty-state" style="grid-column: 1 / -1;"><p>Modul pemeliharaan tidak ditemukan.</p></div>';
      return;
    }

    const config = ToolSufMaintenance.getConfig();
    const isGlobal = !!config.global;
    if (globalMaintenanceSwitch) {
      globalMaintenanceSwitch.checked = isGlobal;
    }

    const features = config.features || {};
    // Pastikan web-monitor tidak pernah ada di UI fitur pemeliharaan
    delete features['web-monitor'];
    const featureIds = Object.keys(features).filter(id => id !== 'web-monitor');
    const searchQuery = (maintenanceSearchInput ? maintenanceSearchInput.value : '').toLowerCase().trim();

    let totalCount = featureIds.length;
    let mntCount = 0;

    featureIds.forEach(id => {
      if (features[id].enabled || isGlobal) mntCount++;
    });

    const activeCount = isGlobal ? 0 : (totalCount - mntCount);

    if (metricTotalFeaturesVal) metricTotalFeaturesVal.textContent = totalCount;
    if (metricActiveFeaturesVal) metricActiveFeaturesVal.textContent = activeCount;
    if (metricMaintenanceFeaturesVal) metricMaintenanceFeaturesVal.textContent = isGlobal ? totalCount : mntCount;
    if (metricGlobalStatusVal) {
      metricGlobalStatusVal.textContent = isGlobal ? 'AKTIF' : 'Non-aktif';
      metricGlobalStatusVal.className = 'metric-value ' + (isGlobal ? 'text-red' : 'text-green');
    }

    const filteredIds = featureIds.filter(id => {
      if (!searchQuery) return true;
      const feat = features[id];
      const name = (feat.name || id).toLowerCase();
      return name.includes(searchQuery) || id.toLowerCase().includes(searchQuery);
    });

    maintenanceGrid.innerHTML = '';

    if (filteredIds.length === 0) {
      maintenanceGrid.innerHTML = '<div class="empty-state" style="grid-column: 1 / -1;"><p>Tidak ada alat yang cocok dengan pencarian.</p></div>';
      return;
    }

    filteredIds.forEach(id => {
      const feat = features[id];
      const isFeatureMnt = isGlobal || !!feat.enabled;
      const card = document.createElement('div');
      card.className = 'maintenance-card' + (isFeatureMnt ? ' is-maintenance' : '');
      card.id = `mnt-card-${id}`;

      const iconSvg = FEATURE_ICONS[id] || '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/></svg>';

      card.innerHTML = `
        <div class="maintenance-card-top">
          <div class="maintenance-card-icon">
            ${iconSvg}
          </div>
          <span class="maintenance-card-badge ${isFeatureMnt ? 'maintenance' : 'normal'}">
            ${isFeatureMnt ? 'Maintenance' : 'Aktif'}
          </span>
        </div>
        <div class="maintenance-card-content">
          <div class="maintenance-card-title" title="${feat.name || id}">${feat.name || id}</div>
          <div class="maintenance-card-id">${id}</div>
        </div>
        <div class="maintenance-card-actions">
          <button type="button" class="maintenance-msg-btn" title="Kustomisasi Pesan">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
            <span>Pesan</span>
          </button>
          <label class="apple-switch" title="Toggle Maintenance" aria-label="Toggle Maintenance ${feat.name || id}">
            <input type="checkbox" class="feature-mnt-toggle" ${isFeatureMnt ? 'checked' : ''} ${isGlobal ? 'disabled' : ''}>
            <span class="apple-switch-slider"></span>
          </label>
        </div>
      `;

      const toggleInput = card.querySelector('.feature-mnt-toggle');
      toggleInput.addEventListener('change', () => {
        const checked = toggleInput.checked;
        ToolSufMaintenance.setFeatureMaintenance(id, checked);
        notifyMaintenanceChange();
        showToast('Status maintenance berhasil diubah!');
        renderMaintenance();
      });

      const msgBtn = card.querySelector('.maintenance-msg-btn');
      msgBtn.addEventListener('click', () => {
        openMaintenanceMsgModal(id);
      });

      maintenanceGrid.appendChild(card);
    });
  };

  const openMaintenanceMsgModal = (featureId) => {
    if (!maintenanceMsgModal || typeof ToolSufMaintenance === 'undefined') return;
    const config = ToolSufMaintenance.getConfig();
    const feat = (config.features && config.features[featureId]) || {};
    if (editMaintenanceFeatureId) editMaintenanceFeatureId.value = featureId;
    if (maintenanceFeatureNameDisplay) maintenanceFeatureNameDisplay.value = feat.name || featureId;
    if (maintenanceCustomMsgInput) maintenanceCustomMsgInput.value = feat.message || '';
    maintenanceMsgModal.classList.add('active');
  };

  const closeMaintenanceMsgModal = () => {
    if (maintenanceMsgModal) maintenanceMsgModal.classList.remove('active');
  };

  // --- Backend Email Handlers ---
  const handleTestEmail = async () => {
    if (!testEmailBtn) return;
    testEmailBtn.disabled = true;
    showToast('Mengirim email test laporan...');

    try {
      const res = await fetch(`${BACKEND_API_BASE}/test-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(`Email test berhasil dikirim ke ${data.recipient || 'email Anda'}!`);
      } else {
        showToast(`Gagal kirim email: ${data.error || 'Terjadi kesalahan SMTP'}`);
      }
    } catch (err) {
      showToast('Gagal terhubung ke server email backend (Port 3001)');
    } finally {
      testEmailBtn.disabled = false;
    }
  };

  // =============================================================================
  // DETEKSI PERANGKAT LENGKAP & SESSION TRACKER (iPhone, iPad, Android, Windows, Mac)
  // =============================================================================
  let mySessionId = sessionStorage.getItem('toolsuf_monitor_session_id');
  if (!mySessionId) {
    mySessionId = 'sess-' + Math.random().toString(36).substring(2, 9) + '-' + Date.now().toString(36);
    sessionStorage.setItem('toolsuf_monitor_session_id', mySessionId);
  }

  let heartbeatInterval = null;
  let cachedDeviceList = [];

  const escapeHtml = (str) => {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  };

  const detectBrowser = (ua) => {
    // 1. Browser di iOS
    if (/CriOS\/(\d+(\.\d+)?)/i.test(ua)) return 'Chrome';
    if (/FxiOS\/(\d+(\.\d+)?)/i.test(ua)) return 'Firefox';
    if (/EdgiOS\/(\d+(\.\d+)?)/i.test(ua)) return 'Edge';
    if (/OPiOS\/(\d+(\.\d+)?)/i.test(ua)) return 'Opera';

    // 2. Browser Modern Umum
    if (/EdgA?\/(\d+(\.\d+)?)/i.test(ua)) return 'Edge';
    if (/SamsungBrowser\/(\d+(\.\d+)?)/i.test(ua)) return 'Samsung Internet';
    if (/OPR\/(\d+(\.\d+)?)|Opera/i.test(ua)) return 'Opera';
    if (/Chrome\/(\d+(\.\d+)?)/i.test(ua)) return 'Chrome';
    if (/Firefox\/(\d+(\.\d+)?)/i.test(ua)) return 'Firefox';
    if (/Version\/(\d+(\.\d+)?).*Safari/i.test(ua) || /Safari/i.test(ua)) return 'Safari';

    return 'Browser';
  };

  const detectDetailedDevice = () => {
    const ua = navigator.userAgent || '';
    const platform = (navigator.userAgentData && navigator.userAgentData.platform) || navigator.platform || '';
    const maxTouchPoints = navigator.maxTouchPoints || 0;
    const hasTouch = 'ontouchstart' in window || maxTouchPoints > 0;

    let device = 'Unknown Device';
    let os = 'Unknown';
    let type = 'desktop';

    // 1. DETEKSI iPhone (WAJIB PERTAMA)
    if (/iPhone|iPod/i.test(ua) || /iPhone|iPod/i.test(platform)) {
      device = 'iPhone';
      os = 'iOS';
      type = 'mobile';
    }
    // 2. DETEKSI iPad (Termasuk iPadOS 13+ yang menggunakan Desktop-Class Safari)
    // Safari di iPad mengirimkan 'Macintosh'/'MacIntel' tetapi memiliki multi-touch (maxTouchPoints > 1)
    else if (/iPad/i.test(ua) || ((/Macintosh/i.test(ua) || /MacIntel/i.test(platform)) && maxTouchPoints > 1)) {
      device = 'iPad';
      os = 'iPadOS';
      type = 'tablet';
    }
    // 3. DETEKSI Android (Phone vs Tablet)
    else if (/Android/i.test(ua)) {
      os = 'Android';
      if (/Mobile/i.test(ua)) {
        device = 'Android Phone';
        type = 'mobile';
      } else {
        device = 'Android Tablet';
        type = 'tablet';
      }
    }
    // 4. DETEKSI Windows
    else if (/Windows NT|Windows/i.test(ua)) {
      device = (hasTouch && /Touch/i.test(ua)) ? 'Windows Laptop' : 'Windows PC';
      if (/Windows NT 10\.0/i.test(ua)) os = 'Windows 11';
      else if (/Windows NT 6\.3/i.test(ua)) os = 'Windows 8.1';
      else if (/Windows NT 6\.2/i.test(ua)) os = 'Windows 8';
      else if (/Windows NT 6\.1/i.test(ua)) os = 'Windows 7';
      else os = 'Windows';
      type = 'desktop';
    }
    // 5. DETEKSI macOS (Pasti bukan iPad karena iPad sudah ditangani di langkah 2)
    else if (/Macintosh|Mac OS X/i.test(ua) || /MacIntel/i.test(platform)) {
      device = 'MacBook';
      os = 'macOS';
      type = 'laptop';
    }
    // 6. DETEKSI Linux
    else if (/Linux|X11/i.test(ua)) {
      device = 'Linux';
      os = 'Linux';
      type = 'desktop';
    }
    // 7. Unknown Fallback
    else {
      device = 'Unknown Device';
      os = 'Unknown';
      type = 'desktop';
    }

    const browser = detectBrowser(ua);
    return { device, os, browser, type };
  };

  const getDeviceIconSvg = (type, device) => {
    // Smartphone SVG
    if (type === 'mobile' || /iPhone|Android Phone/i.test(device)) {
      return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect>
        <line x1="12" y1="18" x2="12.01" y2="18"></line>
      </svg>`;
    }
    // Tablet SVG
    if (type === 'tablet' || /iPad|Android Tablet/i.test(device)) {
      return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect>
        <line x1="12" y1="18" x2="12.01" y2="18"></line>
      </svg>`;
    }
    // Laptop SVG
    if (type === 'laptop' || /MacBook|Laptop/i.test(device)) {
      return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
        <line x1="2" y1="20" x2="22" y2="20"></line>
      </svg>`;
    }
    // Desktop / Monitor SVG
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
      <line x1="8" y1="21" x2="16" y2="21"></line>
      <line x1="12" y1="17" x2="12" y2="21"></line>
    </svg>`;
  };

  const resolvePublicIp = async () => {
    if (cachedPublicIp) return cachedPublicIp;
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 2500);
      const res = await fetch('https://api.ipify.org?format=json', { signal: controller.signal });
      clearTimeout(timeout);
      if (res.ok) {
        const data = await res.json();
        if (data && data.ip) {
          cachedPublicIp = data.ip;
          sessionStorage.setItem('toolsuf_monitor_public_ip', cachedPublicIp);
          return cachedPublicIp;
        }
      }
    } catch (e) {}
    return '127.0.0.1 (Local)';
  };

  const formatRelativeActiveTime = (isoString) => {
    if (!isoString) return 'Aktif sekarang';
    const diffMs = Math.max(0, Date.now() - new Date(isoString).getTime());
    if (diffMs < 45000) return 'Aktif sekarang';
    if (diffMs < 90000) return `Aktif ${Math.round(diffMs / 1000)} detik lalu`;
    if (diffMs < 3600000) return `Aktif ${Math.floor(diffMs / 60000)} menit lalu`;
    return `Aktif ${Math.floor(diffMs / 3600000)} jam lalu`;
  };

  // --- Bottom Sheet Helpers (Req 18, 19) ---
  const openDeviceBottomSheet = () => {
    if (!deviceBottomSheet) return;
    deviceBottomSheet.style.display = 'flex';
    requestAnimationFrame(() => {
      deviceBottomSheet.classList.add('active');
    });
  };

  const closeDeviceBottomSheet = () => {
    if (!deviceBottomSheet) return;
    deviceBottomSheet.classList.remove('active');
    setTimeout(() => {
      deviceBottomSheet.style.display = 'none';
    }, 280);
  };

  // --- Apple Native ⋯ Dropdown Menu Controllers (Sections A, B, C, T, U) ---
  const openAppleMenu = () => {
    if (!appleMoreMenu) return;
    updateMuteUi();
    if (menuItemThemeBadge) {
      menuItemThemeBadge.textContent = state.theme === 'light' ? 'Terang' : 'Gelap';
    }
    appleMoreMenu.style.display = 'block';
    requestAnimationFrame(() => {
      appleMoreMenu.classList.add('show');
    });
    if (moreActionsBtn) {
      moreActionsBtn.setAttribute('aria-expanded', 'true');
    }
  };

  const closeAppleMenu = () => {
    if (!appleMoreMenu) return;
    appleMoreMenu.classList.remove('show');
    if (moreActionsBtn) {
      moreActionsBtn.setAttribute('aria-expanded', 'false');
    }
    setTimeout(() => {
      if (!appleMoreMenu.classList.contains('show')) {
        appleMoreMenu.style.display = 'none';
      }
    }, 190);
  };

  const toggleAppleMenu = () => {
    if (!appleMoreMenu) return;
    if (appleMoreMenu.classList.contains('show')) {
      closeAppleMenu();
    } else {
      closeDeviceBottomSheet();
      if (devicePopover) devicePopover.style.display = 'none';
      openAppleMenu();
    }
  };

  const renderConnectedDevices = (devices = []) => {
    cachedDeviceList = devices;
    const count = devices.length || 1;
    const countText = `${count} Aktif`;

    if (headerDeviceBadge) headerDeviceBadge.textContent = count;
    if (popoverCounterBadge) popoverCounterBadge.textContent = countText;
    if (activeDevicesCountBadge) activeDevicesCountBadge.textContent = countText;
    if (mobileSheetActiveCount) mobileSheetActiveCount.textContent = countText;

    const renderCard = (dev) => {
      const isCurrent = dev.sessionId === mySessionId;
      const iconSvg = getDeviceIconSvg(dev.type, dev.device);
      const timeText = formatRelativeActiveTime(dev.lastSeen);
      const isNow = timeText === 'Aktif sekarang';

      return `
        <div class="device-session-card ${isCurrent ? 'current-device' : ''}">
          <div class="device-card-icon-box" title="${escapeHtml(dev.type)}">
            ${iconSvg}
          </div>
          <div class="device-card-info">
            <div class="device-card-title-row">
              <span class="device-card-name">${escapeHtml(dev.device)}</span>
              ${isCurrent ? '<span class="this-device-tag">Perangkat ini</span>' : ''}
            </div>
            <div class="device-card-meta">${escapeHtml(dev.browser)} · ${escapeHtml(dev.os)}</div>
            <div class="device-card-ip">IP: ${escapeHtml(dev.ip || '127.0.0.1')}</div>
            <div class="device-card-status ${isNow ? '' : 'idle'}">
              <span class="device-status-dot ${isNow ? 'active-now' : ''}"></span>
              <span class="device-status-text">${timeText}</span>
            </div>
          </div>
        </div>
      `;
    };

    const cardsHtml = devices.map(renderCard).join('');

    // Desktop popover list
    if (deviceSessionsListPopover) {
      deviceSessionsListPopover.innerHTML = cardsHtml || '<div class="empty-logs">Tidak ada perangkat aktif.</div>';
    }

    // Mobile Bottom Sheet list
    if (mobileSheetDevicesList) {
      mobileSheetDevicesList.innerHTML = cardsHtml || '<div class="empty-logs">Tidak ada perangkat aktif.</div>';
    }

    // Connected devices section on dashboard
    if (connectedDevicesList) {
      const isMobileView = window.innerWidth < 768;
      if (isMobileView && devices.length > 3) {
        // Show first 3 and "Lihat semua (N) →"
        const first3 = devices.slice(0, 3).map(renderCard).join('');
        connectedDevicesList.innerHTML = `
          ${first3}
          <button type="button" class="device-see-all-btn" id="seeAllDevicesBtn">
            Lihat semua (${devices.length} perangkat) →
          </button>
        `;
        const seeAllBtn = document.getElementById('seeAllDevicesBtn');
        if (seeAllBtn) {
          seeAllBtn.addEventListener('click', openDeviceBottomSheet);
        }
      } else {
        connectedDevicesList.innerHTML = cardsHtml || '<div class="empty-logs">Tidak ada perangkat aktif.</div>';
      }
    }
  };

  const sendDeviceHeartbeat = async () => {
    const info = detectDetailedDevice();
    const ip = await resolvePublicIp();
    const payload = {
      sessionId: mySessionId,
      device: info.device,
      os: info.os,
      browser: info.browser,
      type: info.type,
      screen: `${window.screen.width}x${window.screen.height}`,
      ip: ip
    };

    try {
      const res = await fetch(`${BACKEND_API_BASE}/device-heartbeat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const data = await res.json();
        if (data.devices) {
          renderConnectedDevices(data.devices);
          return;
        }
      }
    } catch (e) {
      // Backend offline fallback
    }

    // Standalone fallback: render perangkat saat ini
    renderConnectedDevices([{
      sessionId: mySessionId,
      device: info.device,
      os: info.os,
      browser: info.browser,
      type: info.type,
      ip: ip,
      lastSeen: new Date().toISOString()
    }]);
  };

  const startDeviceTracker = () => {
    sendDeviceHeartbeat();
    if (heartbeatInterval) clearInterval(heartbeatInterval);
    heartbeatInterval = setInterval(sendDeviceHeartbeat, 15000); // Heartbeat setiap 15 detik
  };

  const stopDeviceTracker = () => {
    if (heartbeatInterval) {
      clearInterval(heartbeatInterval);
      heartbeatInterval = null;
    }
    try {
      if (navigator.sendBeacon) {
        navigator.sendBeacon(`${BACKEND_API_BASE}/device-disconnect`, JSON.stringify({ sessionId: mySessionId }));
      }
    } catch (e) {}
  };

  // --- Logout Controller (Req 20) ---
  const handleLogout = () => {
    stopMonitoring();
    stopDeviceTracker();
    setSessionAuthenticated(false);
    if (loginForm) loginForm.reset();
    if (loginAlert) loginAlert.classList.add('hidden');
    showLoginView();
    showToast('Berhasil keluar.');
  };

  // --- View Display Switches ---
  const showLoginView = () => {
    if (loginView) loginView.style.display = 'flex';
    if (dashboardView) dashboardView.style.display = 'none';
  };

  const showDashboardView = () => {
    if (loginView) loginView.style.display = 'none';
    if (dashboardView) dashboardView.style.display = 'block';
    initDashboard();
  };

  // --- Initialize Dashboard View ---
  const initDashboard = () => {
    if (!isAuthenticated()) {
      showLoginView();
      return;
    }

    // Set Monitored Site Target Info (Req 10: show hostname)
    if (monitoredSiteName) monitoredSiteName.textContent = MONITORED_SITE.name;
    if (monitoredSiteUrl) monitoredSiteUrl.href = MONITORED_SITE.url;
    if (monitoredSiteUrlText) {
      try {
        const u = new URL(MONITORED_SITE.url);
        monitoredSiteUrlText.textContent = u.hostname || MONITORED_SITE.url;
      } catch (e) {
        monitoredSiteUrlText.textContent = MONITORED_SITE.url;
      }
    }

    // Apply saved theme & audio mute settings
    applyTheme(state.theme || 'dark');
    updateMuteUi();

    // Render Initial UI State
    updateMetrics();
    renderLogs();
    drawLatencyChart();

    // Start Real Device Tracking & Session Heartbeat (Req 11)
    startDeviceTracker();

    // Kirim notifikasi email penggunaan Web Monitor
    notifyWebMonitorUsage();

    // Setup Listeners
    if (!isDashboardInitialized) {
      setupDashboardEventListeners();
      isDashboardInitialized = true;
    }

    // Start Single Monitoring Engine (Req 20)
    startMonitoring();
  };

  const notifyWebMonitorUsage = async () => {
    try {
      const info = detectDetailedDevice();
      const ip = await resolvePublicIp();

      let analyticsData = {};
      try {
        const raw = localStorage.getItem('toolsuf_analytics');
        if (raw) analyticsData = JSON.parse(raw);
      } catch (e) {}

      const launchCount = analyticsData.launchCount || {};
      launchCount['web-monitor'] = (launchCount['web-monitor'] || 0) + 1;

      const usedTools = Object.keys(launchCount).map(k => ({
        key: k,
        name: k === 'web-monitor' ? 'Web Monitor (Pemantau Situs Web)' : k,
        count: launchCount[k]
      }));

      fetch(`${BACKEND_API_BASE}/notify-tool-usage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: mySessionId,
          toolKey: 'web-monitor',
          toolName: 'Web Monitor (Pemantau Situs Web)',
          device: info.device,
          os: info.os,
          browser: info.browser,
          type: info.type,
          ip: ip,
          usedTools
        })
      }).catch(() => {});
    } catch (e) {}
  };

  // --- Setup Dashboard Event Listeners ---
  const setupDashboardEventListeners = () => {
    // Manual Check Button
    if (manualCheckBtn) {
      manualCheckBtn.addEventListener('click', () => {
        executeCheck();
        showToast('Memeriksa status website...');
      });
    }

    // Device Info Button (Desktop Popover vs Mobile Bottom Sheet - Req 4, 18, 19)
    if (deviceInfoBtn) {
      deviceInfoBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (window.innerWidth < 768) {
          sendDeviceHeartbeat();
          openDeviceBottomSheet();
        } else if (devicePopover) {
          const isOpen = devicePopover.style.display === 'block';
          if (!isOpen) {
            sendDeviceHeartbeat();
            devicePopover.style.display = 'block';
          } else {
            devicePopover.style.display = 'none';
          }
        }
      });

      document.addEventListener('click', (e) => {
        if (devicePopover && devicePopoverWrapper && !devicePopoverWrapper.contains(e.target)) {
          devicePopover.style.display = 'none';
        }
      });
    }

    if (closeDeviceSheetBtn) {
      closeDeviceSheetBtn.addEventListener('click', closeDeviceBottomSheet);
    }

    if (deviceBottomSheet) {
      deviceBottomSheet.addEventListener('click', (e) => {
        if (e.target === deviceBottomSheet) closeDeviceBottomSheet();
      });
    }

    // Apple ⋯ Dropdown Menu Toggle (Sections A, B, C, T, U)
    if (moreActionsBtn) {
      moreActionsBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleAppleMenu();
      });
    }

    // Dismiss Apple Menu on outside click (Section U)
    document.addEventListener('click', (e) => {
      if (appleMoreMenu && moreMenuWrapper && !moreMenuWrapper.contains(e.target)) {
        closeAppleMenu();
      }
    });

    // Dismiss Apple Menu and Bottom Sheet on Escape key (Section B)
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeAppleMenu();
        closeDeviceBottomSheet();
        if (devicePopover) devicePopover.style.display = 'none';
      }
    });

    // Menu Item Actions (Section C)
    if (menuItemDevices) {
      menuItemDevices.addEventListener('click', () => {
        closeAppleMenu();
        sendDeviceHeartbeat();
        openDeviceBottomSheet();
      });
    }

    if (menuItemNotifications) {
      menuItemNotifications.addEventListener('click', () => {
        closeAppleMenu();
        handleTestEmail();
      });
    }

    if (menuItemSound) {
      menuItemSound.addEventListener('click', () => {
        state.muted = !state.muted;
        saveStoredData(state);
        updateMuteUi();
        showToast(state.muted ? 'Alarm suara dimatikan' : 'Alarm suara diaktifkan');
      });
    }

    if (menuItemTheme) {
      menuItemTheme.addEventListener('click', () => {
        const nextTheme = state.theme === 'light' ? 'dark' : 'light';
        applyTheme(nextTheme);
        showToast(nextTheme === 'light' ? 'Mode Terang diaktifkan' : 'Mode Gelap diaktifkan');
        drawLatencyChart();
        if (workspaceAnalytics && workspaceAnalytics.classList.contains('active')) {
          renderAnalytics();
        }
      });
    }

    if (menuItemLogout) {
      menuItemLogout.addEventListener('click', () => {
        closeAppleMenu();
        handleLogout();
      });
    }

    // Maintenance Guide Accordion Toggle on Mobile (Section Q)
    if (guideAccordionToggle) {
      // Initialize collapsed on mobile
      if (window.innerWidth < 768 && guideAccordionContent) {
        guideAccordionContent.classList.add('collapsed');
        if (accordionChevron) accordionChevron.classList.remove('expanded');
        guideAccordionToggle.setAttribute('aria-expanded', 'false');
      }

      guideAccordionToggle.addEventListener('click', () => {
        if (guideAccordionContent && accordionChevron) {
          const isCollapsed = guideAccordionContent.classList.contains('collapsed');
          if (isCollapsed) {
            guideAccordionContent.classList.remove('collapsed');
            accordionChevron.classList.add('expanded');
            guideAccordionToggle.setAttribute('aria-expanded', 'true');
          } else {
            guideAccordionContent.classList.add('collapsed');
            accordionChevron.classList.remove('expanded');
            guideAccordionToggle.setAttribute('aria-expanded', 'false');
          }
        }
      });
    }

    // Tombol Perbarui Daftar Perangkat
    if (refreshDevicesBtn) {
      refreshDevicesBtn.addEventListener('click', () => {
        sendDeviceHeartbeat();
        showToast('Daftar perangkat diperbarui!');
      });
    }

    // Kirim sinyal disconnect saat browser/tab ditutup
    window.addEventListener('beforeunload', () => {
      try {
        if (navigator.sendBeacon) {
          navigator.sendBeacon(`${BACKEND_API_BASE}/device-disconnect`, JSON.stringify({ sessionId: mySessionId }));
        }
      } catch (e) {}
    });

    // Email Test Button
    if (testEmailBtn) testEmailBtn.addEventListener('click', handleTestEmail);

    // Mute Alarm Button
    if (muteAllBtn) {
      muteAllBtn.addEventListener('click', () => {
        state.muted = !state.muted;
        saveStoredData(state);
        updateMuteUi();
        showToast(state.muted ? 'Alarm suara dimatikan' : 'Alarm suara diaktifkan');
      });
    }

    // Theme Toggle (Req 18)
    if (themeToggleBtn) {
      themeToggleBtn.addEventListener('click', () => {
        const nextTheme = state.theme === 'light' ? 'dark' : 'light';
        applyTheme(nextTheme);
        showToast(nextTheme === 'light' ? 'Mode Terang diaktifkan' : 'Mode Gelap diaktifkan');
        // Redraw canvas/svg chart for theme alignment
        drawLatencyChart();
        if (workspaceAnalytics && workspaceAnalytics.classList.contains('active')) {
          renderAnalytics();
        }
      });
    }

    // Clear Logs Button
    if (clearLogsBtn) {
      clearLogsBtn.addEventListener('click', () => {
        state.logs = [];
        saveStoredData(state);
        renderLogs();
        showToast('Log aktivitas dibersihkan!');
      });
    }

    // Tabs
    if (tabWebsites) tabWebsites.addEventListener('click', () => switchTab('websites'));
    if (tabAnalytics) tabAnalytics.addEventListener('click', () => switchTab('analytics'));
    if (tabMaintenance) tabMaintenance.addEventListener('click', () => switchTab('maintenance'));

    if (resetAnalyticsBtn) {
      resetAnalyticsBtn.addEventListener('click', () => {
        localStorage.removeItem('toolsuf_analytics');
        renderAnalytics();
        showToast('Statistik penggunaan berhasil di-reset!');
      });
    }

    // Maintenance Event Listeners
    if (globalMaintenanceSwitch) {
      globalMaintenanceSwitch.addEventListener('change', () => {
        const checked = globalMaintenanceSwitch.checked;
        if (typeof ToolSufMaintenance !== 'undefined') {
          ToolSufMaintenance.setGlobalMaintenance(checked);
          notifyMaintenanceChange();
          showToast('Mode pemeliharaan global berhasil diubah!');
          renderMaintenance();
        }
      });
    }

    if (resetAllMaintenanceBtn) {
      resetAllMaintenanceBtn.addEventListener('click', () => {
        if (typeof ToolSufMaintenance !== 'undefined') {
          ToolSufMaintenance.setGlobalMaintenance(false);
          const config = ToolSufMaintenance.getConfig();
          if (config.features) {
            Object.keys(config.features).forEach(id => {
              if (id !== 'web-monitor') {
                ToolSufMaintenance.setFeatureMaintenance(id, false);
              }
            });
          }
          notifyMaintenanceChange();
          showToast('Semua fitur berhasil diaktifkan kembali!');
          renderMaintenance();
        }
      });
    }

    if (maintenanceSearchInput) {
      maintenanceSearchInput.addEventListener('input', () => {
        renderMaintenance();
      });
    }

    if (closeMaintenanceMsgBtn) closeMaintenanceMsgBtn.addEventListener('click', closeMaintenanceMsgModal);
    if (cancelMaintenanceMsgBtn) cancelMaintenanceMsgBtn.addEventListener('click', closeMaintenanceMsgModal);

    if (maintenanceMsgModal) {
      maintenanceMsgModal.addEventListener('click', (e) => {
        if (e.target === maintenanceMsgModal) closeMaintenanceMsgModal();
      });
    }

    if (maintenanceMsgForm) {
      maintenanceMsgForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const featId = editMaintenanceFeatureId.value;
        const msg = (maintenanceCustomMsgInput.value || '').trim();
        if (featId && typeof ToolSufMaintenance !== 'undefined') {
          const config = ToolSufMaintenance.getConfig();
          const currentEnabled = config.features && config.features[featId] ? config.features[featId].enabled : false;
          ToolSufMaintenance.setFeatureMaintenance(featId, currentEnabled, msg);
          notifyMaintenanceChange();
          closeMaintenanceMsgModal();
          showToast('Pesan berhasil disimpan!');
          renderMaintenance();
        }
      });
    }

    if (resetMaintenanceMsgBtn) {
      resetMaintenanceMsgBtn.addEventListener('click', () => {
        const featId = editMaintenanceFeatureId.value;
        if (featId && typeof ToolSufMaintenance !== 'undefined') {
          const config = ToolSufMaintenance.getConfig();
          const currentEnabled = config.features && config.features[featId] ? config.features[featId].enabled : false;
          ToolSufMaintenance.setFeatureMaintenance(featId, currentEnabled, null);
          notifyMaintenanceChange();
          if (maintenanceCustomMsgInput) maintenanceCustomMsgInput.value = '';
          closeMaintenanceMsgModal();
          showToast('Pesan di-reset ke bawaan!');
          renderMaintenance();
        }
      });
    }

    // Logout
    if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);
  };

  // --- Login Form Controller ---
  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const username = (loginUsernameInput.value || '').trim();
      const password = (loginPasswordInput.value || '').trim();

      if (!username || !password) {
        if (loginAlert) {
          loginAlert.textContent = 'Harap isi nama pengguna dan kata sandi.';
          loginAlert.classList.remove('hidden');
        }
        return;
      }

      if (loginBtn) loginBtn.disabled = true;
      if (loginBtnText) loginBtnText.textContent = 'Memverifikasi...';
      if (loginBtnSpinner) loginBtnSpinner.classList.remove('hidden');

      setTimeout(() => {
        if (username === AUTH_CONFIG.username && password === AUTH_CONFIG.password) {
          setSessionAuthenticated(true);
          if (loginAlert) loginAlert.classList.add('hidden');
          showDashboardView();
        } else {
          if (loginAlert) {
            loginAlert.textContent = 'Nama pengguna atau kata sandi salah.';
            loginAlert.classList.remove('hidden');
          }
        }
        if (loginBtn) loginBtn.disabled = false;
        if (loginBtnText) loginBtnText.textContent = 'Masuk';
        if (loginBtnSpinner) loginBtnSpinner.classList.add('hidden');
      }, 350);
    });
  }

  if (togglePasswordBtn) {
    togglePasswordBtn.addEventListener('click', () => {
      const isPassword = loginPasswordInput.type === 'password';
      loginPasswordInput.type = isPassword ? 'text' : 'password';
      if (eyeIcon) eyeIcon.classList.toggle('hidden', isPassword);
      if (eyeOffIcon) eyeOffIcon.classList.toggle('hidden', !isPassword);
    });
  }

  // --- Initial Access Guard & Route Check ---
  const checkInitialAccess = () => {
    const isAuth = isAuthenticated();
    const pathname = window.location.pathname.toLowerCase();
    const isYusjulAdminRoute = pathname.includes('yusjul-admin');

    if (!isAuth && !isYusjulAdminRoute) {
      if (window.top === window.self) {
        const base = window.location.pathname.replace(/\/tools\/web-monitor.*$/, '').replace(/\/$/, '');
        window.location.replace((base || '') + '/yusjul-admin/');
        return;
      }
    }

    if (isAuth) {
      showDashboardView();
    } else {
      showLoginView();
    }
  };

  checkInitialAccess();
});
