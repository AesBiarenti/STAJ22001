// Load environment variables first
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");

// Config ve middleware importları
const connectDB = require("./config/database");
const errorHandler = require("./middleware/errorHandler");
const requestLogger = require("./middleware/requestLogger");

// Route importları
const aiRoutes = require("./routes/aiRoutes");

const app = express();
const PORT = process.env.PORT || 3000;

// Veritabanı bağlantısı
connectDB();

// Middleware'ler
app.use(cors());
app.use(bodyParser.json());
app.use(express.static("public"));
app.use(requestLogger);

// API Routes
app.use("/api", aiRoutes);

// Ana sayfa route'u
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

// 404 handler - wildcard pattern'ini düzeltiyorum
app.use((req, res) => {
    res.status(404).json({
        error: "Endpoint bulunamadı.",
        path: req.originalUrl,
    });
});

// Error handling middleware (en sonda olmalı)
app.use(errorHandler);

// Sunucuyu başlat
app.listen(PORT, () => {
    console.log(`🚀 Sunucu http://localhost:${PORT} adresinde çalışıyor`);
    console.log(`📊 API endpoint'leri: http://localhost:${PORT}/api`);
    console.log(`🌐 Web arayüzü: http://localhost:${PORT}`);
    console.log(`🔧 Environment: ${process.env.NODE_ENV || "development"}`);
});

// Graceful shutdown
process.on("SIGTERM", () => {
    console.log("SIGTERM sinyali alındı, sunucu kapatılıyor...");
    process.exit(0);
});

process.on("SIGINT", () => {
    console.log("SIGINT sinyali alındı, sunucu kapatılıyor...");
    process.exit(0);
});
