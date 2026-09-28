/**
 * ToolSuf — Background Remover (Remove BG)
 * High-Performance Client-Side Background Removal with Adaptive Edge Matting,
 * Format Selection (PNG / WEBP / JPG), Quality Controls, Color Compositing,
 * Idempotent Feature Tracking & Global Download Integration.
 */

// Theme sync from dashboard
try {
  const p = window.parent.document.documentElement;
  if (p.classList.contains('dark')) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.add('light');
  }
} catch(e) {
  document.documentElement.classList.add('light');
}

const urlParams = new URLSearchParams(window.location.search);
const langParam = urlParams.get('lang');
window.__initialLang = langParam === 'en' ? 'en' : 'id';

// State Variables
let originalFile = null;
let originalImgUrl = null;
let processedCanvas = null;
let processedBlob = null;
let processedUrl = null;
let selectedFormat = 'png'; // 'png' | 'webp' | 'jpg'
let selectedQuality = 85;   // 50 - 100
let selectedColor = 'transparent'; // 'transparent' | hex
let cmpPos = 50;
let cmpDragging = false;
let currentLang = window.__initialLang;
let isProcessing = false;

const $ = id => document.getElementById(id);

// ─── Format & Byte Utilities ───────────────────────────────────────────────
function formatBytes(bytes) {
  if (!bytes || bytes <= 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function getFileExtension(filename) {
  return (filename || '').split('.').pop().toLowerCase();
}

function showAlert(msg, type = 'err') {
  const el = $('alertBox');
  if (!el) return;
  el.className = 'alert ' + type;
  el.textContent = msg;
  el.style.display = 'block';

  setTimeout(() => {
    if (el.className.includes(type)) {
      el.style.display = 'none';
      el.className = 'alert';
    }
  }, 6000);
}

function clearAlert() {
  const el = $('alertBox');
  if (el) {
    el.style.display = 'none';
    el.className = 'alert';
  }
}

// ─── DOM Ready ─────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const fi = $('fi');
  const drop = $('drop');
  const btnExecute = $('btnExecuteRemove');
  const btnClearSelected = $('btnClearSelected');
  const qualitySlider = $('qualitySlider');
  const qualityVal = $('qualityValue');
  const customColorPicker = $('customColorPicker');

  // 1. File Picker & Drag and Drop Listeners
  if (fi) {
    fi.addEventListener('change', e => {
      if (e.target.files && e.target.files.length > 0) {
        handleFileSelected(e.target.files[0]);
      }
    });
  }

  if (drop) {
    drop.addEventListener('dragover', e => {
      e.preventDefault();
      drop.classList.add('over');
    });

    drop.addEventListener('dragleave', e => {
      e.preventDefault();
      drop.classList.remove('over');
    });

    drop.addEventListener('drop', e => {
      e.preventDefault();
      drop.classList.remove('over');
      if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        handleFileSelected(e.dataTransfer.files[0]);
      }
    });

    drop.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (fi) fi.click();
      }
    });
  }

  // 2. Clear Selected File
  if (btnClearSelected) {
    btnClearSelected.addEventListener('click', (e) => {
      e.stopPropagation();
      resetAll();
    });
  }

  // 3. Remove Background Execution Button
  if (btnExecute) {
    btnExecute.addEventListener('click', () => {
      if (!originalFile || isProcessing) return;
      executeRemoveBackground();
    });
  }

  // 4. Format Selection Buttons
  document.querySelectorAll('.format-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const fmt = btn.getAttribute('data-format');
      selectOutputFormat(fmt);
    });
  });

  // 5. Quality Slider
  if (qualitySlider) {
    qualitySlider.addEventListener('input', e => {
      selectedQuality = parseInt(e.target.value, 10);
      if (qualityVal) qualityVal.textContent = selectedQuality + '%';
      updateDownloadButtonText();
    });
  }

  // 6. Background Color Pickers
  document.querySelectorAll('.color-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const color = btn.getAttribute('data-color');
      selectBgColor(color, btn);
    });
  });

  if (customColorPicker) {
    customColorPicker.addEventListener('input', e => {
      selectBgColor(e.target.value, null);
    });
  }

  // 7. Interactive Slider Setup
  setupComparisonSlider();

  // Apply Language
  if (window.__initialLang) syncLang(window.__initialLang);
});

// ─── File Validation & Selection ──────────────────────────────────────────
async function handleFileSelected(file) {
  clearAlert();
  if (!file) return;

  // 1. Validasi Tipe File (MIME + Extension)
  const ext = getFileExtension(file.name);
  const supportedExtensions = ['jpg', 'jpeg', 'png', 'webp', 'bmp', 'jfif'];
  const isImageMime = file.type && file.type.startsWith('image/');
  const isSupportedExt = supportedExtensions.includes(ext);

  if (!isImageMime && !isSupportedExt) {
    showAlert(currentLang === 'id' ? 'Format file ini belum didukung. Pilih gambar (JPG, PNG, WEBP).' : 'Unsupported file format. Please select an image (JPG, PNG, WEBP).', 'err');
    return;
  }

  // Cegah vektor SVG
  if (file.type === 'image/svg+xml' || ext === 'svg') {
    showAlert(currentLang === 'id' ? 'Format SVG tidak didukung untuk penghapusan latar belakang piksel.' : 'SVG format is not supported for pixel background removal.', 'err');
    return;
  }

  // 2. Validasi Ukuran (Maks 25MB)
  if (file.size > 25 * 1024 * 1024) {
    showAlert(currentLang === 'id' ? 'Ukuran file terlalu besar (maksimal 25MB).' : 'File size is too large (maximum 25MB).', 'err');
    return;
  }

  // 3. Validasi Integritas Gambar (Cek apakah file rusak / corrupt)
  try {
    const testImg = new Image();
    const testUrl = URL.createObjectURL(file);
    testImg.src = testUrl;

    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        URL.revokeObjectURL(testUrl);
        reject(new Error('timeout'));
      }, 8000);
      testImg.onload = () => {
        clearTimeout(timer);
        URL.revokeObjectURL(testUrl);
        resolve();
      };
      testImg.onerror = () => {
        clearTimeout(timer);
        URL.revokeObjectURL(testUrl);
        reject(new Error('corrupt'));
      };
    });
  } catch (imgErr) {
    showAlert(currentLang === 'id' ? 'Gambar tidak dapat diproses atau berkas rusak. Silakan coba gambar lain.' : 'Image could not be processed or file is corrupt. Please try another image.', 'err');
    return;
  }

  // Simpan file dan tampilkan Card Preview (tanpa auto-process)
  originalFile = file;
  if (originalImgUrl) URL.revokeObjectURL(originalImgUrl);
  originalImgUrl = URL.createObjectURL(file);

  $('filePreviewThumb').src = originalImgUrl;
  $('selectedFileName').textContent = file.name;
  $('selectedFileSize').textContent = formatBytes(file.size);
  $('selectedFileExt').textContent = ext.toUpperCase();

  // Update UI State: Sembunyikan dropzone, tampilkan fileCard dan tombol eksekusi
  $('drop').style.display = 'none';
  $('fileCard').style.display = 'flex';
  $('btnExecuteRemove').style.display = 'flex';
  $('resultSection').style.display = 'none';
}

// ─── Background Removal Execution ──────────────────────────────────────────
async function executeRemoveBackground() {
  if (!originalFile) return;

  // 1. Cek Sistem Maintenance (Requirement 14)
  const isMaintenanceActive = window.__TOOLSUF_MAINTENANCE__ || 
    (typeof ToolSufMaintenance !== 'undefined' && ToolSufMaintenance.isMaintenanceActive('background-remover'));

  if (isMaintenanceActive) {
    showAlert(currentLang === 'id' ? 'Fitur Background Remover sedang dalam pemeliharaan berkala.' : 'Background Remover feature is currently undergoing maintenance.', 'err');
    return;
  }

  isProcessing = true;
  clearAlert();

  // Tampilkan loading global
  CuteLoading.show('progressSection', 'Sabar yahh..');
  $('btnExecuteRemove').style.display = 'none';
  $('resultSection').style.display = 'none';

  const startTime = Date.now();

  try {
    const resultCanvas = await runAdaptiveBgRemoval(originalFile);
    processedCanvas = resultCanvas;

    // Export transparent PNG as master blob
    const masterBlob = await new Promise((resolve, reject) => {
      resultCanvas.toBlob(blob => {
        if (blob) resolve(blob);
        else reject(new Error('Failed to generate output blob'));
      }, 'image/png');
    });

    processedBlob = masterBlob;
    if (processedUrl) URL.revokeObjectURL(processedUrl);
    processedUrl = URL.createObjectURL(masterBlob);

    // Update Comparison Images
    $('cmpOriginal').src = originalImgUrl;
    $('cmpResult').src = processedUrl;

    // Sembunyikan loading & tampilkan hasil
    CuteLoading.hide('progressSection');
    $('resultSection').style.display = 'block';
    resetComparisonSlider();

    // Default Format: PNG, Transparent
    selectOutputFormat('png');
    selectBgColor('transparent', $('colorBtnTrans'));

    showAlert(currentLang === 'id' ? 'Latar belakang berhasil dihapus!' : 'Background removed successfully!', 'ok');

    // Trigger Feature Usage Tracking (Requirement 15)
    if (typeof trackFeatureUsage === 'function') {
      trackFeatureUsage('background-remover', 'remove-background', {
        fileName: originalFile.name,
        fileSize: formatBytes(originalFile.size),
        outputFormat: selectedFormat,
        processingDuration: `${((Date.now() - startTime) / 1000).toFixed(1)}s`
      });
    }

  } catch (err) {
    console.error('[BgRemover] Execution error:', err);
    CuteLoading.hide('progressSection');
    $('btnExecuteRemove').style.display = 'flex';
    showAlert(currentLang === 'id' ? 'Gambar tidak dapat diproses. Silakan coba gambar lain.' : 'Image could not be processed. Please try another image.', 'err');
  } finally {
    isProcessing = false;
  }
}

// ─── Adaptive Removal Engine (Worker with Fallback) ──────────────────────
async function runAdaptiveBgRemoval(file) {
  const img = new Image();
  const fileUrl = URL.createObjectURL(file);
  img.src = fileUrl;

  await new Promise((resolve, reject) => {
    img.onload = () => { URL.revokeObjectURL(fileUrl); resolve(); };
    img.onerror = () => { URL.revokeObjectURL(fileUrl); reject(new Error('Failed to load image')); };
  });

  const width = img.naturalWidth || img.width;
  const height = img.naturalHeight || img.height;
  if (!width || !height) throw new Error('Invalid image dimensions');

  // Scaling limit untuk menjaga performa memori
  const MAX_DIM = 2560;
  let targetWidth = width;
  let targetHeight = height;
  if (width > MAX_DIM || height > MAX_DIM) {
    if (width >= height) {
      targetWidth = MAX_DIM;
      targetHeight = Math.round((height * MAX_DIM) / width);
    } else {
      targetHeight = MAX_DIM;
      targetWidth = Math.round((width * MAX_DIM) / height);
    }
  }

  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
  const imageData = ctx.getImageData(0, 0, targetWidth, targetHeight);

  // Jalankan di Web Worker jika tersedia
  let resultImageData;
  try {
    resultImageData = await executeWorker(imageData);
  } catch (workerErr) {
    console.warn('[BgRemover] Worker failed, using main thread fallback:', workerErr.message);
    const data = imageData.data;
    const model = detectAndBuildBackgroundModel(data, targetWidth, targetHeight);
    const { visited, distMap } = floodFillBackgroundConnected(data, targetWidth, targetHeight, model);
    refineEdgesAndAlphaMatte(data, targetWidth, targetHeight, visited, distMap, model);
    resultImageData = imageData;
  }

  const outputData = (resultImageData instanceof ImageData)
    ? resultImageData
    : new ImageData(
        resultImageData.data instanceof Uint8ClampedArray
          ? resultImageData.data
          : new Uint8ClampedArray(resultImageData.data),
        resultImageData.width,
        resultImageData.height
      );

  ctx.putImageData(outputData, 0, 0);
  return canvas;
}

function executeWorker(imageData) {
  return new Promise((resolve, reject) => {
    let worker = null;
    let isSettled = false;

    const timeout = setTimeout(() => {
      if (isSettled) return;
      isSettled = true;
      if (worker) worker.terminate();
      reject(new Error('Worker timed out'));
    }, 28000);

    try {
      worker = new Worker('bg-removal-worker.js');
    } catch (e) {
      clearTimeout(timeout);
      reject(new Error('Worker initialization failed'));
      return;
    }

    worker.onmessage = (e) => {
      if (!e.data) return;
      const { type, imageData: resData, message } = e.data;
      if (type === 'done') {
        if (isSettled) return;
        isSettled = true;
        clearTimeout(timeout);
        worker.terminate();
        resolve(resData);
      } else if (type === 'error') {
        if (isSettled) return;
        isSettled = true;
        clearTimeout(timeout);
        worker.terminate();
        reject(new Error(message || 'Worker processing error'));
      }
    };

    worker.onerror = (err) => {
      if (isSettled) return;
      isSettled = true;
      clearTimeout(timeout);
      worker.terminate();
      reject(new Error((err && err.message) || 'Worker crash'));
    };

    const transferBuf = imageData.data.buffer.slice(0);
    const transferData = new Uint8ClampedArray(transferBuf);
    worker.postMessage({
      jobId: 'local-' + Date.now(),
      imageData: { data: transferData, width: imageData.width, height: imageData.height }
    }, [transferBuf]);
  });
}

// ─── Format & Output Settings ──────────────────────────────────────────────
function selectOutputFormat(fmt) {
  selectedFormat = fmt;
  
  // Update button active states
  document.querySelectorAll('.format-btn').forEach(btn => {
    if (btn.getAttribute('data-format') === fmt) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  const qualityRow = $('qualityRow');
  const colorTransBtn = $('colorBtnTrans');

  if (fmt === 'png') {
    if (qualityRow) qualityRow.style.display = 'none';
    if (colorTransBtn) colorTransBtn.style.display = 'inline-block';
    selectBgColor('transparent', $('colorBtnTrans'));
  } else if (fmt === 'webp') {
    if (qualityRow) qualityRow.style.display = 'flex';
    if (colorTransBtn) colorTransBtn.style.display = 'inline-block';
    selectBgColor('transparent', $('colorBtnTrans'));
  } else if (fmt === 'jpg') {
    // JPG tidak mendukung transparansi, otomatis default ke Putih
    if (qualityRow) qualityRow.style.display = 'flex';
    if (colorTransBtn) colorTransBtn.style.display = 'none';
    if (selectedColor === 'transparent') {
      selectBgColor('#FFFFFF', $('colorBtnWhite'));
    }
  }

  updateDownloadButtonText();
}

function selectBgColor(color, element) {
  selectedColor = color;
  const overlay = $('bgOverlay');

  document.querySelectorAll('.color-btn').forEach(btn => btn.classList.remove('active'));
  if (element) {
    element.classList.add('active');
  }

  if (color === 'transparent') {
    overlay.style.backgroundColor = '';
    overlay.style.backgroundImage = '';
  } else {
    overlay.style.backgroundColor = color;
    overlay.style.backgroundImage = 'none';
  }

  updateDownloadButtonText();
}

function updateDownloadButtonText() {
  const lbl = $('lblDownloadBtn');
  if (!lbl) return;

  const fmtUpper = selectedFormat.toUpperCase();
  if (selectedFormat === 'png' || (selectedFormat === 'webp' && selectedColor === 'transparent')) {
    lbl.textContent = currentLang === 'id' 
      ? `Unduh ${fmtUpper} Transparan` 
      : `Download Transparent ${fmtUpper}`;
  } else if (selectedFormat === 'jpg') {
    lbl.textContent = currentLang === 'id'
      ? `Unduh JPG (${selectedQuality}%)`
      : `Download JPG (${selectedQuality}%)`;
  } else {
    lbl.textContent = currentLang === 'id'
      ? `Unduh ${fmtUpper}`
      : `Download ${fmtUpper}`;
  }
}

// ─── Comparison Slider Setup ──────────────────────────────────────────────
function setupComparisonSlider() {
  const cmp = $('cmpContainer');
  const handle = $('cmpHandle');
  if (!cmp || !handle) return;

  const startDrag = (e) => {
    cmpDragging = true;
    cmp.classList.add('dragging');
    updateCmpPos(e.touches ? e.touches[0] : e);
  };

  const moveDrag = (e) => {
    if (!cmpDragging) return;
    if (e.cancelable) e.preventDefault();
    updateCmpPos(e.touches ? e.touches[0] : e);
  };

  const endDrag = () => {
    if (cmpDragging) {
      cmpDragging = false;
      cmp.classList.remove('dragging');
    }
  };

  cmp.addEventListener('mousedown', startDrag);
  window.addEventListener('mousemove', moveDrag);
  window.addEventListener('mouseup', endDrag);

  cmp.addEventListener('touchstart', startDrag, { passive: false });
  window.addEventListener('touchmove', moveDrag, { passive: false });
  window.addEventListener('touchend', endDrag);
  window.addEventListener('touchcancel', endDrag);

  handle.addEventListener('keydown', e => {
    const step = e.shiftKey ? 10 : 2;
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      cmpPos = Math.max(0, cmpPos - step);
      updateSlider();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      cmpPos = Math.min(100, cmpPos + step);
      updateSlider();
    }
  });
}

function updateCmpPos(e) {
  const cmp = $('cmpContainer');
  const rect = cmp.getBoundingClientRect();
  if (rect.width <= 0) return;
  const raw = ((e.clientX - rect.left) / rect.width) * 100;
  cmpPos = Math.max(0, Math.min(100, raw));
  updateSlider();
}

function updateSlider() {
  $('cmpAfter').style.clipPath = `inset(0 0 0 ${cmpPos}%)`;
  $('cmpHandle').style.left = cmpPos + '%';
  $('cmpHandle').setAttribute('aria-valuenow', Math.round(cmpPos));
}

function resetComparisonSlider() {
  cmpPos = 50;
  updateSlider();
}

// ─── Download Action ───────────────────────────────────────────────────────
async function downloadResult() {
  if (!processedCanvas || !originalFile) return;

  const downloadBtn = $('downloadBtn');
  if (downloadBtn) downloadBtn.disabled = true;

  try {
    let finalBlob;
    const mimeMap = {
      png: 'image/png',
      webp: 'image/webp',
      jpg: 'image/jpeg'
    };
    const mimeType = mimeMap[selectedFormat] || 'image/png';
    const qualityParam = (selectedFormat === 'webp' || selectedFormat === 'jpg') 
      ? (selectedQuality / 100) 
      : undefined;

    if (selectedFormat === 'jpg' || (selectedColor !== 'transparent')) {
      // Composite gambar ke atas latar belakang warna terpilih
      const exportCanvas = document.createElement('canvas');
      exportCanvas.width = processedCanvas.width;
      exportCanvas.height = processedCanvas.height;
      const ctx = exportCanvas.getContext('2d');

      // Latar belakang (Putih default untuk JPG jika transparan)
      const bgColor = (selectedFormat === 'jpg' && selectedColor === 'transparent') 
        ? '#FFFFFF' 
        : selectedColor;

      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
      ctx.drawImage(processedCanvas, 0, 0);

      finalBlob = await new Promise((resolve, reject) => {
        exportCanvas.toBlob(b => {
          if (b) resolve(b);
          else reject(new Error('Export canvas failed'));
        }, mimeType, qualityParam);
      });
    } else {
      // Output transparan (PNG atau WEBP transparan)
      finalBlob = await new Promise((resolve, reject) => {
        processedCanvas.toBlob(b => {
          if (b) resolve(b);
          else reject(new Error('Export canvas failed'));
        }, mimeType, qualityParam);
      });
    }

    // Gunakan ToolSufDownload terpusat (Requirement 9)
    if (typeof ToolSufDownload !== 'undefined') {
      await ToolSufDownload.downloadFile({
        originalName: originalFile.name,
        featureName: 'remove-bg',
        extension: selectedFormat === 'jpg' ? 'jpg' : selectedFormat,
        mimeType: mimeType,
        blob: finalBlob
      });
    } else {
      fallbackDownload(finalBlob, originalFile.name, selectedFormat);
    }

  } catch (err) {
    console.error('[BgRemover] Download error:', err);
    showAlert(currentLang === 'id' ? 'Gagal mengunduh gambar hasil.' : 'Failed to download output image.', 'err');
  } finally {
    if (downloadBtn) downloadBtn.disabled = false;
  }
}

function fallbackDownload(blob, originalName, ext) {
  const base = originalName.replace(/\.[^/.]+$/, '').toLowerCase().replace(/[^a-z0-9\-]/g, '-');
  const filename = `toolsuf-${base}-remove-bg.${ext}`;

  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(a.href);
  }, 1000);
}

// ─── Reset All ─────────────────────────────────────────────────────────────
function resetAll() {
  originalFile = null;
  processedCanvas = null;
  processedBlob = null;
  isProcessing = false;

  if (originalImgUrl) {
    URL.revokeObjectURL(originalImgUrl);
    originalImgUrl = null;
  }
  if (processedUrl) {
    URL.revokeObjectURL(processedUrl);
    processedUrl = null;
  }

  $('fi').value = '';
  $('drop').style.display = 'block';
  $('fileCard').style.display = 'none';
  $('btnExecuteRemove').style.display = 'none';
  $('resultSection').style.display = 'none';
  CuteLoading.hide('progressSection');
  clearAlert();

  // Reset controls
  selectOutputFormat('png');
  selectedQuality = 85;
  if ($('qualitySlider')) $('qualitySlider').value = 85;
  if ($('qualityValue')) $('qualityValue').textContent = '85%';
  selectBgColor('transparent', $('colorBtnTrans'));
}

// ─── Adaptive Fallback Image Processing Helpers ───────────────────────────
function getPerceptualColorDistance(r1, g1, b1, r2, g2, b2) {
  const rMean = (r1 + r2) * 0.5;
  const dR = r1 - r2, dG = g1 - g2, dB = b1 - b2;
  const wR = 2.0 + rMean / 256.0;
  const wG = 4.0;
  const wB = 2.0 + (255.0 - rMean) / 256.0;
  return Math.sqrt(wR * dR * dR + wG * dG * dG + wB * dB * dB);
}

function detectAndBuildBackgroundModel(data, width, height) {
  const samples = [];
  const strideX = Math.max(1, Math.floor(width / 160));
  const strideY = Math.max(1, Math.floor(height / 160));

  const samplePixel = (x, y) => {
    x = Math.max(0, Math.min(width - 1, x));
    y = Math.max(0, Math.min(height - 1, y));
    const idx = (y * width + x) * 4;
    const a = data[idx + 3];
    if (a < 30) return null;
    return { r: data[idx], g: data[idx + 1], b: data[idx + 2], a };
  };

  for (let x = 0; x < width; x += strideX) {
    for (let depth = 0; depth < Math.min(3, height); depth++) {
      const top = samplePixel(x, depth);
      if (top) samples.push(top);
      const btm = samplePixel(x, height - 1 - depth);
      if (btm) samples.push(btm);
    }
  }
  for (let y = 0; y < height; y += strideY) {
    for (let depth = 0; depth < Math.min(3, width); depth++) {
      const left = samplePixel(depth, y);
      if (left) samples.push(left);
      const right = samplePixel(width - 1 - depth, y);
      if (right) samples.push(right);
    }
  }

  const landmarks = [
    [0, 0], [Math.floor(width / 2), 0], [width - 1, 0],
    [0, Math.floor(height / 2)], [width - 1, Math.floor(height / 2)],
    [0, height - 1], [Math.floor(width / 2), height - 1], [width - 1, height - 1]
  ];
  for (const [lx, ly] of landmarks) {
    const p = samplePixel(lx, ly);
    if (p) { samples.push(p); samples.push(p); }
  }

  if (samples.length === 0) {
    return { primary: { r: 255, g: 255, b: 255 }, clusters: [{ r: 255, g: 255, b: 255, count: 1 }], innerTol: 25, outerTol: 45 };
  }

  const clusterDistThresh = 24;
  const clusters = [];
  for (const s of samples) {
    let matched = null, minDist = Infinity;
    for (const c of clusters) {
      const d = getPerceptualColorDistance(s.r, s.g, s.b, c.r, c.g, c.b);
      if (d < clusterDistThresh && d < minDist) { minDist = d; matched = c; }
    }
    if (matched) {
      matched.sumR += s.r; matched.sumG += s.g; matched.sumB += s.b; matched.count++;
      matched.r = Math.round(matched.sumR / matched.count);
      matched.g = Math.round(matched.sumG / matched.count);
      matched.b = Math.round(matched.sumB / matched.count);
      matched.samples.push(s);
    } else {
      clusters.push({ r: s.r, g: s.g, b: s.b, sumR: s.r, sumG: s.g, sumB: s.b, count: 1, samples: [s] });
    }
  }

  clusters.sort((a, b) => b.count - a.count);
  const pc = clusters[0];
  let sumSqDist = 0;
  for (const s of pc.samples) {
    const d = getPerceptualColorDistance(s.r, s.g, s.b, pc.r, pc.g, pc.b);
    sumSqDist += d * d;
  }
  const sigma = Math.sqrt(sumSqDist / Math.max(1, pc.samples.length));
  const primaryLum = 0.299 * pc.r + 0.587 * pc.g + 0.114 * pc.b;
  const isDark = primaryLum < 55;

  let innerTol, outerTol;
  if (sigma < 4) { innerTol = isDark ? 22 : 24; outerTol = innerTol + 18; }
  else if (sigma < 12) { innerTol = Math.round(25 + sigma * 0.9); outerTol = innerTol + 20; }
  else { innerTol = Math.round(Math.min(42, 28 + sigma * 0.7)); outerTol = innerTol + 24; }

  const validClusters = clusters.filter(c => c.count >= Math.max(3, samples.length * 0.08)).slice(0, 4);

  return {
    primary: { r: pc.r, g: pc.g, b: pc.b },
    clusters: validClusters.length > 0 ? validClusters : [pc],
    innerTol, outerTol
  };
}

function floodFillBackgroundConnected(data, width, height, bgModel) {
  const totalPixels = width * height;
  const visited = new Uint8Array(totalPixels);
  const distMap = new Float32Array(totalPixels);

  const getMinDist = (r, g, b) => {
    let minD = Infinity;
    for (const c of bgModel.clusters) {
      const d = getPerceptualColorDistance(r, g, b, c.r, c.g, c.b);
      if (d < minD) minD = d;
    }
    return minD;
  };

  let currentQueue = new Int32Array(totalPixels);
  let nextQueue = new Int32Array(totalPixels);
  let currentTail = 0, nextTail = 0;

  const seedBorderPixel = (x, y) => {
    const idx = y * width + x;
    if (visited[idx]) return;
    const pIdx = idx * 4;
    const a = data[pIdx + 3];
    if (a < 30) { visited[idx] = 1; distMap[idx] = 0; currentQueue[currentTail++] = idx; return; }
    const d = getMinDist(data[pIdx], data[pIdx + 1], data[pIdx + 2]);
    distMap[idx] = d;
    if (d <= bgModel.outerTol) { visited[idx] = 1; currentQueue[currentTail++] = idx; }
  };

  for (let x = 0; x < width; x++) { seedBorderPixel(x, 0); seedBorderPixel(x, height - 1); }
  for (let y = 0; y < height; y++) { seedBorderPixel(0, y); seedBorderPixel(width - 1, y); }

  while (currentTail > 0) {
    for (let i = 0; i < currentTail; i++) {
      const idx = currentQueue[i];
      const x = idx % width;
      const y = Math.floor(idx / width);
      const neighbors = [
        x > 0 ? idx - 1 : -1,
        x < width - 1 ? idx + 1 : -1,
        y > 0 ? idx - width : -1,
        y < height - 1 ? idx + width : -1
      ];

      for (let j = 0; j < 4; j++) {
        const nIdx = neighbors[j];
        if (nIdx !== -1 && !visited[nIdx]) {
          const npIdx = nIdx * 4;
          const a = data[npIdx + 3];
          if (a < 30) { visited[nIdx] = 1; distMap[nIdx] = 0; nextQueue[nextTail++] = nIdx; continue; }
          const d = getMinDist(data[npIdx], data[npIdx + 1], data[npIdx + 2]);
          distMap[nIdx] = d;
          if (d <= bgModel.outerTol) { visited[nIdx] = 1; nextQueue[nextTail++] = nIdx; }
        }
      }
    }
    const temp = currentQueue;
    currentQueue = nextQueue;
    nextQueue = temp;
    currentTail = nextTail;
    nextTail = 0;
  }

  return { visited, distMap };
}

function refineEdgesAndAlphaMatte(data, width, height, visited, distMap, bgModel) {
  const totalPixels = width * height;
  const innerTol = bgModel.innerTol;
  const outerTol = bgModel.outerTol;
  const tolRange = Math.max(1, outerTol - innerTol);
  const bgR = bgModel.primary.r, bgG = bgModel.primary.g, bgB = bgModel.primary.b;

  for (let idx = 0; idx < totalPixels; idx++) {
    const pIdx = idx * 4;
    const origA = data[pIdx + 3];
    if (origA < 30) { data[pIdx + 3] = 0; continue; }

    if (visited[idx] === 1) {
      const d = distMap[idx];
      if (d <= innerTol) {
        data[pIdx + 3] = 0;
      } else if (d < outerTol) {
        const t = (d - innerTol) / tolRange;
        const smoothT = t * t * (3 - 2 * t);
        data[pIdx + 3] = Math.min(origA, Math.max(0, Math.round(smoothT * 255)));
      }
    }
  }

  // Decontaminate halo color
  for (let idx = 0; idx < totalPixels; idx++) {
    const pIdx = idx * 4;
    const a = data[pIdx + 3];
    if (a > 0 && a < 254) {
      const normA = a / 255.0;
      const invA = 1.0 - normA;
      const safeNormA = Math.max(0.18, normA);
      data[pIdx] = Math.max(0, Math.min(255, Math.round((data[pIdx] - invA * bgR) / safeNormA)));
      data[pIdx + 1] = Math.max(0, Math.min(255, Math.round((data[pIdx + 1] - invA * bgG) / safeNormA)));
      data[pIdx + 2] = Math.max(0, Math.min(255, Math.round((data[pIdx + 2] - invA * bgB) / safeNormA)));
    }
  }
}

// ─── Theme & Language Sync ────────────────────────────────────────────────
window.syncTheme = function(dark) {
  if (dark) {
    document.documentElement.classList.add('dark');
    document.documentElement.classList.remove('light');
  } else {
    document.documentElement.classList.add('light');
    document.documentElement.classList.remove('dark');
  }
};

window.syncLang = function(lang) {
  currentLang = (lang === 'en') ? 'en' : 'id';
  const translations = {
    id: {
      secPickFile: 'Upload Gambar',
      lblDropTitle: 'Seret & lepas gambar di sini',
      lblDropSub: 'Mendukung format JPG, PNG, WEBP',
      lblBtnExecute: 'Hapus Background',
      secPreview: 'Pratinjau Hasil',
      lblBadgeBefore: 'Sebelum',
      lblBadgeAfter: 'Sesudah',
      lblOutputFormat: 'Format Output',
      lblOutputFormatDesc: 'Pilih format berkas hasil',
      lblQualityTitle: 'Kualitas Gambar',
      lblQualityDesc: 'Atur kompresi kualitas gambar',
      lblBgColor: 'Warna Latar',
      lblBgColorDesc: 'Warna latar belakang hasil gambar',
      lblResetBtn: 'Reset'
    },
    en: {
      secPickFile: 'Upload Image',
      lblDropTitle: 'Drag & drop image here',
      lblDropSub: 'Supports JPG, PNG, WEBP',
      lblBtnExecute: 'Remove Background',
      secPreview: 'Result Preview',
      lblBadgeBefore: 'Before',
      lblBadgeAfter: 'After',
      lblOutputFormat: 'Output Format',
      lblOutputFormatDesc: 'Select output file format',
      lblQualityTitle: 'Image Quality',
      lblQualityDesc: 'Adjust image compression quality',
      lblBgColor: 'Background Color',
      lblBgColorDesc: 'Output background color',
      lblResetBtn: 'Reset'
    }
  };

  const t = translations[currentLang];
  if (!t) return;

  if ($('secPickFile')) $('secPickFile').textContent = t.secPickFile;
  if ($('lblDropTitle')) $('lblDropTitle').textContent = t.lblDropTitle;
  if ($('lblDropSub')) $('lblDropSub').textContent = t.lblDropSub;
  if ($('lblBtnExecute')) $('lblBtnExecute').textContent = t.lblBtnExecute;
  if ($('secPreview')) $('secPreview').textContent = t.secPreview;
  if ($('lblBadgeBefore')) $('lblBadgeBefore').textContent = t.lblBadgeBefore;
  if ($('lblBadgeAfter')) $('lblBadgeAfter').textContent = t.lblBadgeAfter;
  if ($('lblOutputFormat')) $('lblOutputFormat').textContent = t.lblOutputFormat;
  if ($('lblOutputFormatDesc')) $('lblOutputFormatDesc').textContent = t.lblOutputFormatDesc;
  if ($('lblQualityTitle')) $('lblQualityTitle').textContent = t.lblQualityTitle;
  if ($('lblQualityDesc')) $('lblQualityDesc').textContent = t.lblQualityDesc;
  if ($('lblBgColor')) $('lblBgColor').textContent = t.lblBgColor;
  if ($('lblBgColorDesc')) $('lblBgColorDesc').textContent = t.lblBgColorDesc;
  if ($('lblResetBtn')) $('lblResetBtn').textContent = t.lblResetBtn;

  updateDownloadButtonText();
};

window.addEventListener('message', e => {
  if (!e.data) return;
  if (e.data.type === 'syncTheme') window.syncTheme(e.data.dark);
  if (e.data.type === 'syncLang') window.syncLang(e.data.lang);
});

// Expose actions globally
window.downloadResult = downloadResult;
window.resetAll = resetAll;
