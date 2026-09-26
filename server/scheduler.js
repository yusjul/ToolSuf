const reportGenerator = require('./report-generator');
const emailProvider = require('./email-provider');

class WeeklyReportScheduler {
  constructor() {
    this.timer = null;
    this.timezone = process.env.REPORT_TIMEZONE || 'Asia/Makassar';
    this.lastTriggeredMinute = -1;
  }

  /**
   * Mengambil bagian tanggal saat ini dalam timezone yang ditentukan
   */
  getCurrentTimeInTimezone() {
    const now = new Date();
    
    // Gunakan Intl.DateTimeFormat untuk parsing waktu presisi di Asia/Makassar
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: this.timezone,
      weekday: 'short', // 'Mon', 'Tue', etc.
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      hour12: false
    });

    const parts = formatter.formatToParts(now);
    const timeObj = {};
    parts.forEach(p => { timeObj[p.type] = p.value; });

    return {
      weekday: timeObj.weekday, // 'Mon'
      hour: parseInt(timeObj.hour, 10),
      minute: parseInt(timeObj.minute, 10),
      second: parseInt(timeObj.second, 10),
      formatted: `${timeObj.weekday}, ${timeObj.hour}:${timeObj.minute} ${this.timezone}`
    };
  }

  /**
   * Eksekusi Otomatis Laporan Mingguan
   */
  async executeWeeklyReport() {
    console.log(`[Scheduler] >>> Starting Weekly Report Automation (${this.timezone}) <<<`);
    try {
      // 1. Generate Report dari data 7 hari terakhir
      const report = reportGenerator.generateWeeklyReport();
      console.log(`[Scheduler] Report generated for period: ${report.period.formattedDateRange}`);

      // 2. Kirim Email (akan otomatis dicek deduplikasi dan retry 3x)
      const result = await emailProvider.sendWeeklyReportEmail(report);
      
      if (result.success) {
        console.log(`[Scheduler] Weekly report email successfully delivered to ${result.recipient}!`);
      } else if (result.alreadySent) {
        console.log(`[Scheduler] Notice: ${result.message}`);
      } else {
        console.error(`[Scheduler] Failed to deliver weekly report email:`, result.error);
      }

      return result;
    } catch (err) {
      console.error('[Scheduler] Unexpected error during weekly report execution:', err);
      return { success: false, error: err.message };
    }
  }

  /**
   * Pengecekan interval setiap 30 detik
   */
  checkSchedule() {
    const time = this.getCurrentTimeInTimezone();

    // Jadwal: Setiap Senin (Mon) pukul 08:00
    const isMonday = time.weekday === 'Mon';
    const isEightAM = time.hour === 8 && time.minute === 0;

    // Pastikan hanya trigger sekali di menit tersebut
    if (isMonday && isEightAM) {
      const currentMinuteStamp = Math.floor(Date.now() / 60000);
      if (this.lastTriggeredMinute !== currentMinuteStamp) {
        this.lastTriggeredMinute = currentMinuteStamp;
        console.log(`[Scheduler] Scheduled time reached: Senin 08:00 ${this.timezone}. Triggering report...`);
        this.executeWeeklyReport();
      }
    }
  }

  startScheduler() {
    if (this.timer) return;
    console.log(`[Scheduler] Server automation scheduler started (Target: Senin 08:00 ${this.timezone}).`);
    
    // Cek jadwal setiap 30 detik
    this.timer = setInterval(() => {
      this.checkSchedule();
    }, 30000);
  }

  stopScheduler() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
      console.log('[Scheduler] Scheduler stopped.');
    }
  }

  getStatus() {
    const time = this.getCurrentTimeInTimezone();
    return {
      timezone: this.timezone,
      currentTime: time.formatted,
      schedule: `Setiap Senin pukul 08:00 ${this.timezone}`,
      isRunning: this.timer !== null
    };
  }
}

module.exports = new WeeklyReportScheduler();
