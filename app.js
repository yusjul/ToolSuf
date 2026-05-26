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
      closeBtn: 'Close Window',
      iframeTitle: 'Integrated Productivity Tool',
      toolPassTitle: 'Password Generator',
      toolRenameTitle: 'Batch Renamer Pro',
      toolImgToPdfTitle: 'Image to PDF',
      toolPdfToDocsTitle: 'PDF to Docs',
      toolVideoToUhdTitle: 'Video to UHD',
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
      toolAiTitle: 'AI Workflow Assistant',
      toolAiDesc: 'Otomatisasi cerdas untuk tugas-tugas berulang.',
      mediaBadge: 'Media',
      toolCompressTitle: 'Kompresor Media',
      toolCompressDesc: 'Kompres gambar dengan perbandingan sebelum/sesudah.',
      documentBadge: 'Dokumen',
      toolBgRemoverTitle: 'Penghapus Latar',
      toolImgToPdfTitle: 'Gambar ke PDF',
      toolPdfToDocsTitle: 'PDF ke Dokumen',
      toolVideoToUhdTitle: 'Video ke UHD',
      toolBgRemoverDesc: 'Hapus latar belakang gambar secara offline dengan AI browser.',
      toolImgToPdfDesc: 'Konversi gambar ke PDF dengan antarmuka bergaya Apple.',
      toolPdfToDocsDesc: 'Konversi PDF ke dokumen Word dengan antarmuka bergaya Apple.',
      toolVideoToUhdDesc: 'Tingkatkan resolusi video ke UHD 4K dengan antarmuka bergaya Apple.',
      toolWatermarkTitle: 'Hapus Watermark Video',
      toolWatermarkDesc: 'Hapus watermark video dengan deteksi manual atau otomatis.',
      toolQrTitle: 'QR Code Master',
      toolQrDesc: 'Buat dan pindai QR Code kustom dengan antarmuka premium bergaya Apple.',
      toolMetaTitle: 'Metadata Cleaner',
      toolMetaDesc: 'Hapus metadata EXIF dan lokasi GPS dari gambar secara lokal.',
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
    window.dispatchEvent(new Event('theme-changed'));
  };

  // Sync theme inside iframe via postMessage (reliable cross-origin)
  const syncIframeTheme = () => {
    if (toolFrame && toolFrame.contentWindow) {
      try {
        toolFrame.contentWindow.postMessage({ type: 'syncTheme', dark: isDark }, '*');
        // Legacy fallback for tools without postMessage listener
        if (typeof toolFrame.contentWindow.syncTheme === 'function') {
          toolFrame.contentWindow.syncTheme(isDark);
        }
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
        // Legacy fallback
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

  // Sync theme and language on iframe loaded
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
    'video-to-uhd': {
      titleEn: 'Video to UHD',
      titleId: 'Video ke UHD',
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
      titleId: 'QR Code Master',
      src: 'tools/qr-code-master/index.html',
      wide: false,
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><rect x="9" y="9" width="6" height="6"></rect><rect x="15" y="3" width="6" height="6"></rect><rect x="3" y="15" width="6" height="6"></rect></svg>`
    },
    'ai-workflow-assistant': {
      titleEn: 'AI Workflow Assistant',
      titleId: 'AI Workflow Assistant',
      src: 'tools/ai-workflow-assistant/index.html',
      wide: false,
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="9" y1="9" x2="15" y2="9"></line><line x1="9" y1="13" x2="15" y2="13"></line><line x1="9" y1="17" x2="11" y2="17"></line></svg>`
    },
    'metadata-cleaner': {
      titleEn: 'Metadata Cleaner',
      titleId: 'Penghapus Metadata',
      src: 'tools/metadata-cleaner/index.html',
      wide: false,
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><circle cx="12" cy="14" r="3"></circle><line x1="12" y1="14" x2="12" y2="14.01"></line></svg>`
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

    // Open iframe src with language param
    toolFrame.src = config.src + '?lang=' + currentLang;

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

  // Add 3D Tilt Effect to Folder Cards
  const folderCards = document.querySelectorAll('.tool-card, .feature-item');
  folderCards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
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
      card.style.transform = 'perspective(800px) rotateX(0deg) rotateY(0deg) translateY(0) scale(1)';
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
