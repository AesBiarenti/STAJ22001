const axios = require("axios");

// Llama model seçenekleri
const LLAMA_MODELS = {
    llama3: {
        name: "Llama 3",
        description: "En son Llama modeli - yüksek kalite",
        ram: "8GB",
        speed: "Hızlı",
    },
    "llama3.2:3b": {
        name: "Llama 3.2 3B",
        description: "Hızlı ve hafif, genel kullanım için ideal",
        ram: "2GB",
        speed: "Çok hızlı",
    },
    "llama3.2:7b": {
        name: "Llama 3.2 7B",
        description: "Dengeli performans ve hız",
        ram: "4GB",
        speed: "Hızlı",
    },
    "llama3.2:70b": {
        name: "Llama 3.2 70B",
        description: "En yüksek kalite (daha fazla RAM gerekli)",
        ram: "40GB",
        speed: "Yavaş",
    },
    "phi3:mini": {
        name: "Phi-3 Mini",
        description: "Çok hızlı ve hafif",
        ram: "1.5GB",
        speed: "Çok hızlı",
    },
    "phi3:small": {
        name: "Phi-3 Small",
        description: "Daha iyi kalite, hala hızlı",
        ram: "3GB",
        speed: "Hızlı",
    },
};

const AI_CONFIG = {
    baseURL: process.env.OLLAMA_URL || "http://localhost:11434/api",
    model: process.env.OLLAMA_CHAT_MODEL || "llama3.2:3b", // Varsayılan olarak llama3.2:3b model
    defaultParams: {
        temperature: parseFloat(process.env.AI_TEMPERATURE) || 0.7,
        max_tokens: parseInt(process.env.AI_MAX_TOKENS) || 512,
    },
};

// Model bilgilerini getir
const getModelInfo = (modelName) => {
    return (
        LLAMA_MODELS[modelName] || {
            name: modelName,
            description: "Bilinmeyen model",
            ram: "Bilinmiyor",
            speed: "Bilinmiyor",
        }
    );
};

// Mevcut modelleri listele
const listAvailableModels = async () => {
    try {
        const response = await axios.get(`${AI_CONFIG.baseURL}/tags`);
        return response.data.models || [];
    } catch (error) {
        console.error("❌ Model listesi alınamadı:", error.message);
        return [];
    }
};

const queryAI = async (prompt) => {
    try {
        console.log(
            `🤖 Ollama API'ye istek gönderiliyor... (Model: ${AI_CONFIG.model})`
        );

        const response = await axios.post(
            `${AI_CONFIG.baseURL}/generate`,
            {
                model: AI_CONFIG.model,
                prompt: prompt,
                temperature: AI_CONFIG.defaultParams.temperature,
                max_tokens: AI_CONFIG.defaultParams.max_tokens,
                stream: false,
            },
            {
                headers: {
                    "Content-Type": "application/json",
                },
                timeout: 300000, // 5 dakika timeout
            }
        );

        console.log("✅ Ollama yanıtı alındı");

        return {
            choices: [
                {
                    text: response.data.response.trim(),
                },
            ],
        };
    } catch (error) {
        console.error("❌ Ollama API hatası:", error.message);

        if (error.code === "ECONNREFUSED") {
            throw new Error(
                "Ollama servisi çalışmıyor. Lütfen 'ollama serve' komutunu çalıştırın."
            );
        }

        if (error.response?.status === 404) {
            throw new Error(
                `Model '${AI_CONFIG.model}' bulunamadı. Lütfen 'ollama pull ${AI_CONFIG.model}' komutunu çalıştırın.`
            );
        }

        if (
            error.code === "ECONNABORTED" ||
            error.message.includes("timeout")
        ) {
            throw new Error(
                "Ollama modeli yanıt vermek için çok uzun sürdü. Lütfen daha sonra tekrar deneyin."
            );
        }

        throw new Error(`AI servis hatası: ${error.message}`);
    }
};

module.exports = {
    queryAI,
    AI_CONFIG,
    LLAMA_MODELS,
    getModelInfo,
    listAvailableModels,
};
