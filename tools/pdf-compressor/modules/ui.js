/**
 * UI controller for PDF Compressor
 */

import { formatBytes } from './utils.js';

export class CompressorUI {
  constructor(state, translations, onFileSelect, onCompress, onCancel, onReset) {
    this.state = state;
    this.translations = translations;
    this.currentLang = 'id';
    this.onFileSelect = onFileSelect;
    this.onCompress = onCompress;
    this.onCancel = onCancel;
    this.onReset = onReset;

    this.cacheDom();
    this.bindEvents();
  }

  cacheDom() {
    this.dom = {
      app: document.getElementById('app'),
      dropZone: document.getElementById('dropZone'),
      fileInput: document.getElementById('fileInput'),
      uploadSection: document.getElementById('uploadSection'),
      fileInfoSection: document.getElementById('fileInfoSection'),
      fileName: document.getElementById('fileName'),
      fileSize: document.getElementById('fileSize'),
      pageCount: document.getElementById('pageCount'),
      removeBtn: document.getElementById('removeBtn'),
      optionsSection: document.getElementById('optionsSection'),
      levelCards: document.querySelectorAll('.level-card'),
      compressBtn: document.getElementById('compressBtn'),
      progressSection: document.getElementById('progressSection'),
      progressText: document.getElementById('progressText'),
      progressBar: document.getElementById('progressBar'),
      cancelBtn: document.getElementById('cancelBtn'),
      resultSection: document.getElementById('resultSection'),
      statOriginal: document.getElementById('statOriginal'),
      statCompressed: document.getElementById('statCompressed'),
      statReduction: document.getElementById('statReduction'),
      reductionBadge: document.getElementById('reductionBadge'),
      statusNote: document.getElementById('statusNote'),
      downloadBtn: document.getElementById('downloadBtn'),
      downloadOriginalBtn: document.getElementById('downloadOriginalBtn'),
      compressAnotherBtn: document.getElementById('compressAnotherBtn'),
      toastEl: document.getElementById('toast')
    };
  }

  bindEvents() {
    // Drop zone click
    this.dom.dropZone.addEventListener('click', () => {
      this.dom.fileInput.click();
    });

    // File input change
    this.dom.fileInput.addEventListener('change', (e) => {
      const file = e.target.files && e.target.files[0];
      if (file) {
        this.onFileSelect(file);
      }
      this.dom.fileInput.value = '';
    });

    // Drag and Drop
    ['dragenter', 'dragover'].forEach(eventName => {
      this.dom.dropZone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.dom.dropZone.classList.add('drag-over');
      });
    });

    ['dragleave', 'drop'].forEach(eventName => {
      this.dom.dropZone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.dom.dropZone.classList.remove('drag-over');
      });
    });

    this.dom.dropZone.addEventListener('drop', (e) => {
      const dt = e.dataTransfer;
      const file = dt && dt.files && dt.files[0];
      if (file) {
        this.onFileSelect(file);
      }
    });

    // Keyboard accessibility on dropzone
    this.dom.dropZone.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this.dom.fileInput.click();
      }
    });

    // Remove file button
    this.dom.removeBtn.addEventListener('click', () => {
      this.onReset();
    });

    // Compression level selection cards
    this.dom.levelCards.forEach(card => {
      card.addEventListener('click', () => {
        const level = card.getAttribute('data-level');
        this.setLevel(level);
      });
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          const level = card.getAttribute('data-level');
          this.setLevel(level);
        }
      });
    });

    // Compress button
    this.dom.compressBtn.addEventListener('click', () => {
      this.onCompress();
    });

    // Cancel button
    this.dom.cancelBtn.addEventListener('click', () => {
      this.onCancel();
    });

    // Download button — uses async handler for File System Access API
    this.dom.downloadBtn.addEventListener('click', () => {
      this.triggerDownload();
    });

    // Download original fallback button
    if (this.dom.downloadOriginalBtn) {
      this.dom.downloadOriginalBtn.addEventListener('click', () => {
        this.triggerDownload();
      });
    }

    // Compress another file
    this.dom.compressAnotherBtn.addEventListener('click', () => {
      this.onReset();
    });
  }

  setLanguage(lang) {
    this.currentLang = (lang === 'en') ? 'en' : 'id';
    this.applyTranslations();
  }

  t(key, params = {}) {
    const dict = this.translations[this.currentLang] || this.translations.id;
    let str = dict[key] || key;
    for (const [k, v] of Object.entries(params)) {
      str = str.replace(new RegExp(`\\{${k}\\}`, 'g'), v);
    }
    return str;
  }

  applyTranslations() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (key) {
        el.textContent = this.t(key);
      }
    });

    // Update active level description / cards
    this.dom.levelCards.forEach(card => {
      const level = card.getAttribute('data-level');
      const titleEl = card.querySelector('.level-title');
      const descEl = card.querySelector('.level-desc');
      if (titleEl) titleEl.textContent = this.t(`${level}Title`);
      if (descEl) descEl.textContent = this.t(`${level}Desc`);
    });

    // Update current state text if file is loaded
    if (this.state.file) {
      this.renderFileInfo();
    }
    if (this.state.result) {
      this.renderResult();
    }
  }

  setLevel(level) {
    this.state.setLevel(level);
    this.dom.levelCards.forEach(c => {
      const isSelected = c.getAttribute('data-level') === level;
      c.classList.toggle('active', isSelected);
      c.setAttribute('aria-checked', isSelected ? 'true' : 'false');
    });
  }

  showToast(message) {
    // Attempt postMessage to parent dashboard
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({ type: 'showToast', message }, '*');
    }
    // Also display local toast indicator as fallback
    if (this.dom.toastEl) {
      this.dom.toastEl.textContent = message;
      this.dom.toastEl.classList.add('show');
      clearTimeout(this._toastTimeout);
      this._toastTimeout = setTimeout(() => {
        this.dom.toastEl.classList.remove('show');
      }, 3000);
    }
  }

  renderFileInfo() {
    if (!this.state.file) {
      this.dom.fileInfoSection.style.display = 'none';
      this.dom.optionsSection.style.display = 'none';
      this.dom.uploadSection.style.display = 'block';
      return;
    }

    this.dom.uploadSection.style.display = 'none';
    this.dom.fileInfoSection.style.display = 'block';
    this.dom.optionsSection.style.display = 'block';
    this.dom.progressSection.style.display = 'none';
    if (window.CuteLoading) {
      window.CuteLoading.hide('progressLoading');
    }
    this.dom.resultSection.style.display = 'none';

    this.dom.fileName.textContent = this.state.file.name;
    this.dom.fileSize.textContent = formatBytes(this.state.originalSize);
    
    if (this.state.pageCount > 0) {
      this.dom.pageCount.textContent = `${this.state.pageCount} ${this.t('pagesCount')}`;
      this.dom.pageCount.style.display = 'inline-block';
    } else {
      this.dom.pageCount.style.display = 'none';
    }

    this.dom.compressBtn.disabled = false;
    this.dom.compressBtn.classList.remove('loading');
    this.dom.compressBtn.querySelector('.btn-text').textContent = this.t('compressBtn');
  }

  renderProcessing(percent, statusKey, params) {
    this.dom.optionsSection.style.display = 'none';
    this.dom.progressSection.style.display = 'block';
    this.dom.resultSection.style.display = 'none';

    if (window.CuteLoading) {
      window.CuteLoading.show('progressLoading', 'Sabar yahh..');
    }

    this.dom.compressBtn.disabled = true;
  }

  renderResult() {
    const res = this.state.result;
    if (!res) return;

    this.dom.progressSection.style.display = 'none';
    if (window.CuteLoading) {
      window.CuteLoading.hide('progressLoading');
    }
    this.dom.optionsSection.style.display = 'none';
    this.dom.resultSection.style.display = 'block';

    this.dom.statOriginal.textContent = formatBytes(res.originalSize);
    this.dom.statCompressed.textContent = formatBytes(res.size);

    if (res.isBetter && res.reductionPercent > 0) {
      this.dom.statReduction.textContent = `${res.reductionPercent}%`;
      this.dom.statReduction.className = 'stat-value text-green';
      this.dom.reductionBadge.textContent = `${this.t('statSaved')} ${res.reductionPercent}%`;
      this.dom.reductionBadge.className = 'badge-success';
      this.dom.reductionBadge.style.display = 'inline-block';
      this.dom.statusNote.style.display = 'none';
      this.dom.downloadBtn.textContent = this.t('downloadBtn');
      if (this.dom.downloadOriginalBtn) this.dom.downloadOriginalBtn.style.display = 'none';
    } else {
      // File did not shrink or is larger
      this.dom.statReduction.textContent = '0%';
      this.dom.statReduction.className = 'stat-value text-orange';
      this.dom.reductionBadge.style.display = 'none';
      this.dom.statusNote.textContent = `${this.t('statusNoReduction')}. ${this.t('statusNoReductionSub')}`;
      this.dom.statusNote.style.display = 'block';
      this.dom.downloadBtn.textContent = this.t('downloadOriginalBtn');
      if (this.dom.downloadOriginalBtn) this.dom.downloadOriginalBtn.style.display = 'none';
    }
  }

  /**
   * Robust multi-strategy download with guaranteed filename.
   * 
   * Strategy priority:
   * 1. File System Access API (showSaveFilePicker) — 100% reliable filename
   * 2. postMessage to parent window (parent uses saveAs from FileSaver.js)
   * 3. saveAs from FileSaver.js in current context
   * 4. Traditional <a> tag with download attribute
   */
  async triggerDownload() {
    const res = this.state.result;
    if (!res) return;

    // Build guaranteed filename: toolsuf-[nama-file]-pdf-compressor.pdf
    const originalName = (this.state.file && this.state.file.name) ? this.state.file.name : 'document.pdf';
    const outputName = typeof ToolSufDownload !== 'undefined'
      ? ToolSufDownload.generateFilename({ originalName, featureName: 'pdf-compressor', extension: 'pdf' })
      : `toolsuf-${originalName.trim().replace(/\.pdf$/i, '').replace(/[-_]compressed$/i, '')}-pdf-compressor.pdf`;

    const targetBlob = res.blob || this.state.file;
    const finalBlob = (targetBlob instanceof Blob && targetBlob.type === 'application/pdf')
      ? targetBlob
      : new Blob([targetBlob], { type: 'application/pdf' });

    if (typeof ToolSufDownload !== 'undefined') {
      try {
        await ToolSufDownload.downloadFile({
          blob: finalBlob,
          originalName,
          featureName: 'pdf-compressor',
          extension: 'pdf',
          filename: outputName,
          mimeType: 'application/pdf'
        });
        this.showToast(this.t('toastDownloaded'));
        return;
      } catch (err) {
        console.warn('[PDF Compressor] ToolSufDownload failed, trying fallbacks:', err.message);
      }
    }

    // ─── Strategy 1: File System Access API (showSaveFilePicker) ───
    // This is the ONLY method that guarantees the filename in ALL contexts
    // (standalone, iframe, sandboxed, cross-origin). Available in Chrome 86+.
    if (window.showSaveFilePicker) {
      try {
        const handle = await window.showSaveFilePicker({
          suggestedName: outputName,
          types: [{
            description: 'PDF Document',
            accept: { 'application/pdf': ['.pdf'] },
          }],
        });
        const writable = await handle.createWritable();
        await writable.write(finalBlob);
        await writable.close();
        this.showToast(this.t('toastDownloaded'));
        return;
      } catch (err) {
        // User cancelled the save dialog
        if (err.name === 'AbortError') return;
        console.warn('[PDF Compressor] showSaveFilePicker failed, trying fallbacks:', err.message);
      }
    }

    // ─── Strategy 2: Delegate to parent via postMessage ───
    // When inside ToolSuf's modal iframe, the parent window (app.js) has 
    // a message handler that receives the blob and uses saveAs/anchor in 
    // the top-level browsing context where download attributes are honored.
    if (window.parent && window.parent !== window) {
      try {
        // Read blob as ArrayBuffer so it survives structured cloning reliably
        const arrayBuffer = await finalBlob.arrayBuffer();
        window.parent.postMessage({
          type: 'downloadFile',
          filename: outputName,
          buffer: arrayBuffer
        }, '*');
        this.showToast(this.t('toastDownloaded'));
        return;
      } catch (err) {
        console.warn('[PDF Compressor] postMessage to parent failed:', err.message);
      }
    }

    // ─── Strategy 3: saveAs from FileSaver.js (loaded in this page) ───
    const saveAsFn = window.saveAs || (typeof saveAs !== 'undefined' ? saveAs : null);
    if (saveAsFn) {
      try {
        saveAsFn(new File([finalBlob], outputName, { type: 'application/pdf' }), outputName);
        this.showToast(this.t('toastDownloaded'));
        return;
      } catch (err) {
        console.warn('[PDF Compressor] saveAs failed:', err.message);
      }
    }

    // ─── Strategy 4: Traditional anchor tag (last resort) ───
    try {
      const url = URL.createObjectURL(finalBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = outputName;
      a.setAttribute('download', outputName);
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        try { if (a.parentNode) a.parentNode.removeChild(a); } catch (e) {}
        URL.revokeObjectURL(url);
      }, 15000);
    } catch (err) {
      console.error('[PDF Compressor] All download methods failed:', err);
    }

    this.showToast(this.t('toastDownloaded'));
  }

  resetAll() {
    this.dom.uploadSection.style.display = 'block';
    this.dom.fileInfoSection.style.display = 'none';
    this.dom.optionsSection.style.display = 'none';
    this.dom.progressSection.style.display = 'none';
    if (window.CuteLoading) {
      window.CuteLoading.hide('progressLoading');
    }
    this.dom.resultSection.style.display = 'none';

    this.dom.fileInput.value = '';
    if (this.dom.progressBar) this.dom.progressBar.style.width = '0%';
    this.dom.compressBtn.disabled = true;
    this.dom.compressBtn.classList.remove('loading');
    this.dom.compressBtn.querySelector('.btn-text').textContent = this.t('compressBtn');

    this.setLevel('medium');
  }
}
