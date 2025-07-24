import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    # Flask Configuration
    SECRET_KEY = os.getenv('SECRET_KEY', 'your-secret-key-here')
    DEBUG = os.getenv('FLASK_DEBUG', 'False').lower() == 'true'
    
    # Qdrant Configuration
    QDRANT_URL = os.getenv('QDRANT_URL', 'http://192.168.2.191:6333')
    QDRANT_COLLECTION = os.getenv('QDRANT_COLLECTION', 'mesai')
    QDRANT_VECTOR_SIZE = 384
    QDRANT_DISTANCE = "Cosine"
    
    # AI Service Configuration
    # Production'da Ollama localhost'ta çalışacak
    AI_SERVICE_URL = os.getenv('AI_SERVICE_URL', 'http://192.168.2.191:11434')
    AI_SERVICE_MODEL = os.getenv('AI_SERVICE_MODEL', 'llama3')
    AI_TIMEOUT = 300  # 5 dakika gibi bir değer ver
    
    # CORS Configuration
    CORS_ORIGINS = os.getenv('CORS_ORIGINS', 'http://localhost:3000,http://192.168.2.191:3000').split(',')
    
    # Server Configuration
    PORT = int(os.getenv('PORT', 5000))
    HOST = os.getenv('HOST', '0.0.0.0') 

    # Embedding (vektör) modeli için varsayılan: all-minilm (Ollama'da yüklü olmalı)
    AI_EMBEDDING_MODEL = os.getenv('AI_EMBEDDING_MODEL', 'all-minilm')
    # Chat (sohbet/generate) modeli için varsayılan: mistral:7b (Ollama'da yüklü olmalı)
    AI_CHAT_MODEL = os.getenv('AI_CHAT_MODEL', 'llama3') 