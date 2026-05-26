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
    title: 'Metadata Cleaner',
    subtitle: 'Penghapus EXIF & Alat Privasi Offline',
    statusActive: 'DIKEMBANGKAN',
    statusText: 'Fitur ini sedang dalam pengembangan aktif dan akan segera hadir dengan fungsionalitas penuh.',
    inspectorPreview: 'PRATINJAU INSPEKTUR METADATA',
    lblCamera: 'Kamera:',
    lblDate: 'Tanggal:',
    lblLocation: 'Lokasi GPS:',
    warningMsg: 'GPS terdeteksi! Siap dibersihkan.',
    plannedFeatures: 'FITUR YANG DIRENCANAKAN',
    feat1Title: 'Hapus GPS & Info Kamera',
    feat1Desc: 'Hapus koordinat lokasi GPS sensitif, nama kamera, pengaturan ISO, dan tanggal pengambilan gambar secara instan.',
    feat2Title: 'Kompresi Bebas Kerugian',
    feat2Desc: 'Membersihkan file gambar tanpa melakukan kompresi ulang piksel gambar, menjaga kualitas foto 100% utuh.',
    feat3Title: 'Penghapusan Massal & ZIP',
    feat3Desc: 'Unggah puluhan gambar sekaligus, bersihkan bersama-sama, dan unduh hasilnya dalam satu file ZIP yang ringkas.',
    privacyText: 'Pemrosesan 100% Offline Lokal. Data Anda Aman.'
  },
  en: {
    title: 'Metadata Cleaner',
    subtitle: 'Offline EXIF Stripper & Privacy Suite',
    statusActive: 'UNDER DEVELOPMENT',
    statusText: 'This feature is currently in active development and will be available soon with full functionality.',
    inspectorPreview: 'METADATA INSPECTOR PREVIEW',
    lblCamera: 'Camera:',
    lblDate: 'Captured:',
    lblLocation: 'GPS Location:',
    warningMsg: 'GPS detected! Ready to be cleaned.',
    plannedFeatures: 'PLANNED FEATURES',
    feat1Title: 'Strip GPS & Camera Tags',
    feat1Desc: 'Remove sensitive GPS coordinates, camera model names, ISO settings, and capture times instantly.',
    feat2Title: 'Lossless Cleaning',
    feat2Desc: 'Clean images without re-compressing pixels, keeping original image quality 100% intact.',
    feat3Title: 'Bulk Stripper & ZIP',
    feat3Desc: 'Upload multiple photos at once, clean them in one go, and download as a single ZIP file.',
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
