import sys
import os
import json
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from services.qdrant_service import qdrant_service

def export_qdrant_to_json(json_path="employees.json"):
    employees = qdrant_service.list_employees()
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(employees, f, ensure_ascii=False, indent=2)
    print(f"{len(employees)} kayıt {json_path} dosyasına yazıldı.")

if __name__ == "__main__":
    print("Qdrant verileri çekiliyor...")
    export_qdrant_to_json() 