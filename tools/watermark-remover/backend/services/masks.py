import numpy as np
import cv2


def build_mask(height: int, width: int, masks: list, dilate: bool = True,
               dilate_size: int = 18, iterations: int = 5):
    """Build a binary mask from list of {x,y,w,h} dicts.

    dilate_size and iterations are larger than before so that
    semi-transparent watermark edges are fully covered.
    """
    if not masks:
        return None

    mask = np.zeros((height, width), dtype=np.uint8)

    for m in masks:
        x = int(round(m.get('x', 0)))
        y = int(round(m.get('y', 0)))
        w = int(round(m.get('w', 0)))
        h = int(round(m.get('h', 0)))

        x1 = max(0, x)
        y1 = max(0, y)
        x2 = min(width,  x + w)
        y2 = min(height, y + h)

        if x2 > x1 and y2 > y1:
            mask[y1:y2, x1:x2] = 255

    if not np.any(mask):
        return None

    if dilate:
        kernel = cv2.getStructuringElement(
            cv2.MORPH_ELLIPSE, (dilate_size, dilate_size))
        mask = cv2.dilate(mask, kernel, iterations=iterations)

    return mask


def build_soft_mask(mask):
    """Return dict with both 'inpaint' (eroded) and 'hard' (full) mask."""
    kernel_e = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
    inpaint_mask = cv2.erode(mask, kernel_e, iterations=1)
    if not np.any(inpaint_mask):
        inpaint_mask = mask.copy()

    return {
        'inpaint': inpaint_mask.astype(np.uint8),
        'hard':    mask.astype(np.uint8),
    }


def refine_mask_by_opacity(frame: np.ndarray, base_mask: np.ndarray,
                            opacity_threshold: float = 0.08) -> np.ndarray:
    """Expand mask to include semi-transparent watermark pixels.

    Converts to HSV and looks for unusual luminance/saturation patterns
    in the dilated border around the hand-drawn mask.
    Helps catch the faded edges that TELEA misses.
    """
    if not np.any(base_mask):
        return base_mask

    # Dilate base mask by a large margin to form search region
    big_kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (31, 31))
    search_region = cv2.dilate(base_mask, big_kernel, iterations=2)
    border_region = search_region & ~base_mask  # ring around the mask

    if not np.any(border_region):
        return base_mask

    # In the border area look for pixels that deviate from their local mean
    # (watermark blends with background → abnormal local contrast)
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY).astype(np.float32)
    local_mean = cv2.blur(gray, (15, 15))
    local_std  = cv2.blur((gray - local_mean) ** 2, (15, 15)) ** 0.5
    deviation  = np.abs(gray - local_mean) / (local_std + 1e-6)

    # Threshold: pixels in border region with high deviation belong to WM
    border_wm = (deviation > 1.5).astype(np.uint8) * 255
    border_wm &= border_region

    refined = base_mask.copy()
    refined |= border_wm
    # Close small gaps
    close_k = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7))
    refined = cv2.morphologyEx(refined, cv2.MORPH_CLOSE, close_k)
    return refined
