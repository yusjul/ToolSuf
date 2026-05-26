(function() {
  try {
    var p = window.parent.document.documentElement;
    if (p.classList.contains('dark')) { document.documentElement.classList.add('dark'); }
    else { document.documentElement.classList.add('light'); }
  } catch(e) { document.documentElement.classList.add('light'); }
  var lang = new URLSearchParams(window.location.search).get('lang');
  window.__initialLang = lang === 'en' ? 'en' : 'id';
})();

const translations = {
  id: {
    title: 'QR Code Master',
    subtitle: 'Suite QR Code Premium, Cepat & Offline',
    statusActive: 'DIKEMBANGKAN',
    statusText: 'Fitur ini sedang dalam pengembangan aktif dan akan segera hadir dengan fungsionalitas penuh.',
    plannedFeatures: 'FITUR YANG DIRENCANAKAN',
    feat1Title: 'Link, Wi-Fi & vCard',
    feat1Desc: 'Ubah link, info kontak kartu nama, teks, atau detail jaringan Wi-Fi Anda menjadi kode QR sekali klik.',
    feat2Title: 'Desain Bulat & Gradasi',
    feat2Desc: 'Sesuaikan piksel QR menjadi bulat organik, beri warna gradasi indah, dan tambahkan bingkai khusus.',
    feat3Title: 'Sisipkan Logo Kustom',
    feat3Desc: 'Unggah gambar logo Anda sendiri untuk ditaruh di tengah QR Code dengan penyesuaian koreksi error otomatis.',
    feat4Title: 'Pemindai Kamera & File',
    feat4Desc: 'Scan langsung menggunakan kamera laptop/HP Anda, atau cukup unggah tangkapan layar gambar QR Code.',
    privacyText: 'Pemrosesan 100% Offline Lokal. Data Anda Aman.'
  },
  en: {
    title: 'QR Code Master',
    subtitle: 'Premium, Fast & Offline QR Code Suite',
    statusActive: 'UNDER DEVELOPMENT',
    statusText: 'This feature is currently in active development and will be available soon with full functionality.',
    plannedFeatures: 'PLANNED FEATURES',
    feat1Title: 'Link, Wi-Fi & vCard',
    feat1Desc: 'Convert links, contact cards, plain text, or Wi-Fi login details into a QR code with a single click.',
    feat2Title: 'Rounded Pixels & Gradients',
    feat2Desc: 'Customize QR dots to be organically rounded, apply gorgeous color gradients, and add neat frames.',
    feat3Title: 'Custom Logo Insertion',
    feat3Desc: 'Upload your own logo to center in the QR Code with automatic error correction adjustments.',
    feat4Title: 'Webcam & File Decoder',
    feat4Desc: 'Scan QR codes live using your camera, or simply drag and drop screenshots of QR codes to decode.',
    privacyText: '100% Offline Local Processing. Your Data is Secure.'
  }
};

let currentLang = 'id';

function applyLang(lang) {
  currentLang = lang;
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (translations[lang] && translations[lang][key]) {
      el.textContent = translations[lang][key];
    }
  });
}

window.syncTheme = function(dark) {
  const htmlEl = document.documentElement;
  htmlEl.classList.toggle('dark', !!dark);
  htmlEl.classList.toggle('light', !dark);
};

window.syncLang = function(lang) {
  if (!translations[lang]) return;
  applyLang(lang);
};

window.addEventListener('message', function(e) {
  if (e.data && e.data.type === 'syncTheme' && typeof window.syncTheme === 'function') {
    window.syncTheme(e.data.dark);
  }
  if (e.data && e.data.type === 'syncLang' && typeof window.syncLang === 'function') {
    window.syncLang(e.data.lang);
  }
});

document.addEventListener('DOMContentLoaded', () => {
  if (window.__initialLang) applyLang(window.__initialLang);
});
