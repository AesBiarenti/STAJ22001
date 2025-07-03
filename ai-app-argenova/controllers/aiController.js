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

// Basit soru ön işleme fonksiyonu
const preprocessQuery = (query) => {
    let cleaned = query.toLowerCase();
    cleaned = cleaned.replace(/i̇/g, "i");
    // Sadece harf, rakam, Türkçe karakter ve boşluk bırak
    cleaned = cleaned.replace(/[^a-zA-Z0-9çğıöşüÇĞİÖŞÜ\s]/g, "");
    cleaned = cleaned.replace(/\s+/g, " ").trim();
    cleaned = cleaned.replace(/\bcalısma\b/g, "çalışma");
    return cleaned;
};

// Basit özetleyici fonksiyon (uzun context'i kısaltır)
const summarizeContextSimple = (similarQueries, maxLength = 500) => {
    let context = similarQueries
        .map((q, i) => `Soru: ${q.prompt}\nYanıt: ${q.response}`)
        .join("\n\n");
    if (context.length > maxLength) {
        context = context.substring(0, maxLength) + " ...";
    }
    return context;
};

// LLM tabanlı özetleyici fonksiyon
const summarizeContextLLM = async (similarQueries) => {
    if (!similarQueries || similarQueries.length === 0) return "";
    const context = similarQueries
        .map((q, i) => `Soru: ${q.prompt}\nYanıt: ${q.response}`)
        .join("\n\n");
    const prompt = `Aşağıda geçmişteki benzer soru-cevaplar var. Bunları 3-4 cümleyle özetle, en önemli noktaları ve örnek analiz yaklaşımlarını vurgula.\n\n${context}`;
    try {
        const aiResponse = await queryAI(prompt);
        return aiResponse.choices?.[0]?.text?.trim() || context;
    } catch (e) {
        // Hata olursa basit özetleyiciye düş
        return summarizeContextSimple(similarQueries);
    }
};

const processQuery = async (req, res) => {
    let { prompt, logId, role, style, format, length } = req.body;

    // Rol, stil, format ve uzunluk için varsayılanlar
    const selectedRole = role || "AI asistanı";
    const selectedStyle = style || "detaylı ve anlaşılır";
    const selectedFormat = format || "zengin";
    const selectedLength = length || "detaylı";

    // 1. Soru ön işleme (hem orijinal hem temizlenmişi sakla)
    const cleanedPrompt = preprocessQuery(prompt);

    if (!cleanedPrompt || cleanedPrompt.trim().length === 0) {
        return res.status(400).json({
            error: "Prompt alanı boş olamaz.",
        });
    }

    const start = Date.now();

    try {
        // 2. Benzer sorguları bul (temizlenmiş prompt ile)
        const similarQueries = await findSimilarQueries(cleanedPrompt);

        // 3. Sonuçları özetle (önce LLM, hata olursa basit)
        let summarizedContext = await summarizeContextLLM(similarQueries);

        // 4. Gelişmiş prompt oluştur (rol, stil, format ve uzunluk ile)
        const enhancedPrompt = createEnhancedPrompt(
            cleanedPrompt,
            summarizedContext,
            selectedRole,
            selectedStyle,
            selectedFormat,
            selectedLength
        );

        // 5. LLM'e gönder, yanıtı al
        const aiResponse = await queryAI(enhancedPrompt);
        const end = Date.now();
        const duration = (end - start) / 1000;
        const reply = aiResponse.choices?.[0]?.text || "Yanıt alınamadı.";

        // 6. Yanıt sonrası otomatik değerlendirme (self-check)
        const selfCheckPrompt = `\nAşağıda bir kullanıcı sorusu ve AI yanıtı var.\nYanıtı değerlendir: Açık mı, eksik mi, geliştirilmeli mi?\nKısa bir özetle ve gerekirse öneri ver.\n\nSoru: ${prompt}\nYanıt: ${reply}\n`;
        let selfCheck = "";
        try {
            const selfCheckResponse = await queryAI(selfCheckPrompt);
            selfCheck = selfCheckResponse.choices?.[0]?.text?.trim() || "";
        } catch (e) {
            selfCheck = "Otomatik değerlendirme yapılamadı.";
        }

        let log;
        if (logId) {
            // Var olan sohbete yeni mesaj ekle
            log = await Log.findById(logId);
            if (!log) {
                return res.status(404).json({ error: "Sohbet bulunamadı." });
            }
            log.messages.push(
                { sender: "user", content: prompt, createdAt: new Date() },
                { sender: "bot", content: reply, createdAt: new Date() }
            );
            log.duration += duration;
            await log.save();
        } else {
            // Yeni sohbet başlat
            log = new Log({
                messages: [
                    { sender: "user", content: prompt, createdAt: new Date() },
                    { sender: "bot", content: reply, createdAt: new Date() },
                ],
                duration,
            });
            await log.save();
        }

        await addToVectorDatabase(log._id.toString(), prompt, reply);

        res.json({
            reply,
            duration,
            success: true,
            logId: log._id,
            similarQueries: similarQueries.length,
            similarExamples: similarQueries.map((q) => ({
                prompt: q.prompt,
                response: q.response,
            })),
            summarizedContext:
                summarizedContext.length > 500
                    ? summarizedContext.substring(0, 500) + "..."
                    : summarizedContext,
            enhancedPrompt:
                enhancedPrompt.length > 500
                    ? enhancedPrompt.substring(0, 500) + "..."
                    : enhancedPrompt,
            selfCheck,
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
        // 1. Vektör araması
        const embedding = await getEmbeddingService().getEmbedding(prompt);
        const similarVectors = await qdrant.searchSimilar(embedding, 3);

        let dbResults = similarVectors
            .filter((item) => item.score > 0.7)
            .map((item) => item.payload);

        // 2. Yetersizse, anahtar kelime araması (MongoDB)
        if (dbResults.length < 2) {
            const thirtyDaysAgo = new Date(
                Date.now() - 30 * 24 * 60 * 60 * 1000
            );
            const keywordResults = await Log.find({
                "messages.content": {
                    $regex: prompt.split(" ").slice(0, 3).join("|"),
                    $options: "i",
                },
                createdAt: { $gte: thirtyDaysAgo },
                category: "weekly_work_hours",
            })
                .sort({ createdAt: -1 })
                .limit(3)
                .lean();

            // Her kayıttan ilk user-bot mesaj çiftini al
            const keywordPairs = keywordResults
                .map((log) => {
                    const userMsg = log.messages.find(
                        (m) => m.sender === "user"
                    );
                    const botMsg = log.messages.find((m) => m.sender === "bot");
                    return userMsg && botMsg
                        ? { prompt: userMsg.content, response: botMsg.content }
                        : null;
                })
                .filter(Boolean);

            // Tekrarları önle
            dbResults = [
                ...dbResults,
                ...keywordPairs.filter(
                    (pair) => !dbResults.some((d) => d.prompt === pair.prompt)
                ),
            ];
        }

        // 3. Hala yetersizse, eğitim örnekleriyle tamamla
        if (dbResults.length < 2) {
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

const createEnhancedPrompt = (
    originalPrompt,
    context,
    role,
    style,
    format,
    length
) => {
    let roleText = `Sen bir ${role} olarak yanıt ver.`;
    let styleText = `Yanıtını ${style} şekilde hazırla.`;
    let formatText = "";
    if (format === "madde")
        formatText = "Yanıtı madde madde ve kısa paragraflarla ver.";
    else if (format === "tablo")
        formatText = "Yanıtı tablo halinde ve gerekirse madde madde ver.";
    else if (format === "kod")
        formatText = "Yanıtı kod bloğu ve açıklamalarla ver.";
    else
        formatText =
            "Yanıtı zengin formatta, başlıklar, emoji ve madde işaretleriyle ver.";
    let lengthText = "";
    if (length === "kısa") lengthText = "Yanıtı kısa ve özet şekilde hazırla.";
    else lengthText = "Yanıtı detaylı ve açıklayıcı şekilde hazırla.";
    if (!context || context.length === 0) {
        return `${roleText}\n${styleText}\n${formatText}\n${lengthText}\n\nAşağıdaki haftalık çalışma verilerini analiz et ve Türkçe olarak yanıt ver.\n\nÇalışma verileri:\n${originalPrompt}\n\nLütfen şu kriterlere göre analiz yap:\n1. Toplam çalışma süresini hesapla\n2. Günlük ortalama çalışma süresini belirle\n3. Güçlü yönleri ve gelişim alanlarını tespit et\n4. Sağlık ve verimlilik açısından değerlendir\n5. Somut öneriler sun\n\nYanıtını Türkçe olarak, emoji ve formatlamayı kullanarak ver.`;
    }
    return `${roleText}\n${styleText}\n${formatText}\n${lengthText}\n\nAşağıdaki benzer örnekleri ve özetini inceleyerek, verilen haftalık çalışma verilerini analiz et ve Türkçe olarak yanıt ver.\n\n${context}\n\n🎯 Şimdi bu örneklerdeki yaklaşımı, analiz kalitesini ve detay seviyesini kullanarak aşağıdaki verileri yorumla:\n\nÇalışma verileri:\n${originalPrompt}\n\n📊 Lütfen şu kriterlere göre analiz yap:\n1. Toplam çalışma süresini hesapla\n2. Günlük ortalama çalışma süresini belirle\n3. Güçlü yönleri ve gelişim alanlarını tespit et\n4. Sağlık ve verimlilik açısından değerlendir\n5. Somut öneriler sun\n\n💡 Önceki örneklerdeki analiz kalitesini, detay seviyesini ve Türkçe dil kullanımını koruyarak yanıt ver. Emoji ve formatlamayı kullan.`;
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
            category: "weekly_work_hours",
            type: "user_query",
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

const setFeedback = async (req, res) => {
    const { logId, feedback } = req.body;
    if (!logId || !["like", "dislike", "improve"].includes(feedback)) {
        return res.status(400).json({ error: "Geçersiz parametre" });
    }
    try {
        const log = await Log.findById(logId);
        if (!log) return res.status(404).json({ error: "Kayıt bulunamadı" });
        log.feedback = feedback;
        await log.save();
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: "Feedback kaydedilemedi" });
    }
};

const markAsTrainingExample = async (req, res) => {
    const { logId } = req.body;
    if (!logId) return res.status(400).json({ error: "logId gerekli" });
    try {
        const log = await Log.findById(logId);
        if (!log) return res.status(404).json({ error: "Kayıt bulunamadı" });
        log.isTrainingExample = true;
        await log.save();
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: "İşaretleme başarısız" });
    }
};

const getTrainingExamples = async (req, res) => {
    try {
        const examples = await Log.find({ isTrainingExample: true }).sort({
            createdAt: -1,
        });
        res.json({ examples });
    } catch (e) {
        res.status(500).json({ error: "Eğitim örnekleri alınamadı" });
    }
};

module.exports = {
    processQuery,
    getHistory,
    populateVectorDatabase,
    populateTrainingExamples,
    setFeedback,
    markAsTrainingExample,
    getTrainingExamples,
};
