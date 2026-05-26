from flask import Flask, jsonify
from flask_cors import CORS
import os

def create_app():
    app = Flask(__name__)
    CORS(app)

    @app.errorhandler(405)
    def method_not_allowed(e):
        return jsonify({'error': 'Method not allowed. Use POST for /api/process'}), 405

    @app.errorhandler(404)
    def not_found(e):
        return jsonify({'error': 'Route not found'}), 404

    @app.errorhandler(500)
    def server_error(e):
        return jsonify({'error': 'Internal server error'}), 500

    app.config['MAX_CONTENT_LENGTH'] = 500 * 1024 * 1024  # 500MB
    app.config['TEMP_DIR'] = os.path.join(app.root_path, 'temp')
    app.config['OUTPUT_DIR'] = os.path.join(app.root_path, 'output')

    from .routes.process import process_bp
    app.register_blueprint(process_bp)

    @app.route('/')
    def index():
        return {
            'status': 'ok',
            'name': 'ToolSuf Watermark Remover API',
            'endpoints': {
                'GET /': 'this page',
                'GET /api/ping': 'health check',
                'POST /api/process': 'upload video + masks (multipart/form-data)',
                'GET /api/status/<task_id>': 'SSE progress stream',
                'GET /api/download/<task_id>': 'download result video',
            }
        }

    @app.route('/api/ping')
    def ping():
        return {'status': 'ok'}

    return app

if __name__ == '__main__':
    app = create_app()
    app.run(host='0.0.0.0', port=5000, debug=True)
