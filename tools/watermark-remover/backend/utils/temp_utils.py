import os
import shutil
import tempfile


def create_temp_dir(prefix: str = 'wm_') -> str:
    return tempfile.mkdtemp(prefix=prefix)


def cleanup_temp(path: str):
    if os.path.isfile(path):
        os.remove(path)
        parent = os.path.dirname(path)
        try:
            if os.path.isdir(parent) and not os.listdir(parent):
                os.rmdir(parent)
        except OSError:
            pass
    elif os.path.isdir(path):
        shutil.rmtree(path, ignore_errors=True)
