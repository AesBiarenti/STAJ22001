# STAJ22001 - Proje Özeti

Bu depo üç ayrı projeyi içerir:

1. ai-app-argenova (Node.js/Express - AI servis entegrasyonları ve web)
2. argenova_ai_app (Flutter - çok platformlu istemci)
3. flask_api (Python/Flask - API ve Qdrant entegrasyonu)

---

## 1) ai-app-argenova (Node.js/Express)

-   Amaç: AI servisleri (Ollama, Qdrant, vb.) ile etkileşim kuran bir Node.js sunucusu ve basit web arayüzü.
-   Teknolojiler: Vuejs, Node.js, Express, Nginx (opsiyonel), Docker-Compose
-   Önemli dosya/dizinler:
    -   `server.js`, `routes/`, `controllers/`, `config/`
    -   `public/` (istemci sayfaları)
    -   `docker-compose.yml`, `docker-compose.dev.yml`, `Dockerfile`

### Geliştirme

-   Bağımlılıklar: `cd ai-app-argenova && npm install`
-   Çalıştırma (geliştirme): `npm run dev` (varsa), aksi halde `node server.js`
-   Ortam değişkenleri: `.env` (ör. servis URL'leri, anahtarlar)

### Docker ile Çalıştırma

-   `cd ai-app-argenova`
-   `docker compose up -d` (veya `docker-compose up -d`)

---

## Ayrıntılı Bilgi ve Uç Noktalar

### ai-app-argenova (Node.js/Express)

-   Sunucu: `server.js` (PORT: `process.env.PORT || 3000`)
-   içerik: `public/`
-   Temel middleware: `cors`, `body-parser`, istek loglama, hata yakalama
-   Qdrant başlangıcı ve koleksiyon kurulumu otomatik yapılır.

#### Endpoint'ler (prefix: `/api`)

-   `GET /api/health`: Servis sağlık durumu (MongoDB, Qdrant, Ollama kontrolü)
-   `POST /api/query`: Sorgu işleme (genel)
-   `POST /api/chat`: Basit sohbet
-   `POST /api/chat/stream`: Akışlı sohbet (karakter karakter)
-   `POST /api/embedding`: Metin embedding oluşturma
-   `GET /api/history`: Geçmiş sorgular
-   `POST /api/populate-vectors`: Vektör veritabanını doldurma
-   `POST /api/populate-training-examples`: Eğitim örneklerini yükleme
-   `POST /api/feedback`: Geri bildirim bırakma
-   `POST /api/mark-training`: Kayıtları eğitim verisi olarak işaretleme
-   `GET /api/training-examples`: Eğitim örnekleri listesi
-   `GET /api/models`: Ollama üzerindeki mevcut modeller + desteklenenler
-   `GET /api/models/info/:modelName`: Model hakkında bilgi
-   `GET /api/vectors/status`: Qdrant koleksiyon durumu
-   `GET /api/vectors/list`: Vektörleri listele (limit: 100)
-   `DELETE /api/vectors/clear`: Koleksiyonu temizle
-   `POST /api/upload-employees` (multipart `file`): Excel'den çalışan yükleme
-   `GET /api/employee-stats`: Çalışan istatistikleri
-   `POST /api/chat-employees`: Çalışan verileri ile sohbet

#### Ortam Değişkenleri

-   `PORT`: Express portu (varsayılan 3000)
-   `TRUST_PROXY`: `true` ise `app.set('trust proxy', true)`
-   `MONGODB_URI`: MongoDB bağlantı URI
-   `QDRANT_URL`: Qdrant URL (ör. `http://localhost:6333`)
-   `QDRANT_COLLECTION`: Koleksiyon adı (ör. `ai_logs`)
-   `OLLAMA_URL`: Ollama API taban adresi (ör. `http://localhost:11434/api`)
-   `OLLAMA_CHAT_MODEL`: Varsayılan model (ör. `llama3.2:3b`)
-   `AI_TEMPERATURE`: Varsayılan sıcaklık (örn. 0.7)
-   `AI_MAX_TOKENS`: Maksimum token (örn. 512)

#### Çalıştırma Örnekleri

-   Geliştirme: `cd ai-app-argenova && npm install && node server.js`
-   Docker: `cd ai-app-argenova && docker compose up -d`

---

## 2) argenova_ai_app (Flutter)

-   Amaç: Mobil/masaüstü/web istemcisi; AI sohbeti, oturumlar ve Qdrant ile entegrasyon.
-   Teknolojiler: Flutter, Dart
-   Önemli dosya/dizinler:
    -   `lib/` (özellikle `core/api/`, `features/`)
    -   `pubspec.yaml`

### Geliştirme

-   Flutter sürümü kurulu olmalı (Flutter SDK)
-   Bağımlılıklar: `flutter pub get`
-   Çalıştırma:
    -   Mobil: `flutter run`
    -   Web: `flutter run -d chrome`
    -   Masaüstü (Linux/Mac/Windows destekli kurulumlarda): `flutter run -d linux|macos|windows`

---

### flask_api (Python/Flask)

-   Uygulama fabrikası: `create_app()`
-   Sağlık kontrolü: `GET /health`
-   Blueprint prefix'i: `/api`

#### Chat ve Embedding Endpoint'leri

-   `POST /api/chat`
    -   Body: `{ "question": "..." }`
    -   Dönüş: `{ "answer": string, "success": bool }`
-   `POST /api/chat/context`
    -   Body: `{ "embedding": number[], "query": string }`
    -   Dönüş: `{ "context": [...], "success": bool }` (hata durumunda tüm veriler gelebilir)
-   `POST /api/embedding`
    -   Body: `{ "text": "..." }`
    -   Dönüş: `{ "embedding": number[384], "success": bool }` (fallback üretimi olabilir)

#### Çalışan Yönetimi Endpoint'leri

-   `GET /api/employees`: Tüm çalışanlar
-   `POST /api/employees`: Çalışan ekle (isim üzerinden embedding oluşturur)
-   `PUT /api/employees/<id>`: Çalışan güncelle (kısmi güncelleme)
-   `DELETE /api/employees/<id>`: Çalışan sil
-   `DELETE /api/employees/all`: Tüm çalışanları sil
-   `POST /api/upload-employees` (Excel `file`): Toplu çalışan yükle
    -   Yükleme sırasında mevcut koleksiyon ve `employees.json` temizlenir

#### Ortam Değişkenleri (config/settings.py)

-   `SECRET_KEY`: Flask gizli anahtar
-   `FLASK_DEBUG`: `true/false`
-   `QDRANT_URL`: ör. `http://192.168.2.191:6333`
-   `QDRANT_COLLECTION`: ör. `mesai`
-   `AI_SERVICE_URL`: ör. `http://192.168.2.191:11434`
-   `AI_SERVICE_MODEL`: ör. `llama3`
-   `AI_EMBEDDING_MODEL`: ör. `all-minilm`
-   `AI_CHAT_MODEL`: ör. `llama3`
-   `CORS_ORIGINS`: virgülle ayrılmış kaynaklar (örn. `http://localhost:3000,...`)
-   `PORT`: varsayılan 5000
-   `HOST`: varsayılan `0.0.0.0`

#### Çalıştırma Örnekleri

-   Sanal ortam: `python3 -m venv venv && source venv/bin/activate`
-   Bağımlılıklar: `pip install -r requirements.txt`
-   Uygulama: `python app.py` (config'e göre host/port)
-   Docker: `cd flask_api && docker compose up -d`

---

### argenova_ai_app (Flutter)

-   API tabanı ve Qdrant URL'leri derleme zamanı parametreleri ile ayarlanabilir (`--dart-define`).
-   Zaman aşımı ve tekrar denemeler `ApiConfig` içinde tanımlı.

#### Derleme Zamanı Ayarları (lib/core/api/config.dart)

-   `API_BASE_URL` (varsayılan: `http://192.168.2.191:5000/api`)
-   `QDRANT_URL` (varsayılan: `http://192.168.2.191:6333`)
-   `timeoutSeconds` (30), `retryAttempts` (3)

#### İstemci API Kullanımı (ollama_service.dart)

-   `GET /employees` ile API erişilebilirlik kontrolü
-   `POST /chat` ile cevap üretimi
-   `POST /embedding` ile embedding
-   `streamGenerateAnswer(...)` ile akışlı yanıt simülasyonu

#### Çalıştırma Örnekleri

-   Bağımlılıklar: `flutter pub get`
-   Mobil: `flutter run`
-   Web: `flutter run -d chrome --dart-define=API_BASE_URL=http://localhost:5000/api`
-   Masaüstü: `flutter run -d linux --dart-define=API_BASE_URL=http://localhost:5000/api`

#### Build Örnekleri

-   Android APK: `flutter build apk --release --dart-define=API_BASE_URL=http://<IP>:5000/api --dart-define=QDRANT_URL=http://<IP>:6333`
-   Web: `flutter build web --release --dart-define=API_BASE_URL=http://<IP>:5000/api`

---

## Sorun Giderme (Kısa)

-   Qdrant koleksiyonu boyut uyumsuzluğu uyarısı alırsanız, mevcut koleksiyonu silip uygulamayı yeniden başlatın.
-   Ollama model bulunamadı hatası: `ollama pull <model>` komutunu çalıştırın ve `OLLAMA_URL` değerini doğrulayın.
-   CORS hataları için: `CORS_ORIGINS` içinde istemci adresinin tanımlı olduğundan emin olun.
