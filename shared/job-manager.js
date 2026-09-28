/**
 * ToolSuf — Global Background Job Manager  v1.0
 * ================================================
 * Satu sistem terpusat untuk SEMUA proses berat di seluruh ToolSuf.
 * Arsitektur:
 *   UI → GlobalJobManager → JobQueue → WorkerPool → Processing → Result
 *                        ↕                                         ↕
 *                    IndexedDB                            NotificationService
 *
 * Kategori proses:
 *   LIGHT   → langsung, tidak masuk Job System
 *   MEDIUM  → async, tanpa queue
 *   HEAVY   → GlobalJobManager + Worker + Queue + IndexedDB + Notifikasi
 *
 * Fitur:
 * - Queue global multi-fitur
 * - Concurrency adaptif (mobile=1, desktop=2)
 * - IndexedDB persistence (job + hasil blob)
 * - Web Notification saat selesai/gagal
 * - Cancel per-job
 * - Retry job
 * - Job Center UI (compact, Apple-like)
 * - Dark/Light mode aware
 * - Accessibility (aria-live, aria-label)
 * - Cleanup otomatis (>24 jam atau >30 job)
 */

(function(global) {
  'use strict';

  // ──────────────────────────────────────────────────────────────────────
  // CONSTANTS
  // ──────────────────────────────────────────────────────────────────────
  const DB_NAME     = 'toolsuf-jobs';
  const DB_VERSION  = 1;
  const STORE_JOBS  = 'jobs';
  const STORE_BLOBS = 'blobs';
  const MAX_AGE_MS  = 24 * 60 * 60 * 1000; // 24 jam
  const MAX_JOBS    = 30;

  const STATUS = {
    QUEUED:      'queued',
    PROCESSING:  'processing',
    COMPLETED:   'completed',
    FAILED:      'failed',
    CANCELLED:   'cancelled',
    INTERRUPTED: 'interrupted'
  };

  // Deteksi mobile untuk adaptive concurrency
  const IS_MOBILE = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
  const MAX_CONCURRENCY = IS_MOBILE ? 1 : 2;

  // ──────────────────────────────────────────────────────────────────────
  // INDEXED DB STORAGE
  // ──────────────────────────────────────────────────────────────────────
  let _db = null;

  function openDB() {
    return new Promise((resolve, reject) => {
      if (_db) { resolve(_db); return; }
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = e => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(STORE_JOBS)) {
          db.createObjectStore(STORE_JOBS, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(STORE_BLOBS)) {
          db.createObjectStore(STORE_BLOBS, { keyPath: 'jobId' });
        }
      };
      req.onsuccess = e => { _db = e.target.result; resolve(_db); };
      req.onerror   = e => { console.warn('[JobManager] IndexedDB error:', e); resolve(null); };
    });
  }

  async function dbPut(store, obj) {
    try {
      const db = await openDB();
      if (!db) return;
      await new Promise((res, rej) => {
        const tx = db.transaction(store, 'readwrite');
        const s  = tx.objectStore(store);
        const r  = s.put(obj);
        r.onsuccess = res;
        r.onerror   = rej;
      });
    } catch (e) { console.warn('[JobManager] dbPut error:', e); }
  }

  async function dbGet(store, key) {
    try {
      const db = await openDB();
      if (!db) return null;
      return await new Promise((res, rej) => {
        const tx = db.transaction(store, 'readonly');
        const s  = tx.objectStore(store);
        const r  = s.get(key);
        r.onsuccess = () => res(r.result);
        r.onerror   = rej;
      });
    } catch (e) { return null; }
  }

  async function dbGetAll(store) {
    try {
      const db = await openDB();
      if (!db) return [];
      return await new Promise((res, rej) => {
        const tx = db.transaction(store, 'readonly');
        const s  = tx.objectStore(store);
        const r  = s.getAll();
        r.onsuccess = () => res(r.result || []);
        r.onerror   = rej;
      });
    } catch (e) { return []; }
  }

  async function dbDelete(store, key) {
    try {
      const db = await openDB();
      if (!db) return;
      await new Promise((res, rej) => {
        const tx = db.transaction(store, 'readwrite');
        const s  = tx.objectStore(store);
        const r  = s.delete(key);
        r.onsuccess = res;
        r.onerror   = rej;
      });
    } catch (e) {}
  }

  // Simpan job metadata (tanpa blob)
  async function persistJob(job) {
    const safe = {
      id: job.id, type: job.type, feature: job.feature,
      status: job.status, progress: job.progress,
      createdAt: job.createdAt, startedAt: job.startedAt, completedAt: job.completedAt,
      inputName: job.inputName, outputName: job.outputName,
      error: job.error, featureLabel: job.featureLabel
    };
    await dbPut(STORE_JOBS, safe);
  }

  // Simpan blob hasil ke IndexedDB
  async function persistBlob(jobId, blob) {
    if (!blob) return;
    try {
      const buf = await blob.arrayBuffer();
      await dbPut(STORE_BLOBS, { jobId, buffer: buf, type: blob.type });
    } catch (e) { console.warn('[JobManager] persistBlob error:', e); }
  }

  // Baca blob hasil dari IndexedDB
  async function loadBlob(jobId) {
    const rec = await dbGet(STORE_BLOBS, jobId);
    if (!rec || !rec.buffer) return null;
    return new Blob([rec.buffer], { type: rec.type || 'application/octet-stream' });
  }

  // ──────────────────────────────────────────────────────────────────────
  // JOB MANAGER CORE
  // ──────────────────────────────────────────────────────────────────────
  const _jobs = new Map();
  const _queue = [];
  const _active = new Set();
  const _listeners = new Set();
  const _processors = new Map();

  // ──────────────────────────────────────────────────────────────────────
  // JOB ID GENERATOR
  // ──────────────────────────────────────────────────────────────────────
  function generateJobId(feature) {
    const ts  = Date.now();
    const rnd = Math.random().toString(36).slice(2, 6);
    const slug = (feature || 'job').toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
    return `job-${ts}-${rnd}-${slug}`;
  }

  // ──────────────────────────────────────────────────────────────────────
  // REGISTER A PROCESSOR
  // ──────────────────────────────────────────────────────────────────────
  function registerProcessor(featureName, processorFn) {
    _processors.set(featureName, processorFn);
  }

  function hasProcessor(featureName) {
    return _processors.has(featureName);
  }

  function getInstance() {
    try {
      if (typeof window !== 'undefined' && window.parent && window.parent !== window && window.parent.GlobalJobManager) {
        return window.parent.GlobalJobManager;
      }
    } catch(e) {}
    return GlobalJobManager;
  }

  // ──────────────────────────────────────────────────────────────────────
  // CREATE & ENQUEUE JOB
  // ──────────────────────────────────────────────────────────────────────
  function createJob(opts) {
    const id = generateJobId(opts.feature);
    const now = Date.now();
    const job = {
      id,
      type:          opts.type || 'heavy',
      feature:       opts.feature || 'unknown',
      featureLabel:  opts.featureLabel || opts.feature || 'Proses',
      status:        STATUS.QUEUED,
      progress:      0,
      createdAt:     now,
      startedAt:     null,
      completedAt:   null,
      inputName:     opts.inputName || '',
      inputData:     opts.inputData || null,
      outputName:    opts.outputName || '',
      resultBlob:    null,
      error:         null,
      abortController: new AbortController(),
      onProgress:    opts.onProgress || null,
      onComplete:    opts.onComplete || null,
      onFail:        opts.onFail || null,
    };
    _jobs.set(id, job);
    _queue.push(id);
    persistJob(job);
    _notifyListeners('job-created', job);
    _scheduleNext();
    return id;
  }

  // ──────────────────────────────────────────────────────────────────────
  // SCHEDULE NEXT JOB
  // ──────────────────────────────────────────────────────────────────────
  function _scheduleNext() {
    while (_active.size < MAX_CONCURRENCY && _queue.length > 0) {
      const nextId = _queue.shift();
      if (!nextId) continue;
      const job = _jobs.get(nextId);
      if (!job || job.status === STATUS.CANCELLED) continue;
      _runJob(job);
    }
  }

  async function _runJob(job) {
    if (job.status === STATUS.CANCELLED) { _scheduleNext(); return; }

    job.status    = STATUS.PROCESSING;
    job.startedAt = Date.now();
    _active.add(job.id);
    persistJob(job);
    _notifyListeners('job-started', job);

    const processor = _processors.get(job.feature);
    if (!processor) {
      _failJob(job, new Error('Tidak ada processor untuk fitur: ' + job.feature));
      return;
    }

    try {
      const resultBlob = await processor(job, job.abortController.signal, (pct) => {
        job.progress = Math.max(0, Math.min(100, pct));
        _notifyListeners('job-progress', job);
      });

      if (job.status === STATUS.CANCELLED) {
        _active.delete(job.id);
        _scheduleNext();
        return;
      }

      job.status      = STATUS.COMPLETED;
      job.completedAt = Date.now();
      job.progress    = 100;
      job.resultBlob  = resultBlob || null;

      if (resultBlob) await persistBlob(job.id, resultBlob);
      persistJob(job);

      _active.delete(job.id);
      _notifyListeners('job-completed', job);
      GlobalNotificationService.notify(job);

      // Track feature usage automatically when background job succeeds (Section 1 & 2)
      if (typeof trackFeatureUsage === 'function' && job.feature) {
        try {
          trackFeatureUsage(job.feature, 'process', {
            inputName: job.inputName || null,
            outputName: job.outputName || null
          });
        } catch (e) {}
      }

      if (typeof job.onComplete === 'function') {
        try { job.onComplete(job); } catch(e) {}
      }
    } catch (err) {
      if (job.abortController.signal.aborted || err?.name === 'AbortError') {
        job.status = STATUS.CANCELLED;
        job.completedAt = Date.now();
        persistJob(job);
        _active.delete(job.id);
        _notifyListeners('job-cancelled', job);
      } else {
        _failJob(job, err);
      }
    }
    _scheduleNext();
  }

  function _failJob(job, err) {
    job.status      = STATUS.FAILED;
    job.completedAt = Date.now();
    job.error       = (err && err.message) ? err.message : 'Proses gagal.';
    persistJob(job);
    _active.delete(job.id);
    _notifyListeners('job-failed', job);
    GlobalNotificationService.notifyFail(job);
    if (typeof job.onFail === 'function') {
      try { job.onFail(job); } catch(e) {}
    }
  }

  // ──────────────────────────────────────────────────────────────────────
  // CANCEL JOB
  // ──────────────────────────────────────────────────────────────────────
  function cancelJob(jobId) {
    const job = _jobs.get(jobId);
    if (!job) return;
    if (job.status === STATUS.QUEUED) {
      const qi = _queue.indexOf(jobId);
      if (qi !== -1) _queue.splice(qi, 1);
      job.status = STATUS.CANCELLED;
      job.completedAt = Date.now();
      persistJob(job);
      _notifyListeners('job-cancelled', job);
      return;
    }
    if (job.status === STATUS.PROCESSING) {
      job.abortController.abort();
    }
  }

  // ──────────────────────────────────────────────────────────────────────
  // RETRY JOB
  // ──────────────────────────────────────────────────────────────────────
  function retryJob(jobId) {
    const job = _jobs.get(jobId);
    if (!job) return null;
    if (job.status !== STATUS.FAILED && job.status !== STATUS.CANCELLED &&
        job.status !== STATUS.INTERRUPTED) return null;
    const newId = createJob({
      type:         job.type,
      feature:      job.feature,
      featureLabel: job.featureLabel,
      inputName:    job.inputName,
      inputData:    job.inputData,
      outputName:   job.outputName,
      onComplete:   job.onComplete,
      onFail:       job.onFail,
    });
    return newId;
  }

  // ──────────────────────────────────────────────────────────────────────
  // CLEANUP OLD JOBS
  // ──────────────────────────────────────────────────────────────────────
  async function cleanup() {
    const now    = Date.now();
    const allJobs = await dbGetAll(STORE_JOBS);
    const toDelete = [];
    const doneStatuses = [STATUS.COMPLETED, STATUS.FAILED, STATUS.CANCELLED, STATUS.INTERRUPTED];

    for (const j of allJobs) {
      if (doneStatuses.includes(j.status) && j.completedAt && (now - j.completedAt) > MAX_AGE_MS) {
        toDelete.push(j.id);
      }
    }

    const sortedByAge = allJobs
      .filter(j => doneStatuses.includes(j.status))
      .sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0));

    if (sortedByAge.length > MAX_JOBS) {
      sortedByAge.slice(MAX_JOBS).forEach(j => {
        if (!toDelete.includes(j.id)) toDelete.push(j.id);
      });
    }

    for (const id of toDelete) {
      await dbDelete(STORE_JOBS, id);
      await dbDelete(STORE_BLOBS, id);
      _jobs.delete(id);
    }
  }

  // ──────────────────────────────────────────────────────────────────────
  // RECOVER JOBS SAAT PAGE LOAD
  // ──────────────────────────────────────────────────────────────────────
  async function recoverJobs() {
    await cleanup();
    const persisted = await dbGetAll(STORE_JOBS);
    for (const j of persisted) {
      if (j.status === STATUS.PROCESSING || j.status === STATUS.QUEUED) {
        j.status = STATUS.INTERRUPTED;
        j.completedAt = j.completedAt || Date.now();
        await dbPut(STORE_JOBS, j);
      }
      if (!_jobs.has(j.id)) {
        _jobs.set(j.id, {
          ...j,
          inputData:       null,
          resultBlob:      null,
          abortController: new AbortController(),
        });
      }
    }
    _notifyListeners('jobs-recovered', null);
  }

  // ──────────────────────────────────────────────────────────────────────
  // GET RESULT BLOB
  // ──────────────────────────────────────────────────────────────────────
  async function getResultBlob(jobId) {
    const job = _jobs.get(jobId);
    if (job && job.resultBlob) return job.resultBlob;
    return await loadBlob(jobId);
  }

  // ──────────────────────────────────────────────────────────────────────
  // LISTENERS / EVENT BUS
  // ──────────────────────────────────────────────────────────────────────
  function addListener(fn) { _listeners.add(fn); }
  function removeListener(fn) { _listeners.delete(fn); }

  function _notifyListeners(event, job) {
    for (const fn of _listeners) {
      try { fn(event, job); } catch(e) {}
    }
    _broadcastToIframes(event, job);
  }

  function _broadcastToIframes(event, job) {
    const safe = job ? {
      id: job.id, type: job.type, feature: job.feature, featureLabel: job.featureLabel,
      status: job.status, progress: job.progress, inputName: job.inputName,
      outputName: job.outputName, error: job.error,
      createdAt: job.createdAt, startedAt: job.startedAt, completedAt: job.completedAt
    } : null;
    document.querySelectorAll('iframe').forEach(frame => {
      try {
        frame.contentWindow.postMessage({ type: 'gjm-event', event, job: safe }, '*');
      } catch(e) {}
    });
  }

  // ──────────────────────────────────────────────────────────────────────
  // QUERY
  // ──────────────────────────────────────────────────────────────────────
  function getJob(id) { return _jobs.get(id) || null; }
  function getAllJobs() { return Array.from(_jobs.values()); }
  function getActiveJobs() {
    return getAllJobs().filter(j => j.status === STATUS.PROCESSING || j.status === STATUS.QUEUED);
  }
  function getActiveCount() { return getActiveJobs().length; }

  // ──────────────────────────────────────────────────────────────────────
  // GLOBAL NOTIFICATION SERVICE
  // ──────────────────────────────────────────────────────────────────────
  const GlobalNotificationService = {
    _notified: new Set(),
    _permissionRequested: false,

    async requestPermission() {
      if (!('Notification' in window)) return false;
      if (Notification.permission === 'granted') return true;
      if (Notification.permission === 'denied') return false;
      if (this._permissionRequested) return false;
      this._permissionRequested = true;
      try {
        const result = await Notification.requestPermission();
        return result === 'granted';
      } catch(e) { return false; }
    },

    notify(job) {
      if (!job || this._notified.has(job.id)) return;
      this._notified.add(job.id);

      const label = job.featureLabel || job.feature || 'Proses';
      const inputLabel = job.inputName ? ': ' + job.inputName : '';

      _showInAppToast('\u2713 ' + label + inputLabel + ' selesai.', 'ok');

      if ('Notification' in window && Notification.permission === 'granted') {
        try {
          new Notification('Proses selesai \u2014 ToolSuf', {
            body: label + inputLabel + ' sudah selesai.',
            icon: '/favicon.png',
            tag: job.id,
            requireInteraction: false
          });
        } catch(e) {}
      }
    },

    notifyFail(job) {
      if (!job || this._notified.has('fail-' + job.id)) return;
      this._notified.add('fail-' + job.id);

      const label = job.featureLabel || job.feature || 'Proses';
      _showInAppToast('\u2715 ' + label + ' gagal diproses.', 'err');

      if ('Notification' in window && Notification.permission === 'granted') {
        try {
          new Notification('Proses gagal \u2014 ToolSuf', {
            body: label + ' gagal. Silakan coba lagi.',
            icon: '/favicon.png',
            tag: 'fail-' + job.id,
            requireInteraction: false
          });
        } catch(e) {}
      }
    }
  };

  function _showInAppToast(msg, type) {
    if (window.parent && window.parent !== window) {
      try {
        window.parent.postMessage({ type: 'gjm-toast', message: msg, toastType: type }, '*');
        return;
      } catch(e) {}
    }
    if (window.GlobalJobUI) {
      window.GlobalJobUI.showToast(msg, type);
    }
  }

  // ──────────────────────────────────────────────────────────────────────
  // VISIBILITY CHANGE
  // ──────────────────────────────────────────────────────────────────────
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      _notifyListeners('visibility-change', null);
    }
  });

  // ──────────────────────────────────────────────────────────────────────
  // EXPOSE
  // ──────────────────────────────────────────────────────────────────────
  const GlobalJobManager = {
    STATUS,
    IS_MOBILE,
    registerProcessor,
    hasProcessor,
    _processors,
    getInstance,
    createJob,
    cancelJob,
    retryJob,
    getJob,
    getAllJobs,
    getActiveJobs,
    getActiveCount,
    getResultBlob,
    addListener,
    removeListener,
    recoverJobs,
    cleanup,
    _notifyListeners,
    GlobalNotificationService
  };

  global.GlobalJobManager = GlobalJobManager;
  global.GlobalNotificationService = GlobalNotificationService;

  recoverJobs().catch(() => {});

})(typeof window !== 'undefined' ? window : globalThis);
