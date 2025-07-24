from flask import Blueprint, request, jsonify
from services.qdrant_service import qdrant_service
from services.ai_service import ai_service
from models.employee import EmployeeCreate, EmployeeUpdate, EmployeeResponse
import logging
import pandas as pd
import tempfile
import os
import ast
from scripts.export_qdrant_to_json import export_qdrant_to_json
import pprint
import json

logger = logging.getLogger(__name__)

employee_bp = Blueprint('employee', __name__)

@employee_bp.route('/employees', methods=['GET'])
def get_all_employees():
    """Tüm çalışanları getir"""
    try:
        employees = qdrant_service.list_employees()
        
        return jsonify({
            "data": employees,
            "success": True,
            "count": len(employees)
        }), 200
        
    except Exception as e:
        logger.error(f"Employees GET Error: {e}")
        return jsonify({
            "error": str(e),
            "success": False
        }), 500

@employee_bp.route('/employees', methods=['POST'])
def add_employee():
    """Çalışan ekle"""
    try:
        data = request.get_json()
        employee_request = EmployeeCreate(**data)
        employee_data = employee_request.dict()
        # Embedding'i önceden oluştur ve ekle
        embedding_result = ai_service.generate_embedding(employee_data.get('isim', ''))
        employee_data['vector'] = embedding_result.get('embedding', [0.0]*384)
        employee = qdrant_service.add_employee(employee_data)
        return jsonify({"success": True, "message": "Çalışan eklendi"}), 201
    except Exception as e:
        logger.error(f"Employees POST Error: {e}")
        return jsonify({"success": False, "error": str(e)}), 400

@employee_bp.route('/employees/<int:employee_id>', methods=['PUT'])
def update_employee(employee_id):
    """Çalışan güncelle"""
    try:
        data = request.get_json()
        employee_request = EmployeeUpdate(**data)
        
        # Sadece None olmayan alanları güncelle
        update_data = {k: v for k, v in employee_request.dict().items() if v is not None}
        
        employee = qdrant_service.update_employee(employee_id, update_data)
        
        return jsonify({
            "data": employee,
            "success": True,
            "message": "Çalışan başarıyla güncellendi"
        }), 200
        
    except Exception as e:
        logger.error(f"Employees PUT Error: {e}")
        return jsonify({
            "error": str(e),
            "success": False
        }), 500

@employee_bp.route('/employees/<int:employee_id>', methods=['DELETE'])
def delete_employee(employee_id):
    """Çalışan sil"""
    try:
        qdrant_service.delete_employee(employee_id)
        
        return jsonify({
            "success": True,
            "message": "Çalışan başarıyla silindi",
            "deletedId": employee_id
        }), 200
        
    except Exception as e:
        logger.error(f"Employees DELETE Error: {e}")
        return jsonify({
            "error": str(e),
            "success": False
        }), 500 

@employee_bp.route('/employees/all', methods=['DELETE'])
def delete_all_employees():
    """Tüm çalışanları topluca sil"""
    try:
        qdrant_service.delete_all_employees()
        return jsonify({"success": True, "message": "Tüm çalışanlar silindi."}), 200
    except Exception as e:
        logger.error(f"Tüm çalışanları silme hatası: {e}")
        return jsonify({"success": False, "error": str(e)}), 500

@employee_bp.route('/upload-employees', methods=['POST'])
def upload_employees_from_excel():
    """Excel dosyasından toplu çalışan ekle"""
    try:
        # Qdrant koleksiyonunu tamamen sil
        qdrant_service.delete_all_employees()
        # employees.json dosyasını sil
        if os.path.exists("employees.json"):
            os.remove("employees.json")

        if 'file' not in request.files:
            return jsonify({"success": False, "error": "Dosya bulunamadı"}), 400
        file = request.files['file']
        if file.filename == '':
            return jsonify({"success": False, "error": "Dosya seçilmedi"}), 400

        # Dosyayı geçici olarak kaydet
        with tempfile.NamedTemporaryFile(delete=False, suffix='.xlsx') as tmp:
            file.save(tmp.name)
            tmp_path = tmp.name

        # Excel dosyasını oku
        df = pd.read_excel(tmp_path)
        os.unlink(tmp_path)  # Geçici dosyayı sil

        required_columns = {'isim', 'toplam_mesai', 'tarih_araligi', 'gunluk_mesai'}
        if not required_columns.issubset(df.columns):
            return jsonify({"success": False, "error": f"Excel başlıkları eksik: {required_columns - set(df.columns)}"}), 400

        # Aynı isimli çalışanları birleştir
        grouped = {}
        for idx, row in df.iterrows():
            # İsim temizliği
            isim = str(row['isim']).strip().lower()
            # Tarih aralığı temizliği ve standartlaştırma
            tarih_raw = str(row['tarih_araligi']).strip()
            try:
                # Tarih aralığı ör: '2025-07-07/2025-07-13' veya '07.07.2025/13.07.2025'
                tarih_parts = tarih_raw.replace('.', '-').split('/')
                if len(tarih_parts) == 2:
                    from datetime import datetime
                    def std_date(s):
                        s = s.strip()
                        # Eğer zaten YYYY-MM-DD ise değişmeden dön
                        if '-' in s and len(s) == 10:
                            return s
                        # Eğer DD-MM-YYYY veya DD.MM.YYYY ise çevir
                        for fmt in ('%d-%m-%Y', '%d.%m.%Y', '%Y-%m-%d'):
                            try:
                                return datetime.strptime(s, fmt).strftime('%Y-%m-%d')
                            except Exception:
                                continue
                        return s  # Olmazsa olduğu gibi bırak
                    tarih_araligi = f"{std_date(tarih_parts[0])}/{std_date(tarih_parts[1])}"
                else:
                    tarih_araligi = tarih_raw
            except Exception as e:
                tarih_araligi = tarih_raw
            # Eksik veri kontrolü
            if not isim or not row['toplam_mesai'] or not tarih_araligi:
                return jsonify({"success": False, "error": f"Eksik veya hatalı veri: Satır {idx+2} (isim: {isim}, tarih: {tarih_araligi})"}), 400
            try:
                gunluk_mesai = row['gunluk_mesai']
                if isinstance(gunluk_mesai, str):
                    gunluk_mesai = ast.literal_eval(gunluk_mesai)
                if not isinstance(gunluk_mesai, dict):
                    gunluk_mesai = {}
            except Exception as e:
                print(f"gunluk_mesai parse hatası: {e}, veri: {row['gunluk_mesai']}")
                gunluk_mesai = {}

            if isim not in grouped:
                grouped[isim] = {
                    'isim': isim,
                    'toplam_mesai': [],
                    'tarih_araligi': [],
                    'gunluk_mesai': []
                }
            grouped[isim]['toplam_mesai'].append(int(row['toplam_mesai']))
            grouped[isim]['tarih_araligi'].append(tarih_araligi)
            grouped[isim]['gunluk_mesai'].append(gunluk_mesai)

        pprint.pprint(grouped) # Gruplama sonrası print ile kontrol

        added = 0
        failed = 0
        failed_rows = []
        for isim, employee_data in grouped.items():
            print(f"EKLENECEK: {employee_data}") # Sadece gruplu verileri ekle
            try:
                embedding_result = ai_service.generate_embedding(employee_data.get('isim', ''))
                employee_data['vector'] = embedding_result.get('embedding', [0.0]*384)
                qdrant_service.add_employee(employee_data)
                added += 1
            except Exception as e:
                print(f"Qdrant ekleme hatası: {e}, veri: {employee_data}")
                failed += 1
                failed_rows.append(isim)

        # Qdrant'a ekleme bittikten sonra employees.json'a export et
        export_qdrant_to_json()

        message = f"{added} çalışan eklendi."
        if failed > 0:
            message += f" {failed} satır eklenemedi: {failed_rows}"
        return jsonify({"success": failed == 0, "message": message}), 200 if failed == 0 else 500
    except Exception as e:
        logger.error(f"Excel toplu ekleme hatası: {e}")
        return jsonify({"success": False, "error": str(e)}), 500 

@employee_bp.route('/api/employee-stats', methods=['GET'])
def get_employee_stats():
    try:
        # employees.json dosyasını oku
        if not os.path.exists('employees.json'):
            return jsonify({"success": False, "error": "Çalışan verileri bulunamadı"}), 404
        
        with open('employees.json', 'r', encoding='utf-8') as f:
            employees = json.load(f)
        
        if not employees:
            return jsonify({"success": False, "error": "Çalışan verisi bulunamadı"}), 404
        
        # İstatistikleri hesapla
        total_employees = len(employees)
        total_records = sum(len(emp.get('tarih_araligi', [])) for emp in employees)
        
        # Ortalama mesai saatlerini hesapla
        total_hours = 0
        total_periods = 0
        
        for emp in employees:
            toplam_mesai_list = emp.get('toplam_mesai', [])
            if toplam_mesai_list:
                total_hours += sum(toplam_mesai_list)
                total_periods += len(toplam_mesai_list)
        
        avg_work_hours = round(total_hours / total_periods, 2) if total_periods > 0 else 0
        
        stats = {
            "totalEmployees": total_employees,
            "totalRecords": total_records,
            "avgWorkHours": avg_work_hours,
            "totalWorkHours": total_hours
        }
        
        return jsonify({"success": True, "stats": stats})
        
    except Exception as e:
        print(f"İstatistik hesaplama hatası: {e}")
        return jsonify({"success": False, "error": f"İstatistik hesaplanırken hata oluştu: {str(e)}"}), 500 