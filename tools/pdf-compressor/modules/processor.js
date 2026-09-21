/**
 * Genuine client-side PDF compression engine using pdf.js and pdf-lib
 */

import { calculateReduction, sanitizeCompressedFilename } from './utils.js';

// Compression level configurations
export const COMPRESSION_PROFILES = {
  low: {
    scale: 1.5,        // Higher resolution (~150 DPI)
    jpegQuality: 0.80,  // High visual fidelity
    name: 'Low'
  },
  medium: {
    scale: 1.1,        // Balanced resolution (~110 DPI)
    jpegQuality: 0.65,  // Balanced visual quality & compression
    name: 'Medium'
  },
  high: {
    scale: 0.85,       // Compact resolution (~80-85 DPI)
    jpegQuality: 0.45,  // Aggressive compression for smallest size
    name: 'High'
  }
};

/**
 * Ensures PDF libraries are loaded and initialized
 */
export function ensurePdfLibraries() {
  const pdfjs = window.pdfjsLib || (typeof pdfjsLib !== 'undefined' ? pdfjsLib : null);
  const pdflib = window.PDFLib || (typeof PDFLib !== 'undefined' ? PDFLib : null);

  if (!pdfjs) {
    throw new Error('Library PDF.js belum dimuat. Periksa koneksi internet.');
  }
  if (!pdflib) {
    throw new Error('Library PDF-lib belum dimuat. Periksa koneksi internet.');
  }
  if (!pdfjs.GlobalWorkerOptions.workerSrc) {
    pdfjs.GlobalWorkerOptions.workerSrc = 
      'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  }
  return { pdfjs, pdflib };
}

/**
 * Inspects a PDF file and extracts basic metadata (page count)
 * @param {File|Blob|ArrayBuffer} fileOrBuffer 
 * @returns {Promise<{ pageCount: number }>}
 */
export async function inspectPdf(fileOrBuffer) {
  const { pdfjs } = ensurePdfLibraries();
  
  // Always get a fresh ArrayBuffer copy to avoid detachment
  let buffer;
  if (fileOrBuffer instanceof File || fileOrBuffer instanceof Blob) {
    buffer = await fileOrBuffer.arrayBuffer();
  } else if (fileOrBuffer && fileOrBuffer.slice) {
    buffer = fileOrBuffer.slice(0);
  } else {
    buffer = fileOrBuffer;
  }

  const loadingTask = pdfjs.getDocument({
    data: new Uint8Array(buffer),
    cMapUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/cmaps/',
    cMapPacked: true
  });
  
  const pdfDoc = await loadingTask.promise;
  const pageCount = pdfDoc.numPages;
  
  try {
    pdfDoc.cleanup();
    pdfDoc.destroy();
  } catch (e) {}
  
  return { pageCount };
}

/**
 * Compresses a PDF file according to the selected profile
 * @param {Object} options
 * @param {File} options.file
 * @param {string} options.level - 'low' | 'medium' | 'high'
 * @param {Function} options.onProgress - (percent: number, statusKey: string, params?: object) => void
 * @param {Function} options.isCancelled - () => boolean
 * @returns {Promise<Object>}
 */
export async function compressPdf({ file, level = 'medium', onProgress, isCancelled }) {
  const { pdfjs, pdflib } = ensurePdfLibraries();

  const profile = COMPRESSION_PROFILES[level] || COMPRESSION_PROFILES.medium;
  const originalSize = file.size;
  const filename = file.name;

  if (onProgress) onProgress(5, 'statusPreparing');

  if (isCancelled && isCancelled()) throw new Error('CANCELLED');

  // 1. Fresh buffer from file so it is never detached
  if (onProgress) onProgress(10, 'statusReading');
  const freshBuffer = await file.arrayBuffer();

  const loadingTask = pdfjs.getDocument({
    data: new Uint8Array(freshBuffer),
    cMapUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/cmaps/',
    cMapPacked: true
  });
  const srcPdf = await loadingTask.promise;
  const totalPages = srcPdf.numPages;

  if (isCancelled && isCancelled()) {
    try { srcPdf.cleanup(); srcPdf.destroy(); } catch (e) {}
    throw new Error('CANCELLED');
  }

  // 2. Create target PDF with PDF-lib
  const targetPdf = await pdflib.PDFDocument.create();

  // Create an off-DOM reusable canvas
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { alpha: false, willReadFrequently: true });

  // 3. Process each page sequentially
  for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
    if (isCancelled && isCancelled()) {
      try { srcPdf.cleanup(); srcPdf.destroy(); } catch (e) {}
      throw new Error('CANCELLED');
    }

    const currentPercent = Math.round(15 + ((pageNum - 0.5) / totalPages) * 65);
    if (onProgress) {
      onProgress(currentPercent, 'statusProcessingPage', { current: pageNum, total: totalPages });
    }

    const page = await srcPdf.getPage(pageNum);
    const baseViewport = page.getViewport({ scale: 1.0 });
    const renderViewport = page.getViewport({ scale: profile.scale });

    canvas.width = Math.max(1, Math.floor(renderViewport.width));
    canvas.height = Math.max(1, Math.floor(renderViewport.height));

    // Clear background to pure white
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Render page graphics to canvas
    const renderContext = {
      canvasContext: ctx,
      viewport: renderViewport
    };
    await page.render(renderContext).promise;

    // Convert rasterized page to JPEG with specified profile compression
    const jpegDataUrl = canvas.toDataURL('image/jpeg', profile.jpegQuality);

    // Embed optimized JPEG into target PDF
    const embeddedImage = await targetPdf.embedJpg(jpegDataUrl);

    // Add page and explicitly set its width & height (avoids PDFLib addPage array issue)
    const newPage = targetPdf.addPage();
    newPage.setSize(baseViewport.width, baseViewport.height);
    newPage.drawImage(embeddedImage, {
      x: 0,
      y: 0,
      width: baseViewport.width,
      height: baseViewport.height
    });

    // Cleanup individual page resources
    page.cleanup();
  }

  // Free source PDF
  try {
    srcPdf.cleanup();
    srcPdf.destroy();
  } catch (e) {}

  if (isCancelled && isCancelled()) throw new Error('CANCELLED');

  // 4. Save and optimize object streams with PDF-lib
  if (onProgress) onProgress(85, 'statusOptimizing');

  // Clean metadata / unnecessary object references
  targetPdf.setTitle(filename.replace(/\.pdf$/i, ''));
  targetPdf.setCreator('ToolSuf PDF Compressor');
  targetPdf.setProducer('ToolSuf');

  const compressedUint8Array = await targetPdf.save({
    useObjectStreams: true,
    addDefaultPage: false
  });

  if (onProgress) onProgress(98, 'statusFinalizing');

  const compressedSize = compressedUint8Array.byteLength;
  const isBetter = compressedSize < originalSize;
  const reductionPercent = calculateReduction(originalSize, compressedSize);

  const compressedBlob = new Blob([compressedUint8Array], { type: 'application/pdf' });
  const compressedBlobUrl = URL.createObjectURL(compressedBlob);
  const outFilename = sanitizeCompressedFilename(filename);

  if (onProgress) onProgress(100, 'completeHeading');

  return {
    blob: compressedBlob,
    blobUrl: compressedBlobUrl,
    size: compressedSize,
    originalSize: originalSize,
    reductionPercent: reductionPercent,
    isBetter: isBetter,
    filename: outFilename,
    originalFilename: filename,
    originalBlob: file
  };
}
