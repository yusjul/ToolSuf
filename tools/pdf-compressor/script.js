/**
 * PDF Compressor - Main script & controller
 */

import { CompressorState } from './modules/state.js?v=2.1';
import { CompressorUI } from './modules/ui.js?v=2.1';
import { inspectPdf, compressPdf } from './modules/processor.js?v=2.1';
import { translations } from './modules/i18n.js?v=2.1';
import { isValidPdfFile } from './modules/utils.js?v=2.1';

// 1. Sync theme from parent document immediately
try {
  const p = window.parent.document.documentElement;
  if (p.classList.contains('dark')) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.add('light');
  }
} catch (e) {
  document.documentElement.classList.add('light');
}

// 2. Read initial language parameter
const urlParams = new URLSearchParams(window.location.search);
const initialLang = urlParams.get('lang') === 'en' ? 'en' : 'id';

// Guard: Stop initialization if feature or global maintenance is active (Req 14)
if (window.__TOOLSUF_MAINTENANCE__ || (typeof ToolSufMaintenance !== 'undefined' && ToolSufMaintenance.isMaintenanceActive('pdf-compressor'))) {
  console.info('[PDF Compressor] Feature is under maintenance. Initialization stopped.');
} else {
  // 3. Initialize state store
  const state = new CompressorState();

  // 4. Initialize UI controller
  const ui = new CompressorUI(
    state,
    translations,
    handleFileSelect,
    handleCompress,
    handleCancel,
    handleReset
  );

  ui.setLanguage(initialLang);
}

/**
 * Handle incoming file from drag & drop or file picker
 * @param {File} file 
 */
async function handleFileSelect(file) {
  if (!isValidPdfFile(file)) {
    ui.showToast(ui.t('toastInvalidPdf'));
    return;
  }

  // File size limit safety check (e.g. 150MB)
  const MAX_FILE_SIZE = 150 * 1024 * 1024;
  if (file.size > MAX_FILE_SIZE) {
    ui.showToast(initialLang === 'en' ? 'File too large (max 150MB).' : 'File terlalu besar (maks 150MB).');
    return;
  }

  try {
    // Quick inspection of PDF to read total pages
    let pageCount = 0;
    try {
      const meta = await inspectPdf(file);
      pageCount = meta.pageCount || 0;
    } catch (err) {
      console.warn('Could not inspect PDF structure directly:', err);
    }

    state.setFile(file, null, pageCount);
    ui.renderFileInfo();
  } catch (err) {
    console.error('Error reading PDF file:', err);
    ui.showToast(err.message || ui.t('toastProcessingError'));
  }
}

const FEATURE_NAME = 'pdf-compressor';
const FEATURE_LABEL = 'Kompresor PDF';

async function pdfCompressorProcessor(job, signal, onProgress) {
  const file = job.inputData.file;
  const level = job.inputData.level;

  const result = await compressPdf({
    file,
    level,
    onProgress: (percent) => {
      onProgress(percent);
    },
    isCancelled: () => signal && signal.aborted
  });

  return result.blob;
}

/**
 * Handle compress action trigger
 */
async function handleCompress() {
  if (!state.file) {
    ui.showToast(ui.t('toastNoFile'));
    return;
  }

  state.setProcessing(true);
  ui.renderProcessing(5, 'statusPreparing');

  const gjm = (typeof window !== 'undefined' && window.parent && window.parent !== window && window.parent.GlobalJobManager)
    ? window.parent.GlobalJobManager
    : (window.GlobalJobManager || null);

  if (gjm) {
    if (!gjm.hasProcessor(FEATURE_NAME)) {
      gjm.registerProcessor(FEATURE_NAME, pdfCompressorProcessor);
    }
    const outputName = `toolsuf-${state.file.name.replace(/\.[^.]+$/, '')}-pdf-compressor.pdf`;
    const jobId = gjm.createJob({
      feature: FEATURE_NAME,
      featureLabel: FEATURE_LABEL,
      inputName: state.file.name,
      outputName,
      inputData: { file: state.file, level: state.compressionLevel },
      onComplete: async (job) => {
        const blob = await gjm.getResultBlob(job.id);
        const result = {
          blob,
          originalSize: state.file.size,
          compressedSize: blob ? blob.size : state.file.size,
          pageCount: state.pageCount,
          timeTaken: Math.max(0.5, ((job.completedAt - job.startedAt) / 1000).toFixed(1))
        };
        state.setResult(result);
        ui.renderResult();
        ui.showToast(ui.t('toastSuccess'));

        // Trigger Real-Time Feature Usage Tracking (Section 2, 4)
        if (typeof trackFeatureUsage === 'function') {
          const origKb = Math.round((result.originalSize || 0) / 1024);
          const compKb = Math.round((result.compressedSize || 0) / 1024);
          const savePct = origKb > 0 ? Math.round((1 - compKb / origKb) * 100) : 0;
          trackFeatureUsage('pdf-compressor', 'compress', {
            fileName: state.file ? state.file.name : 'document.pdf',
            originalSize: `${origKb} KB`,
            compressedSize: `${compKb} KB`,
            reduction: `${savePct}%`
          });
        }
      },
      onFail: (job) => {
        state.setProcessing(false);
        if (job.status === 'cancelled') {
          ui.showToast(ui.t('toastCancelled'));
        } else {
          ui.showToast(job.error || ui.t('toastProcessingError'));
        }
        ui.renderFileInfo();
      }
    });

    state.activeJobId = jobId;
    return;
  }

  try {
    const result = await compressPdf({
      file: state.file,
      level: state.compressionLevel,
      onProgress: (percent, statusKey, params) => {
        if (!state.isCancelled) {
          state.setProgress(percent, statusKey);
          ui.renderProcessing(percent, statusKey, params);
        }
      },
      isCancelled: () => state.isCancelled
    });

    state.setResult(result);
    ui.renderResult();
    ui.showToast(ui.t('toastSuccess'));

    // Trigger Real-Time Feature Usage Tracking (Section 2, 4)
    if (typeof trackFeatureUsage === 'function') {
      const origKb = Math.round((result.originalSize || 0) / 1024);
      const compKb = Math.round((result.compressedSize || 0) / 1024);
      const savePct = origKb > 0 ? Math.round((1 - compKb / origKb) * 100) : 0;
      trackFeatureUsage('pdf-compressor', 'compress', {
        fileName: state.file ? state.file.name : 'document.pdf',
        originalSize: `${origKb} KB`,
        compressedSize: `${compKb} KB`,
        reduction: `${savePct}%`
      });
    }
  } catch (err) {
    state.setProcessing(false);
    if (err.message === 'CANCELLED') {
      ui.showToast(ui.t('toastCancelled'));
      ui.renderFileInfo();
    } else {
      console.error('Compression failed:', err);
      ui.showToast(err.message || ui.t('toastProcessingError'));
      ui.renderFileInfo();
    }
  }
}

/**
 * Handle cancellation of in-progress compression
 */
function handleCancel() {
  state.cancel();
  const gjm = (typeof window !== 'undefined' && window.parent && window.parent !== window && window.parent.GlobalJobManager)
    ? window.parent.GlobalJobManager
    : (window.GlobalJobManager || null);
  if (gjm && state.activeJobId) {
    gjm.cancelJob(state.activeJobId);
  }
}

/**
 * Handle reset/clear all
 */
function handleReset() {
  state.reset();
  ui.resetAll();
  ui.showToast(ui.t('toastCleared'));
}

// 5. Expose global sync functions for dashboard parent iframe communication
window.syncTheme = function(isDark) {
  if (isDark) {
    document.documentElement.classList.add('dark');
    document.documentElement.classList.remove('light');
  } else {
    document.documentElement.classList.remove('dark');
    document.documentElement.classList.add('light');
  }
};

window.syncLang = function(lang) {
  ui.setLanguage(lang);
};

// Listen for message events from dashboard parent
window.addEventListener('message', (e) => {
  if (!e.data) return;
  if (e.data.type === 'syncTheme') {
    window.syncTheme(e.data.theme === 'dark');
  } else if (e.data.type === 'syncLang') {
    window.syncLang(e.data.lang);
  }
});
