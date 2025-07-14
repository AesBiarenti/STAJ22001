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
        data = request.get_json()
        chat_request = ChatRequest(**data)
        
        result = ai_service.generate_completion(chat_request.question)
        
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