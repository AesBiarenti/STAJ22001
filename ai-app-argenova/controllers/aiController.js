const Log = require("../models/Log");
const { queryAI } = require("../config/ai");
const QdrantClient = require("../config/qdrant");
const EmbeddingService = require("../config/embedding");
const { TRAINING_EXAMPLES } = require("../config/trainingData");

const qdrant = new QdrantClient();
let embeddingService = null;

const getEmbeddingService = () => {
    if (!embeddingService) {
        embeddingService = new EmbeddingService();
    }
    return embeddingService;
};

const processQuery = async (req, res) => {
    const { prompt } = req.body;

    if (!prompt || prompt.trim().length === 0) {
        return res.status(400).json({
            error: "Prompt alanı boş olamaz.",
        });
    }

    const start = Date.now();

    try {
        const similarQueries = await findSimilarQueries(prompt);

        const enhancedPrompt = createEnhancedPrompt(prompt, similarQueries);

        const aiResponse = await queryAI(enhancedPrompt);
        const end = Date.now();
        const duration = (end - start) / 1000;

        const reply = aiResponse.choices?.[0]?.text || "Yanıt alınamadı.";

        const log = new Log({
            prompt: prompt.trim(),
            response: reply,
            duration,
        });
        await log.save();

        await addToVectorDatabase(log._id.toString(), prompt, reply);

        res.json({
            reply,
            duration,
            success: true,
            similarQueries: similarQueries.length,
            enhancedPrompt:
                enhancedPrompt.length > 500
                    ? enhancedPrompt.substring(0, 500) + "..."
                    : enhancedPrompt,
        });
    } catch (error) {
        console.error("AI işleme hatası:", error.message);
        res.status(500).json({
            error: "AI yanıtı alınamadı.",
            details: error.message,
        });
    }
};

const findSimilarQueries = async (prompt) => {
    try {
        // Önce vektör veritabanından benzer sorguları bul
        const embedding = await getEmbeddingService().getEmbedding(prompt);
        const similarVectors = await qdrant.searchSimilar(embedding, 3);

        const dbResults = similarVectors
            .filter((item) => item.score > 0.7)
            .map((item) => item.payload);

        // Eğer vektör veritabanında yeterli sonuç yoksa, önceden eğitilmiş örnekleri kullan
        if (dbResults.length < 2) {
            console.log("📚 Önceden eğitilmiş örnekler kullanılıyor...");
            const trainingExamples = findBestTrainingExamples(prompt);
            return [...dbResults, ...trainingExamples];
        }

        return dbResults;
    } catch (error) {
        console.error("Benzer sorgular bulunamadı:", error.message);
        // Hata durumunda önceden eğitilmiş örnekleri kullan
        return findBestTrainingExamples(prompt);
    }
};

// Önceden eğitilmiş örneklerden en uygun olanları seç
const findBestTrainingExamples = (prompt) => {
    try {
        // Basit keyword matching ile en uygun örnekleri seç
        const promptLower = prompt.toLowerCase();

        // Haftalık çalışma saatleri ile ilgili anahtar kelimeler
        const workHourKeywords = [
            "haftalık",
            "çalışma",
            "saat",
            "pazartesi",
            "salı",
            "çarşamba",
            "perşembe",
            "cuma",
            "cumartesi",
            "pazar",
            "mesai",
            "öğle arası",
            "08:",
            "09:",
            "17:",
            "18:",
            "19:",
            "20:",
        ];

        // Kullanıcının sorusunda bu kelimelerden kaç tanesi var
        const keywordMatches = workHourKeywords.filter((keyword) =>
            promptLower.includes(keyword)
        ).length;

        // Eğer haftalık çalışma saatleri ile ilgili bir soru ise, tüm örnekleri kullan
        if (keywordMatches >= 3) {
            console.log(
                "🎯 Haftalık çalışma analizi için önceden eğitilmiş örnekler kullanılıyor"
            );
            return TRAINING_EXAMPLES.slice(0, 3); // En iyi 3 örneği kullan
        }

        // Genel sorular için 1-2 örnek kullan
        return TRAINING_EXAMPLES.slice(0, 2);
    } catch (error) {
        console.error("Önceden eğitilmiş örnek seçimi hatası:", error.message);
        return TRAINING_EXAMPLES.slice(0, 2); // Varsayılan olarak 2 örnek
    }
};

const createEnhancedPrompt = (originalPrompt, similarQueries) => {
    if (similarQueries.length === 0) {
        return `Sen bir Türkçe AI asistanısın. Aşağıdaki haftalık çalışma verilerini analiz et ve Türkçe olarak yanıt ver.

Çalışma verileri:
${originalPrompt}

Lütfen şu kriterlere göre analiz yap:
1. Toplam çalışma süresini hesapla
2. Günlük ortalama çalışma süresini belirle
3. Güçlü yönleri ve gelişim alanlarını tespit et
4. Sağlık ve verimlilik açısından değerlendir
5. Somut öneriler sun

Yanıtını Türkçe olarak, emoji ve formatlamayı kullanarak ver.`;
    }

    const context = similarQueries
        .map((query, index) => {
            return `📋 Örnek ${index + 1}:
❓ Soru: ${query.prompt}
💡 Yanıt: ${query.response}`;
        })
        .join("\n\n");

    return `Sen bir Türkçe AI asistanısın. Aşağıdaki benzer örnekleri inceleyerek, verilen haftalık çalışma verilerini analiz et ve Türkçe olarak yanıt ver.

${context}

🎯 Şimdi bu örneklerdeki yaklaşımı, analiz kalitesini ve detay seviyesini kullanarak aşağıdaki verileri yorumla:

Çalışma verileri:
${originalPrompt}

📊 Lütfen şu kriterlere göre analiz yap:
1. Toplam çalışma süresini hesapla
2. Günlük ortalama çalışma süresini belirle
3. Güçlü yönleri ve gelişim alanlarını tespit et
4. Sağlık ve verimlilik açısından değerlendir
5. Somut öneriler sun

💡 Önceki örneklerdeki analiz kalitesini, detay seviyesini ve Türkçe dil kullanımını koruyarak yanıt ver. Emoji ve formatlamayı kullan.`;
};

const addToVectorDatabase = async (id, prompt, response) => {
    try {
        const combinedText = `${prompt}\n\n${response}`;

        const embedding = await getEmbeddingService().getEmbedding(
            combinedText
        );

        await qdrant.addVector(id, embedding, {
            prompt: prompt,
            response: response,
            timestamp: new Date().toISOString(),
        });

        console.log("✅ Vektör veritabanına eklendi:", id);
    } catch (error) {
        console.error("❌ Vektör veritabanına eklenemedi:", error.message);
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

const populateVectorDatabase = async (req, res) => {
    try {
        const logs = await Log.find().sort({ createdAt: -1 }).limit(100);

        let addedCount = 0;
        for (const log of logs) {
            try {
                const combinedText = `${log.prompt}\n\n${log.response}`;
                const embedding = await getEmbeddingService().getEmbedding(
                    combinedText
                );

                await qdrant.addVector(log._id.toString(), embedding, {
                    prompt: log.prompt,
                    response: log.response,
                    timestamp: log.createdAt.toISOString(),
                });

                addedCount++;
            } catch (error) {
                console.error(
                    `Log ${log._id} vektör veritabanına eklenemedi:`,
                    error.message
                );
            }
        }

        res.json({
            success: true,
            message: `${addedCount} log vektör veritabanına eklendi`,
            totalProcessed: logs.length,
        });
    } catch (error) {
        console.error("Vektör veritabanı doldurma hatası:", error);
        res.status(500).json({
            error: "Vektör veritabanı doldurulamadı.",
            details: error.message,
        });
    }
};

const populateTrainingExamples = async (req, res) => {
    try {
        console.log(
            "📚 Önceden eğitilmiş örnekler vektör veritabanına ekleniyor..."
        );

        let addedCount = 0;
        for (const example of TRAINING_EXAMPLES) {
            try {
                const combinedText = `${example.prompt}\n\n${example.response}`;
                const embedding = await getEmbeddingService().getEmbedding(
                    combinedText
                );

                // Benzersiz ID oluştur
                const trainingId = `training_${Date.now()}_${addedCount}`;

                await qdrant.addVector(trainingId, embedding, {
                    prompt: example.prompt,
                    response: example.response,
                    timestamp: new Date().toISOString(),
                    type: "training_example",
                    category: "weekly_work_hours",
                });

                addedCount++;
                console.log(
                    `✅ Eğitim örneği eklendi: ${addedCount}/${TRAINING_EXAMPLES.length}`
                );
            } catch (error) {
                console.error(`❌ Eğitim örneği eklenemedi:`, error.message);
            }
        }

        res.json({
            success: true,
            message: `${addedCount} önceden eğitilmiş örnek vektör veritabanına eklendi`,
            totalExamples: TRAINING_EXAMPLES.length,
            addedCount: addedCount,
        });
    } catch (error) {
        console.error("Eğitim örnekleri ekleme hatası:", error);
        res.status(500).json({
            error: "Eğitim örnekleri eklenemedi.",
            details: error.message,
        });
    }
};

module.exports = {
    processQuery,
    getHistory,
    populateVectorDatabase,
    populateTrainingExamples,
};
