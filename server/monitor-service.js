const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');

const DATA_FILE = path.join(__dirname, 'data', 'monitor-data.json');

class MonitorService {
  constructor() {
    this.timer = null;
    this.isChecking = false;
    this.checkIntervalMs = 60 * 1000; // Pengecekan setiap 60 detik di server
    this.ensureDataFile();
  }

  ensureDataFile() {
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(DATA_FILE)) {
      const initial = {
        sites: [
          {
            id: 'default-google',
            name: 'Google Indonesia',
            url: 'https://www.google.co.id',
            interval: 30000,
            method: 'nocors',
            status: 'online',
            lastChecked: new Date().toISOString()
          },
          {
            id: 'default-github',
            name: 'GitHub Portal',
            url: 'https://github.com',
            interval: 30000,
            method: 'nocors',
            status: 'online',
            lastChecked: new Date().toISOString()
          }
        ],
        history: []
      };
      fs.writeFileSync(DATA_FILE, JSON.stringify(initial, null, 2), 'utf8');
    }
  }

  loadData() {
    this.ensureDataFile();
    try {
      const raw = fs.readFileSync(DATA_FILE, 'utf8');
      return JSON.parse(raw);
    } catch (err) {
      console.error('[MonitorService] Error loading monitor-data.json:', err.message);
      return { sites: [], history: [] };
    }
  }

  saveData(data) {
    try {
      fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
    } catch (err) {
      console.error('[MonitorService] Error saving monitor-data.json:', err.message);
    }
  }

  getSites() {
    return this.loadData().sites || [];
  }

  getHistory(days = 7) {
    const data = this.loadData();
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    return (data.history || []).filter(h => new Date(h.timestamp) >= cutoff);
  }

  syncSites(newSites) {
    if (!Array.isArray(newSites)) return false;
    const data = this.loadData();
    data.sites = newSites.map(s => ({
      id: s.id,
      name: s.name,
      url: s.url,
      interval: s.interval || 30000,
      method: s.method || 'nocors',
      status: s.status || 'checking',
      lastChecked: s.lastChecked || new Date().toISOString()
    }));
    this.saveData(data);
    console.log(`[MonitorService] Synchronized ${data.sites.length} sites from client.`);
    return true;
  }

  async pingUrl(targetUrl, timeoutMs = 8000) {
    return new Promise((resolve) => {
      try {
        const parsed = new URL(targetUrl);
        const protocol = parsed.protocol === 'https:' ? https : http;
        const startTime = Date.now();

        const req = protocol.request(targetUrl, {
          method: 'GET',
          timeout: timeoutMs,
          headers: {
            'User-Agent': 'ToolSuf-WebMonitor-Bot/1.0'
          }
        }, (res) => {
          const latency = Date.now() - startTime;
          const online = res.statusCode >= 200 && res.statusCode < 400;
          res.resume(); // Discard response body to free memory
          resolve({
            online,
            latency,
            statusCode: res.statusCode,
            error: online ? null : `HTTP Status ${res.statusCode}`
          });
        });

        req.on('timeout', () => {
          req.destroy();
          resolve({
            online: false,
            latency: 0,
            statusCode: 408,
            error: 'Connection Timeout'
          });
        });

        req.on('error', (err) => {
          resolve({
            online: false,
            latency: 0,
            statusCode: 0,
            error: err.message || 'Connection Error'
          });
        });

        req.end();
      } catch (err) {
        resolve({
          online: false,
          latency: 0,
          statusCode: 0,
          error: err.message || 'Invalid URL'
        });
      }
    });
  }

  async runAllChecks() {
    if (this.isChecking) return;
    this.isChecking = true;

    try {
      const data = this.loadData();
      const sites = data.sites || [];
      const history = data.history || [];
      const now = new Date().toISOString();

      for (const site of sites) {
        const result = await this.pingUrl(site.url);
        
        site.status = result.online ? 'online' : 'offline';
        site.lastChecked = now;

        history.push({
          siteId: site.id,
          timestamp: now,
          online: result.online,
          latency: result.latency,
          statusCode: result.statusCode,
          error: result.error
        });
      }

      // Pertahankan riwayat maksimal 30 hari
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      data.history = history.filter(item => new Date(item.timestamp) >= thirtyDaysAgo);

      this.saveData(data);
    } catch (err) {
      console.error('[MonitorService] Error during runAllChecks:', err.message);
    } finally {
      this.isChecking = false;
    }
  }

  startMonitoring() {
    if (this.timer) return;
    console.log('[MonitorService] Background monitoring started on server (Interval: 60s).');
    // Jalankan satu kali segera
    this.runAllChecks();
    this.timer = setInterval(() => {
      this.runAllChecks();
    }, this.checkIntervalMs);
  }

  stopMonitoring() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
      console.log('[MonitorService] Background monitoring stopped.');
    }
  }
}

module.exports = new MonitorService();
