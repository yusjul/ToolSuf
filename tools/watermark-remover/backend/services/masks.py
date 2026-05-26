import numpy as np
import cv2


def build_mask(height: int, width: int, masks: list, dilate: bool = True,
               dilate_size: int = 11, iterations: int = 4):
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
        x2 = min(width, x + w)
        y2 = min(height, y + h)

        if x2 > x1 and y2 > y1:
            mask[y1:y2, x1:x2] = 255

    if not np.any(mask):
        return None

    if dilate:
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (dilate_size, dilate_size))
        mask = cv2.dilate(mask, kernel, iterations=iterations)

    return mask


def build_soft_mask(mask):
    kernel_e = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
    inpaint_mask = cv2.erode(mask, kernel_e, iterations=1)
    if not np.any(inpaint_mask):
        inpaint_mask = mask.copy()

    return {
        'inpaint': inpaint_mask.astype(np.uint8),
        'hard': mask.astype(np.uint8),
    }
