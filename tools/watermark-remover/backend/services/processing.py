import cv2
import numpy as np
from .inpaint import inpaint_frame, reset_temporal_cache
from .masks import build_mask, build_soft_mask
from .video import VideoReader, VideoWriter


def process_video(input_path: str, output_path: str, masks: list,
                  method: str = 'advanced', radius: int = 8,
                  progress_callback=None):
    """Process every frame of *input_path*, inpaint masked regions, write output.

    radius: inpaint search radius in pixels (larger = better for wide watermarks,
            slower). Default raised from 3 → 8 for more thorough removal.
    """
    reader = VideoReader(input_path)
    fps    = reader.fps
    width, height = reader.size
    total  = reader.frame_count

    mask_arr = build_mask(height, width, masks, dilate=True)

    if mask_arr is None:
        # No valid mask → just copy frames through
        writer = VideoWriter(output_path, fps, (width, height))
        idx = 0
        while True:
            ret, frame = reader.read()
            if not ret:
                break
            writer.write(frame)
            if progress_callback:
                pct = int(50 + (idx / max(total, 1)) * 45)
                progress_callback(pct, f'Frame {idx + 1}/{total}')
            idx += 1
        writer.release()
        reader.release()
        return

    mask_dict = build_soft_mask(mask_arr)
    reset_temporal_cache()

    writer = VideoWriter(output_path, fps, (width, height))
    idx = 0
    while True:
        ret, frame = reader.read()
        if not ret:
            break

        processed = inpaint_frame(frame, mask_dict, method, radius)
        writer.write(processed)

        if progress_callback:
            pct = int(10 + (idx / max(total, 1)) * 85)
            progress_callback(pct, f'Frame {idx + 1}/{total}')
        idx += 1

    writer.release()
    reader.release()
