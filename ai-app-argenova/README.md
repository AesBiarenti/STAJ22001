# AI App Argenova

Bu proje, modern ve kullanıcı dostu bir AI chat uygulamasıdır. Haftalık çalışma verilerini analiz eden bu asistan, Qdrant vektör veritabanı ve gelişmiş RAG (retrieval-augmented generation) mimarisi ile geçmiş sorguları analiz eder ve daha eğitilmiş, şeffaf yanıtlar üretir.

## 🚀 **Yeni Özellikler ve Modern Chat Arayüzü**

-   ChatGPT tarzı baloncuklar, otomatik kaydırma, loading animasyonu
-   Sidebar'da sadece geçmiş sorgular ve çalışan verileri sekmeleri
-   Responsive ve mobil uyumlu, modern bir tasarım
-   Yanıt stili (detaylı, teknik, sade) ve uzunluğu (kısa, detaylı) seçilebilir
-   Her yanıtın altında, kullanılan benzer örnekler (kaynaklar) ve otomatik değerlendirme (selfCheck) gösterilir
-   Kullanıcı, yanıt için "beğendim/beğenmedim" feedback'i verebilir

## 🚀 **Yeni Özellik: Llama Model Desteği**

Proje artık **Llama 3.2** modellerini desteklemektedir. Kullanıcılar farklı Llama modelleri arasında geçiş yapabilir:

### 🤖 **Desteklenen Modeller**

| Model             | Boyut | RAM   | Hız    | Kalite | Önerilen Kullanım              |
| ----------------- | ----- | ----- | ------ | ------ | ------------------------------ |
| **Llama 3**       | 8B    | 8GB   | ⚡⚡   | 🟢     | **Varsayılan - Yüksek kalite** |
| **Llama 3.2 3B**  | 3B    | 2GB   | ⚡⚡⚡ | 🟡     | Hızlı testler, düşük RAM       |
| **Llama 3.2 7B**  | 7B    | 4GB   | ⚡⚡   | 🟢     | Dengeli performans             |
| **Llama 3.2 70B** | 70B   | 40GB  | ⚡     | 🔴     | En yüksek kalite               |
| **Phi-3 Mini**    | 3.8B  | 1.5GB | ⚡⚡⚡ | 🟡     | Çok hızlı                      |
| **Phi-3 Small**   | 7B    | 3GB   | ⚡⚡   | 🟢     | Hızlı ve kaliteli              |

### 🔤 **Embedding Modelleri**

| Model                 | Boyut | Vektör Boyutu | Hız    | Kalite |
| --------------------- | ----- | ------------- | ------ | ------ | ------------------------ |
| **all-minilm**        | 91MB  | 384           | ⚡⚡⚡ | 🟢     | **Varsayılan - Dengeli** |
| **mxbai-embed-large** | 1.3GB | 1024          | ⚡⚡   | 🔴     | Yüksek kalite            |

### 📥 **Model Kurulumu**

```bash
# Otomatik model kurulumu (önerilen)
npm run setup:models

# Manuel model indirme
ollama pull llama3         # Varsayılan chat modeli
ollama pull all-minilm     # Varsayılan embedding modeli

# Diğer modeller
ollama pull llama3.2:3b    # Hızlı model
ollama pull llama3.2:7b    # Dengeli performans
ollama pull llama3.2:70b   # Yüksek kalite (40GB RAM gerekli)
ollama pull phi3:mini      # Çok hızlı
ollama pull phi3:small     # Hızlı ve kaliteli

# Mevcut modelleri listele
ollama list

# Model bilgilerini görüntüle
ollama show llama3
```

### 🎛️ **Model Seçimi**

1. **Web Arayüzü**: Header'daki dropdown'dan model seçin
2. **Environment Variable**: `.env` dosyasında `OLLAMA_CHAT_MODEL=llama3` ve `OLLAMA_EMBEDDING_MODEL=all-minilm`
3. **Otomatik Kaydetme**: Seçilen model localStorage'da saklanır

## 🏗️ Proje Mimarisi

Proje MVC (Model-View-Controller) mimarisine uygun olarak düzenlenmiştir ve modern frontend ile tam entegredir:

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
│   ├── index.html    # Modern chat arayüzü
│   ├── style.css     # Responsive ve zengin tasarım
│   └── script.js     # Vue.js tabanlı chat mantığı
├── server.js         # Ana sunucu dosyası
├── package.json
├── docker-compose.yml # Docker servisleri
└── .env.example      # Environment variables örneği
```

## 🚀 Kurulum ve Çalıştırma

### 1. **Docker ile Kurulum (Önerilen)**

```bash
# Development ortamı
npm run docker:dev

# Production ortamı
npm run docker:prod

# Servisleri durdur
npm run docker:down
```

### 2. **Manuel Ollama Kurulumu**

```bash
# Ubuntu/Debian
curl -fsSL https://ollama.ai/install.sh | sh

# Ollama servisini başlat
ollama serve

# Modelleri otomatik indir
npm run setup:models
```

### 3. **Manuel Kurulum**

```bash
# Bağımlılıkları yükle
npm install

# Environment dosyasını oluştur
cp env.example .env

# .env dosyasını düzenle
nano .env
```

### 4. **Environment Variables**

```env
# Node.js Environment
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/ai_logs

# Qdrant Configuration
QDRANT_URL=http://localhost:6333
QDRANT_COLLECTION=ai_logs

# Ollama Configuration
OLLAMA_URL=http://localhost:11434/api
OLLAMA_CHAT_MODEL=llama3
OLLAMA_EMBEDDING_MODEL=all-minilm

# AI Configuration
AI_TEMPERATURE=0.7
AI_MAX_TOKENS=512

# Server Configuration
PORT=3000
```

### 5. **Uygulamayı Başlatın**

```bash
# Production
npm start

# Development (nodemon ile)
npm run dev

# Docker ile (önerilen)
npm run docker:dev
```

## 📊 API Endpoint'leri (Özet)

-   **POST /api/query**: AI sorgusu gönderme (vektör veritabanı ile geliştirilmiş, kullanıcı seçenekleriyle)
-   **GET /api/history**: Geçmiş sorguları getirme
-   **POST /api/feedback**: Yanıt için kullanıcı feedback'i kaydetme
-   **GET /api/training-examples**: Eğitim örneklerini listeleme
-   **POST /api/upload-employees**: Excel çalışan verisi yükleme
-   **GET /api/employee-stats**: Çalışan istatistikleri
-   **POST /api/chat-employees**: Çalışan verisiyle chat

## 🔧 Özellikler

-   Modern, responsive ve şeffaf chat arayüzü
-   Gelişmiş RAG mimarisi (vektör + keyword arama, örnek özetleme, prompt mühendisliği)
-   Kullanıcıya yanıt stili ve uzunluğu seçme imkanı
-   Her yanıtın altında kaynak gösterimi ve otomatik değerlendirme
-   Feedback ve eğitim verisi yönetimi
-   Llama 3.2 ve Phi-3 model desteği
-   Docker ve environment variable desteği

## 🛠️ Teknolojiler

-   **Backend**: Node.js, Express.js
-   **Veritabanı**: MongoDB, Mongoose
-   **Vektör Veritabanı**: Qdrant
-   **AI Servisi**: Ollama (Llama 3.2, Phi-3)
-   **Embedding**: OpenAI Embeddings
-   **Frontend**: HTML, CSS, Vue.js
-   **Containerization**: Docker, Docker Compose

## 🎯 Sonuç

Bu uygulama, modern AI chat deneyimi, gelişmiş arama ve şeffaflık özellikleriyle öne çıkar. Hem teknik hem de kullanıcı deneyimi açısından güncel en iyi uygulamaları bir araya getirir.
