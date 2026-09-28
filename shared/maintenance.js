/**
 * ToolSuf — Maintenance System v1.0
 * =====================================================
 * Sistem maintenance per-fitur yang terpusat.
 * Satu helper untuk seluruh tool di ToolSuf.
 *
 * Cara mengaktifkan maintenance satu fitur:
 *   Di localStorage key "toolsuf_maintenance", set:
 *   { features: { "pdf-compressor": { enabled: true } } }
 *
 * Atau gunakan Admin Panel di Web Monitor -> Feature Maintenance.
 * =====================================================
 */

(function (global) {
  'use strict';

  // ============================================================
  // DEFAULT CONFIGURATION
  // ============================================================
  var MAINTENANCE_DEFAULTS = {
    global: false,
    features: {
      'password':              { enabled: false, name: 'Password Generator',    message: null },
      'renamer':               { enabled: false, name: 'Batch Renamer Pro',     message: null },
      'compressor':            { enabled: false, name: 'Media Compressor',      message: null },
      'bg-remover':            { enabled: false, name: 'Background Remover',    message: null },
      'image-to-pdf':          { enabled: false, name: 'Image to PDF',          message: null },
      'pdf-to-docs':           { enabled: false, name: 'PDF to Docs',           message: null },
      'pdf-compressor':        { enabled: false, name: 'PDF Compressor',        message: null },
      'video-to-uhd':          { enabled: false, name: 'UHD Video Upscaler',    message: null },
      'watermark-remover':     { enabled: false, name: 'Watermark Remover',     message: null },
      'qr-code-master':        { enabled: false, name: 'QR Code Master',        message: null },
      'ai-workflow-assistant': { enabled: false, name: 'AI Workflow Assistant', message: null },
      'metadata-cleaner':      { enabled: false, name: 'Metadata Cleaner',      message: null },
      'web-monitor':           { enabled: false, name: 'Web Monitor',           message: null }
    }
  };

  var STORAGE_KEY = 'toolsuf_maintenance';
  var BROADCAST_CHANNEL_NAME = 'toolsuf_maintenance_channel';

  // URL path segment -> feature ID (termasuk alias)
  var PATH_TO_FEATURE = {
    'password-generator':    'password',
    'password':              'password',
    'batch-renamer':         'renamer',
    'renamer':               'renamer',
    'media-compressor':      'compressor',
    'image-compressor':      'compressor',
    'compressor':            'compressor',
    'background-remover':    'bg-remover',
    'remove-background':     'bg-remover',
    'bg-remover':            'bg-remover',
    'image-to-pdf':          'image-to-pdf',
    'image-tools':           'image-to-pdf',
    'pdf-to-docs':           'pdf-to-docs',
    'pdf-compressor':        'pdf-compressor',
    'video-to-uhd':          'video-to-uhd',
    'watermark-remover':     'watermark-remover',
    'qr-code-master':        'qr-code-master',
    'qr-generator':          'qr-code-master',
    'ai-workflow-assistant': 'ai-workflow-assistant',
    'metadata-cleaner':      'metadata-cleaner',
    'web-monitor':           'web-monitor'
  };

  // ============================================================
  // INTERNAL STATE & SERVER SYNC
  // ============================================================

  var _activeConfig = _deepClone(MAINTENANCE_DEFAULTS);
  var _isServerSynced = false;
  var _fetchPromise = null;

  // Baca cache lokal hanya sebagai fallback instan awal (tidak mengalahkan server)
  (function _initFromLocalCache() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        var stored = JSON.parse(raw);
        if (stored && typeof stored === 'object') {
          if (typeof stored.global === 'boolean') _activeConfig.global = stored.global;
          if (stored.features && typeof stored.features === 'object') {
            Object.keys(stored.features).forEach(function (id) {
              var normId = PATH_TO_FEATURE[id] || id;
              if (!_activeConfig.features[normId]) {
                _activeConfig.features[normId] = { enabled: false, name: normId, message: null };
              }
              var s = stored.features[id];
              if (typeof s === 'boolean') {
                _activeConfig.features[normId].enabled = s;
              } else if (s && typeof s === 'object') {
                if (typeof s.enabled === 'boolean') _activeConfig.features[normId].enabled = s.enabled;
                if (s.message !== undefined) _activeConfig.features[normId].message = s.message || null;
              }
            });
          }
        }
      }
    } catch (e) {}
  })();

  function _getApiBases() {
    var bases = [];
    if (typeof window !== 'undefined' && window.location) {
      var loc = window.location;
      bases.push('/api/maintenance');
      bases.push('/api/features');
      if (loc.port !== '3001') {
        bases.push(loc.protocol + '//' + loc.hostname + ':3001/api/maintenance');
        bases.push(loc.protocol + '//' + loc.hostname + ':3001/api/features');
      }
      if (loc.hostname !== 'localhost' && loc.hostname !== '127.0.0.1') {
        bases.push('http://localhost:3001/api/maintenance');
        bases.push('http://localhost:3001/api/features');
      }
    } else {
      bases.push('/api/maintenance');
      bases.push('/api/features');
    }
    return bases;
  }

  async function _apiFetch(endpointPath, options) {
    options = options || {};
    var method = options.method || 'GET';
    var headers = Object.assign({
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache'
    }, options.headers || {});

    var bases = _getApiBases();
    var lastError = null;

    for (var i = 0; i < bases.length; i++) {
      var sep = endpointPath.startsWith('/') ? '' : '/';
      var url = bases[i] + sep + endpointPath;
      var hasQuery = url.indexOf('?') !== -1;
      var fullUrl = url + (hasQuery ? '&' : '?') + '_t=' + Date.now();

      try {
        var res = await fetch(fullUrl, {
          method: method,
          headers: headers,
          body: options.body,
          cache: 'no-store'
        });
        if (res.ok) {
          return await res.json();
        }
      } catch (err) {
        lastError = err;
      }
    }
    throw lastError || new Error('Gagal menghubungi API features.');
  }

  function _notifyChange() {
    try {
      window.dispatchEvent(new Event('toolsuf-maintenance-changed'));
    } catch (e) {}
    try {
      if (window.parent && window.parent !== window) {
        window.parent.dispatchEvent(new Event('toolsuf-maintenance-changed'));
      }
    } catch (e) {}
    try {
      if ('BroadcastChannel' in window) {
        var bc = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
        bc.postMessage('changed');
        bc.close();
      }
    } catch (e) {}
  }

  function _saveCache(config) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    } catch (e) {}
  }

  function _mergeServerData(data) {
    if (!data || typeof data !== 'object') return;
    if (typeof data.global === 'boolean') {
      _activeConfig.global = data.global;
    } else if (typeof data.global_maintenance === 'boolean') {
      _activeConfig.global = data.global_maintenance;
    }

    if (data.features && typeof data.features === 'object') {
      Object.keys(data.features).forEach(function (id) {
        var normId = PATH_TO_FEATURE[id] || id;
        var s = data.features[id];
        if (!_activeConfig.features[normId]) {
          _activeConfig.features[normId] = { enabled: false, name: normId, message: null };
        }
        var isEnabled = false;
        if (typeof s === 'boolean') {
          isEnabled = s;
        } else if (s && typeof s === 'object') {
          isEnabled = (typeof s.maintenance_enabled === 'boolean')
            ? s.maintenance_enabled
            : (typeof s.maintenance === 'boolean' ? s.maintenance : Boolean(s.enabled));
          if (s.name) _activeConfig.features[normId].name = s.name;
          if (s.message !== undefined) _activeConfig.features[normId].message = s.message;
          else if (s.maintenance_message !== undefined) _activeConfig.features[normId].message = s.maintenance_message;
        }
        _activeConfig.features[normId].enabled = isEnabled;
      });
    }

    _isServerSynced = true;
    _saveCache(_activeConfig);
  }

  /**
   * Mengambil status terbaru dari server/backend secara asynchronous.
   * Sumber kebenaran utama untuk seluruh device.
   */
  async function fetchStatus() {
    try {
      var data;
      try {
        data = await _apiFetch('');
      } catch (e) {
        data = await _apiFetch('/status');
      }
      _mergeServerData(data);
      _notifyChange();
      _handleConfigChange();
      return _activeConfig;
    } catch (err) {
      return _activeConfig;
    }
  }

  function _deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  function _detectFeatureFromPath() {
    try {
      var pathname = window.location.pathname.toLowerCase();
      var parts = pathname.split('/').filter(Boolean);
      for (var i = 0; i < parts.length; i++) {
        if (PATH_TO_FEATURE[parts[i]]) return PATH_TO_FEATURE[parts[i]];
      }
      var urlParams = new URLSearchParams(window.location.search);
      var toolParam = urlParams.get('tool');
      if (toolParam && PATH_TO_FEATURE[toolParam.toLowerCase()]) {
        return PATH_TO_FEATURE[toolParam.toLowerCase()];
      }
    } catch (e) {}
    return null;
  }

  // ============================================================
  // PUBLIC API — PRIORITAS LOGIC: 2-LEVEL MAINTENANCE
  // ============================================================
  // GLOBAL ON  -> Semua fitur maintenance
  // GLOBAL OFF -> Cek maintenance masing-masing fitur
  function isMaintenanceActive(featureId) {
    if (!featureId) return false;
    var normId = PATH_TO_FEATURE[featureId] || featureId;

    try {
      // 1. Level 1: Global Maintenance Priority
      if (_activeConfig.global === true) {
        return true;
      }
      // 2. Level 2: Feature Maintenance
      var f = _activeConfig.features[normId];
      return f ? Boolean(f.enabled) : false;
    } catch (e) {
      return false;
    }
  }

  function isFeatureMaintenance(featureId) {
    return isMaintenanceActive(featureId);
  }

  async function setFeatureMaintenance(rawFeatureId, enabled, message) {
    var featureId = PATH_TO_FEATURE[rawFeatureId] || rawFeatureId;

    // 1. Optimistic local update
    if (!_activeConfig.features[featureId]) {
      _activeConfig.features[featureId] = { enabled: false, name: featureId, message: null };
    }
    _activeConfig.features[featureId].enabled = Boolean(enabled);
    if (message !== undefined) _activeConfig.features[featureId].message = message || null;
    _saveCache(_activeConfig);
    _notifyChange();
    _handleConfigChange();

    // 2. Persist to server/backend API
    try {
      var res = await _apiFetch('/features/' + encodeURIComponent(featureId), {
        method: 'PUT',
        body: JSON.stringify({
          enabled: Boolean(enabled),
          maintenance: Boolean(enabled),
          message: message !== undefined ? message : _activeConfig.features[featureId].message
        })
      });
      _mergeServerData(res);
      _notifyChange();
      _handleConfigChange();
      return _activeConfig;
    } catch (err) {
      try {
        var res2 = await _apiFetch('/' + encodeURIComponent(featureId) + '/maintenance', {
          method: 'PUT',
          body: JSON.stringify({
            maintenance: Boolean(enabled),
            enabled: Boolean(enabled),
            message: message !== undefined ? message : _activeConfig.features[featureId].message
          })
        });
        _mergeServerData(res2);
        _notifyChange();
        _handleConfigChange();
      } catch (err2) {
        console.warn('[Maintenance] Failed to persist feature maintenance to backend:', err2.message);
      }
      return _activeConfig;
    }
  }

  async function setGlobalMaintenance(enabled) {
    // 1. Optimistic update
    _activeConfig.global = Boolean(enabled);
    _saveCache(_activeConfig);
    _notifyChange();
    _handleConfigChange();

    // 2. Persist to server/backend API
    try {
      var res = await _apiFetch('/global', {
        method: 'PUT',
        body: JSON.stringify({
          enabled: Boolean(enabled),
          global: Boolean(enabled)
        })
      });
      _mergeServerData(res);
      _notifyChange();
      _handleConfigChange();
      return _activeConfig;
    } catch (err) {
      try {
        var res2 = await _apiFetch('/global/maintenance', {
          method: 'POST',
          body: JSON.stringify({
            global: Boolean(enabled),
            enabled: Boolean(enabled),
            maintenance: Boolean(enabled)
          })
        });
        _mergeServerData(res2);
        _notifyChange();
        _handleConfigChange();
      } catch (err2) {
        console.warn('[Maintenance] Failed to persist global maintenance to backend:', err2.message);
      }
      return _activeConfig;
    }
  }

  async function resetAllMaintenance() {
    _activeConfig.global = false;
    Object.keys(_activeConfig.features).forEach(function (id) {
      _activeConfig.features[id].enabled = false;
    });
    _saveCache(_activeConfig);
    _notifyChange();
    _handleConfigChange();

    try {
      var res = await _apiFetch('/reset-all', {
        method: 'POST',
        body: JSON.stringify({})
      });
      _mergeServerData(res);
      _notifyChange();
      _handleConfigChange();
      return _activeConfig;
    } catch (err) {
      console.warn('[Maintenance] Failed to reset maintenance on backend:', err.message);
      return _activeConfig;
    }
  }

  function getConfig() { return _deepClone(_activeConfig); }
  function getDefaults() { return _deepClone(MAINTENANCE_DEFAULTS); }  var FEATURE_TITLES = {
    'password':              { id: 'Generator Kata Sandi',    en: 'Password Generator' },
    'renamer':               { id: 'Pengganti Nama File Pro', en: 'Batch Renamer Pro' },
    'compressor':            { id: 'Kompresor Media',         en: 'Media Compressor' },
    'bg-remover':            { id: 'Penghapus Latar Belakang', en: 'Background Remover' },
    'image-to-pdf':          { id: 'Gambar ke PDF',           en: 'Image to PDF' },
    'pdf-to-docs':           { id: 'PDF ke Dokumen',          en: 'PDF to Docs' },
    'pdf-compressor':        { id: 'Kompresor PDF',           en: 'PDF Compressor' },
    'video-to-uhd':          { id: 'Peningkat Video UHD',     en: 'UHD Video Upscaler' },
    'watermark-remover':     { id: 'Hapus Watermark',         en: 'Watermark Remover' },
    'qr-code-master':        { id: 'Master Kode QR',          en: 'QR Code Master' },
    'ai-workflow-assistant': { id: 'Asisten Alur Kerja AI',   en: 'AI Workflow Assistant' },
    'metadata-cleaner':      { id: 'Penghapus Metadata',      en: 'Metadata Cleaner' },
    'web-monitor':           { id: 'Pemantau Situs Web',      en: 'Web Monitor' }
  };

  var MAINTENANCE_I18N = {
    id: {
      badge: 'MAINTENANCE',
      title: 'Fitur Sedang Dikembangkan',
      desc: 'Kami sedang melakukan beberapa peningkatan pada fitur ini. Silakan coba kembali setelah proses pengembangan selesai.',
      globalTitle: 'Aplikasi sedang dalam pemeliharaan.',
      globalDesc: 'Silakan coba kembali nanti.',
      globalFeat: 'Maintenance',
      featureTitle: 'Fitur Sedang Dikembangkan',
      featureDesc: 'Kami sedang melakukan beberapa peningkatan pada fitur ini. Silakan coba kembali setelah proses pengembangan selesai.',
      back: 'Kembali',
      backHome: 'Kembali ke Beranda',
      close: 'Tutup',
      defaultFeature: 'Fitur'
    },
    en: {
      badge: 'MAINTENANCE',
      title: 'Feature Under Development',
      desc: 'We are currently making improvements to this feature. Please try again once the development process is complete.',
      globalTitle: 'The application is currently under maintenance.',
      globalDesc: 'Please try again later.',
      globalFeat: 'Maintenance',
      featureTitle: 'Feature Under Development',
      featureDesc: 'We are currently making improvements to this feature. Please try again once the development process is complete.',
      back: 'Back',
      backHome: 'Back to Home',
      close: 'Close',
      defaultFeature: 'Feature'
    }
  };

  function getFeatureName(rawFeatureId, lang) {
    lang = (lang === 'en') ? 'en' : 'id';
    var featureId = PATH_TO_FEATURE[rawFeatureId] || rawFeatureId;
    if (FEATURE_TITLES[featureId]) {
      return FEATURE_TITLES[featureId][lang] || FEATURE_TITLES[featureId].id;
    }
    var f = _activeConfig.features[featureId];
    if (f && f.name) return f.name;
    return rawFeatureId || (MAINTENANCE_I18N[lang] ? MAINTENANCE_I18N[lang].defaultFeature : 'Fitur');
  }

  function getMaintenanceMessage(rawFeatureId, lang, isGlobal) {
    lang = (lang === 'en') ? 'en' : 'id';
    var isGlob = (isGlobal !== undefined) ? Boolean(isGlobal) : (_activeConfig.global === true);
    if (isGlob) {
      return (MAINTENANCE_I18N[lang] && MAINTENANCE_I18N[lang].globalDesc) || (lang === 'en' ? 'Please try again later.' : 'Silakan coba kembali nanti.');
    }

    var defaultDesc = (MAINTENANCE_I18N[lang] && MAINTENANCE_I18N[lang].featureDesc) || MAINTENANCE_I18N.id.featureDesc;
    var featureId = PATH_TO_FEATURE[rawFeatureId] || rawFeatureId;
    var f = _activeConfig.features[featureId];
    if (!f || !f.message) return defaultDesc;

    var msg = f.message;
    if (typeof msg === 'object') {
      return msg[lang] || msg.id || msg.en || defaultDesc;
    }

    if (typeof msg === 'string') {
      var trimmed = msg.trim();
      if (!trimmed) return defaultDesc;

      // Handle JSON string format e.g. {"id": "...", "en": "..."}
      if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
        try {
          var parsed = JSON.parse(trimmed);
          if (parsed && typeof parsed === 'object') {
            return parsed[lang] || parsed.id || parsed.en || defaultDesc;
          }
        } catch (e) {}
      }

      // Handle translation key
      if (trimmed === 'maintenance.featureUnderDevelopment' || trimmed === 'featureUnderDevelopment') {
        return defaultDesc;
      }

      // Standard default Indonesian strings fallback to localized text
      if (trimmed === 'Kami sedang melakukan beberapa peningkatan pada fitur ini. Silakan coba kembali setelah proses pengembangan selesai.' ||
          trimmed === 'Fitur sedang dikembangkan' ||
          trimmed === 'Fitur ini sedang dalam pemeliharaan.') {
        return defaultDesc;
      }
      if (trimmed === 'PDF Compressor sedang dalam pemeliharaan sistem.' ||
          trimmed === 'PDF Compressor sedang dikembangkan.') {
        return lang === 'en'
          ? 'PDF Compressor is currently undergoing system maintenance.'
          : 'PDF Compressor sedang dalam pemeliharaan sistem.';
      }

      return trimmed;
    }

    return defaultDesc;
  }

  // ============================================================
  // MAINTENANCE PAGE CSS & TEMPLATE GENERATOR
  // ============================================================

  var MNT_CSS = [
    '/* ToolSuf Maintenance Design System — Theme-Adaptive & Accessible */',
    ':root {',
    '  --ts-mnt-bg: #F4F5F7;',
    '  --ts-mnt-text-primary: #1C1C1E;',
    '  --ts-mnt-text-secondary: #6E6E73;',
    '  --ts-mnt-text-tertiary: #8E8E93;',
    '  --ts-mnt-btn-bg: rgba(0, 0, 0, 0.05);',
    '  --ts-mnt-btn-border: rgba(0, 0, 0, 0.1);',
    '  --ts-mnt-btn-hover: rgba(0, 0, 0, 0.09);',
    '  --ts-mnt-btn-text: #1C1C1E;',
    '  --ts-mnt-accent: #FF9500;',
    '  --ts-mnt-ic-bg: rgba(255, 149, 0, 0.08);',
    '  --ts-mnt-ic-border: rgba(255, 149, 0, 0.22);',
    '  --ts-mnt-ambient-glow: radial-gradient(circle, rgba(255, 149, 0, 0.07) 0%, rgba(255, 149, 0, 0.015) 48%, rgba(255, 149, 0, 0) 70%);',
    '}',
    'html.dark,',
    '.tsuf-mnt-ov:not(.light) {',
    '  --ts-mnt-bg: #141416;',
    '  --ts-mnt-text-primary: #F5F5F7;',
    '  --ts-mnt-text-secondary: #A1A1A6;',
    '  --ts-mnt-text-tertiary: #636366;',
    '  --ts-mnt-btn-bg: rgba(255, 255, 255, 0.08);',
    '  --ts-mnt-btn-border: rgba(255, 255, 255, 0.14);',
    '  --ts-mnt-btn-hover: rgba(255, 255, 255, 0.14);',
    '  --ts-mnt-btn-text: #F5F5F7;',
    '  --ts-mnt-accent: #FF9500;',
    '  --ts-mnt-ic-bg: rgba(255, 149, 0, 0.12);',
    '  --ts-mnt-ic-border: rgba(255, 149, 0, 0.28);',
    '  --ts-mnt-ambient-glow: radial-gradient(circle, rgba(255, 149, 0, 0.11) 0%, rgba(255, 149, 0, 0.03) 48%, rgba(255, 149, 0, 0) 70%);',
    '}',
    '.tsuf-mnt-ov.light {',
    '  --ts-mnt-bg: #F4F5F7;',
    '  --ts-mnt-text-primary: #1C1C1E;',
    '  --ts-mnt-text-secondary: #6E6E73;',
    '  --ts-mnt-text-tertiary: #8E8E93;',
    '  --ts-mnt-btn-bg: rgba(0, 0, 0, 0.05);',
    '  --ts-mnt-btn-border: rgba(0, 0, 0, 0.1);',
    '  --ts-mnt-btn-hover: rgba(0, 0, 0, 0.09);',
    '  --ts-mnt-btn-text: #1C1C1E;',
    '  --ts-mnt-accent: #FF9500;',
    '  --ts-mnt-ic-bg: rgba(255, 149, 0, 0.08);',
    '  --ts-mnt-ic-border: rgba(255, 149, 0, 0.22);',
    '  --ts-mnt-ambient-glow: radial-gradient(circle, rgba(255, 149, 0, 0.07) 0%, rgba(255, 149, 0, 0.015) 48%, rgba(255, 149, 0, 0) 70%);',
    '}',
    '.tsuf-mnt-ov {',
    '  position: fixed;',
    '  inset: 0;',
    '  z-index: 99999;',
    '  display: flex;',
    '  align-items: center;',
    '  justify-content: center;',
    '  background: var(--ts-mnt-bg);',
    '  padding: 24px;',
    '  box-sizing: border-box;',
    '  overflow: hidden;',
    '  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", Roboto, system-ui, sans-serif;',
    '  -webkit-font-smoothing: antialiased;',
    '  -moz-osx-font-smoothing: grayscale;',
    '  transition: background 0.25s ease, color 0.25s ease;',
    '}',
    '.tsuf-mnt-ambient {',
    '  position: absolute;',
    '  top: 50%;',
    '  left: 50%;',
    '  transform: translate(-50%, -55%);',
    '  width: 420px;',
    '  height: 420px;',
    '  max-width: 90vw;',
    '  max-height: 90vw;',
    '  border-radius: 50%;',
    '  background: var(--ts-mnt-ambient-glow);',
    '  pointer-events: none;',
    '  z-index: 0;',
    '  animation: tsMntAmbient 8.5s ease-in-out infinite;',
    '}',
    '.tsuf-mnt-card {',
    '  position: relative;',
    '  z-index: 1;',
    '  text-align: center;',
    '  max-width: 440px;',
    '  width: 100%;',
    '  margin: 0 auto;',
    '  box-sizing: border-box;',
    '}',
    '/* Staggered entrance */',
    '@keyframes tsMntFadeUp {',
    '  from { opacity: 0; transform: translateY(8px); }',
    '  to { opacity: 1; transform: translateY(0); }',
    '}',
    '.tsuf-mnt-fade-1 { animation: tsMntFadeUp 0.45s cubic-bezier(0.16, 1, 0.3, 1) both 0.05s; }',
    '.tsuf-mnt-fade-2 { animation: tsMntFadeUp 0.45s cubic-bezier(0.16, 1, 0.3, 1) both 0.12s; }',
    '.tsuf-mnt-fade-3 { animation: tsMntFadeUp 0.45s cubic-bezier(0.16, 1, 0.3, 1) both 0.20s; }',
    '.tsuf-mnt-fade-4 { animation: tsMntFadeUp 0.45s cubic-bezier(0.16, 1, 0.3, 1) both 0.28s; }',
    '.tsuf-mnt-fade-5 { animation: tsMntFadeUp 0.45s cubic-bezier(0.16, 1, 0.3, 1) both 0.36s; }',
    '/* Icon container & subtle pulse */',
    '.tsuf-mnt-ic-wrap {',
    '  display: flex;',
    '  justify-content: center;',
    '  margin-bottom: 18px;',
    '}',
    '.tsuf-mnt-ic {',
    '  width: 62px;',
    '  height: 62px;',
    '  border-radius: 18px;',
    '  background: var(--ts-mnt-ic-bg);',
    '  border: 1px solid var(--ts-mnt-ic-border);',
    '  display: flex;',
    '  align-items: center;',
    '  justify-content: center;',
    '  color: var(--ts-mnt-accent);',
    '  animation: tsMntBoxPulse 2.6s ease-in-out infinite;',
    '  transform: translateZ(0);',
    '  will-change: transform, box-shadow, border-color;',
    '  transition: background 0.25s ease, border-color 0.25s ease;',
    '}',
    '.tsuf-mnt-ic svg {',
    '  width: 27px;',
    '  height: 27px;',
    '  display: block;',
    '  transform-origin: 50% 50%;',
    '  animation: tsMntWrenchMotion 2.6s ease-in-out infinite;',
    '  will-change: transform, opacity;',
    '}',
    '.tsuf-mnt-badge-wrap {',
    '  display: flex;',
    '  justify-content: center;',
    '  margin-bottom: 16px;',
    '}',
    '.tsuf-mnt-badge {',
    '  display: inline-flex;',
    '  align-items: center;',
    '  gap: 6px;',
    '  font-size: 10.5px;',
    '  font-weight: 700;',
    '  letter-spacing: 0.1em;',
    '  text-transform: uppercase;',
    '  color: var(--ts-mnt-accent);',
    '  background: rgba(255, 149, 0, 0.09);',
    '  border: 1px solid rgba(255, 149, 0, 0.22);',
    '  border-radius: 20px;',
    '  padding: 4px 12px;',
    '  animation: tsMntBadgePulse 2.4s ease-in-out infinite;',
    '  will-change: opacity, box-shadow;',
    '}',
    '.tsuf-mnt-badge svg {',
    '  width: 10px;',
    '  height: 10px;',
    '}',
    '/* Typography */',
    '.tsuf-mnt-feat {',
    '  font-size: 12px;',
    '  color: var(--ts-mnt-text-tertiary);',
    '  letter-spacing: 0.03em;',
    '  margin: 0 0 6px;',
    '  font-weight: 500;',
    '  transition: color 0.25s ease;',
    '}',
    '.tsuf-mnt-h {',
    '  font-size: 22px;',
    '  font-weight: 600;',
    '  letter-spacing: -0.35px;',
    '  color: var(--ts-mnt-text-primary);',
    '  margin: 0 0 10px;',
    '  line-height: 1.3;',
    '  transition: color 0.25s ease;',
    '}',
    '.tsuf-mnt-p {',
    '  font-size: 13.5px;',
    '  color: var(--ts-mnt-text-secondary);',
    '  line-height: 1.62;',
    '  margin: 0 0 24px;',
    '  font-weight: 400;',
    '  transition: color 0.25s ease;',
    '}',
    '/* Action Button (Kembali / Back / Kembali ke Beranda) */',
    '.tsuf-mnt-btn {',
    '  display: inline-flex;',
    '  align-items: center;',
    '  justify-content: center;',
    '  gap: 8px;',
    '  padding: 10px 22px;',
    '  background: var(--ts-mnt-btn-bg);',
    '  border: 1px solid var(--ts-mnt-btn-border);',
    '  border-radius: 10px;',
    '  color: var(--ts-mnt-btn-text);',
    '  font-size: 13px;',
    '  font-weight: 500;',
    '  cursor: pointer;',
    '  text-decoration: none;',
    '  font-family: inherit;',
    '  outline: none;',
    '  transition: background 0.18s ease, border-color 0.18s ease, color 0.18s ease, transform 0.18s ease, box-shadow 0.18s ease;',
    '}',
    '.tsuf-mnt-btn:hover {',
    '  background: var(--ts-mnt-btn-hover);',
    '  transform: translateY(-1px);',
    '}',
    '.tsuf-mnt-btn:active {',
    '  transform: translateY(0);',
    '}',
    '.tsuf-mnt-btn:focus-visible {',
    '  box-shadow: 0 0 0 3px rgba(255, 149, 0, 0.35);',
    '}',
    '.tsuf-mnt-btn svg {',
    '  width: 14px;',
    '  height: 14px;',
    '  opacity: 0.85;',
    '}',
    '/* Keyframe: Wrench subtle rocking and breathing scale */',
    '@keyframes tsMntWrenchMotion {',
    '  0% { transform: rotate(0deg) scale(1); opacity: 0.92; }',
    '  25% { transform: rotate(-8deg) scale(1.02); opacity: 0.98; }',
    '  50% { transform: rotate(0deg) scale(1.04); opacity: 1; }',
    '  75% { transform: rotate(8deg) scale(1.02); opacity: 0.98; }',
    '  100% { transform: rotate(0deg) scale(1); opacity: 0.92; }',
    '}',
    '/* Keyframe: Icon Box subtle pulse */',
    '@keyframes tsMntBoxPulse {',
    '  0%, 100% {',
    '    border-color: rgba(255, 149, 0, 0.22);',
    '    box-shadow: 0 0 0 0 rgba(255, 149, 0, 0);',
    '  }',
    '  50% {',
    '    border-color: rgba(255, 149, 0, 0.44);',
    '    box-shadow: 0 0 16px rgba(255, 149, 0, 0.14);',
    '  }',
    '}',
    '/* Keyframe: Badge soft pulse */',
    '@keyframes tsMntBadgePulse {',
    '  0%, 100% { opacity: 1; border-color: rgba(255, 149, 0, 0.22); }',
    '  50% { opacity: 0.78; border-color: rgba(255, 149, 0, 0.38); }',
    '}',
    '/* Keyframe: Ambient radial glow breathing */',
    '@keyframes tsMntAmbient {',
    '  0%, 100% { transform: translate(-50%, -55%) scale(0.92); opacity: 0.65; }',
    '  50% { transform: translate(-50%, -55%) scale(1.12); opacity: 1; }',
    '}',
    '@media (prefers-reduced-motion: reduce) {',
    '  .tsuf-mnt-ambient, .tsuf-mnt-ic, .tsuf-mnt-ic svg, .tsuf-mnt-badge,',
    '  .tsuf-mnt-fade-1, .tsuf-mnt-fade-2, .tsuf-mnt-fade-3, .tsuf-mnt-fade-4, .tsuf-mnt-fade-5 {',
    '    animation: none !important;',
    '    transition: none !important;',
    '    transform: none !important;',
    '    opacity: 1 !important;',
    '  }',
    '}'
  ].join('\n');

  function _injectCSS() {
    var existing = document.getElementById('tsuf-mnt-css');
    if (existing) {
      existing.textContent = MNT_CSS;
      return;
    }
    var s = document.createElement('style');
    s.id = 'tsuf-mnt-css';
    s.textContent = MNT_CSS;
    document.head.appendChild(s);
  }

  function _wrenchSvg() {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>' +
    '</svg>';
  }

  function _badgeSvg() {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>' +
    '</svg>';
  }

  function _backSvg() {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<path d="M19 12H5"/><polyline points="12 19 5 12 12 5"/>' +
    '</svg>';
  }

  /**
   * Reusable HTML Generator for Maintenance state.
   * Usable for both full-page direct visits and modal iframe srcdoc.
   */
  function generateMaintenanceHTML(featureId, options) {
    options = options || {};
    var storageObj = (typeof localStorage !== 'undefined') ? localStorage : (global.localStorage || null);
    var lang = options.lang || (storageObj && storageObj.getItem('lang')) || 'id';
    lang = (lang === 'en') ? 'en' : 'id';

    var isDark = options.isDark !== undefined
      ? !!options.isDark
      : ((storageObj && storageObj.getItem('theme') === 'light') ? false : true);

    var isGlobal = options.isGlobal !== undefined
      ? Boolean(options.isGlobal)
      : (_activeConfig.global === true);

    var strings = MAINTENANCE_I18N[lang] || MAINTENANCE_I18N.id;
    var featureName = isGlobal ? strings.globalFeat : (options.featureName || getFeatureName(featureId, lang));
    var title = isGlobal ? strings.globalTitle : strings.featureTitle;
    var message = isGlobal ? strings.globalDesc : (options.message || getMaintenanceMessage(featureId, lang, false));
    var isModal = options.isModal !== undefined ? !!options.isModal : false;
    var showHomeBtn = options.showHomeBtn !== undefined ? !!options.showHomeBtn : true;
    var homeUrl = options.homeUrl || '/';

    var btnLabel = isModal ? strings.back : (showHomeBtn ? strings.backHome : strings.back);
    var btnAction = isModal
      ? 'onclick="if(window.parent&&window.parent!==window){window.parent.postMessage({type:\'closeToolModal\'},\'*\');}else{window.location.href=\'/\';}return false;"'
      : '';

    var btnHTML = showHomeBtn
      ? '<div class="tsuf-mnt-fade-5">' +
          '<a href="' + homeUrl + '" class="tsuf-mnt-btn" id="tsufMntBtn" ' + btnAction + ' role="button" aria-label="' + btnLabel + '">' +
            _backSvg() +
            '<span id="tsufMntBtnText">' + btnLabel + '</span>' +
          '</a>' +
        '</div>'
      : '';

    var scriptTag =
      '<script>' +
      '(function() {' +
      '  var fid = "' + featureId + '";' +
      '  var isModal = ' + (isModal ? 'true' : 'false') + ';' +
      '  var isGlob = ' + (isGlobal ? 'true' : 'false') + ';' +
      '  var I18N = ' + JSON.stringify(MAINTENANCE_I18N) + ';' +
      '  var TITLES = ' + JSON.stringify(FEATURE_TITLES) + ';' +
      '  function applyTheme(isDark) {' +
      '    if (isDark) {' +
      '      document.documentElement.classList.add("dark");' +
      '      document.documentElement.classList.remove("light");' +
      '      var ov = document.getElementById("tsuf-mnt-ov");' +
      '      if (ov) ov.classList.remove("light");' +
      '      document.body.style.background = "#141416";' +
      '    } else {' +
      '      document.documentElement.classList.remove("dark");' +
      '      document.documentElement.classList.add("light");' +
      '      var ov = document.getElementById("tsuf-mnt-ov");' +
      '      if (ov) ov.classList.add("light");' +
      '      document.body.style.background = "#F4F5F7";' +
      '    }' +
      '  }' +
      '  function applyLang(lang) {' +
      '    lang = (lang === "en") ? "en" : "id";' +
      '    document.documentElement.setAttribute("lang", lang);' +
      '    var s = I18N[lang] || I18N.id;' +
      '    var t = isGlob ? s.globalFeat : ((TITLES[fid] && TITLES[fid][lang]) || (window.parent && window.parent.ToolSufMaintenance && window.parent.ToolSufMaintenance.getFeatureName(fid, lang)) || "' + featureName + '");' +
      '    var titleText = isGlob ? s.globalTitle : s.featureTitle;' +
      '    var m = "";' +
      '    if (isGlob) {' +
      '      m = s.globalDesc;' +
      '    } else if (window.parent && window.parent.ToolSufMaintenance) {' +
      '      m = window.parent.ToolSufMaintenance.getMaintenanceMessage(fid, lang, false);' +
      '    } else {' +
      '      m = s.featureDesc;' +
      '    }' +
      '    var featEl = document.getElementById("tsufMntFeat");' +
      '    var badgeEl = document.getElementById("tsufMntBadgeText");' +
      '    var titleEl = document.getElementById("tsufMntTitle");' +
      '    var descEl = document.getElementById("tsufMntDesc");' +
      '    var btnEl = document.getElementById("tsufMntBtnText");' +
      '    var btn = document.getElementById("tsufMntBtn");' +
      '    if (featEl) featEl.textContent = t;' +
      '    if (badgeEl) badgeEl.textContent = s.badge;' +
      '    if (titleEl) titleEl.textContent = titleText;' +
      '    if (descEl) descEl.textContent = m;' +
      '    var bLabel = isModal ? s.back : s.backHome;' +
      '    if (btnEl) btnEl.textContent = bLabel;' +
      '    if (btn) btn.setAttribute("aria-label", bLabel);' +
      '    document.title = (isGlob ? s.globalFeat : "Maintenance \\u2014 " + t);' +
      '  }' +
      '  window.addEventListener("message", function(e) {' +
      '    if (!e.data) return;' +
      '    if (e.data.type === "syncTheme") applyTheme(!!e.data.dark);' +
      '    if (e.data.type === "syncLang") applyLang(e.data.lang);' +
      '  });' +
      '  window.addEventListener("storage", function(e) {' +
      '    if (e.key === "theme") applyTheme(e.newValue !== "light");' +
      '    if (e.key === "lang") applyLang(e.newValue);' +
      '  });' +
      '})();' +
      '</script>';

    var html =
      '<!DOCTYPE html>' +
      '<html lang="' + lang + '" class="' + (isDark ? 'dark' : 'light') + '">' +
      '<head>' +
        '<meta charset="UTF-8">' +
        '<meta name="viewport" content="width=device-width, initial-scale=1.0">' +
        '<title>' + (isGlobal ? strings.globalFeat : 'Maintenance — ' + featureName) + '</title>' +
        '<style>' +
          'html, body { margin: 0; padding: 0; width: 100%; height: 100%; background: ' + (isDark ? '#141416' : '#F4F5F7') + '; overflow: hidden; }' +
          MNT_CSS +
        '</style>' +
      '</head>' +
      '<body>' +
        '<div class="tsuf-mnt-ov' + (isDark ? '' : ' light') + '" id="tsuf-mnt-ov" role="dialog" aria-modal="true" aria-label="' + title + ' — ' + featureName + '">' +
          '<div class="tsuf-mnt-ambient" aria-hidden="true"></div>' +
          '<div class="tsuf-mnt-card">' +
            '<div class="tsuf-mnt-fade-1 tsuf-mnt-ic-wrap">' +
              '<div class="tsuf-mnt-ic" title="' + strings.badge + '" aria-hidden="true">' +
                _wrenchSvg() +
              '</div>' +
            '</div>' +
            '<div class="tsuf-mnt-fade-2">' +
              '<div class="tsuf-mnt-feat" id="tsufMntFeat">' + featureName + '</div>' +
              '<div class="tsuf-mnt-badge-wrap">' +
                '<div class="tsuf-mnt-badge">' +
                  _badgeSvg() +
                  '<span id="tsufMntBadgeText">' + strings.badge + '</span>' +
                '</div>' +
              '</div>' +
            '</div>' +
            '<h1 class="tsuf-mnt-h tsuf-mnt-fade-3" id="tsufMntTitle">' + title + '</h1>' +
            '<p class="tsuf-mnt-p tsuf-mnt-fade-4" id="tsufMntDesc">' + message + '</p>' +
            btnHTML +
          '</div>' +
        '</div>' +
        scriptTag +
      '</body>' +
      '</html>';

    return html;
  }

  function _updateDirectPageContent(ov, featureId, isDark, lang) {
    lang = (lang === 'en') ? 'en' : 'id';
    var isGlobal = (_activeConfig.global === true);
    var strings = MAINTENANCE_I18N[lang] || MAINTENANCE_I18N.id;
    var featureName = isGlobal ? strings.globalFeat : getFeatureName(featureId, lang);
    var title = isGlobal ? strings.globalTitle : strings.featureTitle;
    var message = isGlobal ? strings.globalDesc : getMaintenanceMessage(featureId, lang, false);

    if (isDark) {
      ov.classList.remove('light');
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
      document.body.style.background = '#0A0A0C';
    } else {
      ov.classList.add('light');
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
      document.body.style.background = '#FCFCFD';
    }

    ov.setAttribute('aria-label', title + ' — ' + featureName);

    var featEl = document.getElementById('tsufMntFeat');
    var badgeEl = document.getElementById('tsufMntBadgeText');
    var titleEl = document.getElementById('tsufMntTitle');
    var descEl = document.getElementById('tsufMntDesc');
    var btnTextEl = document.getElementById('tsufMntBtnText');
    var btn = document.getElementById('tsufMntBtn');

    if (featEl) featEl.textContent = featureName;
    if (badgeEl) badgeEl.textContent = strings.badge;
    if (titleEl) titleEl.textContent = title;
    if (descEl) descEl.textContent = message;
    if (btnTextEl) btnTextEl.textContent = strings.backHome;
    if (btn) btn.setAttribute('aria-label', strings.backHome);
    document.title = (isGlobal ? strings.globalFeat : 'Maintenance — ' + featureName);
  }

  /**
   * Render full-screen maintenance page in current document.
   * Sets window.__TOOLSUF_MAINTENANCE__ = true to block tool init.
   */
  function showMaintenancePage(featureId) {
    global.__TOOLSUF_MAINTENANCE__ = true;

    var storageObj = (typeof localStorage !== 'undefined') ? localStorage : (global.localStorage || null);
    var currentTheme = (storageObj && storageObj.getItem('theme')) || 'dark';
    var isDark = (currentTheme !== 'light');
    var currentLang = (storageObj && storageObj.getItem('lang')) || 'id';

    function _render() {
      var existingOv = document.getElementById('tsuf-mnt-ov');
      if (existingOv) {
        _updateDirectPageContent(existingOv, featureId, isDark, currentLang);
        return;
      }
      _injectCSS();

      var isGlobal = (_activeConfig.global === true);
      var strings = MAINTENANCE_I18N[currentLang] || MAINTENANCE_I18N.id;
      var featureName = isGlobal ? strings.globalFeat : getFeatureName(featureId, currentLang);
      var title = isGlobal ? strings.globalTitle : strings.featureTitle;
      var message = isGlobal ? strings.globalDesc : getMaintenanceMessage(featureId, currentLang, false);

      if (isDark) {
        document.documentElement.classList.add('dark');
        document.documentElement.classList.remove('light');
        if (document.body) document.body.style.background = '#0A0A0C';
      } else {
        document.documentElement.classList.remove('dark');
        document.documentElement.classList.add('light');
        if (document.body) document.body.style.background = '#FCFCFD';
      }

      var ov = document.createElement('div');
      ov.id        = 'tsuf-mnt-ov';
      ov.className = 'tsuf-mnt-ov' + (isDark ? '' : ' light');
      ov.setAttribute('role', 'dialog');
      ov.setAttribute('aria-modal', 'true');
      ov.setAttribute('aria-label', title + ' — ' + featureName);

      ov.innerHTML =
        '<div class="tsuf-mnt-ambient" aria-hidden="true"></div>' +
        '<div class="tsuf-mnt-card">' +
          '<div class="tsuf-mnt-fade-1 tsuf-mnt-ic-wrap">' +
            '<div class="tsuf-mnt-ic" title="' + strings.badge + '" aria-hidden="true">' +
              _wrenchSvg() +
            '</div>' +
          '</div>' +
          '<div class="tsuf-mnt-fade-2">' +
            '<div class="tsuf-mnt-feat" id="tsufMntFeat">' + featureName + '</div>' +
            '<div class="tsuf-mnt-badge-wrap">' +
              '<div class="tsuf-mnt-badge">' +
                _badgeSvg() +
                '<span id="tsufMntBadgeText">' + strings.badge + '</span>' +
              '</div>' +
            '</div>' +
          '</div>' +
          '<h1 class="tsuf-mnt-h tsuf-mnt-fade-3" id="tsufMntTitle">' + title + '</h1>' +
          '<p class="tsuf-mnt-p tsuf-mnt-fade-4" id="tsufMntDesc">' + message + '</p>' +
          '<div class="tsuf-mnt-fade-5">' +
            '<a href="/" class="tsuf-mnt-btn" id="tsufMntBtn" role="button" aria-label="' + strings.backHome + '">' +
              _backSvg() +
              '<span id="tsufMntBtnText">' + strings.backHome + '</span>' +
            '</a>' +
          '</div>' +
        '</div>';

      if (document.body) {
        document.body.appendChild(ov);
      } else {
        document.addEventListener('DOMContentLoaded', function () {
          document.body.appendChild(ov);
        });
      }
    }

    _render();

    if (!window.__tsufMntDirectListeners) {
      window.__tsufMntDirectListeners = true;
      window.addEventListener('storage', function (e) {
        if (e.key === 'theme' || e.key === 'lang') {
          var t = (localStorage.getItem('theme') !== 'light');
          var l = localStorage.getItem('lang') || 'id';
          var ov = document.getElementById('tsuf-mnt-ov');
          if (ov) _updateDirectPageContent(ov, featureId, t, l);
        }
      });
      window.addEventListener('theme-changed', function () {
        var t = (localStorage.getItem('theme') !== 'light');
        var l = localStorage.getItem('lang') || 'id';
        var ov = document.getElementById('tsuf-mnt-ov');
        if (ov) _updateDirectPageContent(ov, featureId, t, l);
      });
    }
  }

  /**
   * Auto-detect feature from URL and show maintenance if active.
   * @returns {boolean}
   */
  function checkCurrentPageMaintenance() {
    var featureId = _detectFeatureFromPath();
    if (!featureId) return false;
    // For web-monitor, do not block if admin session is active or on yusjul-admin
    if (featureId === 'web-monitor') {
      try {
        if (sessionStorage.getItem('web_monitor_auth') === 'true' ||
            localStorage.getItem('web_monitor_auth') === 'true' ||
            window.location.pathname.includes('/yusjul-admin')) {
          return false;
        }
      } catch (e) {}
    }
    if (isMaintenanceActive(featureId)) {
      showMaintenancePage(featureId);
      return true;
    }
    return false;
  }

  function _handleConfigChange() {
    var featureId = _detectFeatureFromPath();
    if (featureId) {
      var isMnt = isMaintenanceActive(featureId);
      var ov = document.getElementById('tsuf-mnt-ov');
      if (!isMnt && ov) {
        // Maintenance has ended for this page -> reload to restore tool
        window.location.reload();
        return;
      }
      if (isMnt && !ov) {
        showMaintenancePage(featureId);
      }
    }
    try {
      window.dispatchEvent(new Event('toolsuf-maintenance-changed'));
    } catch (err) {}
  }

  // ============================================================
  // REAL-TIME CROSS-TAB & SERVER SYNCHRONIZATION
  // ============================================================
  window.addEventListener('storage', function (e) {
    if (e.key === STORAGE_KEY) {
      _handleConfigChange();
    }
  });

  try {
    if ('BroadcastChannel' in window) {
      var listenerBc = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
      listenerBc.onmessage = function () {
        _handleConfigChange();
      };
    }
  } catch (err) {}

  // Auto-sync saat tab aktif kembali / focus
  if (typeof document !== 'undefined' && document.addEventListener) {
    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'visible') {
        fetchStatus().catch(function () {});
      }
    });
  }

  if (typeof window !== 'undefined' && window.addEventListener) {
    window.addEventListener('focus', function () {
      fetchStatus().catch(function () {});
    });
  }

  // Background polling setiap 4 detik untuk memastikan multi-device sinkron tanpa refresh manual
  var _pollTimer = setInterval(function () {
    fetchStatus().catch(function () {});
  }, 4000);
  if (_pollTimer && typeof _pollTimer.unref === 'function') {
    _pollTimer.unref();
  }

  // ============================================================
  // AUTO-RUN on script load (immediate check + async server sync)
  // ============================================================
  checkCurrentPageMaintenance();
  fetchStatus().catch(function () {});

  // ============================================================
  // EXPORT
  // ============================================================
  global.ToolSufMaintenance = {
    isMaintenanceActive:         isMaintenanceActive,
    isFeatureMaintenance:        isMaintenanceActive,
    setFeatureMaintenance:       setFeatureMaintenance,
    setGlobalMaintenance:        setGlobalMaintenance,
    resetAllMaintenance:        resetAllMaintenance,
    fetchStatus:                 fetchStatus,
    getConfig:                   getConfig,
    getDefaults:                 getDefaults,
    getFeatureName:              getFeatureName,
    getMaintenanceMessage:       getMaintenanceMessage,
    generateMaintenanceHTML:     generateMaintenanceHTML,
    showMaintenancePage:         showMaintenancePage,
    checkCurrentPageMaintenance: checkCurrentPageMaintenance,
    PATH_TO_FEATURE:             PATH_TO_FEATURE,
    FEATURE_TITLES:              FEATURE_TITLES,
    MAINTENANCE_I18N:            MAINTENANCE_I18N
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = global.ToolSufMaintenance;
  }
}(typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : this)));
