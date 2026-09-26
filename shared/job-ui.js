/**
 * ToolSuf — Global Job Center UI  v1.0
 * ======================================
 * Job Center yang compact dan Apple-like.
 * - Header indicator: ⚙ N (jumlah job aktif)
 * - Desktop: popover/dropdown compact dari header
 * - Mobile: bottom sheet
 * - Dark/Light mode aware
 * - Cancel, Retry, Download per job
 */

(function(global) {
  'use strict';

  // ──────────────────────────────────────────────────────────────────────
  // STATE
  // ──────────────────────────────────────────────────────────────────────
  let _isOpen = false;
  let _indicatorEl = null;
  let _panelEl = null;
  let _overlayEl = null;
  let _badgeEl = null;
  let _initialized = false;
  let _toastTimeout = null;
  let _toastEl = null;

  // ──────────────────────────────────────────────────────────────────────
  // LABEL PER FITUR (Bahasa Indonesia)
  // ──────────────────────────────────────────────────────────────────────
  const FEATURE_LABELS = {
    'background-remover': 'Penghapus Latar',
    'media-compressor':   'Kompresor Gambar',
    'image-compressor':   'Kompresor Gambar',
    'pdf-compressor':     'Kompresor PDF',
    'image-to-pdf':       'Gambar ke PDF',
    'pdf-to-docs':        'PDF ke Dokumen',
    'video-to-uhd':       'Peningkat UHD',
    'watermark-remover':  'Hapus Watermark',
    'metadata-cleaner':   'Penghapus Metadata',
    'batch-renamer':      'Ganti Nama File',
    'qr-code-master':     'QR Code Master',
    'ai-workflow':        'Asisten AI',
  };

  function getFeatureLabel(feature) {
    return FEATURE_LABELS[feature] || feature || 'Proses';
  }

  // ──────────────────────────────────────────────────────────────────────
  // STATUS LABEL
  // ──────────────────────────────────────────────────────────────────────
  const STATUS_LABELS = {
    queued:      { text: 'Menunggu\u2026',    cls: 'gjm-status-queued' },
    processing:  { text: 'Memproses\u2026',   cls: 'gjm-status-processing' },
    completed:   { text: 'Selesai',           cls: 'gjm-status-done' },
    failed:      { text: 'Gagal',             cls: 'gjm-status-failed' },
    cancelled:   { text: 'Dibatalkan',        cls: 'gjm-status-cancelled' },
    interrupted: { text: 'Terhenti',          cls: 'gjm-status-cancelled' }
  };

  // ──────────────────────────────────────────────────────────────────────
  // INIT — dipanggil sekali dari app.js setelah DOM ready
  // ──────────────────────────────────────────────────────────────────────
  function init() {
    if (_initialized) return;
    _initialized = true;

    _buildIndicator();
    _buildPanel();
    _buildOverlay();
    _buildToast();

    // Listen ke GlobalJobManager events
    if (window.GlobalJobManager) {
      GlobalJobManager.addListener(_onJobEvent);
      _render();
    }

    // Sync tiap kali tab aktif kembali
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') _render();
    });
  }

  // ──────────────────────────────────────────────────────────────────────
  // BUILD DOM — Indicator (header button)
  // ──────────────────────────────────────────────────────────────────────
  function _buildIndicator() {
    // Cari container nav-actions di header
    const navActions = document.querySelector('.nav-actions');
    if (!navActions) return;

    _indicatorEl = document.createElement('button');
    _indicatorEl.className = 'nav-btn gjm-indicator';
    _indicatorEl.id = 'gjmIndicator';
    _indicatorEl.style.display = 'none';
    _indicatorEl.setAttribute('aria-label', 'Job Center — Proses Berjalan');
    _indicatorEl.setAttribute('aria-haspopup', 'dialog');
    _indicatorEl.setAttribute('aria-expanded', 'false');
    _indicatorEl.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="3"></circle>
        <path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"></path>
      </svg>
      <span class="gjm-badge" id="gjmBadge" aria-live="polite" aria-atomic="true"></span>
    `;
    _indicatorEl.addEventListener('click', togglePanel);

    // Insert sebelum themeToggle atau di awal nav-actions
    const themeBtn = document.getElementById('themeToggle');
    if (themeBtn) {
      navActions.insertBefore(_indicatorEl, themeBtn);
    } else {
      navActions.prepend(_indicatorEl);
    }

    _badgeEl = document.getElementById('gjmBadge');
  }

  // ──────────────────────────────────────────────────────────────────────
  // BUILD DOM — Panel (Job Center)
  // ──────────────────────────────────────────────────────────────────────
  function _buildPanel() {
    _panelEl = document.createElement('div');
    _panelEl.className = 'gjm-panel';
    _panelEl.id = 'gjmPanel';
    _panelEl.setAttribute('role', 'dialog');
    _panelEl.setAttribute('aria-label', 'Job Center');
    _panelEl.setAttribute('aria-modal', 'false');
    _panelEl.style.display = 'none';
    _panelEl.innerHTML = `
      <div class="gjm-panel-header">
        <span class="gjm-panel-title">Proses Berjalan</span>
        <button class="gjm-panel-close" id="gjmPanelClose" aria-label="Tutup Job Center">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
      <div class="gjm-job-list" id="gjmJobList" aria-live="polite" aria-relevant="additions removals">
      </div>
      <div class="gjm-panel-empty" id="gjmPanelEmpty" style="display:none">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true">
          <circle cx="12" cy="12" r="9"></circle>
          <polyline points="12 6 12 12 16 14"></polyline>
        </svg>
        <span>Belum ada proses aktif</span>
      </div>
    `;
    document.body.appendChild(_panelEl);

    document.getElementById('gjmPanelClose').addEventListener('click', closePanel);
    // Trap click di dalam panel agar tidak menutup
    _panelEl.addEventListener('click', e => e.stopPropagation());
  }

  // ──────────────────────────────────────────────────────────────────────
  // BUILD DOM — Overlay (untuk close panel saat klik luar)
  // ──────────────────────────────────────────────────────────────────────
  function _buildOverlay() {
    _overlayEl = document.createElement('div');
    _overlayEl.className = 'gjm-overlay';
    _overlayEl.id = 'gjmOverlay';
    _overlayEl.style.display = 'none';
    _overlayEl.setAttribute('aria-hidden', 'true');
    _overlayEl.addEventListener('click', closePanel);
    document.body.appendChild(_overlayEl);
  }

  // ──────────────────────────────────────────────────────────────────────
  // BUILD DOM — Toast global
  // ──────────────────────────────────────────────────────────────────────
  function _buildToast() {
    _toastEl = document.createElement('div');
    _toastEl.className = 'gjm-toast';
    _toastEl.id = 'gjmToast';
    _toastEl.setAttribute('role', 'status');
    _toastEl.setAttribute('aria-live', 'polite');
    document.body.appendChild(_toastEl);
  }

  // ──────────────────────────────────────────────────────────────────────
  // OPEN / CLOSE PANEL
  // ──────────────────────────────────────────────────────────────────────
  function togglePanel() {
    _isOpen ? closePanel() : openPanel();
  }

  function openPanel() {
    if (_isOpen || !_panelEl) return;
    _isOpen = true;
    _render();
    _panelEl.style.display = 'flex';
    _overlayEl.style.display = 'block';
    requestAnimationFrame(() => {
      _panelEl.classList.add('gjm-panel-open');
    });
    if (_indicatorEl) {
      _indicatorEl.setAttribute('aria-expanded', 'true');
    }
  }

  function closePanel() {
    if (!_isOpen || !_panelEl) return;
    _isOpen = false;
    _panelEl.classList.remove('gjm-panel-open');
    _overlayEl.style.display = 'none';
    setTimeout(() => {
      if (!_isOpen) _panelEl.style.display = 'none';
    }, 250);
    if (_indicatorEl) {
      _indicatorEl.setAttribute('aria-expanded', 'false');
    }
  }

  // ──────────────────────────────────────────────────────────────────────
  // RENDER JOB LIST
  // ──────────────────────────────────────────────────────────────────────
  function _render() {
    if (!window.GlobalJobManager) return;

    const allJobs = GlobalJobManager.getAllJobs()
      .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
      .slice(0, 20); // Tampilkan 20 job terbaru

    const activeCount = GlobalJobManager.getActiveCount();

    // Update indicator
    if (_indicatorEl) {
      _indicatorEl.style.display = activeCount > 0 ? '' : 'none';
    }
    if (_badgeEl) {
      _badgeEl.textContent = activeCount > 0 ? String(activeCount) : '';
    }

    if (!_panelEl) return;

    const list = document.getElementById('gjmJobList');
    const empty = document.getElementById('gjmPanelEmpty');
    if (!list) return;

    if (allJobs.length === 0) {
      list.innerHTML = '';
      if (empty) empty.style.display = 'flex';
      return;
    }
    if (empty) empty.style.display = 'none';

    list.innerHTML = '';
    allJobs.forEach(job => {
      list.appendChild(_buildJobCard(job));
    });
  }

  function _buildJobCard(job) {
    const card = document.createElement('div');
    card.className = 'gjm-job-card';
    card.setAttribute('data-job-id', job.id);

    const st = STATUS_LABELS[job.status] || { text: job.status, cls: '' };
    const label = getFeatureLabel(job.feature);
    const inputShort = _truncate(job.inputName || '', 28);

    const isActive   = job.status === 'processing' || job.status === 'queued';
    const isDone     = job.status === 'completed';
    const isFailed   = job.status === 'failed' || job.status === 'interrupted';
    const isCancelled = job.status === 'cancelled';

    let progressBar = '';
    if (isActive) {
      const pct = Math.round(job.progress || 0);
      progressBar = `<div class="gjm-progress-track" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100" aria-label="Progress ${label}">
        <div class="gjm-progress-fill" style="width:${pct}%"></div>
      </div>`;
    }

    let actions = '';
    if (isActive) {
      actions = `<button class="gjm-action-btn gjm-btn-cancel" data-action="cancel" data-job="${job.id}" aria-label="Batalkan ${label}">Batalkan</button>`;
    }
    if (isDone) {
      actions = `<button class="gjm-action-btn gjm-btn-download" data-action="download" data-job="${job.id}" aria-label="Unduh hasil ${label}">Unduh</button>`;
    }
    if (isFailed) {
      actions = `<button class="gjm-action-btn gjm-btn-retry" data-action="retry" data-job="${job.id}" aria-label="Coba lagi ${label}">Coba Lagi</button>`;
    }

    let iconSvg = '';
    if (isActive) {
      iconSvg = `<span class="gjm-icon gjm-icon-spin" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
      </span>`;
    } else if (isDone) {
      iconSvg = `<span class="gjm-icon gjm-icon-done" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
      </span>`;
    } else if (isFailed) {
      iconSvg = `<span class="gjm-icon gjm-icon-fail" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </span>`;
    } else {
      iconSvg = `<span class="gjm-icon gjm-icon-cancelled" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
      </span>`;
    }

    card.innerHTML = `
      <div class="gjm-card-left">
        ${iconSvg}
        <div class="gjm-card-info">
          <div class="gjm-card-name">${_escHtml(label)}</div>
          ${inputShort ? `<div class="gjm-card-file">${_escHtml(inputShort)}</div>` : ''}
          <div class="gjm-card-status ${st.cls}">${st.text}</div>
          ${progressBar}
        </div>
      </div>
      <div class="gjm-card-actions">${actions}</div>
    `;

    // Action handlers
    card.querySelectorAll('[data-action]').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        const action = btn.getAttribute('data-action');
        const jid = btn.getAttribute('data-job');
        if (action === 'cancel') GlobalJobManager.cancelJob(jid);
        if (action === 'retry') GlobalJobManager.retryJob(jid);
        if (action === 'download') _downloadJobResult(jid);
      });
    });

    return card;
  }

  async function _downloadJobResult(jobId) {
    const job = GlobalJobManager.getJob(jobId);
    if (!job) return;
    const blob = await GlobalJobManager.getResultBlob(jobId);
    if (!blob) { showToast('Hasil tidak tersedia.', 'err'); return; }
    if (window.ToolSufDownload) {
      ToolSufDownload.downloadFile({
        blob,
        originalName: job.inputName || 'file',
        featureName: job.feature,
        extension: _blobExt(blob)
      }).catch(() => _directDownload(blob, job));
    } else {
      _directDownload(blob, job);
    }
  }

  function _directDownload(blob, job) {
    const ext = _blobExt(blob);
    const base = (job.inputName || 'file').replace(/\.[^/.]+$/, '');
    const slug = (job.feature || 'toolsuf').replace(/[^a-z0-9]/g, '-');
    const name = `toolsuf-${base}-${slug}.${ext}`;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 5000);
  }

  function _blobExt(blob) {
    const m = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp',
                'application/pdf': 'pdf', 'application/zip': 'zip',
                'video/mp4': 'mp4', 'video/webm': 'webm',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
                'text/plain': 'txt' };
    return m[blob.type] || 'bin';
  }

  // ──────────────────────────────────────────────────────────────────────
  // JOB EVENT HANDLER
  // ──────────────────────────────────────────────────────────────────────
  function _onJobEvent(event, job) {
    _render();
    // Auto-buka panel saat ada job baru dari fitur berat
    if (event === 'job-created' && !_isOpen) {
      // Tampilkan toast ringan agar user tahu
      const label = job ? getFeatureLabel(job.feature) : 'Proses';
      showToast(label + ' ditambahkan ke antrian.', 'info');
    }
  }

  // ──────────────────────────────────────────────────────────────────────
  // TOAST
  // ──────────────────────────────────────────────────────────────────────
  function showToast(msg, type) {
    if (!_toastEl) return;
    clearTimeout(_toastTimeout);
    _toastEl.textContent = msg;
    _toastEl.className = 'gjm-toast gjm-toast-' + (type || 'info') + ' gjm-toast-show';
    _toastTimeout = setTimeout(() => {
      if (_toastEl) _toastEl.classList.remove('gjm-toast-show');
    }, 4000);
  }

  // ──────────────────────────────────────────────────────────────────────
  // HELPERS
  // ──────────────────────────────────────────────────────────────────────
  function _truncate(str, max) {
    if (!str) return '';
    return str.length > max ? str.slice(0, max - 1) + '\u2026' : str;
  }
  function _escHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // ──────────────────────────────────────────────────────────────────────
  // HANDLE postMessage dari iframe (gjm-toast, gjm-event)
  // ──────────────────────────────────────────────────────────────────────
  window.addEventListener('message', (e) => {
    if (!e.data) return;
    if (e.data.type === 'gjm-toast') {
      showToast(e.data.message, e.data.toastType || 'info');
    }
    // gjm-event dari iframe diteruskan ke job manager di parent
    // (tools yang berada dalam iframe bisa mengirim job request)
    if (e.data.type === 'gjm-create-job') {
      if (window.GlobalJobManager) {
        const jobId = GlobalJobManager.createJob(e.data.opts || {});
        // Kirim jobId kembali ke iframe
        const src = e.source;
        if (src) {
          try { src.postMessage({ type: 'gjm-job-created', jobId }, '*'); } catch(err) {}
        }
      }
    }
    if (e.data.type === 'gjm-cancel-job') {
      if (window.GlobalJobManager) {
        GlobalJobManager.cancelJob(e.data.jobId);
      }
    }
  });

  // ──────────────────────────────────────────────────────────────────────
  // EXPOSE GlobalJobUI
  // ──────────────────────────────────────────────────────────────────────
  const GlobalJobUI = {
    init,
    openPanel,
    closePanel,
    togglePanel,
    showToast,
    getFeatureLabel,
    _render
  };

  global.GlobalJobUI = GlobalJobUI;

})(typeof window !== 'undefined' ? window : globalThis);
