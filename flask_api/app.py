from flask import Flask, jsonify
from flask_cors import CORS
from controllers.chat_controller import chat_bp
from controllers.employee_controller import employee_bp
from services.qdrant_service import qdrant_service
from config.settings import Config
import logging

# Logging konfigürasyonu
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

def create_app():
    """Flask uygulamasını oluştur"""
    app = Flask(__name__)
    app.config.from_object(Config)
    
    # CORS ayarları
    CORS(app, origins=Config.CORS_ORIGINS, supports_credentials=True)
    
    # Blueprint'leri kaydet
    app.register_blueprint(chat_bp, url_prefix='/api')
    app.register_blueprint(employee_bp, url_prefix='/api')
    
    # Health check endpoint
    @app.route('/health')
    def health_check():
        return jsonify({
            "status": "OK",
            "timestamp": "2024-01-01T00:00:00Z",
            "version": "1.0.0",
            "service": "Flask API"
        })
    
    # Error handlers
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({
            "error": "Endpoint Not Found",
            "message": "İstenen endpoint bulunamadı",
            "success": False
        }), 404
    
    @app.errorhandler(500)
    def internal_error(error):
        return jsonify({
            "error": "Internal Server Error",
            "message": "Sunucu hatası oluştu",
            "success": False
        }), 500
    
    return app

def init_database():
    """Veritabanını başlat"""
    try:
        qdrant_service.create_collection()
        logging.info("✅ Veritabanı başlatıldı")
    except Exception as e:
        logging.error(f"❌ Veritabanı başlatılamadı: {e}")

if __name__ == '__main__':
    app = create_app()
    
    # Veritabanını başlat
    init_database()
    
    # Uygulamayı çalıştır
    app.run(
        host=Config.HOST,
        port=Config.PORT,
        debug=Config.DEBUG
    ) 