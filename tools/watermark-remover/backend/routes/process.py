import uuid
import threading
import json
import os
import traceback
import logging
from flask import Blueprint, request, jsonify, send_file, Response
from werkzeug.utils import secure_filename
from ..services.processing import process_video
from ..utils.file_utils import allowed_file, get_output_path
from ..utils.temp_utils import cleanup_temp

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

process_bp = Blueprint('process', __name__)

tasks = {}
_lock = threading.Lock()


def _update_task(task_id, **kw):
    with _lock:
        if task_id in tasks:
            tasks[task_id].update(kw)


def _run_task(task_id, video_path, output_path, masks, method, radius):
    try:
        def cb(pct, msg):
            _update_task(task_id, progress=pct, message=msg)

        logger.info('Task %s: processing %s -> %s (method=%s radius=%d)',
                     task_id, video_path, output_path, method, radius)

        process_video(
            input_path=video_path,
            output_path=output_path,
            masks=masks,
            method=method,
            radius=radius,
            progress_callback=cb
        )
        _update_task(task_id, progress=100, message='Selesai', done=True)
        logger.info('Task %s: completed', task_id)

    except Exception as e:
        tb = traceback.format_exc()
        logger.error('Task %s failed:\n%s', task_id, tb)
        _update_task(task_id, error=str(e), done=True)
    finally:
        if video_path and os.path.exists(video_path):
            cleanup_temp(video_path)


def _save_temp(video_file):
    filename = secure_filename(video_file.filename)
    import tempfile
    temp_dir = tempfile.mkdtemp(prefix='wm_')
    save_path = os.path.join(temp_dir, filename)
    video_file.save(save_path)
    return save_path


@process_bp.route('/api/process', methods=['POST'])
def process_start():
    if 'video' not in request.files:
        return jsonify({'error': 'No video file provided'}), 400

    video = request.files['video']
    if not allowed_file(video.filename):
        return jsonify({'error': 'Unsupported video format'}), 400

    masks_raw = request.form.get('masks', '[]')
    try:
        masks = json.loads(masks_raw)
    except json.JSONDecodeError:
        return jsonify({'error': 'Invalid masks JSON'}), 400

    method = request.form.get('method', 'advanced')
    radius_raw = request.form.get('radius', '5')
    try:
        radius = int(radius_raw)
        radius = max(1, min(20, radius))
    except (ValueError, TypeError):
        radius = 5

    task_id = uuid.uuid4().hex[:12]
    video_path = _save_temp(video)
    output_path = get_output_path(video.filename)

    tasks[task_id] = {
        'progress': 0,
        'message': 'Mulai',
        'done': False,
        'error': None,
        'output_path': output_path,
        'video_path': video_path,
    }

    t = threading.Thread(
        target=_run_task,
        args=(task_id, video_path, output_path, masks, method, radius),
        daemon=True
    )
    t.start()

    return jsonify({'task_id': task_id})


@process_bp.route('/api/status/<task_id>')
def process_status(task_id):
    def generate():
        while True:
            with _lock:
                info = tasks.get(task_id)

            if info is None:
                yield f"data: {json.dumps({'error': 'Task not found'})}\n\n"
                break

            data = {
                'progress': info.get('progress', 0),
                'message': info.get('message', ''),
            }
            if info.get('error'):
                data['error'] = info['error']
                data['done'] = True
            elif info.get('done'):
                data['done'] = True

            yield f"data: {json.dumps(data)}\n\n"

            if info.get('done', False):
                break

            import time
            time.sleep(0.5)

    return Response(generate(), mimetype='text/event-stream')


@process_bp.route('/api/download/<task_id>')
def process_download(task_id):
    with _lock:
        info = tasks.get(task_id)

    if info is None:
        return jsonify({'error': 'Task not found'}), 404

    if not info.get('done'):
        return jsonify({'error': 'Task not completed'}), 400

    if info.get('error'):
        return jsonify({'error': info['error']}), 500

    output_path = info.get('output_path')
    if not output_path or not os.path.exists(output_path):
        return jsonify({'error': 'Output file not found'}), 500

    download_name = os.path.basename(output_path)
    return send_file(
        output_path,
        as_attachment=True,
        download_name=download_name,
        mimetype='video/mp4'
    )
