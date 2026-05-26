import cv2
import numpy as np

_prev_result = None


def reset_temporal_cache():
    global _prev_result
    _prev_result = None


def inpaint_frame(frame, mask_dict, method='advanced', radius=5):
    global _prev_result
    hard = mask_dict['hard']

    if method == 'fast':
        result = cv2.inpaint(frame, hard, radius, cv2.INPAINT_NS)
        return _feather_boundary(result, frame, hard, radius=8)

    inpaint = mask_dict['inpaint']

    result = _pyramid_inpaint(frame, inpaint, radius)
    result = _bilateral_refine(result, hard)
    result = _match_histogram_lab(result, frame, hard)
    result = _poisson_clone(result, frame, hard)
    result = _detail_enhance(result, hard)
    result = _temporal_smooth(result, hard, _prev_result)

    _prev_result = result.copy()
    return result


# ----------------------------------------------------------------
# Stage 1 & 2  —  Multi-scale Laplacian pyramid + dual-method blend
# ----------------------------------------------------------------
def _pyramid_inpaint(frame, mask, radius):
    levels = 3
    gauss_u8 = [frame]
    gauss_m = [mask]

    for _ in range(levels - 1):
        gauss_u8.append(cv2.pyrDown(gauss_u8[-1]))
        gauss_m.append(cv2.pyrDown(gauss_m[-1]))

    gauss_f = [f.astype(np.float32) for f in gauss_u8]

    coarse_u8 = gauss_u8[-1]
    coarse_f = gauss_f[-1]
    coarse_m = (gauss_m[-1] > 127).astype(np.uint8) * 255
    r_coarse = max(1, radius // (2 ** (levels - 1)))

    if np.any(coarse_m):
        ns = cv2.inpaint(coarse_u8, coarse_m, r_coarse, cv2.INPAINT_NS)
        te = cv2.inpaint(coarse_u8, coarse_m, r_coarse, cv2.INPAINT_TELEA)
        current_f = _blend_dual(ns.astype(np.float32),
                                te.astype(np.float32), coarse_m)
    else:
        current_f = coarse_f

    for i in range(levels - 2, -1, -1):
        h, w = gauss_f[i].shape[:2]

        up = cv2.pyrUp(current_f, dstsize=(w, h))
        detail = gauss_f[i] - cv2.pyrUp(gauss_f[i + 1], dstsize=(w, h))
        merged_f = up + detail

        level_u8 = np.clip(merged_f, 0, 255).astype(np.uint8)
        level_m = (gauss_m[i] > 127).astype(np.uint8) * 255
        r_level = max(1, radius // (2 ** i))

        if np.any(level_m):
            ns = cv2.inpaint(level_u8, level_m, r_level, cv2.INPAINT_NS)
            te = cv2.inpaint(level_u8, level_m, r_level, cv2.INPAINT_TELEA)
            current_f = _blend_dual(ns.astype(np.float32),
                                    te.astype(np.float32), level_m)
        else:
            current_f = merged_f

    return np.clip(current_f, 0, 255).astype(np.uint8)


def _blend_dual(ns_result, telea_result, mask):
    mask_bin = (mask > 127).astype(np.float32)
    if not np.any(mask_bin):
        return ns_result

    gray = cv2.cvtColor(ns_result.astype(np.uint8), cv2.COLOR_BGR2GRAY)
    lap = np.abs(cv2.Laplacian(gray, cv2.CV_32F))
    lap = cv2.GaussianBlur(lap, (15, 15), 0)

    lo, hi = lap.min(), lap.max()
    texture = (lap - lo) / (hi - lo) if hi > lo else np.zeros_like(lap)

    telea_w = texture * mask_bin
    ns_w = (1.0 - texture) * mask_bin
    total_w = telea_w + ns_w + 1e-8

    result = ns_result.copy()
    in_mask = mask_bin > 0.5
    for c in range(3):
        blend = (ns_result[:, :, c] * ns_w + telea_result[:, :, c] * telea_w) / total_w
        result[:, :, c][in_mask] = blend[in_mask]

    return result


# ----------------------------------------------------------------
# Stage 3  —  Edge-preserving refinement
# ----------------------------------------------------------------
def _bilateral_refine(result, mask, d=7, sigma_color=50, sigma_space=25):
    mask_bin = (mask > 127).astype(np.uint8)
    if not np.any(mask_bin):
        return result

    smoothed = cv2.bilateralFilter(result, d, sigma_color, sigma_space)
    out = result.copy()
    out[mask_bin > 0] = smoothed[mask_bin > 0]
    return out


# ----------------------------------------------------------------
# Stage 4  —  LAB histogram matching (luminance only)
# ----------------------------------------------------------------
def _match_histogram_lab(result, original, mask):
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (21, 21))
    outer = cv2.dilate(mask, kernel)

    kernel_e = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
    inner = cv2.erode(mask, kernel_e)

    boundary = np.zeros_like(mask)
    boundary[(outer > 127) & (inner < 127)] = 255
    if not np.any(boundary):
        return result

    result_lab = cv2.cvtColor(result, cv2.COLOR_BGR2LAB).astype(np.float32)
    original_lab = cv2.cvtColor(original, cv2.COLOR_BGR2LAB).astype(np.float32)

    out_lab = result_lab.copy()

    target = original_lab[:, :, 0][boundary > 0]
    source = result_lab[:, :, 0][mask > 127]
    if len(target) > 50 and len(source) > 50:
        t_sorted = np.sort(target)
        s_sorted = np.sort(source)
        t_cdf = np.arange(1, len(t_sorted) + 1, dtype=np.float32) / len(t_sorted)
        s_cdf = np.arange(1, len(s_sorted) + 1, dtype=np.float32) / len(s_sorted)

        lut = np.zeros(256, dtype=np.float32)
        for s_val in range(256):
            idx_s = np.searchsorted(s_sorted, float(s_val), side='right')
            pos_s = s_cdf[idx_s - 1] if idx_s > 0 else 0.0
            idx_t = np.searchsorted(t_cdf, pos_s, side='left')
            if idx_t >= len(t_sorted):
                idx_t = len(t_sorted) - 1
            lut[s_val] = t_sorted[idx_t]

        lut = cv2.GaussianBlur(lut.reshape(1, -1), (1, 5), 0).flatten()
        lut = np.clip(lut, 0, 255)

        src_idx = np.clip(out_lab[:, :, 0][mask > 127].astype(np.int32), 0, 255)
        out_lab[:, :, 0][mask > 127] = lut[src_idx]

    out = cv2.cvtColor(out_lab.astype(np.uint8), cv2.COLOR_LAB2BGR)
    return out


# ----------------------------------------------------------------
# Stage 5  —  Poisson seamless cloning (gradient-domain blending)
# ----------------------------------------------------------------
def _poisson_clone(result, original, mask):
    mask_bin = (mask > 127).astype(np.uint8)
    if not np.any(mask_bin):
        return result

    ys, xs = np.where(mask_bin > 0)
    if len(ys) == 0:
        return result

    cx = int((xs.min() + xs.max()) / 2)
    cy = int((ys.min() + ys.max()) / 2)

    try:
        cloned = cv2.seamlessClone(result, original, mask_bin, (cx, cy), cv2.MIXED_CLONE)
        return cloned
    except Exception:
        return result


# ----------------------------------------------------------------
# Stage 6  —  Detail enhancement inside masked region
# ----------------------------------------------------------------
def _detail_enhance(result, mask, sigma_s=10, sigma_r=0.15):
    mask_bin = (mask > 127).astype(np.uint8)
    if not np.any(mask_bin):
        return result

    enhanced = cv2.detailEnhance(result, sigma_s=sigma_s, sigma_r=sigma_r)
    out = result.copy()
    out[mask_bin > 0] = enhanced[mask_bin > 0]
    return out


# ----------------------------------------------------------------
# Stage 7  —  Temporal smoothing (reduce flicker between frames)
# ----------------------------------------------------------------
def _temporal_smooth(current, mask, prev, weight=0.4):
    if prev is None or current.shape != prev.shape:
        return current

    mask_bin = (mask > 127).astype(np.float32)
    w3 = np.stack([mask_bin * weight] * 3, axis=2)
    blended = current * (1.0 - w3) + prev * w3
    return np.clip(blended, 0, 255).astype(np.uint8)


# ----------------------------------------------------------------
# Fallback feather (used by 'fast' method only)
# ----------------------------------------------------------------
def _feather_boundary(result, original, mask, radius=10):
    mask_bin = (mask > 127).astype(np.uint8)
    if not np.any(mask_bin):
        return original

    dist = cv2.distanceTransform(mask_bin, cv2.DIST_L2, 5).astype(np.float32)
    weight = np.clip(dist / radius, 0, 1)
    weight = cv2.GaussianBlur(weight, (0, 0), radius / 4)
    weight = np.clip(weight, 0, 1)

    w3 = np.stack([weight] * 3, axis=2)
    out = result * w3 + original * (1.0 - w3)
    return np.clip(out, 0, 255).astype(np.uint8)
