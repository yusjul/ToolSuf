const monitorService = require('./monitor-service');

const MONTH_NAMES_ID = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

/**
 * Format date ke timezone Asia/Makassar
 */
function formatDateMakassar(date) {
  const d = new Date(date);
  // Konversi ke waktu Asia/Makassar (+08:00)
  const formatter = new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Makassar',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
  return formatter.format(d);
}

function formatTimeMakassar(date) {
  if (!date) return '-';
  const d = new Date(date);
  const formatter = new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Makassar',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
  return `${formatter.format(d)} WITA`;
}

/**
 * Menghasilkan data rentang 7 hari terakhir di Asia/Makassar
 */
function getWeeklyPeriodRange(referenceDate = new Date()) {
  const now = new Date(referenceDate);
  
  // Set waktu akhir ke 23:59:59 dari hari kemarin atau saat trigger
  const periodEnd = new Date(now);
  const periodStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const startDay = periodStart.getDate();
  const startMonth = MONTH_NAMES_ID[periodStart.getMonth()];
  const startYear = periodStart.getFullYear();

  const endDay = periodEnd.getDate();
  const endMonth = MONTH_NAMES_ID[periodEnd.getMonth()];
  const endYear = periodEnd.getFullYear();

  let formattedDateRange = '';
  if (startMonth === endMonth && startYear === endYear) {
    formattedDateRange = `${startDay}–${endDay} ${endMonth} ${endYear}`;
  } else if (startYear === endYear) {
    formattedDateRange = `${startDay} ${startMonth} — ${endDay} ${endMonth} ${endYear}`;
  } else {
    formattedDateRange = `${startDay} ${startMonth} ${startYear} — ${endDay} ${endMonth} ${endYear}`;
  }

  return {
    periodStart: periodStart.toISOString(),
    periodEnd: periodEnd.toISOString(),
    periodKey: `${periodStart.toISOString().split('T')[0]}_${periodEnd.toISOString().split('T')[0]}`,
    formattedDateRange
  };
}

/**
 * Menghitung metrik monitoring 7 hari
 */
function calculateWeeklyMetrics(sites, history, periodStart, periodEnd) {
  const startTime = new Date(periodStart).getTime();
  const endTime = new Date(periodEnd).getTime();

  // Filter history dalam rentang
  const relevantHistory = history.filter(h => {
    const t = new Date(h.timestamp).getTime();
    return t >= startTime && t <= endTime;
  });

  let totalOnlineSites = 0;
  let totalOfflineSites = 0;
  let totalGlobalIncidents = 0;
  let totalGlobalDowntimeMinutes = 0;
  let allValidLatencies = [];

  const siteDetails = sites.map(site => {
    const siteChecks = relevantHistory.filter(h => h.siteId === site.id);
    const totalChecks = siteChecks.length;

    let onlineChecks = 0;
    let siteIncidents = 0;
    let siteDowntimeMinutes = 0;
    let validLatencies = [];
    let prevOnline = true;
    let offlineStartTime = null;

    // Urutkan check dari lama ke baru
    siteChecks.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    siteChecks.forEach(check => {
      if (check.online) {
        onlineChecks++;
        if (check.latency && check.latency > 0) {
          validLatencies.push(check.latency);
          allValidLatencies.push(check.latency);
        }
        if (!prevOnline && offlineStartTime) {
          // Insiden offline berakhir
          const diffMinutes = Math.max(1, Math.round((new Date(check.timestamp) - offlineStartTime) / 60000));
          siteDowntimeMinutes += diffMinutes;
          offlineStartTime = null;
        }
        prevOnline = true;
      } else {
        if (prevOnline) {
          siteIncidents++;
          totalGlobalIncidents++;
          offlineStartTime = new Date(check.timestamp);
        }
        prevOnline = false;
      }
    });

    // Jika sampai akhir periode masih offline
    if (!prevOnline && offlineStartTime) {
      const diffMinutes = Math.max(1, Math.round((endTime - offlineStartTime.getTime()) / 60000));
      siteDowntimeMinutes += diffMinutes;
    }

    totalGlobalDowntimeMinutes += siteDowntimeMinutes;

    // Hitung Uptime
    let uptimePercent = 100.00;
    if (totalChecks > 0) {
      uptimePercent = Number(((onlineChecks / totalChecks) * 100).toFixed(2));
    } else {
      // Jika belum ada check dalam 7 hari tapi status sekarang online
      uptimePercent = site.status === 'online' ? 100.00 : 0.00;
    }

    // Rata-rata Latensi Situs
    let avgLatency = 0;
    if (validLatencies.length > 0) {
      const sum = validLatencies.reduce((a, b) => a + b, 0);
      avgLatency = Math.round(sum / validLatencies.length);
    }

    const isCurrentOnline = site.status === 'online';
    if (isCurrentOnline) {
      totalOnlineSites++;
    } else {
      totalOfflineSites++;
    }

    return {
      id: site.id,
      name: site.name,
      url: site.url,
      status: site.status || (isCurrentOnline ? 'online' : 'offline'),
      uptime: uptimePercent,
      avgLatency,
      incidents: siteIncidents,
      downtimeMinutes: siteDowntimeMinutes,
      totalChecks,
      lastChecked: site.lastChecked ? formatTimeMakassar(site.lastChecked) : '-'
    };
  });

  // Global Average Latency
  let globalAvgLatency = 0;
  if (allValidLatencies.length > 0) {
    const sum = allValidLatencies.reduce((a, b) => a + b, 0);
    globalAvgLatency = Math.round(sum / allValidLatencies.length);
  }

  return {
    totalSites: sites.length,
    onlineSites: totalOnlineSites,
    offlineSites: totalOfflineSites,
    totalIncidents: totalGlobalIncidents,
    totalDowntimeMinutes: totalGlobalDowntimeMinutes,
    avgLatency: globalAvgLatency,
    sites: siteDetails
  };
}

/**
 * Membangun template email HTML yang bersih, Apple-like, inline CSS, responsive
 */
function buildWeeklyReportHtml(summary, period, usageSummary = null) {
  const activeUsageSummary = usageSummary || summary.featureUsage || null;
  const sitesHtml = summary.sites.map(site => {
    const statusColor = site.status === 'online' ? '#30D158' : '#FF453A';
    const statusBg = site.status === 'online' ? 'rgba(48, 209, 88, 0.15)' : 'rgba(255, 69, 58, 0.15)';
    const statusText = site.status === 'online' ? 'ONLINE' : 'OFFLINE';

    return `
      <div style="background-color: #18181C; border: 1px solid #28282F; border-radius: 12px; padding: 18px; margin-bottom: 12px;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
          <div>
            <div style="font-size: 15px; font-weight: 700; color: #FCFCFD; margin-bottom: 2px;">${site.name}</div>
            <div style="font-size: 12px; color: #8E8E93;">${site.url}</div>
          </div>
          <span style="display: inline-block; background-color: ${statusBg}; color: ${statusColor}; font-size: 10px; font-weight: 700; letter-spacing: 0.05em; padding: 4px 8px; border-radius: 6px; text-transform: uppercase;">
            ${statusText}
          </span>
        </div>

        <table style="width: 100%; border-collapse: collapse; font-size: 12px; color: #8E8E93;">
          <tr>
            <td style="padding: 4px 0;">Uptime: <strong style="color: #FCFCFD;">${site.uptime}%</strong></td>
            <td style="padding: 4px 0;">Avg Latensi: <strong style="color: #FCFCFD;">${site.avgLatency} ms</strong></td>
          </tr>
          <tr>
            <td style="padding: 4px 0;">Incident: <strong style="color: ${site.incidents > 0 ? '#FF9F0A' : '#FCFCFD'};">${site.incidents}</strong></td>
            <td style="padding: 4px 0;">Downtime: <strong style="color: ${site.downtimeMinutes > 0 ? '#FF453A' : '#FCFCFD'};">${site.downtimeMinutes} menit</strong></td>
          </tr>
          <tr>
            <td style="padding: 4px 0;">Pengecekan: <strong style="color: #FCFCFD;">${site.totalChecks}</strong></td>
            <td style="padding: 4px 0;">Terakhir: <strong style="color: #FCFCFD;">${site.lastChecked}</strong></td>
          </tr>
        </table>
      </div>
    `;
  }).join('');

  return `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Web Monitor - Laporan Mingguan</title>
</head>
<body style="margin: 0; padding: 24px 12px; background-color: #0A0A0C; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #FCFCFD; -webkit-font-smoothing: antialiased;">
  
  <div style="max-width: 600px; margin: 0 auto; background-color: #121215; border: 1px solid #23232A; border-radius: 18px; padding: 32px 24px; box-shadow: 0 12px 40px rgba(0,0,0,0.5);">
    
    <!-- Header -->
    <div style="text-align: center; border-bottom: 1px solid #23232A; padding-bottom: 24px; margin-bottom: 24px;">
      <div style="font-size: 11px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: #0A84FF; margin-bottom: 6px;">
        WEB MONITOR
      </div>
      <h1 style="font-size: 22px; font-weight: 700; color: #FCFCFD; margin: 0 0 6px 0; letter-spacing: -0.02em;">
        Laporan Mingguan
      </h1>
      <div style="font-size: 13px; color: #8E8E93;">
        ${period.formattedDateRange}
      </div>
    </div>

    <!-- Ringkasan Section -->
    <div style="margin-bottom: 28px;">
      <div style="font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #8E8E93; margin-bottom: 12px;">
        RINGKASAN
      </div>
      
      <table style="width: 100%; border-collapse: separate; border-spacing: 8px;">
        <tr>
          <td style="background-color: #18181C; border: 1px solid #28282F; border-radius: 10px; padding: 14px; text-align: center; width: 33%;">
            <div style="font-size: 11px; color: #8E8E93; margin-bottom: 4px;">Total Situs</div>
            <div style="font-size: 20px; font-weight: 700; color: #FCFCFD;">${summary.totalSites}</div>
          </td>
          <td style="background-color: #18181C; border: 1px solid #28282F; border-radius: 10px; padding: 14px; text-align: center; width: 33%;">
            <div style="font-size: 11px; color: #8E8E93; margin-bottom: 4px;">Online</div>
            <div style="font-size: 20px; font-weight: 700; color: #30D158;">${summary.onlineSites}</div>
          </td>
          <td style="background-color: #18181C; border: 1px solid #28282F; border-radius: 10px; padding: 14px; text-align: center; width: 33%;">
            <div style="font-size: 11px; color: #8E8E93; margin-bottom: 4px;">Offline</div>
            <div style="font-size: 20px; font-weight: 700; color: #FF453A;">${summary.offlineSites}</div>
          </td>
        </tr>
        <tr>
          <td style="background-color: #18181C; border: 1px solid #28282F; border-radius: 10px; padding: 14px; text-align: center; width: 33%;">
            <div style="font-size: 11px; color: #8E8E93; margin-bottom: 4px;">Incident</div>
            <div style="font-size: 20px; font-weight: 700; color: ${summary.totalIncidents > 0 ? '#FF9F0A' : '#FCFCFD'};">${summary.totalIncidents}</div>
          </td>
          <td style="background-color: #18181C; border: 1px solid #28282F; border-radius: 10px; padding: 14px; text-align: center; width: 33%;">
            <div style="font-size: 11px; color: #8E8E93; margin-bottom: 4px;">Total Downtime</div>
            <div style="font-size: 20px; font-weight: 700; color: ${summary.totalDowntimeMinutes > 0 ? '#FF453A' : '#FCFCFD'};">${summary.totalDowntimeMinutes} <span style="font-size: 12px; font-weight: 400;">m</span></div>
          </td>
          <td style="background-color: #18181C; border: 1px solid #28282F; border-radius: 10px; padding: 14px; text-align: center; width: 33%;">
            <div style="font-size: 11px; color: #8E8E93; margin-bottom: 4px;">Avg Latency</div>
            <div style="font-size: 20px; font-weight: 700; color: #FCFCFD;">${summary.avgLatency} <span style="font-size: 12px; font-weight: 400;">ms</span></div>
          </td>
        </tr>
      </table>
    </div>

    <!-- Detail Situs Section -->
    <div style="margin-bottom: 28px;">
      <div style="font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #8E8E93; margin-bottom: 12px;">
        DETAIL SITUS
      </div>
      ${sitesHtml || '<div style="color: #8E8E93; font-size: 13px; text-align: center; padding: 20px;">Belum ada situs yang dipantau.</div>'}
    </div>

    <!-- Feature Usage Section (Section 10) -->
    <div style="margin-bottom: 28px;">
      <div style="font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #8E8E93; margin-bottom: 12px;">
        PENGGUNAAN FITUR (FEATURE USAGE)
      </div>
      <div style="background-color: #18181C; border: 1px solid #28282F; border-radius: 12px; padding: 18px;">
        ${buildFeatureUsageTableHtml(activeUsageSummary)}
      </div>
    </div>

    <!-- Footer -->
    <div style="border-top: 1px solid #23232A; padding-top: 20px; text-align: center; font-size: 11px; color: #636366;">
      <p style="margin: 0 0 4px 0;">Dibuat otomatis oleh Web Monitor.</p>
      <p style="margin: 0;">Zona waktu laporan: Asia/Makassar (WITA, UTC+8)</p>
    </div>

  </div>

</body>
</html>
  `.trim();
}

function buildFeatureUsageTableHtml(usageSummary) {
  if (!usageSummary || !Array.isArray(usageSummary.featureList) || usageSummary.featureList.length === 0) {
    return '<div style="color: #8E8E93; font-size: 13px; text-align: center; padding: 12px;">Belum ada penggunaan fitur yang tercatat pada periode ini.</div>';
  }

  const rows = usageSummary.featureList.map(item => `
    <tr style="border-bottom: 1px solid #222228;">
      <td style="padding: 9px 0; color: #FCFCFD; font-size: 13px;">${item.featureName || item.featureId}</td>
      <td style="padding: 9px 0; text-align: right; color: #A1A1AA; font-weight: 600; font-size: 13px;">${item.count}</td>
    </tr>
  `).join('');

  return `
    <table style="width: 100%; border-collapse: collapse;">
      <thead>
        <tr style="border-bottom: 1px solid #28282F; color: #8E8E93; font-size: 11px; text-transform: uppercase;">
          <th style="padding: 0 0 8px 0; text-align: left; font-weight: 600;">Nama Fitur</th>
          <th style="padding: 0 0 8px 0; text-align: right; font-weight: 600;">Frekuensi</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
        <tr>
          <td style="padding: 12px 0 4px 0; font-weight: 700; color: #FCFCFD; font-size: 13px;">Total Usage</td>
          <td style="padding: 12px 0 4px 0; font-weight: 700; text-align: right; color: #0A84FF; font-size: 15px;">${usageSummary.totalUsage || 0}</td>
        </tr>
      </tbody>
    </table>
  `;
}

/**
 * Generate Laporan Mingguan Lengkap
 * (Memenuhi Requirement 21 & Section 10 & 12: generateWeeklyReport terpisah dari sendWeeklyReportEmail)
 */
function generateWeeklyReport(customPeriod = null) {
  const period = customPeriod || getWeeklyPeriodRange();
  const sites = monitorService.getSites();
  const history = monitorService.getHistory(7);

  // Ambil data penggunaan fitur dari database
  const usageService = require('./usage-service');
  const usageSummary = usageService.getFeatureUsageSummary(period.periodStart, period.periodEnd);

  const summary = calculateWeeklyMetrics(sites, history, period.periodStart, period.periodEnd);
  summary.featureUsage = usageSummary;

  const html = buildWeeklyReportHtml(summary, period, usageSummary);
  const subject = `[Web Monitor] Laporan Mingguan — ${period.formattedDateRange}`;

  return {
    subject,
    period,
    summary,
    featureUsage: usageSummary,
    html
  };
}

module.exports = {
  generateWeeklyReport,
  getWeeklyPeriodRange,
  calculateWeeklyMetrics,
  buildWeeklyReportHtml,
  buildFeatureUsageTableHtml
};
