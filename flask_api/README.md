# Flask API - Argenova AI Backend

Bu proje, Flutter mobil uygulaması için AI destekli backend API'sidir.

## 🚀 Özellikler

-   **AI Chat**: Ollama/OpenAI ile sohbet
-   **Vector Search**: Qdrant ile semantic search
-   **Employee Management**: Çalışan CRUD işlemleri
-   **Embedding Generation**: Metin vektörizasyonu

## 📋 Gereksinimler

-   Python 3.11+
-   Qdrant Vector Database
-   AI Service (Ollama/OpenAI)

## 🛠️ Kurulum

1. **Bağımlılıkları yükle:**

```bash
pip install -r requirements.txt
```

2. **Environment dosyasını oluştur:**

```bash
cp env.example .env
# .env dosyasını düzenle
```

3. **Uygulamayı çalıştır:**

```bash
python app.py
```

## 🐳 Docker ile Çalıştırma

```bash
docker build -t flask-api .
docker run -p 5000:5000 flask-api
```

## 📡 API Endpoints

### Chat Endpoints

-   `POST /api/chat` - AI sohbet
-   `POST /api/embedding` - Embedding oluştur
-   `POST /api/chat/context` - Context-aware sohbet

### Employee Endpoints

-   `GET /api/employees` - Tüm çalışanları listele
-   `POST /api/employees` - Çalışan ekle
-   `PUT /api/employees/:id` - Çalışan güncelle
-   `DELETE /api/employees/:id` - Çalışan sil

### Health Check

-   `GET /health` - API durumu

## 🔧 Konfigürasyon

`.env` dosyasında şu değişkenleri ayarlayın:

```env
# Flask
SECRET_KEY=your-secret-key
FLASK_DEBUG=False
PORT=5000

# Qdrant
QDRANT_URL=http://192.168.2.191:6333
QDRANT_COLLECTION=mesai

# AI Service
AI_SERVICE_URL=http://165.232.134.134:8000
AI_SERVICE_MODEL=text-embedding-ada-002

# CORS
CORS_ORIGINS=http://localhost:3000,http://localhost:8080
```

## 📁 Proje Yapısı

```
flask_api/
├── app.py                 # Ana uygulama
├── config/
│   └── settings.py        # Konfigürasyon
├── controllers/
│   ├── chat_controller.py # Chat endpoints
│   └── employee_controller.py # Employee endpoints
├── models/
│   └── employee.py        # Pydantic modelleri
├── services/
│   ├── ai_service.py      # AI servisi
│   └── qdrant_service.py  # Qdrant servisi
├── requirements.txt       # Python bağımlılıkları
├── Dockerfile            # Docker yapılandırması
└── README.md             # Bu dosya
```

## 🔍 Avantajlar

### Node.js vs Flask Karşılaştırması

| Özellik                 | Node.js       | Flask            |
| ----------------------- | ------------- | ---------------- |
| **AI/ML Entegrasyonu**  | ⚠️ Orta       | ✅ Mükemmel      |
| **Qdrant Entegrasyonu** | ⚠️ HTTP API   | ✅ Native Client |
| **Type Safety**         | ⚠️ TypeScript | ✅ Pydantic      |
| **Performance**         | ✅ Hızlı      | ✅ Hızlı         |
| **Ecosystem**           | ✅ Geniş      | ✅ AI/ML Odaklı  |

## 🎯 Kullanım Senaryoları

1. **Basit Sohbet**: Kullanıcı soru sorar, AI yanıt verir
2. **Context-Aware Sohbet**: Çalışan verileri ile zenginleştirilmiş yanıt
3. **Employee Management**: Admin çalışan ekler/düzenler/siler

## 🚨 Hata Yönetimi

-   **AI Service Down**: Fallback mesajları
-   **Qdrant Down**: Text-based search
-   **Network Issues**: Timeout handling
-   **Validation Errors**: Pydantic validation

## 📈 Monitoring

-   Health check endpoint
-   Structured logging
-   Error tracking
-   Performance metrics
