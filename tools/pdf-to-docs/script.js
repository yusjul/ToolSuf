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
    selectPdf: 'PILIH PDF',
    dropTitle: 'Pilih file PDF untuk dikonversi',
    dropSub: 'Seret & lepas atau klik untuk memilih',
    fileInfo: 'INFO FILE',
    fileName: 'Nama File',
    fileSize: 'Ukuran',
    pages: 'Halaman',
    extractedText: 'TEKS TEREKSTRAK',
    conversionSettings: 'PENGATURAN KONVERSI',
    outputFormat: 'Format Output',
    convertBtn: 'Konversi ke DOCX',
    clear: 'Hapus',
    processing: 'Memproses...',
    processingPage: 'Membaca halaman',
    generatingDoc: 'Membuat dokumen...',
    successDocx: 'Dokumen DOCX berhasil dibuat!',
    successTxt: 'File TXT berhasil dibuat!',
    noFile: 'Pilih file PDF terlebih dahulu',
    error: 'Gagal mengonversi PDF. Coba lagi.',
    errorPdf: 'File tidak valid. Pilih file PDF.',
    pageLabel: 'Halaman',
    formatDocx: 'DOCX (Word)',
    formatTxt: 'TXT (Plain Text)',
  },
  en: {
    selectPdf: 'SELECT PDF',
    dropTitle: 'Select a PDF file to convert',
    dropSub: 'Drag & drop or click to browse',
    fileInfo: 'FILE INFO',
    fileName: 'File Name',
    fileSize: 'Size',
    pages: 'Pages',
    extractedText: 'EXTRACTED TEXT',
    conversionSettings: 'CONVERSION SETTINGS',
    outputFormat: 'Output Format',
    convertBtn: 'Convert to DOCX',
    clear: 'Clear',
    processing: 'Processing...',
    processingPage: 'Reading page',
    generatingDoc: 'Generating document...',
    successDocx: 'DOCX document created successfully!',
    successTxt: 'TXT file created successfully!',
    noFile: 'Please select a PDF file first',
    error: 'Failed to convert PDF. Try again.',
    errorPdf: 'Invalid file. Please select a PDF.',
    pageLabel: 'Page',
    formatDocx: 'DOCX (Word)',
    formatTxt: 'TXT (Plain Text)',
  }
};

let currentLang = 'id';
let pdfData = null;
let pdfDoc = null;
let pageTexts = [];

function t(key) {
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
  const fmt = document.getElementById('outputFormat');
  fmt.options[0].textContent = t('formatDocx');
  fmt.options[1].textContent = t('formatTxt');
  const btn = document.getElementById('convBtn');
  const fmtVal = fmt.value === 'docx' ? t('convertBtn') : 'Convert to ' + fmt.options[fmt.selectedIndex].textContent;
  btn.querySelector('span').textContent = fmtVal;
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

pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

const drop = document.getElementById('drop');
const fileInput = document.getElementById('fi');
const infoSection = document.getElementById('infoSection');
const previewSection = document.getElementById('previewSection');
const previewScroll = document.getElementById('previewScroll');
const fileName = document.getElementById('fileName');
const fileSize = document.getElementById('fileSize');
const filePages = document.getElementById('filePages');
const pageCount = document.getElementById('pageCount');
const convBtn = document.getElementById('convBtn');
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
  const file = e.dataTransfer.files[0];
  if (file) handleFile(file);
});

fileInput.addEventListener('change', () => {
  if (fileInput.files.length) handleFile(fileInput.files[0]);
});

document.getElementById('outputFormat').addEventListener('change', function() {
  const isDocx = this.value === 'docx';
  const span = convBtn.querySelector('span');
  span.textContent = isDocx ? t('convertBtn') : t('successTxt').replace(' berhasil dibuat!', '');
  span.textContent = isDocx ? t('convertBtn') : 'Convert to TXT';
  applyLang(currentLang);
});

async function handleFile(file) {
  if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
    showAlert(t('errorPdf'), 'err');
    return;
  }
  alertBox.style.display = 'none';
  pdfData = file;
  fileName.textContent = file.name;
  fileSize.textContent = formatSize(file.size);
  infoSection.style.display = 'block';
  convBtn.disabled = true;
  setProgress(0, t('processing'));

  try {
    const arrayBuffer = await file.arrayBuffer();
    pdfDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const totalPages = pdfDoc.numPages;
    filePages.textContent = totalPages;
    pageCount.textContent = totalPages + ' halaman';
    pageTexts = [];

    previewScroll.innerHTML = '';

    for (let i = 1; i <= totalPages; i++) {
      setProgress(Math.round((i / totalPages) * 80), t('processingPage') + ' ' + i);
      const page = await pdfDoc.getPage(i);
      const textContent = await page.getTextContent();
      const text = textContent.items.map(item => item.str).join(' ');
      pageTexts.push(text);

      const div = document.createElement('div');
      div.className = 'page-text';
      div.innerHTML = `<div class="page-text-header">${t('pageLabel')} ${i}</div><div class="page-text-body">${escapeHtml(text) || '(kosong)'}</div>`;
      previewScroll.appendChild(div);
    }

    previewSection.style.display = 'block';
    convBtn.disabled = false;
    fileInput.value = '';
    setProgress(100, 'Selesai');
    setTimeout(() => { progressCard.style.display = 'none'; }, 400);
  } catch (e) {
    console.error(e);
    showAlert(t('error'), 'err');
    progressCard.style.display = 'none';
  }
}

async function convertPDF() {
  if (!pdfData || !pageTexts.length) {
    showAlert(t('noFile'), 'err');
    return;
  }

  convBtn.disabled = true;
  setProgress(90, t('generatingDoc'));

  try {
    const format = document.getElementById('outputFormat').value;

    if (format === 'docx') {
      await generateDOCX();
    } else {
      generateTXT();
    }
  } catch (e) {
    console.error(e);
    showAlert(t('error'), 'err');
    convBtn.disabled = false;
    progressCard.style.display = 'none';
  }
}

async function generateDOCX() {
  const { Document, Packer, Paragraph, TextRun, Header, Footer, AlignmentType, HeadingLevel } = window.docx;
  const baseName = pdfData.name.replace(/\.pdf$/i, '');

  const children = [];

  for (let i = 0; i < pageTexts.length; i++) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: t('pageLabel') + ' ' + (i + 1),
            bold: true,
            size: 24,
            color: '007AFF',
          }),
        ],
        spacing: { before: 400, after: 100 },
      })
    );

    const lines = pageTexts[i].split('\n');
    for (const line of lines) {
      if (line.trim()) {
        children.push(
          new Paragraph({
            children: [new TextRun({ text: line.trim(), size: 22 })],
            spacing: { after: 120 },
          })
        );
      }
    }

    if (i < pageTexts.length - 1) {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: '', size: 22 })],
          spacing: { before: 200, after: 200 },
          pageBreakBefore: true,
        })
      );
    }
  }

  const doc = new Document({
    title: baseName,
    description: 'Converted from ' + pdfData.name,
    styles: { default: { document: { run: { font: 'Calibri' } } } },
    sections: [{
      properties: {},
      headers: {
        default: new Header({
          children: [new Paragraph({
            children: [new TextRun({ text: baseName, size: 16, color: '999999' })],
            alignment: AlignmentType.CENTER,
          })],
        }),
      },
      footers: {
        default: new Footer({
          children: [new Paragraph({
            children: [new TextRun({ text: 'ToolSuf - PDF to DOCX', size: 16, color: '999999' })],
            alignment: AlignmentType.CENTER,
          })],
        }),
      },
      children,
    }],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, baseName + '.docx');
  showAlert(t('successDocx'), 'ok');
  convBtn.disabled = false;
  setTimeout(() => { progressCard.style.display = 'none'; }, 400);
}

function generateTXT() {
  const baseName = pdfData.name.replace(/\.pdf$/i, '');
  let content = '';

  for (let i = 0; i < pageTexts.length; i++) {
    content += `=== ${t('pageLabel')} ${i + 1} ===\n\n`;
    content += pageTexts[i] + '\n\n';
  }

  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  saveAs(blob, baseName + '.txt');
  showAlert(t('successTxt'), 'ok');
  convBtn.disabled = false;
  setTimeout(() => { progressCard.style.display = 'none'; }, 400);
}

function clearAll() {
  pdfData = null;
  pdfDoc = null;
  pageTexts = [];
  fileInput.value = '';
  infoSection.style.display = 'none';
  previewSection.style.display = 'none';
  previewScroll.innerHTML = '';
  convBtn.disabled = true;
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

function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(1) + ' MB';
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

document.addEventListener('DOMContentLoaded', () => {
  if (window.__initialLang) applyLang(window.__initialLang);
});
