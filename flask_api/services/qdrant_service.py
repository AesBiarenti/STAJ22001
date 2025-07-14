from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct, Filter, FieldCondition, MatchValue
import logging
from typing import List, Dict, Any, Optional
from config.settings import Config

logger = logging.getLogger(__name__)

class QdrantService:
    def __init__(self):
        self.client = QdrantClient(host=Config.QDRANT_URL.replace('http://', '').split(':')[0],
                                  port=int(Config.QDRANT_URL.split(':')[-1]))
        self.collection_name = Config.QDRANT_COLLECTION
        self.vector_size = Config.QDRANT_VECTOR_SIZE
        
    def create_collection(self) -> bool:
        """Qdrant collection oluştur"""
        try:
            self.client.create_collection(
                collection_name=self.collection_name,
                vectors_config=VectorParams(
                    size=self.vector_size,
                    distance=Distance.COSINE
                )
            )
            logger.info(f"✅ Qdrant collection '{self.collection_name}' oluşturuldu")
            return True
        except Exception as e:
            if "already exists" in str(e):
                logger.info(f"ℹ️ Collection '{self.collection_name}' zaten mevcut")
                return True
            logger.error(f"create_collection error: {e}")
            return False
    
    def list_employees(self) -> List[Dict[str, Any]]:
        """Tüm çalışanları listele"""
        try:
            points = self.client.scroll(
                collection_name=self.collection_name,
                limit=100,
                with_payload=True
            )[0]
            
            return [
                {
                    "id": point.id,
                    **point.payload
                }
                for point in points
            ]
        except Exception as e:
            logger.error(f"list_employees error: {e}")
            raise Exception(f"Çalışan verileri alınamadı: {e}")
    
    def add_employee(self, employee_data: Dict[str, Any]) -> Dict[str, Any]:
        """Çalışan ekle"""
        try:
            import time
            point_id = int(time.time() * 1000)
            
            vector = employee_data.get('vector')
            if vector is None:
                # Qdrant koleksiyonunun vektör boyutuna göre örnek bir vektör oluştur
                vector = [0.0] * self.vector_size
            
            point = PointStruct(
                id=point_id,
                vector=vector,
                payload=employee_data
            )
            
            self.client.upsert(
                collection_name=self.collection_name,
                points=[point]
            )
            
            return {"id": point_id, **employee_data}
        except Exception as e:
            logger.error(f"add_employee error: {e}")
            raise Exception(f"Çalışan eklenemedi: {e}")
    
    def update_employee(self, employee_id: int, employee_data: Dict[str, Any]) -> Dict[str, Any]:
        """Çalışan güncelle"""
        try:
            # Önce sil, sonra ekle
            self.delete_employee(employee_id)
            return self.add_employee(employee_data)
        except Exception as e:
            logger.error(f"update_employee error: {e}")
            raise Exception(f"Çalışan güncellenemedi: {e}")
    
    def delete_employee(self, employee_id: int) -> Dict[str, Any]:
        """Çalışan sil"""
        try:
            self.client.delete(
                collection_name=self.collection_name,
                points_selector=[employee_id]
            )
            return {"id": employee_id}
        except Exception as e:
            logger.error(f"delete_employee error: {e}")
            raise Exception(f"Çalışan silinemedi: {e}")
    
    def search_by_embedding(self, embedding: List[float], query: str) -> List[Dict[str, Any]]:
        """Semantic search"""
        try:
            search_result = self.client.search(
                collection_name=self.collection_name,
                query_vector=embedding,
                limit=10,
                with_payload=True,
                score_threshold=0.7
            )
            
            if not search_result:
                return self.text_based_search(query)
            
            return [
                {
                    "id": point.id,
                    "score": point.score,
                    **point.payload
                }
                for point in search_result
            ]
        except Exception as e:
            logger.error(f"search_by_embedding error: {e}")
            return self.text_based_search(query)
    
    def text_based_search(self, query: str) -> List[Dict[str, Any]]:
        """Text-based search (fallback)"""
        try:
            all_employees = self.list_employees()
            query_lower = query.lower()
            
            filtered = [
                emp for emp in all_employees
                if emp.get('isim', '').lower().find(query_lower) != -1
            ]
            
            return filtered if filtered else all_employees
        except Exception as e:
            logger.error(f"text_based_search error: {e}")
            return []

# Singleton instance
qdrant_service = QdrantService() 