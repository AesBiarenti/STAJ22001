require("dotenv").config();

const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");

const connectDB = require("./config/database");
const errorHandler = require("./middleware/errorHandler");
const requestLogger = require("./middleware/requestLogger");

const aiRoutes = require("./routes/aiRoutes");

const app = express();
const PORT = process.env.PORT || 3000;

connectDB();

app.use(cors());
app.use(bodyParser.json());
app.use(express.static("public"));
app.use(requestLogger);

app.use("/api", aiRoutes);

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.use((req, res) => {
    res.status(404).json({
        error: "Endpoint bulunamadı.",
        path: req.originalUrl,
    });
});

app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`🚀 Sunucu http://localhost:${PORT} adresinde çalışıyor`);
    console.log(`📊 API endpoint'leri: http://localhost:${PORT}/api`);
    console.log(`🌐 Web arayüzü: http://localhost:${PORT}`);
    console.log(`🔧 Environment: ${process.env.NODE_ENV || "development"}`);
});

process.on("SIGTERM", () => {
    console.log("SIGTERM sinyali alındı, sunucu kapatılıyor...");
    process.exit(0);
});

process.on("SIGINT", () => {
    console.log("SIGINT sinyali alındı, sunucu kapatılıyor...");
    process.exit(0);
});
