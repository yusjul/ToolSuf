(function() {
  try {
    var p = window.parent.document.documentElement;
    if (p.classList.contains('dark')) { document.documentElement.classList.add('dark'); }
    else { document.documentElement.classList.add('light'); }
  } catch(e) { document.documentElement.classList.add('light'); }
  var lang = new URLSearchParams(window.location.search).get('lang');
  window.__initialLang = lang === 'en' ? 'en' : 'id';
})();

let files = [], compressed = {}, previewIdx = -1, cmpPos = 50, cmpDragging = false;
let currentLang = 'id';
const $ = id => document.getElementById(id);

function toggleOpt(btn) {
  btn.classList.toggle('on');
  btn.setAttribute('aria-checked', btn.classList.contains('on'));
}

function toggleResize() {
  const btn = $('resizeToggle');
  toggleOpt(btn);
  $('resizeOptions').classList.toggle('open', btn.classList.contains('on'));
  updatePreview();
}

function updateQuality(val) {
  $('qualityVal').textContent = val;
  const slider = $('qualitySlider');
  const pct = ((val - 1) / 99) * 100;
  slider.style.background = `linear-gradient(to right, #007AFF ${pct}%, var(--apple-secondary-bg) ${pct}%)`;
  updatePreview();
}

function loadFiles(f) {
  if (!f.length) { showAlert(toolTranslations[currentLang].noFile, 'err'); return; }
  files = f;
  compressed = {};
  previewIdx = -1;
  $('statsSection').style.display = 'block';
  renderList();
  refreshStats();
  if (f.length) selectFile(0);
}

function refreshStats() {
  const total = files.reduce((s, f) => s + f.size, 0);
  $('stTotal').textContent = files.length;
  $('stSize').textContent = fmtSize(total);
  $('stFormat').textContent = new Set(files.map(f => getExt(f.name))).size;
  const est = Object.values(compressed).reduce((s, c) => s + c.size, 0);
  $('stEst').textContent = est ? fmtSize(est) : '-';
  $('fc').textContent = files.length + toolTranslations[currentLang].fileCount;
}

function getExt(name) { const i = name.lastIndexOf('.'); return i >= 0 ? name.slice(i).toLowerCase() : ''; }
function fmtSize(b) { if (b < 1024) return b + ' B'; if (b < 1048576) return Math.round(b / 1024) + ' KB'; return (b / 1048576).toFixed(1) + ' MB'; }

function renderList() {
  const list = $('fl');
  list.innerHTML = '';
  files.forEach((f, i) => {
    const d = document.createElement('div');
    d.className = 'fi' + (i === previewIdx ? ' active' : '');
    d.onclick = () => selectFile(i);
    const c = compressed[i];
    d.innerHTML =
      `<img class="fi-thumb" src="${URL.createObjectURL(f)}" alt="">` +
      `<span class="fi-name">${f.name}</span>` +
      `<span class="fi-old">${fmtSize(f.size)}</span>` +
      (c ? `<span class="fi-arr">→</span><span class="fi-new">${fmtSize(c.size)}</span>` +
        `<span class="fi-save good">-${Math.round((1 - c.size / f.size) * 100)}%</span>` : '');
    list.appendChild(d);
  });
}

function selectFile(i) {
  previewIdx = i;
  renderList();
  showComparison(i);
}

async function showComparison(i) {
  if (i < 0 || i >= files.length) return;
  const file = files[i];
  const t = toolTranslations[currentLang];
  $('cmpOriginal').src = URL.createObjectURL(file);
  $('cmpOldSize').textContent = t.cmpOriginal + ': ' + fmtSize(file.size) + ' (' + getExt(file.name).toUpperCase().replace('.', '') + ')';
  $('cmpImages').style.display = 'block';
  $('cmpEmpty').style.display = 'none';
  $('cmpInfo').style.display = 'flex';
  $('cmpNewSize').textContent = t.cmpProcessing;
  $('cmpSave').textContent = '';

  try {
    const result = await compressImage(file);
    compressed[i] = result;
    $('cmpCompressed').src = result.url;
    $('cmpNewSize').textContent = t.cmpResult + ': ' + fmtSize(result.size) + ' (' + result.format + ')';
    const save = Math.round((1 - result.size / file.size) * 100);
    $('cmpSave').textContent = t.save + ' ' + save + '%';
    refreshStats();
    renderList();
  } catch (e) {
    $('cmpNewSize').textContent = t.cmpFailed;
  }
  resetSlider();
}

function resetSlider() { cmpPos = 50; updateSlider(); }
function updateSlider() {
  $('cmpAfter').style.clipPath = `inset(0 ${100 - cmpPos}% 0 0)`;
  $('cmpHandle').style.left = cmpPos + '%';
}

function updateCmpPos(e) {
  const cmp = $('cmpContainer');
  const rect = cmp.getBoundingClientRect();
  cmpPos = Math.max(5, Math.min(95, ((e.clientX - rect.left) / rect.width) * 100));
  updateSlider();
}

async function compressImage(file) {
  const img = await loadImage(file);
  const quality = parseInt($('qualitySlider').value) || 80;
  const format = $('formatSelect').value;
  const doResize = $('resizeToggle').classList.contains('on');
  const maxW = parseInt($('resizeW').value) || 1920;
  const maxH = parseInt($('resizeH').value) || 1080;
  const lockAspect = $('aspectLock').checked;

  const canvas = document.createElement('canvas');
  let w = img.width, h = img.height;

  if (doResize) {
    if (lockAspect) {
      const ratio = Math.min(maxW / w, maxH / h, 1);
      w = Math.round(w * ratio);
      h = Math.round(h * ratio);
    } else {
      w = Math.min(w, maxW);
      h = Math.min(h, maxH);
    }
  }

  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, w, h);

  let mimeType;
  if (format === 'original') mimeType = file.type;
  else mimeType = 'image/' + format;

  const q = format === 'png' ? undefined : quality / 100;
  const blob = await new Promise(resolve => canvas.toBlob(resolve, mimeType, q));

  let fmtLabel = format === 'original' ? getExt(file.name).toUpperCase().replace('.', '') : format.toUpperCase();
  if (fmtLabel.startsWith('.')) fmtLabel = fmtLabel.slice(1);

  return { blob, url: URL.createObjectURL(blob), size: blob.size, width: w, height: h, format: fmtLabel };
}

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

function updatePreview() {
  if (previewIdx >= 0 && previewIdx < files.length) showComparison(previewIdx);
}

async function doZip() {
  const t = toolTranslations[currentLang];
  if (!files.length) { showAlert(t.noFile, 'err'); return; }
  const btn = $('zipBtn');
  btn.disabled = true;
  btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 6l0 -3"/><path d="M16.25 7.75l2.15 -2.15"/><path d="M18 12l3 0"/><path d="M16.25 16.25l2.15 2.15"/><path d="M12 18l0 3"/><path d="M7.75 16.25l-2.15 2.15"/><path d="M6 12l-3 0"/><path d="M7.75 7.75l-2.15 -2.15"/></svg> ' + t.cmpProcessing;
  $('zprog').style.display = 'block';
  const zpf = $('zpf'), zinfo = $('zinfo');
  const zip = new JSZip();
  const folder = zip.folder('compressed');

  for (let i = 0; i < files.length; i++) {
    zinfo.textContent = t.compressingFile + (i + 1) + ' / ' + files.length + '...';
    zpf.style.width = Math.round(((i + 1) / files.length) * 80) + '%';

    let result;
    if (compressed[i]) result = compressed[i];
    else { try { result = await compressImage(files[i]); compressed[i] = result; } catch (e) { result = { blob: files[i], size: files[i].size, format: 'original' }; } }

    const format = $('formatSelect').value;
    let ext = format === 'original' ? getExt(files[i].name) : '.' + format;
    const name = files[i].name.replace(/\.[^.]+$/, '') + ext;
    folder.file(name, result.blob || files[i]);

    if (i % 10 === 0) await new Promise(r => setTimeout(r, 0));
  }

  zinfo.textContent = t.compressingZip;
  const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' }, m => { zpf.style.width = Math.round(80 + m.percent * 0.2) + '%'; });
  zpf.style.width = '100%';
  zinfo.textContent = t.doneDownloading;

  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'compressed_images.zip';
  a.click();
  URL.revokeObjectURL(a.href);

  showAlert('✓ ' + files.length + t.success, 'ok');
  btn.disabled = false;
  btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 20.735a2 2 0 0 1 -1 -1.735v-14a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2h-1"/><path d="M11 17a2 2 0 0 1 2 2v2a1 1 0 0 1 -1 1h-2a1 1 0 0 1 -1 -1v-2a2 2 0 0 1 2 -2z"/></svg> ' + t.btnDownload;
  setTimeout(() => { $('zprog').style.display = 'none'; zpf.style.width = '0%'; }, 4000);
}

function showAlert(msg, type) {
  const el = $('alertBox');
  el.className = 'alert ' + type;
  el.textContent = msg;
  setTimeout(() => el.className = 'alert', 5000);
}

function resetFiles() {
  files = []; compressed = {}; previewIdx = -1;
  $('fi').value = '';
  $('statsSection').style.display = 'none';
  $('pf').style.width = '0%';
  $('cmpImages').style.display = 'none';
  $('cmpEmpty').style.display = 'block';
  $('cmpInfo').style.display = 'none';
  $('fl').innerHTML = '';
}

function resetAll() {
  resetFiles();
  $('qualitySlider').value = 80;
  $('qualityVal').textContent = '80';
  updateQuality(80);
  $('resizeToggle').className = 'apple-toggle';
  $('resizeToggle').setAttribute('aria-checked', 'false');
  $('resizeOptions').classList.remove('open');
  $('formatSelect').value = 'webp';
  $('formatSelect').dispatchEvent(new Event('change'));
  $('resizeW').value = '1920';
  $('resizeH').value = '1080';
  $('aspectLock').checked = true;
  $('zprog').style.display = 'none';
  $('alertBox').className = 'alert';
}

function applyTheme(dark) {
  if (dark) { document.documentElement.classList.add('dark'); document.documentElement.classList.remove('light'); }
  else { document.documentElement.classList.add('light'); document.documentElement.classList.remove('dark'); }
}
window.syncTheme = function(dark) { applyTheme(dark); };

const toolTranslations = {
  id: {
    lblPickFile: 'Pilih File',
    dropTitle: 'Seret & lepas gambar di sini',
    dropSub: 'Atau klik untuk memilih file',
    statTotal: 'Total File',
    statSize: 'Ukuran',
    statFormat: 'Format',
    statEst: 'Estimasi',
    lblSettings: 'Pengaturan Kompresi',
    qualityTitle: 'Kualitas',
    resizeTitle: 'Ubah Ukuran',
    resizeDesc: 'Ubah dimensi gambar',
    resizeW: 'Lebar Maks',
    resizeH: 'Tinggi Maks',
    aspectLock: 'Pertahankan aspek rasio',
    formatTitle: 'Format Output',
    optOriginal: 'Asli',
    lblPreview: 'Pratinjau',
    cmpEmpty: 'Pilih gambar untuk melihat perbandingan',
    cmpOriginal: 'Asli',
    cmpResult: 'Hasil',
    cmpProcessing: 'Memproses...',
    cmpFailed: 'Gagal kompresi',
    save: 'Hemat',
    btnDownload: 'Unduh ZIP',
    btnRemove: 'Hapus File',
    btnReset: 'Reset Semua',
    preparing: 'Menyiapkan ZIP...',
    compressingFile: 'Mengompresi ',
    compressingZip: 'Mengompresi ZIP...',
    doneDownloading: 'Selesai! Mengunduh...',
    fileCount: ' file dipilih',
    noFile: 'Pilih file gambar terlebih dahulu.',
    success: ' gambar dikompres & diunduh!',
  },
  en: {
    lblPickFile: 'Pick Files',
    dropTitle: 'Drag & drop images here',
    dropSub: 'Or click to select files',
    statTotal: 'Total Files',
    statSize: 'Size',
    statFormat: 'Formats',
    statEst: 'Estimate',
    lblSettings: 'Compression Settings',
    qualityTitle: 'Quality',
    resizeTitle: 'Resize',
    resizeDesc: 'Change image dimensions',
    resizeW: 'Max Width',
    resizeH: 'Max Height',
    aspectLock: 'Maintain aspect ratio',
    formatTitle: 'Output Format',
    optOriginal: 'Original',
    lblPreview: 'Preview',
    cmpEmpty: 'Select an image to compare',
    cmpOriginal: 'Original',
    cmpResult: 'Result',
    cmpProcessing: 'Processing...',
    cmpFailed: 'Compression failed',
    save: 'Saved',
    btnDownload: 'Download ZIP',
    btnRemove: 'Remove Files',
    btnReset: 'Reset All',
    preparing: 'Preparing ZIP...',
    compressingFile: 'Compressing ',
    compressingZip: 'Compressing ZIP...',
    doneDownloading: 'Done! Downloading...',
    fileCount: ' files selected',
    noFile: 'Please select image files first.',
    success: ' images compressed & downloaded!',
  }
};

window.syncLang = function(lang) {
  if (!toolTranslations[lang]) return;
  currentLang = lang;
  const d = toolTranslations[lang];

  // Update section titles
  const lblPickFile = $('lblPickFile');
  if (lblPickFile) lblPickFile.textContent = d.lblPickFile;
  const lblSettings = $('lblSettings');
  if (lblSettings) lblSettings.textContent = d.lblSettings;
  const lblPreview = $('lblPreview');
  if (lblPreview) lblPreview.textContent = d.lblPreview;

  // Update drop area texts
  const dropTitle = $('dropTitle');
  if (dropTitle) dropTitle.textContent = d.dropTitle;
  const dropSub = $('dropSub');
  if (dropSub) dropSub.textContent = d.dropSub;

  // Update stat labels
  const lblStatTotal = $('lblStatTotal');
  if (lblStatTotal) lblStatTotal.textContent = d.statTotal;
  const lblStatSize = $('lblStatSize');
  if (lblStatSize) lblStatSize.textContent = d.statSize;
  const lblStatFormat = $('lblStatFormat');
  if (lblStatFormat) lblStatFormat.textContent = d.statFormat;
  const lblStatEst = $('lblStatEst');
  if (lblStatEst) lblStatEst.textContent = d.statEst;

  // Update settings labels
  const lblQuality = $('lblQuality');
  if (lblQuality) lblQuality.textContent = d.qualityTitle;
  const lblResize = $('lblResize');
  if (lblResize) lblResize.textContent = d.resizeTitle;
  const lblResizeDesc = $('lblResizeDesc');
  if (lblResizeDesc) lblResizeDesc.textContent = d.resizeDesc;
  const lblFormat = $('lblFormat');
  if (lblFormat) lblFormat.textContent = d.formatTitle;

  // Update resize field labels
  const lblMaxWidth = $('lblMaxWidth');
  if (lblMaxWidth) lblMaxWidth.textContent = d.resizeW;
  const lblMaxHeight = $('lblMaxHeight');
  if (lblMaxHeight) lblMaxHeight.textContent = d.resizeH;

  // Update aspect lock checkbox label
  const aspectLabel = $('lblAspectLock');
  if (aspectLabel) aspectLabel.lastChild.textContent = ' ' + d.aspectLock;

  // Update original select option
  const optOriginal = $('optOriginal');
  if (optOriginal) optOriginal.textContent = d.optOriginal;

  // Update comparison labels
  const cmpEmpty = $('cmpEmpty');
  if (cmpEmpty) cmpEmpty.textContent = d.cmpEmpty;
  const lblCmpOriginal = $('lblCmpOriginal');
  if (lblCmpOriginal) lblCmpOriginal.textContent = d.cmpOriginal;
  const lblCmpResult = $('lblCmpResult');
  if (lblCmpResult) lblCmpResult.textContent = d.cmpResult;

  // Update main action buttons
  const zipBtn = $('zipBtn');
  if (zipBtn && !zipBtn.disabled) {
    zipBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 20.735a2 2 0 0 1 -1 -1.735v-14a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2h-1"/><path d="M11 17a2 2 0 0 1 2 2v2a1 1 0 0 1 -1 1h-2a1 1 0 0 1 -1 -1v-2a2 2 0 0 1 2 -2z"/></svg> ' + d.btnDownload;
  }
  
  const btns = document.querySelectorAll('.btn-s');
  if (btns[0]) btns[0].innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3v4a1 1 0 0 0 1 1h4"/><path d="M17 21h-10a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2z"/><path d="M10 12l4 4m0 -4l-4 4"/></svg> ' + d.btnRemove;
  if (btns[1]) btns[1].innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 11a8.1 8.1 0 0 0 -15.5 -2m-.5 -4v4h4"/><path d="M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4"/></svg> ' + d.btnReset;

  // Update ZIP preparation progress text if visible
  const zinfo = $('zinfo');
  if (zinfo) {
    if (zinfo.textContent === toolTranslations[lang === 'id' ? 'en' : 'id'].preparing) {
      zinfo.textContent = d.preparing;
    }
  }

  // Update selected files count label if files are loaded
  if (files.length > 0) {
    $('fc').textContent = files.length + d.fileCount;
  }

  // Refresh current comparison display if open to update Asli/Hasil sizes labels
  if (previewIdx >= 0 && previewIdx < files.length) {
    const file = files[previewIdx];
    $('cmpOldSize').textContent = d.cmpOriginal + ': ' + fmtSize(file.size) + ' (' + getExt(file.name).toUpperCase().replace('.', '') + ')';
    const result = compressed[previewIdx];
    if (result) {
      $('cmpNewSize').textContent = d.cmpResult + ': ' + fmtSize(result.size) + ' (' + result.format + ')';
      const save = Math.round((1 - result.size / file.size) * 100);
      $('cmpSave').textContent = d.save + ' ' + save + '%';
    }
  }
  const formatSelect = $('formatSelect');
  if (formatSelect) {
    formatSelect.dispatchEvent(new Event('lang-changed'));
  }
};

// Listen for postMessage from parent dashboard
window.addEventListener('message', function(e) {
  if (e.data && e.data.type === 'syncTheme' && typeof applyTheme === 'function') {
    applyTheme(e.data.dark);
  }
  if (e.data && e.data.type === 'syncLang' && typeof window.syncLang === 'function') {
    window.syncLang(e.data.lang);
  }
});

function initCustomSelects() {
  const selects = document.querySelectorAll('select.apple-select');
  selects.forEach(select => {
    if (select.nextElementSibling && select.nextElementSibling.classList.contains('apple-select-custom')) return;
    
    const wrapper = document.createElement('div');
    wrapper.className = 'apple-select-custom';
    if (select.classList.contains('sm')) wrapper.classList.add('sm');
    
    const trigger = document.createElement('button');
    trigger.className = 'apple-select-custom-trigger';
    trigger.type = 'button';
    trigger.setAttribute('aria-haspopup', 'listbox');
    trigger.setAttribute('aria-expanded', 'false');
    
    const triggerVal = document.createElement('span');
    triggerVal.className = 'val';
    
    const triggerArrow = document.createElement('span');
    triggerArrow.className = 'arr';
    triggerArrow.innerHTML = `
      <svg viewBox="0 0 24 24">
        <polyline points="8 9 12 5 16 9"></polyline>
        <polyline points="16 15 12 19 8 15"></polyline>
      </svg>
    `;
    
    trigger.appendChild(triggerVal);
    trigger.appendChild(triggerArrow);
    wrapper.appendChild(trigger);
    
    const dropdown = document.createElement('div');
    dropdown.className = 'apple-select-custom-dropdown';
    dropdown.setAttribute('role', 'listbox');
    
    wrapper.appendChild(dropdown);
    select.parentNode.insertBefore(wrapper, select.nextSibling);
    
    const syncOptions = () => {
      dropdown.innerHTML = '';
      const options = select.querySelectorAll('option');
      let selectedText = '';
      
      options.forEach(opt => {
        const isSelected = opt.selected || select.value === opt.value;
        if (isSelected) {
          selectedText = opt.textContent;
        }
        
        const optionEl = document.createElement('div');
        optionEl.className = 'apple-select-custom-opt' + (isSelected ? ' selected' : '');
        optionEl.setAttribute('role', 'option');
        optionEl.setAttribute('aria-selected', isSelected ? 'true' : 'false');
        optionEl.dataset.value = opt.value;
        
        optionEl.innerHTML = `
          <span class="chk">${isSelected ? '✓' : ''}</span>
          <span class="txt">${opt.textContent}</span>
        `;
        
        optionEl.addEventListener('click', (e) => {
          e.stopPropagation();
          select.value = opt.value;
          select.dispatchEvent(new Event('change', { bubbles: true }));
          syncOptions();
          closeMenu();
        });
        
        dropdown.appendChild(optionEl);
      });
      
      triggerVal.textContent = selectedText || (options[0] ? options[0].textContent : '');
    };
    
    const openMenu = () => {
      document.querySelectorAll('.apple-select-custom-dropdown.open').forEach(menu => {
        if (menu !== dropdown) {
          menu.classList.remove('open');
          menu.previousElementSibling.setAttribute('aria-expanded', 'false');
        }
      });
      dropdown.classList.add('open');
      trigger.setAttribute('aria-expanded', 'true');
      
      const rect = dropdown.getBoundingClientRect();
      if (rect.bottom > window.innerHeight && rect.top > rect.height) {
        dropdown.classList.add('pop-up');
      } else {
        dropdown.classList.remove('pop-up');
      }
    };
    
    const closeMenu = () => {
      dropdown.classList.remove('open');
      trigger.setAttribute('aria-expanded', 'false');
    };
    
    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      if (dropdown.classList.contains('open')) closeMenu();
      else openMenu();
    });
    
    document.addEventListener('click', closeMenu);
    
    select.addEventListener('change', syncOptions);
    select.addEventListener('lang-changed', syncOptions);
    syncOptions();
  });
}

// Connect DOM listeners and load configuration
document.addEventListener('DOMContentLoaded', () => {
  $('fi').addEventListener('change', e => loadFiles([...e.target.files]));

  const drop = $('drop');
  drop.addEventListener('dragover', e => { e.preventDefault(); drop.classList.add('over'); });
  drop.addEventListener('dragleave', () => drop.classList.remove('over'));
  drop.addEventListener('drop', e => {
    e.preventDefault(); drop.classList.remove('over');
    const imgs = [...e.dataTransfer.files].filter(f => f.type.startsWith('image/'));
    if (imgs.length) loadFiles(imgs);
  });

  const cmp = $('cmpContainer');
  cmp.addEventListener('mousedown', e => { if (previewIdx < 0) return; cmpDragging = true; updateCmpPos(e); });
  document.addEventListener('mousemove', e => { if (cmpDragging) updateCmpPos(e); });
  document.addEventListener('mouseup', () => { cmpDragging = false; });
  cmp.addEventListener('touchstart', e => { if (previewIdx < 0) return; cmpDragging = true; updateCmpPos(e.touches[0]); });
  document.addEventListener('touchmove', e => { if (cmpDragging) updateCmpPos(e.touches[0]); });
  document.addEventListener('touchend', () => { cmpDragging = false; });

  updateQuality(80);
  initCustomSelects();
  if (window.__initialLang) syncLang(window.__initialLang);
});
