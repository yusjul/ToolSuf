const emailProvider = require('../server/email-provider.js');

// In-memory cache per serverless instance
const activeDevices = new Map();
const toolUsageThrottle = new Map();

function parseUserAgentServer(ua = '') {
  let device = 'Unknown Device';
  let os = 'Unknown';
  let type = 'desktop';

  if (/iPhone|iPod/i.test(ua)) {
    device = 'iPhone';
    os = 'iOS';
    type = 'mobile';
  } else if (/iPad/i.test(ua)) {
    device = 'iPad';
    os = 'iPadOS';
    type = 'tablet';
  } else if (/Android/i.test(ua)) {
    os = 'Android';
    if (/Mobile/i.test(ua)) {
      device = 'Android Phone';
      type = 'mobile';
    } else {
      device = 'Android Tablet';
      type = 'tablet';
    }
  } else if (/Windows NT|Windows/i.test(ua)) {
    device = 'Windows PC';
    if (/Windows NT 10\.0/i.test(ua)) os = 'Windows 11';
    else if (/Windows NT 6\.3/i.test(ua)) os = 'Windows 8.1';
    else if (/Windows NT 6\.2/i.test(ua)) os = 'Windows 8';
    else if (/Windows NT 6\.1/i.test(ua)) os = 'Windows 7';
    else os = 'Windows';
    type = 'desktop';
  } else if (/Macintosh|Mac OS X/i.test(ua)) {
    device = 'MacBook';
    os = 'macOS';
    type = 'laptop';
  } else if (/Linux|X11/i.test(ua)) {
    device = 'Linux';
    os = 'Linux';
    type = 'desktop';
  }

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

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  const url = new URL(req.url, `https://${req.headers.host || 'localhost'}`);
  const pathname = url.pathname;

  try {
    // 1. POST /api/web-monitor/notify-tool-usage
    if (req.method === 'POST' && pathname.includes('notify-tool-usage')) {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
      const toolKey = body.toolKey;
      if (!toolKey) {
        return res.status(400).json({ success: false, error: 'toolKey is required' });
      }

      const sessionId = body.sessionId || ('session-' + Math.random().toString(36).substr(2, 9));
      const reqIp = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket?.remoteAddress || '';
      const cleanReqIp = reqIp.replace('::ffff:', '');
      const ip = (body.ip && body.ip !== 'Tidak tersedia' && body.ip !== 'Memeriksa...' && !body.ip.includes('localhost'))
        ? body.ip
        : (cleanReqIp || '103.xxx.xxx.xxx');

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

      // Throttling 2 menit
      const throttleKey = `${sessionId}_${toolKey}`;
      const now = Date.now();
      const lastSent = toolUsageThrottle.get(throttleKey);
      if (lastSent && (now - lastSent) < 2 * 60 * 1000) {
        return res.status(200).json({ success: true, throttled: true });
      }
      toolUsageThrottle.set(throttleKey, now);

      await emailProvider.sendToolUsageAlert({
        toolKey,
        toolName: body.toolName || toolKey,
        device: device || 'Unknown Device',
        os: os || 'Unknown OS',
        browser: browser || 'Browser',
        type: type || 'desktop',
        ip,
        usedTools: body.usedTools || [],
        timestamp: new Date().toISOString()
      });

      return res.status(200).json({ success: true, alerted: true });
    }

    // 2. POST /api/web-monitor/device-heartbeat
    if (req.method === 'POST' && pathname.includes('device-heartbeat')) {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
      const sessionId = body.sessionId || ('session-' + Math.random().toString(36).substr(2, 9));
      const reqIp = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket?.remoteAddress || '';
      const cleanReqIp = reqIp.replace('::ffff:', '');
      const ip = (body.ip && body.ip !== 'Tidak tersedia' && body.ip !== 'Memeriksa...' && !body.ip.includes('localhost'))
        ? body.ip
        : (cleanReqIp || '103.xxx.xxx.xxx');

      const existing = activeDevices.get(sessionId);
      const now = new Date().toISOString();

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
      return res.status(200).json({ success: true, count: devices.length, devices });
    }

    // 3. GET /api/web-monitor/active-devices
    if (req.method === 'GET' && pathname.includes('active-devices')) {
      const devices = Array.from(activeDevices.values()).sort((a, b) => new Date(b.lastSeen) - new Date(a.lastSeen));
      return res.status(200).json({ success: true, count: devices.length, devices });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('[Vercel API Error]', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};
