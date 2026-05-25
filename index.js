/* =====================================================
   AsciiForge — vanilla JS
   ===================================================== */

const ASCII_CHARS = "$@B%8&WM#*oahkbdpqwmZO0QLCJUYXzcvunxrjft/|()1{}[]?-_+~<>i!lI;:,\"^`'. ";

/* ---------- Theme toggle ---------- */
const root = document.documentElement;
const themeToggle = document.getElementById('themeToggle');
const themeIcon   = document.getElementById('themeIcon');
const themeTooltip= document.getElementById('themeTooltip');

function applyTheme(mode) {
  if (mode === 'dark') {
    root.classList.add('dark');
    root.classList.remove('light');
    themeIcon.className = 'bi bi-sun-fill';
    themeTooltip.textContent = 'Switch to light mode';
  } else {
    root.classList.add('light');
    root.classList.remove('dark');
    themeIcon.className = 'bi bi-moon-stars';
    themeTooltip.textContent = 'Switch to dark mode';
  }
}

// Init theme from localStorage
const saved = localStorage.getItem('asciiforge-theme');
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
applyTheme(saved || (prefersDark ? 'dark' : 'light'));

themeToggle.addEventListener('click', () => {
  const next = root.classList.contains('dark') ? 'light' : 'dark';
  localStorage.setItem('asciiforge-theme', next);
  applyTheme(next);
});

/* ---------- Elements ---------- */
const dropzone       = document.getElementById('dropzone');
const fileInput      = document.getElementById('fileInput');
const browseBtn      = document.getElementById('browseBtn');
const previewSection = document.getElementById('previewSection');
const previewImg     = document.getElementById('previewImg');
const imgInfo        = document.getElementById('imgInfo').querySelector('span');
const clearBtn       = document.getElementById('clearBtn');
const convertBtn     = document.getElementById('convertBtn');
const outputSection  = document.getElementById('outputSection');
const asciiOutput    = document.getElementById('asciiOutput');
const outInfo        = document.getElementById('outInfo').querySelector('span');
const copyBtn        = document.getElementById('copyBtn');
const refreshBtn     = document.getElementById('refreshBtn');
const toast          = document.getElementById('toast');
const toastMsg       = document.getElementById('toastMsg');

const widthSlider    = document.getElementById('widthSlider');
const widthVal       = document.getElementById('widthVal');
const contrastSlider = document.getElementById('contrastSlider');
const contrastVal    = document.getElementById('contrastVal');
const invertToggle   = document.getElementById('invertToggle');
const invertKnob     = document.getElementById('invertKnob');

let currentImage = null;
let invertState = false;
let lastAscii = '';

/* ---------- Ripple effect for buttons ---------- */
document.addEventListener('click', (e) => {
  const btn = e.target.closest('.btn');
  if (!btn || btn.disabled) return;
  const ripple = document.createElement('span');
  ripple.className = 'ripple';
  const rect = btn.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height);
  ripple.style.width = ripple.style.height = size + 'px';
  ripple.style.left = (e.clientX - rect.left - size/2) + 'px';
  ripple.style.top  = (e.clientY - rect.top  - size/2) + 'px';
  btn.appendChild(ripple);
  setTimeout(() => ripple.remove(), 600);
});

/* ---------- Slider labels ---------- */
widthSlider.addEventListener('input', () => {
  widthVal.textContent = widthSlider.value + ' chars';
});
contrastSlider.addEventListener('input', () => {
  contrastVal.textContent = parseFloat(contrastSlider.value).toFixed(1) + '×';
});

/* ---------- Invert toggle ---------- */
invertToggle.addEventListener('click', () => {
  invertState = !invertState;
  invertToggle.setAttribute('aria-checked', invertState);
  if (invertState) {
    invertToggle.style.background = 'var(--accent)';
    invertKnob.style.transform = 'translateX(20px)';
  } else {
    invertToggle.style.background = 'var(--border-strong)';
    invertKnob.style.transform = 'translateX(0)';
  }
  if (currentImage) convertToAscii(); // re-render instantly
});

/* ---------- Upload handling ---------- */
browseBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  fileInput.click();
});
dropzone.addEventListener('click', () => fileInput.click());

fileInput.addEventListener('change', (e) => {
  if (e.target.files && e.target.files[0]) handleFile(e.target.files[0]);
});

['dragenter', 'dragover'].forEach(ev => {
  dropzone.addEventListener(ev, (e) => {
    e.preventDefault(); e.stopPropagation();
    dropzone.classList.add('drag');
  });
});
['dragleave', 'drop'].forEach(ev => {
  dropzone.addEventListener(ev, (e) => {
    e.preventDefault(); e.stopPropagation();
    dropzone.classList.remove('drag');
  });
});
dropzone.addEventListener('drop', (e) => {
  const file = e.dataTransfer.files && e.dataTransfer.files[0];
  if (file) handleFile(file);
});

function handleFile(file) {
  if (!file.type.startsWith('image/')) {
    showToast('Please choose a valid image file.', true);
    return;
  }
  if (file.size > 10 * 1024 * 1024) {
    showToast('File is too large (max 10MB).', true);
    return;
  }
  const reader = new FileReader();
  reader.onload = (ev) => {
    const img = new Image();
    img.onload = () => {
      currentImage = img;
      previewImg.src = ev.target.result;
      imgInfo.textContent = `${img.naturalWidth}×${img.naturalHeight} • ${(file.size/1024).toFixed(0)} KB`;
      previewSection.classList.remove('hidden');
      previewSection.classList.add('fade-in');
      convertBtn.disabled = false;
    };
    img.onerror = () => showToast('Failed to load image.', true);
    img.src = ev.target.result;
  };
  reader.readAsDataURL(file);
}

clearBtn.addEventListener('click', () => {
  currentImage = null;
  previewImg.src = '';
  previewSection.classList.add('hidden');
  convertBtn.disabled = true;
  fileInput.value = '';
  outputSection.classList.remove('visible');
  asciiOutput.textContent = '';
  lastAscii = '';
});

/* ---------- Mouse tracking for dropzone glow ---------- */
dropzone.addEventListener('mousemove', (e) => {
  const rect = dropzone.getBoundingClientRect();
  const x = ((e.clientX - rect.left) / rect.width) * 100;
  const y = ((e.clientY - rect.top) / rect.height) * 100;
  dropzone.style.setProperty('--mouse-x', x + '%');
  dropzone.style.setProperty('--mouse-y', y + '%');
});

/* ---------- Scroll reveal ---------- */
const reveals = document.querySelectorAll('.scroll-reveal');
const revealObs = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.remove('opacity-0', 'translate-y-8');
      entry.target.classList.add('opacity-100', 'translate-y-0', 'transition-all', 'duration-700', 'ease-out');
      revealObs.unobserve(entry.target);
    }
  });
}, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
reveals.forEach(el => revealObs.observe(el));

/* ---------- Conversion with loading state ---------- */
convertBtn.addEventListener('click', () => {
  if (!currentImage) return;
  convertToAscii();
});

// Keyboard shortcut ⌘/Ctrl + Enter
document.addEventListener('keydown', (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && currentImage && !convertBtn.disabled) {
    e.preventDefault();
    convertToAscii();
  }
});

function convertToAscii() {
  const targetWidth = parseInt(widthSlider.value, 10);
  const contrast = parseFloat(contrastSlider.value);
  const img = currentImage;

  // Show loading state
  const originalHTML = convertBtn.innerHTML;
  convertBtn.disabled = true;
  convertBtn.innerHTML = `
    <span class="relative z-10 flex items-center justify-center gap-3">
      <span class="spinner" style="width:16px;height:16px;border:2px solid rgba(255,255,255,0.3);border-top-color:#fff;border-radius:50%;animation:spin 0.8s linear infinite;"></span>
      <span>Rendering ASCII…</span>
    </span>
  `;

  // Defer to next frame for UI update
  requestAnimationFrame(() => {
    setTimeout(() => {
      // Compute dimensions with aspect ratio compensation.
      const aspect = img.naturalHeight / img.naturalWidth;
      const charAspect = 0.5;
      const cols = targetWidth;
      const rows = Math.max(1, Math.round(cols * aspect * charAspect));

      const canvas = document.getElementById('workCanvas');
      canvas.width = cols;
      canvas.height = rows;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, cols, rows);

      const data = ctx.getImageData(0, 0, cols, rows).data;

      // Compute brightness values
      const lum = new Float32Array(cols * rows);
      let min = 255, max = 0;
      for (let i = 0, j = 0; i < data.length; i += 4, j++) {
        const r = data[i], g = data[i+1], b = data[i+2], a = data[i+3];
        let v = a < 16 ? 255 : (0.2126 * r + 0.7152 * g + 0.0722 * b);
        lum[j] = v;
        if (v < min) min = v;
        if (v > max) max = v;
      }

      const range = Math.max(1, max - min);
      const chars = ASCII_CHARS;
      const n = chars.length - 1;
      let out = '';

      // Build ASCII string
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const raw = lum[y * cols + x];
          let v = ((raw - min) / range) * 255;
          v = (v - 127.5) * contrast + 127.5;
          v = Math.max(0, Math.min(255, v));
          if (invertState) v = 255 - v;
          const idx = Math.floor((v / 255) * n);
          out += chars[idx];
        }
        if (y < rows - 1) out += '\n';
      }

      asciiOutput.textContent = out;
      lastAscii = out;
      outInfo.innerHTML = `<i class="bi bi-grid-3x3-gap" style="color: var(--accent);"></i> ${cols} × ${rows} • ${out.length.toLocaleString()} chars`;

      // Restore button
      convertBtn.disabled = false;
      convertBtn.innerHTML = originalHTML;

      // Reveal output with animation
      outputSection.classList.remove('opacity-0', 'translate-y-8');
      outputSection.classList.add('opacity-100', 'translate-y-0');

      // Animate the ASCII output appearance
      asciiOutput.style.opacity = '0';
      asciiOutput.style.transform = 'translateY(8px)';
      requestAnimationFrame(() => {
        asciiOutput.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        asciiOutput.style.opacity = '1';
        asciiOutput.style.transform = 'translateY(0)';
      });

      setTimeout(() => {
        outputSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 200);

      showToast('ASCII art generated • ' + cols + '×' + rows);
    }, 50); // Small delay to show loading state
  });
}

/* ---------- Copy / Refresh ---------- */
copyBtn.addEventListener('click', async () => {
  if (!lastAscii) return;
  try {
    await navigator.clipboard.writeText(lastAscii);
    showToast('Copied to clipboard');
  } catch (err) {
    // Fallback
    const ta = document.createElement('textarea');
    ta.value = lastAscii;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); showToast('Copied to clipboard'); }
    catch { showToast('Copy failed — please select manually.', true); }
    document.body.removeChild(ta);
  }
});

refreshBtn.addEventListener('click', () => location.reload());

/* ---------- Toast ---------- */
let toastTimer;
function showToast(msg, isError = false) {
  toastMsg.textContent = msg;
  const icon = toast.querySelector('i');
  icon.className = isError ? 'bi bi-exclamation-circle-fill' : 'bi bi-check-circle-fill';
  icon.style.color = isError ? '#F87171' : 'var(--success)';
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2400);
}

/* ---------- Prevent default drag on window ---------- */
['dragover','drop'].forEach(ev => window.addEventListener(ev, e => e.preventDefault()));
