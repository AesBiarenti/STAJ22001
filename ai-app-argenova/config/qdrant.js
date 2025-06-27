const axios = require("axios");

class QdrantClient {
    constructor() {
        this.baseURL = process.env.QDRANT_URL || "http://localhost:6333";
        this.collectionName = process.env.QDRANT_COLLECTION || "ai_logs";
        this.vectorSize = 1536; // OpenAI embedding boyutu
        this.client = axios.create({
            baseURL: this.baseURL,
            timeout: 10000,
        });
    }

    // String ID'yi integer'a çevir
    stringToId(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = (hash << 5) - hash + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return Math.abs(hash);
    }

    // Koleksiyon oluştur
    async createCollection() {
        try {
            const response = await this.client.put(
                `/collections/${this.collectionName}`,
                {
                    vectors: {
                        size: this.vectorSize,
                        distance: "Cosine",
                    },
                }
            );
            console.log(
                "✅ Qdrant koleksiyonu oluşturuldu:",
                this.collectionName
            );
            return true;
        } catch (error) {
            if (error.response?.status === 409) {
                console.log(
                    "ℹ️ Qdrant koleksiyonu zaten mevcut:",
                    this.collectionName
                );
                return true;
            }
            console.error(
                "❌ Qdrant koleksiyonu oluşturulamadı:",
                error.message
            );
            return false;
        }
    }

    // Vektör ekle
    async addVector(id, vector, payload) {
        try {
            // String ID'yi integer'a çevir
            const numericId = this.stringToId(id);

            await this.client.put(
                `/collections/${this.collectionName}/points`,
                {
                    points: [
                        {
                            id: numericId,
                            vector: vector,
                            payload: payload,
                        },
                    ],
                }
            );
            return true;
        } catch (error) {
            console.error("❌ Vektör eklenemedi:", error.message);
            if (error.response?.data) {
                console.error("Qdrant hatası:", error.response.data);
            }
            return false;
        }
    }

    // Benzer vektörleri ara
    async searchSimilar(vector, limit = 5) {
        try {
            const response = await this.client.post(
                `/collections/${this.collectionName}/points/search`,
                {
                    vector: vector,
                    limit: limit,
                    with_payload: true,
                    with_vector: false,
                }
            );
            return response.data.result;
        } catch (error) {
            console.error("❌ Benzer vektörler aranamadı:", error.message);
            return [];
        }
    }

    // Koleksiyon durumunu kontrol et
    async getCollectionInfo() {
        try {
            const response = await this.client.get(
                `/collections/${this.collectionName}`
            );
            return response.data;
        } catch (error) {
            console.error("❌ Koleksiyon bilgisi alınamadı:", error.message);
            return null;
        }
    }

    // Koleksiyonu temizle
    async clearCollection() {
        try {
            await this.client.delete(
                `/collections/${this.collectionName}/points/delete`,
                {
                    data: {
                        filter: {},
                    },
                }
            );
            console.log("✅ Qdrant koleksiyonu temizlendi");
            return true;
        } catch (error) {
            console.error("❌ Koleksiyon temizlenemedi:", error.message);
            return false;
        }
    }
}

module.exports = QdrantClient;
