(function() {
  try {
    var p = window.parent.document.documentElement;
    if (p.classList.contains('dark')) { document.documentElement.classList.add('dark'); }
    else { document.documentElement.classList.add('light'); }
  } catch(e) { document.documentElement.classList.add('light'); }
  var lang = new URLSearchParams(window.location.search).get('lang');
  window.__initialLang = lang === 'en' ? 'en' : 'id';
})();

let currentPassword = '';

function getOptions() {
  return {
    length: parseInt(document.getElementById('lengthSlider').value),
    upper: document.getElementById('toggleUpper').classList.contains('on'),
    lower: document.getElementById('toggleLower').classList.contains('on'),
    num: document.getElementById('toggleNum').classList.contains('on'),
    sym: document.getElementById('toggleSym').classList.contains('on'),
  };
}

function buildCharset(opts) {
  let c = '';
  if (opts.upper) c += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  if (opts.lower) c += 'abcdefghijklmnopqrstuvwxyz';
  if (opts.num) c += '0123456789';
  if (opts.sym) c += '!@#$%^&*()-_=+[]{}|;:,.<>?';
  return c;
}

function generatePassword() {
  const opts = getOptions();
  const charset = buildCharset(opts);
  if (!charset) {
    document.getElementById('passwordDisplay').textContent = 'Pilih minimal satu opsi';
    clearStrength();
    return;
  }
  const arr = new Uint32Array(opts.length);
  crypto.getRandomValues(arr);
  let pwd = '';
  for (let i = 0; i < opts.length; i++) {
    pwd += charset[arr[i] % charset.length];
  }
  currentPassword = pwd;

  const el = document.getElementById('passwordDisplay');
  el.classList.add('fading');
  setTimeout(() => {
    el.textContent = pwd;
    el.classList.remove('fading');
    updateStrength(pwd, opts);
  }, 150);
}

function updateStrength(pwd, opts) {
  let score = 0;
  if (pwd.length >= 12) score++;
  if (pwd.length >= 20) score++;
  const types = [opts.upper, opts.lower, opts.num, opts.sym].filter(Boolean).length;
  score += Math.min(types - 1, 2);

  const labels = ['', 'Lemah', 'Sedang', 'Kuat', 'Sangat Kuat'];
  const classes = ['', 'filled-weak', 'filled-fair', 'filled-strong', 'filled-very-strong'];
  const filled = Math.max(1, Math.min(score, 4));

  for (let i = 1; i <= 4; i++) {
    const seg = document.getElementById('s' + i);
    seg.className = 'strength-seg';
    if (i <= filled) seg.classList.add(classes[filled]);
  }
  document.getElementById('strengthLabel').textContent = labels[filled];
}

function clearStrength() {
  for (let i = 1; i <= 4; i++) {
    document.getElementById('s' + i).className = 'strength-seg';
  }
  document.getElementById('strengthLabel').textContent = '';
}

function updateLength(val) {
  document.getElementById('lengthVal').textContent = val;
  const slider = document.getElementById('lengthSlider');
  const pct = ((val - slider.min) / (slider.max - slider.min)) * 100;
  slider.style.background = `linear-gradient(to right, #007AFF ${pct}%, var(--apple-secondary-bg) ${pct}%)`;
}

// Keep variables in sync with parent dashboard theme
window.syncTheme = function(dark) {
  const htmlEl = document.documentElement;
  htmlEl.classList.toggle('dark', !!dark);
  htmlEl.classList.toggle('light', !dark);
  const slider = document.getElementById('lengthSlider');
  if (slider) {
    updateLength(slider.value);
  }
}

function toggleOpt(btn) {
  btn.classList.toggle('on');
  const isOn = btn.classList.contains('on');
  btn.setAttribute('aria-checked', isOn);
}

async function copyPassword() {
  if (!currentPassword) return;
  try {
    await navigator.clipboard.writeText(currentPassword);
  } catch(e) {
    const ta = document.createElement('textarea');
    ta.value = currentPassword;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
  }
  const toast = document.getElementById('toast');
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2200);
}

// ===== Language Sync from Parent Dashboard =====
const toolTranslations = {
  id: {
    passwordLabel:'Kata sandi Anda',
    placeholder:  'Tekan "Buat Baru" untuk memulai',
    copyBtn:      'Salin',
    generateBtn:  'Buat Baru',
    generateBig:  'Buat Kata Sandi Baru',
    toastCopied:  '✓ Disalin ke clipboard',
    sectionTitle: 'Pengaturan',
    lengthTitle:  'Panjang Kata Sandi',
    upperTitle:   'Huruf Kapital',
    upperDesc:    'Sertakan A–Z',
    lowerTitle:   'Huruf Kecil',
    lowerDesc:    'Sertakan a–z',
    numTitle:     'Angka',
    numDesc:      'Sertakan 0–9',
    symTitle:     'Simbol',
    symDesc:      'Sertakan !@#$%^&*',
    noOption:     'Pilih minimal satu opsi',
    strengthLabels: ['', 'Lemah', 'Sedang', 'Kuat', 'Sangat Kuat'],
  },
  en: {
    passwordLabel:'Your password',
    placeholder:  'Tap "Generate" to get started',
    copyBtn:      'Copy',
    generateBtn:  'Generate',
    generateBig:  'Generate New Password',
    toastCopied:  '✓ Copied to clipboard',
    sectionTitle: 'Settings',
    lengthTitle:  'Password Length',
    upperTitle:   'Uppercase Letters',
    upperDesc:    'Include A–Z',
    lowerTitle:   'Lowercase Letters',
    lowerDesc:    'Include a–z',
    numTitle:     'Numbers',
    numDesc:      'Include 0–9',
    symTitle:     'Symbols',
    symDesc:      'Include !@#$%^&*',
    noOption:     'Select at least one option',
    strengthLabels: ['', 'Weak', 'Fair', 'Strong', 'Very Strong'],
  }
};

let currentLang = 'id';

window.syncLang = function(lang) {
  if (!toolTranslations[lang]) return;
  currentLang = lang;
  const t = toolTranslations[lang];

  // Password label & placeholder
  const lbl = document.querySelector('.password-label');
  if (lbl) lbl.textContent = t.passwordLabel;
  const display = document.getElementById('passwordDisplay');
  if (display && !currentPassword) display.textContent = t.placeholder;

  // Buttons
  const copyBtn = document.querySelector('.action-btn[onclick="copyPassword()"]');
  if (copyBtn) copyBtn.lastChild.textContent = ' ' + t.copyBtn;
  const genBtn = document.querySelector('.action-btn[onclick="generatePassword()"]');
  if (genBtn) genBtn.lastChild.textContent = ' ' + t.generateBtn;
  const genBig = document.querySelector('.generate-btn');
  if (genBig) genBig.textContent = t.generateBig;

  // Toast
  const toast = document.getElementById('toast');
  if (toast) toast.textContent = t.toastCopied;

  // Section title
  const secTitle = document.querySelector('.section-title');
  if (secTitle) secTitle.textContent = t.sectionTitle;

  // Setting labels
  const settingTitles = document.querySelectorAll('.setting-title');
  const settingDescs  = document.querySelectorAll('.setting-desc');
  const titleKeys = ['lengthTitle','upperTitle','lowerTitle','numTitle','symTitle'];
  const descKeys  = ['upperDesc','lowerDesc','numDesc','symDesc'];
  titleKeys.forEach((key, i) => { if (settingTitles[i]) settingTitles[i].textContent = t[key]; });
  descKeys.forEach((key, i)  => { if (settingDescs[i])  settingDescs[i].textContent  = t[key]; });

  // Strength labels — patch updateStrength to use current lang
  window._strengthLabels = t.strengthLabels;
  const curLabel = document.getElementById('strengthLabel');
  if (curLabel && curLabel.textContent) {
    const oldLabels = toolTranslations[lang === 'id' ? 'en' : 'id'].strengthLabels;
    const idx = oldLabels.indexOf(curLabel.textContent);
    if (idx > 0) curLabel.textContent = t.strengthLabels[idx];
  }
};

// Patch updateStrength to use dynamic labels
function updateStrength(pwd, opts) {
  let score = 0;
  if (pwd.length >= 12) score++;
  if (pwd.length >= 20) score++;
  const types = [opts.upper, opts.lower, opts.num, opts.sym].filter(Boolean).length;
  score += Math.min(types - 1, 2);
  const labels = window._strengthLabels || toolTranslations[currentLang].strengthLabels;
  const classes = ['', 'filled-weak', 'filled-fair', 'filled-strong', 'filled-very-strong'];
  const filled = Math.max(1, Math.min(score, 4));
  for (let i = 1; i <= 4; i++) {
    const seg = document.getElementById('s' + i);
    seg.className = 'strength-seg';
    if (i <= filled) seg.classList.add(classes[filled]);
  }
  document.getElementById('strengthLabel').textContent = labels[filled];
}

// Listen for postMessage from parent dashboard
window.addEventListener('message', function(e) {
  if (e.data && e.data.type === 'syncTheme' && typeof window.syncTheme === 'function') {
    window.syncTheme(e.data.dark);
  }
  if (e.data && e.data.type === 'syncLang' && typeof window.syncLang === 'function') {
    window.syncLang(e.data.lang);
  }
});

document.addEventListener('DOMContentLoaded', () => {
  updateLength(16);
  generatePassword();
  if (window.__initialLang) syncLang(window.__initialLang);
});
