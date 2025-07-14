#!/bin/bash

# SSL sertifikaları oluşturma script'i

SSL_DIR="./nginx/ssl"
DOMAIN="localhost"

echo "🔐 SSL sertifikaları oluşturuluyor..."

# SSL dizinini oluştur
mkdir -p $SSL_DIR

# Self-signed sertifika oluştur
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout $SSL_DIR/key.pem \
    -out $SSL_DIR/cert.pem \
    -subj "/C=TR/ST=Istanbul/L=Istanbul/O=Argenova/OU=IT/CN=$DOMAIN"

# Sertifika izinlerini ayarla
chmod 600 $SSL_DIR/key.pem
chmod 644 $SSL_DIR/cert.pem

echo "✅ SSL sertifikaları oluşturuldu:"
echo "   📄 Sertifika: $SSL_DIR/cert.pem"
echo "   🔑 Anahtar: $SSL_DIR/key.pem"
echo ""
echo "💡 Production ortamında Let's Encrypt kullanmanız önerilir." 