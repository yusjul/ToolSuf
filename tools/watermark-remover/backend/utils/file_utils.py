ALLOWED_EXTENSIONS = {'.mp4', '.mov', '.avi', '.mkv', '.webm', '.flv', '.wmv'}


def allowed_file(filename: str) -> bool:
    import os
    ext = os.path.splitext(filename)[1].lower()
    return ext in ALLOWED_EXTENSIONS


def get_output_path(original_filename: str) -> str:
    import os
    import tempfile
    base = os.path.splitext(original_filename)[0]
    out_dir = tempfile.mkdtemp(prefix='wm_out_')
    return os.path.join(out_dir, f'{base}_clean.mp4')
