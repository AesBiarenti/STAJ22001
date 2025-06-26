const Log = require("../models/Log");
const { queryAI } = require("../config/ai");

const processQuery = async (req, res) => {
    const { prompt } = req.body;

    if (!prompt || prompt.trim().length === 0) {
        return res.status(400).json({
            error: "Prompt alanı boş olamaz.",
        });
    }

    const start = Date.now();

    try {
        const aiResponse = await queryAI(prompt);
        const end = Date.now();
        const duration = (end - start) / 1000;

        const reply = aiResponse.choices?.[0]?.text || "Yanıt alınamadı.";

        // burada log kaydını oluşturuluyor
        const log = new Log({
            prompt: prompt.trim(),
            response: reply,
            duration,
        });
        await log.save();

        res.json({
            reply,
            duration,
            success: true,
        });
    } catch (error) {
        console.error("AI işleme hatası:", error.message);
        res.status(500).json({
            error: "AI yanıtı alınamadı.",
            details: error.message,
        });
    }
};

const getHistory = async (req, res) => {
    try {
        const { limit = 10, page = 1 } = req.query;
        const skip = (page - 1) * limit;

        const logs = await Log.find()
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Log.countDocuments();

        res.json({
            logs,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit),
                totalItems: total,
                itemsPerPage: parseInt(limit),
            },
        });
    } catch (error) {
        console.error("Geçmiş sorgulama hatası:", error);
        res.status(500).json({
            error: "Geçmiş sorgular yüklenemedi.",
            details: error.message,
        });
    }
};

module.exports = {
    processQuery,
    getHistory,
};
