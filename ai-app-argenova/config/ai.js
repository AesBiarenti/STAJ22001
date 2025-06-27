const axios = require("axios");

const AI_CONFIG = {
    baseURL: "http://localhost:11434/api",
    model: "phi3:mini",
    defaultParams: {
        temperature: parseFloat(process.env.AI_TEMPERATURE) || 0.7,
        max_tokens: parseInt(process.env.AI_MAX_TOKENS) || 256,
    },
    useLocalFallback: false, // Yerel fallback kapalı
};

const generatePrompt = (userPrompt) => {
    return `Sen bir Türkçe asistanısın. Haftalık çalışma verilerini yorumla ve analiz et. Yanıtını Türkçe olarak ver:

${userPrompt}

Lütfen detaylı bir analiz yap ve öneriler sun.`;
};

const queryAI = async (prompt) => {
    try {
        console.log("🤖 Ollama API'ye istek gönderiliyor...");

        const response = await axios.post(
            `${AI_CONFIG.baseURL}/generate`,
            {
                model: AI_CONFIG.model,
                prompt: generatePrompt(prompt),
                temperature: AI_CONFIG.defaultParams.temperature,
                max_tokens: AI_CONFIG.defaultParams.max_tokens,
                stream: false,
            },
            {
                headers: {
                    "Content-Type": "application/json",
                },
                timeout: 120000, // 2 dakika timeout
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

        // Hata durumunda uygun mesaj döndür
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
    generatePrompt,
    AI_CONFIG,
};
