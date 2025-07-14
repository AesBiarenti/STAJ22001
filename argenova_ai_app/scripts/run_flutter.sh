#!/bin/bash

# Flutter uygulamasını farklı environment'larda çalıştırma script'i

echo "🚀 Flutter Argenova AI App - Environment Selector"
echo "================================================"
echo "1. Development (Local Flask API)"
echo "2. Production (Remote Flask API)"
echo "3. Docker Compose (Local Docker)"
echo "4. Custom API URL"
echo ""

read -p "Seçiminizi yapın (1-4): " choice

case $choice in
    1)
        echo "🔧 Development mode başlatılıyor..."
        echo "API URL: http://localhost:3000/api"
        flutter run --dart-define=API_BASE_URL=http://localhost:3000/api
        ;;
    2)
        echo "🌐 Production mode başlatılıyor..."
        echo "API URL: http://192.168.2.191:3000/api"
        flutter run --dart-define=API_BASE_URL=http://192.168.2.191:3000/api
        ;;
    3)
        echo "🐳 Docker Compose mode başlatılıyor..."
        echo "API URL: http://localhost:3000/api"
        echo "Qdrant URL: http://localhost:6333"
        flutter run \
            --dart-define=API_BASE_URL=http://localhost:3000/api \
            --dart-define=QDRANT_URL=http://localhost:6333
        ;;
    4)
        read -p "API URL'ini girin: " custom_url
        echo "🔧 Custom mode başlatılıyor..."
        echo "API URL: $custom_url"
        flutter run --dart-define=API_BASE_URL=$custom_url
        ;;
    *)
        echo "❌ Geçersiz seçim!"
        exit 1
        ;;
esac 