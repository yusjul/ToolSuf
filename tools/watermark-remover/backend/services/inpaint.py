import cv2
import numpy as np

_prev_roi   = None   # temporal cache — stores only the ROI, not full frame
_roi_box    = None   # (y1, y2, x1, x2) bounding box of mask + padding
_frame_idx  = 0


def reset_temporal_cache():
    global _prev_roi, _roi_box, _frame_idx
    _prev_roi  = None
    _roi_box   = None
    _frame_idx = 0


# ─────────────────────────────────────────────────────────────────────────────
# Public entry point
# ─────────────────────────────────────────────────────────────────────────────
def inpaint_frame(frame: np.ndarray, mask_dict: dict,
                  method: str = 'advanced', radius: int = 8) -> np.ndarray:
    """Remove the masked watermark from *frame* and reconstruct the background.

    Key optimisation: all heavy operations (inpaint, bilateral, histogram
    match) are performed on the **ROI** (bounding box of the mask + small
    padding) rather than on the full frame.  For a 1920×1080 frame where the
    watermark occupies ~5% of the area this is typically 15-20× faster.

    Pipeline (advanced):
        1. Crop to ROI
        2. Expand mask fringe (opacity spread) — done once, cached
        3. Two-level TELEA pyramid inpaint (fast, good quality)
        4. Bilateral edge-preserving refinement inside mask
        5. LAB luminance histogram matching at boundary
        6. Lightweight Poisson-style gradient blend
        7. Temporal flicker suppression (ROI-only)
        8. Paste ROI back into full frame
    """
    global _prev_roi, _roi_box, _frame_idx

    hard = mask_dict['hard']

    # ── Compute ROI once and cache it ────────────────────────────────────────
    if _roi_box is None:
        _roi_box = _compute_roi(hard, frame.shape[:2], padding=40)

    y1, y2, x1, x2 = _roi_box
    roi_frame = frame[y1:y2, x1:x2].copy()
    roi_mask  = hard[y1:y2, x1:x2]

    if not np.any(roi_mask):
        # mask outside ROI — just return original
        return frame

    if method == 'fast':
        inpainted = cv2.inpaint(roi_frame, roi_mask,
                                max(radius, 5), cv2.INPAINT_TELEA)
        inpainted = _feather_boundary(inpainted, roi_frame, roi_mask, radius * 2)
        result = frame.copy()
        result[y1:y2, x1:x2] = inpainted
        _prev_roi  = inpainted.copy()
        _frame_idx += 1
        return result

    # ── advanced ─────────────────────────────────────────────────────────────
    # Stage 1: expand fringe to catch semi-transparent edges
    roi_expanded = _opacity_spread_roi(roi_frame, roi_mask)

    # Stage 2: two-level pyramid TELEA inpaint (fast + high quality)
    inpainted = _fast_pyramid_inpaint(roi_frame, roi_expanded, radius)

    # Stage 3: bilateral refinement inside mask
    inpainted = _bilateral_refine(inpainted, roi_frame, roi_expanded)

    # Stage 4: luminance histogram match at boundary
    inpainted = _match_histogram_lab(inpainted, roi_frame, roi_mask)

    # Stage 5: lightweight gradient-domain blend (no seamlessClone)
    inpainted = _gradient_blend(inpainted, roi_frame, roi_mask)

    # Stage 6: temporal smooth (ROI only — very cheap)
    inpainted = _temporal_smooth(inpainted, roi_mask, _prev_roi,
                                 weight=0.30 if _frame_idx > 0 else 0.0)

    # Stage 7: paste back
    result = frame.copy()
    result[y1:y2, x1:x2] = inpainted

    _prev_roi  = inpainted.copy()
    _frame_idx += 1
    return result


# ─────────────────────────────────────────────────────────────────────────────
# ROI helpers
# ─────────────────────────────────────────────────────────────────────────────
def _compute_roi(mask: np.ndarray, frame_shape: tuple, padding: int = 40):
    """Return (y1, y2, x1, x2) bounding box of mask pixels + padding."""
    ys, xs = np.where(mask > 0)
    if len(ys) == 0:
        h, w = frame_shape
        return 0, h, 0, w
    h, w = frame_shape
    y1 = max(0,  int(ys.min()) - padding)
    y2 = min(h,  int(ys.max()) + padding + 1)
    x1 = max(0,  int(xs.min()) - padding)
    x2 = min(w,  int(xs.max()) + padding + 1)
    return y1, y2, x1, x2


def _opacity_spread_roi(roi: np.ndarray, mask: np.ndarray) -> np.ndarray:
    """Extend mask to catch semi-transparent watermark pixels (ROI-only)."""
    if not np.any(mask):
        return mask

    big_k  = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (21, 21))
    search = cv2.dilate(mask, big_k, iterations=2)

    gray  = cv2.cvtColor(roi, cv2.COLOR_BGR2GRAY).astype(np.float32)
    blur  = cv2.GaussianBlur(gray, (15, 15), 0)
    std   = cv2.GaussianBlur((gray - blur) ** 2, (15, 15), 0) ** 0.5
    dev   = np.abs(gray - blur) / (std + 1.0)

    fringe   = ((dev > 1.2) & (search > 0)).astype(np.uint8) * 255
    expanded = cv2.bitwise_or(mask, fringe)
    close_k  = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7))
    return cv2.morphologyEx(expanded, cv2.MORPH_CLOSE, close_k)


# ─────────────────────────────────────────────────────────────────────────────
# Stage 2 — Fast 2-level pyramid with TELEA only (much faster than NS+TELEA×4)
# ─────────────────────────────────────────────────────────────────────────────
def _fast_pyramid_inpaint(roi: np.ndarray, mask: np.ndarray,
                          radius: int) -> np.ndarray:
    """Two-level pyramid with TELEA (best quality/speed trade-off).

    Coarse level fixes large areas; fine level preserves edge sharpness.
    """
    # Coarse level
    down_roi  = cv2.pyrDown(roi)
    down_mask = cv2.pyrDown(mask)
    down_mask_bin = (down_mask > 64).astype(np.uint8) * 255

    r_coarse = max(3, radius // 2)
    if np.any(down_mask_bin):
        coarse = cv2.inpaint(down_roi, down_mask_bin, r_coarse, cv2.INPAINT_TELEA)
    else:
        coarse = down_roi

    # Upscale coarse back to ROI size
    h, w = roi.shape[:2]
    coarse_up = cv2.pyrUp(coarse, dstsize=(w, h))

    # Fine level — inpaint on full ROI using coarse as initialisation hint
    mask_bin = (mask > 64).astype(np.uint8) * 255
    if np.any(mask_bin):
        # Replace masked pixels in ROI with coarse estimate, then refine
        hint = roi.copy()
        hint[mask_bin > 0] = coarse_up[mask_bin > 0]
        fine = cv2.inpaint(hint, mask_bin, radius, cv2.INPAINT_TELEA)
    else:
        fine = roi.copy()

    return fine


# ─────────────────────────────────────────────────────────────────────────────
# Stage 3 — Bilateral edge-preserving refinement (ROI-only)
# ─────────────────────────────────────────────────────────────────────────────
def _bilateral_refine(inpainted: np.ndarray, original: np.ndarray,
                      mask: np.ndarray) -> np.ndarray:
    mask_bin = (mask > 64).astype(np.uint8)
    if not np.any(mask_bin):
        return inpainted
    smoothed = cv2.bilateralFilter(inpainted, 7, 45, 20)
    out = inpainted.copy()
    out[mask_bin > 0] = smoothed[mask_bin > 0]
    return out


# ─────────────────────────────────────────────────────────────────────────────
# Stage 4 — LAB luminance histogram match at boundary
# ─────────────────────────────────────────────────────────────────────────────
def _match_histogram_lab(inpainted: np.ndarray, original: np.ndarray,
                          mask: np.ndarray) -> np.ndarray:
    kernel_d = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (19, 19))
    kernel_e = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5,  5))
    outer    = cv2.dilate(mask, kernel_d)
    inner    = cv2.erode(mask,  kernel_e)
    boundary = np.zeros_like(mask)
    boundary[(outer > 64) & (inner < 64)] = 255
    if not np.any(boundary):
        return inpainted

    res_lab  = cv2.cvtColor(inpainted, cv2.COLOR_BGR2LAB).astype(np.float32)
    orig_lab = cv2.cvtColor(original,  cv2.COLOR_BGR2LAB).astype(np.float32)

    target = orig_lab[:, :, 0][boundary > 0]
    source = res_lab[:, :, 0][mask > 64]
    if len(target) < 10 or len(source) < 10:
        return inpainted

    t_sorted = np.sort(target)
    s_sorted = np.sort(source)

    out_lab = res_lab.copy()
    src_idx = np.clip(out_lab[:, :, 0][mask > 64].astype(np.int32), 0, 255)

    # Simple linear remap from source range to target range
    s_lo, s_hi = s_sorted[0], s_sorted[-1]
    t_lo, t_hi = t_sorted[0], t_sorted[-1]
    if s_hi > s_lo:
        remapped = t_lo + (src_idx - s_lo) / (s_hi - s_lo + 1e-8) * (t_hi - t_lo)
        out_lab[:, :, 0][mask > 64] = np.clip(remapped, 0, 255)

    return cv2.cvtColor(out_lab.astype(np.uint8), cv2.COLOR_LAB2BGR)


# ─────────────────────────────────────────────────────────────────────────────
# Stage 5 — Lightweight gradient-domain blend (replaces slow seamlessClone)
# ─────────────────────────────────────────────────────────────────────────────
def _gradient_blend(inpainted: np.ndarray, original: np.ndarray,
                    mask: np.ndarray) -> np.ndarray:
    """Feathered blend at mask boundary — fast alternative to seamlessClone.

    Uses a distance-transform weight map to blend inpainted content with
    original at the edges, giving smooth transitions without Poisson solving.
    """
    mask_bin = (mask > 64).astype(np.uint8)
    if not np.any(mask_bin):
        return inpainted

    # Distance from mask edge (0 at edge, grows inward)
    dist = cv2.distanceTransform(mask_bin, cv2.DIST_L2, 3).astype(np.float32)
    max_d = dist.max()
    if max_d == 0:
        return inpainted

    # Smooth feather weight: 0 at boundary → 1 at centre
    weight = np.clip(dist / min(max_d, 20.0), 0, 1)
    weight = cv2.GaussianBlur(weight, (0, 0), 5)
    weight = np.clip(weight, 0, 1)
    w3 = np.stack([weight] * 3, axis=2)

    out = inpainted.astype(np.float32) * w3 + original.astype(np.float32) * (1.0 - w3)
    return np.clip(out, 0, 255).astype(np.uint8)


# ─────────────────────────────────────────────────────────────────────────────
# Stage 6 — Temporal flicker suppression (ROI only)
# ─────────────────────────────────────────────────────────────────────────────
def _temporal_smooth(current: np.ndarray, mask: np.ndarray,
                     prev: np.ndarray, weight: float = 0.30) -> np.ndarray:
    if prev is None or current.shape != prev.shape or weight <= 0:
        return current
    mask_bin = (mask > 64).astype(np.float32)
    w3 = np.stack([mask_bin * weight] * 3, axis=2)
    out = current * (1.0 - w3) + prev * w3
    return np.clip(out, 0, 255).astype(np.uint8)


# ─────────────────────────────────────────────────────────────────────────────
# Fallback feather (fast mode only)
# ─────────────────────────────────────────────────────────────────────────────
def _feather_boundary(result: np.ndarray, original: np.ndarray,
                      mask: np.ndarray, radius: int = 12) -> np.ndarray:
    mask_bin = (mask > 64).astype(np.uint8)
    if not np.any(mask_bin):
        return original
    dist   = cv2.distanceTransform(mask_bin, cv2.DIST_L2, 5).astype(np.float32)
    weight = np.clip(dist / max(radius, 1), 0, 1)
    weight = cv2.GaussianBlur(weight, (0, 0), max(radius / 4, 1))
    weight = np.clip(weight, 0, 1)
    w3  = np.stack([weight] * 3, axis=2)
    out = result * w3 + original * (1.0 - w3)
    return np.clip(out, 0, 255).astype(np.uint8)
