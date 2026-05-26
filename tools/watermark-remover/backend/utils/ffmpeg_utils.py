import subprocess
import os


def extract_frames_ffmpeg(video_path: str, output_dir: str, fps: float = None):
    cmd = ['ffmpeg', '-i', video_path]
    if fps:
        cmd.extend(['-vf', f'fps={fps}'])
    cmd.extend([os.path.join(output_dir, 'frame_%05d.png')])

    subprocess.run(cmd, check=True, capture_output=True)


def assemble_frames_ffmpeg(frame_dir: str, output_path: str, fps: float, pattern: str = 'frame_%05d.png'):
    cmd = [
        'ffmpeg',
        '-framerate', str(fps),
        '-i', os.path.join(frame_dir, pattern),
        '-c:v', 'libx264',
        '-pix_fmt', 'yuv420p',
        '-y',
        output_path
    ]

    subprocess.run(cmd, check=True, capture_output=True)


def get_video_info_ffmpeg(video_path: str) -> dict:
    cmd = [
        'ffprobe',
        '-v', 'quiet',
        '-print_format', 'json',
        '-show_format',
        '-show_streams',
        video_path
    ]

    result = subprocess.run(cmd, check=True, capture_output=True, text=True)
    import json
    return json.loads(result.stdout)
