# AI App Argenova - Güncellemeler

## 🚀 Yapılan Güncellemeler

### 1. **Model Güncellemeleri**

-   **Chat Modeli**: `llama3.2:7b` → `llama3` (varsayılan)
-   **Embedding Modeli**: `mxbai-embed-large` → `all-minilm`
-   **Vector Boyutu**: 1024 → 384 (all-minilm için)

### 2. **Docker Compose Güncellemeleri**

-   **Production**: `docker-compose.yml` - Ollama servisi eklendi
-   **Development**: `docker-compose.dev.yml` - Yeni dosya oluşturuldu
-   **Environment Variables**: Ollama konfigürasyonları eklendi
-   **Volumes**: Ollama modelleri için kalıcı depolama

### 3. **Konfigürasyon Güncellemeleri**

-   **AI Config**: `OLLAMA_CHAT_MODEL` ve `OLLAMA_EMBEDDING_MODEL` ayrıldı
-   **Qdrant Config**: Dinamik vector boyutu kontrolü eklendi
-   **Embedding Config**: Environment variable desteği eklendi

### 4. **Yeni Özellikler**

-   **Health Check Endpoint**: `/api/health` - Servis durumu kontrolü
-   **Model Setup Script**: `npm run setup:models` - Otomatik model indirme
-   **Docker Scripts**: Development ve production için ayrı komutlar

### 5. **Environment Variables**

```env
# Yeni değişkenler
OLLAMA_URL=http://localhost:11434/api
OLLAMA_CHAT_MODEL=llama3
OLLAMA_EMBEDDING_MODEL=all-minilm
AI_TEMPERATURE=0.7
AI_MAX_TOKENS=512
```

## 🛠️ Kullanım

### Development Ortamı

```bash
# Docker ile (önerilen)
npm run docker:dev

# Manuel
npm install
cp env.example .env
npm run setup:models
npm run dev
```

### Production Ortamı

```bash
# Docker ile
npm run docker:prod

# Manuel
npm start
```

### Model Kurulumu

```bash
# Otomatik (önerilen)
npm run setup:models

# Manuel
ollama pull llama3
ollama pull all-minilm
```

## 📊 Model Karşılaştırması

| Model          | Boyut | RAM | Vektör Boyutu | Hız    | Kalite |
| -------------- | ----- | --- | ------------- | ------ | ------ |
| **llama3**     | 8B    | 8GB | -             | ⚡⚡   | 🟢     |
| **all-minilm** | 91MB  | -   | 384           | ⚡⚡⚡ | 🟢     |

## 🔧 Docker Servisleri

-   **backend**: Node.js uygulaması
-   **mongodb**: Veritabanı
-   **qdrant**: Vektör veritabanı
-   **ollama**: AI modelleri

## 📝 Notlar

-   Qdrant koleksiyonu otomatik olarak doğru vector boyutu ile oluşturulur
-   Ollama modelleri Docker volume'da kalıcı olarak saklanır
-   Health check endpoint tüm servislerin durumunu kontrol eder
-   Development ve production ortamları ayrı Docker Compose dosyaları ile yönetilir
