/**
 * ToolSuf — CuteLoadingState Global Component  v2.1
 *
 * Satu-satunya sistem loading UI untuk seluruh tools di ToolSuf.
 * Mencegah duplikasi animasi dan render.
 *
 * Struktur Tunggal:
 *   "Sabar yahh.."
 *   ● ● ● Dots wave
 */

(function(global) {
  'use strict';

  const DEFAULT_MSG = 'Sabar yahh..';

  /**
   * Cek apakah teks merupakan teks teknis (persentase, mb, kb, frame, page, worker, dll)
   * @param {string} text
   * @returns {boolean}
   */
  function isTechnical(text) {
    if (!text || typeof text !== 'string') return false;
    return /%|\b\d+\s*(MB|KB|GB|B)\b|model ai|frame|halaman|page|downloading|mengunduh|extracting|converting|worker|compressing|mengompres|processing|memproses|generating|membuat/i.test(text);
  }

  /**
   * Buat markup inner HTML untuk komponen loading yang bersih dengan SATU animasi tunggal.
   * @param {string} [message]
   */
  function buildInner(message) {
    const text = (message && !isTechnical(message)) ? message : DEFAULT_MSG;
    return `
      <div class="cute-loading-text">${text}</div>
      <div class="cute-loading-dots" aria-hidden="true">
        <span></span><span></span><span></span>
      </div>
    `;
  }

  /**
   * Pastikan elemen sudah dikonfigurasi sebagai cute-loading container murni.
   * Hapus seluruh elemen sparkle dan progress lama agar tidak ada animasi ganda.
   * @param {HTMLElement} el
   * @param {string} [message]
   */
  function ensureSetup(el, message) {
    if (!el) return;
    if (!el.classList.contains('cute-loading')) {
      el.classList.add('cute-loading');
    }
    // Hapus kelas lama yang menimbulkan border/background ganda
    el.classList.remove('progress-card', 'zprog');

    const hasText = el.querySelector('.cute-loading-text');
    const hasDots = el.querySelector('.cute-loading-dots');

    if (!el.dataset.cuteLoading || !hasText || !hasDots) {
      el.setAttribute('role', 'status');
      el.setAttribute('aria-live', 'polite');
      el.dataset.cuteLoading = '1';
      el.innerHTML = buildInner(message || el.dataset.cuteMsg || DEFAULT_MSG);
    }

    // Hapus sparkle dan elemen progress lama dari DOM agar hanya ada satu animasi
    const redundantNodes = el.querySelectorAll('.cute-loading-sparkle, .prog-w, .prog-f, .progress-track, .progress-fill, .progress-bar-track, .progress-bar-fill, .progress-header, .zinfo:not(.cute-loading-text)');
    redundantNodes.forEach(node => node.remove());
  }

  const CuteLoading = {
    DEFAULT_MSG,

    /**
     * Tampilkan satu-satunya loading state pada elemen target.
     * @param {string|HTMLElement} target - ID atau elemen DOM
     * @param {string} [message]
     */
    show(target, message) {
      const el = typeof target === 'string'
        ? document.getElementById(target)
        : target;
      if (!el) return;
      ensureSetup(el, message);

      const textEl = el.querySelector('.cute-loading-text');
      const msg = (message && !isTechnical(message)) ? message : DEFAULT_MSG;
      if (textEl) {
        textEl.textContent = msg;
      }

      el.classList.add('active');
      el.style.display = 'flex';
      el.setAttribute('aria-busy', 'true');

      const parent = el.closest('[aria-busy]');
      if (parent && parent !== el) parent.setAttribute('aria-busy', 'true');
    },

    /**
     * Sembunyikan loading state secara tuntas.
     * @param {string|HTMLElement} target
     */
    hide(target) {
      const el = typeof target === 'string'
        ? document.getElementById(target)
        : target;
      if (!el) return;
      el.classList.remove('active');
      el.style.display = 'none';
      el.setAttribute('aria-busy', 'false');

      const parent = el.closest('[aria-busy]');
      if (parent && parent !== el) parent.setAttribute('aria-busy', 'false');
    },

    /**
     * Ubah teks loading. Teks teknis/persentase diabaikan demi menjaga UI tetap "Sabar yahh..".
     * @param {string|HTMLElement} target
     * @param {string} text
     */
    setText(target, text) {
      if (!text || isTechnical(text)) return;
      const el = typeof target === 'string'
        ? document.getElementById(target)
        : target;
      if (!el) return;
      const textEl = el.querySelector('.cute-loading-text');
      if (textEl) textEl.textContent = text;
    },

    /**
     * Buat elemen loading baru dan sisipkan ke dalam parent.
     * @param {HTMLElement} parent
     * @param {string} [id]
     * @param {string} [message]
     * @returns {HTMLElement}
     */
    create(parent, id, message) {
      const existing = id ? document.getElementById(id) : null;
      if (existing) {
        ensureSetup(existing, message);
        return existing;
      }
      const el = document.createElement('div');
      if (id) el.id = id;
      el.className = 'cute-loading';
      el.setAttribute('role', 'status');
      el.setAttribute('aria-live', 'polite');
      el.setAttribute('aria-busy', 'false');
      el.dataset.cuteLoading = '1';
      el.innerHTML = buildInner(message || DEFAULT_MSG);
      if (parent) parent.appendChild(el);
      return el;
    },

    /**
     * Konversi elemen lama menjadi CuteLoading murni tanpa animasi ganda.
     * @param {HTMLElement|string} target
     * @param {string} [message]
     */
    convert(target, message) {
      const el = typeof target === 'string'
        ? document.getElementById(target)
        : target;
      if (!el) return;
      const wasVisible = el.style.display !== 'none';
      ensureSetup(el, message);
      if (wasVisible) {
        el.classList.add('active');
        el.style.display = 'flex';
        el.setAttribute('aria-busy', 'true');
      } else {
        el.classList.remove('active');
        el.style.display = 'none';
        el.setAttribute('aria-busy', 'false');
      }
      return el;
    }
  };

  global.CuteLoading = CuteLoading;

})(window);
