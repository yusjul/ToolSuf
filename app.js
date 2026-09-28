document.addEventListener('DOMContentLoaded', () => {
  // --- DOM Elements ---
  const htmlEl = document.documentElement;
  const themeToggleBtn = document.getElementById('themeToggle');
  const langToggleBtn = document.getElementById('langToggle');
  const langDropdown = document.getElementById('langDropdown');
  
  const modalOverlay = document.getElementById('modalOverlay');
  const macWindow = document.getElementById('macWindow');
  const macTitle = document.getElementById('macTitle');
  const toolFrame = document.getElementById('toolFrame');
  const closeWindowBtn = document.getElementById('closeWindow');
  
  const toast = document.getElementById('toast');
  const toastText = document.getElementById('toastText');

  // --- Translation Dictionary (Indonesian & English) ---
  const translations = {
    en: {
      navHome: 'Home',
      navTools: 'Tools',
      navAbout: 'About',
      navContact: 'Contact',
      langId: 'Indonesia',
      langEn: 'English',
      exploreBtn: 'Explore Tools',
      aboutBtn: 'About ToolSuf',
      heroTitle: 'Welcome to ToolSuf',
      heroDesc: 'Welcome to ToolSuf — a digital space for simple, fast, and premium-crafted tools.',
      precisionTools: 'Precision Tools',
      engineered: 'Engineered for a frictionless experience.',
      launch: 'Launch',
      comingSoon: 'Coming Soon',
      securityBadge: 'Security',
      productivityBadge: 'Productivity',
      interfaceOfLess: 'The Interface of Less',
      fastTitle: 'Fast',
      fastDesc: 'Zero lag, instant results.',
      premiumUiTitle: 'Premium UI',
      premiumUiDesc: 'High-end aesthetic.',
      practicalTitle: 'Practical',
      practicalDesc: 'Tools you actually need.',
      privateTitle: 'Private',
      privateDesc: 'Local processing focus.',
      toastComingSoon: 'This feature is currently in active development. Stay tuned!',
      toastLangChange: 'Language changed to English',
      toolPassDesc: 'Generate secure passwords with Apple-style UI.',
      toolRenameDesc: 'Rename multiple files with macOS utility style.',
      toolAiTitle: 'AI Workflow Assistant',
      toolAiDesc: 'Intelligent automation for repetitive tasks.',
      documentBadge: 'Document',
      mediaBadge: 'Media',
      toolCompressTitle: 'Media Compressor',
      toolCompressDesc: 'Compress images with before/after comparison.',
      toolBgRemoverTitle: 'Background Remover',
      toolBgRemoverDesc: 'Remove image backgrounds fully offline with browser AI.',
      toolImgToPdfDesc: 'Convert images to PDF with Apple-style UI.',
      toolPdfToDocsDesc: 'Convert PDF to Word documents with Apple-style UI.',
      toolVideoToUhdDesc: 'Upscale video resolution to UHD 4K with Apple-style UI.',
      toolWatermarkTitle: 'Watermark Remover',
      toolWatermarkDesc: 'Remove video watermark with manual or auto detection.',
      toolQrTitle: 'QR Code Master',
      toolQrDesc: 'Generate and scan customized QR codes with premium Apple-style UI.',
      toolMetaTitle: 'Metadata Cleaner',
      toolMetaDesc: 'Remove EXIF metadata and GPS locations from images locally.',
      copyright: '© 2026 ToolSuf. Precision-crafted for power users.',
      privacy: 'Privacy Policy',
      terms: 'Terms of Service',
      status: 'Status',
      closeBtn: 'Close',
      iframeTitle: 'Integrated Productivity Tool',
      toolPassTitle: 'Password Generator',
      toolRenameTitle: 'Batch Renamer Pro',
      toolImgToPdfTitle: 'Image to PDF',
      toolPdfToDocsTitle: 'PDF to Docs',
      toolPdfCompressorTitle: 'PDF Compressor',
      toolPdfCompressorDesc: 'Reduce PDF file size while keeping documents usable.',
      toolVideoToUhdTitle: 'UHD Video Upscaler',
      cardMaintenanceBadge: 'MAINTENANCE',
      cardMaintenanceDesc: 'Feature is currently under maintenance. Please check back later.',
      maintenanceBadge: 'MAINTENANCE',
      maintenanceTitle: 'Feature Under Development',
      maintenanceDesc: 'We are currently making improvements to this feature. Please try again once the development process is complete.',
      maintenanceBack: 'Back',
      maintenanceHome: 'Back to Home',
      maintenanceClose: 'Close',
    },
    id: {
      navHome: 'Beranda',
      navTools: 'Alat',
      navAbout: 'Tentang',
      navContact: 'Kontak',
      langId: 'Indonesia',
      langEn: 'Inggris',
      exploreBtn: 'Jelajahi Tool',
      aboutBtn: 'Tentang ToolSuf',
      heroTitle: 'Selamat Datang di ToolSuf',
      heroDesc: 'Selamat Datang di ToolSuf — ruang digital untuk alat produktivitas yang simpel, cepat, dan berkualitas premium.',
      precisionTools: 'Alat Presisi',
      engineered: 'Dirancang untuk pengalaman yang mulus tanpa hambatan.',
      launch: 'Buka',
      comingSoon: 'Segera Hadir',
      securityBadge: 'Keamanan',
      productivityBadge: 'Produktivitas',
      interfaceOfLess: 'Antarmuka Minimalis',
      fastTitle: 'Cepat',
      fastDesc: 'Tanpa jeda, hasil instan.',
      premiumUiTitle: 'UI Premium',
      premiumUiDesc: 'Estetika kelas tinggi.',
      practicalTitle: 'Praktis',
      practicalDesc: 'Alat yang benar-benar Anda butuhkan.',
      privateTitle: 'Privat',
      privateDesc: 'Fokus pada pemrosesan lokal.',
      toastComingSoon: 'Fitur ini sedang dalam pengembangan aktif. Nantikan segera!',
      toastLangChange: 'Bahasa diubah ke Bahasa Indonesia',
      toolPassDesc: 'Buat kata sandi aman dengan antarmuka bergaya Apple.',
      toolRenameDesc: 'Ubah nama banyak file dengan gaya utilitas macOS.',
      toolAiTitle: 'Asisten Alur Kerja AI',
      toolAiDesc: 'Otomatisasi cerdas untuk tugas-tugas berulang.',
      mediaBadge: 'Media',
      toolCompressTitle: 'Kompresor Media',
      toolCompressDesc: 'Kompres gambar dengan perbandingan sebelum/sesudah.',
      documentBadge: 'Dokumen',
      toolBgRemoverTitle: 'Penghapus Latar',
      toolImgToPdfTitle: 'Gambar ke PDF',
      toolPdfToDocsTitle: 'PDF ke Dokumen',
      toolPdfCompressorTitle: 'PDF Compressor',
      toolPdfCompressorDesc: 'Kurangi ukuran file PDF dengan tetap menjaga dokumen dapat digunakan.',
      toolVideoToUhdTitle: 'Peningkat Video UHD',
      toolBgRemoverDesc: 'Hapus latar belakang gambar secara offline dengan AI browser.',
      toolImgToPdfDesc: 'Konversi gambar ke PDF dengan antarmuka bergaya Apple.',
      toolPdfToDocsDesc: 'Konversi PDF ke dokumen Word dengan antarmuka bergaya Apple.',
      toolVideoToUhdDesc: 'Tingkatkan resolusi video ke UHD 4K dengan antarmuka bergaya Apple.',
      toolWatermarkTitle: 'Hapus Watermark Video',
      toolWatermarkDesc: 'Hapus watermark video dengan deteksi manual atau otomatis.',
      toolQrTitle: 'Master Kode QR',
      toolQrDesc: 'Buat dan pindai QR Code kustom dengan antarmuka premium bergaya Apple.',
      toolMetaTitle: 'Penghapus Metadata',
      toolMetaDesc: 'Hapus metadata EXIF dan lokasi GPS dari gambar secara lokal.',
      copyright: '© 2026 ToolSuf. Dibuat presisi untuk pengguna ahli.',
      privacy: 'Kebijakan Privasi',
      terms: 'Ketentuan Layanan',
      status: 'Status',
      closeBtn: 'Tutup',
      iframeTitle: 'Alat Produktivitas Terintegrasi',
      toolPassTitle: 'Generator Kata Sandi',
      toolRenameTitle: 'Pengganti Nama File Pro',
      cardMaintenanceBadge: 'MAINTENANCE',
      cardMaintenanceDesc: 'Fitur sedang dalam pemeliharaan. Silakan coba kembali nanti.',
      maintenanceBadge: 'MAINTENANCE',
      maintenanceTitle: 'Fitur Sedang Dikembangkan',
      maintenanceDesc: 'Kami sedang melakukan beberapa peningkatan pada fitur ini. Silakan coba kembali setelah proses pengembangan selesai.',
      maintenanceBack: 'Kembali',
      maintenanceHome: 'Kembali ke Beranda',
      maintenanceClose: 'Tutup',
    }
  };

  // --- State Variables ---
  let isDark = localStorage.getItem('theme') === 'dark' || 
               (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
  let currentLang = localStorage.getItem('lang') === 'en' ? 'en' : 'id';
  let activeTool = null;

  // --- Theme Controller ---
  const applyTheme = (darkState) => {
    if (darkState) {
      htmlEl.classList.add('dark');
      themeToggleBtn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="5"></circle>
          <line x1="12" y1="1" x2="12" y2="3"></line>
          <line x1="12" y1="21" x2="12" y2="23"></line>
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
          <line x1="1" y1="12" x2="3" y2="12"></line>
          <line x1="21" y1="12" x2="23" y2="12"></line>
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
        </svg>
      `;
    } else {
      htmlEl.classList.remove('dark');
      themeToggleBtn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
        </svg>
      `;
    }
    localStorage.setItem('theme', darkState ? 'dark' : 'light');
    isDark = darkState;
    
    // Update theme-color meta tag for mobile browser status bar to match theme background
    const themeColorMeta = document.querySelector('meta[name="theme-color"]');
    if (themeColorMeta) {
      themeColorMeta.setAttribute('content', darkState ? '#0A0A0C' : '#FCFCFD');
    }
    
    syncIframeTheme();
    window.dispatchEvent(new Event('theme-changed'));
    if (typeof _syncActiveModalMaintenance === 'function') {
      _syncActiveModalMaintenance();
    }
  };

  // Sync theme inside iframe via postMessage (reliable cross-origin)
  const syncIframeTheme = () => {
    if (toolFrame && toolFrame.contentWindow) {
      try {
        toolFrame.contentWindow.postMessage({ type: 'syncTheme', dark: isDark }, '*');
      } catch (e) {
        console.warn('Iframe theme sync issue', e);
      }
    }
  };

  // Sync language inside iframe via postMessage
  const syncIframeLang = () => {
    if (toolFrame && toolFrame.contentWindow) {
      try {
        toolFrame.contentWindow.postMessage({ type: 'syncLang', lang: currentLang }, '*');
      } catch (e) {
        console.warn('Iframe lang sync issue', e);
      }
    }
  };

  // Theme Toggle click listener
  themeToggleBtn.addEventListener('click', () => {
    applyTheme(!isDark);
  });

  // Apply initial theme
  applyTheme(isDark);

  // Sync theme and language on iframe loaded
  toolFrame.addEventListener('load', () => {
    syncIframeTheme();
    syncIframeLang();
  });

  // Listen to message events from iframe (cross-origin safe)
  window.addEventListener('message', (e) => {
    if (!e.data) return;
    if (e.data.type === 'closeToolModal') {
      closeTool();
      return;
    }
    if (e.data.type === 'showToast') {
      showToast(e.data.message);
    } else if (e.data.type === 'downloadFile' || e.data.type === 'download' || e.data.type === 'downloadPDF') {
      let filename = (e.data.filename || 'document.pdf').trim();
      filename = filename.replace(/[/\\?%*:|"<>]/g, '');

      // Pastikan format toolsuf- prefix jika belum ada
      if (!filename.toLowerCase().startsWith('toolsuf-')) {
        filename = `toolsuf-${filename}`;
      }

      // Deteksi MIME type berdasarkan ekstensi atau data blob
      const lower = filename.toLowerCase();
      let mime = 'application/octet-stream';
      if (lower.endsWith('.zip')) mime = 'application/zip';
      else if (lower.endsWith('.docx')) mime = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      else if (lower.endsWith('.txt')) mime = 'text/plain';
      else if (lower.endsWith('.mp4')) mime = 'video/mp4';
      else if (lower.endsWith('.webm')) mime = 'video/webm';
      else if (lower.endsWith('.json')) mime = 'application/json';
      else if (lower.endsWith('.csv')) mime = 'text/csv';
      else if (lower.endsWith('.png')) mime = 'image/png';
      else if (lower.endsWith('.svg')) mime = 'image/svg+xml';
      else if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) mime = 'image/jpeg';
      else if (lower.endsWith('.webp')) mime = 'image/webp';
      else if (lower.endsWith('.pdf')) mime = 'application/pdf';
      else if (e.data.mime) mime = e.data.mime;
      else if (e.data.blob && e.data.blob.type) mime = e.data.blob.type;

      let blob = e.data.blob;
      if (!blob && e.data.buffer) {
        blob = new Blob([e.data.buffer], { type: mime });
      }

      if (blob) {
        const topBlob = (blob instanceof Blob && blob.type === mime) ? blob : new Blob([blob], { type: mime });

        // Primary: Use saveAs from FileSaver.js (loaded in parent page)
        const parentSaveAs = window.saveAs || (typeof saveAs !== 'undefined' ? saveAs : null);
        if (parentSaveAs) {
          try {
            parentSaveAs(new File([topBlob], filename, { type: mime }), filename);
            return;
          } catch (saveErr) {
            console.warn('Parent saveAs failed, falling back to anchor:', saveErr);
          }
        }

        // Fallback: anchor approach
        const topUrl = URL.createObjectURL(topBlob);
        const a = document.createElement('a');
        a.style.position = 'fixed';
        a.style.left = '-9999px';
        a.style.top = '-9999px';
        a.href = topUrl;
        a.download = filename;
        a.setAttribute('download', filename);
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
          try {
            if (a.parentNode) a.parentNode.removeChild(a);
          } catch (err) {}
          URL.revokeObjectURL(topUrl);
        }, 15000);
        return;
      }

      if (e.data.url) {
        if (e.data.url.startsWith('data:')) {
          const a = document.createElement('a');
          a.style.position = 'fixed';
          a.style.left = '-9999px';
          a.style.top = '-9999px';
          a.href = e.data.url;
          a.download = filename;
          a.setAttribute('download', filename);
          document.body.appendChild(a);
          a.click();
          setTimeout(() => {
            try {
              if (a.parentNode) a.parentNode.removeChild(a);
            } catch (err) {}
          }, 15000);
          return;
        }

        // Re-read iframe blob url into top-level blob context so Chrome honors filename
        fetch(e.data.url)
          .then(res => res.blob())
          .then(b => {
            const cleanBlob = new Blob([b], { type: mime });
            const parentSaveAs2 = window.saveAs || (typeof saveAs !== 'undefined' ? saveAs : null);
            if (parentSaveAs2) {
              try {
                parentSaveAs2(new File([cleanBlob], filename, { type: mime }), filename);
                return;
              } catch (e2) {}
            }
            const cleanUrl = URL.createObjectURL(cleanBlob);
            const a = document.createElement('a');
            a.style.position = 'fixed';
            a.style.left = '-9999px';
            a.style.top = '-9999px';
            a.href = cleanUrl;
            a.download = filename;
            a.setAttribute('download', filename);
            document.body.appendChild(a);
            a.click();
            setTimeout(() => {
              try {
                if (a.parentNode) a.parentNode.removeChild(a);
              } catch (err) {}
              URL.revokeObjectURL(cleanUrl);
            }, 15000);
          })
          .catch(() => {
            const a = document.createElement('a');
            a.style.position = 'fixed';
            a.style.left = '-9999px';
            a.style.top = '-9999px';
            a.href = e.data.url;
            a.download = filename;
            a.setAttribute('download', filename);
            document.body.appendChild(a);
            a.click();
            setTimeout(() => {
              try { document.body.removeChild(a); } catch (err) {}
            }, 4000);
          });
      }
    }
  });

  // --- Translation Controller (i18n) ---
  const applyLanguage = (lang) => {
    currentLang = lang;
    localStorage.setItem('lang', lang);
    
    // Find all elements with data-i18n attribute and update them
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (translations[lang] && translations[lang][key]) {
        el.textContent = translations[lang][key];
      }
    });

    // Update close button accessibility label
    if (closeWindowBtn) {
      const closeLabel = lang === 'en' ? 'Close' : 'Tutup';
      closeWindowBtn.setAttribute('title', closeLabel);
      closeWindowBtn.setAttribute('aria-label', closeLabel);
    }

    // Dynamic icon text updates for modal window header
    if (activeTool) {
      const config = toolsInfo[activeTool];
      if (config) {
        const title = lang === 'id' ? config.titleId : config.titleEn;
        macTitle.innerHTML = `${config.icon} ${title}`;
      }
    }

    // Update iframe title attribute
    if (toolFrame) {
      toolFrame.title = translations[lang].iframeTitle || '';
    }

    // Update active state class inside language selector dropdown
    document.querySelectorAll('.lang-opt').forEach(opt => {
      if (opt.getAttribute('data-lang') === lang) {
        opt.classList.add('active');
      } else {
        opt.classList.remove('active');
      }
    });

    // Sync language into open iframe tool
    syncIframeLang();

    // Re-apply maintenance badges/descriptions in current language
    _applyMaintenanceBadges();
    if (typeof _syncActiveModalMaintenance === 'function') {
      _syncActiveModalMaintenance();
    }
  };

  // Language Dropdown toggling
  langToggleBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    langDropdown.classList.toggle('active');
  });

  // Hide dropdown menu on clicking outside
  document.addEventListener('click', (e) => {
    if (langDropdown.classList.contains('active') && !langDropdown.contains(e.target) && e.target !== langToggleBtn) {
      langDropdown.classList.remove('active');
    }
  });

  // Listen to language option clicks
  document.querySelectorAll('.lang-opt').forEach(opt => {
    opt.addEventListener('click', () => {
      const selectedLang = opt.getAttribute('data-lang');
      applyLanguage(selectedLang);
      langDropdown.classList.remove('active');
      showToast(translations[selectedLang].toastLangChange);
    });
  });

  // Apply initial language (NOTE: must be called again after _applyMaintenanceBadges is defined)
  applyLanguage(currentLang);

  // --- Toast System ---
  let toastTimeout = null;
  const showToast = (message) => {
    if (toastTimeout) clearTimeout(toastTimeout);
    toastText.textContent = message;
    toast.classList.add('active');
    toastTimeout = setTimeout(() => {
      toast.classList.remove('active');
    }, 3000);
  };

  // --- macOS Window/Modal Controllers ---
  const toolsInfo = {
    password: {
      titleEn: 'Password Generator',
      titleId: 'Generator Kata Sandi',
      src: 'tools/password-generator/index.html',
      wide: false,
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>`
    },
    renamer: {
      titleEn: 'Batch Renamer Pro',
      titleId: 'Pengganti Nama File Pro',
      src: 'tools/batch-renamer/index.html',
      wide: true,
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>`
    },
    compressor: {
      titleEn: 'Media Compressor',
      titleId: 'Kompresor Media',
      src: 'tools/media-compressor/index.html',
      wide: false,
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>`
    },
    'bg-remover': {
      titleEn: 'Background Remover',
      titleId: 'Penghapus Latar Belakang',
      src: 'tools/background-remover/index.html',
      wide: false,
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="6" r="3"></circle><circle cx="6" cy="18" r="3"></circle><line x1="20" y1="4" x2="8.12" y2="15.88"></line><line x1="14.47" y1="14.48" x2="20" y2="20"></line><line x1="8.12" y1="8.12" x2="12" y2="12"></line></svg>`
    },
    'image-to-pdf': {
      titleEn: 'Image to PDF',
      titleId: 'Gambar ke PDF',
      src: 'tools/image-to-pdf/index.html',
      wide: false,
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><rect x="3" y="11" width="18" height="10" rx="1"/><circle cx="8.5" cy="15" r="1.5"/><polyline points="21 19 16 14 11 19"/></svg>`
    },
    'pdf-to-docs': {
      titleEn: 'PDF to Docs',
      titleId: 'PDF ke Dokumen',
      src: 'tools/pdf-to-docs/index.html',
      wide: false,
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M16 18H8"/><path d="M16 12H8"/><path d="M8 6h2"/></svg>`
    },
    'pdf-compressor': {
      titleEn: 'PDF Compressor',
      titleId: 'Kompresor PDF',
      src: 'tools/pdf-compressor/index.html',
      wide: false,
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="12" y1="18" x2="12" y2="12"></line><polyline points="9 15 12 12 15 15"></polyline><line x1="9" y1="9" x2="15" y2="9"></line></svg>`
    },
    'video-to-uhd': {
      titleEn: 'UHD Video Upscaler',
      titleId: 'Peningkat Video UHD',
      src: 'tools/video-to-uhd/index.html',
      wide: false,
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>`
    },
    'watermark-remover': {
      titleEn: 'Watermark Remover',
      titleId: 'Hapus Watermark',
      src: 'tools/watermark-remover/frontend/index.html',
      wide: false,
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/><line x1="3" y1="21" x2="21" y2="3"/></svg>`
    },
    'qr-code-master': {
      titleEn: 'QR Code Master',
      titleId: 'Master Kode QR',
      src: 'tools/qr-code-master/index.html',
      wide: false,
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><rect x="9" y="9" width="6" height="6"></rect><rect x="15" y="3" width="6" height="6"></rect><rect x="3" y="15" width="6" height="6"></rect></svg>`
    },
    'ai-workflow-assistant': {
      titleEn: 'AI Workflow Assistant',
      titleId: 'Asisten Alur Kerja AI',
      src: 'tools/ai-workflow-assistant/index.html',
      ultrawide: true,
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="9" y1="9" x2="15" y2="9"></line><line x1="9" y1="13" x2="15" y2="13"></line><line x1="9" y1="17" x2="11" y2="17"></line></svg>`
    },
    'metadata-cleaner': {
      titleEn: 'Metadata Cleaner',
      titleId: 'Penghapus Metadata',
      src: 'tools/metadata-cleaner/index.html',
      wide: false,
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><circle cx="12" cy="14" r="3"></circle><line x1="12" y1="14" x2="12" y2="14.01"></line></svg>`
    },
    'web-monitor': {
      titleEn: 'Web Monitor',
      titleId: 'Pemantau Situs Web',
      src: 'yusjul-admin/index.html',
      wide: true,
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>`
    }
  };

  // --- Comprehensive Device Detection for Activity Email Notifications ---
  const detectDetailedDevice = () => {
    const ua = navigator.userAgent || '';
    const platform = (navigator.userAgentData && navigator.userAgentData.platform) || navigator.platform || '';
    const maxTouchPoints = navigator.maxTouchPoints || 0;
    const hasTouch = 'ontouchstart' in window || maxTouchPoints > 0;

    let device = 'Unknown Device';
    let os = 'Unknown';
    let type = 'desktop';

    // 1. iPhone
    if (/iPhone|iPod/i.test(ua) || /iPhone|iPod/i.test(platform)) {
      device = 'iPhone';
      os = 'iOS';
      type = 'mobile';
    }
    // 2. iPad (termasuk iPadOS 13+ desktop-class Safari)
    else if (/iPad/i.test(ua) || ((/Macintosh/i.test(ua) || /MacIntel/i.test(platform)) && maxTouchPoints > 1)) {
      device = 'iPad';
      os = 'iPadOS';
      type = 'tablet';
    }
    // 3. Android (Phone vs Tablet)
    else if (/Android/i.test(ua)) {
      os = 'Android';
      if (/Mobile/i.test(ua)) {
        device = 'Android Phone';
        type = 'mobile';
      } else {
        device = 'Android Tablet';
        type = 'tablet';
      }
    }
    // 4. Windows
    else if (/Windows NT|Windows/i.test(ua)) {
      device = (hasTouch && /Touch/i.test(ua)) ? 'Windows Laptop' : 'Windows PC';
      if (/Windows NT 10\.0/i.test(ua)) os = 'Windows 11';
      else if (/Windows NT 6\.3/i.test(ua)) os = 'Windows 8.1';
      else if (/Windows NT 6\.2/i.test(ua)) os = 'Windows 8';
      else if (/Windows NT 6\.1/i.test(ua)) os = 'Windows 7';
      else os = 'Windows';
      type = 'desktop';
    }
    // 5. macOS
    else if (/Macintosh|Mac OS X/i.test(ua) || /MacIntel/i.test(platform)) {
      device = 'MacBook';
      os = 'macOS';
      type = 'laptop';
    }
    // 6. Linux
    else if (/Linux|X11/i.test(ua)) {
      device = 'Linux';
      os = 'Linux';
      type = 'desktop';
    }

    let browser = 'Browser';
    if (/CriOS\/(\d+(\.\d+)?)/i.test(ua)) browser = 'Chrome';
    else if (/FxiOS\/(\d+(\.\d+)?)/i.test(ua)) browser = 'Firefox';
    else if (/EdgiOS\/(\d+(\.\d+)?)/i.test(ua)) browser = 'Edge';
    else if (/OPiOS\/(\d+(\.\d+)?)/i.test(ua)) browser = 'Opera';
    else if (/EdgA?\/(\d+(\.\d+)?)/i.test(ua)) browser = 'Edge';
    else if (/SamsungBrowser\/(\d+(\.\d+)?)/i.test(ua)) browser = 'Samsung Internet';
    else if (/OPR\/(\d+(\.\d+)?)|Opera/i.test(ua)) browser = 'Opera';
    else if (/Chrome\/(\d+(\.\d+)?)/i.test(ua)) browser = 'Chrome';
    else if (/Firefox\/(\d+(\.\d+)?)/i.test(ua)) browser = 'Firefox';
    else if (/Version\/(\d+(\.\d+)?).*Safari/i.test(ua) || /Safari/i.test(ua)) browser = 'Safari';

    return { device, os, browser, type };
  };

  let cachedPublicIpApp = null;
  const resolvePublicIpApp = async () => {
    if (cachedPublicIpApp) return cachedPublicIpApp;
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 2000);
      const res = await fetch('https://api.ipify.org?format=json', { signal: controller.signal });
      clearTimeout(timeout);
      if (res.ok) {
        const data = await res.json();
        if (data && data.ip) {
          cachedPublicIpApp = data.ip;
          return cachedPublicIpApp;
        }
      }
    } catch (e) {}
    return '127.0.0.1';
  };

  const trackToolLaunch = (toolKey) => {
    try {
      let data = localStorage.getItem('toolsuf_analytics');
      if (data) {
        data = JSON.parse(data);
      } else {
        data = { launchCount: {}, history: [] };
      }
      if (!data.launchCount) data.launchCount = {};
      if (!data.history) data.history = [];
      
      data.launchCount[toolKey] = (data.launchCount[toolKey] || 0) + 1;
      
      const now = new Date().toISOString();
      data.history.unshift({ tool: toolKey, time: now });
      if (data.history.length > 30) {
        data.history.pop();
      }
      localStorage.setItem('toolsuf_analytics', JSON.stringify(data));
      
      // Notify running web-monitor if iframe is active
      if (toolFrame && toolFrame.contentWindow) {
        toolFrame.contentWindow.postMessage({ type: 'syncAnalytics' }, '*');
      }

      // Kirim Notifikasi Email Penggunaan Fitur ke Admin (Beserta info Device & Fitur apa saja yang digunakan)
      const notifyAdminUsage = async () => {
        try {
          let sessionId = sessionStorage.getItem('toolsuf_app_session_id');
          if (!sessionId) {
            sessionId = 'sess-' + Math.random().toString(36).substring(2, 9) + '-' + Date.now().toString(36);
            sessionStorage.setItem('toolsuf_app_session_id', sessionId);
          }

          const devInfo = detectDetailedDevice();
          const ip = await resolvePublicIpApp();
          const toolConfig = toolsInfo[toolKey] || {};
          const toolName = currentLang === 'id' ? (toolConfig.titleId || toolKey) : (toolConfig.titleEn || toolKey);

          // Susun daftar fitur apa saja yang dia gunakan beserta frekuensinya
          const usedTools = Object.keys(data.launchCount || {}).map(k => {
            const conf = toolsInfo[k] || {};
            return {
              key: k,
              name: currentLang === 'id' ? (conf.titleId || k) : (conf.titleEn || k),
              count: data.launchCount[k] || 1
            };
          });

          const apiUrl = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
            ? 'http://localhost:3001/api/web-monitor/notify-tool-usage'
            : '/api/web-monitor/notify-tool-usage';

          fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sessionId,
              toolKey,
              toolName,
              device: devInfo.device,
              os: devInfo.os,
              browser: devInfo.browser,
              type: devInfo.type,
              ip,
              usedTools
            })
          }).catch(() => {});
        } catch (err) {
          console.warn('Gagal memicu notifikasi email penggunaan fitur:', err);
        }
      };

      notifyAdminUsage();
    } catch (e) {
      console.warn('Analytics tracking error:', e);
    }
  };

  // --- Maintenance Badge & State: inject subtle badge, update desc & disable card when in maintenance ---
  function _applyMaintenanceBadges() {
    if (typeof ToolSufMaintenance === 'undefined') return;
    const mntText = (translations[currentLang] && translations[currentLang].cardMaintenanceDesc) ||
      (currentLang === 'id'
        ? 'Fitur sedang dalam pemeliharaan. Silakan coba kembali nanti.'
        : 'Feature is currently under maintenance. Please check back later.');

    document.querySelectorAll('[data-launch]').forEach(card => {
      const toolKey = card.getAttribute('data-launch');
      if (!toolKey) return;

      const titleEl = card.querySelector('.card-title, h3, h2');
      const descEl = card.querySelector('.card-desc, p');
      let existingBadge = card.querySelector('.mnt-card-badge');

      if (ToolSufMaintenance.isMaintenanceActive(toolKey)) {
        card.classList.add('mnt-active');
        card.setAttribute('aria-disabled', 'true');
        card.setAttribute('tabindex', '-1');
        card.style.transform = 'none';

        if (!existingBadge) {
          existingBadge = document.createElement('span');
          existingBadge.className = 'mnt-card-badge';
          existingBadge.setAttribute('aria-label', 'Status: Maintenance');
          existingBadge.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg><span>MAINTENANCE</span>';
          
          if (titleEl && titleEl.parentNode === card) {
            titleEl.insertAdjacentElement('afterend', existingBadge);
          } else {
            card.appendChild(existingBadge);
          }
        }

        if (descEl) {
          if (!descEl.dataset.origI18n && descEl.getAttribute('data-i18n')) {
            descEl.dataset.origI18n = descEl.getAttribute('data-i18n');
          }
          if (!descEl.dataset.origText) {
            descEl.dataset.origText = descEl.textContent;
          }
          descEl.textContent = mntText;
          descEl.classList.add('mnt-desc');
        }
      } else {
        card.classList.remove('mnt-active');
        card.removeAttribute('aria-disabled');
        card.setAttribute('tabindex', '0');

        if (existingBadge) {
          existingBadge.remove();
        }

        if (descEl && descEl.classList.contains('mnt-desc')) {
          descEl.classList.remove('mnt-desc');
          const origKey = descEl.dataset.origI18n;
          if (origKey && translations[currentLang] && translations[currentLang][origKey]) {
            descEl.textContent = translations[currentLang][origKey];
          } else if (descEl.dataset.origText) {
            descEl.textContent = descEl.dataset.origText;
          }
        }
      }
    });
  }

  const openTool = (toolKey) => {
    const config = toolsInfo[toolKey];
    if (!config) return;

    activeTool = toolKey;
    trackToolLaunch(toolKey);

    // Set title using current language
    const title = currentLang === 'id' ? config.titleId : config.titleEn;
    macTitle.innerHTML = `${config.icon} ${title}`;

    // Size config
    if (config.ultrawide) {
      macWindow.classList.add('ultrawide');
      macWindow.classList.remove('wide');
    } else if (config.wide) {
      macWindow.classList.add('wide');
      macWindow.classList.remove('ultrawide');
    } else {
      macWindow.classList.remove('wide');
      macWindow.classList.remove('ultrawide');
    }

    // --- MAINTENANCE CHECK: Prevent tool from loading if in maintenance ---
    if (typeof ToolSufMaintenance !== 'undefined' && ToolSufMaintenance.isMaintenanceActive(toolKey)) {
      const isCurrentDark = htmlEl.classList.contains('dark') || (localStorage.getItem('theme') === 'dark');
      toolFrame.removeAttribute('src');
      toolFrame.srcdoc = ToolSufMaintenance.generateMaintenanceHTML(toolKey, {
        isDark: isCurrentDark,
        lang: currentLang,
        showHomeBtn: true,
        isModal: true
      });

      modalOverlay.classList.add('active');
      document.body.style.overflow = 'hidden';
      return; // Stop here — do not initialize tool
    }

    // Open iframe src with language param (ensure srcdoc is removed first)
    toolFrame.removeAttribute('srcdoc');
    toolFrame.src = config.src + '?lang=' + currentLang + '&t=' + Date.now();

    // Display Modal
    modalOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';

    if (toolKey === 'pdf-compressor') {
      try { history.pushState({ tool: toolKey }, '', '/pdf-compressor'); } catch (e) {}
    }
  };

  const closeTool = () => {
    modalOverlay.classList.remove('active');
    document.body.style.overflow = ''; // Unlock scroll
    
    if (window.location.pathname.includes('pdf-compressor') || window.location.search.includes('pdf-compressor') || window.location.hash.includes('pdf-compressor')) {
      try { history.pushState(null, '', '/'); } catch (e) {}
    }
    
    // Wait for animation, then clear frame src
    setTimeout(() => {
      toolFrame.removeAttribute('srcdoc');
      toolFrame.src = 'about:blank';
      activeTool = null;
    }, 300);
  };

  // Connect Click Listeners
  document.querySelectorAll('[data-launch]').forEach(card => {
    card.addEventListener('click', () => {
      const toolKey = card.getAttribute('data-launch');
      if (!toolKey) return;
      // openTool handles maintenance state internally (shows animation modal)
      openTool(toolKey);
    });
  });

  // Apply maintenance badges to tool cards on load
  _applyMaintenanceBadges();

  function _syncActiveModalMaintenance() {
    if (!modalOverlay.classList.contains('active') || !activeTool) return;
    if (typeof ToolSufMaintenance === 'undefined') return;

    const isMnt = ToolSufMaintenance.isMaintenanceActive(activeTool);
    if (isMnt) {
      const config = toolsInfo[activeTool];
      if (config) {
        const title = currentLang === 'id' ? config.titleId : config.titleEn;
        macTitle.innerHTML = `${config.icon} ${title}`;
      }
      if (closeWindowBtn) {
        const closeLabel = currentLang === 'en' ? 'Close' : 'Tutup';
        closeWindowBtn.setAttribute('title', closeLabel);
        closeWindowBtn.setAttribute('aria-label', closeLabel);
      }

      const isCurrentDark = htmlEl.classList.contains('dark') || (localStorage.getItem('theme') === 'dark');

      let syncedLive = false;
      try {
        if (toolFrame && toolFrame.contentWindow && toolFrame.hasAttribute('srcdoc')) {
          toolFrame.contentWindow.postMessage({ type: 'syncTheme', dark: isCurrentDark }, '*');
          toolFrame.contentWindow.postMessage({ type: 'syncLang', lang: currentLang }, '*');
          syncedLive = true;
        }
      } catch (e) {}

      if (!syncedLive || !toolFrame.hasAttribute('srcdoc')) {
        toolFrame.removeAttribute('src');
        toolFrame.srcdoc = ToolSufMaintenance.generateMaintenanceHTML(activeTool, {
          isDark: isCurrentDark,
          lang: currentLang,
          showHomeBtn: true,
          isModal: true
        });
      }
    } else {
      if (toolFrame.hasAttribute('srcdoc')) {
        const config = toolsInfo[activeTool];
        if (config) {
          toolFrame.removeAttribute('srcdoc');
          toolFrame.src = config.src + '?lang=' + currentLang + '&t=' + Date.now();
        }
      }
    }
  }

  // Listen for maintenance config changes (e.g. from admin panel or other tabs)
  window.addEventListener('toolsuf-maintenance-changed', () => {
    _applyMaintenanceBadges();
    _syncActiveModalMaintenance();
  });
  window.addEventListener('storage', (e) => {
    if (e.key === 'toolsuf_maintenance') {
      _applyMaintenanceBadges();
      _syncActiveModalMaintenance();
    }
  });
  try {
    if ('BroadcastChannel' in window) {
      const modalBc = new BroadcastChannel('toolsuf_maintenance_channel');
      modalBc.onmessage = () => {
        _applyMaintenanceBadges();
        _syncActiveModalMaintenance();
      };
    }
  } catch (err) {}


  // Close handlers
  closeWindowBtn.addEventListener('click', closeTool);
  
  // Close on backdrop click
  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) closeTool();
  });

  // ESC key press to close modal
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modalOverlay.classList.contains('active')) {
      closeTool();
    }
    // Ctrl + Shift + M to open Web Monitor
    if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'm') {
      e.preventDefault();
      openTool('web-monitor');
    }
  });

  // Direct route detection and popstate handling
  window.addEventListener('popstate', async () => {
    if (typeof ToolSufMaintenance !== 'undefined' && ToolSufMaintenance.fetchStatus) {
      try { await ToolSufMaintenance.fetchStatus(); } catch (e) {}
    }
    _applyMaintenanceBadges();

    if (window.location.pathname.includes('pdf-compressor')) {
      openTool('pdf-compressor');
    } else if (modalOverlay.classList.contains('active')) {
      closeTool();
    }
  });

  const handleInitialRoute = async () => {
    try {
      // 1. Ambil status maintenance terbaru dari server sebelum route guard
      if (typeof ToolSufMaintenance !== 'undefined' && ToolSufMaintenance.fetchStatus) {
        try {
          await ToolSufMaintenance.fetchStatus();
        } catch (e) {}
      }
      _applyMaintenanceBadges();

      const initPath = window.location.pathname.toLowerCase();
      const initQuery = new URLSearchParams(window.location.search).get('tool');
      const initHash = window.location.hash.toLowerCase().replace('#', '');

      if (initPath.includes('yusjul-admin')) {
        const base = window.location.pathname.replace(/\/yusjul-admin.*$/, '').replace(/\/$/, '');
        window.location.replace((base || '') + '/yusjul-admin/');
        return;
      }

      if (initQuery && toolsInfo[initQuery]) {
        openTool(initQuery);
      } else if (initHash && toolsInfo[initHash]) {
        openTool(initHash);
      } else if (initPath.includes('pdf-compressor')) {
        openTool('pdf-compressor');
      }
    } catch (e) {}
  };

  handleInitialRoute();

  // Handle "Coming Soon" tool cards
  document.querySelectorAll('.coming-soon').forEach(card => {
    card.addEventListener('click', () => {
      showToast(translations[currentLang].toastComingSoon);
    });
  });

  // Add 3D Tilt Effect to Folder Cards (disabled for cards under maintenance)
  const folderCards = document.querySelectorAll('.tool-card, .feature-item');
  folderCards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      if (card.classList.contains('mnt-active')) {
        card.style.transform = 'none';
        return;
      }
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      
      // Calculate tilt angles (max 10 degrees)
      const tiltX = ((centerY - y) / centerY) * 10;
      const tiltY = ((x - centerX) / centerX) * -10; // Invert to follow cursor correctly
      
      card.style.transform = `perspective(800px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) translateY(-4px) scale(1.02)`;
    });
    
    card.addEventListener('mouseleave', () => {
      card.style.transform = card.classList.contains('mnt-active')
        ? 'none'
        : 'perspective(800px) rotateX(0deg) rotateY(0deg) translateY(0) scale(1)';
    });
  });

  // Initialize Three.js Parallax Background
  if (typeof THREE !== 'undefined') {
    initHeroThreeJS();
  }
});

function initHeroThreeJS() {
  const canvas = document.getElementById('heroCanvas');
  if (!canvas) return;

  // Since canvas is fixed at viewport level, size it to the window
  let width = window.innerWidth;
  let height = window.innerHeight;

  // Scene
  const scene = new THREE.Scene();

  // Camera
  const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
  camera.position.z = 240;
  camera.position.y = 80;
  camera.lookAt(0, 0, 0);

  // Renderer
  const renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  // Lights
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.25);
  scene.add(ambientLight);

  const light1 = new THREE.PointLight(0x007AFF, 8, 450); // Blue
  const light2 = new THREE.PointLight(0x30D158, 6, 450); // Green/Purple
  const light3 = new THREE.PointLight(0xBF5AF2, 4, 350); // Pink/Purple
  
  scene.add(light1);
  scene.add(light2);
  scene.add(light3);

  // 3D Wave Mesh Geometry (Topographical waves)
  const planeWidth = 1000;
  const planeHeight = 1000;
  const segments = 60;
  const geometry = new THREE.PlaneGeometry(planeWidth, planeHeight, segments, segments);
  
  // Rotate plane so it lies horizontally
  geometry.rotateX(-Math.PI / 2.2);

  // Material setup based on theme
  const getThemeConfig = () => {
    const isDark = document.documentElement.classList.contains('dark');
    return {
      meshColor: isDark ? 0x636366 : 0xD1D1D6, // Medium gray in dark mode to reflect light beautifully
      opacity: isDark ? 0.32 : 0.26, // Slightly higher opacity in dark mode
      light1Color: isDark ? 0x0A84FF : 0x0056CC, // Neon Blue / Deep Blue
      light2Color: isDark ? 0x30D158 : 0x5856D6, // Neon Green / Purple
      light3Color: isDark ? 0xBF5AF2 : 0xFF2D55, // Purple / Pink
      ambientIntensity: isDark ? 0.45 : 0.8, // Brighter ambient in dark mode
      light1Intensity: isDark ? 16 : 7, // Higher point light intensities to illuminate wireframe
      light2Intensity: isDark ? 13 : 6,
      light3Intensity: isDark ? 11 : 4
    };
  };

  let themeConfig = getThemeConfig();

  // Mesh Material (Standard wireframe responding to PointLights)
  const waveMaterial = new THREE.MeshStandardMaterial({
    color: themeConfig.meshColor,
    wireframe: true,
    transparent: true,
    opacity: themeConfig.opacity,
    roughness: 0.15,
    metalness: 0.95
  });

  const waveMesh = new THREE.Mesh(geometry, waveMaterial);
  waveMesh.position.y = -60;
  scene.add(waveMesh);

  // --- Theme-related floating wireframe shapes (Representing personal tools) ---
  const shapeMaterial = new THREE.MeshStandardMaterial({
    color: themeConfig.meshColor,
    wireframe: true,
    transparent: true,
    opacity: themeConfig.opacity * 0.9,
    roughness: 0.2,
    metalness: 0.9
  });

  // Torus/Gear -> representing settings, operations, tools
  const torusGeo = new THREE.TorusGeometry(38, 9, 8, 24);
  const torus = new THREE.Mesh(torusGeo, shapeMaterial);
  torus.position.set(-240, 20, -120);
  scene.add(torus);

  // Octahedron/Diamond -> representing AI algorithms, precision
  const octaGeo = new THREE.OctahedronGeometry(28);
  const octa = new THREE.Mesh(octaGeo, shapeMaterial);
  octa.position.set(220, 60, -80);
  scene.add(octa);

  // Box/Cube -> representing folders, renamer, file blocks
  const boxGeo = new THREE.BoxGeometry(45, 45, 45);
  const box = new THREE.Mesh(boxGeo, shapeMaterial);
  box.position.set(-180, 90, 60);
  scene.add(box);

  // Cylinder/Cone -> representing compression, media filters
  const coneGeo = new THREE.ConeGeometry(24, 48, 4);
  const cone = new THREE.Mesh(coneGeo, shapeMaterial);
  cone.position.set(200, -10, 40);
  scene.add(cone);

  // Floating Stars (Particles)
  const starCount = 140;
  const starPositions = new Float32Array(starCount * 3);
  for (let i = 0; i < starCount; i++) {
    starPositions[i * 3] = (Math.random() - 0.5) * 900;      // X
    starPositions[i * 3 + 1] = Math.random() * 160 - 30;     // Y (floating above wave)
    starPositions[i * 3 + 2] = (Math.random() - 0.5) * 900;  // Z
  }

  const starGeometry = new THREE.BufferGeometry();
  starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));

  const createCircleTexture = () => {
    const size = 16;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    grad.addColorStop(0.4, 'rgba(255, 255, 255, 0.4)');
    grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
    return new THREE.CanvasTexture(canvas);
  };

  const starMaterial = new THREE.PointsMaterial({
    size: 4.5,
    color: 0xffffff,
    transparent: true,
    opacity: 0.55,
    map: createCircleTexture(),
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });

  const stars = new THREE.Points(starGeometry, starMaterial);
  scene.add(stars);

  // Set light & material properties from theme configuration
  const applyThemeSettings = (config) => {
    ambientLight.intensity = config.ambientIntensity;
    light1.color.setHex(config.light1Color);
    light1.intensity = config.light1Intensity;
    light2.color.setHex(config.light2Color);
    light2.intensity = config.light2Intensity;
    light3.color.setHex(config.light3Color);
    light3.intensity = config.light3Intensity;
    
    // Update materials
    waveMaterial.color.setHex(config.meshColor);
    waveMaterial.opacity = config.opacity;
    shapeMaterial.color.setHex(config.meshColor);
    shapeMaterial.opacity = config.opacity * 0.9;
  };

  applyThemeSettings(themeConfig);

  // Mouse Interaction Parallax variables
  let mouseX = 0;
  let mouseY = 0;
  let targetCameraX = 0;
  let targetCameraY = 80;
  let baseCameraZ = 240;

  const onMouseMove = (e) => {
    const normX = (e.clientX / window.innerWidth) * 2 - 1;
    const normY = (e.clientY / window.innerHeight) * 2 - 1;

    targetCameraX = normX * 90;
    targetCameraY = 80 + normY * 45;
  };

  window.addEventListener('mousemove', onMouseMove);

  // Scroll Parallax Logic
  let scrollPercent = 0;
  const onScroll = () => {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
    scrollPercent = scrollHeight > 0 ? scrollTop / scrollHeight : 0;
  };
  window.addEventListener('scroll', onScroll);

  // Dynamic Theme Switch Listener
  window.addEventListener('theme-changed', () => {
    themeConfig = getThemeConfig();
    applyThemeSettings(themeConfig);
  });

  // Animation Loop
  let frame = 0;
  const animate = () => {
    requestAnimationFrame(animate);

    frame += 0.006; // wave propagation speed

    // Update Plane vertices (undulating topography)
    const pos = geometry.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      
      // Multi-frequency wave calculation (sine & cosine combination)
      const zValue = Math.sin(x * 0.007 + frame) * 28 + 
                     Math.cos(y * 0.007 + frame * 0.75) * 28 + 
                     Math.sin((x + y) * 0.004 + frame * 1.2) * 14;
      
      pos.setZ(i, zValue);
    }
    pos.needsUpdate = true;

    // Orbit point lights around center to cast sweeping glowing colors
    light1.position.x = Math.sin(frame * 0.6) * 380;
    light1.position.z = Math.cos(frame * 0.4) * 380;
    light1.position.y = 50 + Math.sin(frame * 0.2) * 40;

    light2.position.x = Math.cos(frame * 0.5) * 380;
    light2.position.z = Math.sin(frame * 0.8) * 380;
    light2.position.y = 40 + Math.cos(frame * 0.3) * 30;

    light3.position.x = Math.sin(frame * 0.3) * 280;
    light3.position.z = Math.cos(frame * 0.6) * 280;
    light3.position.y = 30 + Math.sin(frame * 0.7) * 30;

    // Rotate and drift floating "tools theme" wireframe shapes
    torus.rotation.x += 0.004;
    torus.rotation.y += 0.008;
    torus.position.y = 20 + Math.sin(frame * 0.4) * 12;

    octa.rotation.y += 0.006;
    octa.rotation.z += 0.003;
    octa.position.y = 60 + Math.cos(frame * 0.3) * 15;

    box.rotation.x += 0.005;
    box.rotation.y += 0.005;
    box.position.y = 90 + Math.sin(frame * 0.5) * 10;

    cone.rotation.x += 0.003;
    cone.rotation.z += 0.006;
    cone.position.y = -10 + Math.cos(frame * 0.2) * 8;

    // Slowly drift the stars (particles)
    const starPos = starGeometry.attributes.position.array;
    for (let i = 0; i < starCount; i++) {
      starPos[i * 3 + 1] += Math.sin(frame * 0.4 + i) * 0.05; // Y drift
      starPos[i * 3] += Math.cos(frame * 0.15 + i) * 0.02;    // X drift
    }
    starGeometry.attributes.position.needsUpdate = true;

    // Rotate systems
    stars.rotation.y = frame * 0.015;

    // Scroll parallax translation offsets
    // Camera travels deeper (Z reduces) and tilts down (Y reduces) on scroll down
    const scrollZOffset = scrollPercent * -130;  // zooms camera forward
    const scrollYOffset = scrollPercent * -70;   // translates camera downward
    const scrollXOffset = scrollPercent * 30;    // slight horizontal pan
    const scrollRotation = scrollPercent * Math.PI * 0.15; // rotate scene on scroll

    // Apply scroll rotation to the waves and shapes
    waveMesh.rotation.y = frame * 0.005 + scrollRotation;
    torus.rotation.y = frame * 0.008 + scrollRotation;
    octa.rotation.y = frame * 0.006 + scrollRotation;
    box.rotation.y = frame * 0.005 + scrollRotation;
    cone.rotation.y = frame * 0.006 + scrollRotation;

    // Slow camera auto-drift for mobile and static desktop viewports
    const aspect = window.innerWidth / window.innerHeight;
    const driftScale = aspect < 1 ? 0.6 : 1;
    const autoDriftX = Math.sin(frame * 0.4) * 20 * driftScale;
    const autoDriftY = Math.cos(frame * 0.3) * 12 * driftScale;

    // Smooth camera ease for parallax effect (Mouse + Drift + Scroll)
    camera.position.x += ((targetCameraX + autoDriftX + scrollXOffset) - camera.position.x) * 0.04;
    camera.position.y += ((targetCameraY + autoDriftY + scrollYOffset) - camera.position.y) * 0.04;
    camera.position.z += ((baseCameraZ + scrollZOffset) - camera.position.z) * 0.04;
    camera.lookAt(0, scrollYOffset * 0.5, 0);

    renderer.render(scene, camera);
  };

  const adjustLayoutForAspect = () => {
    const aspect = window.innerWidth / window.innerHeight;
    if (aspect < 1) {
      // Mobile / Portrait: Scale camera distance and bring shapes dynamically inside the frustum boundary
      baseCameraZ = 280;
      
      // Visible half-width at Z = 0 is baseCameraZ * tan(30 deg) * aspect = 280 * 0.577 * aspect = 161 * aspect.
      // We target placing shapes at ~75% of this boundary so they are perfectly framed on the screen sides.
      const targetHalfWidth = 161 * aspect * 0.75;
      
      torus.position.x = -targetHalfWidth * 1.1; // offset slightly for deep Z positioning
      box.position.x = -targetHalfWidth * 0.8;
      octa.position.x = targetHalfWidth * 1.05;
      cone.position.x = targetHalfWidth * 0.85;
    } else {
      // Desktop / Landscape: default positions
      baseCameraZ = 240;
      torus.position.x = -240;
      box.position.x = -180;
      octa.position.x = 220;
      cone.position.x = 200;
    }
  };

  adjustLayoutForAspect();

  // Resize Handler
  const onResize = () => {
    width = window.innerWidth;
    height = window.innerHeight;
    camera.aspect = width / height;
    adjustLayoutForAspect();
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  };
  window.addEventListener('resize', onResize);

  animate();
}

// Register PWA Service Worker for offline capability
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js')
      .then((reg) => console.log('Service Worker registered successfully:', reg.scope))
      .catch((err) => console.error('Service Worker registration failed:', err));
  });
}

// Handle Cinematic Splash Screen Loader
window.addEventListener('load', () => {
  const loader = document.getElementById('appLoader');
  if (loader) {
    setTimeout(() => {
      loader.classList.add('fade-out');
      document.body.classList.add('content-ready'); // Trigger staggered content entrance!
      setTimeout(() => {
        loader.remove();
      }, 500);
    }, 1600);
  } else {
    document.body.classList.add('content-ready');
  }
});

// ─────────────────────────────────────────────────────────────────────────
// GLOBAL JOB UI — Inisialisasi Job Center setelah DOM ready
// ─────────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  if (window.GlobalJobUI) {
    GlobalJobUI.init();
  }
});

