# LLM Model Seçimi ve Karşılaştırması

## 1. Proje Özeti

-   Node.js ve Express tabanlı, haftalık çalışma verilerini analiz eden bir AI asistanı.
-   Qdrant vektör veritabanı ve MongoDB kullanıyor.
-   **Embedding işlemleri için sadece mxbai-embed-large (Ollama) modeli kullanılmaktadır.**
-   OpenAI API ve hash tabanlı fallback yöntemleri kaldırılmıştır.
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

## 5. Embedding Yöntemi

-   Projede embedding işlemleri **yalnızca mxbai-embed-large** modeli ile Ollama API üzerinden yapılmaktadır.
-   OpenAI API veya hash tabanlı fallback embedding yöntemleri kullanılmamaktadır.
-   Embedding işlemleri için Ollama'nın mxbai-embed-large modelinin çalışır durumda olması gereklidir.

## 6. RAM Gereksinimleri

-   3B model için minimum 2GB RAM
-   7B model için önerilen 8GB RAM
-   70B model için 40GB+ RAM

## 7. Sonuç ve Öneri

-   Llama modelleri, projeniz için en uygun, hızlı, güvenli ve maliyetsiz çözümdür.
-   Deepseek ve Claude gibi alternatifler, ya daha karmaşık ya da ücretli ve dışa bağımlıdır.
-   Llama ile hem yerel hem de esnek bir AI asistanı altyapısı kurabilirsiniz.
