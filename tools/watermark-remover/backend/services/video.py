import cv2


class VideoReader:
    def __init__(self, path: str):
        self.cap = cv2.VideoCapture(path)
        if not self.cap.isOpened():
            raise RuntimeError(f'Cannot open video: {path}')

        self.fps = self.cap.get(cv2.CAP_PROP_FPS)
        self.width = int(self.cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        self.height = int(self.cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        self.frame_count = int(self.cap.get(cv2.CAP_PROP_FRAME_COUNT))

    @property
    def size(self):
        return self.width, self.height

    def read(self):
        return self.cap.read()

    def release(self):
        self.cap.release()


class VideoWriter:
    def __init__(self, path: str, fps: float, size: tuple, fourcc: str = 'mp4v'):
        self.writer = cv2.VideoWriter(
            path,
            cv2.VideoWriter_fourcc(*fourcc),
            fps,
            size
        )
        if not self.writer.isOpened():
            raise RuntimeError(f'Cannot create video writer: {path}')

    def write(self, frame):
        self.writer.write(frame)

    def release(self):
        self.writer.release()
