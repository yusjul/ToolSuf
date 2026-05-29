/* ── Theme & Lang Bootstrap ── */
(function() {
  try {
    var p = window.parent.document.documentElement;
    if (p.classList.contains('dark')) document.documentElement.classList.add('dark');
    else document.documentElement.classList.add('light');
  } catch(e) { document.documentElement.classList.add('light'); }
  var lang = new URLSearchParams(window.location.search).get('lang');
  window.__initialLang = (lang === 'en') ? 'en' : 'id';
})();

/* ── Translations ── */
const T = {
  id: {
    title: 'QR Code Master', subtitle: 'Generator & Pemindai QR Premium · 100% Offline',
    tabGenerate: 'BUAT QR', tabScan: 'PINDAI QR',
    sectionType: 'TIPE DATA', sectionInput: 'INPUT DATA', sectionCustom: 'KUSTOMISASI',
    sectionResult: 'HASIL QR CODE', sectionScanMethod: 'METODE PEMINDAIAN', sectionScanResult: 'HASIL PEMINDAIAN',
    typeUrl: 'Link/URL', typeText: 'Teks',
    labelUrl: 'URL / Link', labelSsid: 'Nama Jaringan (SSID)', labelPass: 'Kata Sandi',
    labelEncrypt: 'Enkripsi', encNone: 'Tidak Ada',
    labelFirst: 'Nama Depan', labelLast: 'Nama Belakang', labelPhone: 'No. Telepon',
    labelOrg: 'Perusahaan', labelText: 'Teks Bebas',
    labelDotStyle: 'Gaya Piksel', dsSquare: 'Kotak', dsRounded: 'Bulat', dsDots: 'Titik',
    labelFgColor: 'Warna QR', labelBgColor: 'Warna Latar',
    labelSize: 'Ukuran QR', labelMargin: 'Margin', labelEcc: 'Koreksi Error', labelLogo: 'Logo Tengah',
    btnGenerate: 'Buat QR Code',
    btnDownloadPng: 'Unduh PNG', btnDownloadSvg: 'Unduh SVG', btnCopy: 'Salin Gambar',
    scanCamera: 'Kamera Live', scanFile: 'Upload File',
    btnStartCamera: 'Aktifkan Kamera', btnStopCamera: 'Hentikan Kamera',
    dropzoneText: 'Seret & lepas gambar QR Code', dropzoneHint: 'atau klik untuk memilih file (PNG, JPG, GIF, WebP)',
    btnOpen: 'Buka URL', btnCopyResult: 'Salin Hasil',
    privacyText: 'Pemrosesan 100% Offline Lokal. Data Anda Aman.',
    toastCopied: 'Disalin!', toastDownloaded: 'Diunduh!', toastNoData: 'Masukkan data terlebih dahulu.',
    toastInvalidUrl: 'Masukkan URL yang valid.', toastNoSsid: 'Masukkan nama jaringan Wi-Fi.',
    toastNoName: 'Masukkan setidaknya nama depan.', toastTooLong: 'Data terlalu panjang. Kurangi teks.',
    toastDecodeOk: 'QR berhasil dibaca!', toastDecodeErr: 'Tidak dapat membaca QR Code.',
    toastCameraErr: 'Tidak dapat mengakses kamera.', toastCamDenied: 'Izin kamera ditolak.',
    sectionPreview: 'PRATINJAU LANGSUNG',
    previewPlaceholder: 'Mulai mengetik untuk melihat pratinjau QR',
    lpScannable: 'Dapat dipindai',
    labelDotStyle: 'Gaya Titik', dsSquare: 'Kotak', dsRounded: 'Bulat', dsDots: 'Titik', dsDiamond: 'Berlian', dsStripe: 'Garis',
    labelEyeStyle: 'Gaya Sudut QR', esSquare: 'Kotak', esRounded: 'Bulat', esCircle: 'Lingkaran', esLeaf: 'Daun',
  },
  en: {
    title: 'QR Code Master', subtitle: 'Premium, Fast & Offline QR Code Suite',
    tabGenerate: 'CREATE QR', tabScan: 'SCAN QR',
    sectionType: 'DATA TYPE', sectionInput: 'INPUT DATA', sectionCustom: 'CUSTOMIZE',
    sectionResult: 'QR RESULT', sectionScanMethod: 'SCAN METHOD', sectionScanResult: 'SCAN RESULT',
    typeUrl: 'Link/URL', typeText: 'Text',
    labelUrl: 'URL / Link', labelSsid: 'Network Name (SSID)', labelPass: 'Password',
    labelEncrypt: 'Encryption', encNone: 'None',
    labelFirst: 'First Name', labelLast: 'Last Name', labelPhone: 'Phone Number',
    labelOrg: 'Company', labelText: 'Free Text',
    labelDotStyle: 'Pixel Style', dsSquare: 'Square', dsRounded: 'Rounded', dsDots: 'Dots',
    labelFgColor: 'QR Color', labelBgColor: 'Background',
    labelSize: 'QR Size', labelMargin: 'Margin', labelEcc: 'Error Correction', labelLogo: 'Center Logo',
    btnGenerate: 'Generate QR Code',
    btnDownloadPng: 'Download PNG', btnDownloadSvg: 'Download SVG', btnCopy: 'Copy Image',
    scanCamera: 'Live Camera', scanFile: 'Upload File',
    btnStartCamera: 'Start Camera', btnStopCamera: 'Stop Camera',
    dropzoneText: 'Drag & drop a QR Code image', dropzoneHint: 'or click to select a file (PNG, JPG, GIF, WebP)',
    btnOpen: 'Open URL', btnCopyResult: 'Copy Result',
    privacyText: '100% Offline Local Processing. Your Data is Secure.',
    toastCopied: 'Copied!', toastDownloaded: 'Downloaded!', toastNoData: 'Please enter some data.',
    toastInvalidUrl: 'Please enter a valid URL.', toastNoSsid: 'Please enter a Wi-Fi network name.',
    toastNoName: 'Please enter at least a first name.', toastTooLong: 'Data too long. Reduce text.',
    toastDecodeOk: 'QR read successfully!', toastDecodeErr: 'Cannot read QR Code.',
    toastCameraErr: 'Cannot access camera.', toastCamDenied: 'Camera permission denied.',
    sectionPreview: 'LIVE PREVIEW',
    previewPlaceholder: 'Start typing to see QR preview',
    lpScannable: 'Scannable',
    labelDotStyle: 'Dot Style', dsSquare: 'Square', dsRounded: 'Rounded', dsDots: 'Dots', dsDiamond: 'Diamond', dsStripe: 'Lines',
    labelEyeStyle: 'Eye Style', esSquare: 'Square', esRounded: 'Rounded', esCircle: 'Circle', esLeaf: 'Leaf',
  }
};

let lang = 'id';

function t(key) { return (T[lang] && T[lang][key]) || (T.id[key] || key); }

function applyLang(l) {
  if (!T[l]) return;
  lang = l;
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const k = el.getAttribute('data-i18n');
    if (T[lang][k] !== undefined) el.textContent = T[lang][k];
  });
}

/* ── Theme Sync ── */
window.syncTheme = function(dark) {
  document.documentElement.classList.toggle('dark', !!dark);
  document.documentElement.classList.toggle('light', !dark);
};
window.syncLang = function(l) { applyLang(l); };
window.addEventListener('message', e => {
  if (!e.data) return;
  if (e.data.type === 'syncTheme') window.syncTheme(e.data.dark);
  if (e.data.type === 'syncLang') window.syncLang(e.data.lang);
});

/* ── Toast ── */
let toastTimer;
function showToast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2200);
}

/* ── State ── */
const state = {
  type: 'url',
  dotStyle: 'square',
  eyeStyle: 'square',
  fgColor: '#1C1C1E',
  bgColor: '#FFFFFF',
  size: 300,
  margin: 4,
  ecc: 'Q',
  logo: 'none',
  logoDataUrl: null,
  scanMethod: 'camera',
};

/* ── QR Data Builders ── */
function buildQrData() {
  switch(state.type) {
    case 'url': {
      const v = document.getElementById('input-url').value.trim();
      if (!v) { showToast(t('toastNoData')); return null; }
      if (!/^https?:\/\//i.test(v) && !/^ftp:\/\//i.test(v)) {
        showToast(t('toastInvalidUrl')); return null;
      }
      return v;
    }
    case 'wifi': {
      const ssid = document.getElementById('input-ssid').value.trim();
      if (!ssid) { showToast(t('toastNoSsid')); return null; }
      const pass = document.getElementById('input-wifipass').value;
      const enc = document.querySelector('#wifi-encrypt .seg-btn.active')?.dataset.val || 'WPA';
      const p = enc === 'nopass' ? '' : pass;
      return `WIFI:T:${enc};S:${ssid};P:${p};;`;
    }
    case 'vcard': {
      const fn = document.getElementById('input-firstname').value.trim();
      if (!fn) { showToast(t('toastNoName')); return null; }
      const ln = document.getElementById('input-lastname').value.trim();
      const phone = document.getElementById('input-phone').value.trim();
      const email = document.getElementById('input-email').value.trim();
      const org = document.getElementById('input-org').value.trim();
      const url = document.getElementById('input-website').value.trim();
      let v = `BEGIN:VCARD\nVERSION:3.0\nN:${ln};${fn};;;\nFN:${fn} ${ln}`.trim();
      if (phone) v += `\nTEL;TYPE=CELL:${phone}`;
      if (email) v += `\nEMAIL:${email}`;
      if (org) v += `\nORG:${org}`;
      if (url) v += `\nURL:${url}`;
      v += '\nEND:VCARD';
      return v;
    }
    case 'text': {
      const v = document.getElementById('input-text').value.trim();
      if (!v) { showToast(t('toastNoData')); return null; }
      if (v.length > 900) { showToast(t('toastTooLong')); return null; }
      return v;
    }
  }
  return null;
}

/* ── Silent Data Builder (no toasts — for live preview) ── */
function buildQrDataSilent() {
  try {
    switch(state.type) {
      case 'url': {
        const v = document.getElementById('input-url').value.trim();
        if (!v || (!/^https?:\/\//i.test(v) && !/^ftp:\/\//i.test(v))) return null;
        return v;
      }
      case 'wifi': {
        const ssid = document.getElementById('input-ssid').value.trim();
        if (!ssid) return null;
        const pass = document.getElementById('input-wifipass').value;
        const enc = document.querySelector('#wifi-encrypt .seg-btn.active')?.dataset.val || 'WPA';
        const p = enc === 'nopass' ? '' : pass;
        return `WIFI:T:${enc};S:${ssid};P:${p};;`;
      }
      case 'vcard': {
        const fn = document.getElementById('input-firstname').value.trim();
        if (!fn) return null;
        const ln = document.getElementById('input-lastname').value.trim();
        const phone = document.getElementById('input-phone').value.trim();
        const email = document.getElementById('input-email').value.trim();
        const org = document.getElementById('input-org').value.trim();
        const url = document.getElementById('input-website').value.trim();
        let v = `BEGIN:VCARD\nVERSION:3.0\nN:${ln};${fn};;;\nFN:${fn} ${ln}`.trim();
        if (phone) v += `\nTEL;TYPE=CELL:${phone}`;
        if (email) v += `\nEMAIL:${email}`;
        if (org) v += `\nORG:${org}`;
        if (url) v += `\nURL:${url}`;
        v += '\nEND:VCARD';
        return v;
      }
      case 'text': {
        const v = document.getElementById('input-text').value.trim();
        if (!v || v.length > 900) return null;
        return v;
      }
    }
  } catch { /* ignore */ }
  return null;
}

/* ── Live Preview ── */
let lpDebounceTimer = null;
const LP_SIZE = 180; // preview canvas size in px

function livePreview() {
  clearTimeout(lpDebounceTimer);
  // Show pulse immediately
  document.getElementById('lp-canvas-bg')?.classList.add('updating');
  lpDebounceTimer = setTimeout(renderLivePreview, 420);
}

async function renderLivePreview() {
  const data = buildQrDataSilent();
  const placeholder = document.getElementById('lp-placeholder');
  const canvasWrap = document.getElementById('lp-canvas-wrap');
  const canvasBg = document.getElementById('lp-canvas-bg');
  const lpCanvas = document.getElementById('lp-canvas');
  const badge = document.getElementById('lp-type-badge');

  if (!data) {
    placeholder.style.display = 'flex';
    canvasWrap.style.display = 'none';
    canvasBg.classList.remove('updating');
    return;
  }

  try {
    await drawQRToCanvas(
      lpCanvas, data, LP_SIZE, state.margin,
      state.fgColor, state.bgColor, state.ecc,
      state.dotStyle, state.eyeStyle,
      state.logo, state.logoDataUrl
    );

    // Update type badge
    const typeMap = { wifi: 'wifi', vcard: 'vcard', text: 'text', url: 'url' };
    badge.textContent = state.type.toUpperCase();
    badge.className = 'lp-type-badge ' + (typeMap[state.type] || 'url');

    // Checkerboard for transparent bg
    if (state.bgColor === 'transparent') {
      canvasBg.classList.remove('solid-bg');
    } else {
      canvasBg.classList.add('solid-bg');
      canvasBg.style.background = state.bgColor;
    }

    placeholder.style.display = 'none';
    canvasWrap.style.display = 'flex';

  } catch(e) {
    console.warn('Live preview error:', e);
    placeholder.style.display = 'flex';
    canvasWrap.style.display = 'none';
  }

  canvasBg.classList.remove('updating');
}

/* ── QR Shape Helpers ── */

function isEyeModule(row, col, numCells) {
  if (row < 7 && col < 7) return true;               // Top-left
  if (row < 7 && col >= numCells - 7) return true;   // Top-right
  if (row >= numCells - 7 && col < 7) return true;   // Bottom-left
  return false;
}

function fillBg(ctx, x, y, w, h, bg, r) {
  if (bg === 'transparent') {
    ctx.clearRect(x, y, w, h);
  } else {
    ctx.fillStyle = bg;
    if (r) drawRoundedRect(ctx, x, y, w, h, r);
    else ctx.fillRect(x, y, w, h);
  }
}

function drawModuleDot(ctx, x, y, cs, style) {
  switch(style) {
    case 'rounded': {
      const r = cs * 0.32;
      drawRoundedRect(ctx, x + 0.5, y + 0.5, cs - 1, cs - 1, r);
      break;
    }
    case 'dots':
      ctx.beginPath();
      ctx.arc(x + cs/2, y + cs/2, cs * 0.44, 0, Math.PI * 2);
      ctx.fill();
      break;
    case 'diamond': {
      const cx = x + cs/2, cy = y + cs/2, r = cs * 0.46;
      ctx.beginPath();
      ctx.moveTo(cx, cy - r); ctx.lineTo(cx + r, cy);
      ctx.lineTo(cx, cy + r); ctx.lineTo(cx - r, cy);
      ctx.closePath(); ctx.fill();
      break;
    }
    case 'h-stripe':
      ctx.fillRect(x, y + cs * 0.22, cs, cs * 0.56);
      break;
    default: // square
      ctx.fillRect(x, y, cs, cs);
  }
}

function drawEyePattern(ctx, ex, ey, cs, fg, bg, eyeStyle) {
  const s7 = 7*cs, s5 = 5*cs, s3 = 3*cs, p1 = cs, p2 = 2*cs;
  const bgSolid = (bg !== 'transparent');

  const clearGap = (x, y, w, h, r) => {
    if (bgSolid) { ctx.fillStyle = bg; if(r) drawRoundedRect(ctx,x,y,w,h,r); else ctx.fillRect(x,y,w,h); }
    else {
      const sv = ctx.globalCompositeOperation;
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = 'rgba(0,0,0,1)';
      if(r) drawRoundedRect(ctx,x,y,w,h,r); else ctx.fillRect(x,y,w,h);
      ctx.globalCompositeOperation = sv;
    }
  };

  if (eyeStyle === 'square') {
    ctx.fillStyle = fg; ctx.fillRect(ex, ey, s7, s7);
    clearGap(ex+p1, ey+p1, s5, s5);
    ctx.fillStyle = fg; ctx.fillRect(ex+p2, ey+p2, s3, s3);

  } else if (eyeStyle === 'rounded') {
    const ro = cs * 1.5, ri = cs * 0.85;
    ctx.fillStyle = fg; drawRoundedRect(ctx, ex, ey, s7, s7, ro);
    clearGap(ex+p1, ey+p1, s5, s5, ro * 0.55);
    ctx.fillStyle = fg; drawRoundedRect(ctx, ex+p2, ey+p2, s3, s3, ri);

  } else if (eyeStyle === 'circle') {
    const cx = ex + s7/2, cy = ey + s7/2;
    ctx.fillStyle = fg;
    ctx.beginPath(); ctx.arc(cx, cy, s7/2, 0, Math.PI*2); ctx.fill();
    clearGap(cx, cy, 0, 0); // use arc-based clear
    // Manually clear the ring gap
    if (bgSolid) {
      ctx.fillStyle = bg;
      ctx.beginPath(); ctx.arc(cx, cy, s7/2 - cs, 0, Math.PI*2); ctx.fill();
    } else {
      const sv = ctx.globalCompositeOperation;
      ctx.globalCompositeOperation = 'destination-out'; ctx.fillStyle = 'rgba(0,0,0,1)';
      ctx.beginPath(); ctx.arc(cx, cy, s7/2 - cs, 0, Math.PI*2); ctx.fill();
      ctx.globalCompositeOperation = sv;
    }
    ctx.fillStyle = fg;
    ctx.beginPath(); ctx.arc(cx, cy, s3/2, 0, Math.PI*2); ctx.fill();

  } else if (eyeStyle === 'leaf') {
    // Sharp top-left corner, rounded on other 3 corners
    const r = cs * 2.3;
    ctx.fillStyle = fg;
    ctx.beginPath();
    ctx.moveTo(ex, ey);              // sharp top-left
    ctx.lineTo(ex + s7 - r, ey);
    ctx.quadraticCurveTo(ex+s7, ey,   ex+s7, ey+r);
    ctx.lineTo(ex+s7, ey+s7-r);
    ctx.quadraticCurveTo(ex+s7, ey+s7, ex+s7-r, ey+s7);
    ctx.lineTo(ex+r, ey+s7);
    ctx.quadraticCurveTo(ex, ey+s7,   ex, ey+s7-r);
    ctx.closePath(); ctx.fill();

    // White gap (same leaf shape, inset)
    const ri = r * 0.45;
    if (bgSolid) ctx.fillStyle = bg;
    else { const sv=ctx.globalCompositeOperation; ctx.globalCompositeOperation='destination-out'; ctx.fillStyle='rgba(0,0,0,1)'; }
    ctx.beginPath();
    ctx.moveTo(ex+p1, ey+p1);
    ctx.lineTo(ex+p1+s5-ri, ey+p1);
    ctx.quadraticCurveTo(ex+p1+s5, ey+p1,   ex+p1+s5, ey+p1+ri);
    ctx.lineTo(ex+p1+s5, ey+p1+s5-ri);
    ctx.quadraticCurveTo(ex+p1+s5, ey+p1+s5, ex+p1+s5-ri, ey+p1+s5);
    ctx.lineTo(ex+p1+ri, ey+p1+s5);
    ctx.quadraticCurveTo(ex+p1, ey+p1+s5,   ex+p1, ey+p1+s5-ri);
    ctx.closePath(); ctx.fill();
    if (!bgSolid) ctx.globalCompositeOperation = 'source-over';

    // Inner dot (leaf-shaped)
    const rir = cs * 0.4;
    ctx.fillStyle = fg;
    ctx.beginPath();
    ctx.moveTo(ex+p2, ey+p2);
    ctx.lineTo(ex+p2+s3-rir, ey+p2);
    ctx.quadraticCurveTo(ex+p2+s3, ey+p2,   ex+p2+s3, ey+p2+rir);
    ctx.lineTo(ex+p2+s3, ey+p2+s3-rir);
    ctx.quadraticCurveTo(ex+p2+s3, ey+p2+s3, ex+p2+s3-rir, ey+p2+s3);
    ctx.lineTo(ex+p2+rir, ey+p2+s3);
    ctx.quadraticCurveTo(ex+p2, ey+p2+s3,   ex+p2, ey+p2+s3-rir);
    ctx.closePath(); ctx.fill();
  }
}

/* ── Unified Canvas QR Renderer ── */
async function drawQRToCanvas(canvas, data, canvasSize, margin, fg, bg, ecc, dotStyle, eyeStyle, logo, logoDataUrl) {
  const fgVal = fg === 'transparent' ? '#000000' : fg;
  const bgVal = bg === 'transparent' ? '#00000000' : bg;

  // Fast path: square dots + square eye — use library renderer
  if (dotStyle === 'square' && eyeStyle === 'square') {
    await window.QRCode.toCanvas(canvas, data, {
      errorCorrectionLevel: ecc, margin, width: canvasSize,
      color: { dark: fgVal, light: bgVal }
    });
    if (logo !== 'none') await drawLogo(canvas, logo, logoDataUrl);
    return;
  }

  const qr = window.QRCode.create(data, { errorCorrectionLevel: ecc });
  const modules = qr.modules;
  const numCells = modules.size;
  const ctx = canvas.getContext('2d');
  canvas.width = canvasSize;
  canvas.height = canvasSize;

  // Background
  if (bg === 'transparent') ctx.clearRect(0, 0, canvasSize, canvasSize);
  else { ctx.fillStyle = bg; ctx.fillRect(0, 0, canvasSize, canvasSize); }

  // Cell geometry (margin in cells)
  const cellSize = canvasSize / (numCells + margin * 2);
  const offsetX = margin * cellSize;
  const offsetY = margin * cellSize;

  // Draw data modules (skip eye regions)
  ctx.fillStyle = fgVal;
  for (let row = 0; row < numCells; row++) {
    for (let col = 0; col < numCells; col++) {
      if (isEyeModule(row, col, numCells)) continue;
      if (modules.get(row, col)) {
        drawModuleDot(ctx, offsetX + col*cellSize, offsetY + row*cellSize, cellSize, dotStyle);
      }
    }
  }

  // Draw 3 finder-pattern eyes
  const eyePositions = [
    [0, 0], [0, numCells-7], [numCells-7, 0]
  ];
  for (const [r, c] of eyePositions) {
    drawEyePattern(ctx, offsetX + c*cellSize, offsetY + r*cellSize, cellSize, fgVal, bg, eyeStyle);
  }

  if (logo !== 'none') await drawLogo(canvas, logo, logoDataUrl);
}

/* ── Draw QR with Custom Dots ── */
async function generateQR() {
  const data = buildQrData();
  if (!data) return;

  const canvas = document.getElementById('qr-canvas');

  try {
    await drawQRToCanvas(
      canvas, data, state.size, state.margin,
      state.fgColor, state.bgColor, state.ecc,
      state.dotStyle, state.eyeStyle,
      state.logo, state.logoDataUrl
    );

    const sec = document.getElementById('qr-output-section');
    sec.style.display = 'block';
    sec.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  } catch(e) {
    console.error(e);
    showToast(t('toastTooLong'));
  }
}

async function drawCustomQR(canvas, data, size, margin, fg, bg, ecc) {
  // Legacy wrapper — calls unified renderer
  await drawQRToCanvas(canvas, data, size, margin, fg, bg, ecc, state.dotStyle, state.eyeStyle, 'none', null);
}

function drawRoundedRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
  ctx.fill();
}

/* Social Logo SVG paths */
const LOGO_SVGS = {
  whatsapp: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#25D366"><circle cx="12" cy="12" r="12" fill="#25D366"/><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" fill="#fff"/></svg>`,
  instagram: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><defs><linearGradient id="ig" x1="0%" y1="100%" x2="100%" y2="0%"><stop offset="0%" stop-color="#f09433"/><stop offset="25%" stop-color="#e6683c"/><stop offset="50%" stop-color="#dc2743"/><stop offset="75%" stop-color="#cc2366"/><stop offset="100%" stop-color="#bc1888"/></linearGradient></defs><rect width="24" height="24" rx="5" fill="url(#ig)"/><path d="M12 7.5a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9zm0 7.4a2.9 2.9 0 1 1 0-5.8 2.9 2.9 0 0 1 0 5.8zm5.2-7.6a1.05 1.05 0 1 1-2.1 0 1.05 1.05 0 0 1 2.1 0z" fill="#fff"/></svg>`,
  linkedin: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><rect width="24" height="24" rx="3" fill="#0077B5"/><path d="M6.5 9.5h2.5v8H6.5v-8zm1.25-3.5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zM10.5 9.5h2.4v1.1h.03a2.63 2.63 0 0 1 2.37-1.3c2.53 0 3 1.67 3 3.83V17.5H15.8v-3.7c0-.88-.02-2.02-1.23-2.02-1.23 0-1.42.96-1.42 1.95V17.5H10.5v-8z" fill="#fff"/></svg>`,
  youtube: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><rect width="24" height="24" rx="4" fill="#FF0000"/><path d="M19.6 8.6a2 2 0 0 0-1.4-1.4C17 6.8 12 6.8 12 6.8s-5 0-6.2.4A2 2 0 0 0 4.4 8.6C4 9.8 4 12 4 12s0 2.2.4 3.4a2 2 0 0 0 1.4 1.4c1.2.4 6.2.4 6.2.4s5 0 6.2-.4a2 2 0 0 0 1.4-1.4c.4-1.2.4-3.4.4-3.4s0-2.2-.4-3.4zM10.2 14.4V9.6l4.1 2.4-4.1 2.4z" fill="#fff"/></svg>`,
};

async function svgToPng(svgStr, size) {
  return new Promise(resolve => {
    const blob = new Blob([svgStr], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      const c = document.createElement('canvas');
      c.width = size; c.height = size;
      const ctx = c.getContext('2d');
      ctx.drawImage(img, 0, 0, size, size);
      URL.revokeObjectURL(url);
      resolve(c.toDataURL());
    };
    img.src = url;
  });
}

async function drawLogo(canvas, logoKey, customDataUrl) {
  const ctx = canvas.getContext('2d');
  const size = canvas.width;
  const logoSize = size * 0.22;
  const x = (size - logoSize) / 2;
  const y = (size - logoSize) / 2;

  let src;
  if (logoKey === 'custom' && customDataUrl) {
    src = customDataUrl;
  } else if (LOGO_SVGS[logoKey]) {
    src = await svgToPng(LOGO_SVGS[logoKey], 128);
  } else return;

  await new Promise(resolve => {
    const img = new Image();
    img.onload = () => {
      // White background behind logo
      const padding = logoSize * 0.12;
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      const br = (logoSize + padding * 2) * 0.22;
      roundRect(ctx, x - padding, y - padding, logoSize + padding * 2, logoSize + padding * 2, br);
      ctx.fill();
      ctx.drawImage(img, x, y, logoSize, logoSize);
      resolve();
    };
    img.onerror = resolve;
    img.src = src;
  });
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

/* ── Download & Copy ── */
function downloadPNG() {
  const canvas = document.getElementById('qr-canvas');
  const a = document.createElement('a');
  a.href = canvas.toDataURL('image/png');
  a.download = 'qrcode-master.png';
  a.click();
  showToast(t('toastDownloaded'));
}

function downloadSVG() {
  // Generate simple SVG using qrcode lib
  const data = buildQrData();
  if (!data) return;
  window.QRCode.toString(data, {
    type: 'svg',
    errorCorrectionLevel: state.ecc,
    margin: state.margin,
    color: { dark: state.fgColor === 'transparent' ? '#000' : state.fgColor, light: state.bgColor === 'transparent' ? '#ffffff00' : state.bgColor }
  }, (err, svgStr) => {
    if (err) { showToast('Error'); return; }
    const blob = new Blob([svgStr], { type: 'image/svg+xml' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'qrcode-master.svg';
    a.click();
    showToast(t('toastDownloaded'));
  });
}

async function copyPNG() {
  const canvas = document.getElementById('qr-canvas');
  try {
    canvas.toBlob(async blob => {
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      showToast(t('toastCopied'));
    });
  } catch {
    showToast(t('toastCopied') + ' ❌');
  }
}

/* ── Scanner ── */
let cameraStream = null;
let scanAnimId = null;

async function startCamera() {
  const video = document.getElementById('scan-video');
  const btn = document.getElementById('btn-start-camera');
  const stopBtn = document.getElementById('btn-stop-camera');

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
    });
    cameraStream = stream;
    video.srcObject = stream;
    await video.play();
    btn.style.display = 'none';
    stopBtn.style.display = 'flex';
    scanLoop();
  } catch(e) {
    if (e.name === 'NotAllowedError') showToast(t('toastCamDenied'));
    else showToast(t('toastCameraErr'));
  }
}

function stopCamera() {
  if (cameraStream) {
    cameraStream.getTracks().forEach(t => t.stop());
    cameraStream = null;
  }
  if (scanAnimId) { cancelAnimationFrame(scanAnimId); scanAnimId = null; }
  const video = document.getElementById('scan-video');
  video.srcObject = null;
  document.getElementById('btn-start-camera').style.display = 'flex';
  document.getElementById('btn-stop-camera').style.display = 'none';
}

function scanLoop() {
  const video = document.getElementById('scan-video');
  const canvas = document.getElementById('scan-canvas');

  function tick() {
    if (!cameraStream) return;
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: 'dontInvert' });
      if (code) {
        showScanResult(code.data);
        stopCamera();
        return;
      }
    }
    scanAnimId = requestAnimationFrame(tick);
  }
  scanAnimId = requestAnimationFrame(tick);
}

function decodeImageFile(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    const img = document.getElementById('scan-preview-img');
    img.src = e.target.result;
    img.onload = () => {
      document.getElementById('scan-preview-wrap').style.display = 'flex';
      const canvas = document.getElementById('scan-canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: 'attemptBoth' });
      if (code) {
        showScanResult(code.data);
      } else {
        showScanError(t('toastDecodeErr'));
      }
    };
  };
  reader.readAsDataURL(file);
}

function detectResultType(text) {
  if (/^https?:\/\//i.test(text)) return 'URL';
  if (/^WIFI:/i.test(text)) return 'WiFi';
  if (/^BEGIN:VCARD/i.test(text)) return 'vCard';
  return 'TEXT';
}

function showScanResult(text) {
  const sec = document.getElementById('scan-result-section');
  const errEl = document.getElementById('scan-error-msg');
  const textEl = document.getElementById('result-text');
  const badge = document.getElementById('result-type-badge');
  const openBtn = document.getElementById('btn-open-url');

  errEl.style.display = 'none';
  const rtype = detectResultType(text);
  badge.textContent = rtype;
  badge.className = 'result-type-badge ' + rtype.toLowerCase();
  textEl.textContent = text;

  if (rtype === 'URL') {
    openBtn.style.display = 'flex';
    openBtn.onclick = () => window.open(text, '_blank', 'noopener');
  } else {
    openBtn.style.display = 'none';
  }

  sec.style.display = 'block';
  sec.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  showToast(t('toastDecodeOk'));
}

function showScanError(msg) {
  const errEl = document.getElementById('scan-error-msg');
  errEl.textContent = msg;
  errEl.style.display = 'block';
  document.getElementById('scan-result-section').style.display = 'none';
}

/* ── UI Wiring ── */
document.addEventListener('DOMContentLoaded', () => {
  // Initial lang
  applyLang(window.__initialLang || 'id');

  // ── Tabs ──
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      document.querySelectorAll('.tab-btn').forEach(b => { b.classList.remove('active'); b.setAttribute('aria-selected', 'false'); });
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');
      document.getElementById('panel-' + tab).classList.add('active');
      if (tab === 'scan') stopCamera();
    });
  });

  // ── Type Chips ──
  document.querySelectorAll('.type-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.type-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      state.type = chip.dataset.type;
      document.querySelectorAll('.form-panel').forEach(f => f.classList.remove('active'));
      document.getElementById('form-' + state.type).classList.add('active');
      livePreview();
    });
  });

  // ── Live Preview: Input field listeners ──
  ['input-url','input-ssid','input-wifipass','input-firstname','input-lastname',
   'input-phone','input-email','input-org','input-website','input-text'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', livePreview);
  });

  // ── Dot Style ──
  document.querySelectorAll('#dot-style-ctrl .style-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#dot-style-ctrl .style-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.dotStyle = btn.dataset.val;
      livePreview();
    });
  });

  // ── Eye Style ──
  document.querySelectorAll('#eye-style-ctrl .style-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#eye-style-ctrl .style-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.eyeStyle = btn.dataset.val;
      livePreview();
    });
  });

  // ── Wi-Fi Encryption ──
  document.querySelectorAll('#wifi-encrypt .seg-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#wifi-encrypt .seg-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      livePreview();
    });
  });

  // ── ECC ──
  document.querySelectorAll('#ecc-ctrl .seg-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#ecc-ctrl .seg-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.ecc = btn.dataset.val;
      livePreview();
    });
  });

  // ── Foreground Color Presets ──
  document.querySelectorAll('#fg-presets .color-dot').forEach(dot => {
    dot.addEventListener('click', () => {
      document.querySelectorAll('#fg-presets .color-dot').forEach(d => d.classList.remove('active'));
      dot.classList.add('active');
      state.fgColor = dot.dataset.color;
      document.getElementById('fg-color-picker').value = state.fgColor;
      livePreview();
    });
  });
  document.getElementById('fg-color-picker').addEventListener('input', e => {
    state.fgColor = e.target.value;
    document.querySelectorAll('#fg-presets .color-dot').forEach(d => d.classList.remove('active'));
    livePreview();
  });

  // ── Background Color Presets ──
  document.querySelectorAll('#bg-presets .color-dot').forEach(dot => {
    dot.addEventListener('click', () => {
      document.querySelectorAll('#bg-presets .color-dot').forEach(d => d.classList.remove('active'));
      dot.classList.add('active');
      state.bgColor = dot.dataset.color;
      if (dot.dataset.color !== 'transparent') document.getElementById('bg-color-picker').value = dot.dataset.color;
      livePreview();
    });
  });
  document.getElementById('bg-color-picker').addEventListener('input', e => {
    state.bgColor = e.target.value;
    document.querySelectorAll('#bg-presets .color-dot').forEach(d => d.classList.remove('active'));
    livePreview();
  });

  // ── Sliders ──
  const sizeSlider = document.getElementById('size-slider');
  const sizeVal = document.getElementById('size-val');
  sizeSlider.addEventListener('input', () => { state.size = +sizeSlider.value; sizeVal.textContent = state.size; livePreview(); });

  const marginSlider = document.getElementById('margin-slider');
  const marginVal = document.getElementById('margin-val');
  marginSlider.addEventListener('input', () => { state.margin = +marginSlider.value; marginVal.textContent = state.margin; livePreview(); });

  // ── Logo Presets ──
  document.querySelectorAll('.logo-preset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.logo-preset-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.logo = btn.dataset.logo;
      if (state.logo !== 'custom') state.logoDataUrl = null;
      // Boost ECC to H if logo active
      if (state.logo !== 'none') {
        document.querySelectorAll('#ecc-ctrl .seg-btn').forEach(b => b.classList.remove('active'));
        const eccH = document.getElementById('ecc-h');
        eccH.classList.add('active'); state.ecc = 'H';
      }
      livePreview();
    });
  });

  // ── Logo Upload ──
  document.getElementById('logo-upload').addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      state.logoDataUrl = ev.target.result;
      state.logo = 'custom';
      document.querySelectorAll('.logo-preset-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('#ecc-ctrl .seg-btn').forEach(b => b.classList.remove('active'));
      document.getElementById('ecc-h').classList.add('active'); state.ecc = 'H';
      document.getElementById('logo-upload-label').style.borderColor = 'var(--apple-blue)';
      document.getElementById('logo-upload-label').style.color = 'var(--apple-blue)';
      livePreview();
    };
    reader.readAsDataURL(file);
  });

  // ── Eye Toggle ──
  document.getElementById('btn-eye').addEventListener('click', () => {
    const inp = document.getElementById('input-wifipass');
    const open = document.getElementById('eye-open');
    const closed = document.getElementById('eye-closed');
    if (inp.type === 'password') { inp.type = 'text'; open.style.display = 'none'; closed.style.display = 'block'; }
    else { inp.type = 'password'; open.style.display = 'block'; closed.style.display = 'none'; }
  });

  // ── Char Counter ──
  document.getElementById('input-text').addEventListener('input', e => {
    const len = e.target.value.length;
    document.getElementById('char-count').textContent = len + ' / 900';
    livePreview();
    document.getElementById('char-count').style.color = len > 850 ? 'var(--apple-red)' : 'var(--apple-label)';
  });

  // ── Generate ──
  document.getElementById('btn-generate').addEventListener('click', generateQR);

  // Enter key on inputs
  ['input-url','input-ssid'].forEach(id => {
    document.getElementById(id).addEventListener('keydown', e => { if (e.key === 'Enter') generateQR(); });
  });

  // ── Download & Copy ──
  document.getElementById('btn-download-png').addEventListener('click', downloadPNG);
  document.getElementById('btn-download-svg').addEventListener('click', downloadSVG);
  document.getElementById('btn-copy-png').addEventListener('click', copyPNG);

  // ── Scan Method ──
  document.querySelectorAll('#scan-method-ctrl .seg-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#scan-method-ctrl .seg-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.scanMethod = btn.dataset.val;
      stopCamera();
      document.getElementById('camera-panel').style.display = btn.dataset.val === 'camera' ? 'block' : 'none';
      document.getElementById('file-drop-panel').style.display = btn.dataset.val === 'file' ? 'block' : 'none';
      document.getElementById('scan-result-section').style.display = 'none';
      document.getElementById('scan-error-msg').style.display = 'none';
      document.getElementById('scan-preview-wrap').style.display = 'none';
    });
  });

  // ── Camera Buttons ──
  document.getElementById('btn-start-camera').addEventListener('click', startCamera);
  document.getElementById('btn-stop-camera').addEventListener('click', stopCamera);

  // ── File Drop ──
  const dropzone = document.getElementById('dropzone');
  const fileInput = document.getElementById('scan-file-input');

  dropzone.addEventListener('dragover', e => { e.preventDefault(); dropzone.classList.add('dragover'); });
  dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));
  dropzone.addEventListener('drop', e => {
    e.preventDefault(); dropzone.classList.remove('dragover');
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) decodeImageFile(file);
  });
  fileInput.addEventListener('change', e => { if (e.target.files[0]) decodeImageFile(e.target.files[0]); });

  // ── Copy Result ──
  document.getElementById('btn-copy-result').addEventListener('click', async () => {
    const text = document.getElementById('result-text').textContent;
    try {
      await navigator.clipboard.writeText(text);
      showToast(t('toastCopied'));
    } catch { showToast(t('toastCopied')); }
  });
});
