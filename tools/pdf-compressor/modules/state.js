/**
 * State store for PDF Compressor
 */

export class CompressorState {
  constructor() {
    this.reset();
  }

  reset() {
    // Revoke any previous created object URLs to release browser memory
    this.cleanupBlobUrls();

    this.file = null;
    this.originalBuffer = null;
    this.originalSize = 0;
    this.pageCount = 0;
    this.compressionLevel = 'medium'; // 'low' | 'medium' | 'high'
    
    this.isProcessing = false;
    this.isCancelled = false;
    this.progressPercent = 0;
    this.currentStatusText = '';

    this.result = null; // { blob, blobUrl, size, originalSize, reductionPercent, isBetter, filename }
  }

  cleanupBlobUrls() {
    if (this.result && this.result.blobUrl) {
      try {
        URL.revokeObjectURL(this.result.blobUrl);
      } catch (e) {}
    }
  }

  setFile(file, buffer, pageCount) {
    this.cleanupBlobUrls();
    this.file = file;
    this.originalBuffer = buffer;
    this.originalSize = file.size;
    this.pageCount = pageCount;
    this.result = null;
    this.isProcessing = false;
    this.isCancelled = false;
    this.progressPercent = 0;
  }

  setLevel(level) {
    if (['low', 'medium', 'high'].includes(level)) {
      this.compressionLevel = level;
    }
  }

  setProcessing(isProcessing) {
    this.isProcessing = isProcessing;
    if (isProcessing) {
      this.isCancelled = false;
      this.cleanupBlobUrls();
      this.result = null;
    }
  }

  setProgress(percent, statusText) {
    this.progressPercent = Math.min(100, Math.max(0, percent));
    if (statusText) {
      this.currentStatusText = statusText;
    }
  }

  setResult(result) {
    this.cleanupBlobUrls();
    this.result = result;
    this.isProcessing = false;
  }

  cancel() {
    this.isCancelled = true;
    this.isProcessing = false;
  }
}
