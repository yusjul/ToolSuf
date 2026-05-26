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
    dropTitle: 'Pilih video yang mengandung watermark',
    dropSub: 'Seret & lepas atau klik untuk memilih',
    preview: 'PRATINJAU',
    videoInfo: 'INFORMASI VIDEO',
    resolution: 'Resolusi',
    fileSize: 'Ukuran',
    duration: 'Durasi',
    watermark: 'WATERMARK',
    autoDetect: 'Deteksi Otomatis',
    drawHint: 'Klik & tarik pada video untuk menandai area watermark',
    settings: 'PENGATURAN',
    outputRes: 'Resolusi Output',
    origRes: 'Original',
    quality: 'Kualitas',
    qhigh: 'Tinggi',
    qmid: 'Sedang',
    qlow: 'Rendah',
    format: 'Format Output',
    removeBtn: 'Hapus WM',
    clear: 'Hapus',
    processing: 'Memproses...',
    reading: 'Membaca video...',
    detecting: 'Mendeteksi watermark...',
    processingFrames: 'Memproses frame',
    finalizing: 'Menyelesaikan...',
    success: 'Watermark berhasil dihapus!',
    noFile: 'Pilih file video terlebih dahulu',
    noMask: 'Tandai area watermark terlebih dahulu',
    error: 'Gagal memproses video. Coba lagi.',
    tooLarge: 'Video terlalu panjang. Maksimal 60 detik.',
    original: 'Asli',
    result: 'Hasil',
    download: 'Download',
    serverOffline: 'Server tidak aktif. Jalankan run.py terlebih dahulu.',
  },
  en: {
    selectVideo: 'SELECT VIDEO',
    dropTitle: 'Select a video containing watermark',
    dropSub: 'Drag & drop or click to browse',
    preview: 'PREVIEW',
    videoInfo: 'VIDEO INFO',
    resolution: 'Resolution',
    fileSize: 'File Size',
    duration: 'Duration',
    watermark: 'WATERMARK',
    autoDetect: 'Auto Detect',
    drawHint: 'Click & drag on the video to mark watermark area',
    settings: 'SETTINGS',
    outputRes: 'Output Resolution',
    origRes: 'Original',
    quality: 'Quality',
    qhigh: 'High',
    qmid: 'Medium',
    qlow: 'Low',
    format: 'Output Format',
    removeBtn: 'Remove WM',
    clear: 'Clear',
    processing: 'Processing...',
    reading: 'Reading video...',
    detecting: 'Detecting watermark...',
    processingFrames: 'Processing frame',
    finalizing: 'Finalizing...',
    success: 'Watermark removed successfully!',
    noFile: 'Please select a video file first',
    noMask: 'Please mark watermark area first',
    error: 'Failed to process video. Try again.',
    tooLarge: 'Video is too long. Max 60 seconds.',
    original: 'Original',
    result: 'Result',
    download: 'Download',
    serverOffline: 'Server is offline. Please run run.py first.',
  }
};

let currentLang = 'id';
const API_BASE = 'http://localhost:5000';
let videoFile = null;
let videoMeta = null;
let masks = [];
let maskIdCounter = 0;
let drawing = false;
let drawStart = null;
let drawCurrent = null;
let isPlaying = false;
let resultBlob = null;
let resCleanUrl = null;

// ─── i18n ───────────────────────────────────────────────────────────────────
function tr(key) {
  return (translations[currentLang] && translations[currentLang][key]) || key;
}

function applyLang(lang) {
  currentLang = lang;
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (translations[lang] && translations[lang][key]) {
      el.textContent = translations[lang][key];
    }
  });
}

window.syncTheme = function(dark) {
  document.documentElement.classList.toggle('dark', !!dark);
  document.documentElement.classList.toggle('light', !dark);
};

window.syncLang = function(lang) {
  if (!translations[lang]) return;
  applyLang(lang);
};

window.addEventListener('message', function(e) {
  if (e.data && e.data.type === 'syncTheme') window.syncTheme(e.data.dark);
  if (e.data && e.data.type === 'syncLang') window.syncLang(e.data.lang);
});

// ─── DOM refs ────────────────────────────────────────────────────────────────
const drop = document.getElementById('drop');
const fileInput = document.getElementById('fi');
const srcVideo = document.getElementById('srcVideo');
const overlay = document.getElementById('overlay');
const playBtn = document.getElementById('playBtn');
const playStatus = document.getElementById('playStatus');
const playerSection = document.getElementById('playerSection');
const infoSection = document.getElementById('infoSection');
const maskSection = document.getElementById('maskSection');
const settingsSection = document.getElementById('settingsSection');
const maskList = document.getElementById('maskList');
const infoRes = document.getElementById('infoRes');
const infoSize = document.getElementById('infoSize');
const infoDuration = document.getElementById('infoDuration');
const processBtn = document.getElementById('processBtn');
const autoBtn = document.getElementById('autoBtn');
const progressCard = document.getElementById('progressCard');
const progressText = document.getElementById('progressText');
const progressFill = document.getElementById('progressFill');
const alertBox = document.getElementById('alertBox');
const resultSection = document.getElementById('resultSection');
const resultVideo = document.getElementById('resultVideo');

// ─── File handling ───────────────────────────────────────────────────────────
drop.addEventListener('click', () => fileInput.click());

['dragover', 'dragleave', 'drop'].forEach(ev => {
  drop.addEventListener(ev, e => e.preventDefault());
});
drop.addEventListener('dragover', () => drop.classList.add('over'));
drop.addEventListener('dragleave', () => drop.classList.remove('over'));
drop.addEventListener('drop', e => {
  drop.classList.remove('over');
  const file = e.dataTransfer.files[0];
  if (file && file.type.startsWith('video/')) handleFile(file);
});

fileInput.addEventListener('change', () => {
  if (fileInput.files.length) handleFile(fileInput.files[0]);
});

// ─── Overlay canvas ──────────────────────────────────────────────────────────
let overlayCtx = null;

function initOverlay() {
  overlay.width = srcVideo.videoWidth;
  overlay.height = srcVideo.videoHeight;
  overlayCtx = overlay.getContext('2d');
  renderOverlay();
}

function getCanvasPos(e) {
  const rect = overlay.getBoundingClientRect();
  const scaleX = overlay.width / rect.width;
  const scaleY = overlay.height / rect.height;
  const clientX = e.touches ? e.touches[0].clientX : e.clientX;
  const clientY = e.touches ? e.touches[0].clientY : e.clientY;
  return { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY };
}

function renderOverlay() {
  if (!overlayCtx) return;
  overlayCtx.clearRect(0, 0, overlay.width, overlay.height);
  const colors = ['#FF3B30', '#007AFF', '#34C759', '#FF9500', '#5856D6'];
  masks.forEach((m, i) => {
    const c = colors[i % colors.length];
    overlayCtx.strokeStyle = c;
    overlayCtx.lineWidth = 2;
    overlayCtx.setLineDash([]);
    overlayCtx.strokeRect(m.x, m.y, m.w, m.h);
    overlayCtx.fillStyle = c + '22';
    overlayCtx.fillRect(m.x, m.y, m.w, m.h);
    overlayCtx.fillStyle = c;
    overlayCtx.font = '11px -apple-system, SF Pro Display';
    overlayCtx.fillText('#' + (i + 1), m.x + 4, m.y + 14);
  });
}

// ─── Drawing ──────────────────────────────────────────────────────────────────
overlay.addEventListener('mousedown', e => { drawing = true; drawStart = getCanvasPos(e); drawCurrent = drawStart; });
overlay.addEventListener('mousemove', e => {
  if (!drawing) return;
  drawCurrent = getCanvasPos(e);
  renderOverlay();
  drawPreviewRect(drawStart, drawCurrent);
});
overlay.addEventListener('mouseup', () => finishDraw());
overlay.addEventListener('mouseleave', () => { if (drawing) finishDraw(); });

overlay.addEventListener('touchstart', e => { e.preventDefault(); drawing = true; drawStart = getCanvasPos(e); drawCurrent = drawStart; });
overlay.addEventListener('touchmove', e => {
  e.preventDefault();
  if (!drawing) return;
  drawCurrent = getCanvasPos(e);
  renderOverlay();
  drawPreviewRect(drawStart, drawCurrent);
});
overlay.addEventListener('touchend', e => { e.preventDefault(); finishDraw(); });

function drawPreviewRect(a, b) {
  const x = Math.min(a.x, b.x), y = Math.min(a.y, b.y);
  const w = Math.abs(b.x - a.x), h = Math.abs(b.y - a.y);
  if (w < 3 || h < 3) return;
  overlayCtx.strokeStyle = '#FF3B30';
  overlayCtx.lineWidth = 2;
  overlayCtx.setLineDash([6, 3]);
  overlayCtx.strokeRect(x, y, w, h);
  overlayCtx.fillStyle = 'rgba(255,59,48,0.12)';
  overlayCtx.fillRect(x, y, w, h);
}

function finishDraw() {
  if (!drawing) return;
  drawing = false;
  if (!drawCurrent) return;
  const x = Math.min(drawStart.x, drawCurrent.x);
  const y = Math.min(drawStart.y, drawCurrent.y);
  const w = Math.abs(drawCurrent.x - drawStart.x);
  const h = Math.abs(drawCurrent.y - drawStart.y);
  if (w < 10 || h < 10) { renderOverlay(); return; }
  addMask(x, y, w, h);
  renderOverlay();
}

// ─── Mask management ─────────────────────────────────────────────────────────
function addMask(x, y, w, h) {
  const id = ++maskIdCounter;
  masks.push({ id, x, y, w, h });
  renderOverlay();
  renderMaskList();
  processBtn.disabled = false;
}

function removeMask(id) {
  masks = masks.filter(m => m.id !== id);
  renderOverlay();
  renderMaskList();
  if (masks.length === 0) { processBtn.disabled = true; }
}

function clearMasks() {
  masks = [];
  renderOverlay();
  renderMaskList();
  processBtn.disabled = true;
}

function renderMaskList() {
  if (masks.length === 0) { maskList.innerHTML = ''; return; }
  const colors = ['#FF3B30', '#007AFF', '#34C759', '#FF9500', '#5856D6'];
  maskList.innerHTML = masks.map((m, i) => {
    const c = colors[i % colors.length];
    return '<div class="mask-row">' +
      '<span class="mask-row-dot" style="background:' + c + '"></span>' +
      '<span class="mask-row-label">#' + (i + 1) + ' — ' + Math.round(m.w) + '×' + Math.round(m.h) + ' px</span>' +
      '<button class="mask-del" onclick="removeMask(' + m.id + ')">' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>' +
      '</button></div>';
  }).join('');
}

// ─── Video playback ───────────────────────────────────────────────────────────
playBtn.addEventListener('click', togglePlayback);

srcVideo.addEventListener('ended', () => {
  stopPlayback();
  srcVideo.currentTime = 0;
  updatePlayStatus();
});

srcVideo.addEventListener('timeupdate', () => updatePlayStatus());

function startPlayback() {
  if (isPlaying) return;
  isPlaying = true;
  srcVideo.play();
  playBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>';
}

function stopPlayback() {
  isPlaying = false;
  srcVideo.pause();
  playBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>';
}

function togglePlayback() {
  if (isPlaying) stopPlayback();
  else startPlayback();
}

function updatePlayStatus() {
  const cur = formatDuration(srcVideo.currentTime);
  const dur = formatDuration(srcVideo.duration || 0);
  playStatus.textContent = cur + ' / ' + dur;
}

// ─── Load file ────────────────────────────────────────────────────────────────
function handleFile(file) {
  alertBox.style.display = 'none';
  videoFile = file;
  stopPlayback();
  clearMasks();
  progressCard.style.display = 'none';

  const url = URL.createObjectURL(file);
  srcVideo.src = url;

  // Remove any existing listener to avoid stacking
  const onMeta = () => {
    srcVideo.removeEventListener('loadedmetadata', onMeta);
    const w = srcVideo.videoWidth;
    const h = srcVideo.videoHeight;
    const dur = srcVideo.duration;
    const fileSize = file.size;

    videoMeta = { w, h, dur, fileSize };

    if (dur > 60) {
      showAlert(tr('tooLarge'), 'err');
      return;
    }

    fileInput.value = '';
    initOverlay();

    playerSection.style.display = 'block';
    infoSection.style.display = 'block';
    maskSection.style.display = 'block';
    settingsSection.style.display = 'block';

    infoRes.textContent = w + '\u00D7' + h;
    infoSize.textContent = formatSize(fileSize);
    infoDuration.textContent = formatDuration(dur);
    updatePlayStatus();
    processBtn.disabled = true;
  };
  srcVideo.addEventListener('loadedmetadata', onMeta);
}

// ─── Auto detect ──────────────────────────────────────────────────────────────
// BUG FIX: renamed inner `t` variable to `ts` to avoid shadowing tr() function
async function autoDetect() {
  if (!videoMeta || !srcVideo.readyState) {
    showAlert(tr('noFile'), 'err');
    return;
  }

  const numSamples = 6;
  const sampleW = 640;
  const scale = sampleW / videoMeta.w;
  const sampleH = Math.round(videoMeta.h * scale);
  const blockSize = 24;
  const bw = Math.ceil(sampleW / blockSize);
  const bh = Math.ceil(sampleH / blockSize);

  const grabCanvas = document.createElement('canvas');
  grabCanvas.width = sampleW;
  grabCanvas.height = sampleH;
  const grabCtx = grabCanvas.getContext('2d');

  showProgress(0, tr('detecting'));
  autoBtn.disabled = true;

  const frames = [];
  for (let i = 0; i < numSamples; i++) {
    // FIX: renamed loop variable from `t` to `ts` (was shadowing tr())
    const ts = (i / (numSamples - 1)) * videoMeta.dur;
    srcVideo.currentTime = ts;
    await new Promise(r => { srcVideo.onseeked = r; });
    grabCtx.drawImage(srcVideo, 0, 0, sampleW, sampleH);
    frames.push(grabCtx.getImageData(0, 0, sampleW, sampleH));
    showProgress(Math.round((i / numSamples) * 40), tr('detecting'));
  }

  // Crop 2% edge to avoid black bars
  const cropX = Math.round(sampleW * 0.02);
  const cropY = Math.round(sampleH * 0.02);
  const cropW = sampleW - cropX * 2;
  const cropH = sampleH - cropY * 2;
  const cBw = Math.ceil(cropW / blockSize);
  const cBh = Math.ceil(cropH / blockSize);
  const cOffsetX = Math.floor(cropX / blockSize);
  const cOffsetY = Math.floor(cropY / blockSize);

  // Compute block-level variance
  const blockVar = new Float32Array(cBw * cBh);
  for (let by = 0; by < cBh; by++) {
    for (let bx = 0; bx < cBw; bx++) {
      const startY = cropY + by * blockSize;
      const startX = cropX + bx * blockSize;
      const endY = Math.min(startY + blockSize, sampleH);
      const endX = Math.min(startX + blockSize, sampleW);

      let sumR = 0, sumG = 0, sumB = 0, count = 0;
      for (let y = startY; y < endY; y++) {
        for (let x = startX; x < endX; x++) {
          const idx = (y * sampleW + x) * 4;
          for (let f = 0; f < numSamples; f++) {
            sumR += frames[f].data[idx];
            sumG += frames[f].data[idx + 1];
            sumB += frames[f].data[idx + 2];
          }
          count++;
        }
      }
      const totalPx = count * numSamples;
      if (totalPx === 0) continue;
      const avgR = sumR / totalPx;
      const avgG = sumG / totalPx;
      const avgB = sumB / totalPx;

      let variance = 0;
      for (let y = startY; y < endY; y++) {
        for (let x = startX; x < endX; x++) {
          const idx = (y * sampleW + x) * 4;
          for (let f = 0; f < numSamples; f++) {
            variance += (frames[f].data[idx] - avgR) ** 2;
            variance += (frames[f].data[idx + 1] - avgG) ** 2;
            variance += (frames[f].data[idx + 2] - avgB) ** 2;
          }
        }
      }
      blockVar[by * cBw + bx] = variance / (count * numSamples * 3);
    }
    showProgress(40 + Math.round((by / cBh) * 15), tr('detecting'));
  }

  // Adaptive threshold (20th percentile)
  const sorted = [...blockVar].filter(v => v > 0.1).sort((a, b) => a - b);
  if (sorted.length < 10) {
    autoBtn.disabled = false;
    progressCard.style.display = 'none';
    showAlert(tr('error'), 'err');
    return;
  }
  const threshold = sorted[Math.floor(sorted.length * 0.2)];

  const staticBlocks = new Uint8Array(cBw * cBh);
  for (let i = 0; i < cBw * cBh; i++) {
    staticBlocks[i] = blockVar[i] < threshold ? 1 : 0;
  }

  const totalArea = sampleW * sampleH;
  const minArea = totalArea * 0.002;
  const maxArea = totalArea * 0.13;
  const used = new Uint8Array(cBw * cBh);
  const found = [];

  for (let by = 0; by < cBh; by++) {
    for (let bx = 0; bx < cBw; bx++) {
      if (!staticBlocks[by * cBw + bx] || used[by * cBw + bx]) continue;
      let minX = bx, maxX = bx, minY = by, maxY = by;
      const queue = [{ x: bx, y: by }];
      used[by * cBw + bx] = 1;

      while (queue.length) {
        const p = queue.shift();
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const nx = p.x + dx, ny = p.y + dy;
            if (nx < 0 || nx >= cBw || ny < 0 || ny >= cBh) continue;
            if (!staticBlocks[ny * cBw + nx] || used[ny * cBw + nx]) continue;
            used[ny * cBw + nx] = 1;
            queue.push({ x: nx, y: ny });
            if (nx < minX) minX = nx;
            if (nx > maxX) maxX = nx;
            if (ny < minY) minY = ny;
            if (ny > maxY) maxY = ny;
          }
        }
      }

      const pw = (maxX - minX + 1) * blockSize;
      const ph = (maxY - minY + 1) * blockSize;
      const area = pw * ph;
      if (area < minArea || area > maxArea) continue;

      const px = Math.round((cOffsetX * blockSize + minX * blockSize) / scale);
      const py = Math.round((cOffsetY * blockSize + minY * blockSize) / scale);
      const pwOrig = Math.round(pw / scale);
      const phOrig = Math.round(ph / scale);

      const ratio = pwOrig / phOrig;
      if (ratio > 8 || ratio < 0.125) continue;
      found.push({ x: px, y: py, w: pwOrig, h: phOrig });
    }
    showProgress(55 + Math.round((by / cBh) * 35), tr('detecting'));
  }

  autoBtn.disabled = false;
  progressCard.style.display = 'none';

  if (found.length === 0) {
    showAlert(tr('error'), 'err');
    return;
  }
  found.forEach(r => addMask(r.x, r.y, r.w, r.h));
  showAlert(found.length + ' watermark terdeteksi', 'ok');
}

// ─── Server-side processing via Flask ────────────────────────────────────────
// BUG FIX: replaced EventSource (SSE) with polling via fetch — more reliable
// when iframe sandbox policies block SSE, and avoids browser SSE retry storms.
async function processViaServer() {
  if (!videoFile || !videoMeta) { showAlert(tr('noFile'), 'err'); return; }
  if (masks.length === 0) { showAlert(tr('noMask'), 'err'); return; }

  // Check server is up
  try {
    const ping = await fetch(API_BASE + '/api/ping', { signal: AbortSignal.timeout(3000) });
    if (!ping.ok) throw new Error('ping failed');
  } catch (_) {
    showAlert(tr('serverOffline'), 'err');
    return;
  }

  stopPlayback();
  processBtn.disabled = true;
  showProgress(0, tr('processing'));

  try {
    // Step 1: upload video + masks
    const fd = new FormData();
    fd.append('video', videoFile);
    fd.append('masks', JSON.stringify(masks.map(m => ({ x: m.x, y: m.y, w: m.w, h: m.h }))));
    fd.append('method', 'advanced');
    fd.append('radius', '3');

    // Use XHR so we can track upload progress
    const taskId = await new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', API_BASE + '/api/process');

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const pct = Math.round((e.loaded / e.total) * 10);
          showProgress(pct, tr('reading'));
        }
      };

      xhr.onload = () => {
        if (xhr.status === 200) {
          try { resolve(JSON.parse(xhr.responseText).task_id); }
          catch { reject(new Error('Invalid server response')); }
        } else {
          try { reject(new Error(JSON.parse(xhr.responseText).error)); }
          catch { reject(new Error('Server error ' + xhr.status)); }
        }
      };
      xhr.onerror = () => reject(new Error('Network error — server offline?'));
      xhr.send(fd);
    });

    // Step 2: poll /api/status/<task_id> every 800ms until done
    // BUG FIX: replaced SSE (EventSource) with polling — EventSource was
    // being closed by the browser after the first event in some iframe setups.
    await new Promise((resolve, reject) => {
      const poll = async () => {
        try {
          const res = await fetch(API_BASE + '/api/status/' + taskId, {
            signal: AbortSignal.timeout(5000)
          });
          if (!res.ok) { reject(new Error('Status check failed: ' + res.status)); return; }

          const text = await res.text();
          // SSE text: "data: {...}\n\n"
          const match = text.match(/data:\s*(\{.*?\})/s);
          if (!match) { setTimeout(poll, 800); return; }

          const data = JSON.parse(match[1]);
          const pct = Math.min(95, 10 + Math.round((data.progress || 0) * 0.85));
          showProgress(pct, data.message || tr('processing'));

          if (data.error) { reject(new Error(data.error)); return; }
          if (data.done) { resolve(taskId); return; }
          setTimeout(poll, 800);
        } catch (err) {
          reject(err);
        }
      };
      poll();
    });

    // Step 3: download result blob
    showProgress(97, tr('finalizing'));
    const dlRes = await fetch(API_BASE + '/api/download/' + taskId);
    if (!dlRes.ok) throw new Error('Download failed: ' + dlRes.status);
    const blob = await dlRes.blob();

    showProgress(100, tr('success'));
    showResult(blob);
    showAlert(tr('success'), 'ok');

  } catch (err) {
    console.error('[watermark-remover]', err);
    showAlert(err.message || tr('error'), 'err');
  } finally {
    processBtn.disabled = masks.length === 0;
    setTimeout(() => { progressCard.style.display = 'none'; }, 800);
  }
}

// ─── Result display ───────────────────────────────────────────────────────────
function showResult(blob) {
  resultBlob = blob;
  if (resCleanUrl) URL.revokeObjectURL(resCleanUrl);
  resCleanUrl = URL.createObjectURL(blob);
  resultVideo.src = resCleanUrl;
  resultSection.style.display = 'block';
  resultVideo.play().catch(() => {});
}

function downloadResult() {
  if (!resultBlob) return;
  const baseName = videoFile ? videoFile.name.replace(/\.[^.]+$/, '') : 'video';
  const a = document.createElement('a');
  a.href = URL.createObjectURL(resultBlob);
  a.download = baseName + '_clean.mp4';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

function resetForRetry() {
  resultSection.style.display = 'none';
  resultVideo.pause();
  resultVideo.src = '';
  if (resCleanUrl) { URL.revokeObjectURL(resCleanUrl); resCleanUrl = null; }
  resultBlob = null;
  processBtn.disabled = masks.length === 0;
}

// ─── Clear all ────────────────────────────────────────────────────────────────
function clearAll() {
  stopPlayback();
  videoFile = null;
  videoMeta = null;
  masks = [];
  srcVideo.pause();
  srcVideo.src = '';
  fileInput.value = '';
  playerSection.style.display = 'none';
  infoSection.style.display = 'none';
  maskSection.style.display = 'none';
  settingsSection.style.display = 'none';
  progressCard.style.display = 'none';
  resultSection.style.display = 'none';
  alertBox.style.display = 'none';
  processBtn.disabled = true;
  resultVideo.pause();
  resultVideo.src = '';
  if (resCleanUrl) { URL.revokeObjectURL(resCleanUrl); resCleanUrl = null; }
  resultBlob = null;
  overlayCtx = null;
  renderMaskList();
}

// ─── Utilities ────────────────────────────────────────────────────────────────
function showAlert(msg, type) {
  alertBox.textContent = msg;
  alertBox.className = 'alert ' + type;
  alertBox.style.display = 'block';
}

// Single authoritative showProgress (fixes the duplicate setProgress bug)
function showProgress(pct, text) {
  progressCard.style.display = 'block';
  progressFill.style.width = (pct || 0) + '%';
  progressText.textContent = text || tr('processing');
}

function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(1) + ' MB';
}

function formatDuration(sec) {
  if (!sec || isNaN(sec)) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return m + ':' + (s < 10 ? '0' : '') + s;
}

document.addEventListener('DOMContentLoaded', () => {
  if (window.__initialLang) applyLang(window.__initialLang);
});

// Expose to HTML onclick attributes
window.autoDetect = autoDetect;
window.removeMask = removeMask;
window.clearMasks = clearMasks;
window.processViaServer = processViaServer;
window.downloadResult = downloadResult;
window.resetForRetry = resetForRetry;
window.clearAll = clearAll;
