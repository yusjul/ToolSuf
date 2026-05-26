// Theme sync from dashboard
(function() {
  try {
    var p = window.parent.document.documentElement;
    if (p.classList.contains('dark')) { document.documentElement.classList.add('dark'); }
    else { document.documentElement.classList.add('light'); }
  } catch(e) { document.documentElement.classList.add('light'); }
  var lang = new URLSearchParams(window.location.search).get('lang');
  window.__initialLang = lang === 'en' ? 'en' : 'id';
})();

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
  try {
    const module = await import('https://cdn.jsdelivr.net/npm/@imgly/background-removal/+esm');
    removeBackgroundFn = module.removeBackground;
    return removeBackgroundFn;
  } catch (e) {
    console.error('Gagal memuat library @imgly/background-removal:', e);
    throw e;
  }
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

  // Slider controls
  const cmp = $('cmpContainer');
  cmp.addEventListener('mousedown', e => { if (!processedBlob) return; cmpDragging = true; updateCmpPos(e); });
  document.addEventListener('mousemove', e => { if (cmpDragging) updateCmpPos(e); });
  document.addEventListener('mouseup', () => { cmpDragging = false; });
  cmp.addEventListener('touchstart', e => { if (!processedBlob) return; cmpDragging = true; updateCmpPos(e.touches[0]); });
  document.addEventListener('touchmove', e => { if (cmpDragging) updateCmpPos(e.touches[0]); });
  document.addEventListener('touchend', () => { cmpDragging = false; });

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
  cmpPos = Math.max(5, Math.min(95, ((e.clientX - rect.left) / rect.width) * 100));
  updateSlider();
}

function updateSlider() {
  $('cmpAfter').style.clipPath = `inset(0 0 0 ${cmpPos}%)`;
  $('cmpHandle').style.left = cmpPos + '%';
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
  
  // Show progress card
  const progressSection = $('progressSection');
  const statusLabel = $('statusLabel');
  const progressBar = $('progressBar');
  
  progressSection.style.display = 'block';
  statusLabel.textContent = currentLang === 'id' ? 'Menyiapkan model AI...' : 'Preparing AI model...';
  progressBar.style.width = '0%';

  try {
    const fn = await getRemoveBackgroundLib();
    
    const config = {
      progress: (key, current, total) => {
        const pct = Math.round((current / total) * 100);
        const name = getFriendlyKey(key, currentLang);
        statusLabel.textContent = currentLang === 'id' 
          ? `Mengunduh ${name}: ${pct}%` 
          : `Downloading ${name}: ${pct}%`;
        progressBar.style.width = pct + '%';
      }
    };

    // Delay slightly to transition progress bar smooth
    await new Promise(r => setTimeout(r, 400));
    
    // Switch status to processing when download completes
    setTimeout(() => {
      if (!processedBlob) {
        statusLabel.textContent = currentLang === 'id' ? 'Memotong latar belakang...' : 'Removing background...';
        progressBar.style.width = '100%';
      }
    }, 1000);

    const resultBlob = await fn(file, config);
    processedBlob = resultBlob;
    
    // Revoke old URL if exists
    if (processedUrl) URL.revokeObjectURL(processedUrl);
    processedUrl = URL.createObjectURL(resultBlob);
    
    // Load result
    $('cmpResult').src = processedUrl;
    
    // Show views
    progressSection.style.display = 'none';
    $('cmpImages').style.display = 'block';
    $('downloadBtn').disabled = false;
    $('bgOptionsTitle').style.display = 'block';
    $('bgOptionsCard').style.display = 'block';
    
    resetSlider();
    selectBgColor('transparent', document.querySelector('.color-btn[data-color="transparent"]'));
    showAlert(currentLang === 'id' ? 'Latar belakang berhasil dihapus!' : 'Background removed successfully!', 'ok');

  } catch (e) {
    console.error(e);
    progressSection.style.display = 'none';
    $('cmpEmpty').style.display = 'block';
    showAlert(currentLang === 'id' ? 'Gagal memproses gambar.' : 'Failed to process image.', 'err');
  }
}

// Download action
async function downloadResult() {
  if (!processedBlob || !originalFile) return;

  const originalName = originalFile.name.replace(/\.[^/.]+$/, "");
  const extension = selectedColor === 'transparent' ? '.png' : '.png';
  const downloadName = `${originalName}_no_bg${extension}`;

  if (selectedColor === 'transparent') {
    // Download directly
    triggerFileDownload(processedBlob, downloadName);
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
      canvas.toBlob(blob => {
        triggerFileDownload(blob, downloadName);
      }, 'image/png');

    } catch (e) {
      console.error(e);
      showAlert(currentLang === 'id' ? 'Gagal mengunduh gambar berwarna.' : 'Failed to download colored image.', 'err');
    }
  }
}

function triggerFileDownload(blob, filename) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 100);
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
  $('cmpEmpty').style.display = 'block';
  $('downloadBtn').disabled = true;
  $('bgOptionsTitle').style.display = 'none';
  $('bgOptionsCard').style.display = 'none';
  $('progressSection').style.display = 'none';
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
  
  if ($('cmpEmpty') && !processedBlob) {
    $('cmpEmpty').textContent = d.cmpEmpty;
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

// Listen for postMessage from parent dashboard
window.addEventListener('message', function(e) {
  if (e.data && e.data.type === 'syncTheme' && typeof window.syncTheme === 'function') {
    window.syncTheme(e.data.dark);
  }
  if (e.data && e.data.type === 'syncLang' && typeof window.syncLang === 'function') {
    window.syncLang(e.data.lang);
  }
});
