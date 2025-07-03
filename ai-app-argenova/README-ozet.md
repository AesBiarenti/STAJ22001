# AI Chat Uygulaması

Merhaba! Bu projede, modern ve kullanıcı dostu bir AI chat uygulaması geliştirdim. Hem frontend hem de backend tarafında, güncel RAG (retrieval-augmented generation) mimarisini ve en iyi UX prensiplerini uyguladım. İşte bu uygulamanın öne çıkan yönleri ve nasıl çalıştığına dair kendi gözlemlerim:

---

## Genel Bakış

Kullanıcıdan gelen her soruyu, önce vektör tabanlı ve anahtar kelime tabanlı arama ile zenginleştiriyorum. Benzer örnekleri bulup özetliyor, ardından LLM'e detaylı ve formatlı bir prompt gönderiyorum. Sonuçta, hem kaliteli hem de şeffaf bir yanıt sunuyorum.

---

## Neleri Başardım?

### 1. Modern ve Şık Chat Arayüzü

-   ChatGPT tarzı baloncuklar, otomatik kaydırma, loading animasyonu.
-   Sidebar'da geçmiş sorgular ve vektör veritabanı sekmeleri.
-   Responsive ve mobil uyumlu, modern bir tasarım.

### 2. Akıllı Sorgu Akışı

-   Soru ön işleme (temizleme, sadeleştirme).
-   Qdrant ile vektör arama + anahtar kelime tabanlı hibrit arama.
-   Benzer örneklerin özetlenmesi ve prompt'a eklenmesi.
-   LLM'e detaylı, formatlı ve talimatlı prompt gönderimi.
-   Yanıt sonrası otomatik değerlendirme (self-check).

### 3. Kullanıcıya Seçim Hakkı

-   Yanıt stili (detaylı, teknik, sade), formatı (zengin, madde, tablo, kod) ve uzunluğu (kısa, detaylı) seçilebiliyor.
-   Seçimler API'ye gönderiliyor ve prompt'a yansıyor.

### 4. Şeffaflık ve Geri Bildirim

-   Her yanıtın altında, kullanılan benzer örnekleri (kaynakları) gösteriyorum.
-   Otomatik değerlendirme sonucunu (selfCheck) kullanıcıya sunuyorum.
-   Kullanıcı, yanıt için "beğendim/beğenmedim" feedback'i verebiliyor.

### 5. Eğitim Verisi Yönetimi (Admin)

-   Sohbet geçmişinden veya admin panelden, kaliteli log'ları eğitim örneği olarak işaretleyebiliyorum.
-   Eğitim örneklerini kolayca dışa aktarabiliyorum.

---

## Backend Akışı

1. **/api/query** endpoint'i:

    - Soru ön işleme → Hibrit vektör/keyword arama → Benzer örneklerin özetlenmesi → Gelişmiş prompt oluşturma → LLM'den yanıt alma → Yanıt sonrası self-check → Yanıt, kaynaklar, selfCheck ve logId ile birlikte frontend'e dönülüyor.

2. **/api/feedback**:

    - Kullanıcıdan gelen feedback'i ilgili log'a kaydediyorum.

3. **/api/mark-training** ve **/api/training-examples**:
    - Log'u eğitim örneği olarak işaretliyorum ve eğitim örneklerini listeliyorum.

---

## Frontend Akışı

-   Kullanıcı, chat inputunun üstündeki seçeneklerle yanıt stili, formatı ve uzunluğunu belirleyebiliyor.
-   Mesaj gönderildiğinde, bu parametrelerle birlikte API'ye istek atıyorum.
-   Bot yanıtı geldiğinde:
    -   Yanıt balonunun altında benzer örnekler (kaynaklar) ve selfCheck kutusu gösteriyorum.
    -   Feedback butonları ile kullanıcıdan geri bildirim alıyorum.
-   Tüm yeni UI öğeleri modern, köşeleri yuvarlatılmış ve mevcut renk paletine uygun şekilde tasarlandı.
-   Kod blokları, tablolar ve madde işaretleri için özel CSS ile zengin format desteği sağladım.

---

## Dosya Yapısı (Kritik Dosyalar)

-   **controllers/aiController.js**: Tüm backend iş akışı ve API endpoint'leri.
-   **models/Log.js**: Sohbet ve eğitim örneği kayıt şeması.
-   **public/index.html**: Ana Vue.js tabanlı chat arayüzü.
-   **public/script.js**: Vue app state, API entegrasyonu ve UI mantığı.
-   **public/style.css**: Modern ve responsive tüm stiller.

---

## Son Söz

Bu projede, hem teknik hem de kullanıcı deneyimi açısından en iyi uygulamaları bir araya getirdim. Kodun ve tasarımın bütünlüğünü koruyarak, modern ve şeffaf bir AI chat deneyimi sundum. Geliştirmeye ve yeni özellikler eklemeye her zaman açığım!

Sorunuz olursa veya katkı sağlamak isterseniz bana ulaşabilirsiniz.
