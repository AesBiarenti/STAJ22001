const express = require("express");
const router = express.Router();
const {
    processQuery,
    getHistory,
    populateVectorDatabase,
    populateTrainingExamples,
    setFeedback,
    markAsTrainingExample,
    getTrainingExamples,
    simpleChat,
    simpleEmbedding,
    streamChat,
} = require("../controllers/aiController");
const {
    LLAMA_MODELS,
    getModelInfo,
    listAvailableModels,
} = require("../config/ai");

// Health check endpoint
router.get("/health", async (req, res) => {
    try {
        // Temel servis durumlarını kontrol et
        const healthStatus = {
            status: "healthy",
            timestamp: new Date().toISOString(),
            services: {
                database: "unknown",
                qdrant: "unknown",
                ollama: "unknown",
            },
        };

        // MongoDB bağlantısını kontrol et
        try {
            const mongoose = require("mongoose");
            if (mongoose.connection.readyState === 1) {
                healthStatus.services.database = "healthy";
            } else {
                healthStatus.services.database = "unhealthy";
                healthStatus.status = "degraded";
            }
        } catch (error) {
            healthStatus.services.database = "unhealthy";
            healthStatus.status = "degraded";
        }

        // Qdrant bağlantısını kontrol et
        try {
            const QdrantClient = require("../config/qdrant");
            const qdrant = new QdrantClient();
            await qdrant.getCollectionInfo();
            healthStatus.services.qdrant = "healthy";
        } catch (error) {
            healthStatus.services.qdrant = "unhealthy";
            healthStatus.status = "degraded";
        }

        // Ollama bağlantısını kontrol et
        try {
            const axios = require("axios");
            const ollamaUrl =
                process.env.OLLAMA_URL || "http://localhost:11434/api";
            await axios.get(`${ollamaUrl.replace("/api", "")}/api/tags`, {
                timeout: 5000,
            });
            healthStatus.services.ollama = "healthy";
        } catch (error) {
            healthStatus.services.ollama = "unhealthy";
            healthStatus.status = "degraded";
        }

        const statusCode = healthStatus.status === "healthy" ? 200 : 503;
        res.status(statusCode).json(healthStatus);
    } catch (error) {
        res.status(503).json({
            status: "unhealthy",
            timestamp: new Date().toISOString(),
            error: error.message,
        });
    }
});

router.post("/query", processQuery);

// Mobil uygulamadaki gibi basit endpoint'ler
router.post("/chat", simpleChat);
router.post("/embedding", simpleEmbedding);
router.post("/chat/stream", streamChat);

router.get("/history", getHistory);

router.post("/populate-vectors", populateVectorDatabase);

router.post("/populate-training-examples", populateTrainingExamples);

router.post("/feedback", setFeedback);

router.post("/mark-training", markAsTrainingExample);
router.get("/training-examples", getTrainingExamples);

// Model yönetimi endpoint'leri
router.get("/models", async (req, res) => {
    try {
        const availableModels = await listAvailableModels();
        res.json({
            success: true,
            availableModels,
            supportedModels: LLAMA_MODELS,
        });
    } catch (error) {
        res.status(500).json({
            error: "Model listesi alınamadı.",
            details: error.message,
        });
    }
});

router.get("/models/info/:modelName", async (req, res) => {
    try {
        const { modelName } = req.params;
        const modelInfo = getModelInfo(modelName);
        res.json({
            success: true,
            modelInfo,
        });
    } catch (error) {
        res.status(500).json({
            error: "Model bilgisi alınamadı.",
            details: error.message,
        });
    }
});

router.get("/vectors/status", async (req, res) => {
    try {
        const QdrantClient = require("../config/qdrant");
        const qdrant = new QdrantClient();

        const info = await qdrant.getCollectionInfo();
        res.json({
            success: true,
            collection: info,
        });
    } catch (error) {
        res.status(500).json({
            error: "Vektör veritabanı durumu alınamadı.",
            details: error.message,
        });
    }
});

router.get("/vectors/list", async (req, res) => {
    try {
        const QdrantClient = require("../config/qdrant");
        const qdrant = new QdrantClient();

        // Tüm vektörleri doğrudan çek
        const results = await qdrant.getAllVectors(100);

        res.json({
            success: true,
            vectors: results,
            count: results.length,
        });
    } catch (error) {
        res.status(500).json({
            error: "Vektörler listelenemedi.",
            details: error.message,
        });
    }
});

router.delete("/vectors/clear", async (req, res) => {
    try {
        const QdrantClient = require("../config/qdrant");
        const qdrant = new QdrantClient();

        await qdrant.clearCollection();
        res.json({
            success: true,
            message: "Vektör veritabanı temizlendi",
        });
    } catch (error) {
        res.status(500).json({
            error: "Vektör veritabanı temizlenemedi.",
            details: error.message,
        });
    }
});

module.exports = router;
