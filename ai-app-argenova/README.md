# AI App Argenova

Bu proje, haftalık çalışma verilerini analiz eden bir AI asistan uygulamasıdır. Qdrant vektör veritabanı kullanarak geçmiş sorguları analiz eder ve daha eğitilmiş yanıtlar üretir.

## 🏗️ Proje Mimarisi

Proje MVC (Model-View-Controller) mimarisine uygun olarak düzenlenmiştir:

```
ai-app-argenova/
├── config/           # Yapılandırma dosyaları
│   ├── database.js   # MongoDB bağlantısı
│   ├── ai.js         # AI servis yapılandırması
│   ├── qdrant.js     # Qdrant vektör veritabanı
│   └── embedding.js  # OpenAI embedding servisi
├── models/           # Veritabanı modelleri
│   └── Log.js        # Log şeması
├── controllers/      # İş mantığı
│   └── aiController.js # AI işlemleri
├── routes/           # API route'ları
│   └── aiRoutes.js   # AI endpoint'leri
├── middleware/       # Ara yazılımlar
│   ├── errorHandler.js    # Hata yönetimi
│   └── requestLogger.js   # İstek loglama
├── public/           # Statik dosyalar
│   ├── index.html
│   ├── style.css
│   └── script.js
├── server.js         # Ana sunucu dosyası
├── package.json
├── docker-compose.yml # Docker servisleri
└── .env.example      # Environment variables örneği
```

## 🚀 Kurulum ve Çalıştırma

### 1. Docker Servislerini Başlatın

```bash
docker-compose up -d
```

### 2. Bağımlılıkları Yükleyin

```bash
npm install
```

### 3. Environment Variables Dosyasını Oluşturun

```bash
cp .env.example .env
```

### 4. .env Dosyasını Düzenleyin

```env
# AI Service Configuration
AI_SERVICE_URL=http://165.232.134.134:8000/v1/completions
AI_TEMPERATURE=0.7
AI_MAX_TOKENS=512

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here

# Qdrant Vector Database Configuration
QDRANT_URL=http://localhost:6333
QDRANT_COLLECTION=ai_logs

# Server Configuration
PORT=3000
NODE_ENV=development

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/ai_logs
```

### 5. Uygulamayı Başlatın

```bash
# Production
npm start

# Development (nodemon ile)
npm run dev
```

## 📊 API Endpoint'leri

### POST /api/query

AI sorgusu gönderme (vektör veritabanı ile geliştirilmiş)

```json
{
    "prompt": "Haftalık çalışma verileriniz..."
}
```

### GET /api/history

Geçmiş sorguları getirme

```
GET /api/history?limit=10&page=1
```

### POST /api/populate-vectors

Geçmiş verileri vektör veritabanına aktarma

```
POST /api/populate-vectors
```

## 🔧 Environment Variables

| Variable            | Açıklama                        | Varsayılan                                   |
| ------------------- | ------------------------------- | -------------------------------------------- |
| `AI_SERVICE_URL`    | AI servis URL'si                | `http://165.232.134.134:8000/v1/completions` |
| `AI_TEMPERATURE`    | AI yanıt sıcaklığı              | `0.7`                                        |
| `AI_MAX_TOKENS`     | Maksimum token sayısı           | `512`                                        |
| `OPENAI_API_KEY`    | OpenAI API anahtarı             | -                                            |
| `QDRANT_URL`        | Qdrant vektör veritabanı URL'si | `http://localhost:6333`                      |
| `QDRANT_COLLECTION` | Qdrant koleksiyon adı           | `ai_logs`                                    |
| `PORT`              | Sunucu portu                    | `3000`                                       |
| `NODE_ENV`          | Çalışma ortamı                  | `development`                                |
| `MONGODB_URI`       | MongoDB bağlantı URL'si         | `mongodb://localhost:27017/ai_logs`          |

## 🔧 Özellikler

-   ✅ MVC mimarisi
-   ✅ Hata yönetimi
-   ✅ İstek loglama
-   ✅ Pagination desteği
-   ✅ Graceful shutdown
-   ✅ Environment variable desteği
-   ✅ Input validation
-   ✅ Error handling middleware
-   ✅ Modern responsive UI
-   ✅ AI service configuration
-   ✅ **Qdrant vektör veritabanı entegrasyonu**
-   ✅ **OpenAI embedding servisi**
-   ✅ **Benzer sorgu analizi**
-   ✅ **Geliştirilmiş prompt oluşturma**
-   ✅ **Docker Compose desteği**

## 🛠️ Teknolojiler

-   **Backend**: Node.js, Express.js
-   **Veritabanı**: MongoDB, Mongoose
-   **Vektör Veritabanı**: Qdrant
-   **AI Servisi**: External AI API
-   **Embedding**: OpenAI Embeddings
-   **Frontend**: HTML, CSS, JavaScript
-   **Environment**: dotenv
-   **Containerization**: Docker, Docker Compose

## 🔍 Vektör Veritabanı Özellikleri

### Nasıl Çalışır?

1. **Embedding Oluşturma**: Her sorgu ve yanıt OpenAI embedding API'si ile vektöre çevrilir
2. **Benzerlik Arama**: Yeni sorgu geldiğinde, geçmiş benzer sorgular bulunur
3. **Context Oluşturma**: Benzer örnekler kullanılarak geliştirilmiş prompt oluşturulur
4. **Eğitilmiş Yanıt**: AI servisi daha zengin context ile yanıt üretir

### Avantajlar

-   **Daha Kaliteli Yanıtlar**: Geçmiş örneklerden öğrenme
-   **Tutarlılık**: Benzer sorgulara benzer yanıtlar
-   **Sürekli İyileşme**: Her yeni sorgu sistemi geliştirir
-   **Hızlı Arama**: Vektör benzerlik araması

## 📝 Geliştirme

Proje modüler yapıda tasarlanmıştır. Yeni özellikler eklemek için:

1. Model oluşturun (`models/`)
2. Controller ekleyin (`controllers/`)
3. Route tanımlayın (`routes/`)
4. Gerekirse middleware ekleyin (`middleware/`)

## 🔒 Güvenlik

-   Environment variables kullanarak hassas bilgileri koruyun
-   Production ortamında güvenli MongoDB URI kullanın
-   AI servis URL'sini environment variable'da saklayın
-   OpenAI API anahtarını güvenli şekilde saklayın

## 🐳 Docker Kullanımı

### Servisleri Başlatma

```bash
docker-compose up -d
```

### Servisleri Durdurma

```bash
docker-compose down
```

### Logları Görüntüleme

```bash
docker-compose logs -f qdrant
docker-compose logs -f mongodb
```

### Verileri Temizleme

```bash
docker-compose down -v
```
