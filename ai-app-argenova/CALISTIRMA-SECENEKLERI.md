# 🚀 AI App Argenova - Çalıştırma Seçenekleri

Bu dokümanda AI App Argenova web uygulamasının farklı ortamlarda nasıl çalıştırılacağı açıklanmaktadır.

## 📋 Ön Gereksinimler

-   Docker ve Docker Compose yüklü olmalı
-   En az 4GB RAM (Ollama için)
-   Node.js 18+ (local development için)

## 🏠 Local Development (Geliştirme Ortamı)

### Seçenek 1: Docker ile Development Modu

```bash
# Development modunda başlat
npm run docker:dev

# Veya doğrudan docker-compose ile
docker-compose -f docker-compose.dev.yml up --build
```

**Özellikler:**

-   Hot reload aktif (kod değişikliklerinde otomatik yeniden başlatma)
-   Nodemon ile otomatik restart
-   Volume mount ile kod değişikliklerini anında yansıtma
-   Debug modunda çalışma

**Erişim Adresleri:**

-   Web Arayüzü: http://localhost:3000
-   API: http://localhost:3000/api
-   Qdrant Dashboard: http://localhost:6333/dashboard
-   Ollama API: http://localhost:11434/api

### Seçenek 2: Local Node.js ile Development

```bash
# Bağımlılıkları yükle
npm install

# Development modunda başlat
npm run dev
```

**Not:** Bu seçenek için MongoDB, Qdrant ve Ollama servislerinin ayrıca çalışıyor olması gerekir.

## 🏭 Production (Üretim Ortamı)

### Seçenek 1: Local Production

```bash
# Production modunda başlat
docker-compose up -d

# Logları izle
docker-compose logs -f

# Servisleri durdur
docker-compose down
```

**Özellikler:**

-   Optimized production build
-   Nginx reverse proxy
-   Health checks aktif
-   SSL desteği (yapılandırılabilir)

### Seçenek 2: Remote Production (Uzak Sunucu)

```bash
# Remote production modunda başlat
docker-compose -f docker-compose.remote.yml up -d

# SSL sertifikalarını otomatik yapılandır
./scripts/configure-remote.js
```

**Özellikler:**

-   Uzak Ollama sunucusu desteği
-   SSL sertifikası otomatik yapılandırma
-   Production optimizasyonları
-   Monitoring ve logging

## 🔧 Servis Yönetimi

### Servisleri Başlatma

```bash
# Tüm servisleri başlat
docker-compose up -d

# Belirli servisleri başlat
docker-compose up -d backend mongodb

# Build ile başlat
docker-compose up --build -d
```

### Servisleri Durdurma

```bash
# Tüm servisleri durdur
docker-compose down

# Volume'ları da sil
docker-compose down --volumes

# Orphan container'ları da temizle
docker-compose down --volumes --remove-orphans
```

### Logları İzleme

```bash
# Tüm servislerin logları
docker-compose logs -f

# Belirli servisin logları
docker-compose logs -f backend

# Son N satır log
docker-compose logs --tail=100
```

### Servis Durumu Kontrolü

```bash
# Çalışan container'ları listele
docker-compose ps

# Health check durumu
docker-compose ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}"
```

## 🐛 Sorun Giderme

### Port Çakışması

```bash
# Port kullanımını kontrol et
sudo netstat -tlnp | grep -E ':(3000|27017|6333|11434)'

# Sistem servislerini durdur
sudo systemctl stop ollama
sudo systemctl stop mongod

# Docker servislerini yeniden başlat
docker-compose down
docker-compose up -d
```

### Container Config Hatası

```bash
# Tüm container'ları ve volume'ları temizle
docker-compose down --volumes --remove-orphans
docker system prune -f

# Image'ları yeniden build et
docker-compose build --no-cache
docker-compose up -d
```

### Memory Sorunları

```bash
# Docker memory limitini kontrol et
docker stats

# Ollama model boyutunu kontrol et
docker exec ai-app-ollama ollama list
```

## 📊 Monitoring ve Health Checks

### Health Check Endpoint'leri

-   **Backend**: http://localhost:3000/api/health
-   **Qdrant**: http://localhost:6333/health
-   **Ollama**: http://localhost:11434/api/tags

### Monitoring Komutları

```bash
# Sistem kaynaklarını izle
docker stats

# Container loglarını filtrele
docker-compose logs -f | grep ERROR

# Disk kullanımını kontrol et
docker system df
```

## 🔐 Güvenlik

### SSL Yapılandırması

```bash
# SSL sertifikalarını oluştur
./scripts/setup-ssl.sh

# Nginx SSL konfigürasyonunu güncelle
cp nginx/nginx-ssl.conf nginx/nginx.conf
docker-compose restart nginx
```

### Environment Variables

```bash
# Environment dosyasını kopyala
cp env.example .env

# Production environment'ı kullan
cp env.production .env
```

## 📝 Kullanım Senaryoları

### 1. Hızlı Test

```bash
docker-compose up -d
# http://localhost:3000 adresine git
```

### 2. Development

```bash
npm run docker:dev
# Kod değişikliklerini yap, otomatik restart
```

### 3. Production Deployment

```bash
docker-compose -f docker-compose.remote.yml up -d
./scripts/configure-remote.js
```

### 4. Debug Mode

```bash
docker-compose -f docker-compose.dev.yml up
# Detaylı logları izle
```

## 🆘 Yardım

### Yaygın Sorunlar

1. **"nodemon: not found" hatası**

    - Development Dockerfile kullanıldığından emin ol
    - `docker-compose -f docker-compose.dev.yml up --build`

2. **Port already in use**

    - Sistem servislerini durdur
    - `docker-compose down` ile temizle

3. **ContainerConfig hatası**

    - Tüm container'ları temizle
    - `docker system prune -f`

4. **Memory yetersiz**
    - Ollama model boyutunu kontrol et
    - Docker memory limitini artır

### Destek

-   Logları kontrol et: `docker-compose logs`
-   Health check'leri test et
-   Docker resource'larını izle: `docker stats`
