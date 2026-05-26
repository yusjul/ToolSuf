from flask import Flask
from flask_cors import CORS
import os

def create_app():
    app = Flask(__name__)
    CORS(app)

    app.config['MAX_CONTENT_LENGTH'] = 500 * 1024 * 1024  # 500MB
    app.config['TEMP_DIR'] = os.path.join(app.root_path, 'temp')
    app.config['OUTPUT_DIR'] = os.path.join(app.root_path, 'output')

    from .routes.process import process_bp
    app.register_blueprint(process_bp)

    @app.route('/')
    def index():
        return {'status': 'ok'}

    @app.route('/api/ping')
    def ping():
        return {'status': 'ok'}

    return app

if __name__ == '__main__':
    app = create_app()
    app.run(host='0.0.0.0', port=5000, debug=True)
