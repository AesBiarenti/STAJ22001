# Argenova Flask API

Bu backend, çalışan verileri ve AI chat için Qdrant vektör veritabanı ile entegre çalışan bir Flask API sunar.

## 🚀 Özellikler

-   Çalışan verilerini Excel dosyasından yükleme
-   Qdrant vektör veritabanı ile hızlı ve ölçeklenebilir analiz
-   Chat endpoint'i ile çalışan verileri üzerinden AI yanıtı
-   Sadece chat ve çalışan verileri yönetimi
-   Docker ile kolay kurulum

## 🏗️ Proje Yapısı

```
flask_api/
├── app.py              # Ana Flask uygulaması
├── controllers/        # Chat ve çalışan yönetimi
├── services/           # Qdrant ve AI servisleri
├── models/             # Çalışan modeli
├── config/             # Ayar dosyaları
├── scripts/            # Yardımcı scriptler
├── employees.json      # (Opsiyonel) Dışa aktarılan çalışan verisi
├── requirements.txt    # Python bağımlılıkları
├── docker-compose.yml  # Docker servisleri
└── README.md           # Bu dosya
```

## ⚡️ Kurulum

1. Python 3.10+ kurulu olmalı
2. Gerekli paketleri yükle:
    ```bash
    pip install -r requirements.txt
    ```
3. Uygulamayı başlat:
    ```bash
    python app.py
    ```

## 🔗 Qdrant ve AI Entegrasyonu

-   Qdrant vektör veritabanı ile çalışan verileri saklanır ve analiz edilir.
-   AI yanıtları için Ollama/llama3 modeli ile entegrasyon yapılır.

## 📦 Çalışan Verisi Yükleme

-   `/upload-employees` endpoint'i ile Excel dosyasından çalışan verisi yüklenebilir.
-   Yüklenen veriler Qdrant'a kaydedilir.

## 📝 Notlar

-   Admin paneli, vektör sekmesi, format seçeneği ve beğen/beğenme gibi özellikler kaldırılmıştır.
-   Sadece chat ve çalışan verileri yönetimi aktif olarak kullanılmaktadır.

## 🛠️ Teknolojiler

-   Python 3
-   Flask
-   Qdrant
-   Docker

## 📄 Lisans

MIT
