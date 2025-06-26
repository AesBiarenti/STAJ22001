const axios = require("axios");

const AI_CONFIG = {
    baseURL: "http://165.232.134.134:8000/v1/completions",
    headers: {
        "Content-Type": "application/json",
    },
    defaultParams: {
        temperature: 0.7,
        max_tokens: 512,
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
};
