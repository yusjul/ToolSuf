/**
 * Utility functions for PDF Compressor
 */

/**
 * Format bytes to human readable format (B, KB, MB, GB)
 * @param {number} bytes 
 * @param {number} decimals 
 * @returns {string}
 */
export function formatBytes(bytes, decimals = 1) {
  if (bytes === 0 || !bytes || isNaN(bytes)) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Calculate reduction percentage between original and compressed sizes
 * @param {number} originalBytes 
 * @param {number} compressedBytes 
 * @returns {number} percentage reduced (positive number), or 0
 */
export function calculateReduction(originalBytes, compressedBytes) {
  if (!originalBytes || originalBytes <= 0) return 0;
  if (!compressedBytes || compressedBytes >= originalBytes) return 0;
  const diff = originalBytes - compressedBytes;
  return parseFloat(((diff / originalBytes) * 100).toFixed(1));
}

/**
 * Sanitize filename and append -compressed suffix before .pdf
 * @param {string} originalName 
 * @returns {string}
 */
export function sanitizeCompressedFilename(originalName) {
  let baseName = (originalName || 'document.pdf').trim();
  // Strip case-insensitive .pdf from the end
  baseName = baseName.replace(/\.pdf$/i, '');
  // Replace illegal filename characters
  baseName = baseName.replace(/[/\\?%*:|"<>]/g, '_');
  // Avoid duplicate '-compressed' suffix if already present
  if (baseName.toLowerCase().endsWith('-compressed')) {
    return `${baseName}.pdf`;
  }
  return `${baseName}-compressed.pdf`;
}

/**
 * Validate if a given file is a PDF
 * @param {File} file 
 * @returns {boolean}
 */
export function isValidPdfFile(file) {
  if (!file) return false;
  const isPdfMime = file.type === 'application/pdf' || file.type === 'application/x-pdf';
  const isPdfExt = file.name && file.name.toLowerCase().endsWith('.pdf');
  return isPdfMime || isPdfExt;
}
