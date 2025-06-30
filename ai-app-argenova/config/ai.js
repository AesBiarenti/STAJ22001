const axios = require("axios");

const AI_CONFIG = {
    baseURL: "http://localhost:11434/api",
    model: "phi3:mini", // En küçük ve hızlı model
    defaultParams: {
        temperature: parseFloat(process.env.AI_TEMPERATURE) || 0.7,
        max_tokens: parseInt(process.env.AI_MAX_TOKENS) || 512,
    },
};

const queryAI = async (prompt) => {
    try {
        console.log("🤖 Ollama API'ye istek gönderiliyor...");

        const response = await axios.post(
            `${AI_CONFIG.baseURL}/generate`,
            {
                model: AI_CONFIG.model,
                prompt: prompt, // Direkt olarak gelen prompt'u kullan
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
};
