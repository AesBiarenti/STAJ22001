const axios = require("axios");

class EmbeddingService {
    constructor() {
        this.baseURL = "http://localhost:11434/api";
        this.model = "mxbai-embed-large";
        this.isAvailable = true;

        console.log("🔧 EmbeddingService başlatılıyor...");
        console.log("🔄 MXBAI embedding sistemi aktif");
        console.log("💡 Bu sistem OpenAI API'sine ihtiyaç duymaz");
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
           
            return this.createAdvancedEmbedding(text);
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
            return texts.map((text) => this.createAdvancedEmbedding(text));
        }
    }

 
    createAdvancedEmbedding(text) {
        const vector = new Array(1536).fill(0);
        const words = text
            .toLowerCase()
            .replace(/[^\w\s]/g, "") 
            .split(/\s+/)
            .filter((word) => word.length > 2); 

    
        const wordFreq = {};
        words.forEach((word) => {
            wordFreq[word] = (wordFreq[word] || 0) + 1;
        });

        
        Object.entries(wordFreq).forEach(([word, freq], index) => {
            const hash = this.advancedHash(word);
            const position = hash % 1536;
            const weight = freq / (index + 1);

           
            vector[position] += weight;
            vector[(position + 768) % 1536] -= weight * 0.5; 
        });

   
        const magnitude = Math.sqrt(
            vector.reduce((sum, val) => sum + val * val, 0)
        );

        if (magnitude > 0) {
            return vector.map((val) => val / magnitude);
        }

        return vector;
    }

  
    advancedHash(str) {
        let hash = 0;
        const prime = 31;

        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = (hash * prime + char) % 2147483647;
        }

        return Math.abs(hash);
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
