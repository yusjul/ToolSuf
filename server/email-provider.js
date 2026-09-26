const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');

const LOGS_FILE = path.join(__dirname, 'data', 'delivery-logs.json');

class EmailProvider {
  constructor() {
    this.ensureLogsFile();
  }

  ensureLogsFile() {
    const dir = path.dirname(LOGS_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(LOGS_FILE)) {
      fs.writeFileSync(LOGS_FILE, JSON.stringify({ logs: [] }, null, 2), 'utf8');
    }
  }

  loadLogs() {
    this.ensureLogsFile();
    try {
      const raw = fs.readFileSync(LOGS_FILE, 'utf8');
      return JSON.parse(raw).logs || [];
    } catch (err) {
      console.error('[EmailProvider] Error loading delivery-logs.json:', err.message);
      return [];
    }
  }

  saveLogs(logs) {
    try {
      fs.writeFileSync(LOGS_FILE, JSON.stringify({ logs }, null, 2), 'utf8');
    } catch (err) {
      console.error('[EmailProvider] Error saving delivery-logs.json:', err.message);
    }
  }

  addLog(entry) {
    const logs = this.loadLogs();
    logs.unshift({
      id: 'log-' + Date.now(),
      timestamp: new Date().toISOString(),
      ...entry
    });
    // Simpan maksimal 100 log pengiriman terakhir
    if (logs.length > 100) logs.pop();
    this.saveLogs(logs);
  }

  getDeliveryLogs() {
    return this.loadLogs();
  }

  getConfig() {
    return {
      recipient: process.env.REPORT_EMAIL_TO || 'your-email@example.com',
      host: process.env.SMTP_HOST || 'smtp.example.com',
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_SECURE === 'true' || process.env.SMTP_PORT === '465',
      user: process.env.SMTP_USER || '',
      password: process.env.SMTP_PASSWORD || '',
      from: process.env.SMTP_FROM || '"Web Monitor" <noreply@toolsuf.local>'
    };
  }

  createTransporter() {
    const config = this.getConfig();
    
    // Validasi apakah konfigurasi SMTP sudah diisi
    const isMock = !config.host || config.host === 'smtp.example.com' || !config.user;

    if (isMock) {
      // Mock transporter jika user belum mengatur SMTP asli
      return {
        isMock: true,
        sendMail: async (mailOptions) => {
          console.log('[EmailProvider MOCK] Simulating email delivery:');
          console.log(`  To: ${mailOptions.to}`);
          console.log(`  Subject: ${mailOptions.subject}`);
          return { messageId: 'mock-' + Date.now(), accepted: [mailOptions.to] };
        }
      };
    }

    return nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: {
        user: config.user,
        pass: config.password
      },
      connectionTimeout: 10000,
      greetingTimeout: 5000,
      socketTimeout: 10000
    });
  }

  /**
   * Helper delay untuk retry
   */
  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Mengirim email dengan Retry Mechanism (Maksimal 3x percobaan)
   * (Memenuhi Requirement 6)
   */
  async sendMailWithRetry(mailOptions, maxRetries = 3) {
    const delays = [3000, 8000]; // Delay antar percobaan
    let lastError = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`[EmailProvider] Sending email (Attempt ${attempt}/${maxRetries})...`);
        const transporter = this.createTransporter();
        const info = await transporter.sendMail(mailOptions);
        console.log(`[EmailProvider] Email sent successfully! MessageId: ${info.messageId}`);
        return { success: true, info, attempts: attempt };
      } catch (err) {
        lastError = err;
        console.error(`[EmailProvider] Attempt ${attempt} failed:`, err.message);

        if (attempt < maxRetries) {
          const waitTime = delays[attempt - 1] || 5000;
          console.log(`[EmailProvider] Waiting ${waitTime}ms before retry...`);
          await this.sleep(waitTime);
        }
      }
    }

    return {
      success: false,
      error: lastError ? lastError.message : 'Unknown SMTP Error',
      attempts: maxRetries
    };
  }

  /**
   * Mengirim Laporan Mingguan dengan pengecekan deduplikasi
   * (Memenuhi Requirement 5, 6, 16)
   */
  async sendWeeklyReportEmail(reportData, customRecipient = null) {
    const config = this.getConfig();
    const recipient = customRecipient || config.recipient;
    const periodKey = reportData.period.periodKey;

    // 1. CEK DEDUPLIKASI: Jangan kirim dua kali untuk periode yang sama
    const existingLogs = this.loadLogs();
    const alreadySent = existingLogs.some(l => 
      l.type === 'WEEKLY_REPORT' && 
      l.periodKey === periodKey && 
      l.status === 'SENT'
    );

    if (alreadySent) {
      console.log(`[EmailProvider] Report for period [${periodKey}] already sent. Skipping duplicate.`);
      return {
        success: false,
        alreadySent: true,
        message: `Laporan untuk periode ${reportData.period.formattedDateRange} sudah pernah terkirim sebelumnya.`
      };
    }

    const mailOptions = {
      from: config.from,
      to: recipient,
      subject: reportData.subject,
      html: reportData.html
    };

    // 2. Eksekusi pengiriman dengan retry 3x
    const result = await this.sendMailWithRetry(mailOptions, 3);

    // 3. Simpan Delivery Log
    const logEntry = {
      type: 'WEEKLY_REPORT',
      periodKey,
      periodRange: reportData.period.formattedDateRange,
      recipient,
      status: result.success ? 'SENT' : 'FAILED',
      attempts: result.attempts,
      sentAt: new Date().toISOString(),
      error: result.success ? null : result.error
    };
    this.addLog(logEntry);

    return {
      ...result,
      recipient,
      periodRange: reportData.period.formattedDateRange
    };
  }

  /**
   * Mengirim Email Test
   * (Memenuhi Requirement 15: Tidak boleh membuat duplicate record mingguan)
   */
  async sendTestEmail(customRecipient = null) {
    const config = this.getConfig();
    const recipient = customRecipient || config.recipient;

    const testHtml = `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <title>Test Laporan Email</title>
</head>
<body style="margin: 0; padding: 24px 12px; background-color: #0A0A0C; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #FCFCFD;">
  <div style="max-width: 520px; margin: 0 auto; background-color: #121215; border: 1px solid #23232A; border-radius: 16px; padding: 28px; text-align: center;">
    <div style="font-size: 11px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: #30D158; margin-bottom: 8px;">
      STATUS KONEKSI SUKSES
    </div>
    <h2 style="margin: 0 0 12px 0; font-size: 20px; color: #FCFCFD;">
      [Web Monitor] Test Laporan Email
    </h2>
    <p style="font-size: 13px; color: #8E8E93; line-height: 1.5; margin-bottom: 20px;">
      Konfigurasi pengiriman email Web Monitor Anda berhasil diverifikasi. Laporan mingguan otomatis akan dikirim ke alamat email ini setiap Senin pukul 08:00 WITA.
    </p>
    <div style="border-top: 1px solid #23232A; padding-top: 16px; font-size: 11px; color: #636366;">
      Waktu Pengujian: ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Makassar' })} WITA
    </div>
  </div>
</body>
</html>
    `.trim();

    const mailOptions = {
      from: config.from,
      to: recipient,
      subject: '[Web Monitor] Test Laporan Email',
      html: testHtml
    };

    const result = await this.sendMailWithRetry(mailOptions, 3);

    // Catat log pengujian sebagai TEST (tidak mengganggu weekly report tracking)
    this.addLog({
      type: 'TEST_EMAIL',
      periodKey: 'TEST',
      periodRange: 'N/A',
      recipient,
      status: result.success ? 'SENT' : 'FAILED',
      attempts: result.attempts,
      sentAt: new Date().toISOString(),
      error: result.success ? null : result.error
    });

    return {
      ...result,
      recipient
    };
  }

  /**
   * Mengirim notifikasi email saat pengguna mengakses/menggunakan fitur di ToolSuf
   * Memenuhi: Nama Device & Fitur apa saja yang digunakan
   */
  async sendToolUsageAlert(payload) {
    const config = this.getConfig();
    const recipient = config.recipient;

    const {
      toolKey = 'unknown',
      toolName = 'Fitur ToolSuf',
      device = 'Unknown Device',
      os = 'Unknown OS',
      browser = 'Browser',
      type = 'desktop',
      ip = '127.0.0.1',
      usedTools = [],
      timestamp = new Date().toISOString()
    } = payload;

    const timeFormatted = new Date(timestamp).toLocaleString('id-ID', {
      timeZone: process.env.REPORT_TIMEZONE || 'Asia/Makassar',
      dateStyle: 'full',
      timeStyle: 'medium'
    });

    const usedToolsListHtml = Array.isArray(usedTools) && usedTools.length > 0
      ? usedTools.map((t, idx) => `
        <tr style="border-bottom: 1px solid #23232A;">
          <td style="padding: 10px 14px; font-size: 13px; color: #8E8E93;">#${idx + 1}</td>
          <td style="padding: 10px 14px; font-size: 13px; font-weight: 600; color: #FCFCFD;">${t.name || t.tool || t}</td>
          <td style="padding: 10px 14px; font-size: 12px; color: #8E8E93; text-align: right;">${t.count ? t.count + 'x dibuka' : (t.time ? new Date(t.time).toLocaleTimeString('id-ID') : '-')}</td>
        </tr>
      `).join('')
      : `
        <tr>
          <td colspan="3" style="padding: 12px 14px; font-size: 13px; color: #8E8E93; text-align: center;">
            ${toolName}
          </td>
        </tr>
      `;

    const htmlContent = `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Notifikasi Penggunaan Fitur ToolSuf</title>
</head>
<body style="margin: 0; padding: 24px 12px; background-color: #0A0A0C; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #FCFCFD; -webkit-font-smoothing: antialiased;">
  <div style="max-width: 580px; margin: 0 auto; background-color: #121215; border: 1px solid #23232A; border-radius: 18px; padding: 28px 24px; box-shadow: 0 12px 36px rgba(0,0,0,0.5);">
    
    <!-- Top Header Badge -->
    <div style="margin-bottom: 18px;">
      <div style="display: inline-block; font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #3B82F6; background-color: rgba(59, 130, 246, 0.15); border: 1px solid rgba(59, 130, 246, 0.3); border-radius: 20px; padding: 4px 12px;">
        AKTIVITAS PENGGUNA FITUR
      </div>
    </div>

    <h1 style="margin: 0 0 8px 0; font-size: 22px; font-weight: 700; color: #FCFCFD; letter-spacing: -0.02em;">
      Pengguna Mengakses: <span style="color: #60A5FA;">${toolName}</span>
    </h1>
    <p style="margin: 0 0 24px 0; font-size: 13px; color: #8E8E93; line-height: 1.5;">
      Seseorang baru saja membuka dan menggunakan fitur di ToolSuf. Berikut adalah informasi lengkap perangkat dan fitur yang digunakan:
    </p>

    <!-- Info Box: Device Details -->
    <div style="background-color: #18181D; border: 1px solid #282832; border-radius: 14px; padding: 18px 20px; margin-bottom: 20px;">
      <div style="font-size: 11px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: #8E8E93; margin-bottom: 12px;">
        INFORMASI PERANGKAT (DEVICE)
      </div>

      <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
        <tr style="border-bottom: 1px solid #23232A;">
          <td style="padding: 8px 0; color: #8E8E93; width: 42%;">Nama Perangkat:</td>
          <td style="padding: 8px 0; font-weight: 700; color: #FCFCFD;">${device}</td>
        </tr>
        <tr style="border-bottom: 1px solid #23232A;">
          <td style="padding: 8px 0; color: #8E8E93;">Sistem Operasi (OS):</td>
          <td style="padding: 8px 0; font-weight: 600; color: #FCFCFD;">${os}</td>
        </tr>
        <tr style="border-bottom: 1px solid #23232A;">
          <td style="padding: 8px 0; color: #8E8E93;">Browser:</td>
          <td style="padding: 8px 0; font-weight: 600; color: #FCFCFD;">${browser}</td>
        </tr>
        <tr style="border-bottom: 1px solid #23232A;">
          <td style="padding: 8px 0; color: #8E8E93;">Tipe Perangkat:</td>
          <td style="padding: 8px 0; text-transform: capitalize; color: #FCFCFD;">${type}</td>
        </tr>
        <tr style="border-bottom: 1px solid #23232A;">
          <td style="padding: 8px 0; color: #8E8E93;">Alamat IP:</td>
          <td style="padding: 8px 0; font-family: monospace; font-weight: 600; color: #10B981;">${ip}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #8E8E93;">Waktu Akses:</td>
          <td style="padding: 8px 0; color: #FCFCFD;">${timeFormatted}</td>
        </tr>
      </table>
    </div>

    <!-- Info Box: Fitur yang Digunakan -->
    <div style="background-color: #18181D; border: 1px solid #282832; border-radius: 14px; padding: 18px 20px; margin-bottom: 24px;">
      <div style="font-size: 11px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: #8E8E93; margin-bottom: 12px;">
        FITUR APA SAJA YANG DIA GUNAKAN
      </div>

      <table style="width: 100%; border-collapse: collapse; background-color: #121215; border-radius: 8px; overflow: hidden;">
        <thead>
          <tr style="background-color: #1F1F27; text-align: left;">
            <th style="padding: 8px 14px; font-size: 11px; color: #8E8E93; text-transform: uppercase;">No</th>
            <th style="padding: 8px 14px; font-size: 11px; color: #8E8E93; text-transform: uppercase;">Nama Fitur</th>
            <th style="padding: 8px 14px; font-size: 11px; color: #8E8E93; text-transform: uppercase; text-align: right;">Total Dibuka</th>
          </tr>
        </thead>
        <tbody>
          ${usedToolsListHtml}
        </tbody>
      </table>
    </div>

    <!-- Footer -->
    <div style="border-top: 1px solid #23232A; padding-top: 18px; text-align: center; font-size: 11px; color: #636366;">
      Notifikasi otomatis dari ToolSuf Activity Engine.<br>
      Dikirim ke ${recipient}
    </div>
  </div>
</body>
</html>
    `.trim();

    const mailOptions = {
      from: config.from,
      to: recipient,
      subject: `[ToolSuf Alert] ${device} menggunakan fitur: ${toolName}`,
      html: htmlContent
    };

    const result = await this.sendMailWithRetry(mailOptions, 3);

    this.addLog({
      type: 'TOOL_USAGE_ALERT',
      toolKey,
      toolName,
      device,
      ip,
      recipient,
      status: result.success ? 'SENT' : 'FAILED',
      sentAt: new Date().toISOString(),
      error: result.success ? null : result.error
    });

    return result;
  }
}

module.exports = new EmailProvider();
