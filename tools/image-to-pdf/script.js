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
    dropTitle: 'Pilih gambar untuk dijadikan PDF',
    dropSub: 'Seret & lepas atau klik untuk memilih',
    sectionPreview: 'URUTAN HALAMAN',
    sectionSettings: 'PENGATURAN PDF',
    pageSize: 'Ukuran Halaman',
    orientation: 'Orientasi',
    quality: 'Kualitas Gambar',
    margin: 'Margin Halaman',
    generate: 'Buat PDF',
    clear: 'Hapus Semua',
    processing: 'Memproses...',
    processingPage: 'Memproses halaman',
    success: 'PDF berhasil dibuat!',
    noImages: 'Pilih setidaknya satu gambar terlebih dahulu',
    error: 'Gagal membuat PDF. Coba lagi.',
    dragHint: 'Seret kartu untuk mengubah urutan halaman',
    orientationP: 'Portrait',
    orientationL: 'Landscape',
    sizeA4: 'A4 (210×297mm)',
    sizeLetter: 'Letter (216×279mm)',
    sizeA3: 'A3 (297×420mm)',
    sizeFit: 'Sesuai Gambar',
    marginNone: 'Tanpa Margin',
    marginSmall: 'Kecil (10mm)',
    marginNormal: 'Normal (20mm)',
    marginLarge: 'Lebar (30mm)',
  },
  en: {
    dropTitle: 'Select images to convert to PDF',
    dropSub: 'Drag & drop or click to browse',
    sectionPreview: 'PAGE ORDER',
    sectionSettings: 'PDF SETTINGS',
    pageSize: 'Page Size',
    orientation: 'Orientation',
    quality: 'Image Quality',
    margin: 'Page Margin',
    generate: 'Create PDF',
    clear: 'Clear All',
    processing: 'Processing...',
    processingPage: 'Processing page',
    success: 'PDF created successfully!',
    noImages: 'Please select at least one image first',
    error: 'Failed to create PDF. Try again.',
    dragHint: 'Drag cards to reorder pages',
    orientationP: 'Portrait',
    orientationL: 'Landscape',
    sizeA4: 'A4 (210×297mm)',
    sizeLetter: 'Letter (216×279mm)',
    sizeA3: 'A3 (297×420mm)',
    sizeFit: 'Fit to Image',
    marginNone: 'No Margin',
    marginSmall: 'Small (10mm)',
    marginNormal: 'Normal (20mm)',
    marginLarge: 'Large (30mm)',
  }
};

let currentLang = 'id';
let images = [];
let dragIndex = null;

function t(key) {
  return (translations[currentLang] && translations[currentLang][key]) || key;
}

function applyLang(lang) {
  currentLang = lang;
  document.querySelector('.drop-t').textContent = t('dropTitle');
  document.querySelector('.drop-s').textContent = t('dropSub');
  document.querySelector('.preview-hint').textContent = t('dragHint');
  const headers = document.querySelectorAll('.mac-section-header');
  if (headers[0]) headers[0].textContent = t('sectionPreview');
  if (headers[1]) headers[1].textContent = t('sectionSettings');
  document.getElementById('genBtn').innerHTML = `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="12" y1="18" x2="12" y2="12"/>
      <line x1="9" y1="15" x2="15" y2="15"/>
    </svg>
    ${t('generate')}
  `;
  document.querySelector('.btn-s').innerHTML = `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="3 6 5 6 21 6"/>
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
    </svg>
    ${t('clear')}
  `;

  const sizeOpts = document.getElementById('pageSize').options;
  const sizeKeys = ['sizeA4', 'sizeLetter', 'sizeA3', 'sizeFit'];
  for (let i = 0; i < sizeOpts.length && i < sizeKeys.length; i++) {
    sizeOpts[i].textContent = t(sizeKeys[i]);
  }

  const orientOpts = document.getElementById('orientation').options;
  orientOpts[0].textContent = t('orientationP');
  orientOpts[1].textContent = t('orientationL');

  const marginOpts = document.getElementById('margin').options;
  const marginKeys = ['marginNone', 'marginSmall', 'marginNormal', 'marginLarge'];
  for (let i = 0; i < marginOpts.length && i < marginKeys.length; i++) {
    marginOpts[i].textContent = t(marginKeys[i]);
  }
  initCustomDropdowns();
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
const previewSection = document.getElementById('previewSection');
const previewGrid = document.getElementById('previewGrid');
const imgCount = document.getElementById('imgCount');
const genBtn = document.getElementById('genBtn');
const progressCard = document.getElementById('progressCard');
const progressText = document.getElementById('progressText');
const pf = document.getElementById('pf');
const alertBox = document.getElementById('alertBox');

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
  handleFiles(e.dataTransfer.files);
});

fileInput.addEventListener('change', () => {
  handleFiles(fileInput.files);
});

function handleFiles(files) {
  if (!files.length) return;
  alertBox.style.display = 'none';
  for (const file of files) {
    if (!file.type.startsWith('image/')) continue;
    images.push({ file, name: file.name });
  }
  fileInput.value = '';
  renderPreview();
}

function renderPreview() {
  previewGrid.innerHTML = '';
  if (!images.length) {
    previewSection.style.display = 'none';
    genBtn.disabled = true;
    return;
  }
  previewSection.style.display = 'block';
  genBtn.disabled = false;
  imgCount.textContent = images.length + ' halaman';

  images.forEach((img, i) => {
    const card = document.createElement('div');
    card.className = 'img-card';
    card.draggable = true;
    card.dataset.index = i;

    const num = document.createElement('div');
    num.className = 'img-num';
    num.textContent = i + 1;

    const del = document.createElement('button');
    del.className = 'img-del';
    del.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
    del.addEventListener('click', (e) => {
      e.stopPropagation();
      images.splice(i, 1);
      renderPreview();
    });

    const imgEl = document.createElement('img');
    const url = URL.createObjectURL(img.file);
    imgEl.src = url;
    imgEl.alt = img.name;

    const nameEl = document.createElement('div');
    nameEl.className = 'img-name';
    nameEl.textContent = img.name;

    card.appendChild(num);
    card.appendChild(del);
    card.appendChild(imgEl);
    card.appendChild(nameEl);
    previewGrid.appendChild(card);

    card.addEventListener('dragstart', (e) => {
      dragIndex = i;
      card.classList.add('drag-over');
      e.dataTransfer.effectAllowed = 'move';
    });

    card.addEventListener('dragend', () => {
      card.classList.remove('drag-over');
    });

    card.addEventListener('dragover', (e) => {
      e.preventDefault();
      card.classList.add('drag-over');
    });

    card.addEventListener('dragleave', () => {
      card.classList.remove('drag-over');
    });

    card.addEventListener('drop', (e) => {
      e.preventDefault();
      card.classList.remove('drag-over');
      if (dragIndex === null || dragIndex === i) return;
      const [moved] = images.splice(dragIndex, 1);
      images.splice(i, 0, moved);
      dragIndex = null;
      renderPreview();
    });
  });
}

function clearAll() {
  images = [];
  fileInput.value = '';
  renderPreview();
  progressCard.style.display = 'none';
  alertBox.style.display = 'none';
}

function showAlert(msg, type) {
  alertBox.textContent = msg;
  alertBox.className = 'alert ' + type;
  alertBox.style.display = 'block';
}

function setProgress(pct, text) {
  progressCard.style.display = 'block';
  pf.style.width = pct + '%';
  progressText.textContent = text || t('processing');
}

function getPageSizeMM(size) {
  const sizes = {
    a4: [210, 297],
    letter: [215.9, 279.4],
    a3: [297, 420],
  };
  return sizes[size] || sizes.a4;
}

async function generatePDF() {
  if (!images.length) {
    showAlert(t('noImages'), 'err');
    return;
  }

  genBtn.disabled = true;
  setProgress(0, t('processing'));

  try {
    const sizeKey = document.getElementById('pageSize').value;
    const orient = document.getElementById('orientation').value;
    const quality = parseInt(document.getElementById('quality').value) / 100;
    const margin = parseInt(document.getElementById('margin').value);

    const [w, h] = getPageSizeMM(sizeKey);
    const isLandscape = orient === 'l';
    const pdfW = isLandscape ? h : w;
    const pdfH = isLandscape ? w : h;

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({
      orientation: isLandscape ? 'l' : 'p',
      unit: 'mm',
      format: sizeKey === 'fit' ? [w, h] : [pdfW, pdfH],
    });

    const marginMM = margin;
    const usableW = (sizeKey === 'fit' ? w : pdfW) - marginMM * 2;
    const usableH = (sizeKey === 'fit' ? h : pdfH) - marginMM * 2;

    let first = true;

    for (let i = 0; i < images.length; i++) {
      setProgress(Math.round((i / images.length) * 90), t('processingPage') + ' ' + (i + 1));

      const imgData = await loadImageAsDataURL(images[i].file, quality);

      if (!first) doc.addPage();
      first = false;

      const img = new Image();
      img.src = imgData;
      await new Promise((resolve) => { img.onload = resolve; });

      const imgAR = img.width / img.height;
      const pageAR = usableW / usableH;

      let renderW, renderH;
      if (imgAR > pageAR) {
        renderW = usableW;
        renderH = renderW / imgAR;
      } else {
        renderH = usableH;
        renderW = renderH * imgAR;
      }

      const offsetX = marginMM + (usableW - renderW) / 2;
      const offsetY = marginMM + (usableH - renderH) / 2;

      doc.addImage(imgData, 'JPEG', offsetX, offsetY, renderW, renderH, undefined, 'FAST');
    }

    setProgress(100, t('processing'));
    await new Promise(r => setTimeout(r, 200));

    doc.save('images.pdf');
    showAlert(t('success'), 'ok');
  } catch (e) {
    console.error(e);
    showAlert(t('error'), 'err');
  } finally {
    genBtn.disabled = false;
    setTimeout(() => { progressCard.style.display = 'none'; }, 500);
  }
}

function loadImageAsDataURL(file, quality) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  if (window.__initialLang) applyLang(window.__initialLang);
});

function initCustomDropdowns() {
  document.querySelectorAll('.apple-dropdown-container').forEach(el => el.remove());
  document.querySelectorAll('select.apple-select').forEach(select => {
    select.style.display = 'none';
    const container = document.createElement('div');
    container.className = 'apple-dropdown-container';
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'apple-dropdown-button';
    const label = document.createElement('span');
    label.className = 'apple-dropdown-label';
    const activeOption = select.querySelector('option[selected]') || select.options[select.selectedIndex] || select.options[0];
    label.textContent = activeOption ? activeOption.textContent : '';
    const chevronSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    chevronSvg.setAttribute('class', 'apple-dropdown-chevron');
    chevronSvg.setAttribute('viewBox', '0 0 24 24');
    chevronSvg.setAttribute('fill', 'none');
    chevronSvg.setAttribute('stroke', 'currentColor');
    chevronSvg.setAttribute('stroke-width', '2.5');
    chevronSvg.setAttribute('stroke-linecap', 'round');
    chevronSvg.setAttribute('stroke-linejoin', 'round');
    chevronSvg.innerHTML = '<polyline points="6 9 12 15 18 9"></polyline>';
    button.appendChild(label);
    button.appendChild(chevronSvg);
    container.appendChild(button);
    const menu = document.createElement('ul');
    menu.className = 'apple-dropdown-menu';
    Array.from(select.options).forEach(opt => {
      const item = document.createElement('li');
      item.className = 'apple-dropdown-item';
      if (opt.value === select.value) {
        item.classList.add('active');
      }
      item.dataset.value = opt.value;
      item.textContent = opt.textContent;
      const checkSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      checkSvg.setAttribute('class', 'apple-dropdown-check');
      checkSvg.setAttribute('viewBox', '0 0 24 24');
      checkSvg.setAttribute('fill', 'none');
      checkSvg.setAttribute('stroke', 'currentColor');
      checkSvg.setAttribute('stroke-width', '3');
      checkSvg.setAttribute('stroke-linecap', 'round');
      checkSvg.setAttribute('stroke-linejoin', 'round');
      checkSvg.innerHTML = '<polyline points="20 6 9 17 4 12"></polyline>';
      item.appendChild(checkSvg);
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        select.value = opt.value;
        label.textContent = opt.textContent;
        menu.querySelectorAll('.apple-dropdown-item').forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        select.dispatchEvent(new Event('change'));
        container.classList.remove('open');
      });
      menu.appendChild(item);
    });
    container.appendChild(menu);
    button.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = container.classList.contains('open');
      document.querySelectorAll('.apple-dropdown-container').forEach(el => el.classList.remove('open'));
      if (!isOpen) {
        container.classList.add('open');
      }
    });
    select.parentNode.insertBefore(container, select.nextSibling);
  });
}

document.addEventListener('click', () => {
  document.querySelectorAll('.apple-dropdown-container').forEach(el => el.classList.remove('open'));
});

