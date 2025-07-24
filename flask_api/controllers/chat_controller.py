from flask import Blueprint, request, jsonify
from services.ai_service import ai_service
from services.qdrant_service import qdrant_service
from models.employee import ChatRequest, ChatResponse, EmbeddingRequest, EmbeddingResponse, ContextRequest, ContextResponse
import logging

logger = logging.getLogger(__name__)

chat_bp = Blueprint('chat', __name__)

@chat_bp.route('/chat', methods=['POST'])
def chat():
    """Chat completion endpoint"""
    try:
        import json
        import re
        data = request.get_json()
        chat_request = ChatRequest(**data)

        # employees.json'dan verileri oku
        with open("employees.json", "r", encoding="utf-8") as f:
            employees = json.load(f)

        # Kullanıcı sorusundan isim(ler) tespit et (birden fazla isim desteği)
        # Türkçe karakterler dahil, kelime başı büyük/küçük harf duyarsız
        names = re.findall(r"[A-Za-zÇçĞğİıÖöŞşÜü]+", chat_request.question, re.IGNORECASE)
        names = [n.lower() for n in names]
        filtered = []
        if names:
            # employees.json'daki isimlerde geçenlerden sadece soruda geçenleri al
            for name in names:
                filtered += [emp for emp in employees if name in emp.get('isim', '').lower()]
            # Aynı kişi birden fazla eşleşirse tekrarları kaldır (id ile)
            unique = {}
            for emp in filtered:
                emp_id = emp.get('id')
                if emp_id is not None:
                    unique[emp_id] = emp
                else:
                    # id yoksa isme göre benzersizleştir
                    unique[emp.get('isim','').lower()] = emp
            filtered = list(unique.values())
        # Eğer filtrelenen yoksa ilk 1 kaydı al
        if not filtered:
            filtered = employees[:1]

        # Önemli talimatlar (prompt instructions)
        instructions = (
            "ÖNEMLİ TALİMATLAR:\n"
            "- Cevabını mutlaka Türkçe ver.\n"
            "- Kullanıcı birden fazla kişiyi veya karşılaştırma sorusu sorduğunda, sadece ilgili kişileri karşılaştır ve diğer kişileri dahil etme\n"
            "- Her karşılaştırma sorusuna, sadece o sorunun gerektirdiği kişileri ve bilgileri dahil et\n"
            "- Cevaplar kısa, net ve sadece ilgili kişilere özel olsun\n"
            "- Tek kişi sorulursa sadece o kişinin bilgilerini ver\n"
            "- Cevabın kısa ve öz olsun, gereksiz açıklama ve maddeleme yapma\n"
            "- İsmini, toplam saatini ve günlük saatlerini belirt\n"
            "- Kısa bir değerlendirme ekle (en fazla 1-2 cümle)\n"
            "- Verilen verileri tam olarak kullan, değiştirme\n"
            "- 'Bulamadım' deme, verilen context'te arama yap\n"
            "- Doğal ve öz yanıt ver, gereksiz tekrarlar yapma\n"
        )

        # Sadece temel alanları prompt'a ekle
        allowed_keys = ['isim', 'toplam_mesai', 'tarih_araligi', 'gunluk_mesai']
        filtered = [
            {k: emp[k] for k in allowed_keys if k in emp}
            for emp in filtered
        ]

        # Sadece özet bilgiyle prompt hazırla
        if filtered:
            employee_data = filtered[0]
            isim = employee_data['isim']
            toplam_mesai = sum(employee_data['toplam_mesai']) if isinstance(employee_data['toplam_mesai'], list) else employee_data['toplam_mesai']
            tarih_araligi = (
                f"{employee_data['tarih_araligi'][0]} - {employee_data['tarih_araligi'][-1]}"
                if isinstance(employee_data['tarih_araligi'], list) and len(employee_data['tarih_araligi']) > 1
                else (employee_data['tarih_araligi'][0] if isinstance(employee_data['tarih_araligi'], list) else employee_data['tarih_araligi'])
            )
            son_gunluk_mesai = (
                employee_data['gunluk_mesai'][-1] if isinstance(employee_data['gunluk_mesai'], list) else employee_data['gunluk_mesai']
            )
            veri_ozet = (
                f"İsim: {isim}\n"
                f"Toplam Mesai (tüm dönemler): {toplam_mesai}\n"
                f"Tarih Aralığı: {tarih_araligi}\n"
                f"Son Günlük Mesai: {son_gunluk_mesai}"
            )
        else:
            veri_ozet = ""

        prompt = f"{instructions}\n\nVeriler: {veri_ozet}\n\nSoru: {chat_request.question}\nCevap:"
        result = ai_service.generate_completion(prompt)

        response = ChatResponse(
            answer=result["answer"],
            success=result["success"],
            error=result.get("error")
        )

        return jsonify(response.dict()), 200 if result["success"] else 200
        
    except Exception as e:
        logger.error(f"Chat Controller Error: {e}")
        return jsonify({
            "answer": "Bir hata oluştu",
            "success": False,
            "error": str(e)
        }), 500

@chat_bp.route('/chat/context', methods=['POST'])
def get_context():
    """Context endpoint (semantic search)"""
    try:
        data = request.get_json()
        context_request = ContextRequest(**data)
        
        context = qdrant_service.search_by_embedding(
            context_request.embedding, 
            context_request.query
        )
        
        response = ContextResponse(context=context)
        return jsonify(response.dict()), 200
        
    except Exception as e:
        logger.error(f"Context Controller Error: {e}")
        
        # Hata durumunda tüm verileri döndür
        try:
            all_employees = qdrant_service.list_employees()
            return jsonify({
                "context": all_employees,
                "success": False,
                "error": "FALLBACK_TO_ALL_DATA"
            }), 200
        except Exception as fallback_err:
            return jsonify({
                "context": [],
                "success": False,
                "error": str(e)
            }), 500

@chat_bp.route('/embedding', methods=['POST'])
def generate_embedding():
    """Embedding endpoint"""
    try:
        data = request.get_json()
        embedding_request = EmbeddingRequest(**data)
        
        result = ai_service.generate_embedding(embedding_request.text)
        
        response = EmbeddingResponse(
            embedding=result["embedding"],
            success=result["success"],
            error=result.get("error")
        )
        
        return jsonify(response.dict()), 200
        
    except Exception as e:
        logger.error(f"Embedding Controller Error: {e}")
        
        # Fallback embedding
        import numpy as np
        fallback_embedding = list(np.random.random(384))
        
        return jsonify({
            "embedding": fallback_embedding,
            "success": False,
            "error": "EMBEDDING_FALLBACK"
        }), 200 