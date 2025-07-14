import requests
import time

# Qdrant ve Ollama adresleri
QDRANT_URL = "http://localhost:6333"
OLLAMA_URL = "http://localhost:11434"

def generate_sample_data():
    """Dinamik örnek veri oluşturucu"""
    sample_names = [
        'Ali', 'Veli', 'Ayşe', 'Mehmet', 'Zeynep', 'Ahmet', 
        'Fatma', 'Kemal', 'Elif', 'Burak', 'Can', 'Deniz',
        'Ece', 'Fırat', 'Gizem', 'Hakan', 'İrem', 'Jale'
    ]
    
    sample_date_ranges = [
        '2024-07-01/2024-07-07',
        '2024-07-08/2024-07-14', 
        '2024-07-15/2024-07-21',
        '2024-07-22/2024-07-28',
        '2024-07-29/2024-08-04',
        '2024-08-05/2024-08-11'
    ]
    
    veriler = []
    
    for i, name in enumerate(sample_names):
        date_range = sample_date_ranges[i % len(sample_date_ranges)]
        total_hours = 30 + (i * 2) % 20  # 30-50 saat arası
        
        # Dinamik günlük mesai oluştur
        daily_hours = {}
        days = ['pazartesi', 'sali', 'carsamba', 'persembe', 'cuma']
        remaining_hours = total_hours
        
        for j, day in enumerate(days[:-1]):
            day_hours = 6 + (i + j) % 4  # 6-9 saat arası
            daily_hours[day] = day_hours
            remaining_hours -= day_hours
        
        # Son gün kalan saatleri al
        daily_hours[days[-1]] = remaining_hours if remaining_hours > 0 else 6
        
        veriler.append({
            "isim": name,
            "tarih_araligi": date_range,
            "toplam_mesai": total_hours,
            "gunluk_mesai": daily_hours
        })
    
    return veriler

veriler = generate_sample_data()

for i, payload in enumerate(veriler, 1):
    # Embedding'i Ollama'dan al
    prompt = f"{payload['isim']} {payload['tarih_araligi']} {payload['toplam_mesai']} saat {payload['gunluk_mesai']}"
    emb_res = requests.post(
        f"{OLLAMA_URL}/api/embeddings",
        json={"model": "mxbai-embed-large:latest", "prompt": prompt}
    )
    embedding = emb_res.json()["embedding"]
    # Qdrant'a ekle
    qdrant_res = requests.put(
        f"{QDRANT_URL}/collections/mesai/points",
        json={"points": [{"id": i, "vector": embedding, "payload": payload}]}
    )
    print(f"{payload['isim']} için eklendi, Qdrant yanıtı: {qdrant_res.status_code}")
    time.sleep(0.5)  # Ollama'yı yormamak için kısa bekleme

print("Tüm veriler başarıyla eklendi.") 