# AI App Argenova - Nginx & Uzak Sunucu Özellikleri

## 🚀 Yeni Özellikler

### 1. **Nginx Reverse Proxy**

-   **Load Balancing**: Backend servisleri arasında yük dağıtımı
-   **SSL Termination**: HTTPS desteği
-   **Rate Limiting**: API ve Ollama için ayrı rate limit'ler
-   **Security Headers**: Güvenlik başlıkları
-   **Gzip Compression**: Performans optimizasyonu
-   **Health Checks**: Servis durumu kontrolü

### 2. **Uzak Sunucu Bağlantısı**

-   **Remote MongoDB**: Uzak MongoDB sunucusuna bağlanma
-   **Remote Qdrant**: Uzak Qdrant sunucusuna bağlanma
-   **Remote Ollama**: Uzak Ollama sunucusuna bağlanma
-   **Environment Configuration**: Otomatik konfigürasyon
-   **SSL Support**: Güvenli bağlantı desteği

## 🛠️ Kurulum Seçenekleri

### 1. **Local Docker (Tüm Servisler)**

```bash
# Development
npm run docker:dev

# Production
npm run docker:prod
```

### 2. **Uzak Sunucu Bağlantısı**

```bash
# Konfigürasyon
npm run configure:remote

# Çalıştırma
npm run docker:remote
```

### 3. **SSL Sertifikaları**

```bash
# Self-signed sertifika
npm run setup:ssl

# Tüm kurulum
npm run setup:all
```

## 📋 Nginx Konfigürasyonu

### Endpoint'ler

-   **`/`**: Ana uygulama (backend proxy)
-   **`/api/*`**: API endpoint'leri (rate limited)
-   **`/ollama/*`**: Ollama API (rate limited)
-   **`/qdrant/*`**: Qdrant API
-   **`/health`**: Health check

### Rate Limiting

-   **API**: 10 req/s, burst 20
-   **Ollama**: 5 req/s, burst 10

### SSL Desteği

-   **HTTP → HTTPS**: Otomatik yönlendirme
-   **TLS 1.2/1.3**: Modern şifreleme
-   **HSTS**: Güvenlik başlıkları

## 🌐 Uzak Sunucu Konfigürasyonu

### Otomatik Konfigürasyon

```bash
npm run configure:remote
```

### Manuel Konfigürasyon

```env
# env.production
MONGODB_URI=mongodb://remote-server:27017/ai_logs
QDRANT_URL=http://remote-server:6333
OLLAMA_URL=http://remote-server:11434/api
```

### Uzak Sunucu Gereksinimleri

-   **MongoDB**: Port 27017 (varsayılan)
-   **Qdrant**: Port 6333 (varsayılan)
-   **Ollama**: Port 11434 (varsayılan)

## 🔧 Docker Compose Dosyaları

### 1. **docker-compose.yml** (Production - Local)

-   Nginx + Backend + MongoDB + Qdrant + Ollama
-   SSL desteği
-   Health checks

### 2. **docker-compose.dev.yml** (Development)

-   Volume mounts
-   Hot reload
-   Debug modu

### 3. **docker-compose.remote.yml** (Uzak Sunucu)

-   Sadece Nginx + Backend
-   Uzak servislere bağlanır
-   SSL opsiyonel

## 📊 Performans Özellikleri

### Nginx Optimizasyonları

-   **Gzip Compression**: %70-80 boyut azaltma
-   **Connection Pooling**: Bağlantı havuzu
-   **Buffer Optimization**: Buffer ayarları
-   **Timeout Management**: Akıllı timeout'lar

### Security Features

-   **Rate Limiting**: DDoS koruması
-   **Security Headers**: XSS, CSRF koruması
-   **SSL/TLS**: Şifreli iletişim
-   **Proxy Headers**: Doğru IP adresleri

## 🚀 Kullanım Senaryoları

### Senaryo 1: Local Development

```bash
npm run docker:dev
# http://localhost:3000
```

### Senaryo 2: Production (Local)

```bash
npm run docker:prod
# http://localhost (Nginx proxy)
```

### Senaryo 3: Production (Remote)

```bash
npm run configure:remote
npm run docker:remote
# http://your-domain.com
```

### Senaryo 4: SSL ile Production

```bash
npm run setup:ssl
npm run configure:remote  # SSL seçeneği: y
npm run docker:remote
# https://your-domain.com
```

## 📝 Environment Variables

### Local Docker

```env
MONGODB_URI=mongodb://mongodb:27017/ai_logs
QDRANT_URL=http://qdrant:6333
OLLAMA_URL=http://ollama:11434/api
```

### Remote Server

```env
MONGODB_URI=mongodb://remote-server:27017/ai_logs
QDRANT_URL=http://remote-server:6333
OLLAMA_URL=http://remote-server:11434/api
TRUST_PROXY=true
```

## 🔍 Monitoring & Health Checks

### Health Check Endpoints

-   **`/health`**: Genel servis durumu
-   **`/api/health`**: Backend detaylı durum

### Docker Health Checks

-   **Nginx**: 30s interval
-   **Backend**: 30s interval
-   **Ollama**: 30s interval

## 📋 Komutlar Özeti

```bash
# Local Development
npm run docker:dev

# Local Production
npm run docker:prod

# Remote Server
npm run configure:remote
npm run docker:remote

# SSL Setup
npm run setup:ssl

# Model Setup
npm run setup:models

# All Setup
npm run setup:all

# Stop Services
npm run docker:down
npm run docker:down:dev
npm run docker:down:remote
```

## 🎯 Avantajlar

1. **Scalability**: Nginx ile yük dağıtımı
2. **Security**: SSL, rate limiting, security headers
3. **Performance**: Gzip, caching, optimization
4. **Flexibility**: Local/remote seçenekleri
5. **Monitoring**: Health checks, logging
6. **Ease of Use**: Otomatik konfigürasyon
