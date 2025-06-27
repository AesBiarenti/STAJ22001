const Log = require("../models/Log");
const { queryAI } = require("../config/ai");
const QdrantClient = require("../config/qdrant");
const EmbeddingService = require("../config/embedding");

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
        
        const embedding = await getEmbeddingService().getEmbedding(prompt);

        
        const similarVectors = await qdrant.searchSimilar(embedding, 3);

        
        return similarVectors
            .filter((item) => item.score > 0.7)
            .map((item) => item.payload);
    } catch (error) {
        console.error("Benzer sorgular bulunamadı:", error.message);
        return [];
    }
};


const createEnhancedPrompt = (originalPrompt, similarQueries) => {
    if (similarQueries.length === 0) {
        return `Sen bir Türkçe asistanısın. Haftalık çalışma verilerini yorumla:\n${originalPrompt}`;
    }

    const context = similarQueries
        .map((query, index) => {
            return `Örnek ${index + 1}:\nSoru: ${query.prompt}\nYanıt: ${
                query.response
            }\n`;
        })
        .join("\n");

    return `Sen bir Türkçe asistanısın. Aşağıdaki benzer örnekleri inceleyerek, verilen haftalık çalışma verilerini yorumla:

${context}

Şimdi bu örneklerdeki yaklaşımı kullanarak aşağıdaki verileri yorumla:

${originalPrompt}

Lütfen önceki örneklerdeki analiz kalitesini ve detay seviyesini koruyarak yanıt ver.`;
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

module.exports = {
    processQuery,
    getHistory,
    populateVectorDatabase,
};
