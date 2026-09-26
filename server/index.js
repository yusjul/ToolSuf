const http = require('http');
const path = require('path');
const dotenv = require('dotenv');

// Muat environment variables dari .env di root project
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const monitorService = require('./monitor-service');
const reportGenerator = require('./report-generator');
const emailProvider = require('./email-provider');
const scheduler = require('./scheduler');

const PORT = parseInt(process.env.PORT || '3001', 10);

// Helper untuk parse JSON body pada HTTP request
function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch (err) {
        reject(new Error('Invalid JSON Body'));
      }
    });
    req.on('error', reject);
  });
}

// Helper kirim JSON response dengan CORS headers
function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  });
  res.end(JSON.stringify(data));
}

// Helper parser User-Agent di sisi server (Fallback jika client tidak mengirim)
function parseUserAgentServer(ua = '') {
  let device = 'Unknown Device';
  let os = 'Unknown';
  let type = 'desktop';

  // 1. iPhone
  if (/iPhone|iPod/i.test(ua)) {
    device = 'iPhone';
    os = 'iOS';
    type = 'mobile';
  }
  // 2. iPad
  else if (/iPad/i.test(ua)) {
    device = 'iPad';
    os = 'iPadOS';
    type = 'tablet';
  }
  // 3. Android
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
  // 4. Windows
  else if (/Windows NT|Windows/i.test(ua)) {
    device = 'Windows PC';
    if (/Windows NT 10\.0/i.test(ua)) os = 'Windows 11';
    else if (/Windows NT 6\.3/i.test(ua)) os = 'Windows 8.1';
    else if (/Windows NT 6\.2/i.test(ua)) os = 'Windows 8';
    else if (/Windows NT 6\.1/i.test(ua)) os = 'Windows 7';
    else os = 'Windows';
    type = 'desktop';
  }
  // 5. macOS
  else if (/Macintosh|Mac OS X/i.test(ua)) {
    device = 'MacBook';
    os = 'macOS';
    type = 'laptop';
  }
  // 6. Linux
  else if (/Linux|X11/i.test(ua)) {
    device = 'Linux';
    os = 'Linux';
    type = 'desktop';
  }

  // Browser parser
  let browser = 'Browser';
  if (/CriOS\/(\d+(\.\d+)?)/i.test(ua)) browser = 'Chrome';
  else if (/FxiOS\/(\d+(\.\d+)?)/i.test(ua)) browser = 'Firefox';
  else if (/EdgiOS\/(\d+(\.\d+)?)/i.test(ua)) browser = 'Edge';
  else if (/EdgA?\/(\d+(\.\d+)?)/i.test(ua)) browser = 'Edge';
  else if (/SamsungBrowser\/(\d+(\.\d+)?)/i.test(ua)) browser = 'Samsung Internet';
  else if (/OPR\/(\d+(\.\d+)?)|Opera/i.test(ua)) browser = 'Opera';
  else if (/Chrome\/(\d+(\.\d+)?)/i.test(ua)) browser = 'Chrome';
  else if (/Firefox\/(\d+(\.\d+)?)/i.test(ua)) browser = 'Firefox';
  else if (/Version\/(\d+(\.\d+)?).*Safari/i.test(ua) || /Safari/i.test(ua)) browser = 'Safari';

  return { device, os, browser, type };
}

// Active Devices / Sessions Registry
const activeDevices = new Map();
const toolUsageThrottle = new Map();

function pruneInactiveDevices() {
  const cutoff = Date.now() - 3 * 60 * 1000; // 3 menit tidak ada heartbeat dianggap offline
  for (const [id, dev] of activeDevices.entries()) {
    if (new Date(dev.lastSeen).getTime() < cutoff) {
      activeDevices.delete(id);
    }
  }
}

const server = http.createServer(async (req, res) => {
  // Tangani preflight OPTIONS
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    return res.end();
  }

  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = url.pathname;

  try {
    // 1. GET /api/web-monitor/status
    if (req.method === 'GET' && pathname === '/api/web-monitor/status') {
      const emailConfig = emailProvider.getConfig();
      return sendJson(res, 200, {
        service: 'Web Monitor Server & Automation',
        scheduler: scheduler.getStatus(),
        sitesCount: monitorService.getSites().length,
        emailRecipient: emailConfig.recipient,
        smtpConfigured: Boolean(emailConfig.host && emailConfig.host !== 'smtp.example.com'),
        recentLogs: emailProvider.getDeliveryLogs().slice(0, 5)
      });
    }

    // 2. POST /api/web-monitor/test-email (Memenuhi Req 15)
    if (req.method === 'POST' && pathname === '/api/web-monitor/test-email') {
      const body = await parseJsonBody(req);
      const recipient = body.recipient || null;
      console.log('[API] Received request to send Test Email...');
      const result = await emailProvider.sendTestEmail(recipient);
      return sendJson(res, result.success ? 200 : 500, result);
    }

    // 3. POST /api/web-monitor/generate-report (Memenuhi Req 21: Generate != Send)
    if (req.method === 'POST' && pathname === '/api/web-monitor/generate-report') {
      console.log('[API] Generating weekly report preview...');
      const report = reportGenerator.generateWeeklyReport();
      return sendJson(res, 200, {
        success: true,
        subject: report.subject,
        period: report.period,
        summary: report.summary,
        htmlPreview: report.html
      });
    }

    // 4. POST /api/web-monitor/send-report (Manual trigger kirim laporan mingguan)
    if (req.method === 'POST' && pathname === '/api/web-monitor/send-report') {
      const body = await parseJsonBody(req);
      console.log('[API] Triggering weekly report email delivery...');
      const report = reportGenerator.generateWeeklyReport();
      const result = await emailProvider.sendWeeklyReportEmail(report, body.recipient || null);
      return sendJson(res, result.success ? 200 : (result.alreadySent ? 409 : 500), result);
    }

    // 5. GET /api/web-monitor/report-logs (Memenuhi Req 16: Log pengiriman)
    if (req.method === 'GET' && pathname === '/api/web-monitor/report-logs') {
      const logs = emailProvider.getDeliveryLogs();
      return sendJson(res, 200, { success: true, count: logs.length, logs });
    }

    // 6. POST /api/web-monitor/sync-sites (Sinkronisasi daftar situs dari browser ke server)
    if (req.method === 'POST' && pathname === '/api/web-monitor/sync-sites') {
      const body = await parseJsonBody(req);
      const sites = body.sites;
      if (!Array.isArray(sites)) {
        return sendJson(res, 400, { success: false, error: 'Expected sites array' });
      }
      monitorService.syncSites(sites);
      return sendJson(res, 200, { success: true, message: `Synced ${sites.length} sites.` });
    }

    // 7. POST /api/web-monitor/ping (Pengecekan langsung website dari server tanpa CORS)
    if (req.method === 'POST' && pathname === '/api/web-monitor/ping') {
      const body = await parseJsonBody(req);
      const targetUrl = body.url;
      if (!targetUrl) {
        return sendJson(res, 400, { success: false, error: 'url is required' });
      }
      const result = await monitorService.pingUrl(targetUrl);
      return sendJson(res, 200, { success: true, result });
    }

    // 8. POST /api/web-monitor/device-heartbeat (Pendaftaran & perbaruan session perangkat)
    if (req.method === 'POST' && pathname === '/api/web-monitor/device-heartbeat') {
      const body = await parseJsonBody(req);
      const sessionId = body.sessionId || ('session-' + Math.random().toString(36).substr(2, 9));
      pruneInactiveDevices();

      const reqIp = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket.remoteAddress || '';
      const cleanReqIp = reqIp.replace('::ffff:', '');
      const ip = (body.ip && body.ip !== 'Tidak tersedia' && body.ip !== 'Memeriksa...' && !body.ip.includes('localhost'))
        ? body.ip
        : ((cleanReqIp === '::1' || cleanReqIp === '127.0.0.1') ? '127.0.0.1 (Local)' : (cleanReqIp || '103.111.xxx.xxx'));

      const existing = activeDevices.get(sessionId);
      const now = new Date().toISOString();

      let device = body.device;
      let os = body.os;
      let browser = body.browser;
      let type = body.type;

      // Fallback deteksi jika client tidak mengirim atau tidak terdefinisi
      if (!device || device === 'Unknown Device') {
        const ua = req.headers['user-agent'] || '';
        const parsed = parseUserAgentServer(ua);
        device = parsed.device;
        os = parsed.os;
        browser = parsed.browser;
        type = parsed.type;
      }

      activeDevices.set(sessionId, {
        sessionId,
        device: device || 'Unknown Device',
        os: os || 'Unknown',
        browser: browser || 'Browser',
        screen: body.screen || '-',
        type: type || 'desktop',
        ip,
        connectedAt: existing ? existing.connectedAt : now,
        lastSeen: now
      });

      const devices = Array.from(activeDevices.values()).sort((a, b) => new Date(b.lastSeen) - new Date(a.lastSeen));
      return sendJson(res, 200, { success: true, count: devices.length, devices });
    }

    // 9. GET /api/web-monitor/active-devices (Ambil daftar perangkat yang sedang aktif)
    if (req.method === 'GET' && pathname === '/api/web-monitor/active-devices') {
      pruneInactiveDevices();
      const devices = Array.from(activeDevices.values()).sort((a, b) => new Date(b.lastSeen) - new Date(a.lastSeen));
      return sendJson(res, 200, { success: true, count: devices.length, devices });
    }

    // 10. POST /api/web-monitor/device-disconnect (Hapus session perangkat saat tab ditutup)
    if (req.method === 'POST' && pathname === '/api/web-monitor/device-disconnect') {
      const body = await parseJsonBody(req);
      if (body.sessionId) {
        activeDevices.delete(body.sessionId);
      }
      return sendJson(res, 200, { success: true });
    }

    // 11. POST /api/web-monitor/notify-tool-usage (Notifikasi email jika pengguna menggunakan fitur)
    if (req.method === 'POST' && pathname === '/api/web-monitor/notify-tool-usage') {
      const body = await parseJsonBody(req);
      const toolKey = body.toolKey;
      if (!toolKey) {
        return sendJson(res, 400, { success: false, error: 'toolKey is required' });
      }

      const sessionId = body.sessionId || ('session-' + Math.random().toString(36).substr(2, 9));
      const reqIp = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket.remoteAddress || '';
      const cleanReqIp = reqIp.replace('::ffff:', '');
      const ip = (body.ip && body.ip !== 'Tidak tersedia' && body.ip !== 'Memeriksa...' && !body.ip.includes('localhost'))
        ? body.ip
        : ((cleanReqIp === '::1' || cleanReqIp === '127.0.0.1') ? '127.0.0.1 (Local)' : (cleanReqIp || '127.0.0.1'));

      let device = body.device;
      let os = body.os;
      let browser = body.browser;
      let type = body.type;

      if (!device || device === 'Unknown Device') {
        const ua = req.headers['user-agent'] || '';
        const parsed = parseUserAgentServer(ua);
        device = parsed.device;
        os = parsed.os;
        browser = parsed.browser;
        type = parsed.type;
      }

      // Throttling: Jangan kirim email jika tool yang sama dibuka lagi oleh sesi yang sama dalam 2 menit
      const throttleKey = `${sessionId}_${toolKey}`;
      const now = Date.now();
      const lastSent = toolUsageThrottle.get(throttleKey);
      if (lastSent && (now - lastSent) < 2 * 60 * 1000) {
        console.log(`[ToolUsageAlert] Throttling duplicate alert for ${toolKey} from session ${sessionId}`);
        return sendJson(res, 200, { success: true, throttled: true });
      }

      toolUsageThrottle.set(throttleKey, now);

      console.log(`[ToolUsageAlert] Triggering email alert: ${device} accessed feature "${body.toolName || toolKey}"`);

      // Kirim email notifikasi secara async tanpa menahan response HTTP
      emailProvider.sendToolUsageAlert({
        toolKey,
        toolName: body.toolName || toolKey,
        device: device || 'Unknown Device',
        os: os || 'Unknown OS',
        browser: browser || 'Browser',
        type: type || 'desktop',
        ip,
        usedTools: body.usedTools || [],
        timestamp: new Date().toISOString()
      }).catch(err => {
        console.error('[ToolUsageAlert Error]', err.message);
      });

      return sendJson(res, 200, { success: true, alerted: true });
    }

    // 404 Not Found
    return sendJson(res, 404, { error: 'Endpoint not found' });

  } catch (err) {
    console.error('[API Error]', err);
    return sendJson(res, 500, { success: false, error: err.message });
  }
});

// Jalankan background monitoring dan scheduler
monitorService.startMonitoring();
scheduler.startScheduler();

server.listen(PORT, () => {
  console.log(`================================================================`);
  console.log(`Web Monitor Backend Server running on http://localhost:${PORT}`);
  console.log(`Weekly Report Scheduler active (Target: Senin 08:00 Asia/Makassar)`);
  console.log(`Email recipient: ${process.env.REPORT_EMAIL_TO || 'not set'}`);
  console.log(`================================================================`);
});

module.exports = server;
