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
      'metadata-cleaner':      { enabled: false, name: 'Metadata Cleaner',      message: null }
    }
  };

  var STORAGE_KEY = 'toolsuf_maintenance';
  var BROADCAST_CHANNEL_NAME = 'toolsuf_maintenance_channel';

  // URL path segment -> feature ID
  var PATH_TO_FEATURE = {
    'password-generator':    'password',
    'password':              'password',
    'batch-renamer':         'renamer',
    'renamer':               'renamer',
    'media-compressor':      'compressor',
    'compressor':            'compressor',
    'background-remover':    'bg-remover',
    'bg-remover':            'bg-remover',
    'image-to-pdf':          'image-to-pdf',
    'pdf-to-docs':           'pdf-to-docs',
    'pdf-compressor':        'pdf-compressor',
    'video-to-uhd':          'video-to-uhd',
    'watermark-remover':     'watermark-remover',
    'qr-code-master':        'qr-code-master',
    'ai-workflow-assistant': 'ai-workflow-assistant',
    'metadata-cleaner':      'metadata-cleaner'
  };

  // ============================================================
  // INTERNAL HELPERS
  // ============================================================

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

  function _loadConfig() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return _deepClone(MAINTENANCE_DEFAULTS);
      var stored = JSON.parse(raw);
      var merged = {
        global: (typeof stored.global === 'boolean') ? stored.global : MAINTENANCE_DEFAULTS.global,
        features: _deepClone(MAINTENANCE_DEFAULTS.features)
      };
      if (stored.features && typeof stored.features === 'object') {
        if (stored.features['web-monitor']) {
          delete stored.features['web-monitor'];
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
          } catch (e) {}
        }
        Object.keys(stored.features).forEach(function (id) {
          if (id === 'web-monitor') return;
          if (merged.features[id]) {
            var s = stored.features[id];
            if (typeof s.enabled === 'boolean') merged.features[id].enabled = s.enabled;
            if (s.message !== undefined) merged.features[id].message = s.message || null;
          } else {
            merged.features[id] = stored.features[id];
          }
        });
      }
      delete merged.features['web-monitor'];
      return merged;
    } catch (e) {
      return _deepClone(MAINTENANCE_DEFAULTS);
    }
  }

  function _saveConfig(config) {
    try {
      if (config && config.features) {
        delete config.features['web-monitor'];
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
      _notifyChange();
    } catch (e) {
      console.warn('[Maintenance] Could not save config.', e);
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
    } catch (e) {}
    return null;
  }

  // ============================================================
  // PUBLIC API
  // ============================================================

  // Features that are NEVER affected by global maintenance (admin tools must stay accessible)
  var GLOBAL_MAINTENANCE_EXEMPT = ['web-monitor'];

  function isFeatureMaintenance(featureId) {
    if (featureId === 'web-monitor') return false;
    try {
      var config = _loadConfig();
      if (config.global) {
        // Web Monitor is always exempt from global maintenance so admin can turn it off
        if (GLOBAL_MAINTENANCE_EXEMPT.indexOf(featureId) !== -1) return false;
        return true;
      }
      var f = config.features[featureId];
      return f ? !!f.enabled : false;
    } catch (e) {
      return false;
    }
  }

  function setFeatureMaintenance(featureId, enabled, message) {
    if (featureId === 'web-monitor') return;
    try {
      var config = _loadConfig();
      delete config.features['web-monitor'];
      if (!config.features[featureId]) {
        config.features[featureId] = { enabled: false, name: featureId, message: null };
      }
      config.features[featureId].enabled = !!enabled;
      if (message !== undefined) config.features[featureId].message = message || null;
      _saveConfig(config);
    } catch (e) {
      console.warn('[Maintenance] setFeatureMaintenance error:', e);
    }
  }

  function setGlobalMaintenance(enabled) {
    try {
      var config = _loadConfig();
      config.global = !!enabled;
      _saveConfig(config);
    } catch (e) {}
  }

  function getConfig() { return _loadConfig(); }
  function getDefaults() { return _deepClone(MAINTENANCE_DEFAULTS); }

  function getFeatureName(featureId) {
    var config = _loadConfig();
    return (config.features[featureId] && config.features[featureId].name) || featureId;
  }

  function getMaintenanceMessage(featureId) {
    var config = _loadConfig();
    var f = config.features[featureId];
    return (f && f.message) ? f.message
      : 'Kami sedang melakukan beberapa peningkatan pada fitur ini. Silakan coba kembali setelah proses pengembangan selesai.';
  }

  // ============================================================
  // MAINTENANCE PAGE CSS & TEMPLATE GENERATOR
  // ============================================================

  var MNT_CSS = [
    '/* ToolSuf Maintenance Design System */',
    '.tsuf-mnt-ov {',
    '  position: fixed;',
    '  inset: 0;',
    '  z-index: 99999;',
    '  display: flex;',
    '  align-items: center;',
    '  justify-content: center;',
    '  background: #0A0A0C;',
    '  padding: 24px;',
    '  box-sizing: border-box;',
    '  overflow: hidden;',
    '  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", Roboto, system-ui, sans-serif;',
    '  -webkit-font-smoothing: antialiased;',
    '  -moz-osx-font-smoothing: grayscale;',
    '}',
    '.tsuf-mnt-ov.light {',
    '  background: #F5F5F7;',
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
    '  background: radial-gradient(circle, rgba(255, 149, 0, 0.09) 0%, rgba(255, 149, 0, 0.02) 48%, rgba(255, 149, 0, 0) 70%);',
    '  pointer-events: none;',
    '  z-index: 0;',
    '  animation: tsMntAmbient 8.5s ease-in-out infinite;',
    '}',
    '.tsuf-mnt-card {',
    '  position: relative;',
    '  z-index: 1;',
    '  text-align: center;',
    '  max-width: 420px;',
    '  width: 100%;',
    '  margin: 0 auto;',
    '  box-sizing: border-box;',
    '}',
    '/* Staggered entrance */',
    '@keyframes tsMntFadeUp {',
    '  from { opacity: 0; transform: translateY(8px); }',
    '  to { opacity: 1; transform: translateY(0); }',
    '}',
    '.tsuf-mnt-fade-1 { animation: tsMntFadeUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) both 0.06s; }',
    '.tsuf-mnt-fade-2 { animation: tsMntFadeUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) both 0.16s; }',
    '.tsuf-mnt-fade-3 { animation: tsMntFadeUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) both 0.26s; }',
    '.tsuf-mnt-fade-4 { animation: tsMntFadeUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) both 0.36s; }',
    '.tsuf-mnt-fade-5 { animation: tsMntFadeUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) both 0.46s; }',
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
    '  background: rgba(255, 149, 0, 0.08);',
    '  border: 1px solid rgba(255, 149, 0, 0.22);',
    '  display: flex;',
    '  align-items: center;',
    '  justify-content: center;',
    '  color: #FF9500;',
    '  animation: tsMntBoxPulse 2.6s ease-in-out infinite;',
    '  transform: translateZ(0);',
    '  will-change: transform, box-shadow, border-color;',
    '}',
    '/* Wrench icon motion: -8deg -> 8deg, 2.6s, ease-in-out, subtle scale 1 -> 1.04 -> 1, opacity 0.92 -> 1 -> 0.92 */',
    '.tsuf-mnt-ic svg {',
    '  width: 27px;',
    '  height: 27px;',
    '  display: block;',
    '  transform-origin: 50% 50%;',
    '  animation: tsMntWrenchMotion 2.6s ease-in-out infinite;',
    '  will-change: transform, opacity;',
    '}',
    '/* Badge with subtle soft pulse: 2.4s, opacity 1 -> 0.76 -> 1, subtle box-shadow */',
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
    '  color: #FF9500;',
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
    '  font-size: 11.5px;',
    '  color: #636366;',
    '  letter-spacing: 0.03em;',
    '  margin: 0 0 6px;',
    '  font-weight: 500;',
    '}',
    '.tsuf-mnt-h {',
    '  font-size: 21px;',
    '  font-weight: 600;',
    '  letter-spacing: -0.35px;',
    '  color: #FCFCFD;',
    '  margin: 0 0 10px;',
    '  line-height: 1.3;',
    '}',
    '.tsuf-mnt-ov.light .tsuf-mnt-h {',
    '  color: #1C1C1E;',
    '}',
    '.tsuf-mnt-p {',
    '  font-size: 13.5px;',
    '  color: #8E8E93;',
    '  line-height: 1.62;',
    '  margin: 0 0 24px;',
    '  font-weight: 400;',
    '}',
    '/* Action Button (Kembali ke Beranda for direct pages) */',
    '.tsuf-mnt-btn {',
    '  display: inline-flex;',
    '  align-items: center;',
    '  gap: 8px;',
    '  padding: 10px 20px;',
    '  background: rgba(255, 255, 255, 0.07);',
    '  border: 1px solid rgba(255, 255, 255, 0.12);',
    '  border-radius: 10px;',
    '  color: #FCFCFD;',
    '  font-size: 13px;',
    '  font-weight: 500;',
    '  cursor: pointer;',
    '  text-decoration: none;',
    '  transition: background 0.18s ease, border-color 0.18s ease, transform 0.18s ease;',
    '}',
    '.tsuf-mnt-btn:hover {',
    '  background: rgba(255, 255, 255, 0.12);',
    '  border-color: rgba(255, 255, 255, 0.18);',
    '  transform: translateY(-1px);',
    '}',
    '.tsuf-mnt-btn:active {',
    '  transform: translateY(0);',
    '}',
    '.tsuf-mnt-ov.light .tsuf-mnt-btn {',
    '  background: rgba(0, 0, 0, 0.05);',
    '  border-color: rgba(0, 0, 0, 0.1);',
    '  color: #1C1C1E;',
    '}',
    '.tsuf-mnt-ov.light .tsuf-mnt-btn:hover {',
    '  background: rgba(0, 0, 0, 0.09);',
    '}',
    '.tsuf-mnt-btn svg {',
    '  width: 14px;',
    '  height: 14px;',
    '  opacity: 0.75;',
    '}',
    '.tsuf-mnt-ov.light .tsuf-mnt-feat {',
    '  color: #8E8E93;',
    '}',
    '/* Keyframe: Wrench subtle rocking and breathing scale */',
    '@keyframes tsMntWrenchMotion {',
    '  0% {',
    '    transform: rotate(0deg) scale(1);',
    '    opacity: 0.92;',
    '  }',
    '  25% {',
    '    transform: rotate(-8deg) scale(1.02);',
    '    opacity: 0.98;',
    '  }',
    '  50% {',
    '    transform: rotate(0deg) scale(1.04);',
    '    opacity: 1;',
    '  }',
    '  75% {',
    '    transform: rotate(8deg) scale(1.02);',
    '    opacity: 0.98;',
    '  }',
    '  100% {',
    '    transform: rotate(0deg) scale(1);',
    '    opacity: 0.92;',
    '  }',
    '}',
    '/* Keyframe: Icon Box subtle pulse */',
    '@keyframes tsMntBoxPulse {',
    '  0%, 100% {',
    '    border-color: rgba(255, 149, 0, 0.22);',
    '    background: rgba(255, 149, 0, 0.08);',
    '    box-shadow: 0 0 0 0 rgba(255, 149, 0, 0);',
    '  }',
    '  50% {',
    '    border-color: rgba(255, 149, 0, 0.44);',
    '    background: rgba(255, 149, 0, 0.13);',
    '    box-shadow: 0 0 16px rgba(255, 149, 0, 0.14);',
    '  }',
    '}',
    '/* Keyframe: Badge soft pulse */',
    '@keyframes tsMntBadgePulse {',
    '  0%, 100% {',
    '    opacity: 1;',
    '    border-color: rgba(255, 149, 0, 0.22);',
    '    box-shadow: 0 0 0 0 rgba(255, 149, 0, 0);',
    '  }',
    '  50% {',
    '    opacity: 0.76;',
    '    border-color: rgba(255, 149, 0, 0.38);',
    '    box-shadow: 0 0 10px rgba(255, 149, 0, 0.12);',
    '  }',
    '}',
    '/* Keyframe: Ambient radial glow breathing */',
    '@keyframes tsMntAmbient {',
    '  0%, 100% {',
    '    transform: translate(-50%, -55%) scale(0.92);',
    '    opacity: 0.65;',
    '  }',
    '  50% {',
    '    transform: translate(-50%, -55%) scale(1.12);',
    '    opacity: 1;',
    '  }',
    '}',
    '/* Accessibility: prefers-reduced-motion */',
    '@media (prefers-reduced-motion: reduce) {',
    '  .tsuf-mnt-ambient,',
    '  .tsuf-mnt-ic,',
    '  .tsuf-mnt-ic svg,',
    '  .tsuf-mnt-badge,',
    '  .tsuf-mnt-fade-1,',
    '  .tsuf-mnt-fade-2,',
    '  .tsuf-mnt-fade-3,',
    '  .tsuf-mnt-fade-4,',
    '  .tsuf-mnt-fade-5 {',
    '    animation: none !important;',
    '    transition: none !important;',
    '    transform: none !important;',
    '    opacity: 1 !important;',
    '  }',
    '}'
  ].join('\n');

  function _injectCSS() {
    if (document.getElementById('tsuf-mnt-css')) return;
    var s = document.createElement('style');
    s.id = 'tsuf-mnt-css';
    s.textContent = MNT_CSS;
    document.head.appendChild(s);
  }

  /**
   * Reusable HTML Generator for Maintenance state.
   * Usable for both full-page direct visits and modal iframe srcdoc.
   */
  function generateMaintenanceHTML(featureId, options) {
    options = options || {};
    var featureName = options.featureName || getFeatureName(featureId) || 'Fitur';
    var message     = options.message || getMaintenanceMessage(featureId);
    var isDark      = options.isDark !== undefined ? !!options.isDark : (localStorage.getItem('theme') !== 'light');
    var showHomeBtn = options.showHomeBtn !== undefined ? !!options.showHomeBtn : false;
    var homeUrl     = options.homeUrl || '/';

    var homeBtnHTML = showHomeBtn
      ? '<div class="tsuf-mnt-fade-5">' +
          '<a href="' + homeUrl + '" class="tsuf-mnt-btn">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
              '<path d="M19 12H5"/><polyline points="12 19 5 12 12 5"/>' +
            '</svg>' +
            'Kembali ke Beranda' +
          '</a>' +
        '</div>'
      : '';

    var wrenchSvg =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' +
        '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>' +
      '</svg>';

    var badgeSvg =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
        '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>' +
      '</svg>';

    var html =
      '<!DOCTYPE html>' +
      '<html lang="id" class="' + (isDark ? 'dark' : '') + '">' +
      '<head>' +
        '<meta charset="UTF-8">' +
        '<meta name="viewport" content="width=device-width, initial-scale=1.0">' +
        '<title>Maintenance — ' + featureName + '</title>' +
        '<style>' +
          'html, body { margin: 0; padding: 0; width: 100%; height: 100%; background: ' + (isDark ? '#0A0A0C' : '#F5F5F7') + '; overflow: hidden; }' +
          MNT_CSS +
        '</style>' +
      '</head>' +
      '<body>' +
        '<div class="tsuf-mnt-ov' + (isDark ? '' : ' light') + '">' +
          '<div class="tsuf-mnt-ambient" aria-hidden="true"></div>' +
          '<div class="tsuf-mnt-card">' +
            '<div class="tsuf-mnt-fade-1 tsuf-mnt-ic-wrap">' +
              '<div class="tsuf-mnt-ic" title="Dalam Pemeliharaan">' +
                wrenchSvg +
              '</div>' +
            '</div>' +
            '<div class="tsuf-mnt-fade-2">' +
              '<div class="tsuf-mnt-feat">' + featureName + '</div>' +
              '<div class="tsuf-mnt-badge-wrap">' +
                '<div class="tsuf-mnt-badge">' +
                  badgeSvg +
                  '<span>Maintenance</span>' +
                '</div>' +
              '</div>' +
            '</div>' +
            '<h1 class="tsuf-mnt-h tsuf-mnt-fade-3">Fitur Sedang Dikembangkan</h1>' +
            '<p class="tsuf-mnt-p tsuf-mnt-fade-4">' + message + '</p>' +
            homeBtnHTML +
          '</div>' +
        '</div>' +
      '</body>' +
      '</html>';

    return html;
  }

  /**
   * Render full-screen maintenance page in current document.
   * Sets window.__TOOLSUF_MAINTENANCE__ = true to block tool init.
   */
  function showMaintenancePage(featureId) {
    global.__TOOLSUF_MAINTENANCE__ = true;

    var featureName = getFeatureName(featureId);
    var message     = getMaintenanceMessage(featureId);
    var isDark      = !(localStorage.getItem('theme') === 'light');

    function _render() {
      if (document.getElementById('tsuf-mnt-ov')) return;
      _injectCSS();

      var ov = document.createElement('div');
      ov.id        = 'tsuf-mnt-ov';
      ov.className = 'tsuf-mnt-ov' + (isDark ? '' : ' light');
      ov.innerHTML =
        '<div class="tsuf-mnt-ambient" aria-hidden="true"></div>' +
        '<div class="tsuf-mnt-card">' +
          '<div class="tsuf-mnt-fade-1 tsuf-mnt-ic-wrap">' +
            '<div class="tsuf-mnt-ic" title="Dalam Pemeliharaan">' +
              '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' +
                '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>' +
              '</svg>' +
            '</div>' +
          '</div>' +
          '<div class="tsuf-mnt-fade-2">' +
            '<div class="tsuf-mnt-feat">' + featureName + '</div>' +
            '<div class="tsuf-mnt-badge-wrap">' +
              '<div class="tsuf-mnt-badge">' +
                '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
                  '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>' +
                '</svg>' +
                '<span>Maintenance</span>' +
              '</div>' +
            '</div>' +
          '</div>' +
          '<h1 class="tsuf-mnt-h tsuf-mnt-fade-3">Fitur Sedang Dikembangkan</h1>' +
          '<p class="tsuf-mnt-p tsuf-mnt-fade-4">' + message + '</p>' +
          '<div class="tsuf-mnt-fade-5">' +
            '<a href="/" class="tsuf-mnt-btn">' +
              '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
                '<path d="M19 12H5"/><polyline points="12 19 5 12 12 5"/>' +
              '</svg>' +
              'Kembali ke Beranda' +
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
  }

  /**
   * Auto-detect feature from URL and show maintenance if active.
   * @returns {boolean}
   */
  function checkCurrentPageMaintenance() {
    var featureId = _detectFeatureFromPath();
    if (!featureId) return false;
    if (isFeatureMaintenance(featureId)) {
      showMaintenancePage(featureId);
      return true;
    }
    return false;
  }

  function _handleConfigChange() {
    var featureId = _detectFeatureFromPath();
    if (featureId) {
      var isMnt = isFeatureMaintenance(featureId);
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
  // REAL-TIME CROSS-TAB & CROSS-FRAME SYNCHRONIZATION
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

  // ============================================================
  // AUTO-RUN on script load (synchronous - before tool init)
  // ============================================================
  checkCurrentPageMaintenance();

  // ============================================================
  // EXPORT
  // ============================================================
  global.ToolSufMaintenance = {
    isFeatureMaintenance:        isFeatureMaintenance,
    setFeatureMaintenance:       setFeatureMaintenance,
    setGlobalMaintenance:        setGlobalMaintenance,
    getConfig:                   getConfig,
    getDefaults:                 getDefaults,
    getFeatureName:              getFeatureName,
    getMaintenanceMessage:       getMaintenanceMessage,
    generateMaintenanceHTML:     generateMaintenanceHTML,
    showMaintenancePage:         showMaintenancePage,
    checkCurrentPageMaintenance: checkCurrentPageMaintenance,
    PATH_TO_FEATURE:             PATH_TO_FEATURE
  };

}(window));
