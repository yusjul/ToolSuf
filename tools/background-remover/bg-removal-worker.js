/**
 * ToolSuf — Background Remover Web Worker  v1.0
 * ================================================
 * Menjalankan adaptive background removal di luar main thread.
 * Menerima: { jobId, imageData: {data, width, height} }
 * Mengirim:  { type: 'progress', jobId, pct }
 *            { type: 'done',     jobId, imageData: {data, width, height} }
 *            { type: 'error',    jobId, message }
 */

// ─── Perceptual color distance (Redmean) ────────────────────────────────
function getPerceptualColorDistance(r1, g1, b1, r2, g2, b2) {
  const rMean = (r1 + r2) * 0.5;
  const dR = r1 - r2, dG = g1 - g2, dB = b1 - b2;
  const wR = 2.0 + rMean / 256.0;
  const wG = 4.0;
  const wB = 2.0 + (255.0 - rMean) / 256.0;
  return Math.sqrt(wR * dR * dR + wG * dG * dG + wB * dB * dB);
}

// ─── Build Background Model ─────────────────────────────────────────────
function detectAndBuildBackgroundModel(data, width, height) {
  const samples = [];
  const strideX = Math.max(1, Math.floor(width / 160));
  const strideY = Math.max(1, Math.floor(height / 160));

  const samplePixel = (x, y) => {
    x = Math.max(0, Math.min(width - 1, x));
    y = Math.max(0, Math.min(height - 1, y));
    const idx = (y * width + x) * 4;
    const a = data[idx + 3];
    if (a < 30) return null;
    return { r: data[idx], g: data[idx + 1], b: data[idx + 2], a };
  };

  for (let x = 0; x < width; x += strideX) {
    for (let depth = 0; depth < Math.min(3, height); depth++) {
      const top = samplePixel(x, depth);
      if (top) samples.push(top);
      const btm = samplePixel(x, height - 1 - depth);
      if (btm) samples.push(btm);
    }
  }
  for (let y = 0; y < height; y += strideY) {
    for (let depth = 0; depth < Math.min(3, width); depth++) {
      const left = samplePixel(depth, y);
      if (left) samples.push(left);
      const right = samplePixel(width - 1 - depth, y);
      if (right) samples.push(right);
    }
  }
  const landmarks = [
    [0, 0], [Math.floor(width / 2), 0], [width - 1, 0],
    [0, Math.floor(height / 2)], [width - 1, Math.floor(height / 2)],
    [0, height - 1], [Math.floor(width / 2), height - 1], [width - 1, height - 1]
  ];
  for (const [lx, ly] of landmarks) {
    const p = samplePixel(lx, ly);
    if (p) { samples.push(p); samples.push(p); }
  }

  if (samples.length === 0) {
    return { primary: { r: 255, g: 255, b: 255 }, clusters: [{ r: 255, g: 255, b: 255, count: 1, samples: [] }], innerTol: 25, outerTol: 45, isDark: false, isLight: true, sigma: 0 };
  }

  const clusterDistThresh = 24;
  const clusters = [];
  for (const s of samples) {
    let matched = null, minDist = Infinity;
    for (const c of clusters) {
      const d = getPerceptualColorDistance(s.r, s.g, s.b, c.r, c.g, c.b);
      if (d < clusterDistThresh && d < minDist) { minDist = d; matched = c; }
    }
    if (matched) {
      matched.sumR += s.r; matched.sumG += s.g; matched.sumB += s.b; matched.count++;
      matched.r = Math.round(matched.sumR / matched.count);
      matched.g = Math.round(matched.sumG / matched.count);
      matched.b = Math.round(matched.sumB / matched.count);
      matched.samples.push(s);
    } else {
      clusters.push({ r: s.r, g: s.g, b: s.b, sumR: s.r, sumG: s.g, sumB: s.b, count: 1, samples: [s] });
    }
  }

  clusters.sort((a, b) => b.count - a.count);
  const pc = clusters[0];
  let sumSqDist = 0;
  for (const s of pc.samples) {
    const d = getPerceptualColorDistance(s.r, s.g, s.b, pc.r, pc.g, pc.b);
    sumSqDist += d * d;
  }
  const sigma = Math.sqrt(sumSqDist / Math.max(1, pc.samples.length));
  const primaryLum = 0.299 * pc.r + 0.587 * pc.g + 0.114 * pc.b;
  const isDark = primaryLum < 55;
  const isLight = primaryLum > 200;

  let innerTol, outerTol;
  if (sigma < 4) { innerTol = isDark ? 22 : 24; outerTol = innerTol + 18; }
  else if (sigma < 12) { innerTol = Math.round(25 + sigma * 0.9); outerTol = innerTol + 20; }
  else { innerTol = Math.round(Math.min(42, 28 + sigma * 0.7)); outerTol = innerTol + 24; }

  const validClusters = clusters.filter(c => c.count >= Math.max(3, samples.length * 0.08)).slice(0, 4);

  return {
    primary: { r: pc.r, g: pc.g, b: pc.b },
    clusters: validClusters.length > 0 ? validClusters : [pc],
    innerTol, outerTol, sigma, isDark, isLight
  };
}

// ─── Flood Fill (Connected Component BFS) ──────────────────────────────
function floodFillBackgroundConnected(data, width, height, bgModel) {
  const totalPixels = width * height;
  const visited = new Uint8Array(totalPixels);
  const distMap = new Float32Array(totalPixels);

  const getMinDist = (r, g, b) => {
    let minD = Infinity;
    for (const c of bgModel.clusters) {
      const d = getPerceptualColorDistance(r, g, b, c.r, c.g, c.b);
      if (d < minD) minD = d;
    }
    return minD;
  };

  let currentQueue = new Int32Array(totalPixels);
  let nextQueue = new Int32Array(totalPixels);
  let currentTail = 0, nextTail = 0;

  const seedBorderPixel = (x, y) => {
    const idx = y * width + x;
    if (visited[idx]) return;
    const pIdx = idx * 4;
    const a = data[pIdx + 3];
    if (a < 30) { visited[idx] = 1; distMap[idx] = 0; currentQueue[currentTail++] = idx; return; }
    const d = getMinDist(data[pIdx], data[pIdx + 1], data[pIdx + 2]);
    distMap[idx] = d;
    if (d <= bgModel.outerTol) { visited[idx] = 1; currentQueue[currentTail++] = idx; }
  };

  for (let x = 0; x < width; x++) { seedBorderPixel(x, 0); seedBorderPixel(x, height - 1); }
  for (let y = 0; y < height; y++) { seedBorderPixel(0, y); seedBorderPixel(width - 1, y); }

  while (currentTail > 0) {
    for (let i = 0; i < currentTail; i++) {
      const idx = currentQueue[i];
      const x = idx % width;
      const y = Math.floor(idx / width);
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
          if (a < 30) { visited[nIdx] = 1; distMap[nIdx] = 0; nextQueue[nextTail++] = nIdx; continue; }
          const d = getMinDist(data[npIdx], data[npIdx + 1], data[npIdx + 2]);
          distMap[nIdx] = d;
          if (d <= bgModel.outerTol) { visited[nIdx] = 1; nextQueue[nextTail++] = nIdx; }
        }
      }
    }
    const temp = currentQueue; currentQueue = nextQueue; nextQueue = temp;
    currentTail = nextTail; nextTail = 0;
  }
  return { visited, distMap };
}

// ─── Edge Refinement + Alpha Matte + Decontamination ───────────────────
function refineEdgesAndAlphaMatte(data, width, height, visited, distMap, bgModel) {
  const totalPixels = width * height;
  const innerTol = bgModel.innerTol;
  const outerTol = bgModel.outerTol;
  const tolRange = Math.max(1, outerTol - innerTol);
  const bgR = bgModel.primary.r, bgG = bgModel.primary.g, bgB = bgModel.primary.b;

  for (let idx = 0; idx < totalPixels; idx++) {
    const pIdx = idx * 4;
    const origA = data[pIdx + 3];
    if (origA < 30) { data[pIdx + 3] = 0; continue; }
    if (visited[idx] === 1) {
      const d = distMap[idx];
      if (d <= innerTol) { data[pIdx + 3] = 0; }
      else if (d < outerTol) {
        const t = (d - innerTol) / tolRange;
        const smoothT = t * t * (3 - 2 * t);
        data[pIdx + 3] = Math.min(origA, Math.max(0, Math.round(smoothT * 255)));
      }
    }
  }

  const alphaCopy = new Uint8Array(totalPixels);
  for (let i = 0; i < totalPixels; i++) alphaCopy[i] = data[i * 4 + 3];

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;
      if (alphaCopy[idx] === 0) {
        const nOpaque = (alphaCopy[idx-1] > 200 ? 1 : 0) + (alphaCopy[idx+1] > 200 ? 1 : 0) +
                        (alphaCopy[idx-width] > 200 ? 1 : 0) + (alphaCopy[idx+width] > 200 ? 1 : 0);
        if (nOpaque >= 2 && distMap[idx] > innerTol * 0.8) {
          data[idx * 4 + 3] = Math.round(nOpaque * 35);
        }
      }
    }
  }

  for (let idx = 0; idx < totalPixels; idx++) {
    const pIdx = idx * 4;
    const a = data[pIdx + 3];
    if (a > 0 && a < 254) {
      const normA = a / 255.0;
      const invA = 1.0 - normA;
      const safeNormA = Math.max(0.18, normA);
      data[pIdx]     = Math.max(0, Math.min(255, Math.round((data[pIdx]     - invA * bgR) / safeNormA)));
      data[pIdx + 1] = Math.max(0, Math.min(255, Math.round((data[pIdx + 1] - invA * bgG) / safeNormA)));
      data[pIdx + 2] = Math.max(0, Math.min(255, Math.round((data[pIdx + 2] - invA * bgB) / safeNormA)));
    }
  }

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;
      const a = data[idx * 4 + 3];
      if (a > 0 && a < 150) {
        const nTransp = (data[(idx-1)*4+3] === 0 ? 1 : 0) + (data[(idx+1)*4+3] === 0 ? 1 : 0) +
                        (data[(idx-width)*4+3] === 0 ? 1 : 0) + (data[(idx+width)*4+3] === 0 ? 1 : 0);
        if (nTransp === 4) data[idx * 4 + 3] = 0;
      }
    }
  }
}

// ─── Error & Message Handlers ──────────────────────────────────────────
self.onerror = function(err) {
  try {
    self.postMessage({ type: 'error', message: (err && err.message) ? err.message : 'Worker internal error' });
  } catch (e) {}
};

self.onmessage = function(e) {
  if (!e.data) return;
  const { jobId, imageData, cancelled } = e.data;
  if (cancelled) return;

  try {
    if (!imageData || !imageData.data || !imageData.width || !imageData.height) {
      self.postMessage({ type: 'error', jobId, message: 'Data gambar tidak valid untuk worker' });
      return;
    }

    const { data, width, height } = imageData;
    self.postMessage({ type: 'progress', jobId, pct: 10 });

    const bgModel = detectAndBuildBackgroundModel(data, width, height);

    self.postMessage({ type: 'progress', jobId, pct: 35 });

    const { visited, distMap } = floodFillBackgroundConnected(data, width, height, bgModel);

    self.postMessage({ type: 'progress', jobId, pct: 70 });

    refineEdgesAndAlphaMatte(data, width, height, visited, distMap, bgModel);

    self.postMessage({ type: 'progress', jobId, pct: 95 });

    // Transfer buffer back (zero-copy)
    self.postMessage({ type: 'done', jobId, imageData: { data, width, height } }, [data.buffer]);

  } catch (err) {
    self.postMessage({ type: 'error', jobId, message: err ? err.message : 'Worker error' });
  }
};
