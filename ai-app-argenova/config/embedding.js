const axios = require("axios");

class EmbeddingService {
    constructor() {
        this.baseURL = "http://localhost:11434/api";
        this.model = "mxbai-embed-large";
        this.isAvailable = true;

        console.log("🔧 EmbeddingService başlatılıyor...");
        console.log("🔄 MXBAI embedding sistemi aktif");
    }

    async getEmbedding(text) {
        try {
            const response = await axios.post(
                `${this.baseURL}/embeddings`,
                {
                    model: this.model,
                    prompt: text,
                },
                {
                    headers: {
                        "Content-Type": "application/json",
                    },
                    timeout: 10000,
                }
            );
            return response.data.embedding;
        } catch (error) {
            console.error("❌ MXBAI embedding hatası:", error.message);
            throw new Error("MXBAI embedding alınamadı");
        }
    }

    async getEmbeddings(texts) {
        try {
            const embeddings = [];
            for (const text of texts) {
                const embedding = await this.getEmbedding(text);
                embeddings.push(embedding);
            }
            return embeddings;
        } catch (error) {
            console.error("❌ MXBAI embeddings hatası:", error.message);
            throw new Error("MXBAI embeddings alınamadı");
        }
    }

    async calculateSimilarity(text1, text2) {
        try {
            const [embedding1, embedding2] = await this.getEmbeddings([
                text1,
                text2,
            ]);
            return this.cosineSimilarity(embedding1, embedding2);
        } catch (error) {
            console.error("❌ Benzerlik hesaplanamadı:", error.message);
            return 0;
        }
    }

    cosineSimilarity(vecA, vecB) {
        const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
        const normA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
        const normB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
        if (normA === 0 || normB === 0) return 0;
        return dotProduct / (normA * normB);
    }
}

module.exports = EmbeddingService;
