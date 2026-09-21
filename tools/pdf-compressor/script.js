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
