const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');
const USAGE_FILE = path.join(DATA_DIR, 'feature-usage.json');

// Canonical Feature Registry & Human-Friendly Names
const FEATURE_REGISTRY = {
  'pdf-compressor': { name: 'PDF Compressor', defaultAction: 'Compress PDF' },
  'qr-code-master': { name: 'QR Generator', defaultAction: 'Generate QR' },
  'qr-generator': { name: 'QR Generator', defaultAction: 'Generate QR' },
  'pdf-scanner': { name: 'PDF Scanner', defaultAction: 'Scan Document' },
  'background-remover': { name: 'Background Remover', defaultAction: 'Remove Background' },
  'bg-remover': { name: 'Background Remover', defaultAction: 'Remove Background' },
  'media-compressor': { name: 'Media Compressor', defaultAction: 'Compress Media' },
  'image-compressor': { name: 'Image Compressor', defaultAction: 'Compress Image' },
  'image-to-pdf': { name: 'Image to PDF', defaultAction: 'Convert Image to PDF' },
  'pdf-to-docs': { name: 'PDF to Docs', defaultAction: 'Convert PDF to Docs' },
  'password-generator': { name: 'Password Generator', defaultAction: 'Generate Password' },
  'batch-renamer': { name: 'Batch Renamer Pro', defaultAction: 'Rename Files' },
  'batch-renamer-pro': { name: 'Batch Renamer Pro', defaultAction: 'Rename Files' },
  'metadata-cleaner': { name: 'Metadata Cleaner', defaultAction: 'Clean Metadata' },
  'watermark-remover': { name: 'Watermark Remover', defaultAction: 'Remove Watermark' },
  'video-to-uhd': { name: 'UHD Video Upscaler', defaultAction: 'Upscale Video' },
  'ai-workflow-assistant': { name: 'AI Workflow Assistant', defaultAction: 'Execute Workflow' },
  'web-monitor': { name: 'Web Monitor', defaultAction: 'Check Website' }
};

// In-Memory Idempotency & Debounce Cache (stores eventId / action hash -> timestamp)
const recentEventsCache = new Map();
const IDEMPOTENCY_WINDOW_MS = 5 * 60 * 1000; // 5 menit deduplikasi eventId
const DEBOUNCE_WINDOW_MS = 2500; // 2.5 detik pencegahan double click pada aksi identik

class UsageService {
  constructor() {
    this.ensureDataFile();
  }

  ensureDataFile() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (!fs.existsSync(USAGE_FILE)) {
        const initial = {
          events: [],
          counts: {}
        };
        fs.writeFileSync(USAGE_FILE, JSON.stringify(initial, null, 2), 'utf8');
      }
    } catch (err) {
      console.warn('[UsageService] ensureDataFile warning:', err.message);
    }
  }

  loadData() {
    this.ensureDataFile();
    try {
      if (fs.existsSync(USAGE_FILE)) {
        const raw = fs.readFileSync(USAGE_FILE, 'utf8');
        const data = JSON.parse(raw);
        return {
          events: Array.isArray(data.events) ? data.events : [],
          counts: (typeof data.counts === 'object' && data.counts) ? data.counts : {}
        };
      }
    } catch (err) {
      console.warn('[UsageService] loadData error, returning fallback:', err.message);
    }
    return { events: [], counts: {} };
  }

  saveData(data) {
    try {
      fs.writeFileSync(USAGE_FILE, JSON.stringify(data, null, 2), 'utf8');
    } catch (err) {
      console.error('[UsageService] saveData error:', err.message);
    }
  }

  /**
   * Helper format waktu ke format WITA (Asia/Makassar):
   * Contoh: "28 September 2026, 18:24 WITA"
   */
  formatTimeWITA(dateInput) {
    try {
      const d = dateInput ? new Date(dateInput) : new Date();
      if (isNaN(d.getTime())) return new Date().toISOString();

      const dateFormatter = new Intl.DateTimeFormat('id-ID', {
        timeZone: process.env.REPORT_TIMEZONE || 'Asia/Makassar',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
      const timeFormatter = new Intl.DateTimeFormat('id-ID', {
        timeZone: process.env.REPORT_TIMEZONE || 'Asia/Makassar',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });

      return `${dateFormatter.format(d)}, ${timeFormatter.format(d).replace('.', ':')} WITA`;
    } catch (e) {
      return new Date().toISOString();
    }
  }

  /**
   * Filter dan sanitasi metadata untuk keamanan privasi:
   * Menolak kata sandi, token, file data, dan kredensial sensitif.
   */
  sanitizeMetadata(rawMetadata = {}) {
    if (!rawMetadata || typeof rawMetadata !== 'object') return {};
    const sanitized = {};
    const SENSITIVE_KEYS = [
      'password', 'pass', 'token', 'secret', 'auth', 'credential',
      'base64', 'filecontent', 'content', 'blob', 'buffer', 'key'
    ];

    for (const [k, v] of Object.entries(rawMetadata)) {
      const lowerKey = k.toLowerCase();
      const isSensitive = SENSITIVE_KEYS.some(sk => lowerKey.includes(sk));
      if (!isSensitive) {
        if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') {
          sanitized[k] = v;
        } else if (v && typeof v === 'object' && !Array.isArray(v)) {
          sanitized[k] = this.sanitizeMetadata(v);
        }
      }
    }
    return sanitized;
  }

  /**
   * Resolusi nama fitur yang stabil dan ramah pengguna
   */
  resolveFeatureInfo(featureId, action) {
    const cleanId = String(featureId || '').toLowerCase().trim();
    const reg = FEATURE_REGISTRY[cleanId];
    if (reg) {
      return {
        featureId: cleanId,
        featureName: reg.name,
        actionLabel: action || reg.defaultAction
      };
    }

    // Default formatter jika ada fitur baru tak terdaftar
    const titleCase = cleanId
      .split(/[-_]/)
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');

    return {
      featureId: cleanId,
      featureName: titleCase || 'Feature',
      actionLabel: action || 'Execute'
    };
  }

  /**
   * 1. RECORD FEATURE USAGE KE DATABASE (Section 4 & 12)
   * Menyimpan data penggunaan ke database lokal.
   * Dilengkapi mekanisme idempotency & anti-duplicate email akibat double click.
   */
  recordFeatureUsage(payload = {}) {
    const {
      featureId,
      action,
      metadata = {},
      timestamp,
      eventId,
      clientIp = '',
      userAgent = ''
    } = payload;

    if (!featureId || typeof featureId !== 'string') {
      throw new Error('Valid featureId is required');
    }
    if (!action || typeof action !== 'string') {
      throw new Error('Valid action is required');
    }

    const { featureId: canonicalId, featureName, actionLabel } = this.resolveFeatureInfo(featureId, action);
    const safeMetadata = this.sanitizeMetadata(metadata);
    const now = Date.now();

    // 1. CEK IDEMPOTENCY BERDASARKAN eventId
    if (eventId && recentEventsCache.has(eventId)) {
      const cached = recentEventsCache.get(eventId);
      return {
        record: cached,
        isDuplicate: true,
        reason: 'eventId_already_recorded'
      };
    }

    // 2. CEK ANTI-DOUBLE CLICK DEBOUNCE (Fitur yang sama, aksi yang sama, client yang sama dalam 2.5 detik)
    const debounceKey = `${clientIp}_${canonicalId}_${action}`;
    if (recentEventsCache.has(debounceKey)) {
      const lastTime = recentEventsCache.get(debounceKey);
      if (now - lastTime < DEBOUNCE_WINDOW_MS) {
        return {
          record: null,
          isDuplicate: true,
          reason: 'double_click_throttled'
        };
      }
    }
    recentEventsCache.set(debounceKey, now);

    // Bersihkan cache yang melebihi usia window
    for (const [key, val] of recentEventsCache.entries()) {
      if (typeof val === 'number' && (now - val > IDEMPOTENCY_WINDOW_MS)) {
        recentEventsCache.delete(key);
      }
    }

    const data = this.loadData();
    const eventTime = timestamp ? new Date(timestamp).toISOString() : new Date().toISOString();
    const recordId = 'usage-' + now + '-' + Math.random().toString(36).substring(2, 8);

    const record = {
      id: recordId,
      eventId: eventId || recordId,
      featureId: canonicalId,
      featureName,
      action,
      actionLabel,
      timestamp: eventTime,
      metadata: safeMetadata,
      clientIp,
      status: 'Berhasil',
      notificationSent: false,
      emailError: null,
      createdAt: new Date().toISOString()
    };

    // Tambah ke list event dan perbarui hitungan agregat
    data.events.push(record);
    data.counts[canonicalId] = (data.counts[canonicalId] || 0) + 1;

    // Simpan maksimal 5000 event riwayat untuk efisiensi
    if (data.events.length > 5000) {
      data.events = data.events.slice(-5000);
    }

    this.saveData(data);

    if (eventId) {
      recentEventsCache.set(eventId, record);
    }

    return {
      record,
      isDuplicate: false
    };
  }

  /**
   * Tandai status notifikasi email pada event penggunaan di database
   */
  updateRecordNotificationStatus(recordId, success, errorMsg = null) {
    try {
      const data = this.loadData();
      const target = data.events.find(e => e.id === recordId);
      if (target) {
        target.notificationSent = Boolean(success);
        target.emailError = errorMsg ? String(errorMsg) : null;
        this.saveData(data);
      }
    } catch (e) {
      console.warn('[UsageService] updateRecordNotificationStatus error:', e.message);
    }
  }

  /**
   * 2. SEND FEATURE USAGE NOTIFICATION VIA SMTP (Section 6 & 12)
   * Mengirim email real-time langsung ke admin.
   */
  async sendFeatureUsageNotification(record) {
    const emailProvider = require('./email-provider');
    const config = emailProvider.getConfig();
    const recipient = config.recipient;

    const formattedWaktu = this.formatTimeWITA(record.timestamp);
    const subject = `[Web Monitor] Fitur Digunakan — ${record.featureName}`;

    // Render baris metadata jika ada
    let metadataHtml = '';
    if (record.metadata && Object.keys(record.metadata).length > 0) {
      const metaRows = Object.entries(record.metadata)
        .map(([k, v]) => `
          <tr style="border-bottom: 1px solid #1E1E24;">
            <td style="padding: 8px 0; color: #8E8E93; text-transform: capitalize;">${k.replace(/([A-Z])/g, ' $1')}</td>
            <td style="padding: 8px 0; color: #FCFCFD;">${v}</td>
          </tr>
        `).join('');

      metadataHtml = `
        <tr style="border-bottom: 1px solid #1E1E24;">
          <td colspan="2" style="padding: 12px 0 6px 0; font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #8E8E93;">
            INFORMASI TAMBAHAN
          </td>
        </tr>
        ${metaRows}
      `;
    }

    const htmlBody = `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Notifikasi Penggunaan Fitur</title>
</head>
<body style="margin: 0; padding: 24px 12px; background-color: #0A0A0C; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #FCFCFD; -webkit-font-smoothing: antialiased;">
  <div style="max-width: 540px; margin: 0 auto; background-color: #121215; border: 1px solid #23232A; border-radius: 14px; padding: 28px 24px; box-shadow: 0 8px 30px rgba(0,0,0,0.45);">
    
    <!-- Header -->
    <div style="border-bottom: 1px solid #23232A; padding-bottom: 16px; margin-bottom: 20px;">
      <div style="font-size: 11px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: #0A84FF; margin-bottom: 4px;">
        WEB MONITOR
      </div>
      <h1 style="font-size: 18px; font-weight: 700; color: #FCFCFD; margin: 0 0 6px 0;">
        Notifikasi Penggunaan Fitur
      </h1>
      <p style="font-size: 13px; color: #8E8E93; margin: 0; line-height: 1.5;">
        Ada penggunaan fitur baru pada Web Monitor.
      </p>
    </div>

    <!-- Table Details (Section 6 & 7) -->
    <table style="width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 20px;">
      <tr style="border-bottom: 1px solid #1E1E24;">
        <td style="padding: 10px 0; color: #8E8E93; width: 38%;">Fitur:</td>
        <td style="padding: 10px 0; font-weight: 600; color: #FCFCFD;">${record.featureName}</td>
      </tr>
      <tr style="border-bottom: 1px solid #1E1E24;">
        <td style="padding: 10px 0; color: #8E8E93;">ID Fitur:</td>
        <td style="padding: 10px 0; font-family: monospace; font-size: 12px; color: #A1A1AA;">${record.featureId}</td>
      </tr>
      <tr style="border-bottom: 1px solid #1E1E24;">
        <td style="padding: 10px 0; color: #8E8E93;">Aksi:</td>
        <td style="padding: 10px 0; font-weight: 600; color: #FCFCFD;">${record.actionLabel || record.action}</td>
      </tr>
      <tr style="border-bottom: 1px solid #1E1E24;">
        <td style="padding: 10px 0; color: #8E8E93;">Waktu:</td>
        <td style="padding: 10px 0; color: #FCFCFD;">${formattedWaktu}</td>
      </tr>
      <tr style="border-bottom: 1px solid #1E1E24;">
        <td style="padding: 10px 0; color: #8E8E93;">Status:</td>
        <td style="padding: 10px 0; font-weight: 700; color: #30D158;">${record.status || 'Berhasil'}</td>
      </tr>
      ${metadataHtml}
    </table>

    <!-- Footer -->
    <div style="border-top: 1px solid #23232A; padding-top: 16px; font-size: 11px; color: #636366; text-align: center;">
      <p style="margin: 0 0 2px 0;">Dikirim otomatis oleh sistem notifikasi Web Monitor.</p>
      <p style="margin: 0;">Zona waktu: Asia/Makassar (WITA, UTC+8)</p>
    </div>

  </div>
</body>
</html>
    `.trim();

    const mailOptions = {
      from: config.from,
      to: recipient,
      subject,
      html: htmlBody
    };

    try {
      const sendResult = await emailProvider.sendMailWithRetry(mailOptions, 3);
      if (sendResult.success) {
        this.updateRecordNotificationStatus(record.id, true, null);
        console.log(`[USAGE] ${record.featureId} / ${record.action}`);
        console.log(`[EMAIL] notification sent`);
        return { success: true };
      } else {
        this.updateRecordNotificationStatus(record.id, false, sendResult.error);
        console.log(`[USAGE] ${record.featureId} / ${record.action}`);
        console.warn(`[EMAIL] notification failed: ${sendResult.error}`);
        return { success: false, error: sendResult.error };
      }
    } catch (err) {
      this.updateRecordNotificationStatus(record.id, false, err.message);
      console.log(`[USAGE] ${record.featureId} / ${record.action}`);
      console.warn(`[EMAIL] notification failed: ${err.message}`);
      return { success: false, error: err.message };
    }
  }

  /**
   * Mengambil rekapitulasi data penggunaan untuk rentang tanggal tertentu (digunakan oleh Weekly Report)
   */
  getFeatureUsageSummary(periodStart = null, periodEnd = null) {
    const data = this.loadData();
    const events = data.events;

    let filtered = events;
    if (periodStart && periodEnd) {
      const s = new Date(periodStart).getTime();
      const e = new Date(periodEnd).getTime();
      filtered = events.filter(ev => {
        const t = new Date(ev.timestamp).getTime();
        return t >= s && t <= e;
      });
    }

    const byFeature = {};
    let totalUsage = 0;

    filtered.forEach(ev => {
      const fid = ev.featureId;
      if (!byFeature[fid]) {
        byFeature[fid] = {
          featureId: fid,
          featureName: ev.featureName || fid,
          count: 0
        };
      }
      byFeature[fid].count++;
      totalUsage++;
    });

    const featureList = Object.values(byFeature).sort((a, b) => b.count - a.count);

    return {
      byFeature,
      featureList,
      totalUsage,
      periodStart,
      periodEnd
    };
  }

  /**
   * Reset seluruh riwayat penggunaan (untuk testing / admin reset)
   */
  resetAllUsage() {
    const fresh = { events: [], counts: {} };
    this.saveData(fresh);
    recentEventsCache.clear();
    return fresh;
  }
}

const instance = new UsageService();
module.exports = instance;
