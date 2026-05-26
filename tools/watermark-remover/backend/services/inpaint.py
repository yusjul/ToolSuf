import cv2
import numpy as np

_prev_result = None
_frame_idx   = 0


def reset_temporal_cache():
    global _prev_result, _frame_idx
    _prev_result = None
    _frame_idx   = 0


# ──────────────────────────────────────────────────────────────────────────────
# Public entry point
# ──────────────────────────────────────────────────────────────────────────────
def inpaint_frame(frame: np.ndarray, mask_dict: dict,
                  method: str = 'advanced', radius: int = 8) -> np.ndarray:
    """Remove the masked region from *frame* and reconstruct the background.

    Pipeline (advanced):
        1. Expand mask to cover semi-transparent edges (opacity spread)
        2. Multi-scale Telea+NS pyramid inpaint
        3. Edge-preserving bilateral refinement inside mask
        4. Luminance histogram matching at mask boundary
        5. Poisson seamless clone (gradient-domain blending)
        6. Texture-aware sharpening inside mask
        7. Temporal blending to suppress flicker between frames
    """
    global _prev_result, _frame_idx

    hard = mask_dict['hard']

    if method == 'fast':
        result = cv2.inpaint(frame, hard, max(radius, 5), cv2.INPAINT_TELEA)
        result = _feather_boundary(result, frame, hard, radius=radius * 2)
        _prev_result = result.copy()
        _frame_idx  += 1
        return result

    # ── advanced ──────────────────────────────────────────────────────────────
    inpaint_m = mask_dict['inpaint']

    # Stage 1: expand mask to cover semi-transparent watermark fringe
    expanded = _opacity_spread(frame, hard)

    # Stage 2: multi-scale pyramid inpaint (main reconstruction)
    result = _pyramid_inpaint(frame, expanded, radius)

    # Stage 3: edge-preserving refinement on dilated mask
    result = _bilateral_refine(result, expanded)

    # Stage 4: luminance histogram match at mask boundary
    result = _match_histogram_lab(result, frame, hard)

    # Stage 5: Poisson gradient-domain clone
    result = _poisson_clone(result, frame, hard)

    # Stage 6: texture-aware in-mask sharpening
    result = _texture_sharpen(result, frame, hard)

    # Stage 7: temporal smoothing
    result = _temporal_smooth(result, hard, _prev_result,
                              weight=0.35 if _frame_idx > 0 else 0.0)

    _prev_result = result.copy()
    _frame_idx  += 1
    return result


# ──────────────────────────────────────────────────────────────────────────────
# Stage 0 — Opacity spread
# ──────────────────────────────────────────────────────────────────────────────
def _opacity_spread(frame: np.ndarray, mask: np.ndarray) -> np.ndarray:
    """Extend mask to pixels whose colour deviates unusually from local mean.

    Semi-transparent watermarks look like a "ghost" tint on the background.
    We detect them by measuring per-pixel deviation from a local blur.
    """
    if not np.any(mask):
        return mask

    # Candidate region: dilated mask (possible fringe)
    big_k = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (25, 25))
    search = cv2.dilate(mask, big_k, iterations=3)

    gray  = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY).astype(np.float32)
    blur  = cv2.GaussianBlur(gray, (21, 21), 0)
    std   = cv2.GaussianBlur((gray - blur) ** 2, (21, 21), 0) ** 0.5
    dev   = np.abs(gray - blur) / (std + 1.0)   # normalised deviation

    # Pixels in search region with high deviation → likely watermark fringe
    fringe = ((dev > 1.2) & (search > 0)).astype(np.uint8) * 255

    expanded = cv2.bitwise_or(mask, fringe)

    # Close small gaps
    close_k = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (9, 9))
    expanded = cv2.morphologyEx(expanded, cv2.MORPH_CLOSE, close_k)
    return expanded


# ──────────────────────────────────────────────────────────────────────────────
# Stage 1 & 2 — Multi-scale Laplacian pyramid + dual-method blend
# ──────────────────────────────────────────────────────────────────────────────
def _pyramid_inpaint(frame: np.ndarray, mask: np.ndarray,
                     radius: int) -> np.ndarray:
    levels = 4   # more levels → better coarse reconstruction
    gauss_u8 = [frame]
    gauss_m  = [mask]

    for _ in range(levels - 1):
        gauss_u8.append(cv2.pyrDown(gauss_u8[-1]))
        gauss_m.append(cv2.pyrDown(gauss_m[-1]))

    gauss_f = [f.astype(np.float32) for f in gauss_u8]

    # Coarsest level
    coarse_u8 = gauss_u8[-1]
    coarse_m  = (gauss_m[-1] > 64).astype(np.uint8) * 255
    r_coarse  = max(3, radius // (2 ** (levels - 1)))

    if np.any(coarse_m):
        ns   = cv2.inpaint(coarse_u8, coarse_m, r_coarse, cv2.INPAINT_NS)
        te   = cv2.inpaint(coarse_u8, coarse_m, r_coarse, cv2.INPAINT_TELEA)
        current_f = _blend_dual(ns.astype(np.float32),
                                te.astype(np.float32), coarse_m)
    else:
        current_f = gauss_f[-1]

    # Refine through pyramid levels
    for i in range(levels - 2, -1, -1):
        h, w = gauss_f[i].shape[:2]
        up      = cv2.pyrUp(current_f, dstsize=(w, h))
        detail  = gauss_f[i] - cv2.pyrUp(gauss_f[i + 1], dstsize=(w, h))
        merged  = up + detail

        level_u8 = np.clip(merged, 0, 255).astype(np.uint8)
        level_m  = (gauss_m[i] > 64).astype(np.uint8) * 255
        r_level  = max(3, radius // (2 ** i))

        if np.any(level_m):
            ns  = cv2.inpaint(level_u8, level_m, r_level, cv2.INPAINT_NS)
            te  = cv2.inpaint(level_u8, level_m, r_level, cv2.INPAINT_TELEA)
            current_f = _blend_dual(ns.astype(np.float32),
                                    te.astype(np.float32), level_m)
        else:
            current_f = merged

    return np.clip(current_f, 0, 255).astype(np.uint8)


def _blend_dual(ns_f: np.ndarray, telea_f: np.ndarray,
                mask: np.ndarray) -> np.ndarray:
    """Blend NS and TELEA based on local texture complexity."""
    mask_bin = (mask > 64).astype(np.float32)
    if not np.any(mask_bin):
        return ns_f

    gray = cv2.cvtColor(ns_f.astype(np.uint8), cv2.COLOR_BGR2GRAY)
    lap  = np.abs(cv2.Laplacian(gray, cv2.CV_32F))
    lap  = cv2.GaussianBlur(lap, (15, 15), 0)

    lo, hi = lap.min(), lap.max()
    texture = (lap - lo) / (hi - lo + 1e-8)

    # High texture → prefer TELEA; low texture → prefer NS
    telea_w = texture * mask_bin
    ns_w    = (1.0 - texture) * mask_bin
    total_w = telea_w + ns_w + 1e-8

    result   = ns_f.copy()
    in_mask  = mask_bin > 0.5
    for c in range(3):
        blend = (ns_f[:, :, c] * ns_w + telea_f[:, :, c] * telea_w) / total_w
        result[:, :, c][in_mask] = blend[in_mask]
    return result


# ──────────────────────────────────────────────────────────────────────────────
# Stage 3 — Edge-preserving refinement
# ──────────────────────────────────────────────────────────────────────────────
def _bilateral_refine(result: np.ndarray, mask: np.ndarray,
                      d: int = 9, sc: float = 50, ss: float = 25
                      ) -> np.ndarray:
    mask_bin = (mask > 64).astype(np.uint8)
    if not np.any(mask_bin):
        return result
    smoothed = cv2.bilateralFilter(result, d, sc, ss)
    out = result.copy()
    out[mask_bin > 0] = smoothed[mask_bin > 0]
    return out


# ──────────────────────────────────────────────────────────────────────────────
# Stage 4 — LAB histogram matching (luminance only)
# ──────────────────────────────────────────────────────────────────────────────
def _match_histogram_lab(result: np.ndarray, original: np.ndarray,
                          mask: np.ndarray) -> np.ndarray:
    kernel    = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (25, 25))
    outer     = cv2.dilate(mask, kernel)
    kernel_e  = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
    inner     = cv2.erode(mask, kernel_e)
    boundary  = np.zeros_like(mask)
    boundary[(outer > 64) & (inner < 64)] = 255
    if not np.any(boundary):
        return result

    res_lab  = cv2.cvtColor(result,   cv2.COLOR_BGR2LAB).astype(np.float32)
    orig_lab = cv2.cvtColor(original, cv2.COLOR_BGR2LAB).astype(np.float32)

    target = orig_lab[:, :, 0][boundary > 0]
    source = res_lab[:, :, 0][mask > 64]
    if len(target) < 20 or len(source) < 20:
        return result

    t_sorted = np.sort(target)
    s_sorted = np.sort(source)
    t_cdf = np.linspace(0, 1, len(t_sorted), endpoint=False)
    s_cdf = np.linspace(0, 1, len(s_sorted), endpoint=False)

    lut = np.zeros(256, dtype=np.float32)
    for s_val in range(256):
        pos_s = float(np.searchsorted(s_sorted, s_val, side='right')) / len(s_sorted)
        idx_t = int(np.searchsorted(t_cdf, pos_s, side='left'))
        idx_t = min(idx_t, len(t_sorted) - 1)
        lut[s_val] = t_sorted[idx_t]

    lut = cv2.GaussianBlur(lut.reshape(1, -1), (1, 7), 0).flatten()
    lut = np.clip(lut, 0, 255)

    out_lab = res_lab.copy()
    src_idx = np.clip(out_lab[:, :, 0][mask > 64].astype(np.int32), 0, 255)
    out_lab[:, :, 0][mask > 64] = lut[src_idx]

    return cv2.cvtColor(out_lab.astype(np.uint8), cv2.COLOR_LAB2BGR)


# ──────────────────────────────────────────────────────────────────────────────
# Stage 5 — Poisson seamless cloning
# ──────────────────────────────────────────────────────────────────────────────
def _poisson_clone(result: np.ndarray, original: np.ndarray,
                   mask: np.ndarray) -> np.ndarray:
    mask_bin = (mask > 64).astype(np.uint8)
    if not np.any(mask_bin):
        return result

    ys, xs = np.where(mask_bin > 0)
    if len(ys) == 0:
        return result

    cx = int((xs.min() + xs.max()) / 2)
    cy = int((ys.min() + ys.max()) / 2)

    try:
        cloned = cv2.seamlessClone(result, original, mask_bin * 255,
                                   (cx, cy), cv2.MIXED_CLONE)
        return cloned
    except Exception:
        return result


# ──────────────────────────────────────────────────────────────────────────────
# Stage 6 — Texture-aware sharpening inside mask
# Helps restore fine grain/texture that inpainting blurs away.
# ──────────────────────────────────────────────────────────────────────────────
def _texture_sharpen(result: np.ndarray, original: np.ndarray,
                     mask: np.ndarray) -> np.ndarray:
    """Borrow high-frequency detail from the *surrounding* (non-mask) area
    of the *original* frame and blend it into the inpainted region.

    This restores grain/texture and makes the removed area less "smooth".
    """
    mask_bin = (mask > 64).astype(np.uint8)
    if not np.any(mask_bin):
        return result

    # High-pass of original (captures grain/texture)
    blurred  = cv2.GaussianBlur(original, (0, 0), 3)
    high_pass = original.astype(np.float32) - blurred.astype(np.float32)

    # Dilate mask → get surrounding reference area
    k_ref = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (21, 21))
    outer = cv2.dilate(mask_bin, k_ref, iterations=2)
    ref_region = outer & ~mask_bin  # ring around the mask

    if not np.any(ref_region):
        return result

    # Average high-freq magnitude in reference ring
    ref_mag = np.abs(high_pass)
    ref_mean = ref_mag[ref_region > 0].mean(axis=0) if ref_region.any() else 0.0
    in_mag  = ref_mag[mask_bin > 0].mean(axis=0) if mask_bin.any() else 1.0

    # Scale factor: bring inpainted texture to same level as surrounding
    scale = np.clip(ref_mean / (in_mag + 1e-6), 0.5, 3.0)
    detail_scale = high_pass * scale

    out = result.astype(np.float32)
    out[mask_bin > 0] += detail_scale[mask_bin > 0]
    return np.clip(out, 0, 255).astype(np.uint8)


# ──────────────────────────────────────────────────────────────────────────────
# Stage 7 — Temporal smoothing (reduces flicker between frames)
# ──────────────────────────────────────────────────────────────────────────────
def _temporal_smooth(current: np.ndarray, mask: np.ndarray,
                     prev: np.ndarray, weight: float = 0.35) -> np.ndarray:
    if prev is None or current.shape != prev.shape or weight <= 0:
        return current

    mask_bin = (mask > 64).astype(np.float32)
    w3 = np.stack([mask_bin * weight] * 3, axis=2)
    blended = current * (1.0 - w3) + prev * w3
    return np.clip(blended, 0, 255).astype(np.uint8)


# ──────────────────────────────────────────────────────────────────────────────
# Fallback feather (fast mode only)
# ──────────────────────────────────────────────────────────────────────────────
def _feather_boundary(result: np.ndarray, original: np.ndarray,
                      mask: np.ndarray, radius: int = 12) -> np.ndarray:
    mask_bin = (mask > 64).astype(np.uint8)
    if not np.any(mask_bin):
        return original

    dist   = cv2.distanceTransform(mask_bin, cv2.DIST_L2, 5).astype(np.float32)
    weight = np.clip(dist / radius, 0, 1)
    weight = cv2.GaussianBlur(weight, (0, 0), radius / 4)
    weight = np.clip(weight, 0, 1)

    w3  = np.stack([weight] * 3, axis=2)
    out = result * w3 + original * (1.0 - w3)
    return np.clip(out, 0, 255).astype(np.uint8)
