# STAJ22001 - Proje Özeti 

Bu depo üç ayrı projeyi içeriyor:

1. ai-app-argenova (Vuejs/Node.js/Express - AI servis entegrasyonları ve web)
2. argenova_ai_app (Flutter - çok platformlu istemci)
3. flask_api (Python/Flask - API ve Qdrant entegrasyonu)

Bu uygulamalar, staj süresi boyunca geliştirdiğim mobil ve web uygulamalarının ilk versiyonlarıdır, bu yüzden uygulamanın llm cevap kalitesi, yeni versiyonları kadar iyi değildir. STAJ22002 reposunda yeni versiyonları mevcuttur
---

## 1) ai-app-argenova (Vuejs/Node.js/Express)
<img width="1017" height="520" alt="Ekran Görüntüsü - 2025-08-14 16-26-46 1" src="https://github.com/user-attachments/assets/c4cb1860-93b7-4ad9-8211-f0286b3fa67a" />

-   Amaç: AI servisleri (Ollama, Qdrant, vb.) ile etkileşim kuran bir Node.js sunucusu ve basit web arayüzü.
-   Teknolojiler: Vuejs, Node.js, Express, Nginx (opsiyonel), Docker-Compose
-   Önemli dosya/dizinler:
    -   `server.js`, `routes/`, `controllers/`, `config/`
    -   `public/` (istemci sayfaları)
    -   `docker-compose.yml`, `docker-compose.dev.yml`, `Dockerfile`

### Geliştirme

-   Bağımlılıklar: `cd ai-app-argenova && npm install`

### Docker ile Çalıştırma

-   `cd ai-app-argenova`
-   `docker compose up -d` (veya `docker-compose up -d`)

---

## 2) argenova_ai_app (Flutter)
<img width="624" height="690" alt="Rectangle" src="https://github.com/user-attachments/assets/f0e32024-2e40-4e1e-8ea0-9506e9a608a9" />

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

## 3) flask_api (Python/Flask)

-   Amaç: AI servisleri ve Qdrant ile etkileşen REST API.
-   Teknolojiler: Python 3, Flask, Qdrant istemcisi, Docker-Compose
-   Önemli dosya/dizinler:
    -   `app.py`, `controllers/`, `services/`, `models/`, `config/`
    -   `requirements.txt`
    -   `docker-compose.yml`, `Dockerfile`

### Geliştirme

-   Bağımlılıklar: `pip install -r requirements.txt`
-   Çalıştırma (geliştirme): `flask run` veya `python app.py`
-   Ortam değişkenleri: `.env` (ör. Qdrant, model servis URL'leri)

### Docker ile Çalıştırma

-   `cd flask_api`
-   `docker compose up -d` (veya `docker-compose up -d`)


