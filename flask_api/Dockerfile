FROM python:3.11-slim

WORKDIR /app

# Sistem bağımlılıklarını yükle
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Python bağımlılıklarını kopyala ve yükle
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Uygulama kodunu kopyala
COPY . .

# Port'u aç
EXPOSE 5000

# Uygulamayı çalıştır
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "--timeout", "300", "app:create_app()"] 