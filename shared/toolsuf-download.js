/**
 * ToolSuf — Centralized Global File Download & Naming Utility
 *
 * Standar format penamaan file global:
 *   toolsuf-[original-filename]-[feature-name].[extension]
 *
 * Menjamin:
 * 1. Selalu berawalan 'toolsuf-'
 * 2. Mempertahankan nama file asli tanpa UUID
 * 3. Menggunakan slug nama fitur yang konsisten
 * 4. Ekstensi mengikuti format output sebenarnya
 * 5. Sanitasi karakter terlarang di Windows/macOS/Linux
 * 6. Anti-duplikasi (tidak ada toolsuf-toolsuf atau feature-feature ganda)
 * 7. Tepat satu file download per aksi
 */

(function(global) {
  'use strict';

  // Pemetaan resmi slug fitur ToolSuf
  const FEATURE_SLUGS = {
    'background-remover': 'remove-bg',
    'remove-bg': 'remove-bg',
    'image-compressor': 'image-compressor',
    'media-compressor': 'image-compressor',
    'pdf-compressor': 'pdf-compressor',
    'image-to-pdf': 'image-to-pdf',
    'pdf-to-docs': 'pdf-to-docs',
    'watermark-remover': 'watermark-remover',
    'metadata-cleaner': 'metadata-cleaner',
    'qr-code-master': 'qr-code-master',
    'uhd-video-upscaler': 'uhd-video-upscaler',
    'video-to-uhd': 'uhd-video-upscaler',
    'batch-renamer': 'batch-renamer-pro',
    'batch-renamer-pro': 'batch-renamer-pro',
    'password-generator': 'password-generator',
    'ai-workflow-assistant': 'ai-workflow-assistant',
    'web-monitor': 'web-monitor'
  };

  // Fallback nama default untuk tools tanpa file input
  const DEFAULT_FILE_NAMES = {
    'qr-code-master': 'qr-code',
    'password-generator': 'passwords',
    'ai-workflow-assistant': 'workflow',
    'web-monitor': 'sites',
    'batch-renamer-pro': 'renamed-files',
    'batch-renamer': 'renamed-files'
  };

  /**
   * Sanitasi dan bersihkan nama file asli.
   * Menghilangkan path, ekstensi lama, prefix 'toolsuf-', suffix teknis lama,
   * dan karakter terlarang OS.
   *
   * @param {string} rawName
   * @param {string} featureSlug
   * @returns {string}
   */
  function sanitizeBaseName(rawName, featureSlug) {
    if (!rawName || typeof rawName !== 'string') return '';

    let name = rawName.trim();

    // Ambil nama file dari path bila ada
    name = name.split(/[/\\]/).pop() || '';

    // Buang ekstensi di akhir file (.pdf, .jpg, .png, dsb.)
    name = name.replace(/\.[^/.]+$/, '');

    // Hapus prefix toolsuf- jika sudah ada agar tidak duplikat
    while (name.toLowerCase().startsWith('toolsuf-')) {
      name = name.slice(8);
    }

    // Hapus suffix teknis lama: -compressed, _compressed, _clean, _no_bg, _files, _UHD, dsb.
    name = name.replace(/[-_](compressed|clean|no[-_]bg|files|uhd|no_bg)$/i, '');

    // Hapus slug fitur dari akhir jika sudah ada agar tidak terulang
    if (featureSlug) {
      const escaped = featureSlug.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
      const featureRegex = new RegExp(`[-_]${escaped}$`, 'i');
      name = name.replace(featureRegex, '');
    }

    // Sanitasi karakter ilegal di OS (Windows/Mac/Linux): / \ : * ? " < > |
    name = name.replace(/[/\\?%*:|"<>]/g, '');

    // Bersihkan multiple spasi dan trim
    name = name.replace(/\s+/g, ' ').trim();

    return name;
  }

  /**
   * Hasilkan nama file resmi ToolSuf:
   *   toolsuf-[original-filename]-[feature-name].[extension]
   *
   * @param {Object} opts
   * @param {string} [opts.originalName] - Nama file input asli
   * @param {string} opts.featureName    - Nama / slug fitur (misal 'background-remover')
   * @param {string} [opts.extension]    - Ekstensi output (misal 'png', 'pdf', 'docx')
   * @param {string} [opts.defaultName]  - Fallback nama jika originalName kosong
   * @returns {string}
   */
  function generateFilename(opts) {
    if (!opts) opts = {};

    const rawFeature = (opts.featureName || '').toLowerCase().trim();
    const featureSlug = FEATURE_SLUGS[rawFeature] || rawFeature.replace(/\s+/g, '-').replace(/[^a-z0-9\-]/g, '') || 'toolsuf';

    // Bersihkan base nama asli
    let base = sanitizeBaseName(opts.originalName, featureSlug);

    // Jika kosong, gunakan defaultName atau fallback fitur
    if (!base) {
      base = opts.defaultName || DEFAULT_FILE_NAMES[featureSlug] || 'file';
      base = sanitizeBaseName(base, featureSlug);
    }

    // Ekstensi yang rapi (tanpa titik di awal)
    let ext = (opts.extension || '').trim().replace(/^\./, '').toLowerCase();
    if (!ext && opts.originalName && opts.originalName.includes('.')) {
      ext = opts.originalName.split('.').pop().toLowerCase();
    }
    if (!ext) ext = 'bin';

    return `toolsuf-${base}-${featureSlug}.${ext}`;
  }

  /**
   * Eksekusi download file ke perangkat pengguna secara aman & konsisten.
   * Mendukung Blob, Data URL, ArrayBuffer, atau Object URL.
   *
   * @param {Object} params
   * @param {Blob|ArrayBuffer|string} [params.blob]
   * @param {string} [params.url]
   * @param {ArrayBuffer} [params.buffer]
   * @param {string} [params.originalName]
   * @param {string} params.featureName
   * @param {string} [params.extension]
   * @param {string} [params.defaultName]
   * @param {string} [params.filename] - Override nama file langsung jika sudah diformat
   * @param {string} [params.mimeType]
   * @returns {Promise<string>} Mengembalikan nama file yang diunduh
   */
  async function downloadFile(params) {
    if (!params) throw new Error('ToolSufDownload: Parameter tidak boleh kosong.');

    // Tentukan ekstensi aktual
    let ext = params.extension;
    if (!ext && params.filename && params.filename.includes('.')) {
      ext = params.filename.split('.').pop();
    }

    // Hasilkan nama file terstandarisasi
    const finalFilename = params.filename && params.filename.startsWith('toolsuf-')
      ? params.filename
      : generateFilename({
          originalName: params.originalName || params.filename,
          featureName: params.featureName,
          extension: ext,
          defaultName: params.defaultName
        });

    // Normalisasi Blob
    let blob = params.blob;
    if (!blob && params.buffer) {
      blob = new Blob([params.buffer], { type: params.mimeType || 'application/octet-stream' });
    }

    // 1. Delegasi ke parent window (app.js) bila berada di dalam iframe modal ToolSuf
    if (window.parent && window.parent !== window) {
      try {
        let buffer = params.buffer;
        if (!buffer && blob instanceof Blob) {
          buffer = await blob.arrayBuffer();
        }
        window.parent.postMessage({
          type: 'downloadFile',
          filename: finalFilename,
          blob: blob,
          buffer: buffer,
          url: params.url,
          mime: params.mimeType || (blob && blob.type) || undefined
        }, '*');
        return finalFilename;
      } catch (err) {
        console.warn('ToolSufDownload: postMessage ke parent gagal, menggunakan direct download:', err);
      }
    }

    // 2. Direct Download via Blob / URL
    let downloadUrl = params.url;
    let shouldRevoke = false;

    if (!downloadUrl && blob) {
      downloadUrl = URL.createObjectURL(blob);
      shouldRevoke = true;
    }

    if (!downloadUrl) {
      throw new Error('ToolSufDownload: Blob atau URL download tidak ditemukan.');
    }

    const a = document.createElement('a');
    a.style.position = 'fixed';
    a.style.left = '-9999px';
    a.style.top = '-9999px';
    a.href = downloadUrl;
    a.download = finalFilename;
    a.setAttribute('download', finalFilename);
    document.body.appendChild(a);
    a.click();

    setTimeout(() => {
      try {
        if (a.parentNode) a.parentNode.removeChild(a);
      } catch (e) {}
      if (shouldRevoke) URL.revokeObjectURL(downloadUrl);
    }, 15000);

    return finalFilename;
  }

  // --- Centralized Feature Usage Tracker (Section 4) ---
  const _recentSends = new Map();
  const DEBOUNCE_MS = 2500;

  async function trackFeatureUsage(featureId, action, metadata = {}) {
    if (!featureId || !action) {
      console.warn('[trackFeatureUsage] featureId and action are required.');
      return { success: false, error: 'featureId and action required' };
    }

    const cleanId = String(featureId).toLowerCase().trim();
    const cleanAction = String(action).toLowerCase().trim();
    const now = Date.now();
    const debounceKey = `${cleanId}:${cleanAction}`;

    if (_recentSends.has(debounceKey)) {
      const lastTime = _recentSends.get(debounceKey);
      if (now - lastTime < DEBOUNCE_MS) {
        return { success: true, throttled: true, usageRecorded: true };
      }
    }
    _recentSends.set(debounceKey, now);

    const eventId = 'evt-' + now + '-' + Math.random().toString(36).substring(2, 9);
    const timestamp = new Date().toISOString();

    const payload = {
      featureId: cleanId,
      action: cleanAction,
      metadata: metadata || {},
      timestamp,
      eventId
    };

    let apiBase = '';
    try {
      if (typeof window !== 'undefined') {
        const origin = window.location.origin;
        if (origin && !origin.startsWith('file:') && !origin.startsWith('null')) {
          apiBase = origin;
        }
      }
    } catch (e) {}
    if (!apiBase) apiBase = 'http://localhost:3001';

    try {
      const response = await fetch(`${apiBase}/api/usage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const resData = await response.json();
        return resData;
      } else {
        const errText = await response.text();
        console.warn('[trackFeatureUsage] Server returned status:', response.status, errText);
        return { success: true, usageRecorded: false, error: `HTTP ${response.status}` };
      }
    } catch (netErr) {
      console.warn('[trackFeatureUsage] Request failed silently (feature continues):', netErr.message);
      return { success: true, usageRecorded: false, error: netErr.message };
    }
  }

  // Ekspos ke global scope
  const ToolSufDownload = {
    FEATURE_SLUGS,
    generateFilename,
    downloadFile,
    sanitizeBaseName,
    trackFeatureUsage
  };

  global.ToolSufDownload = ToolSufDownload;
  global.downloadFile = downloadFile;
  global.trackFeatureUsage = trackFeatureUsage;
  if (typeof window !== 'undefined' && window.parent && window.parent !== window) {
    try {
      window.parent.trackFeatureUsage = trackFeatureUsage;
    } catch (e) {}
  }

})(typeof window !== 'undefined' ? window : globalThis);
