const express = require("express");
const router = express.Router();
const { processQuery, getHistory } = require("../controllers/aiController");

router.post("/query", processQuery);

router.get("/history", getHistory);

module.exports = router;
