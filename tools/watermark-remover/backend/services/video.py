import cv2


class VideoReader:
    def __init__(self, path: str):
        self.cap = cv2.VideoCapture(path)
        if not self.cap.isOpened():
            raise RuntimeError(f'Cannot open video: {path}')

        self.fps = self.cap.get(cv2.CAP_PROP_FPS) or 25.0
        self.width = int(self.cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        self.height = int(self.cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        raw_count = int(self.cap.get(cv2.CAP_PROP_FRAME_COUNT))
        # Some containers report -1; fall back to a large sentinel so the
        # progress bar still works (will be capped at 99% until done).
        self.frame_count = raw_count if raw_count > 0 else 99999

    @property
    def size(self):
        return self.width, self.height

    def read(self):
        return self.cap.read()

    def release(self):
        self.cap.release()


def _open_writer(path: str, fps: float, size: tuple):
    """Try avc1 (H.264) first — browser-compatible. Fall back to mp4v."""
    for fourcc_str in ('avc1', 'H264', 'mp4v'):
        fourcc = cv2.VideoWriter_fourcc(*fourcc_str)
        writer = cv2.VideoWriter(path, fourcc, fps, size)
        if writer.isOpened():
            return writer
        writer.release()
    raise RuntimeError('No suitable VideoWriter codec found (tried avc1, H264, mp4v)')


class VideoWriter:
    def __init__(self, path: str, fps: float, size: tuple):
        self.writer = _open_writer(path, fps, size)

    def write(self, frame):
        self.writer.write(frame)

    def release(self):
        self.writer.release()
