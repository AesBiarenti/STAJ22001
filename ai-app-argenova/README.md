# AI App Argenova

Bu proje, modern ve kullanıcı dostu bir AI chat uygulamasıdır. Haftalık çalışma verilerini analiz eden bu asistan, Qdrant vektör veritabanı ve gelişmiş RAG (retrieval-augmented generation) mimarisi ile geçmiş sorguları analiz eder ve daha eğitilmiş, şeffaf yanıtlar üretir.

## 🚀 **Yeni Özellikler ve Modern Chat Arayüzü**

-   ChatGPT tarzı baloncuklar, otomatik kaydırma, loading animasyonu
-   Sidebar'da geçmiş sorgular ve vektör veritabanı sekmeleri
-   Responsive ve mobil uyumlu, modern bir tasarım
-   Yanıt stili (detaylı, teknik, sade), formatı (zengin, madde, tablo, kod) ve uzunluğu (kısa, detaylı) seçilebilir
-   Her yanıtın altında, kullanılan benzer örnekler (kaynaklar) ve otomatik değerlendirme (selfCheck) gösterilir
-   Kullanıcı, yanıt için "beğendim/beğenmedim" feedback'i verebilir
-   Sohbet geçmişinden veya admin panelden, kaliteli log'lar eğitim örneği olarak işaretlenebilir ve dışa aktarılabilir
-   Kod blokları, tablolar ve madde işaretleri için özel CSS ile zengin format desteği

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

# QDRANT Vector Database Configuration
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

## 📊 API Endpoint'leri (Özet)

-   **POST /api/query**: AI sorgusu gönderme (vektör veritabanı ile geliştirilmiş, kullanıcı seçenekleriyle)
-   **GET /api/history**: Geçmiş sorguları getirme
-   **POST /api/feedback**: Yanıt için kullanıcı feedback'i kaydetme
-   **POST /api/mark-training**: Log'u eğitim örneği olarak işaretleme
-   **GET /api/training-examples**: Eğitim örneklerini listeleme
-   **GET /api/vectors/list**: Vektör veritabanı kayıtlarını listeleme

## 🔧 Özellikler

-   Modern, responsive ve şeffaf chat arayüzü
-   Gelişmiş RAG mimarisi (vektör + keyword arama, örnek özetleme, prompt mühendisliği)
-   Kullanıcıya yanıt stili, formatı ve uzunluğu seçme imkanı
-   Her yanıtın altında kaynak gösterimi ve otomatik değerlendirme
-   Feedback ve eğitim verisi yönetimi
-   Kod, tablo ve madde işaretleri için zengin format desteği
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
