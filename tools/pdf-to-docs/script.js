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
    extractedText: 'PREVIEW HALAMAN',
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
    extractedText: 'PAGE PREVIEW',
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
let pagesData = [];

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

function multiplyMatrices(m1, m2) {
  return [
    m1[0] * m2[0] + m1[2] * m2[1],
    m1[1] * m2[0] + m1[3] * m2[1],
    m1[0] * m2[2] + m1[2] * m2[3],
    m1[1] * m2[2] + m1[3] * m2[3],
    m1[0] * m2[4] + m1[2] * m2[5] + m1[4],
    m1[1] * m2[4] + m1[3] * m2[5] + m1[5]
  ];
}

function convertToViewport(x, y, viewport) {
  const [a, b, c, d, e, f] = viewport.transform;
  return [
    a * x + c * y + e,
    b * x + d * y + f
  ];
}

async function getBase64Image(imageObj) {
  // Handle ImageBitmap objects (modern browsers with pdf.js)
  if (imageObj && imageObj.bitmap && typeof ImageBitmap !== 'undefined' && imageObj.bitmap instanceof ImageBitmap) {
    const canvas = document.createElement('canvas');
    canvas.width = imageObj.bitmap.width;
    canvas.height = imageObj.bitmap.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(imageObj.bitmap, 0, 0);
    return canvas.toDataURL('image/png');
  }
  if (typeof ImageBitmap !== 'undefined' && imageObj instanceof ImageBitmap) {
    const canvas = document.createElement('canvas');
    canvas.width = imageObj.width;
    canvas.height = imageObj.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(imageObj, 0, 0);
    return canvas.toDataURL('image/png');
  }
  if (imageObj.data && imageObj.data.length === imageObj.width * imageObj.height * 4) {
    const canvas = document.createElement('canvas');
    canvas.width = imageObj.width;
    canvas.height = imageObj.height;
    const ctx = canvas.getContext('2d');
    const imgData = ctx.createImageData(imageObj.width, imageObj.height);
    imgData.data.set(imageObj.data);
    ctx.putImageData(imgData, 0, 0);
    return canvas.toDataURL('image/png');
  } else if (imageObj.data && (imageObj.data[0] === 0xff && imageObj.data[1] === 0xd8)) {
    const blob = new Blob([imageObj.data], { type: 'image/jpeg' });
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(blob);
    });
  } else if (imageObj.src) {
    return imageObj.src;
  } else {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = imageObj.width;
      canvas.height = imageObj.height;
      const ctx = canvas.getContext('2d');
      const imgData = ctx.createImageData(imageObj.width, imageObj.height);
      if (imageObj.data && imageObj.data.length === imageObj.width * imageObj.height * 3) {
        const rgba = new Uint8ClampedArray(imageObj.width * imageObj.height * 4);
        for (let i = 0, j = 0; i < imageObj.data.length; i += 3, j += 4) {
          rgba[j] = imageObj.data[i];
          rgba[j+1] = imageObj.data[i+1];
          rgba[j+2] = imageObj.data[i+2];
          rgba[j+3] = 255;
        }
        imgData.data.set(rgba);
      } else {
        imgData.data.set(imageObj.data);
      }
      ctx.putImageData(imgData, 0, 0);
      return canvas.toDataURL('image/png');
    } catch (e) {
      console.warn("Could not convert image to base64", e);
      return null;
    }
  }
}

function getStandardFont(pdfFontFamily) {
  if (!pdfFontFamily) return 'Calibri';
  const name = pdfFontFamily.toLowerCase();
  if (name.includes('arial') || name.includes('helvetica') || name.includes('sans')) {
    return 'Arial';
  }
  if (name.includes('times') || name.includes('serif') || name.includes('georgia')) {
    return 'Times New Roman';
  }
  if (name.includes('courier') || name.includes('mono')) {
    return 'Courier New';
  }
  const cleanName = pdfFontFamily.replace(/^[A-Z]{6}\+/, '');
  return cleanName;
}

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
    pagesData = [];

    previewScroll.innerHTML = '';

    for (let i = 1; i <= totalPages; i++) {
      setProgress(Math.round((i / totalPages) * 70), t('processingPage') + ' ' + i);
      const page = await pdfDoc.getPage(i);
      const viewport = page.getViewport({ scale: 1.0 });
      const pageWidth = viewport.width;
      const pageHeight = viewport.height;

      // Render page at higher quality for visual preview & to force image decoding
      const previewScale = 1.5;
      const previewViewport = page.getViewport({ scale: previewScale });
      const previewCanvas = document.createElement('canvas');
      previewCanvas.width = previewViewport.width;
      previewCanvas.height = previewViewport.height;
      const previewCtx = previewCanvas.getContext('2d');
      await page.render({
        canvasContext: previewCtx,
        viewport: previewViewport
      }).promise;

      // Extract text content
      const textContent = await page.getTextContent();
      const textItems = textContent.items;

      // Map text items to viewport space
      const textElements = textItems.map(item => {
        const [x, y] = convertToViewport(item.transform[4], item.transform[5], viewport);
        const scaleX = Math.abs(item.transform[0]);
        const scaleY = Math.abs(item.transform[3]);
        const fontSize = scaleY || item.height || 10;
        
        const style = textContent.styles[item.fontName];
        const fontFamily = style ? style.fontFamily : 'sans-serif';
        
        return {
          text: item.str,
          left: x,
          bottom: y,
          top: y - fontSize,
          width: item.width,
          height: fontSize,
          fontSize: fontSize,
          fontFamily: fontFamily
        };
      });

      const validElements = textElements.filter(el => el.text.trim().length > 0);

      // Group elements into lines
      validElements.sort((a, b) => a.top - b.top);
      const lines = [];
      for (const el of validElements) {
        let placed = false;
        for (const line of lines) {
          const verticalOverlap = Math.abs(line.top - el.top) < Math.min(line.fontSize, el.fontSize) * 0.5;
          if (verticalOverlap) {
            line.elements.push(el);
            line.top = Math.min(line.top, el.top);
            line.bottom = Math.max(line.bottom, el.bottom);
            line.fontSize = Math.max(line.fontSize, el.fontSize);
            placed = true;
            break;
          }
        }
        if (!placed) {
          lines.push({
            top: el.top,
            bottom: el.bottom,
            fontSize: el.fontSize,
            elements: [el]
          });
        }
      }

      // Merge elements within each line
      const lineSegments = [];
      for (const line of lines) {
        line.elements.sort((a, b) => a.left - b.left);
        let currentSegment = null;
        for (const el of line.elements) {
          if (!currentSegment) {
            currentSegment = {
              text: el.text,
              left: el.left,
              top: line.top,
              height: line.bottom - line.top,
              fontSize: el.fontSize,
              fontFamily: el.fontFamily,
              width: el.width
            };
          } else {
            const currentRight = currentSegment.left + currentSegment.width;
            const gap = el.left - currentRight;
            const maxGap = Math.max(currentSegment.fontSize, el.fontSize) * 1.5;
            if (gap < maxGap) {
              const needsSpace = gap > 2 && 
                                 !currentSegment.text.endsWith(' ') && 
                                 !el.text.startsWith(' ');
              currentSegment.text += (needsSpace ? ' ' : '') + el.text;
              currentSegment.width = (el.left + el.width) - currentSegment.left;
              currentSegment.fontSize = Math.max(currentSegment.fontSize, el.fontSize);
            } else {
              lineSegments.push(currentSegment);
              currentSegment = {
                text: el.text,
                left: el.left,
                top: line.top,
                height: line.bottom - line.top,
                fontSize: el.fontSize,
                fontFamily: el.fontFamily,
                width: el.width
              };
            }
          }
        }
        if (currentSegment) {
          lineSegments.push(currentSegment);
        }
      }

      // Extract images and lines from operators
      const operatorList = await page.getOperatorList();
      const OPS = pdfjsLib.OPS || {};
      const transformStack = [];
      let currentTransform = [1, 0, 0, 1, 0, 0];
      const imagesToProcess = [];
      const linesToProcess = [];
      let currentPoint = [0, 0];

      for (let j = 0; j < operatorList.fnArray.length; j++) {
        const fn = operatorList.fnArray[j];
        const args = operatorList.argsArray[j];

        if (fn === OPS.save) {
          transformStack.push([...currentTransform]);
        } else if (fn === OPS.restore) {
          if (transformStack.length > 0) {
            currentTransform = transformStack.pop();
          }
        } else if (fn === OPS.transform) {
          currentTransform = multiplyMatrices(currentTransform, args);
        } else if (fn === OPS.moveTo) {
          currentPoint = [args[0], args[1]];
        } else if (fn === OPS.lineTo) {
          const x1 = currentPoint[0];
          const y1 = currentPoint[1];
          const x2 = args[0];
          const y2 = args[1];
          
          const x1_pdf = currentTransform[0] * x1 + currentTransform[2] * y1 + currentTransform[4];
          const y1_pdf = currentTransform[1] * x1 + currentTransform[3] * y1 + currentTransform[5];
          const x2_pdf = currentTransform[0] * x2 + currentTransform[2] * y2 + currentTransform[4];
          const y2_pdf = currentTransform[1] * x2 + currentTransform[3] * y2 + currentTransform[5];
          
          const dy = Math.abs(y1_pdf - y2_pdf);
          const dx = Math.abs(x1_pdf - x2_pdf);
          
          if (dy < 3.0 && dx > 4.0) {
            const [x1_vp, y1_vp] = convertToViewport(x1_pdf, y1_pdf, viewport);
            const [x2_vp, y2_vp] = convertToViewport(x2_pdf, y2_pdf, viewport);
            
            linesToProcess.push({
              left: Math.min(x1_vp, x2_vp),
              top: Math.min(y1_vp, y2_vp) - 0.75,
              width: Math.abs(x2_vp - x1_vp),
              height: 1.5
            });
          } else if (dx < 3.0 && dy > 4.0) {
            const [x1_vp, y1_vp] = convertToViewport(x1_pdf, y1_pdf, viewport);
            const [x2_vp, y2_vp] = convertToViewport(x2_pdf, y2_pdf, viewport);
            
            linesToProcess.push({
              left: Math.min(x1_vp, x2_vp) - 0.75,
              top: Math.min(y1_vp, y2_vp),
              width: 1.5,
              height: Math.abs(y2_vp - y1_vp)
            });
          }
          currentPoint = [x2, y2];
        } else if (fn === OPS.constructPath) {
          const pathOps = args[0];
          const pathArgs = args[1];
          let argIdx = 0;
          let currentPt = [0, 0];
          
          for (let op of pathOps) {
            if (op === OPS.moveTo) {
              currentPt = [pathArgs[argIdx], pathArgs[argIdx + 1]];
              argIdx += 2;
            } else if (op === OPS.lineTo) {
              const x1 = currentPt[0];
              const y1 = currentPt[1];
              const x2 = pathArgs[argIdx];
              const y2 = pathArgs[argIdx + 1];
              
              const x1_pdf = currentTransform[0] * x1 + currentTransform[2] * y1 + currentTransform[4];
              const y1_pdf = currentTransform[1] * x1 + currentTransform[3] * y1 + currentTransform[5];
              const x2_pdf = currentTransform[0] * x2 + currentTransform[2] * y2 + currentTransform[4];
              const y2_pdf = currentTransform[1] * x2 + currentTransform[3] * y2 + currentTransform[5];
              
              const dy = Math.abs(y1_pdf - y2_pdf);
              const dx = Math.abs(x1_pdf - x2_pdf);
              
              if (dy < 3.0 && dx > 4.0) {
                const [x1_vp, y1_vp] = convertToViewport(x1_pdf, y1_pdf, viewport);
                const [x2_vp, y2_vp] = convertToViewport(x2_pdf, y2_pdf, viewport);
                
                linesToProcess.push({
                  left: Math.min(x1_vp, x2_vp),
                  top: Math.min(y1_vp, y2_vp) - 0.75,
                  width: Math.abs(x2_vp - x1_vp),
                  height: 1.5
                });
              } else if (dx < 3.0 && dy > 4.0) {
                const [x1_vp, y1_vp] = convertToViewport(x1_pdf, y1_pdf, viewport);
                const [x2_vp, y2_vp] = convertToViewport(x2_pdf, y2_pdf, viewport);
                
                linesToProcess.push({
                  left: Math.min(x1_vp, x2_vp) - 0.75,
                  top: Math.min(y1_vp, y2_vp),
                  width: 1.5,
                  height: Math.abs(y2_vp - y1_vp)
                });
              }
              currentPt = [x2, y2];
              argIdx += 2;
            } else if (op === OPS.curveTo) {
              currentPt = [pathArgs[argIdx + 4], pathArgs[argIdx + 5]];
              argIdx += 6;
            } else if (op === OPS.curveTo2) {
              currentPt = [pathArgs[argIdx + 2], pathArgs[argIdx + 3]];
              argIdx += 4;
            } else if (op === OPS.curveTo3) {
              currentPt = [pathArgs[argIdx + 2], pathArgs[argIdx + 3]];
              argIdx += 4;
            } else if (op === OPS.closePath) {
              // Do nothing
            } else if (op === OPS.rectangle) {
              const rx = pathArgs[argIdx];
              const ry = pathArgs[argIdx + 1];
              const rw = pathArgs[argIdx + 2];
              const rh = pathArgs[argIdx + 3];
              
              // Transform rectangle corners to PDF space
              const x1_pdf = currentTransform[0] * rx + currentTransform[2] * ry + currentTransform[4];
              const y1_pdf = currentTransform[1] * rx + currentTransform[3] * ry + currentTransform[5];
              const x2_pdf = currentTransform[0] * (rx + rw) + currentTransform[2] * (ry + rh) + currentTransform[4];
              const y2_pdf = currentTransform[1] * (rx + rw) + currentTransform[3] * (ry + rh) + currentTransform[5];
              
              const [x1_vp, y1_vp] = convertToViewport(x1_pdf, y1_pdf, viewport);
              const [x2_vp, y2_vp] = convertToViewport(x2_pdf, y2_pdf, viewport);
              
              const left = Math.min(x1_vp, x2_vp);
              const top = Math.min(y1_vp, y2_vp);
              const width = Math.abs(x2_vp - x1_vp);
              const height = Math.abs(y2_vp - y1_vp);
              
              // Thin rectangles are lines
              if ((height < 4 && width > 4) || (width < 4 && height > 4)) {
                linesToProcess.push({ left, top, width: Math.max(width, 1.5), height: Math.max(height, 1.5) });
              }
              argIdx += 4;
            }
          }
        } else if (fn === OPS.paintImageXObject || fn === OPS.paintJpegXObject || fn === OPS.paintImageMaskXObject) {
          const imgName = args[0];
          
          const x_tl_pdf = currentTransform[2] * 1 + currentTransform[4];
          const y_tl_pdf = currentTransform[3] * 1 + currentTransform[5];
          const [x_tl_vp, y_tl_vp] = convertToViewport(x_tl_pdf, y_tl_pdf, viewport);

          const x_br_pdf = currentTransform[0] * 1 + currentTransform[4];
          const y_br_pdf = currentTransform[1] * 1 + currentTransform[5];
          const [x_br_vp, y_br_vp] = convertToViewport(x_br_pdf, y_br_pdf, viewport);

          const left = Math.min(x_tl_vp, x_br_vp);
          const top = Math.min(y_tl_vp, y_br_vp);
          const width = Math.abs(x_br_vp - x_tl_vp);
          const height = Math.abs(y_br_vp - y_tl_vp);

          if (width > 2 && height > 2) {
            const imgPromise = new Promise((resolve) => {
              let resolved = false;
              const safeResolve = (val) => {
                if (!resolved) {
                  resolved = true;
                  resolve(val);
                }
              };
              
              page.objs.get(imgName, (imageObj) => {
                if (imageObj) safeResolve(imageObj);
              });
              
              page.commonObjs.get(imgName, (commonObj) => {
                if (commonObj) safeResolve(commonObj);
              });
              
              setTimeout(() => {
                safeResolve(null);
              }, 600);
            });

            imagesToProcess.push({
              left,
              top,
              width,
              height,
              promise: imgPromise
            });
          }
        } else if (fn === OPS.paintInlineImageXObject) {
          const inlineImage = args[0];
          
          const x_tl_pdf = currentTransform[2] * 1 + currentTransform[4];
          const y_tl_pdf = currentTransform[3] * 1 + currentTransform[5];
          const [x_tl_vp, y_tl_vp] = convertToViewport(x_tl_pdf, y_tl_pdf, viewport);

          const x_br_pdf = currentTransform[0] * 1 + currentTransform[4];
          const y_br_pdf = currentTransform[1] * 1 + currentTransform[5];
          const [x_br_vp, y_br_vp] = convertToViewport(x_br_pdf, y_br_pdf, viewport);

          const left = Math.min(x_tl_vp, x_br_vp);
          const top = Math.min(y_tl_vp, y_br_vp);
          const width = Math.abs(x_br_vp - x_tl_vp);
          const height = Math.abs(y_br_vp - y_tl_vp);

          if (width > 2 && height > 2 && inlineImage) {
            imagesToProcess.push({
              left,
              top,
              width,
              height,
              promise: Promise.resolve(inlineImage)
            });
          }
        }
      }

      // Process all images to Base64
      const resolvedImages = [];
      for (const imgData of imagesToProcess) {
        try {
          const imageObj = await imgData.promise;
          if (imageObj) {
            const base64 = await getBase64Image(imageObj);
            if (base64) {
              resolvedImages.push({
                left: imgData.left,
                top: imgData.top,
                width: imgData.width,
                height: imgData.height,
                base64: base64
              });
            }
          }
        } catch (err) {
          console.warn("Failed to extract image:", err);
        }
      }

      pagesData.push({
        width: pageWidth,
        height: pageHeight,
        textSegments: lineSegments,
        images: resolvedImages,
        lines: linesToProcess
      });

      const pagePlainText = lineSegments.map(seg => seg.text).join(' ');
      pageTexts.push(pagePlainText);

      // Visual preview — show rendered PDF page as canvas
      const pageContainer = document.createElement('div');
      pageContainer.className = 'page-preview';
      
      const pageLabelDiv = document.createElement('div');
      pageLabelDiv.className = 'page-text-header';
      pageLabelDiv.textContent = `${t('pageLabel')} ${i}`;
      pageContainer.appendChild(pageLabelDiv);
      
      previewCanvas.className = 'preview-canvas';
      pageContainer.appendChild(previewCanvas);
      
      previewScroll.appendChild(pageContainer);
    }

    previewSection.style.display = 'block';
    convBtn.disabled = false;
    fileInput.value = '';
    if (typeof CuteLoading !== 'undefined') { CuteLoading.hide('progressCard'); } else { progressCard.style.display = 'none'; }
  } catch (e) {
    console.error(e);
    showAlert(t('error'), 'err');
    if (typeof CuteLoading !== 'undefined') { CuteLoading.hide('progressCard'); } else { progressCard.style.display = 'none'; }
  }
}

async function convertPDF() {
  if (!pdfData || !pageTexts.length) {
    showAlert(t('noFile'), 'err');
    return;
  }

  convBtn.disabled = true;
  setProgress(90, t('generatingDoc'));

  const gjm = (typeof window !== 'undefined' && window.parent && window.parent !== window && window.parent.GlobalJobManager)
    ? window.parent.GlobalJobManager
    : (window.GlobalJobManager || null);

  const format = document.getElementById('outputFormat').value;
  const baseName = pdfData.name.replace(/\.pdf$/i, '');

  if (gjm) {
    if (!gjm.hasProcessor('pdf-to-docs')) {
      gjm.registerProcessor('pdf-to-docs', async (job, signal, onProgress) => {
        if (job.inputData.format === 'docx') {
          onProgress(25);
          const blob = await buildDocxBlob();
          onProgress(100);
          return blob;
        } else {
          onProgress(50);
          const blob = buildTxtBlob();
          onProgress(100);
          return blob;
        }
      });
    }

    const outputName = `toolsuf-${baseName}-pdf-to-docs.${format}`;
    gjm.createJob({
      feature: 'pdf-to-docs',
      featureLabel: 'PDF ke Dokumen',
      inputName: pdfData.name,
      outputName,
      inputData: { format, baseName },
      onProgress: (job) => {
        setProgress(Math.round(job.progress), t('generatingDoc'));
      },
      onComplete: async (job) => {
        convBtn.disabled = false;
        if (typeof CuteLoading !== 'undefined') { CuteLoading.hide('progressCard'); } else { progressCard.style.display = 'none'; }
        const blob = await gjm.getResultBlob(job.id);
        if (blob) {
          if (format === 'docx') {
            if (typeof ToolSufDownload !== 'undefined') {
              await ToolSufDownload.downloadFile({
                blob,
                originalName: pdfData.name,
                featureName: 'pdf-to-docs',
                extension: 'docx',
                mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
              });
            } else {
              saveAs(blob, outputName);
            }
            showAlert(t('successDocx'), 'ok');
            if (typeof trackFeatureUsage === 'function') {
              trackFeatureUsage('pdf-to-docs', 'convert-docx', {
                fileName: pdfData?.name || 'document.pdf',
                format: 'docx',
                pageCount: pageTexts.length
              });
            }
          } else {
            if (typeof ToolSufDownload !== 'undefined') {
              await ToolSufDownload.downloadFile({
                blob,
                originalName: pdfData.name,
                featureName: 'pdf-to-docs',
                extension: 'txt',
                mimeType: 'text/plain;charset=utf-8'
              });
            } else {
              saveAs(blob, outputName);
            }
            showAlert(t('successTxt'), 'ok');
            if (typeof trackFeatureUsage === 'function') {
              trackFeatureUsage('pdf-to-docs', 'convert-txt', {
                fileName: pdfData?.name || 'document.pdf',
                format: 'txt',
                pageCount: pageTexts.length
              });
            }
          }
        }
      },
      onFail: (job) => {
        convBtn.disabled = false;
        if (typeof CuteLoading !== 'undefined') { CuteLoading.hide('progressCard'); } else { progressCard.style.display = 'none'; }
        showAlert(job.error || t('error'), 'err');
      }
    });
    return;
  }

  try {
    if (format === 'docx') {
      await generateDOCX();
    } else {
      generateTXT();
    }
  } catch (e) {
    console.error(e);
    showAlert(t('error'), 'err');
    convBtn.disabled = false;
    if (typeof CuteLoading !== 'undefined') { CuteLoading.hide('progressCard'); } else { progressCard.style.display = 'none'; }
  }
}

async function buildDocxBlob() {
  const { 
    Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, 
    WidthType, BorderStyle, TableAnchorType, ImageRun, HeightRule 
  } = window.docx;
  const baseName = pdfData.name.replace(/\.pdf$/i, '');
  const sections = [];

  for (let i = 0; i < pagesData.length; i++) {
    const page = pagesData[i];
    const sectionChildren = [];
    const anchorParagraph = new Paragraph({ children: [], spacing: { before: 0, after: 0 } });
    sectionChildren.push(anchorParagraph);

    for (const seg of page.textSegments) {
      const leftInTwips = Math.round(seg.left * 20);
      const topInTwips = Math.round(seg.top * 20);
      const widthInTwips = Math.round((seg.width + Math.max(10, seg.width * 0.1)) * 20);
      const fontNameMapped = getStandardFont(seg.fontFamily);

      const textTable = new Table({
        float: {
          horizontalAnchor: TableAnchorType ? TableAnchorType.PAGE : "page",
          verticalAnchor: TableAnchorType ? TableAnchorType.PAGE : "page",
          absoluteHorizontalPosition: leftInTwips,
          absoluteVerticalPosition: topInTwips,
        },
        width: { size: widthInTwips, type: "dxa" },
        borders: {
          top: { style: "none", size: 0, color: "auto" },
          bottom: { style: "none", size: 0, color: "auto" },
          left: { style: "none", size: 0, color: "auto" },
          right: { style: "none", size: 0, color: "auto" },
        },
        rows: [
          new TableRow({
            children: [
              new TableCell({
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: seg.text,
                        size: Math.max(12, Math.round(seg.fontSize * 2)),
                        font: fontNameMapped,
                        color: "000000"
                      })
                    ],
                    spacing: { before: 0, after: 0 }
                  })
                ],
                borders: {
                  top: { style: "none", size: 0, color: "auto" },
                  bottom: { style: "none", size: 0, color: "auto" },
                  left: { style: "none", size: 0, color: "auto" },
                  right: { style: "none", size: 0, color: "auto" },
                },
                margins: { top: 0, bottom: 0, left: 0, right: 0 }
              })
            ]
          })
        ]
      });
      sectionChildren.push(textTable);
    }

    for (const img of page.images) {
      if (!img.base64) continue;
      const leftInTwips = Math.round(img.left * 20);
      const topInTwips = Math.round(img.top * 20);
      const widthInTwips = Math.round(img.width * 20);

      const base64Data = img.base64.replace(/^data:image\/\w+;base64,/, "");
      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let k = 0; k < binaryString.length; k++) {
        bytes[k] = binaryString.charCodeAt(k);
      }

      let imgType = "png";
      if (img.base64.includes("image/jpeg") || img.base64.includes("image/jpg")) {
        imgType = "jpg";
      }

      const imgTable = new Table({
        float: {
          horizontalAnchor: TableAnchorType ? TableAnchorType.PAGE : "page",
          verticalAnchor: TableAnchorType ? TableAnchorType.PAGE : "page",
          absoluteHorizontalPosition: leftInTwips,
          absoluteVerticalPosition: topInTwips,
        },
        width: { size: widthInTwips, type: "dxa" },
        borders: {
          top: { style: "none", size: 0, color: "auto" },
          bottom: { style: "none", size: 0, color: "auto" },
          left: { style: "none", size: 0, color: "auto" },
          right: { style: "none", size: 0, color: "auto" },
        },
        rows: [
          new TableRow({
            children: [
              new TableCell({
                children: [
                  new Paragraph({
                    children: [
                      new ImageRun({
                        data: bytes,
                        transformation: {
                          width: Math.round(img.width * 96 / 72),
                          height: Math.round(img.height * 96 / 72)
                        },
                        type: imgType
                      })
                    ],
                    spacing: { before: 0, after: 0 }
                  })
                ],
                borders: {
                  top: { style: "none", size: 0, color: "auto" },
                  bottom: { style: "none", size: 0, color: "auto" },
                  left: { style: "none", size: 0, color: "auto" },
                  right: { style: "none", size: 0, color: "auto" },
                },
                margins: { top: 0, bottom: 0, left: 0, right: 0 }
              })
            ]
          })
        ]
      });
      sectionChildren.push(imgTable);
    }

    sections.push({
      properties: {
        page: {
          size: { width: Math.round(page.width * 20), height: Math.round(page.height * 20) },
          margin: { top: 0, right: 0, bottom: 0, left: 0 }
        }
      },
      children: sectionChildren
    });
  }

  const doc = new Document({
    title: baseName,
    description: 'Converted from ' + pdfData.name,
    sections: sections
  });

  return await Packer.toBlob(doc);
}

function buildTxtBlob() {
  let content = '';
  for (let i = 0; i < pageTexts.length; i++) {
    content += `=== ${t('pageLabel')} ${i + 1} ===\n\n`;
    content += pageTexts[i] + '\n\n';
  }
  return new Blob([content], { type: 'text/plain;charset=utf-8' });
}

async function generateDOCX() {
  const { 
    Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, 
    WidthType, BorderStyle, TableAnchorType, ImageRun, HeightRule 
  } = window.docx;
  const baseName = pdfData.name.replace(/\.pdf$/i, '');

  const sections = [];

  for (let i = 0; i < pagesData.length; i++) {
    const page = pagesData[i];
    const sectionChildren = [];

    // Base flow anchor paragraph (required for each section)
    const anchorParagraph = new Paragraph({
      children: [],
      spacing: { before: 0, after: 0 }
    });
    sectionChildren.push(anchorParagraph);

    // Add all text segments
    for (const seg of page.textSegments) {
      const leftInTwips = Math.round(seg.left * 20);
      const topInTwips = Math.round(seg.top * 20);
      const widthInTwips = Math.round((seg.width + Math.max(10, seg.width * 0.1)) * 20);
      const fontNameMapped = getStandardFont(seg.fontFamily);

      const textTable = new Table({
        float: {
          horizontalAnchor: TableAnchorType ? TableAnchorType.PAGE : "page",
          verticalAnchor: TableAnchorType ? TableAnchorType.PAGE : "page",
          absoluteHorizontalPosition: leftInTwips,
          absoluteVerticalPosition: topInTwips,
        },
        width: {
          size: widthInTwips,
          type: "dxa"
        },
        borders: {
          top: { style: "none", size: 0, color: "auto" },
          bottom: { style: "none", size: 0, color: "auto" },
          left: { style: "none", size: 0, color: "auto" },
          right: { style: "none", size: 0, color: "auto" },
        },
        rows: [
          new TableRow({
            children: [
              new TableCell({
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: seg.text,
                        size: Math.round(seg.fontSize * 2),
                        font: fontNameMapped,
                        color: "000000"
                      })
                    ],
                    spacing: { before: 0, after: 0, line: 240 }
                  })
                ],
                borders: {
                  top: { style: "none", size: 0, color: "auto" },
                  bottom: { style: "none", size: 0, color: "auto" },
                  left: { style: "none", size: 0, color: "auto" },
                  right: { style: "none", size: 0, color: "auto" },
                },
                margins: {
                  top: 0,
                  bottom: 0,
                  left: 0,
                  right: 0
                },
                width: {
                  size: widthInTwips,
                  type: "dxa"
                }
              })
            ]
          })
        ]
      });

      sectionChildren.push(textTable);
    }

    // Add all images
    for (const img of page.images) {
      const leftInTwips = Math.round(img.left * 20);
      const topInTwips = Math.round(img.top * 20);
      const widthInTwips = Math.round(img.width * 20);

      const base64Str = img.base64.replace(/^data:image\/\w+;base64,/, "");
      const binaryString = atob(base64Str);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let k = 0; k < len; k++) {
        bytes[k] = binaryString.charCodeAt(k);
      }

      let imgType = "png";
      if (img.base64.includes("image/jpeg") || img.base64.includes("image/jpg")) {
        imgType = "jpg";
      }

      const imgTable = new Table({
        float: {
          horizontalAnchor: TableAnchorType ? TableAnchorType.PAGE : "page",
          verticalAnchor: TableAnchorType ? TableAnchorType.PAGE : "page",
          absoluteHorizontalPosition: leftInTwips,
          absoluteVerticalPosition: topInTwips,
        },
        width: {
          size: widthInTwips,
          type: "dxa"
        },
        borders: {
          top: { style: "none", size: 0, color: "auto" },
          bottom: { style: "none", size: 0, color: "auto" },
          left: { style: "none", size: 0, color: "auto" },
          right: { style: "none", size: 0, color: "auto" },
        },
        rows: [
          new TableRow({
            children: [
              new TableCell({
                children: [
                  new Paragraph({
                    children: [
                      new ImageRun({
                        data: bytes,
                        transformation: {
                          width: Math.round(img.width * 96 / 72),
                          height: Math.round(img.height * 96 / 72)
                        },
                        type: imgType
                      })
                    ],
                    spacing: { before: 0, after: 0 }
                  })
                ],
                borders: {
                  top: { style: "none", size: 0, color: "auto" },
                  bottom: { style: "none", size: 0, color: "auto" },
                  left: { style: "none", size: 0, color: "auto" },
                  right: { style: "none", size: 0, color: "auto" },
                },
                margins: {
                  top: 0,
                  bottom: 0,
                  left: 0,
                  right: 0
                },
                width: {
                  size: widthInTwips,
                  type: "dxa"
                }
              })
            ]
          })
        ]
      });

      sectionChildren.push(imgTable);
    }

    // Add all horizontal lines
    if (page.lines) {
      for (const line of page.lines) {
        const leftInTwips = Math.round(line.left * 20);
        const topInTwips = Math.round(line.top * 20);
        const widthInTwips = Math.round(line.width * 20);
        const heightInTwips = Math.round(line.height * 20);

        const lineTable = new Table({
          float: {
            horizontalAnchor: TableAnchorType ? TableAnchorType.PAGE : "page",
            verticalAnchor: TableAnchorType ? TableAnchorType.PAGE : "page",
            absoluteHorizontalPosition: leftInTwips,
            absoluteVerticalPosition: topInTwips,
          },
          width: {
            size: widthInTwips,
            type: "dxa"
          },
          borders: {
            top: { style: "none", size: 0, color: "auto" },
            bottom: { style: "none", size: 0, color: "auto" },
            left: { style: "none", size: 0, color: "auto" },
            right: { style: "none", size: 0, color: "auto" },
          },
          rows: [
            new TableRow({
              height: {
                value: Math.max(heightInTwips, 20),
                rule: HeightRule ? HeightRule.EXACT : "exact"
              },
              children: [
                new TableCell({
                  children: [
                    new Paragraph({
                      children: [],
                      spacing: { before: 0, after: 0 }
                    })
                  ],
                  shading: {
                    fill: "000000"
                  },
                  borders: {
                    top: { style: "none", size: 0, color: "auto" },
                    bottom: { style: "none", size: 0, color: "auto" },
                    left: { style: "none", size: 0, color: "auto" },
                    right: { style: "none", size: 0, color: "auto" },
                  },
                  margins: {
                    top: 0,
                    bottom: 0,
                    left: 0,
                    right: 0
                  },
                  width: {
                    size: widthInTwips,
                    type: "dxa"
                  }
                })
              ]
            })
          ]
        });

        sectionChildren.push(lineTable);
      }
    }

    sections.push({
      properties: {
        page: {
          size: {
            width: Math.round(page.width * 20),
            height: Math.round(page.height * 20)
          },
          margin: {
            top: 0,
            bottom: 0,
            left: 0,
            right: 0
          }
        }
      },
      children: sectionChildren
    });
  }

  const doc = new Document({
    title: baseName,
    description: 'Converted from ' + pdfData.name,
    sections: sections
  });

  const blob = await Packer.toBlob(doc);
  if (typeof ToolSufDownload !== 'undefined') {
    await ToolSufDownload.downloadFile({
      blob,
      originalName: pdfData.name,
      featureName: 'pdf-to-docs',
      extension: 'docx',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    });
  } else {
    saveAs(blob, `toolsuf-${baseName}-pdf-to-docs.docx`);
  }
  showAlert(t('successDocx'), 'ok');
  if (typeof trackFeatureUsage === 'function') {
    trackFeatureUsage('pdf-to-docs', 'convert-docx', {
      fileName: pdfData?.name || 'document.pdf',
      format: 'docx',
      pageCount: pageTexts.length
    });
  }
  convBtn.disabled = false;
  if (typeof CuteLoading !== 'undefined') { CuteLoading.hide('progressCard'); } else { progressCard.style.display = 'none'; }
}

async function generateTXT() {
  const baseName = pdfData.name.replace(/\.pdf$/i, '');
  let content = '';

  for (let i = 0; i < pageTexts.length; i++) {
    content += `=== ${t('pageLabel')} ${i + 1} ===\n\n`;
    content += pageTexts[i] + '\n\n';
  }

  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  if (typeof ToolSufDownload !== 'undefined') {
    await ToolSufDownload.downloadFile({
      blob,
      originalName: pdfData.name,
      featureName: 'pdf-to-docs',
      extension: 'txt',
      mimeType: 'text/plain;charset=utf-8'
    });
  } else {
    saveAs(blob, `toolsuf-${baseName}-pdf-to-docs.txt`);
  }
  showAlert(t('successTxt'), 'ok');
  if (typeof trackFeatureUsage === 'function') {
    trackFeatureUsage('pdf-to-docs', 'convert-txt', {
      fileName: pdfData?.name || 'document.pdf',
      format: 'txt',
      pageCount: pageTexts.length
    });
  }
  convBtn.disabled = false;
  if (typeof CuteLoading !== 'undefined') { CuteLoading.hide('progressCard'); } else { progressCard.style.display = 'none'; }
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
  if (typeof CuteLoading !== 'undefined') { CuteLoading.hide('progressCard'); } else { progressCard.style.display = 'none'; }
  alertBox.style.display = 'none';
}

function showAlert(msg, type) {
  alertBox.textContent = msg;
  alertBox.className = 'alert ' + type;
  alertBox.style.display = 'block';
}

function setProgress(pct, text) {
  if (typeof CuteLoading !== 'undefined') {
    CuteLoading.show('progressCard', 'Sabar yahh..');
  } else {
    progressCard.style.display = 'block';
  }
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
