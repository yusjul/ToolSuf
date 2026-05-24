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
      toolAiDesc: 'Intelligent automation for repetitive tasks.',
      toolCompressDesc: 'Lossless compression with minimal UI.',
      copyright: '© 2026 ToolSuf. Precision-crafted for power users.',
      privacy: 'Privacy Policy',
      terms: 'Terms of Service',
      status: 'Status',
      closeBtn: 'Close Window',
      iframeTitle: 'Integrated Productivity Tool',
      toolPassTitle: 'Password Generator',
      toolRenameTitle: 'Batch Renamer Pro',
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
      toolAiDesc: 'Otomatisasi cerdas untuk tugas-tugas berulang.',
      toolCompressDesc: 'Kompresi lossless dengan antarmuka minimalis.',
      copyright: '© 2026 ToolSuf. Dibuat presisi untuk pengguna ahli.',
      privacy: 'Kebijakan Privasi',
      terms: 'Ketentuan Layanan',
      status: 'Status',
      closeBtn: 'Tutup Jendela',
      iframeTitle: 'Alat Produktivitas Terintegrasi',
      toolPassTitle: 'Generator Kata Sandi',
      toolRenameTitle: 'Pengganti Nama File Pro',
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
    syncIframeTheme();
  };

  // Sync theme inside iframe
  const syncIframeTheme = () => {
    if (toolFrame && toolFrame.contentWindow) {
      try {
        if (typeof toolFrame.contentWindow.syncTheme === 'function') {
          toolFrame.contentWindow.syncTheme(isDark);
        } else if (toolFrame.contentWindow.document && toolFrame.contentWindow.document.documentElement) {
          const frameHtml = toolFrame.contentWindow.document.documentElement;
          frameHtml.className = isDark ? 'dark' : 'light';
        }
      } catch (e) {
        console.warn('Iframe theme sync issue', e);
      }
    }
  };

  // Sync language inside iframe
  const syncIframeLang = () => {
    if (toolFrame && toolFrame.contentWindow) {
      try {
        if (typeof toolFrame.contentWindow.syncLang === 'function') {
          toolFrame.contentWindow.syncLang(currentLang);
        }
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

  // Sync theme AND language on iframe loaded
  toolFrame.addEventListener('load', () => {
    syncIframeTheme();
    syncIframeLang();
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
      closeWindowBtn.setAttribute('title', translations[lang].closeBtn);
      closeWindowBtn.setAttribute('aria-label', translations[lang].closeBtn);
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

  // Apply initial language
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
      src: 'apple_password_generator.html',
      wide: false,
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>`
    },
    renamer: {
      titleEn: 'Batch Renamer Pro',
      titleId: 'Pengganti Nama File Pro',
      src: 'batch_renamer_v3_full.html',
      wide: true,
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>`
    }
  };

  const openTool = (toolKey) => {
    const config = toolsInfo[toolKey];
    if (!config) return;

    activeTool = toolKey;

    // Set title using current language
    const title = currentLang === 'id' ? config.titleId : config.titleEn;
    macTitle.innerHTML = `${config.icon} ${title}`;

    // Size config
    if (config.wide) {
      macWindow.classList.add('wide');
    } else {
      macWindow.classList.remove('wide');
    }

    // Open iframe src
    toolFrame.src = config.src;

    // Display Modal
    modalOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  };

  const closeTool = () => {
    modalOverlay.classList.remove('active');
    document.body.style.overflow = ''; // Unlock scroll
    
    // Wait for animation, then clear frame src
    setTimeout(() => {
      toolFrame.src = 'about:blank';
      activeTool = null;
    }, 300);
  };

  // Connect Click Listeners
  document.querySelectorAll('[data-launch]').forEach(card => {
    card.addEventListener('click', (e) => {
      const toolKey = card.getAttribute('data-launch');
      if (toolKey) openTool(toolKey);
    });
  });

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
  });

  // Handle "Coming Soon" tool cards
  document.querySelectorAll('.coming-soon').forEach(card => {
    card.addEventListener('click', () => {
      showToast(translations[currentLang].toastComingSoon);
    });
  });
});
