// Theme sync from dashboard
try {
  var p = window.parent.document.documentElement;
  if (p.classList.contains('dark')) { document.documentElement.classList.add('dark'); }
  else { document.documentElement.classList.add('light'); }
} catch(e) { document.documentElement.classList.add('light'); }
var lang = new URLSearchParams(window.location.search).get('lang');
window.__initialLang = lang === 'en' ? 'en' : 'id';

let originalFile = null;
let processedBlob = null;
let processedUrl = null;
let removeBackgroundFn = null;
let selectedColor = 'transparent';
let cmpPos = 50;
let cmpDragging = false;

const $ = id => document.getElementById(id);

function getFriendlyKey(key, lang) {
  const filename = (key.split('/').pop() || '').toLowerCase();
  if (filename.includes('wasm')) {
    return lang === 'id' ? 'Mesin WASM' : 'WASM Engine';
  }
  return lang === 'id' ? 'Model AI' : 'AI Model';
}

// Load the library dynamically from jsDelivr CDN
async function getRemoveBackgroundLib() {
  if (removeBackgroundFn) return removeBackgroundFn;
  const urls = [
    'https://cdn.jsdelivr.net/npm/@imgly/background-removal@1.7.0/+esm',
    'https://esm.sh/@imgly/background-removal@1.7.0',
  ];
  for (const url of urls) {
    try {
      const module = await import(/* @vite-ignore */ url);
      if (module && typeof module.removeBackground === 'function') {
        removeBackgroundFn = module.removeBackground;
        return removeBackgroundFn;
      }
    } catch (e) {
      console.warn('CDN import failed for', url, e);
    }
  }
  throw new Error('All CDN URLs failed for @imgly/background-removal');
}

// Attach event listeners when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  $('fi').addEventListener('change', e => {
    if (e.target.files.length) processImage(e.target.files[0]);
  });

  const drop = $('drop');
  drop.addEventListener('dragover', e => { e.preventDefault(); drop.classList.add('over'); });
  drop.addEventListener('dragleave', () => drop.classList.remove('over'));
  drop.addEventListener('drop', e => {
    e.preventDefault();
    drop.classList.remove('over');
    if (e.dataTransfer.files.length) processImage(e.dataTransfer.files[0]);
  });

  // Slider controls (mouse, touch, keyboard)
  const cmp = $('cmpContainer');
  const handle = $('cmpHandle');

  function startDrag(e) {
    if (!processedBlob) return;
    cmpDragging = true;
    cmp.classList.add('dragging');
    updateCmpPos(e.touches ? e.touches[0] : e);
  }

  function moveDrag(e) {
    if (!cmpDragging) return;
    if (e.cancelable) e.preventDefault();
    updateCmpPos(e.touches ? e.touches[0] : e);
  }

  function endDrag() {
    if (cmpDragging) {
      cmpDragging = false;
      cmp.classList.remove('dragging');
    }
  }

  cmp.addEventListener('mousedown', startDrag);
  window.addEventListener('mousemove', moveDrag);
  window.addEventListener('mouseup', endDrag);

  cmp.addEventListener('touchstart', startDrag, { passive: false });
  window.addEventListener('touchmove', moveDrag, { passive: false });
  window.addEventListener('touchend', endDrag);
  window.addEventListener('touchcancel', endDrag);

  if (handle) {
    handle.addEventListener('keydown', e => {
      if (!processedBlob) return;
      const step = e.shiftKey ? 10 : 2;
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        cmpPos = Math.max(0, cmpPos - step);
        updateSlider();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        cmpPos = Math.min(100, cmpPos + step);
        updateSlider();
      } else if (e.key === 'Home') {
        e.preventDefault();
        cmpPos = 0;
        updateSlider();
      } else if (e.key === 'End') {
        e.preventDefault();
        cmpPos = 100;
        updateSlider();
      }
    });
  }

  // Color options listeners
  document.querySelectorAll('.color-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const color = btn.getAttribute('data-color');
      selectBgColor(color, btn);
    });
  });

  $('customColorPicker').addEventListener('input', e => {
    const color = e.target.value;
    // Remove active class from color buttons
    document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('active'));
    selectBgColor(color, null);
  });

  if (window.__initialLang) syncLang(window.__initialLang);
});

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

function resetSlider() {
  cmpPos = 50;
  updateSlider();
}

// Background color options selector
function selectBgColor(color, element) {
  selectedColor = color;
  const overlay = $('bgOverlay');
  
  if (element) {
    document.querySelectorAll('.color-btn').forEach(btn => btn.classList.remove('active'));
    element.classList.add('active');
  }

  if (color === 'transparent') {
    overlay.style.backgroundColor = '';
    overlay.style.backgroundImage = '';
    updateDownloadButtonText(true);
  } else {
    overlay.style.backgroundColor = color;
    overlay.style.backgroundImage = 'none';
    updateDownloadButtonText(false);
  }
}

function updateDownloadButtonText(isTrans) {
  const btnText = $('lblDownloadBtn');
  if (isTrans) {
    btnText.textContent = currentLang === 'id' ? 'Unduh PNG Transparan' : 'Download Transparent PNG';
  } else {
    btnText.textContent = currentLang === 'id' ? 'Unduh Gambar' : 'Download Image';
  }
}

// Main image processor
async function processImage(file) {
  if (!file.type.startsWith('image/')) {
    showAlert(currentLang === 'id' ? 'Format file tidak didukung. Pilih gambar!' : 'Unsupported file format. Select an image!', 'err');
    return;
  }

  originalFile = file;
  processedBlob = null;
  
  // Set UI state
  $('cmpEmpty').style.display = 'none';
  $('cmpImages').style.display = 'none';
  $('downloadBtn').disabled = true;
  $('bgOptionsTitle').style.display = 'none';
  $('bgOptionsCard').style.display = 'none';
  
  // Load original preview
  $('cmpOriginal').src = URL.createObjectURL(file);
  
  // Tampilkan CuteLoading
  const progressSection = $('progressSection');
  const statusLabel = { set textContent(v) { CuteLoading.setText('progressSection', v); } };
  const progressBar = { style: { set width(_) {} } }; // dummy - tidak ditampilkan ke user
  
  CuteLoading.show('progressSection', 'Sabar yahh..');

  try {
    const fn = await getRemoveBackgroundLib();
    const config = {
      progress: (key, current, total) => {},
      debug: false,
    };

    const resultBlob = await fn(file, config);
    processedBlob = resultBlob;

    // proses selesai - sembunyikan loading
    const processedUrl2 = URL.createObjectURL(resultBlob);

    if (processedUrl) URL.revokeObjectURL(processedUrl);
    processedUrl = processedUrl2;

    $('cmpResult').src = processedUrl;

    CuteLoading.hide('progressSection');
    const cmpImages = $('cmpImages');
    cmpImages.style.display = 'block';
    cmpImages.classList.remove('cmp-show');
    void cmpImages.offsetWidth; // trigger reflow for smooth transition
    cmpImages.classList.add('cmp-show');

    $('downloadBtn').disabled = false;
    $('bgOptionsTitle').style.display = 'block';
    $('bgOptionsCard').style.display = 'block';

    resetSlider();
    selectBgColor('transparent', document.querySelector('.color-btn[data-color="transparent"]'));
    showAlert(currentLang === 'id' ? 'Latar belakang berhasil dihapus!' : 'Background removed successfully!', 'ok');

  } catch (e) {
    console.error(e);
    CuteLoading.hide('progressSection');
    $('cmpEmpty').style.display = 'flex';
    const msg = e.message || String(e);
    showAlert(
      currentLang === 'id'
        ? `Gagal: ${msg.slice(0, 120)}`
        : `Failed: ${msg.slice(0, 120)}`,
      'err'
    );
  }
}

// Download action
async function downloadResult() {
  if (!processedBlob || !originalFile) return;

  const downloadOpts = {
    originalName: originalFile.name,
    featureName: 'background-remover',
    extension: 'png',
    mimeType: 'image/png'
  };

  if (selectedColor === 'transparent') {
    // Download directly using global ToolSuf download system
    if (typeof ToolSufDownload !== 'undefined') {
      await ToolSufDownload.downloadFile({ ...downloadOpts, blob: processedBlob });
    } else {
      triggerFileDownload(processedBlob, originalFile.name);
    }
  } else {
    // Draw canvas with colored background
    try {
      const img = new Image();
      img.src = processedUrl;
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');

      // Draw background color
      ctx.fillStyle = selectedColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw image
      ctx.drawImage(img, 0, 0);

      // Export canvas
      canvas.toBlob(async blob => {
        if (typeof ToolSufDownload !== 'undefined') {
          await ToolSufDownload.downloadFile({ ...downloadOpts, blob });
        } else {
          triggerFileDownload(blob, originalFile.name);
        }
      }, 'image/png');

    } catch (e) {
      console.error(e);
      showAlert(currentLang === 'id' ? 'Gagal mengunduh gambar berwarna.' : 'Failed to download colored image.', 'err');
    }
  }
}

function triggerFileDownload(blob, rawName) {
  const filename = typeof ToolSufDownload !== 'undefined'
    ? ToolSufDownload.generateFilename({ originalName: rawName, featureName: 'background-remover', extension: 'png' })
    : `toolsuf-${rawName.replace(/\.[^/.]+$/, '')}-background-remover.png`;

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

function showAlert(msg, type) {
  const el = $('alertBox');
  el.className = 'alert ' + type;
  el.textContent = msg;
  setTimeout(() => el.className = 'alert', 5000);
}

function resetAll() {
  originalFile = null;
  processedBlob = null;
  if (processedUrl) URL.revokeObjectURL(processedUrl);
  processedUrl = null;
  
  $('fi').value = '';
  $('cmpImages').style.display = 'none';
  $('cmpImages').classList.remove('cmp-show');
  $('cmpEmpty').style.display = 'flex';
  $('downloadBtn').disabled = true;
  $('bgOptionsTitle').style.display = 'none';
  $('bgOptionsCard').style.display = 'none';
  $('progressSection') && CuteLoading.hide('progressSection');
  $('alertBox').className = 'alert';
}

// ===== Theme/Lang synchronization =====
window.syncTheme = function(dark) {
  if (dark) {
    document.documentElement.classList.add('dark');
    document.documentElement.classList.remove('light');
  } else {
    document.documentElement.classList.add('light');
    document.documentElement.classList.remove('dark');
  }
};

let currentLang = 'id';

window.syncLang = function(lang) {
  const translations = {
    id: {
      secPickFile: 'Pilih Gambar',
      lblDropTitle: 'Seret & lepas gambar di sini',
      lblDropSub: 'Mendukung format JPG, PNG, WEBP, dan lainnya',
      secPreview: 'Pratinjau Hasil',
      cmpEmpty: 'Pilih gambar untuk memproses dan melihat hasil',
      cmpLabelsOriginal: 'Asli',
      cmpLabelsClean: 'Bersih',
      bgOptionsTitle: 'Kustomisasi Latar Belakang',
      lblBgColor: 'Warna Latar',
      lblBgColorDesc: 'Ganti warna latar hasil potongan',
      lblDownloadBtn: selectedColor === 'transparent' ? 'Unduh PNG Transparan' : 'Unduh Gambar',
      lblResetBtn: 'Hapus Gambar',
      preparing: 'Menyiapkan model AI...',
      success: 'Latar belakang berhasil dihapus!',
      failed: 'Gagal memproses gambar.',
    },
    en: {
      secPickFile: 'Select Image',
      lblDropTitle: 'Drag & drop image here',
      lblDropSub: 'Supports JPG, PNG, WEBP, and more',
      secPreview: 'Result Preview',
      cmpEmpty: 'Select an image to process and see the result',
      cmpLabelsOriginal: 'Original',
      cmpLabelsClean: 'Clean',
      bgOptionsTitle: 'Customize Background',
      lblBgColor: 'Background Color',
      lblBgColorDesc: 'Change background color of the output',
      lblDownloadBtn: selectedColor === 'transparent' ? 'Download Transparent PNG' : 'Download Image',
      lblResetBtn: 'Remove Image',
      preparing: 'Preparing AI model...',
      success: 'Background removed successfully!',
      failed: 'Failed to process image.',
    }
  };

  const d = translations[lang];
  if (!d) return;
  currentLang = lang;

  $('secPickFile').textContent = d.secPickFile;
  $('lblDropTitle').textContent = d.lblDropTitle;
  $('lblDropSub').textContent = d.lblDropSub;
  $('secPreview').textContent = d.secPreview;
  
  if (!processedBlob) {
    const emptyTitle = $('cmpEmptyTitle') || $('cmpEmpty');
    if (emptyTitle) emptyTitle.textContent = d.cmpEmpty;
  }

  const labels = $('cmpLabels').children;
  if (labels.length >= 2) {
    labels[0].textContent = d.cmpLabelsOriginal;
    labels[1].textContent = d.cmpLabelsClean;
  }

  $('bgOptionsTitle').textContent = d.bgOptionsTitle;
  $('lblBgColor').textContent = d.lblBgColor;
  $('lblBgColorDesc').textContent = d.lblBgColorDesc;
  
  updateDownloadButtonText(selectedColor === 'transparent');
  $('lblResetBtn').textContent = d.lblResetBtn;
};

// Expose functions to global scope (required for type="module" scripts)
window.downloadResult = downloadResult;
window.resetAll = resetAll;

// Listen for postMessage from parent dashboard
window.addEventListener('message', function(e) {
  if (e.data && e.data.type === 'syncTheme' && typeof window.syncTheme === 'function') {
    window.syncTheme(e.data.dark);
  }
  if (e.data && e.data.type === 'syncLang' && typeof window.syncLang === 'function') {
    window.syncLang(e.data.lang);
  }
});
