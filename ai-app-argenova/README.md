# AI App Argenova

Bu proje, haftalık çalışma verilerini analiz eden bir AI asistan uygulamasıdır. Qdrant vektör veritabanı kullanarak geçmiş sorguları analiz eder ve daha eğitilmiş yanıtlar üretir.

## 🚀 **Yeni Özellik: Llama Model Desteği**

Proje artık **Llama 3.2** modellerini desteklemektedir. Kullanıcılar farklı Llama modelleri arasında geçiş yapabilir:

### 🤖 **Desteklenen Modeller**

| Model             | Boyut | RAM   | Hız    | Kalite | Önerilen Kullanım        |
| ----------------- | ----- | ----- | ------ | ------ | ------------------------ |
| **Llama 3.2 3B**  | 3B    | 2GB   | ⚡⚡⚡ | 🟡     | Hızlı testler, düşük RAM |
| **Llama 3.2 7B**  | 7B    | 4GB   | ⚡⚡   | 🟢     | **Varsayılan - Dengeli** |
| **Llama 3.2 70B** | 70B   | 40GB  | ⚡     | 🔴     | En yüksek kalite         |
| **Phi-3 Mini**    | 3.8B  | 1.5GB | ⚡⚡⚡ | 🟡     | Çok hızlı                |
| **Phi-3 Small**   | 7B    | 3GB   | ⚡⚡   | 🟢     | Hızlı ve kaliteli        |

### 📥 **Model Kurulumu**

```bash
# Ollama'ya model indirme
ollama pull llama3.2:3b    # Hızlı model
ollama pull llama3.2:7b    # Varsayılan model
ollama pull llama3.2:70b   # Yüksek kalite (40GB RAM gerekli)
ollama pull phi3:mini      # Çok hızlı
ollama pull phi3:small     # Hızlı ve kaliteli

# Mevcut modelleri listele
ollama list

# Model bilgilerini görüntüle
ollama show llama3.2:7b
```

### 🎛️ **Model Seçimi**

1. **Web Arayüzü**: Header'daki dropdown'dan model seçin
2. **Environment Variable**: `.env` dosyasında `OLLAMA_MODEL=llama3.2:7b`
3. **Otomatik Kaydetme**: Seçilen model localStorage'da saklanır

## 🏗️ Proje Mimarisi

Proje MVC (Model-View-Controller) mimarisine uygun olarak düzenlenmiştir:

```
ai-app-argenova/
├── config/           # Yapılandırma dosyaları
│   ├── database.js   # MongoDB bağlantısı
│   ├── ai.js         # AI servis yapılandırması (Llama destekli)
│   ├── qdrant.js     # Qdrant vektör veritabanı
│   └── embedding.js  # OpenAI embedding servisi
├── models/           # Veritabanı modelleri
│   └── Log.js        # Log şeması
├── controllers/      # İş mantığı
│   └── aiController.js # AI işlemleri
├── routes/           # API route'ları
│   └── aiRoutes.js   # AI endpoint'leri (Model yönetimi dahil)
├── middleware/       # Ara yazılımlar
│   ├── errorHandler.js    # Hata yönetimi
│   └── requestLogger.js   # İstek loglama
├── public/           # Statik dosyalar
│   ├── index.html    # Model seçici UI
│   ├── style.css     # Responsive tasarım
│   └── script.js     # Model yönetimi JS
├── server.js         # Ana sunucu dosyası
├── package.json
├── docker-compose.yml # Docker servisleri
└── .env.example      # Environment variables örneği
```

## 🚀 Kurulum ve Çalıştırma

### 1. **Ollama Kurulumu**

```bash
# Ubuntu/Debian
curl -fsSL https://ollama.ai/install.sh | sh

# Ollama servisini başlat
ollama serve

# İlk modeli indir
ollama pull llama3.2:7b
```

### 2. **Docker Servislerini Başlatın**

```bash
docker-compose up -d
```

### 3. **Bağımlılıkları Yükleyin**

```bash
npm install
```

### 4. **Environment Variables Dosyasını Oluşturun**

```bash
cp .env.example .env
```

### 5. **.env Dosyasını Düzenleyin**

```env
# AI Service Configuration
AI_SERVICE_URL=http://localhost:11434/api
AI_TEMPERATURE=0.7
AI_MAX_TOKENS=512

# Ollama Model Configuration
OLLAMA_MODEL=llama3.2:7b
# Model seçenekleri:
# - llama3.2:3b (Hızlı, hafif - 2GB RAM)
# - llama3.2:7b (Dengeli - 4GB RAM)
# - llama3.2:70b (En yüksek kalite - 40GB RAM)
# - phi3:mini (Çok hızlı - 1.5GB RAM)
# - phi3:small (Hızlı - 3GB RAM)

# OpenAI Configuration (Embedding için)
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

### 6. **Uygulamayı Başlatın**

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

### GET /api/models

Mevcut modelleri listeleme

```
GET /api/models
```

### GET /api/models/info/:modelName

Model bilgilerini getirme

```
GET /api/models/info/llama3.2:7b
```

### POST /api/populate-vectors

Geçmiş verileri vektör veritabanına aktarma

```
POST /api/populate-vectors
```

## 🔧 Environment Variables

| Variable            | Açıklama                        | Varsayılan                          |
| ------------------- | ------------------------------- | ----------------------------------- |
| `AI_SERVICE_URL`    | AI servis URL'si                | `http://localhost:11434/api`        |
| `AI_TEMPERATURE`    | AI yanıt sıcaklığı              | `0.7`                               |
| `AI_MAX_TOKENS`     | Maksimum token sayısı           | `512`                               |
| `OLLAMA_MODEL`      | Ollama model adı                | `llama3.2:7b`                       |
| `OPENAI_API_KEY`    | OpenAI API anahtarı             | -                                   |
| `QDRANT_URL`        | Qdrant vektör veritabanı URL'si | `http://localhost:6333`             |
| `QDRANT_COLLECTION` | Qdrant koleksiyon adı           | `ai_logs`                           |
| `PORT`              | Sunucu portu                    | `3000`                              |
| `NODE_ENV`          | Çalışma ortamı                  | `development`                       |
| `MONGODB_URI`       | MongoDB bağlantı URL'si         | `mongodb://localhost:27017/ai_logs` |

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
-   ✅ **Llama 3.2 model desteği**
-   ✅ **Model seçici UI**
-   ✅ **Otomatik model kaydetme**

## 🛠️ Teknolojiler

-   **Backend**: Node.js, Express.js
-   **Veritabanı**: MongoDB, Mongoose
-   **Vektör Veritabanı**: Qdrant
-   **AI Servisi**: Ollama (Llama 3.2, Phi-3)
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
docker-compose logs -f
```

## 🚀 Performans Optimizasyonu

### Model Seçimi Rehberi

1. **Geliştirme/Test**: `llama3.2:3b` veya `phi3:mini`
2. **Production (4GB RAM)**: `llama3.2:7b`
3. **Yüksek Kalite (40GB RAM)**: `llama3.2:70b`
4. **Hızlı İşlem**: `phi3:small`

### RAM Gereksinimleri

-   **Minimum**: 2GB (3B model için)
-   **Önerilen**: 8GB (7B model + sistem)
-   **Yüksek Kalite**: 40GB+ (70B model için)

## 🎯 Sonuç

**Llama 3.2** modelleri projeniz için en uygun seçenektir çünkü:

✅ **Mevcut altyapınızla uyumlu** (Ollama)  
✅ **Yerel çalışma** (API anahtarı gerektirmez)  
✅ **Maliyet etkin** (ücretsiz)  
✅ **Ölçeklenebilir** (farklı model boyutları)  
✅ **Güvenli** (veri gizliliği)  
✅ **Hızlı** (yerel işlem)

Projeniz artık tam işlevsel, modern ve Llama destekli bir AI asistan uygulamasıdır! 🎉

# LLM Model Seçimi ve Karşılaştırması

## 1. Proje Özeti

-   Node.js ve Express tabanlı, haftalık çalışma verilerini analiz eden bir AI asistanı.
-   Qdrant vektör veritabanı ve MongoDB kullanıyor.
-   Embedding işlemleri için OpenAI API ve fallback olarak hash tabanlı sistem mevcut.
-   AI servisinde model olarak Ollama ile Llama/phi3 kullanımı entegre edildi.

## 2. Kullanılabilecek LLM Modelleri

### Llama (Meta)

-   Açık kaynak, Ollama ile kolayca çalışır.
-   Yerel olarak çalıştırılabilir, API anahtarı gerekmez.
-   Farklı boyutlarda modeller (3B, 7B, 70B) ile RAM ve hız ihtiyacına göre seçim yapılabilir.
-   Türkçe desteği iyidir.
-   Maliyet yoktur, kota yoktur.
-   Veri gizliliği yüksektir (veri dışarı çıkmaz).

### Deepseek

-   Açık kaynak, bazı modeller Ollama ile çalışabilir.
-   Kurulumu ve entegrasyonu Llama kadar kolay değildir.
-   Türkçe desteği Llama kadar güçlü değildir.
-   Topluluk ve dökümantasyon desteği daha zayıf.

### Claude (Anthropic)

-   Sadece bulut tabanlı API ile kullanılabilir.
-   API anahtarı ve ücret gerektirir, kota sınırı vardır.
-   Türkçe desteği iyidir, ancak ücretsiz ve yerel çalışmaz.
-   Veri dışarıya çıkar, gizlilik daha düşüktür.

## 3. Projeniz İçin En Uygun Model: Llama

-   Mevcut altyapınız Ollama ve Llama ile uyumlu.
-   API anahtarı veya ek ücret gerektirmez.
-   RAM ve hız ihtiyacınıza göre model seçebilirsiniz.
-   Yerel çalıştığı için veri gizliliği sağlar.
-   Açık kaynak ve topluluk desteği güçlüdür.
-   Türkçe performansı yüksektir.

## 4. Llama Model Kurulumu ve Kullanımı

-   Ollama kurulu olmalı.
-   Terminalden model indirmek için:
    -   `ollama pull llama3.2:3b` (Hızlı, düşük RAM)
    -   `ollama pull llama3.2:7b` (Dengeli, önerilen)
    -   `ollama pull llama3.2:70b` (Yüksek kalite, çok RAM)
-   .env dosyasına model adını yazın:
    -   `OLLAMA_MODEL=llama3.2:7b`
-   Web arayüzünden de model seçimi yapılabilir.

## 5. RAM Gereksinimleri

-   3B model için minimum 2GB RAM
-   7B model için önerilen 8GB RAM
-   70B model için 40GB+ RAM

## 6. Sonuç ve Öneri

-   Llama modelleri, projeniz için en uygun, hızlı, güvenli ve maliyetsiz çözümdür.
-   Deepseek ve Claude gibi alternatifler, ya daha karmaşık ya da ücretli ve dışa bağımlıdır.
-   Llama ile hem yerel hem de esnek bir AI asistanı altyapısı kurabilirsiniz.
