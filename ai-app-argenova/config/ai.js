const axios = require("axios");

const AI_CONFIG = {
    baseURL:
        process.env.AI_SERVICE_URL ||
        "",
    headers: {
        "Content-Type": "application/json",
    },
    defaultParams: {
        temperature: parseFloat(process.env.AI_TEMPERATURE) || 0.7,
        max_tokens: parseInt(process.env.AI_MAX_TOKENS) || 512,
    },
};

const generatePrompt = (userPrompt) => {
    return `Sen bir Türkçe asistanısın. Haftalık çalışma verilerini yorumla:\n${userPrompt}`;
};

const queryAI = async (prompt) => {
    try {
        const response = await axios.post(
            AI_CONFIG.baseURL,
            {
                prompt: generatePrompt(prompt),
                ...AI_CONFIG.defaultParams,
            },
            {
                headers: AI_CONFIG.headers,
            }
        );

        return response.data;
    } catch (error) {
        throw new Error(`AI servis hatası: ${error.message}`);
    }
};

module.exports = {
    queryAI,
    generatePrompt,
    AI_CONFIG, // Export for debugging
};
