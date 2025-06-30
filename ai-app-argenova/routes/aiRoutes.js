const express = require("express");
const router = express.Router();
const {
    processQuery,
    getHistory,
    populateVectorDatabase,
    populateTrainingExamples,
} = require("../controllers/aiController");

router.post("/query", processQuery);

router.get("/history", getHistory);

router.post("/populate-vectors", populateVectorDatabase);

router.post("/populate-training-examples", populateTrainingExamples);

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
