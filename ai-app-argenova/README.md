# AI App Argenova

Bu proje, haftalık çalışma verilerini analiz eden bir AI asistan uygulamasıdır.

## Proje Mimarisi

Proje MVC (Model-View-Controller) mimarisine uygun olarak düzenlenmiştir:

```
ai-app-argenova/
├── config/           # Yapılandırma dosyaları
│   ├── database.js   # MongoDB bağlantısı
│   └── ai.js         # AI servis yapılandırması
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
└── package.json
```

## Kurulum ve Çalıştırma

1. Bağımlılıkları yükleyin:

```bash
npm install
```

2. MongoDB'nin çalıştığından emin olun

3. Uygulamayı başlatın:

```bash
npm start
```

## API Endpoint'leri

### POST /api/query

AI sorgusu gönderme

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

## Özellikler

-   MVC mimarisi
-   Hata yönetimi
-   İstek loglama
-   Pagination desteği
-   Graceful shutdown
-   Environment variable desteği
-   Input validation
-   Error handling middleware

## Teknolojiler

-   **Backend**: Node.js, Express.js
-   **Veritabanı**: MongoDB, Mongoose
-   **AI Servisi**: External AI API
-   **Frontend**: HTML, CSS, JavaScript

## Geliştirme

Proje modüler yapıda tasarlanmıştır. Yeni özellikler eklemek için:

1. Model oluşturun (`models/`)
2. Controller ekleyin (`controllers/`)
3. Route tanımlayın (`routes/`)
4. Gerekirse middleware ekleyin (`middleware/`)
