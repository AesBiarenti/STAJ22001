# Argenova Mobil Uygulaması

Bu uygulama, Flutter ile geliştirilmiş modern bir AI chat ve çalışan verileri analiz uygulamasıdır. Backend olarak Qdrant vektör veritabanı ve Flask API kullanır.

## 🚀 Özellikler

-   ChatGPT benzeri modern chat arayüzü
-   Çalışan verilerini (mesai, günlük saatler) analiz etme
-   Excel dosyasından çalışan verisi yükleme
-   Sadece chat ve çalışan verileri sekmeleri
-   Responsive ve sade tasarım
-   Llama3 ve diğer desteklenen modellerle AI entegrasyonu
-   Docker ile kolay backend kurulumu

## 🏗️ Proje Yapısı

```
argenova_ai_app/
├── lib/                # Flutter ana kodları
│   ├── core/           # API, modeller, tema, widgetlar
│   └── features/       # Chat, home, admin (admin kaldırıldı)
├── android/            # Android platform dosyaları
├── ios/                # iOS platform dosyaları
├── linux/              # Linux platform dosyaları
├── macos/              # MacOS platform dosyaları
├── windows/            # Windows platform dosyaları
├── web/                # Web build dosyaları
├── pubspec.yaml        # Flutter bağımlılıkları
└── README.md           # Bu dosya
```

## ⚡️ Kurulum

1. Flutter SDK kurulu olmalı
2. Gerekli paketleri yükle:
    ```bash
    flutter pub get
    ```
3. Uygulamayı başlat:
    ```bash
    flutter run
    ```

## 🔗 Backend Bağlantısı

-   Backend olarak Flask API (Qdrant ile) kullanılır.
-   API adresi ve ayarları `lib/core/api/config.dart` dosyasından değiştirilebilir.

## 📦 Çalışan Verisi Yükleme

-   Uygulama içinden Excel dosyası yükleyerek çalışan verilerini güncelleyebilirsiniz.
-   Yüklenen veriler backend'e gönderilir ve Qdrant'a kaydedilir.

## 📝 Notlar

-   Admin paneli, vektör sekmesi, format seçeneği ve beğen/beğenme gibi özellikler kaldırılmıştır.
-   Sadece chat ve çalışan verileri yönetimi aktif olarak kullanılmaktadır.

## 🛠️ Teknolojiler

-   Flutter
-   Dart
-   Flask API (backend)
-   Qdrant (vektör veritabanı)
-   Docker (backend için)

## 📄 Lisans

MIT
