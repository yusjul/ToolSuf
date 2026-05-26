(function() {
  try {
    var p = window.parent.document.documentElement;
    if (p.classList.contains('dark')) { document.documentElement.classList.add('dark'); }
    else { document.documentElement.classList.add('light'); }
  } catch(e) { document.documentElement.classList.add('light'); }
  var lang = new URLSearchParams(window.location.search).get('lang');
  window.__initialLang = lang === 'en' ? 'en' : 'id';
})();

const translations = {
  id: {
    selectVideo: 'PILIH VIDEO',
    dropTitle: 'Pilih video untuk ditingkatkan ke UHD',
    dropSub: 'Seret & lepas atau klik untuk memilih',
    comparison: 'PERBANDINGAN',
    cmpEmpty: 'Pilih video untuk perbandingan',
    original: 'Asli',
    result: 'UHD',
    settings: 'PENGATURAN',
    targetRes: 'Resolusi Target',
    frameRate: 'Frame Rate',
    quality: 'Kualitas',
    fpsOrig: 'Original',
    qlow: 'Rendah',
    qmid: 'Sedang',
    qhigh: 'Tinggi',
    qloss: 'Lossless',
    convertBtn: 'Konversi ke UHD',
    clear: 'Hapus',
    processing: 'Memproses...',
    readingVideo: 'Membaca video...',
    extracting: 'Menyiapkan frame...',
    converting: 'Mengonversi frame',
    of: 'dari',
    finalizing: 'Menyelesaikan...',
    success: 'Video UHD berhasil dibuat!',
    noFile: 'Pilih file video terlebih dahulu',
    error: 'Gagal mengonversi video. Coba lagi.',
    errorFormat: 'Format video tidak didukung.',
    tooLarge: 'Video terlalu panjang. Maksimal 60 detik untuk web.',
    videoInfo: 'INFORMASI VIDEO',
    resolution: 'Resolusi',
    fileSize: 'Ukuran',
    duration: 'Durasi',
    bitrate: 'Bitrate',
    estimated: 'Estimasi',
  },
  en: {
    selectVideo: 'SELECT VIDEO',
    dropTitle: 'Select a video to upscale to UHD',
    dropSub: 'Drag & drop or click to browse',
    comparison: 'COMPARISON',
    cmpEmpty: 'Select a video for comparison',
    original: 'Original',
    result: 'UHD',
    settings: 'SETTINGS',
    targetRes: 'Target Resolution',
    frameRate: 'Frame Rate',
    quality: 'Quality',
    fpsOrig: 'Original',
    qlow: 'Low',
    qmid: 'Medium',
    qhigh: 'High',
    qloss: 'Lossless',
    convertBtn: 'Convert to UHD',
    clear: 'Clear',
    processing: 'Processing...',
    readingVideo: 'Reading video...',
    extracting: 'Preparing frames...',
    converting: 'Converting frame',
    of: 'of',
    finalizing: 'Finalizing...',
    success: 'UHD video created successfully!',
    noFile: 'Please select a video file first',
    error: 'Failed to convert video. Try again.',
    errorFormat: 'Video format not supported.',
    tooLarge: 'Video is too long. Max 60 seconds for web.',
    videoInfo: 'VIDEO INFO',
    resolution: 'Resolution',
    fileSize: 'File Size',
    duration: 'Duration',
    bitrate: 'Bitrate',
    estimated: 'Estimate',
  }
};

let currentLang = 'id';
let videoFile = null;
let videoMeta = null;
let cmpDragging = false;
let cmpPos = 50;

function t(key) {
  return (translations[currentLang] && translations[currentLang][key]) || key;
}

function applyLang(lang) {
  currentLang = lang;
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (translations[lang] && translations[lang][key]) {
      if (el.tagName === 'OPTION') el.textContent = translations[lang][key];
      else el.textContent = translations[lang][key];
    }
  });
  document.getElementById('lblOriginal').textContent = t('original');
  document.getElementById('lblResult').textContent = t('result');
}

window.syncTheme = function(dark) {
  const htmlEl = document.documentElement;
  htmlEl.classList.toggle('dark', !!dark);
  htmlEl.classList.toggle('light', !dark);
};

window.syncLang = function(lang) {
  if (!translations[lang]) return;
  applyLang(lang);
};

window.addEventListener('message', function(e) {
  if (e.data && e.data.type === 'syncTheme' && typeof window.syncTheme === 'function') {
    window.syncTheme(e.data.dark);
  }
  if (e.data && e.data.type === 'syncLang' && typeof window.syncLang === 'function') {
    window.syncLang(e.data.lang);
  }
});

const drop = document.getElementById('drop');
const fileInput = document.getElementById('fi');
const cmpSection = document.getElementById('cmpSection');
const cmpContainer = document.getElementById('cmpContainer');
const cmpEmpty = document.getElementById('cmpEmpty');
const cmpImages = document.getElementById('cmpImages');
const cmpVideo = document.getElementById('cmpVideo');
const cmpUhdCanvas = document.getElementById('cmpUhdCanvas');
const cmpAfter = document.getElementById('cmpAfter');
const cmpHandle = document.getElementById('cmpHandle');
const playBtn = document.getElementById('playBtn');
const playStatus = document.getElementById('playStatus');
const convBtn = document.getElementById('convBtn');
const progressCard = document.getElementById('progressCard');
const progressText = document.getElementById('progressText');

const alertBox = document.getElementById('alertBox');
const infoSection = document.getElementById('infoSection');
const infoOrigRes = document.getElementById('infoOrigRes');
const infoUhdRes = document.getElementById('infoUhdRes');
const infoOrigSize = document.getElementById('infoOrigSize');
const infoUhdSize = document.getElementById('infoUhdSize');
const infoDuration = document.getElementById('infoDuration');
const infoFps = document.getElementById('infoFps');
const infoOrigBitrate = document.getElementById('infoOrigBitrate');
const infoUhdBitrate = document.getElementById('infoUhdBitrate');

let isPlaying = false;
let rafId = null;

drop.addEventListener('click', () => fileInput.click());

drop.addEventListener('dragover', (e) => {
  e.preventDefault();
  drop.classList.add('over');
});

drop.addEventListener('dragleave', () => {
  drop.classList.remove('over');
});

drop.addEventListener('drop', (e) => {
  e.preventDefault();
  drop.classList.remove('over');
  const file = e.dataTransfer.files[0];
  if (file && file.type.startsWith('video/')) handleFile(file);
});

fileInput.addEventListener('change', () => {
  if (fileInput.files.length) handleFile(fileInput.files[0]);
});

// Comparison slider
cmpContainer.addEventListener('mousedown', e => { cmpDragging = true; updateCmpPos(e); });
document.addEventListener('mousemove', e => { if (cmpDragging) updateCmpPos(e); });
document.addEventListener('mouseup', () => { cmpDragging = false; });
cmpContainer.addEventListener('touchstart', e => { cmpDragging = true; updateCmpPos(e.touches[0]); });
document.addEventListener('touchmove', e => { if (cmpDragging) updateCmpPos(e.touches[0]); });
document.addEventListener('touchend', () => { cmpDragging = false; });

function updateCmpPos(e) {
  const rect = cmpContainer.getBoundingClientRect();
  cmpPos = Math.max(5, Math.min(95, ((e.clientX - rect.left) / rect.width) * 100));
  cmpAfter.style.clipPath = `inset(0 ${100 - cmpPos}% 0 0)`;
  cmpHandle.style.left = cmpPos + '%';
}

async function handleFile(file) {
  alertBox.style.display = 'none';
  videoFile = file;
  convBtn.disabled = true;
  stopPlayback();

  const url = URL.createObjectURL(file);
  cmpVideo.src = url;

  cmpVideo.addEventListener('loadedmetadata', () => {
    const w = cmpVideo.videoWidth;
    const h = cmpVideo.videoHeight;
    const dur = cmpVideo.duration;
    const fileSize = file.size;
    const origBitrate = Math.round(fileSize * 8 / dur);

    videoMeta = { w, h, dur, fileSize, origBitrate, fps: 30 };

    if (dur > 60) {
      showAlert(t('tooLarge'), 'err');
      return;
    }

    convBtn.disabled = false;
    fileInput.value = '';

    setupComparison();
    cmpSection.style.display = 'block';
    cmpEmpty.style.display = 'none';
    cmpImages.style.display = 'block';
    showVideoInfo();

    cmpPos = 50;
    cmpAfter.style.clipPath = `inset(0 50% 0 0)`;
    cmpHandle.style.left = '50%';
  });
}

function setupComparison() {
  const [tw, th] = getTargetRes();
  cmpUhdCanvas.width = tw;
  cmpUhdCanvas.height = th;
  cmpUhdCanvas.style.width = '100%';
  updatePlayStatus();
}

function getTargetRes() {
  return document.getElementById('targetRes').value.split('x').map(Number);
}

function showVideoInfo() {
  if (!videoMeta) return;
  const { w, h, dur, fileSize, origBitrate, fps } = videoMeta;
  const [tw, th] = getTargetRes();
  const fpsVal = document.getElementById('targetFps').value;
  const outFps = fpsVal === '0' ? fps : parseInt(fpsVal);
  const qualityVal = document.getElementById('qualityLevel').value;
  const uhdBitrate = getBitrate(qualityVal, tw, th, outFps);
  const estBytes = uhdBitrate / 8 * dur;
  const estSize = formatSize(estBytes);

  infoOrigRes.textContent = w + '×' + h;
  infoUhdRes.textContent = tw + '×' + th;
  infoOrigSize.textContent = formatSize(fileSize);
  infoUhdSize.textContent = estSize;
  infoUhdSize.removeAttribute('data-i18n');
  infoDuration.textContent = formatDuration(dur);
  infoFps.textContent = fps + ' FPS' + (fps !== outFps ? ' → ' + outFps + ' FPS' : '');
  infoOrigBitrate.textContent = formatBitrate(origBitrate);
  infoUhdBitrate.textContent = formatBitrate(uhdBitrate);
  infoSection.style.display = 'block';
}

function formatBitrate(bps) {
  if (bps >= 1000000) return (bps / 1000000).toFixed(1) + ' Mbps';
  if (bps >= 1000) return (bps / 1000).toFixed(1) + ' Kbps';
  return bps + ' bps';
}

function applySharpening(ctx, w, h) {
  const data = ctx.getImageData(0, 0, w, h);
  const src = data.data;
  const dst = new Uint8ClampedArray(src);
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const idx = (y * w + x) * 4;
      for (let c = 0; c < 3; c++) {
        const v = src[idx + c];
        const t = src[((y - 1) * w + x) * 4 + c];
        const b = src[((y + 1) * w + x) * 4 + c];
        const l = src[(y * w + (x - 1)) * 4 + c];
        const r = src[(y * w + (x + 1)) * 4 + c];
        dst[idx + c] = Math.min(255, Math.max(0, v * 5 - t - b - l - r));
      }
    }
  }
  ctx.putImageData(new ImageData(dst, w, h), 0, 0);
}

function renderFrame() {
  if (!videoMeta) return;
  const [tw, th] = getTargetRes();
  const ctx = cmpUhdCanvas.getContext('2d');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(cmpVideo, 0, 0, tw, th);
  if (typeof applySharpening !== 'undefined') applySharpening(ctx, tw, th);
}

function startPlayback() {
  if (isPlaying) return;
  isPlaying = true;
  cmpVideo.play();
  playBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>`;

  function loop() {
    renderFrame();
    updatePlayStatus();
    rafId = requestAnimationFrame(loop);
  }
  loop();
}

function stopPlayback() {
  if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
  isPlaying = false;
  cmpVideo.pause();
  playBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>`;
}

function togglePlayback() {
  if (isPlaying) { stopPlayback(); }
  else { startPlayback(); }
}

function updatePlayStatus() {
  const cur = formatDuration(cmpVideo.currentTime);
  const dur = formatDuration(cmpVideo.duration || 0);
  playStatus.textContent = cur + ' / ' + dur;
}

playBtn.addEventListener('click', togglePlayback);

cmpVideo.addEventListener('ended', () => {
  stopPlayback();
  cmpVideo.currentTime = 0;
  renderFrame();
  updatePlayStatus();
});

cmpVideo.addEventListener('timeupdate', () => {
  if (!isPlaying) {
    renderFrame();
    updatePlayStatus();
  }
});

function onSettingChange() {
  if (videoMeta) {
    const [tw, th] = getTargetRes();
    cmpUhdCanvas.width = tw;
    cmpUhdCanvas.height = th;
    cmpUhdCanvas.style.width = '100%';
    renderFrame();
    showVideoInfo();
  }
}
document.getElementById('targetRes').addEventListener('change', onSettingChange);
document.getElementById('targetFps').addEventListener('change', onSettingChange);
document.getElementById('qualityLevel').addEventListener('change', onSettingChange);

async function convertVideo() {
  if (!videoFile || !videoMeta) {
    showAlert(t('noFile'), 'err');
    return;
  }

  stopPlayback();
  convBtn.disabled = true;
  setProgress(0, t('extracting'));

  try {
    const targetRes = document.getElementById('targetRes').value;
    const [outW, outH] = targetRes.split('x').map(Number);
    const fpsVal = document.getElementById('targetFps').value;
    const qualityVal = document.getElementById('qualityLevel').value;

    const fps = fpsVal === '0' ? Math.min(30, Math.round(videoMeta.dur > 0 ? 30 : 30)) : parseInt(fpsVal);
    const frameInterval = 1 / fps;
    const totalFrames = Math.ceil(videoMeta.dur * fps);

    if (totalFrames > 1800) {
      showAlert(t('tooLarge'), 'err');
      convBtn.disabled = false;
      progressCard.style.display = 'none';
      return;
    }

    // Create canvas at target resolution
    const canvas = document.createElement('canvas');
    canvas.width = outW;
    canvas.height = outH;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Setup MediaRecorder
    const stream = canvas.captureStream(fps);
    const mimeType = 'video/webm;codecs=vp9';
    const recorder = new MediaRecorder(stream, {
      mimeType: MediaRecorder.isTypeSupported(mimeType) ? mimeType : 'video/webm',
      videoBitsPerSecond: getBitrate(qualityVal, outW, outH, fps),
    });

    const chunks = [];
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    const recordingDone = new Promise((resolve) => {
      recorder.onstop = resolve;
    });

    recorder.start();

    // Process frames
    cmpVideo.currentTime = 0;
    cmpVideo.playbackRate = 1;

    for (let i = 0; i < totalFrames; i++) {
      const targetTime = i * frameInterval;
      cmpVideo.currentTime = targetTime;

      await new Promise((resolve) => {
        cmpVideo.onseeked = resolve;
        setTimeout(resolve, 50);
      });

      ctx.drawImage(cmpVideo, 0, 0, outW, outH);
      applySharpening(ctx, outW, outH);

      const pct = Math.round((i / totalFrames) * 90);
      setProgress(pct, t('converting') + ' ' + pct + '%');
    }

    setProgress(95, t('finalizing'));

    recorder.stop();
    await recordingDone;

    const blob = new Blob(chunks, { type: 'video/webm' });
    const baseName = videoFile.name.replace(/\.[^.]+$/, '');
    saveAs(blob, baseName + '_UHD.webm');

    infoUhdSize.textContent = formatSize(blob.size);
    infoUhdBitrate.textContent = formatBitrate(Math.round(blob.size * 8 / videoMeta.dur));

    setProgress(100, t('success'));
    showAlert(t('success'), 'ok');
  } catch (e) {
    console.error(e);
    showAlert(t('error'), 'err');
  } finally {
    convBtn.disabled = false;
    setTimeout(() => { progressCard.style.display = 'none'; }, 600);
  }
}

function getBitrate(quality, w, h, fps) {
  const pixels = w * h;
  const base = pixels * fps;
  const levels = {
    '1': base * 0.5,   // lossless-ish
    '5': base * 0.15,  // high
    '10': base * 0.08, // medium
    '20': base * 0.04, // low
  };
  return Math.round(levels[quality] || levels['5']);
}

function clearAll() {
  stopPlayback();
  videoFile = null;
  videoMeta = null;
  cmpVideo.pause();
  cmpVideo.src = '';
  fileInput.value = '';
  cmpSection.style.display = 'none';
  cmpEmpty.style.display = 'block';
  cmpImages.style.display = 'none';
  convBtn.disabled = true;
  progressCard.style.display = 'none';
  infoSection.style.display = 'none';
  infoOrigRes.textContent = '—';
  infoUhdRes.textContent = '—';
  infoOrigSize.textContent = '—';
  infoUhdSize.textContent = '—';
  infoDuration.textContent = '—';
  infoFps.textContent = '—';
  infoOrigBitrate.textContent = '—';
  infoUhdBitrate.textContent = '—';
  alertBox.style.display = 'none';
}

function showAlert(msg, type) {
  alertBox.textContent = msg;
  alertBox.className = 'alert ' + type;
  alertBox.style.display = 'block';
}

function setProgress(pct, text) {
  progressCard.style.display = 'block';
  progressText.textContent = text || t('processing');
}

function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(1) + ' MB';
}

function formatDuration(sec) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return m + ':' + (s < 10 ? '0' : '') + s;
}

function saveAs(blob, name) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

document.addEventListener('DOMContentLoaded', () => {
  if (window.__initialLang) applyLang(window.__initialLang);
});
