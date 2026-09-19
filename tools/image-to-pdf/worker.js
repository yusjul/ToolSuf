/**
 * Document Scanner Processing Worker — v5.0
 *
 * Implements the complete 10-step CamScanner document pipeline:
 *   Original
 *     ↓
 *   Perspective Correction (executed in script.js)
 *     ↓
 *   Grayscale / Luminance
 *     ↓
 *   Large-scale Illumination Estimation
 *     ↓
 *   Shadow Removal
 *     ↓
 *   Background Normalization
 *     ↓
 *   Edge-aware Whitening
 *     ↓
 *   Local Contrast Enhancement
 *     ↓
 *   Mild Sharpening
 *     ↓
 *   Final Document (Color Reconstruction / Sauvola / Grayscale)
 */

'use strict';

self.onmessage = function (e) {
  const { id, type, buffer, width: w, height: h, filter, options } = e.data;
  if (type !== 'process') return;
  try {
    const src = new Uint8ClampedArray(buffer);
    const out = new Uint8ClampedArray(src.length);
    const opts = options || {};
    switch (filter) {
      case 'magic':   processDocument(src, out, w, h, opts); break;
      case 'bw':      processBW      (src, out, w, h, opts); break;
      case 'gray':    processGray    (src, out, w, h, opts); break;
      case 'lighten': processLighten (src, out, w, h, opts); break;
      default:        processOriginal(src, out, w, h, opts); break;
    }
    self.postMessage({ id, success: true, buffer: out.buffer, width: w, height: h }, [out.buffer]);
  } catch (err) {
    self.postMessage({ id, success: false, error: err.message, width: w, height: h });
  }
};

/* ── 1. Summed Area Table (SAT) / Integral Image ────────────── */

function buildSAT(g, w, h) {
  const W1 = w + 1;
  const sat = new Float64Array(W1 * (h + 1));
  for (let y = 0; y < h; y++) {
    const row = y * w, satRow = (y + 1) * W1, satPrev = y * W1;
    let rowSum = 0;
    for (let x = 0; x < w; x++) {
      rowSum += g[row + x];
      sat[satRow + x + 1] = sat[satPrev + x + 1] + rowSum;
    }
  }
  return sat;
}

function satQ(sat, W1, x0, y0, x1, y1) {
  return sat[y1 * W1 + x1] - sat[y0 * W1 + x1] - sat[y1 * W1 + x0] + sat[y0 * W1 + x0];
}

function boxMean(sat, w, h, r) {
  const W1 = w + 1, out = new Float32Array(w * h);
  for (let y = 0; y < h; y++) {
    const y0 = Math.max(0, y - r), y1 = Math.min(h, y + r + 1);
    for (let x = 0; x < w; x++) {
      const x0 = Math.max(0, x - r), x1 = Math.min(w, x + r + 1);
      out[y * w + x] = satQ(sat, W1, x0, y0, x1, y1) / ((y1 - y0) * (x1 - x0));
    }
  }
  return out;
}

/* ── 2. Grayscale / Luminance ───────────────────────────────── */

function stepGrayscale(src, w, h) {
  const len = w * h, g = new Float32Array(len);
  for (let i = 0, j = 0; i < len; i++, j += 4) {
    g[i] = src[j] * 0.299 + src[j + 1] * 0.587 + src[j + 2] * 0.114;
  }
  return g;
}

/* ── 3. Large-scale Illumination Estimation ─────────────────── */

function stepLargeScaleIllumination(g, sat, w, h) {
  const r = Math.max(30, Math.min(180, Math.round(Math.min(w, h) / 5)));
  return boxMean(sat, w, h, r);
}

/* ── 4. Shadow Removal (Divide-by-Background) ───────────────── */

function stepShadowRemoval(g, bg, w, h) {
  const TARGET = 225, EPS = 10;
  const len = w * h, out = new Float32Array(len);
  for (let i = 0; i < len; i++) {
    const b = bg[i] < EPS ? EPS : bg[i];
    out[i] = Math.min(255, (g[i] / b) * TARGET);
  }
  return out;
}

/* ── 5. Background Normalization (Histogram Percentile Stretch) */

function stepBackgroundNormalization(g, lo, hi) {
  const len = g.length, hist = new Int32Array(256);
  for (let i = 0; i < len; i++) {
    hist[Math.min(255, Math.max(0, g[i] | 0))]++;
  }
  const loTh = len * lo, hiTh = len * hi;
  let cnt = 0, minV = 0, maxV = 255;
  for (let v = 0; v < 256; v++) {
    cnt += hist[v];
    if (cnt < loTh) minV = v;
    if (cnt <= hiTh) maxV = v;
  }
  if (maxV <= minV) return g;
  const sc = 255 / (maxV - minV), out = new Float32Array(len);
  for (let i = 0; i < len; i++) {
    out[i] = Math.min(255, Math.max(0, (g[i] - minV) * sc));
  }
  return out;
}

/* ── 6. Edge-aware Whitening ────────────────────────────────── */

function stepEdgeAwareWhitening(g, w, h) {
  const len = w * h, out = new Float32Array(len);
  for (let y = 0; y < h; y++) {
    const yw = y * w;
    const yTop = Math.max(0, y - 1) * w;
    const yBot = Math.min(h - 1, y + 1) * w;
    for (let x = 0; x < w; x++) {
      const idx = yw + x;
      const v = g[idx];
      if (v <= 140) {
        out[idx] = v;
        continue;
      }
      // Sobel gradient magnitude
      const xLeft = Math.max(0, x - 1), xRight = Math.min(w - 1, x + 1);
      const gx = Math.abs(g[yw + xRight] - g[yw + xLeft]);
      const gy = Math.abs(g[yBot + x] - g[yTop + x]);
      const grad = gx + gy;

      if (grad < 25) {
        // Flat background paper -> aggressively boost to pure white
        const t = (v - 140) / 115;
        out[idx] = 140 + Math.pow(t, 0.45) * 115;
      } else {
        // Character stroke edge -> smooth transition to prevent line erosion
        const t = (v - 140) / 115;
        out[idx] = 140 + Math.pow(t, 0.75) * 115;
      }
    }
  }
  return out;
}

/* ── 7. Local Contrast Enhancement ──────────────────────────── */

function stepLocalContrastEnhancement(g, sat, w, h) {
  const localMean = boxMean(sat, w, h, 6);
  const len = w * h, out = new Float32Array(len);
  for (let i = 0; i < len; i++) {
    const v = g[i], m = localMean[i];
    const diff = v - m;
    if (diff < 0) {
      // Dark stroke on lighter background: boost stroke darkness
      out[i] = Math.max(0, m + diff * 1.35);
    } else {
      // Light background near stroke: boost lightness
      out[i] = Math.min(255, m + diff * 1.15);
    }
  }
  return out;
}

/* ── 8. Mild Sharpening ─────────────────────────────────────── */

function stepMildSharpening(g, sat, w, h, amount) {
  const blur = boxMean(sat, w, h, 1);
  const len = w * h, out = new Float32Array(len);
  for (let i = 0; i < len; i++) {
    const diff = g[i] - blur[i];
    out[i] = Math.min(255, Math.max(0, g[i] + amount * diff));
  }
  return out;
}

/* ── 9. Sauvola Adaptive Threshold (B&W Filter) ─────────────── */

function sauvola(g, w, h) {
  const wRad = Math.max(8, Math.min(24, Math.round(Math.min(w, h) / 30)));
  const k = 0.25, R = 128;
  const sat = buildSAT(g, w, h);
  const g2 = new Float32Array(g.length);
  for (let i = 0; i < g.length; i++) g2[i] = g[i] * g[i];
  const sat2 = buildSAT(g2, w, h);
  const W1 = w + 1, out = new Uint8Array(g.length);
  for (let y = 0; y < h; y++) {
    const y0 = Math.max(0, y - wRad), y1 = Math.min(h, y + wRad + 1);
    for (let x = 0; x < w; x++) {
      const x0 = Math.max(0, x - wRad), x1 = Math.min(w, x + wRad + 1);
      const area = (y1 - y0) * (x1 - x0);
      const sum = satQ(sat, W1, x0, y0, x1, y1);
      const sum2 = satQ(sat2, W1, x0, y0, x1, y1);
      const mean = sum / area;
      const std = Math.sqrt(Math.max(0, sum2 / area - mean * mean));
      out[y * w + x] = g[y * w + x] < mean * (1 + k * (std / R - 1)) ? 0 : 255;
    }
  }
  return out;
}

/* ── 10. Brightness / Contrast LUT ──────────────────────────── */

function bcLUT(br, ct) {
  const cf = (259 * (ct + 255)) / (255 * (259 - ct));
  const lut = new Uint8Array(256);
  for (let i = 0; i < 256; i++) {
    let v = Math.round(cf * (i - 128) + 128 + br * 1.2);
    lut[i] = v < 0 ? 0 : (v > 255 ? 255 : v);
  }
  return lut;
}

function grayOut(g, out) {
  for (let i = 0, j = 0; i < g.length; i++, j += 4) {
    const v = g[i] < 0 ? 0 : (g[i] > 255 ? 255 : g[i] | 0);
    out[j] = out[j + 1] = out[j + 2] = v;
    out[j + 3] = 255;
  }
}

/* ── COMPLETE PIPELINE: magic (Document) ─────────────────────── */

function processDocument(src, out, w, h, opts) {
  // Step 1: Grayscale / Luminance
  const luma = stepGrayscale(src, w, h);

  // Step 2: Large-scale Illumination Estimation
  const sat1 = buildSAT(luma, w, h);
  const illum = (opts.shadowRemoval !== false) ? stepLargeScaleIllumination(luma, sat1, w, h) : null;

  // Step 3: Shadow Removal
  let g = illum ? stepShadowRemoval(luma, illum, w, h) : luma;

  // Step 4: Background Normalization
  g = stepBackgroundNormalization(g, 0.01, 0.98);

  // Step 5: Edge-aware Whitening
  g = stepEdgeAwareWhitening(g, w, h);

  // Step 6: Local Contrast Enhancement
  const sat2 = buildSAT(g, w, h);
  g = stepLocalContrastEnhancement(g, sat2, w, h);

  // Step 7: Mild Sharpening
  if (opts.textSharpness !== false) {
    const sat3 = buildSAT(g, w, h);
    g = stepMildSharpening(g, sat3, w, h, 0.65);
  }

  // Optional Brightness / Contrast adjustment
  if (opts.brightness || opts.contrast) {
    const lut = bcLUT(opts.brightness || 0, opts.contrast || 0);
    for (let i = 0; i < g.length; i++) g[i] = lut[g[i] | 0];
  }

  // Step 8: Final Document — Color Reconstruction for signatures/stamps
  const len = w * h;
  for (let i = 0, j = 0; i < len; i++, j += 4) {
    const oR = src[j], oG = src[j + 1], oB = src[j + 2];
    const oL = luma[i];
    const maxC = Math.max(oR, oG, oB);
    const minC = Math.min(oR, oG, oB);
    const newL = g[i];

    // Detect colored ink, stamp, signature, or diagram
    if ((maxC - minC) > 20 && oL > 10) {
      const sc = oL > 0 ? newL / oL : 1;
      out[j]     = Math.min(255, oR * sc) | 0;
      out[j + 1] = Math.min(255, oG * sc) | 0;
      out[j + 2] = Math.min(255, oB * sc) | 0;
    } else {
      const v = newL < 0 ? 0 : (newL > 255 ? 255 : newL | 0);
      out[j] = out[j + 1] = out[j + 2] = v;
    }
    out[j + 3] = 255;
  }
}

/* ── COMPLETE PIPELINE: bw (Sauvola Adaptive Threshold) ─────── */

function processBW(src, out, w, h, opts) {
  const luma = stepGrayscale(src, w, h);
  const sat1 = buildSAT(luma, w, h);
  const illum = stepLargeScaleIllumination(luma, sat1, w, h);
  let g = stepShadowRemoval(luma, illum, w, h);
  g = stepBackgroundNormalization(g, 0.01, 0.99);

  const bin = sauvola(g, w, h);
  for (let i = 0, j = 0; i < w * h; i++, j += 4) {
    const v = bin[i];
    out[j] = out[j + 1] = out[j + 2] = v;
    out[j + 3] = 255;
  }
}

/* ── COMPLETE PIPELINE: gray (Grayscale Document) ───────────── */

function processGray(src, out, w, h, opts) {
  const luma = stepGrayscale(src, w, h);
  const sat1 = buildSAT(luma, w, h);
  const illum = (opts.shadowRemoval !== false) ? stepLargeScaleIllumination(luma, sat1, w, h) : null;
  let g = illum ? stepShadowRemoval(luma, illum, w, h) : luma;

  g = stepBackgroundNormalization(g, 0.01, 0.99);
  g = stepEdgeAwareWhitening(g, w, h);

  const sat2 = buildSAT(g, w, h);
  g = stepLocalContrastEnhancement(g, sat2, w, h);

  if (opts.textSharpness !== false) {
    const sat3 = buildSAT(g, w, h);
    g = stepMildSharpening(g, sat3, w, h, 0.5);
  }

  if (opts.brightness || opts.contrast) {
    const lut = bcLUT(opts.brightness || 0, opts.contrast || 0);
    for (let i = 0; i < g.length; i++) g[i] = lut[g[i] | 0];
  }
  grayOut(g, out);
}

/* ── COMPLETE PIPELINE: lighten ─────────────────────────────── */

function processLighten(src, out, w, h, opts) {
  let g = stepGrayscale(src, w, h);
  for (let i = 0; i < g.length; i++) {
    g[i] = 255 * Math.pow(g[i] / 255, 0.72);
  }
  const sat1 = buildSAT(g, w, h);
  const illum = (opts.shadowRemoval !== false) ? stepLargeScaleIllumination(g, sat1, w, h) : null;
  if (illum) g = stepShadowRemoval(g, illum, w, h);
  g = stepBackgroundNormalization(g, 0.005, 0.995);

  if (opts.brightness || opts.contrast) {
    const lut = bcLUT(opts.brightness || 0, opts.contrast || 0);
    for (let i = 0; i < g.length; i++) g[i] = lut[g[i] | 0];
  }
  grayOut(g, out);
}

/* ── ORIGINAL ───────────────────────────────────────────────── */

function processOriginal(src, out, w, h, opts) {
  const br = opts.brightness || 0, ct = opts.contrast || 0;
  if (br === 0 && ct === 0) {
    out.set(src);
    return;
  }
  const lut = bcLUT(br, ct);
  for (let i = 0; i < src.length; i += 4) {
    out[i]     = lut[src[i]];
    out[i + 1] = lut[src[i + 1]];
    out[i + 2] = lut[src[i + 2]];
    out[i + 3] = src[i + 3];
  }
}
