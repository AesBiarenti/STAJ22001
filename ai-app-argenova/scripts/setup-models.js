const axios = require("axios");
const { exec } = require("child_process");
const { promisify } = require("util");

const execAsync = promisify(exec);

const OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434/api";
const CHAT_MODEL = process.env.OLLAMA_CHAT_MODEL || "llama3";
const EMBEDDING_MODEL = process.env.OLLAMA_EMBEDDING_MODEL || "all-minilm";

async function checkOllamaStatus() {
    try {
        const response = await axios.get(
            `${OLLAMA_URL.replace("/api", "")}/api/tags`
        );
        console.log("✅ Ollama servisi çalışıyor");
        return true;
    } catch (error) {
        console.error("❌ Ollama servisi çalışmıyor:", error.message);
        return false;
    }
}

async function getInstalledModels() {
    try {
        const response = await axios.get(
            `${OLLAMA_URL.replace("/api", "")}/api/tags`
        );
        return response.data.models || [];
    } catch (error) {
        console.error("❌ Model listesi alınamadı:", error.message);
        return [];
    }
}

async function pullModel(modelName) {
    try {
        console.log(`📥 ${modelName} modeli indiriliyor...`);

        // Ollama pull komutunu çalıştır
        const { stdout, stderr } = await execAsync(`ollama pull ${modelName}`);

        if (stderr) {
            console.error(`⚠️ ${modelName} indirme uyarısı:`, stderr);
        }

        console.log(`✅ ${modelName} modeli başarıyla indirildi`);
        return true;
    } catch (error) {
        console.error(`❌ ${modelName} modeli indirilemedi:`, error.message);
        return false;
    }
}

async function setupModels() {
    console.log("🚀 Ollama model kurulumu başlatılıyor...\n");

    // Ollama servisinin çalışıp çalışmadığını kontrol et
    const ollamaRunning = await checkOllamaStatus();
    if (!ollamaRunning) {
        console.log("💡 Ollama servisini başlatmak için:");
        console.log("   docker-compose up ollama");
        console.log("   veya");
        console.log("   ollama serve");
        return;
    }

    // Mevcut modelleri kontrol et
    const installedModels = await getInstalledModels();
    const installedModelNames = installedModels.map((model) => model.name);

    console.log(
        "📋 Mevcut modeller:",
        installedModelNames.join(", ") || "Hiçbiri"
    );
    console.log("");

    // Chat modelini kontrol et ve indir
    if (!installedModelNames.includes(CHAT_MODEL)) {
        console.log(`🔍 ${CHAT_MODEL} modeli bulunamadı, indiriliyor...`);
        await pullModel(CHAT_MODEL);
    } else {
        console.log(`✅ ${CHAT_MODEL} modeli zaten mevcut`);
    }

    console.log("");

    // Embedding modelini kontrol et ve indir
    if (!installedModelNames.includes(EMBEDDING_MODEL)) {
        console.log(`🔍 ${EMBEDDING_MODEL} modeli bulunamadı, indiriliyor...`);
        await pullModel(EMBEDDING_MODEL);
    } else {
        console.log(`✅ ${EMBEDDING_MODEL} modeli zaten mevcut`);
    }

    console.log("\n🎉 Model kurulumu tamamlandı!");
    console.log(`💬 Chat modeli: ${CHAT_MODEL}`);
    console.log(`🔤 Embedding modeli: ${EMBEDDING_MODEL}`);
}

// Script'i çalıştır
if (require.main === module) {
    setupModels().catch(console.error);
}

module.exports = { setupModels };
