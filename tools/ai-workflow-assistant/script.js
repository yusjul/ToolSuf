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
    title: 'AI Workflow Assistant',
    subtitle: 'Rantai Prompt Visual & Otomatisasi AI Lokal',
    statusActive: 'DIKEMBANGKAN',
    statusText: 'Fitur ini sedang dalam pengembangan aktif dan akan segera hadir dengan fungsionalitas penuh.',
    canvasPreview: 'PRATINJAU KANVAS ALUR KERJA',
    plannedFeatures: 'FITUR YANG DIRENCANAKAN',
    feat1Title: 'Kanvas Node Visual',
    feat1Desc: 'Hubungkan pemicu, templat prompt, dan model AI secara visual dengan tautan simpul (node) yang intuitif.',
    feat2Title: 'Eksekusi LLM Lokal',
    feat2Desc: 'Jalankan inferensi AI yang mengutamakan privasi langsung di browser Anda menggunakan akselerasi WebGPU lokal.',
    feat3Title: 'Parser Dokumen & File',
    feat3Desc: 'Unggah file PDF, Word, atau teks untuk mengekstrak konteks dan memasukkannya ke dalam rantai alur kerja AI Anda.',
    feat4Title: 'Integrasi API & Endpoint Kustom',
    feat4Desc: 'Hubungkan endpoint lokal kustom eksternal seperti Ollama, LM Studio, atau OpenAI API secara aman.',
    privacyText: 'Pemrosesan 100% Offline Lokal. Data Anda Aman.'
  },
  en: {
    title: 'AI Workflow Assistant',
    subtitle: 'Visual Prompt Chains & Local AI Automation',
    statusActive: 'UNDER DEVELOPMENT',
    statusText: 'This feature is currently in active development and will be available soon with full functionality.',
    canvasPreview: 'WORKFLOW CANVAS PREVIEW',
    plannedFeatures: 'PLANNED FEATURES',
    feat1Title: 'Visual Node Canvas',
    feat1Desc: 'Connect triggers, prompt templates, and AI models visually with intuitive node links.',
    feat2Title: 'Local LLM Execution',
    feat2Desc: 'Run privacy-first inference directly in your browser using local WebGPU acceleration.',
    feat3Title: 'Document & File Parser',
    feat3Desc: 'Upload PDF, Word, or text files to extract context and feed them into your AI chains.',
    feat4Title: 'Custom Endpoint Integrations',
    feat4Desc: 'Hook up your own external local endpoints like Ollama, LM Studio, or OpenAI API securely.',
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
