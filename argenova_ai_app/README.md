# 🤖 Argenova AI Mesai Yönetim Sistemi

Merhaba! Ben **Argenova AI Mesai Yönetim Sistemi**'nin geliştiricisiyim. Bu projeyi, çalışan mesai verilerini yönetmek ve AI destekli sohbet sistemi ile kullanıcı deneyimini geliştirmek amacıyla geliştirdim.

## 🎯 Projenin Amacı

Bu uygulama, şirketlerin çalışan mesai verilerini kolayca yönetebilmeleri ve bu veriler hakkında doğal dil ile soru sorabilmeleri için tasarlanmıştır. AI destekli sohbet sistemi sayesinde, karmaşık mesai raporları yerine basit sorularla istediğiniz bilgilere ulaşabilirsiniz.

## 🚀 Özellikler

### 💬 AI Destekli Sohbet Sistemi

-   **Doğal Dil Sorguları**: "Ahmet'in bu ay kaç saat mesai yaptı?" gibi sorular sorabilirsiniz
-   **Context-Aware Yanıtlar**: AI, çalışan verilerinizi analiz ederek size özel yanıtlar verir
-   **Stream Yanıtlar**: Yanıtlar karakter karakter gelir, gerçek zamanlı deneyim sunar
-   **Sohbet Geçmişi**: Tüm sohbetleriniz yerel olarak saklanır ve istediğiniz zaman erişebilirsiniz

### 👥 Çalışan Yönetimi

-   **Çalışan Ekleme**: Yeni çalışanları kolayca sisteme ekleyebilirsiniz
-   **Günlük Mesai Takibi**: Her gün için ayrı mesai saatleri girebilirsiniz
-   **Otomatik Hesaplama**: Toplam mesai saatleri otomatik olarak hesaplanır
-   **Düzenleme ve Silme**: Mevcut çalışan bilgilerini güncelleyebilir veya silebilirsiniz

### 🎨 Modern Kullanıcı Arayüzü

-   **Açık/Koyu Tema**: Göz yorgunluğunu azaltan tema seçenekleri
-   **Responsive Tasarım**: Mobil ve tablet cihazlarda mükemmel görünüm
-   **Intuitive Navigation**: Kolay kullanılabilir menü sistemi
-   **Custom Widget'lar**: Özel tasarlanmış UI bileşenleri

### 💾 Veri Yönetimi

-   **Yerel Depolama**: Sohbet geçmişiniz cihazınızda güvenle saklanır
-   **Vektör Veritabanı**: Çalışan verileri Qdrant ile hızlı arama
-   **Offline Çalışma**: İnternet bağlantısı olmadan da temel özellikler çalışır

## 🏗️ Teknik Mimari

### Frontend (Flutter)

```dart
lib/
├── core/           # Temel bileşenler
│   ├── api/        # API servisleri
│   ├── models/     # Veri modelleri
│   ├── widgets/    # Özel UI bileşenleri
│   └── theme/      # Tema ayarları
├── features/       # Uygulama özellikleri
│   ├── home/       # Ana ekran
│   ├── chat/       # Sohbet ekranı
│   └── admin/      # Admin paneli
└── main.dart       # Uygulama giriş noktası
```

### Backend (Node.js)

```javascript
api/
├── index.js        # Ana API sunucusu
│   ├── /api/chat           # AI yanıtları
│   ├── /api/chat/context   # Semantic search
│   ├── /api/embedding      # Embedding oluşturma
│   └── /api/employees      # CRUD işlemleri
├── qdrant.js       # Qdrant veritabanı işlemleri
└── package.json    # Bağımlılıklar
```

### Veritabanları

-   **Hive**: Yerel sohbet geçmişi ve kullanıcı verileri
-   **Qdrant**: Vektör veritabanı (çalışan verileri ve semantic search)

### Veri Akışı

```
Flutter → Node.js API → Qdrant + AI Service
```

## 🔧 Kurulum ve Çalıştırma

### Gereksinimler

-   Flutter SDK (3.8.1+)
-   Node.js (18+)
-   Qdrant (yerel kurulum)
-   AI Service (165.232.134.134:8000)

### Adım 1: Flutter Uygulamasını Başlatın

```bash
# Bağımlılıkları yükleyin
flutter pub get

# Uygulamayı çalıştırın
flutter run
```

### Adım 2: Backend API'yi Başlatın

```bash
# API klasörüne geçin
cd api

# Environment variables ayarlayın
cp env.example .env

# Bağımlılıkları yükleyin
npm install

# API'yi başlatın
npm start

# Veya development modunda
npm run dev
```

**Not**: API artık bağımsız bir proje olarak çalışır. Detaylı kurulum için `api/README.md` dosyasına bakın.

### Adım 3: Qdrant'ı Başlatın

```bash
# Docker ile Qdrant'ı başlatın
docker run -p 6333:6333 qdrant/qdrant
```

## 📱 Kullanım Kılavuzu

### Yeni Sohbet Başlatma

1. Ana ekranda "Yeni Sohbet Başlat" butonuna tıklayın
2. Sohbet ekranında doğal dil ile sorunuzu yazın
3. AI size çalışan verilerinize göre yanıt verecektir

### Çalışan Ekleme

1. Sağ üst köşedeki admin ikonuna tıklayın
2. "Çalışan Ekle" sekmesine geçin
3. Çalışan bilgilerini ve günlük mesai saatlerini girin
4. "Kaydet" butonuna tıklayın

### Sohbet Geçmişi

-   Sol menüden önceki sohbetlerinizi görüntüleyebilirsiniz
-   Sohbetleri silebilir veya düzenleyebilirsiniz
-   Her sohbet otomatik olarak başlıklandırılır

## 🎯 Örnek Kullanım Senaryoları

### Senaryo 1: Mesai Sorgulama

```
Kullanıcı: "Ahmet'in bu ay kaç saat mesai yaptı?"
AI: "Ahmet'in 1-15 Ocak 2024 tarihleri arasında toplam 120 saat mesai yaptığını görüyorum.
     Pazartesi-Cuma günleri 8'er saat, Cumartesi 6 saat çalışmış."
```

### Senaryo 2: Karşılaştırmalı Analiz

```
Kullanıcı: "En çok mesai yapan çalışan kim?"
AI: "Verilerinize göre Mehmet en çok mesai yapan çalışan.
     Toplam 140 saat mesai yapmış ve bu ayın en verimli çalışanı."
```

### Senaryo 3: Tarih Bazlı Sorgu

```
Kullanıcı: "Geçen hafta kimler fazla mesai yaptı?"
AI: "Geçen hafta Ahmet 45 saat, Ayşe 42 saat mesai yapmış.
     İkisi de normal mesai saatlerinin üzerinde çalışmış."
```

## 🔒 Güvenlik ve Veri Koruma

-   **Yerel Veri Saklama**: Sohbet geçmişiniz cihazınızda saklanır
-   **Şifreli İletişim**: API iletişimi HTTPS üzerinden yapılır
-   **Veri Anonimleştirme**: Hassas bilgiler korunur
-   **Offline Çalışma**: İnternet bağlantısı olmadan da çalışır

## 🚧 Geliştirme Durumu

### ✅ Tamamlanan Özellikler

-   [x] Flutter UI/UX tasarımı
-   [x] AI sohbet sistemi
-   [x] Çalışan yönetimi
-   [x] Yerel veri saklama
-   [x] Tema sistemi
-   [x] Responsive tasarım

### 🔄 Geliştirilmekte Olan Özellikler

-   [ ] Push notification sistemi
-   [ ] Çoklu dil desteği
-   [ ] Gelişmiş raporlama
-   [ ] Export/Import özellikleri

### 📋 Gelecek Planları

-   [x] Web versiyonu
-   [ ] Mobil push bildirimleri
-   [ ] Gelişmiş AI modelleri
-   [ ] Çoklu şirket desteği

## 🐛 Bilinen Sorunlar

1. **Sunucu Bağımlılığı**: AI servisi aktif olmadığında sohbet sistemi çalışmaz
2. **Embedding Simülasyonu**: Şu anda gerçek embedding yerine simülasyon kullanılıyor
3. **Offline Context**: İnternet olmadığında context filtreleme sınırlı

## 🤝 Katkıda Bulunma

Bu projeye katkıda bulunmak istiyorsanız:

1. Repository'yi fork edin
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Değişikliklerinizi commit edin (`git commit -m 'Add amazing feature'`)
4. Branch'inizi push edin (`git push origin feature/amazing-feature`)
5. Pull Request oluşturun

## 📞 İletişim

Proje hakkında sorularınız veya önerileriniz için:

-   **Email**: [email protected]
-   **GitHub**: [github.com/yourusername/argenova_ai_app](https://github.com/yourusername/argenova_ai_app)
-   **Issues**: GitHub Issues sayfasını kullanabilirsiniz

## 📄 Lisans

Bu proje MIT lisansı altında lisanslanmıştır. Detaylar için `LICENSE` dosyasına bakın.

## 🙏 Teşekkürler

Bu projeyi geliştirirken kullandığım teknolojiler ve topluluklar:

-   **Flutter**: Google'ın harika UI framework'ü
-   **Riverpod**: State management için
-   **Hive**: Yerel veri saklama için
-   **Qdrant**: Vektör veritabanı için
-   **Node.js**: Backend API için

---

**Not**: Bu uygulama geliştirme aşamasındadır ve sürekli iyileştirilmektedir. Herhangi bir sorun yaşarsanız lütfen GitHub Issues sayfasından bildirin.

**Son Güncelleme**: Ocak 2024
