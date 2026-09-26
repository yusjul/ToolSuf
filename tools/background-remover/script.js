// Theme sync from dashboard
try {
  var p = window.parent.document.documentElement;
  if (p.classList.contains('dark')) { document.documentElement.classList.add('dark'); }
  else { document.documentElement.classList.add('light'); }
} catch(e) { document.documentElement.classList.add('light'); }
var lang = new URLSearchParams(window.location.search).get('lang');
window.__initialLang = lang === 'en' ? 'en' : 'id';

let originalFile = null;
let processedBlob = null;
let processedUrl = null;
let removeBackgroundFn = null;
let selectedColor = 'transparent';
let cmpPos = 50;
let cmpDragging = false;

const $ = id => document.getElementById(id);

function getFriendlyKey(key, lang) {
  const filename = (key.split('/').pop() || '').toLowerCase();
  if (filename.includes('wasm')) {
    return lang === 'id' ? 'Mesin WASM' : 'WASM Engine';
  }
  return lang === 'id' ? 'Model AI' : 'AI Model';
}

// =============================================================================
// ADAPTIVE BACKGROUND REMOVAL ENGINE (Pure Client-side, High-Precision)
// Supports White, Black, Gray, Red, Green, Blue, Solid Colors, and Gradients.
// Protects internal object pixels with Connected Component Boundary Flood-Fill.
// =============================================================================

/**
 * Perceptual Color Difference (Compucolor / Redmean metric)
 * Very fast, perceptual, and accurate for whites, blacks, grays, and saturated colors.
 */
function getPerceptualColorDistance(r1, g1, b1, r2, g2, b2) {
  const rMean = (r1 + r2) * 0.5;
  const dR = r1 - r2;
  const dG = g1 - g2;
  const dB = b1 - b2;
  const weightR = 2.0 + rMean / 256.0;
  const weightG = 4.0;
  const weightB = 2.0 + (255.0 - rMean) / 256.0;
  return Math.sqrt(weightR * dR * dR + weightG * dG * dG + weightB * dB * dB);
}

/**
 * Pipeline Step 1 & 2: detectBackground() and buildBackgroundModel()
 * Samples perimeter pixels + 8 key landmarks (corners & edge centers).
 * Builds a multi-sample adaptive background model.
 */
function detectAndBuildBackgroundModel(data, width, height) {
  const samples = [];
  const strideX = Math.max(1, Math.floor(width / 160));
  const strideY = Math.max(1, Math.floor(height / 160));

  const samplePixel = (x, y) => {
    x = Math.max(0, Math.min(width - 1, x));
    y = Math.max(0, Math.min(height - 1, y));
    const idx = (y * width + x) * 4;
    const a = data[idx + 3];
    if (a < 30) return null; // Ignore already transparent pixels
    return {
      r: data[idx],
      g: data[idx + 1],
      b: data[idx + 2],
      a: a,
      lum: 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2],
      x, y
    };
  };

  // 1. Top & Bottom borders (sample 0, 1, 2 pixels in depth for robust noise rejection)
  for (let x = 0; x < width; x += strideX) {
    for (let depth = 0; depth < Math.min(3, height); depth++) {
      const topP = samplePixel(x, depth);
      if (topP) samples.push(topP);
      const btmP = samplePixel(x, height - 1 - depth);
      if (btmP) samples.push(btmP);
    }
  }

  // 2. Left & Right borders
  for (let y = 0; y < height; y += strideY) {
    for (let depth = 0; depth < Math.min(3, width); depth++) {
      const leftP = samplePixel(depth, y);
      if (leftP) samples.push(leftP);
      const rightP = samplePixel(width - 1 - depth, y);
      if (rightP) samples.push(rightP);
    }
  }

  // 3. 8 Key Landmark anchors (corners and midpoints)
  const landmarks = [
    [0, 0], [Math.floor(width / 2), 0], [width - 1, 0],
    [0, Math.floor(height / 2)], [width - 1, Math.floor(height / 2)],
    [0, height - 1], [Math.floor(width / 2), height - 1], [width - 1, height - 1]
  ];
  for (const [lx, ly] of landmarks) {
    const p = samplePixel(lx, ly);
    if (p) {
      samples.push(p);
      samples.push(p);
    }
  }

  if (samples.length === 0) {
    // Entire perimeter is already transparent
    return {
      primary: { r: 255, g: 255, b: 255 },
      clusters: [{ r: 255, g: 255, b: 255, count: 1 }],
      innerTol: 25,
      outerTol: 45,
      isDark: false
    };
  }

  // Cluster border samples by perceptual color distance
  const clusterDistThresh = 24;
  const clusters = [];

  for (const s of samples) {
    let matched = null;
    let minDist = Infinity;
    for (const c of clusters) {
      const d = getPerceptualColorDistance(s.r, s.g, s.b, c.r, c.g, c.b);
      if (d < clusterDistThresh && d < minDist) {
        minDist = d;
        matched = c;
      }
    }
    if (matched) {
      matched.sumR += s.r;
      matched.sumG += s.g;
      matched.sumB += s.b;
      matched.count++;
      matched.r = Math.round(matched.sumR / matched.count);
      matched.g = Math.round(matched.sumG / matched.count);
      matched.b = Math.round(matched.sumB / matched.count);
      matched.samples.push(s);
    } else {
      clusters.push({
        r: s.r,
        g: s.g,
        b: s.b,
        sumR: s.r,
        sumG: s.g,
        sumB: s.b,
        count: 1,
        samples: [s]
      });
    }
  }

  // Sort clusters by frequency descending
  clusters.sort((a, b) => b.count - a.count);
  const primaryCluster = clusters[0];

  // Calculate variance / standard deviation of primary cluster samples
  let sumSqDist = 0;
  for (const s of primaryCluster.samples) {
    const d = getPerceptualColorDistance(s.r, s.g, s.b, primaryCluster.r, primaryCluster.g, primaryCluster.b);
    sumSqDist += d * d;
  }
  const sigma = Math.sqrt(sumSqDist / Math.max(1, primaryCluster.samples.length));

  // Determine brightness characteristics
  const primaryLum = 0.299 * primaryCluster.r + 0.587 * primaryCluster.g + 0.114 * primaryCluster.b;
  const isDark = primaryLum < 55;
  const isLight = primaryLum > 200;

  // Adaptive threshold calculation
  let innerTol;
  let outerTol;

  if (sigma < 4) {
    // Very clean, solid uniform background (clean logo / vector graphics)
    innerTol = isDark ? 22 : 24;
    outerTol = innerTol + 18;
  } else if (sigma < 12) {
    // Slight noise, mild gradient or JPEG compression artifacts
    innerTol = Math.round(25 + sigma * 0.9);
    outerTol = innerTol + 20;
  } else {
    // Noticeable gradient or compression noise
    innerTol = Math.round(Math.min(42, 28 + sigma * 0.7));
    outerTol = innerTol + 24;
  }

  // Keep top clusters that represent significant border coverage (> 8% of samples)
  // to seamlessly support gradients (e.g. top is dark gray, bottom is black, or corners differ)
  const validClusters = clusters.filter(c => c.count >= Math.max(3, samples.length * 0.08)).slice(0, 4);

  return {
    primary: { r: primaryCluster.r, g: primaryCluster.g, b: primaryCluster.b },
    clusters: validClusters.length > 0 ? validClusters : [primaryCluster],
    innerTol,
    outerTol,
    sigma,
    isDark,
    isLight
  };
}

/**
 * Pipeline Step 3 & 4: createForegroundMask() and connectedComponent()
 * Flood fills strictly from perimeter inwards.
 * Same color pixels enclosed inside foreground objects are NEVER reached and stay 100% opaque.
 */
function floodFillBackgroundConnected(data, width, height, bgModel) {
  const totalPixels = width * height;
  const visited = new Uint8Array(totalPixels);
  const distMap = new Float32Array(totalPixels);

  // Helper to compute minimum distance from pixel (r, g, b) to any background cluster
  const getMinDistToClusters = (r, g, b) => {
    let minD = Infinity;
    for (let i = 0; i < bgModel.clusters.length; i++) {
      const c = bgModel.clusters[i];
      const d = getPerceptualColorDistance(r, g, b, c.r, c.g, c.b);
      if (d < minD) minD = d;
    }
    return minD;
  };

  // High performance BFS queue using double buffering
  let currentQueue = new Int32Array(totalPixels);
  let nextQueue = new Int32Array(totalPixels);
  let currentTail = 0;
  let nextTail = 0;

  const pushCurrent = (idx) => {
    currentQueue[currentTail++] = idx;
  };

  const pushNext = (idx) => {
    nextQueue[nextTail++] = idx;
  };

  // Seed BFS strictly with pixels along the 4 borders
  const seedBorderPixel = (x, y) => {
    const idx = y * width + x;
    if (visited[idx]) return;

    const pIdx = idx * 4;
    const a = data[pIdx + 3];

    // Already transparent pixel: always background
    if (a < 30) {
      visited[idx] = 1;
      distMap[idx] = 0;
      pushCurrent(idx);
      return;
    }

    const d = getMinDistToClusters(data[pIdx], data[pIdx + 1], data[pIdx + 2]);
    distMap[idx] = d;

    if (d <= bgModel.outerTol) {
      visited[idx] = 1;
      pushCurrent(idx);
    }
  };

  // Scan top and bottom borders
  for (let x = 0; x < width; x++) {
    seedBorderPixel(x, 0);
    seedBorderPixel(x, height - 1);
  }
  // Scan left and right borders
  for (let y = 0; y < height; y++) {
    seedBorderPixel(0, y);
    seedBorderPixel(width - 1, y);
  }

  // BFS flood-fill traversal
  while (currentTail > 0) {
    for (let i = 0; i < currentTail; i++) {
      const idx = currentQueue[i];
      const x = idx % width;
      const y = Math.floor(idx / width);

      // 4-connected neighbors
      const neighbors = [
        x > 0 ? idx - 1 : -1,
        x < width - 1 ? idx + 1 : -1,
        y > 0 ? idx - width : -1,
        y < height - 1 ? idx + width : -1
      ];

      for (let j = 0; j < 4; j++) {
        const nIdx = neighbors[j];
        if (nIdx !== -1 && !visited[nIdx]) {
          const npIdx = nIdx * 4;
          const a = data[npIdx + 3];

          if (a < 30) {
            visited[nIdx] = 1;
            distMap[nIdx] = 0;
            pushNext(nIdx);
            continue;
          }

          const d = getMinDistToClusters(data[npIdx], data[npIdx + 1], data[npIdx + 2]);
          distMap[nIdx] = d;

          if (d <= bgModel.outerTol) {
            visited[nIdx] = 1;
            pushNext(nIdx);
          }
        }
      }
    }

    // Swap queues for next level
    const temp = currentQueue;
    currentQueue = nextQueue;
    nextQueue = temp;
    currentTail = nextTail;
    nextTail = 0;
  }

  return { visited, distMap };
}

/**
 * Pipeline Step 5, 6, 7: edgeRefinement(), alphaMatting(), and decontamination()
 * Smooth alpha transition on edge pixels and color unmixing to remove halos.
 */
function refineEdgesAndAlphaMatte(data, width, height, visited, distMap, bgModel) {
  const totalPixels = width * height;
  const innerTol = bgModel.innerTol;
  const outerTol = bgModel.outerTol;
  const tolRange = Math.max(1, outerTol - innerTol);
  const bgR = bgModel.primary.r;
  const bgG = bgModel.primary.g;
  const bgB = bgModel.primary.b;

  // 1. Initial Alpha Assignment based on distance and connectivity
  for (let idx = 0; idx < totalPixels; idx++) {
    const pIdx = idx * 4;
    const origA = data[pIdx + 3];
    if (origA < 30) {
      data[pIdx + 3] = 0;
      continue;
    }

    if (visited[idx] === 1) {
      // Reached by perimeter flood fill
      const d = distMap[idx];
      if (d <= innerTol) {
        data[pIdx + 3] = 0; // Pure background
      } else if (d < outerTol) {
        // Smoothstep alpha in transition edge zone
        const t = (d - innerTol) / tolRange;
        const smoothT = t * t * (3 - 2 * t);
        const newAlpha = Math.round(smoothT * 255);
        data[pIdx + 3] = Math.min(origA, Math.max(0, newAlpha));
      } else {
        // Just outside tolerance: keep opacity
        data[pIdx + 3] = origA;
      }
    } else {
      // Disconnected from perimeter: strictly preserve original object color and opacity!
      data[pIdx + 3] = origA;
    }
  }

  // 2. Boundary Feathering & Anti-Aliasing
  const alphaCopy = new Uint8Array(totalPixels);
  for (let i = 0; i < totalPixels; i++) {
    alphaCopy[i] = data[i * 4 + 3];
  }

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;
      const a = alphaCopy[idx];

      // Check boundary pixels
      if (a === 0) {
        const nOpaque = (alphaCopy[idx - 1] > 200 ? 1 : 0) +
                        (alphaCopy[idx + 1] > 200 ? 1 : 0) +
                        (alphaCopy[idx - width] > 200 ? 1 : 0) +
                        (alphaCopy[idx + width] > 200 ? 1 : 0);
        if (nOpaque >= 2) {
          const d = distMap[idx];
          if (d > innerTol * 0.8) {
            data[idx * 4 + 3] = Math.round(nOpaque * 35);
          }
        }
      }
    }
  }

  // 3. Background Decontamination (Halo Elimination)
  // For semi-transparent edge pixels, unmix the background color bleeding into the foreground
  for (let idx = 0; idx < totalPixels; idx++) {
    const pIdx = idx * 4;
    const a = data[pIdx + 3];
    if (a > 0 && a < 254) {
      const normA = a / 255.0;
      const invA = 1.0 - normA;
      const safeNormA = Math.max(0.18, normA);

      // Unmix foreground color from background model color: F = (C - invA * B) / normA
      const r = Math.round((data[pIdx] - invA * bgR) / safeNormA);
      const g = Math.round((data[pIdx + 1] - invA * bgG) / safeNormA);
      const b = Math.round((data[pIdx + 2] - invA * bgB) / safeNormA);

      data[pIdx] = Math.max(0, Math.min(255, r));
      data[pIdx + 1] = Math.max(0, Math.min(255, g));
      data[pIdx + 2] = Math.max(0, Math.min(255, b));
    }
  }

  // 4. Stray 1-Pixel Noise Cleanup
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;
      const a = data[idx * 4 + 3];

      if (a > 0 && a < 150) {
        const nTransparent = (data[(idx - 1) * 4 + 3] === 0 ? 1 : 0) +
                             (data[(idx + 1) * 4 + 3] === 0 ? 1 : 0) +
                             (data[(idx - width) * 4 + 3] === 0 ? 1 : 0) +
                             (data[(idx + width) * 4 + 3] === 0 ? 1 : 0);
        if (nTransparent === 4) {
          data[idx * 4 + 3] = 0;
        }
      }
    }
  }
}

/**
 * Execute Adaptive Background Removal Pipeline at 100% Original Resolution
 */
async function executeAdaptiveBackgroundRemoval(file) {
  const img = new Image();
  const fileUrl = URL.createObjectURL(file);
  img.src = fileUrl;

  await new Promise((resolve, reject) => {
    img.onload = resolve;
    img.onerror = () => reject(new Error('Gagal memuat gambar'));
  });
  URL.revokeObjectURL(fileUrl);

  const width = img.naturalWidth || img.width;
  const height = img.naturalHeight || img.height;

  if (!width || !height) {
    throw new Error('Resolusi gambar tidak valid');
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(img, 0, 0, width, height);

  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  // Pipeline Step 1 & 2: detectBackground() and buildBackgroundModel()
  const bgModel = detectAndBuildBackgroundModel(data, width, height);

  // Pipeline Step 3 & 4: createForegroundMask() and connectedComponent()
  const { visited, distMap } = floodFillBackgroundConnected(data, width, height, bgModel);

  // Pipeline Step 5, 6, 7: edgeRefinement(), alphaMatting(), and decontamination()
  refineEdgesAndAlphaMatte(data, width, height, visited, distMap, bgModel);

  // Put modified pixel data back into canvas at 100% original resolution
  ctx.putImageData(imageData, 0, 0);

  // Export as high-quality transparent PNG Blob
  return new Promise((resolve, reject) => {
    canvas.toBlob(blob => {
      if (blob) resolve(blob);
      else reject(new Error('Ekspor canvas gagal'));
    }, 'image/png');
  });
}

// Attach event listeners when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  $('fi').addEventListener('change', e => {
    if (e.target.files.length) processImage(e.target.files[0]);
  });

  const drop = $('drop');
  drop.addEventListener('dragover', e => { e.preventDefault(); drop.classList.add('over'); });
  drop.addEventListener('dragleave', () => drop.classList.remove('over'));
  drop.addEventListener('drop', e => {
    e.preventDefault();
    drop.classList.remove('over');
    if (e.dataTransfer.files.length) processImage(e.dataTransfer.files[0]);
  });

  // Slider controls (mouse, touch, keyboard)
  const cmp = $('cmpContainer');
  const handle = $('cmpHandle');

  function startDrag(e) {
    if (!processedBlob) return;
    cmpDragging = true;
    cmp.classList.add('dragging');
    updateCmpPos(e.touches ? e.touches[0] : e);
  }

  function moveDrag(e) {
    if (!cmpDragging) return;
    if (e.cancelable) e.preventDefault();
    updateCmpPos(e.touches ? e.touches[0] : e);
  }

  function endDrag() {
    if (cmpDragging) {
      cmpDragging = false;
      cmp.classList.remove('dragging');
    }
  }

  cmp.addEventListener('mousedown', startDrag);
  window.addEventListener('mousemove', moveDrag);
  window.addEventListener('mouseup', endDrag);

  cmp.addEventListener('touchstart', startDrag, { passive: false });
  window.addEventListener('touchmove', moveDrag, { passive: false });
  window.addEventListener('touchend', endDrag);
  window.addEventListener('touchcancel', endDrag);

  if (handle) {
    handle.addEventListener('keydown', e => {
      if (!processedBlob) return;
      const step = e.shiftKey ? 10 : 2;
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        cmpPos = Math.max(0, cmpPos - step);
        updateSlider();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        cmpPos = Math.min(100, cmpPos + step);
        updateSlider();
      } else if (e.key === 'Home') {
        e.preventDefault();
        cmpPos = 0;
        updateSlider();
      } else if (e.key === 'End') {
        e.preventDefault();
        cmpPos = 100;
        updateSlider();
      }
    });
  }

  // Color options listeners
  document.querySelectorAll('.color-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const color = btn.getAttribute('data-color');
      selectBgColor(color, btn);
    });
  });

  $('customColorPicker').addEventListener('input', e => {
    const color = e.target.value;
    // Remove active class from color buttons
    document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('active'));
    selectBgColor(color, null);
  });

  if (window.__initialLang) syncLang(window.__initialLang);
});

function updateCmpPos(e) {
  const cmp = $('cmpContainer');
  const rect = cmp.getBoundingClientRect();
  if (rect.width <= 0) return;
  const raw = ((e.clientX - rect.left) / rect.width) * 100;
  cmpPos = Math.max(0, Math.min(100, raw));
  updateSlider();
}

function updateSlider() {
  $('cmpAfter').style.clipPath = `inset(0 0 0 ${cmpPos}%)`;
  $('cmpHandle').style.left = cmpPos + '%';
  $('cmpHandle').setAttribute('aria-valuenow', Math.round(cmpPos));
}

function resetSlider() {
  cmpPos = 50;
  updateSlider();
}

// Background color options selector
function selectBgColor(color, element) {
  selectedColor = color;
  const overlay = $('bgOverlay');
  
  if (element) {
    document.querySelectorAll('.color-btn').forEach(btn => btn.classList.remove('active'));
    element.classList.add('active');
  }

  if (color === 'transparent') {
    overlay.style.backgroundColor = '';
    overlay.style.backgroundImage = '';
    updateDownloadButtonText(true);
  } else {
    overlay.style.backgroundColor = color;
    overlay.style.backgroundImage = 'none';
    updateDownloadButtonText(false);
  }
}

function updateDownloadButtonText(isTrans) {
  const btnText = $('lblDownloadBtn');
  if (isTrans) {
    btnText.textContent = currentLang === 'id' ? 'Unduh PNG Transparan' : 'Download Transparent PNG';
  } else {
    btnText.textContent = currentLang === 'id' ? 'Unduh Gambar' : 'Download Image';
  }
}

// Main image processor
async function processImage(file) {
  if (!file.type.startsWith('image/')) {
    showAlert(currentLang === 'id' ? 'Format file tidak didukung. Pilih gambar!' : 'Unsupported file format. Select an image!', 'err');
    return;
  }

  originalFile = file;
  processedBlob = null;
  
  // Set UI state
  $('cmpEmpty').style.display = 'none';
  $('cmpImages').style.display = 'none';
  $('downloadBtn').disabled = true;
  $('bgOptionsTitle').style.display = 'none';
  $('bgOptionsCard').style.display = 'none';
  
  // Load original preview
  $('cmpOriginal').src = URL.createObjectURL(file);
  
  // Tampilkan CuteLoading
  const progressSection = $('progressSection');
  const statusLabel = { set textContent(v) { CuteLoading.setText('progressSection', v); } };
  const progressBar = { style: { set width(_) {} } }; // dummy - tidak ditampilkan ke user
  
  CuteLoading.show('progressSection', 'Sabar yahh..');

  try {
    const resultBlob = await executeAdaptiveBackgroundRemoval(file);
    processedBlob = resultBlob;

    const processedUrl2 = URL.createObjectURL(resultBlob);

    if (processedUrl) URL.revokeObjectURL(processedUrl);
    processedUrl = processedUrl2;

    $('cmpResult').src = processedUrl;

    CuteLoading.hide('progressSection');
    const cmpImages = $('cmpImages');
    cmpImages.style.display = 'block';
    cmpImages.classList.remove('cmp-show');
    void cmpImages.offsetWidth; // trigger reflow for smooth transition
    cmpImages.classList.add('cmp-show');

    $('downloadBtn').disabled = false;
    $('bgOptionsTitle').style.display = 'block';
    $('bgOptionsCard').style.display = 'block';

    resetSlider();
    selectBgColor('transparent', document.querySelector('.color-btn[data-color="transparent"]'));
    showAlert(currentLang === 'id' ? 'Latar belakang berhasil dihapus!' : 'Background removed successfully!', 'ok');

  } catch (e) {
    console.error('Background removal error:', e);
    CuteLoading.hide('progressSection');
    $('cmpEmpty').style.display = 'flex';
    showAlert(
      currentLang === 'id'
        ? 'Gambar tidak dapat diproses.'
        : 'Image could not be processed.',
      'err'
    );
  }
}

// Download action
async function downloadResult() {
  if (!processedBlob || !originalFile) return;

  const downloadOpts = {
    originalName: originalFile.name,
    featureName: 'background-remover',
    extension: 'png',
    mimeType: 'image/png'
  };

  if (selectedColor === 'transparent') {
    // Download directly using global ToolSuf download system
    if (typeof ToolSufDownload !== 'undefined') {
      await ToolSufDownload.downloadFile({ ...downloadOpts, blob: processedBlob });
    } else {
      triggerFileDownload(processedBlob, originalFile.name);
    }
  } else {
    // Draw canvas with colored background
    try {
      const img = new Image();
      img.src = processedUrl;
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');

      // Draw background color
      ctx.fillStyle = selectedColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw image
      ctx.drawImage(img, 0, 0);

      // Export canvas
      canvas.toBlob(async blob => {
        if (typeof ToolSufDownload !== 'undefined') {
          await ToolSufDownload.downloadFile({ ...downloadOpts, blob });
        } else {
          triggerFileDownload(blob, originalFile.name);
        }
      }, 'image/png');

    } catch (e) {
      console.error(e);
      showAlert(currentLang === 'id' ? 'Gagal mengunduh gambar berwarna.' : 'Failed to download colored image.', 'err');
    }
  }
}

function triggerFileDownload(blob, rawName) {
  const filename = typeof ToolSufDownload !== 'undefined'
    ? ToolSufDownload.generateFilename({ originalName: rawName, featureName: 'background-remover', extension: 'png' })
    : `toolsuf-${rawName.replace(/\.[^/.]+$/, '')}-background-remover.png`;

  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(a.href);
  }, 1000);
}

function showAlert(msg, type) {
  const el = $('alertBox');
  el.className = 'alert ' + type;
  el.textContent = msg;
  setTimeout(() => el.className = 'alert', 5000);
}

function resetAll() {
  originalFile = null;
  processedBlob = null;
  if (processedUrl) URL.revokeObjectURL(processedUrl);
  processedUrl = null;
  
  $('fi').value = '';
  $('cmpImages').style.display = 'none';
  $('cmpImages').classList.remove('cmp-show');
  $('cmpEmpty').style.display = 'flex';
  $('downloadBtn').disabled = true;
  $('bgOptionsTitle').style.display = 'none';
  $('bgOptionsCard').style.display = 'none';
  $('progressSection') && CuteLoading.hide('progressSection');
  $('alertBox').className = 'alert';
}

// ===== Theme/Lang synchronization =====
window.syncTheme = function(dark) {
  if (dark) {
    document.documentElement.classList.add('dark');
    document.documentElement.classList.remove('light');
  } else {
    document.documentElement.classList.add('light');
    document.documentElement.classList.remove('dark');
  }
};

let currentLang = 'id';

window.syncLang = function(lang) {
  const translations = {
    id: {
      secPickFile: 'Pilih Gambar',
      lblDropTitle: 'Seret & lepas gambar di sini',
      lblDropSub: 'Mendukung format JPG, PNG, WEBP, dan lainnya',
      secPreview: 'Pratinjau Hasil',
      cmpEmpty: 'Pilih gambar untuk memproses dan melihat hasil',
      cmpLabelsOriginal: 'Asli',
      cmpLabelsClean: 'Bersih',
      bgOptionsTitle: 'Kustomisasi Latar Belakang',
      lblBgColor: 'Warna Latar',
      lblBgColorDesc: 'Ganti warna latar hasil potongan',
      lblDownloadBtn: selectedColor === 'transparent' ? 'Unduh PNG Transparan' : 'Unduh Gambar',
      lblResetBtn: 'Hapus Gambar',
      preparing: 'Menyiapkan model AI...',
      success: 'Latar belakang berhasil dihapus!',
      failed: 'Gagal memproses gambar.',
    },
    en: {
      secPickFile: 'Select Image',
      lblDropTitle: 'Drag & drop image here',
      lblDropSub: 'Supports JPG, PNG, WEBP, and more',
      secPreview: 'Result Preview',
      cmpEmpty: 'Select an image to process and see the result',
      cmpLabelsOriginal: 'Original',
      cmpLabelsClean: 'Clean',
      bgOptionsTitle: 'Customize Background',
      lblBgColor: 'Background Color',
      lblBgColorDesc: 'Change background color of the output',
      lblDownloadBtn: selectedColor === 'transparent' ? 'Download Transparent PNG' : 'Download Image',
      lblResetBtn: 'Remove Image',
      preparing: 'Preparing AI model...',
      success: 'Background removed successfully!',
      failed: 'Failed to process image.',
    }
  };

  const d = translations[lang];
  if (!d) return;
  currentLang = lang;

  $('secPickFile').textContent = d.secPickFile;
  $('lblDropTitle').textContent = d.lblDropTitle;
  $('lblDropSub').textContent = d.lblDropSub;
  $('secPreview').textContent = d.secPreview;
  
  if (!processedBlob) {
    const emptyTitle = $('cmpEmptyTitle') || $('cmpEmpty');
    if (emptyTitle) emptyTitle.textContent = d.cmpEmpty;
  }

  const labels = $('cmpLabels').children;
  if (labels.length >= 2) {
    labels[0].textContent = d.cmpLabelsOriginal;
    labels[1].textContent = d.cmpLabelsClean;
  }

  $('bgOptionsTitle').textContent = d.bgOptionsTitle;
  $('lblBgColor').textContent = d.lblBgColor;
  $('lblBgColorDesc').textContent = d.lblBgColorDesc;
  
  updateDownloadButtonText(selectedColor === 'transparent');
  $('lblResetBtn').textContent = d.lblResetBtn;
};

// Expose functions to global scope (required for type="module" scripts)
window.downloadResult = downloadResult;
window.resetAll = resetAll;

// Listen for postMessage from parent dashboard
window.addEventListener('message', function(e) {
  if (e.data && e.data.type === 'syncTheme' && typeof window.syncTheme === 'function') {
    window.syncTheme(e.data.dark);
  }
  if (e.data && e.data.type === 'syncLang' && typeof window.syncLang === 'function') {
    window.syncLang(e.data.lang);
  }
});
