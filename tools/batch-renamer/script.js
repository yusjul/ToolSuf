(function () {
  // Theme sync dari parent dashboard
  try {
    var p = window.parent.document.documentElement;
    if (p.classList.contains('dark')) document.documentElement.classList.add('dark');
    else document.documentElement.classList.add('light');
  } catch (e) { document.documentElement.classList.add('light'); }
  var lang = new URLSearchParams(window.location.search).get('lang');
  window.__initialLang = lang === 'en' ? 'en' : 'id';
})();

let files = [], sortMode = 'name', extMap = {}, undoHistory = [];

const $ = id => document.getElementById(id);

function toggleOpt(btn) {
  btn.classList.toggle('on');
  btn.setAttribute('aria-checked', btn.classList.contains('on'));
}

function applyTheme(dark) {
  if (dark) {
    document.documentElement.classList.add('dark');
    document.documentElement.classList.remove('light');
  } else {
    document.documentElement.classList.add('light');
    document.documentElement.classList.remove('dark');
  }
}

window.syncTheme = function (dark) { applyTheme(dark); };

// Connect file input listener
document.addEventListener('DOMContentLoaded', () => {
  $('fi').addEventListener('change', e => loadFiles([...e.target.files]));
  const drop = $('drop');
  drop.addEventListener('dragover', e => { e.preventDefault(); drop.classList.add('over'); });
  drop.addEventListener('dragleave', () => drop.classList.remove('over'));
  drop.addEventListener('drop', e => { e.preventDefault(); drop.classList.remove('over'); loadFiles([...e.dataTransfer.files]); });
});

function loadFiles(f) {
  pushUndo('load');
  files = f;
  $('en').value = files.length;
  sortFiles();
  $('statsSection').style.display = 'block';
  refreshStats();
  $('pf').style.width = '100%';
  update();
}

function sortFiles() {
  if (!files.length) return;
  const arr = [...files];
  if (sortMode === 'name') arr.sort((a, b) => a.name.localeCompare(b.name));
  else if (sortMode === 'name-d') arr.sort((a, b) => b.name.localeCompare(a.name));
  else if (sortMode === 'size') arr.sort((a, b) => a.size - b.size);
  else if (sortMode === 'size-d') arr.sort((a, b) => b.size - a.size);
  else if (sortMode === 'ext') arr.sort((a, b) => getExt(a.name).localeCompare(getExt(b.name)));
  files = arr;
}

function setSort(m) {
  pushUndo('sort');
  sortMode = m;
  ['name', 'name-d', 'size', 'size-d', 'ext', 'orig'].forEach(k => $('sb-' + k).classList.remove('active'));
  $('sb-' + m).classList.add('active');
  sortFiles();
  renderList();
  update();
}

function refreshStats() {
  const total = files.reduce((s, f) => s + f.size, 0);
  $('stTotal').textContent = files.length;
  $('stSize').textContent = fmtSize(total);
  $('stExt').textContent = new Set(files.map(f => getExt(f.name))).size;
  $('stUndo').textContent = undoHistory.length;
  $('fc').textContent = files.length + ' file dipilih';
}

function getExt(name) { const i = name.lastIndexOf('.'); return i >= 0 ? name.slice(i).toLowerCase() : ''; }
function fmtSize(b) { if (b < 1024) return b + ' B'; if (b < 1048576) return Math.round(b / 1024) + ' KB'; return (b / 1048576).toFixed(1) + ' MB'; }

function genName(i) {
  const base = $('base').value || 'file';
  const pre = $('pre').value || '';
  const sn = parseInt($('sn').value) || 1;
  const en = parseInt($('en').value) || 1000;
  const step = parseInt($('step').value) || 1;
  const pad = $('pad').classList.contains('on');
  const lc = $('lc').classList.contains('on');
  const mode = $('extMode').value;
  const num = sn + i * step;
  const digits = String(en).length;
  const numStr = pad ? String(num).padStart(digits, '0') : String(num);
  let e = '';
  if (files[i]) {
    const orig = getExt(files[i].name);
    if (mode === 'original') e = lc ? orig.toLowerCase() : orig;
    else if (mode === 'single') { const v = $('singleV').value || orig; e = lc ? v.toLowerCase() : v; }
    else { e = extMap[orig] || orig; if (lc) e = e.toLowerCase(); }
  } else e = lc ? '.jpg' : '.JPG';
  if (e && !e.startsWith('.')) e = '.' + e;
  return pre + base + numStr + e;
}

function updateSeq() {
  const sn = parseInt($('sn').value) || 1;
  const step = parseInt($('step').value) || 1;
  const total = files.length || 10;
  const chips = $('seqChips');
  chips.innerHTML = '';
  const count = Math.min(total, 8);
  for (let i = 0; i < count; i++) {
    const num = sn + i * step;
    const sp = document.createElement('span');
    sp.className = 'seq-chip';
    sp.textContent = num;
    chips.appendChild(sp);
  }
  if (total > 8) {
    const more = document.createElement('span');
    more.className = 'seq-more';
    const last = sn + (total - 1) * step;
    more.textContent = '\u2026 ' + last;
    chips.appendChild(more);
  }
}

function renderList() {
  const list = $('fl');
  list.innerHTML = '';
  const lim = Math.min(files.length, 12);
  for (let i = 0; i < lim; i++) {
    const d = document.createElement('div');
    d.className = 'fi';
    const e = getExt(files[i].name).toUpperCase().replace('.', '') || '?';
    d.innerHTML = `<span class="fi-ext">${e}</span><span class="fi-old">${files[i].name}</span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:var(--apple-label);width:11px;height:11px;flex-shrink:0"><path d="M5 12l14 0"/><path d="M15 16l4 -4"/><path d="M15 8l4 4"/></svg><span class="fi-new">${genName(i)}</span>`;
    list.appendChild(d);
  }
  if (files.length > 12) {
    const m = document.createElement('div');
    m.style.cssText = 'padding:5px 10px;font-size:11px;color:var(--apple-label);text-align:center';
    m.textContent = '+ ' + (files.length - 12) + ' file lainnya';
    list.appendChild(m);
  }
}

function update() {
  updateSeq();
  const old = files[0] ? files[0].name : 'gambar.cr2';
  $('pvOld').textContent = old;
  $('pvNew').textContent = genName(0);
  if (files.length) renderList();
  if (files.length) refreshStats();
}

function toggleExtMode() {
  const m = $('extMode').value;
  $('singleExt').style.display = m === 'single' ? 'block' : 'none';
  $('manualExt').style.display = m === 'manual' ? 'block' : 'none';
  update();
}

function addMap() {
  const from = $('mf').value.trim().toLowerCase();
  const to = $('mt').value.trim().toLowerCase();
  if (!from || !to) return;
  const k = from.startsWith('.') ? from : '.' + from;
  const v = to.startsWith('.') ? to : '.' + to;
  pushUndo('map');
  extMap[k] = v;
  renderChips();
  $('mf').value = ''; $('mt').value = '';
  update();
}

function renderChips() {
  const c = $('mapChips'); c.innerHTML = '';
  for (const [k, v] of Object.entries(extMap)) {
    const s = document.createElement('span'); s.className = 'ext-chip';
    s.innerHTML = `${k} \u2192 ${v} <button onclick="delMap('${k}')">\u00d7</button>`;
    c.appendChild(s);
  }
}

function delMap(k) { pushUndo('map'); delete extMap[k]; renderChips(); update(); }

function pushUndo(type) {
  undoHistory.push({
    type,
    base: $('base').value, pre: $('pre').value,
    sn: $('sn').value, en: $('en').value, step: $('step').value,
    pad: $('pad').classList.contains('on'),
    lc: $('lc').classList.contains('on'),
    extMode: $('extMode').value, singleV: $('singleV').value,
    extMap: { ...extMap }, sortMode, files: [...files]
  });
  if (undoHistory.length > 20) undoHistory.shift();
  $('undoBtn').disabled = false;
  $('stUndo').textContent = undoHistory.length;
  $('undoStack').textContent = 'Riwayat: ' + undoHistory.length + ' langkah (max 20)';
}

function doUndo() {
  if (!undoHistory.length) return;
  const s = undoHistory.pop();
  files = [...s.files];
  sortMode = s.sortMode;
  $('base').value = s.base; $('pre').value = s.pre;
  $('sn').value = s.sn; $('en').value = s.en; $('step').value = s.step;
  $('pad').classList.toggle('on', s.pad); $('pad').setAttribute('aria-checked', s.pad);
  $('lc').classList.toggle('on', s.lc); $('lc').setAttribute('aria-checked', s.lc);
  $('extMode').value = s.extMode;
  $('extMode').dispatchEvent(new Event('change'));
  $('singleV').value = s.singleV;
  extMap = { ...s.extMap };
  toggleExtMode();
  renderChips();
  ['name', 'name-d', 'size', 'size-d', 'ext', 'orig'].forEach(k => $('sb-' + k).classList.remove('active'));
  $('sb-' + sortMode).classList.add('active');
  if (files.length) {
    $('statsSection').style.display = 'block';
    $('pf').style.width = '100%';
  } else {
    $('statsSection').style.display = 'none';
  }
  $('undoBtn').disabled = undoHistory.length === 0;
  $('stUndo').textContent = undoHistory.length;
  $('undoStack').textContent = undoHistory.length ? 'Riwayat: ' + undoHistory.length + ' langkah' : 'Belum ada riwayat undo';
  update();
  showAlert('\u21a9 Undo berhasil \u2014 kembali ke langkah sebelumnya', 'ok');
}

async function doZip() {
  if (!files.length) { showAlert('Pilih file terlebih dahulu.', 'err'); return; }
  const btn = $('zipBtn');
  btn.disabled = true;
  btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 6l0 -3"/><path d="M16.25 7.75l2.15 -2.15"/><path d="M18 12l3 0"/><path d="M16.25 16.25l2.15 2.15"/><path d="M12 18l0 3"/><path d="M7.75 16.25l-2.15 2.15"/><path d="M6 12l-3 0"/><path d="M7.75 7.75l-2.15 -2.15"/></svg> Memproses...';
  $('zprog').style.display = 'block';
  const zpf = $('zpf'), zinfo = $('zinfo');
  const zip = new JSZip();
  const folder = zip.folder('renamed');
  const csv = ['Nama Asli,Nama Baru,Ukuran,Format'];
  for (let i = 0; i < files.length; i++) {
    const nn = genName(i);
    folder.file(nn, files[i]);
    csv.push(`"${files[i].name}","${nn}","${fmtSize(files[i].size)}","${getExt(files[i].name)}"`);
    zpf.style.width = Math.round(((i + 1) / files.length) * 80) + '%';
    zinfo.textContent = 'Menambahkan ' + (i + 1) + ' / ' + files.length + ' file...';
    if (i % 15 === 0) await new Promise(r => setTimeout(r, 0));
  }
  if ($('csv').classList.contains('on')) zip.file('laporan_rename.csv', csv.join('\n'));
  zinfo.textContent = 'Mengompresi...';
  const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' }, m => { zpf.style.width = Math.round(80 + m.percent * .2) + '%'; });
  zpf.style.width = '100%';
  zinfo.textContent = 'Selesai! Mengunduh ZIP...';
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = ($('base').value || 'renamed') + '_files.zip';
  a.click();
  URL.revokeObjectURL(a.href);
  showAlert('\u2713 ' + files.length + ' file direname & dikemas dalam ZIP!', 'ok');
  btn.disabled = false;
  btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 20.735a2 2 0 0 1 -1 -1.735v-14a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2h-1"/><path d="M11 17a2 2 0 0 1 2 2v2a1 1 0 0 1 -1 1h-2a1 1 0 0 1 -1 -1v-2a2 2 0 0 1 2 -2z"/></svg> Download ZIP';
  setTimeout(() => { $('zprog').style.display = 'none'; zpf.style.width = '0%'; }, 4000);
}

function showAlert(msg, type) {
  const el = $('alertBox'); el.className = 'alert ' + type; el.textContent = msg;
  setTimeout(() => el.className = 'alert', 5000);
}

function resetFiles() {
  pushUndo('reset-files');
  files = []; $('fi').value = '';
  $('statsSection').style.display = 'none';
  $('pf').style.width = '0%';
  update();
}

function resetAll() {
  pushUndo('reset-all');
  files = []; $('fi').value = '';
  $('base').value = 'yusjul'; $('pre').value = '';
  $('sn').value = '1'; $('en').value = '1000'; $('step').value = '1';
  $('pad').classList.remove('on'); $('pad').setAttribute('aria-checked', 'false');
  $('lc').classList.add('on'); $('lc').setAttribute('aria-checked', 'true');
  $('csv').classList.add('on'); $('csv').setAttribute('aria-checked', 'true');
  $('extMode').value = 'original';
  $('extMode').dispatchEvent(new Event('change'));
  $('singleV').value = '';
  extMap = {}; renderChips();
  sortMode = 'name';
  ['name', 'name-d', 'size', 'size-d', 'ext', 'orig'].forEach(k => $('sb-' + k).classList.remove('active'));
  $('sb-name').classList.add('active');
  $('singleExt').style.display = 'none'; $('manualExt').style.display = 'none';
  $('statsSection').style.display = 'none'; $('pf').style.width = '0%';
  $('zprog').style.display = 'none'; $('alertBox').className = 'alert';
  update();
}

// ===== Language Sync =====
window.syncLang = function (lang) {
  const t = {
    id: {
      lblPickFile: 'Pilih File',
      dropTitle: 'Semua format didukung \u2014 tanpa batasan',
      dropSub: 'Seret & lepas atau klik untuk memilih',
      badgeMore: '+ Semua format lain',
      statTotal: 'Total File', statSize: 'Ukuran', statFormat: 'Format', statUndo: 'Riwayat Undo',
      lblSort: 'Urutan & Sortir', sortBy: 'Urutkan file berdasarkan',
      sortNameAZ: 'Nama A\u2013Z', sortNameZA: 'Nama Z\u2013A',
      sortSizeAsc: 'Ukuran \u2191', sortSizeDesc: 'Ukuran \u2193',
      sortExt: 'Format', sortOrig: 'Urutan Asli',
      lblNaming: 'Pengaturan Nama', labelBase: 'Nama Dasar', labelPrefix: 'Awalan (opsional)',
      labelStart: 'Nomor Mulai', labelEnd: 'Nomor Akhir', labelStep: 'Step (loncat)',
      seqPreview: 'Preview urutan angka', lblExt: 'Ekstensi Output',
      extOrig: 'Pertahankan ekstensi asli', extSingle: 'Ganti semua ke satu ekstensi',
      extManual: 'Pemetaan manual per-format', labelNewExt: 'Ekstensi baru',
      addMapBtn: 'Tambah', lblPreview: 'Pratinjau nama', lblAdvanced: 'Opsi Lanjutan',
      padLabel: 'Pad angka dengan nol', padSub: 'yusjul001 bukan yusjul1',
      lcLabel: 'Lowercase ekstensi', lcSub: '.JPG .CR2 \u2192 .jpg .cr2',
      csvLabel: 'Laporan CSV hasil rename', csvSub: 'Ikut tersimpan di dalam ZIP',
      downloadBtn: 'Download ZIP', undoBtn: 'Undo',
      noUndo: 'Belum ada riwayat undo', deleteFiles: 'Hapus File',
      resetAll: 'Reset Semua', preparing: 'Menyiapkan ZIP...',
    },
    en: {
      lblPickFile: 'Pick Files',
      dropTitle: 'All formats supported \u2014 no limits',
      dropSub: 'Drag & drop or click to select',
      badgeMore: '+ All other formats',
      statTotal: 'Total Files', statSize: 'Size', statFormat: 'Formats', statUndo: 'Undo History',
      lblSort: 'Order & Sort', sortBy: 'Sort files by',
      sortNameAZ: 'Name A\u2013Z', sortNameZA: 'Name Z\u2013A',
      sortSizeAsc: 'Size \u2191', sortSizeDesc: 'Size \u2193',
      sortExt: 'Format', sortOrig: 'Original Order',
      lblNaming: 'Naming Settings', labelBase: 'Base Name', labelPrefix: 'Prefix (optional)',
      labelStart: 'Start Number', labelEnd: 'End Number', labelStep: 'Step (increment)',
      seqPreview: 'Number sequence preview', lblExt: 'Output Extension',
      extOrig: 'Keep original extension', extSingle: 'Replace all with one extension',
      extManual: 'Manual mapping per format', labelNewExt: 'New extension',
      addMapBtn: 'Add', lblPreview: 'Name preview', lblAdvanced: 'Advanced Options',
      padLabel: 'Pad numbers with zeros', padSub: 'yusjul001 instead of yusjul1',
      lcLabel: 'Lowercase extensions', lcSub: '.JPG .CR2 \u2192 .jpg .cr2',
      csvLabel: 'CSV rename report', csvSub: 'Included in the ZIP file',
      downloadBtn: 'Download ZIP', undoBtn: 'Undo',
      noUndo: 'No undo history yet', deleteFiles: 'Remove Files',
      resetAll: 'Reset All', preparing: 'Preparing ZIP...',
    }
  };

  const d = t[lang];
  if (!d) return;

  document.querySelectorAll('.mac-section-header').forEach(el => {
    const txt = el.textContent.trim();
    if (['Pilih File', 'Pick Files'].includes(txt)) el.textContent = d.lblPickFile;
    else if (['Urutan & Sortir', 'Order & Sort'].includes(txt)) el.textContent = d.lblSort;
    else if (['Pengaturan Nama', 'Naming Settings'].includes(txt)) el.textContent = d.lblNaming;
    else if (['Opsi Lanjutan', 'Advanced Options'].includes(txt)) el.textContent = d.lblAdvanced;
  });

  document.querySelectorAll('.setting-row.column > div:first-child').forEach(el => {
    const txt = el.textContent.trim();
    if (['Pratinjau nama', 'Name preview'].includes(txt)) el.textContent = d.lblPreview;
    else if (['Ekstensi Output', 'Output Extension'].includes(txt)) el.textContent = d.lblExt;
    else if (['Urutkan file berdasarkan', 'Sort files by'].includes(txt)) el.textContent = d.sortBy;
  });

  const dropT = document.querySelector('.drop-t');
  const dropS = document.querySelector('.drop-s');
  if (dropT) dropT.textContent = d.dropTitle;
  if (dropS) dropS.textContent = d.dropSub;

  const badges = document.querySelectorAll('.badge');
  if (badges.length) badges[badges.length - 1].textContent = d.badgeMore;

  const statLbls = document.querySelectorAll('.stat-l');
  ['statTotal', 'statSize', 'statFormat', 'statUndo'].forEach((k, i) => { if (statLbls[i]) statLbls[i].textContent = d[k]; });

  $('sb-name').innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6l7 0"/><path d="M4 12l7 0"/><path d="M4 18l9 0"/><path d="M15 9l3 -3l3 3"/><path d="M18 6l0 12"/></svg> ${d.sortNameAZ}`;
  $('sb-name-d').innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6l9 0"/><path d="M4 12l7 0"/><path d="M4 18l7 0"/><path d="M15 15l3 3l3 -3"/><path d="M18 6l0 12"/></svg> ${d.sortNameZA}`;
  $('sb-size').innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5l0 14"/><path d="M18 11l-6 -6"/><path d="M6 11l6 -6"/></svg> ${d.sortSizeAsc}`;
  $('sb-size-d').innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5l0 14"/><path d="M18 13l-6 6"/><path d="M6 13l6 6"/></svg> ${d.sortSizeDesc}`;
  $('sb-ext').innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3v4a1 1 0 0 0 1 1h4"/><path d="M17 21h-10a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2z"/></svg> ${d.sortExt}`;
  $('sb-orig').innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2 -2v-2"/><path d="M7 9l5 -5l5 5"/><path d="M12 4l0 12"/></svg> ${d.sortOrig}`;

  document.querySelectorAll('.field label').forEach(el => {
    const txt = el.textContent.trim();
    if (['Nama Dasar', 'Base Name'].includes(txt)) el.textContent = d.labelBase;
    else if (['Awalan (opsional)', 'Prefix (optional)'].includes(txt)) el.textContent = d.labelPrefix;
    else if (['Nomor Mulai', 'Start Number'].includes(txt)) el.textContent = d.labelStart;
    else if (['Nomor Akhir', 'End Number'].includes(txt)) el.textContent = d.labelEnd;
    else if (['Step (loncat)', 'Step (increment)'].includes(txt)) el.textContent = d.labelStep;
    else if (['Ekstensi baru', 'New extension'].includes(txt)) el.textContent = d.labelNewExt;
  });

  const seqTitle = document.querySelector('.seq-title');
  if (seqTitle) seqTitle.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 6h9"/><path d="M11 12h9"/><path d="M12 18h8"/><path d="M4 16a2 2 0 1 1 4 0c0 .591 -.5 1 -1 1.5l-3 2.5h4"/><path d="M6 10v-6l-2 2"/></svg>${d.seqPreview}`;

  const extMode = $('extMode');
  if (extMode && extMode.options.length >= 3) {
    extMode.options[0].textContent = d.extOrig;
    extMode.options[1].textContent = d.extSingle;
    extMode.options[2].textContent = d.extManual;
  }

  const addBtn = document.querySelector('#manualExt button');
  if (addBtn) addBtn.textContent = d.addMapBtn;

  document.querySelectorAll('.setting-title').forEach(el => {
    const txt = el.textContent.trim();
    if (['Pad angka dengan nol', 'Pad numbers with zeros'].includes(txt)) el.textContent = d.padLabel;
    else if (['Lowercase ekstensi', 'Lowercase extensions'].includes(txt)) el.textContent = d.lcLabel;
    else if (['Laporan CSV hasil rename', 'CSV rename report'].includes(txt)) el.textContent = d.csvLabel;
  });

  document.querySelectorAll('.setting-desc').forEach(el => {
    const txt = el.textContent.trim();
    if (['yusjul001 bukan yusjul1', 'yusjul001 instead of yusjul1'].includes(txt)) el.textContent = d.padSub;
    else if (['.JPG .CR2 \u2192 .jpg .cr2'].includes(txt)) el.textContent = d.lcSub;
    else if (['Ikut tersimpan di dalam ZIP', 'Included in the ZIP file'].includes(txt)) el.textContent = d.csvSub;
  });

  $('zipBtn').innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 20.735a2 2 0 0 1 -1 -1.735v-14a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2h-1"/><path d="M11 17a2 2 0 0 1 2 2v2a1 1 0 0 1 -1 1h-2a1 1 0 0 1 -1 -1v-2a2 2 0 0 1 2 -2z"/></svg> ${d.downloadBtn}`;
  $('undoBtn').innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 14l-4 -4l4 -4"/><path d="M5 10h11a4 4 0 1 1 0 8h-1"/></svg> ${d.undoBtn}`;

  const resetBtns = document.querySelectorAll('.btn-s');
  if (resetBtns[0]) resetBtns[0].innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3v4a1 1 0 0 0 1 1h4"/><path d="M17 21h-10a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2z"/><path d="M10 12l4 4m0 -4l-4 4"/></svg> ${d.deleteFiles}`;
  if (resetBtns[1]) resetBtns[1].innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 11a8.1 8.1 0 0 0 -15.5 -2m-.5 -4v4h4"/><path d="M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4"/></svg> ${d.resetAll}`;

  const undoStack = $('undoStack');
  if (undoStack && ['Belum ada riwayat undo', 'No undo history yet'].includes(undoStack.textContent)) {
    undoStack.textContent = d.noUndo;
  }

  const zinfo = $('zinfo');
  if (zinfo) zinfo.textContent = d.preparing;

  if (files.length > 0) $('fc').textContent = files.length + (lang === 'id' ? ' file dipilih' : ' files selected');
  
  if (extMode) {
    extMode.dispatchEvent(new Event('lang-changed'));
  }
};

window.addEventListener('message', function (e) {
  if (e.data && e.data.type === 'syncTheme' && typeof applyTheme === 'function') applyTheme(e.data.dark);
  if (e.data && e.data.type === 'syncLang' && typeof window.syncLang === 'function') window.syncLang(e.data.lang);
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

document.addEventListener('DOMContentLoaded', () => {
  update();
  initCustomSelects();
  if (window.__initialLang) syncLang(window.__initialLang);
});
