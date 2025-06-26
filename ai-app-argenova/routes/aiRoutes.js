const express = require("express");
const router = express.Router();
const { processQuery, getHistory } = require("../controllers/aiController");

// AI sorgusu işleme
router.post("/query", processQuery);

// Geçmiş sorguları getirme
router.get("/history", getHistory);

module.exports = router;
