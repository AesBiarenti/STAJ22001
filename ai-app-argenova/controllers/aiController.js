const Log = require("../models/Log");
const { queryAI } = require("../config/ai");
const QdrantClient = require("../config/qdrant");
const EmbeddingService = require("../config/embedding");
const { TRAINING_EXAMPLES } = require("../config/trainingData");
const express = require("express");
const multer = require("multer");
const XLSX = require("xlsx");
const axios = require("axios");
const path = require("path");
const fs = require("fs");

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
    if (!query || typeof query !== "string") {
        return "";
    }
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
            "📚 Qdrant'taki güncel veriler eğitim örneği olarak tekrar yükleniyor..."
        );
        const QdrantClient = require("../config/qdrant");
        const qdrant = new QdrantClient();
        const EmbeddingService = require("../config/embedding");
        const embeddingService = new EmbeddingService();

        // Qdrant'taki mevcut vektörleri çek
        const vectors = await qdrant.getAllVectors(1000);
        let addedCount = 0;
        for (const vector of vectors) {
            try {
                // Eğitim örneği prompt ve response'u oluştur
                const prompt = `Çalışan: ${vector.payload.isim}\nTarih: ${vector.payload.tarih_araligi}`;
                const response = `Toplam mesai: ${
                    vector.payload.toplam_mesai
                }, Günlük mesai: ${JSON.stringify(
                    vector.payload.gunluk_mesai
                )}`;
                const combinedText = `${prompt}\n${response}`;
                const embedding = await embeddingService.getEmbedding(
                    combinedText
                );
                // Benzersiz ID oluştur
                const trainingId = `training_${
                    vector.payload.isim
                }_${Date.now()}_${addedCount}`;
                await qdrant.addVector(trainingId, embedding, {
                    prompt,
                    response,
                    timestamp: new Date().toISOString(),
                    type: "training_example",
                    category: "employee_data",
                });
                addedCount++;
            } catch (error) {
                console.error(`❌ Eğitim örneği eklenemedi:`, error.message);
            }
        }
        res.json({
            success: true,
            message: `${addedCount} güncel çalışan verisi eğitim örneği olarak yüklendi`,
            totalExamples: vectors.length,
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
        const QdrantClient = require("../config/qdrant");
        const qdrant = new QdrantClient();
        // Qdrant'tan tüm vektörleri çek
        const vectors = await qdrant.getAllVectors(1000);
        // Sadece eğitim örneklerini filtrele
        const examples = vectors.filter(
            (v) => v.payload && v.payload.type === "training_example"
        );
        res.json({ examples });
    } catch (e) {
        res.status(500).json({ error: "Eğitim örnekleri alınamadı" });
    }
};

// Mobil uygulamadaki gibi basit chat endpoint'i
const simpleChat = async (req, res) => {
    let { question, prompt } = req.body;

    // Hem question hem de prompt parametrelerini kabul et
    const userQuestion = question || prompt;

    if (!userQuestion || typeof userQuestion !== "string") {
        return res.status(400).json({
            answer: "Soru alanı boş olamaz.",
            success: false,
            error: "EMPTY_QUESTION",
        });
    }

    const start = Date.now();

    try {
        // Çalışan verileri ile ilgili soru mu kontrol et
        const employeeKeywords = [
            "çalışan",
            "personel",
            "mesai",
            "işçi",
            "memur",
            "görevli",
            "eleman",
        ];
        const isEmployeeQuestion = employeeKeywords.some((keyword) =>
            userQuestion.toLowerCase().includes(keyword)
        );

        // Qdrant'dan çalışan verilerini al
        const QdrantClient = require("../config/qdrant");
        const qdrant = new QdrantClient();
        const vectors = await qdrant.getAllVectors(100);

        // Çalışan isimlerini de kontrol et
        let isEmployeeNameQuestion = false;
        if (vectors.length > 0) {
            const employeeNames = vectors.map((v) =>
                v.payload.isim.toLowerCase()
            );
            console.log("Çalışan isimleri:", employeeNames);
            console.log("Soru:", userQuestion.toLowerCase());
            isEmployeeNameQuestion = employeeNames.some((name) =>
                userQuestion.toLowerCase().includes(name)
            );
            console.log("Çalışan ismi bulundu mu:", isEmployeeNameQuestion);
        }

        let finalPrompt = "Lütfen bundan sonra Türkçe cevap ver.\n";

        if (isEmployeeQuestion || isEmployeeNameQuestion) {
            if (vectors.length > 0) {
                // Çalışan verilerini daha kısa formatla
                const employeeData = vectors.map((v) => {
                    const data = {
                        isim: v.payload.isim,
                        toplam_mesai: 0,
                        mesai_gun_sayisi: 0,
                        tarih_araliklari: [],
                        gunluk_mesai_saatleri: [],
                    };

                    // Toplam mesai hesapla
                    if (
                        v.payload.toplam_mesai &&
                        Array.isArray(v.payload.toplam_mesai)
                    ) {
                        data.toplam_mesai = v.payload.toplam_mesai.reduce(
                            (sum, saat) => sum + (parseInt(saat) || 0),
                            0
                        );
                        data.mesai_gun_sayisi = v.payload.toplam_mesai.length;
                        data.gunluk_mesai_saatleri = v.payload.toplam_mesai; // Her günün mesai saati
                    }

                    // Tarih aralıkları
                    if (
                        v.payload.tarih_araligi &&
                        Array.isArray(v.payload.tarih_araligi)
                    ) {
                        data.tarih_araliklari = v.payload.tarih_araligi.slice(
                            0,
                            3
                        ); // İlk 3 tarih
                    }

                    return data;
                });

                finalPrompt += `Çalışan verileri hakkında soru soruluyor:

${JSON.stringify(employeeData, null, 2)}

Soru: ${userQuestion}

ÖNEMLİ: Bu bir çalışan mesai raporu sorusudur. Sadece yukarıdaki çalışan verilerini kullanarak yanıt ver. 
Kutsal Kitap, mitoloji veya başka konulardan bahsetme. Sadece çalışan mesai verilerine odaklan.

Her çalışan için:
- toplam_mesai: Toplam mesai saati
- mesai_gun_sayisi: Mesai yapılan gün sayısı  
- gunluk_mesai_saatleri: Her günün mesai saati (array) - Bu array'deki en büyük değer en çok mesai yapılan gün
- tarih_araliklari: Tarih aralıkları

Kısa ve net yanıt ver. Sadece mesai verilerini kullan.`;
            } else {
                finalPrompt += `${userQuestion}\n\nNot: Henüz çalışan verisi yüklenmemiş.`;
            }
        } else {
            finalPrompt += userQuestion;
        }

        const aiResponse = await queryAI(finalPrompt);
        const end = Date.now();
        const duration = (end - start) / 1000;
        const answer = aiResponse.choices?.[0]?.text || "Yanıt alınamadı.";

        // Basit log kaydı
        const log = new Log({
            messages: [
                {
                    sender: "user",
                    content: userQuestion,
                    createdAt: new Date(),
                },
                { sender: "bot", content: answer, createdAt: new Date() },
            ],
            duration,
        });
        await log.save();

        res.json({
            answer: answer,
            response: answer, // Frontend response bekliyor
            success: true,
            duration: duration,
            logId: log._id,
        });
    } catch (error) {
        console.error("AI işleme hatası:", error.message);
        res.status(500).json({
            answer: "AI yanıtı alınamadı.",
            response: "AI yanıtı alınamadı.", // Frontend response bekliyor
            success: false,
            error: error.message,
        });
    }
};

// Basit embedding endpoint'i (mobil uygulamadaki gibi)
const simpleEmbedding = async (req, res) => {
    let { text } = req.body;

    if (!text || typeof text !== "string") {
        return res.status(400).json({
            embedding: [],
            success: false,
            error: "EMPTY_TEXT",
        });
    }

    try {
        const embedding = await getEmbeddingService().getEmbedding(text);

        res.json({
            embedding: embedding,
            success: true,
        });
    } catch (error) {
        console.error("Embedding hatası:", error.message);

        // Fallback embedding (mobil uygulamadaki gibi)
        const fallbackEmbedding = Array.from(
            { length: 384 },
            (_, i) => (i * 0.1) % 1.0
        );

        res.json({
            embedding: fallbackEmbedding,
            success: false,
            error: "EMBEDDING_FALLBACK",
        });
    }
};

// Stream destekli chat endpoint'i
const streamChat = async (req, res) => {
    let { question } = req.body;
    if (!question || typeof question !== "string") {
        res.status(400).json({
            answer: "Soru alanı boş olamaz.",
            success: false,
            error: "EMPTY_QUESTION",
        });
        return;
    }
    // Yanıtı anında gönderebilmek için header'ı ayarla
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders && res.flushHeaders();

    const prompt = "Lütfen bundan sonra Türkçe cevap ver.\n" + question;
    const axios = require("axios");
    const ollamaUrl = process.env.OLLAMA_URL || "http://localhost:11434/api";
    let fullAnswer = "";
    try {
        const response = await axios({
            method: "post",
            url: `${ollamaUrl}/generate`,
            data: {
                model: process.env.OLLAMA_CHAT_MODEL || "llama3.2:3b",
                prompt: prompt,
                temperature: parseFloat(process.env.AI_TEMPERATURE) || 0.7,
                max_tokens: parseInt(process.env.AI_MAX_TOKENS) || 512,
                stream: true,
            },
            responseType: "stream",
            headers: { "Content-Type": "application/json" },
            timeout: 300000,
        });
        response.data.on("data", (chunk) => {
            try {
                // Ollama stream'i JSON satır satır gönderir
                const lines = chunk.toString().split("\n").filter(Boolean);
                for (const line of lines) {
                    const obj = JSON.parse(line);
                    if (obj.response) {
                        fullAnswer += obj.response;
                        res.write(
                            `data: ${JSON.stringify({
                                token: obj.response,
                            })}\n\n`
                        );
                    }
                }
            } catch (e) {
                // JSON parse hatası olabilir, ignore
            }
        });
        response.data.on("end", async () => {
            // Sohbeti kaydet
            const Log = require("../models/Log");
            const log = new Log({
                messages: [
                    {
                        sender: "user",
                        content: question,
                        createdAt: new Date(),
                    },
                    {
                        sender: "bot",
                        content: fullAnswer,
                        createdAt: new Date(),
                    },
                ],
                duration: 0,
            });
            await log.save();
            res.write(
                `data: ${JSON.stringify({ done: true, logId: log._id })}\n\n`
            );
            res.end();
        });
        response.data.on("error", (err) => {
            res.write(
                `data: ${JSON.stringify({ error: "AI stream hatası" })}\n\n`
            );
            res.end();
        });
    } catch (error) {
        res.write(
            `data: ${JSON.stringify({ error: "AI servisi başlatılamadı" })}\n\n`
        );
        res.end();
    }
};

// Multer middleware için
const upload = multer({ dest: "uploads/" });

// Çalışan verilerini yükleme endpoint'i
const uploadEmployees = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: "Dosya bulunamadı",
            });
        }

        const filePath = req.file.path;
        const fileName = req.file.originalname;

        // Excel dosyasını oku
        const XLSX = require("xlsx");
        const workbook = XLSX.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet);

        if (data.length === 0) {
            return res.status(400).json({
                success: false,
                error: "Excel dosyasında veri bulunamadı",
            });
        }

        // Gerekli sütunları kontrol et
        const requiredColumns = [
            "isim",
            "toplam_mesai",
            "tarih_araligi",
            "gunluk_mesai",
        ];
        const firstRow = data[0];
        const missingColumns = requiredColumns.filter(
            (col) => !(col in firstRow)
        );

        if (missingColumns.length > 0) {
            return res.status(400).json({
                success: false,
                error: `Eksik sütunlar: ${missingColumns.join(", ")}`,
            });
        }

        // Aynı isimli çalışanları birleştir
        const grouped = {};
        for (let idx = 0; idx < data.length; idx++) {
            const row = data[idx];

            // İsim temizliği
            const isim = String(row.isim || "")
                .trim()
                .toLowerCase();

            // Tarih aralığı temizliği ve standartlaştırma
            let tarih_araligi = String(row.tarih_araligi || "").trim();
            try {
                const tarih_parts = tarih_araligi
                    .replace(/\./g, "-")
                    .split("/");
                if (tarih_parts.length === 2) {
                    const std_date = (s) => {
                        s = s.trim();
                        if (s.includes("-") && s.length === 10) {
                            return s;
                        }
                        // Basit tarih formatı kontrolü
                        const parts = s.split("-");
                        if (parts.length === 3) {
                            if (parts[0].length === 4) {
                                return s; // YYYY-MM-DD
                            } else {
                                return `${parts[2]}-${parts[1]}-${parts[0]}`; // DD-MM-YYYY -> YYYY-MM-DD
                            }
                        }
                        return s;
                    };
                    tarih_araligi = `${std_date(tarih_parts[0])}/${std_date(
                        tarih_parts[1]
                    )}`;
                }
            } catch (e) {
                console.log("Tarih formatı hatası:", e);
            }

            // Eksik veri kontrolü
            if (!isim || !row.toplam_mesai || !tarih_araligi) {
                return res.status(400).json({
                    success: false,
                    error: `Eksik veya hatalı veri: Satır ${
                        idx + 2
                    } (isim: ${isim}, tarih: ${tarih_araligi})`,
                });
            }

            // Günlük mesai işleme
            let gunluk_mesai = {};
            try {
                if (typeof row.gunluk_mesai === "string") {
                    // String olarak gelen gunluk_mesai'yi parse etmeye çalış
                    if (row.gunluk_mesai.trim() !== "") {
                        try {
                            gunluk_mesai = JSON.parse(row.gunluk_mesai);
                        } catch (parseError) {
                            console.log(
                                "JSON parse hatası, string olarak işleniyor:",
                                parseError.message
                            );
                            // Eğer JSON parse edilemiyorsa, string'i günlük mesai olarak kullan
                            gunluk_mesai = {
                                mesai_saati: parseInt(row.gunluk_mesai) || 0,
                                tarih: tarih_araligi,
                                aciklama: row.gunluk_mesai,
                            };
                        }
                    } else {
                        // Boş string ise, toplam_mesai'den günlük mesai oluştur
                        const toplamSaat = parseInt(row.toplam_mesai) || 0;
                        gunluk_mesai = {
                            mesai_saati: toplamSaat,
                            tarih: tarih_araligi,
                            aciklama: `${toplamSaat} saat mesai`,
                        };
                    }
                } else if (
                    typeof row.gunluk_mesai === "object" &&
                    row.gunluk_mesai !== null
                ) {
                    gunluk_mesai = row.gunluk_mesai;
                } else {
                    // Null veya undefined ise, toplam_mesai'den günlük mesai oluştur
                    const toplamSaat = parseInt(row.toplam_mesai) || 0;
                    gunluk_mesai = {
                        mesai_saati: toplamSaat,
                        tarih: tarih_araligi,
                        aciklama: `${toplamSaat} saat mesai`,
                    };
                }

                // Eğer mesai_saati 0 ise ve aciklama varsa, aciklama'dan mesai_saati hesapla
                if (gunluk_mesai.mesai_saati === 0 && gunluk_mesai.aciklama) {
                    try {
                        // Aciklama'daki günlük mesai detaylarını parse et
                        const aciklamaStr = gunluk_mesai.aciklama;
                        if (
                            aciklamaStr.includes("{") &&
                            aciklamaStr.includes("}")
                        ) {
                            // JSON benzeri string'i parse et
                            const gunlukDetaylar = JSON.parse(
                                aciklamaStr.replace(/'/g, '"')
                            );

                            // Günlük mesai saatlerini topla
                            let toplamGunlukMesai = 0;
                            if (typeof gunlukDetaylar === "object") {
                                Object.values(gunlukDetaylar).forEach(
                                    (saat) => {
                                        toplamGunlukMesai +=
                                            parseInt(saat) || 0;
                                    }
                                );
                            }

                            gunluk_mesai.mesai_saati = toplamGunlukMesai;
                        }
                    } catch (parseError) {
                        console.log(
                            "Aciklama parse hatası:",
                            parseError.message
                        );
                        // Parse edilemezse toplam_mesai kullan
                        gunluk_mesai.mesai_saati =
                            parseInt(row.toplam_mesai) || 0;
                    }
                }
            } catch (e) {
                console.log("Günlük mesai işleme hatası:", e);
                // Hata durumunda toplam_mesai'den günlük mesai oluştur
                const toplamSaat = parseInt(row.toplam_mesai) || 0;
                gunluk_mesai = {
                    mesai_saati: toplamSaat,
                    tarih: tarih_araligi,
                    aciklama: `${toplamSaat} saat mesai`,
                };
            }

            if (!grouped[isim]) {
                grouped[isim] = {
                    isim: isim,
                    toplam_mesai: [],
                    tarih_araligi: [],
                    gunluk_mesai: [],
                };
            }

            grouped[isim].toplam_mesai.push(parseInt(row.toplam_mesai));
            grouped[isim].tarih_araligi.push(tarih_araligi);
            grouped[isim].gunluk_mesai.push(gunluk_mesai);
        }

        console.log("Gruplandırılmış veriler:", grouped);

        // Qdrant'a ekle
        const QdrantClient = require("../config/qdrant");
        const qdrant = new QdrantClient();
        const EmbeddingService = require("../config/embedding");
        const embeddingService = new EmbeddingService();

        let added = 0;
        let failed = 0;

        for (const [isim, employeeData] of Object.entries(grouped)) {
            try {
                // Embedding oluştur
                const embedding = await embeddingService.getEmbedding(isim);

                // Qdrant'a ekle
                await qdrant.addVector(isim, embedding, employeeData);
                added++;
            } catch (e) {
                console.error("Qdrant ekleme hatası:", e);
                failed++;
            }
        }

        // Geçici dosyayı sil
        const fs = require("fs");
        fs.unlinkSync(filePath);

        const message = `${added} çalışan eklendi.`;
        return res.json({
            success: true,
            message: message,
            totalEmployees: added,
            totalRecords: data.length,
            failed: failed,
        });
    } catch (error) {
        console.error("Çalışan verileri yükleme hatası:", error);
        res.status(500).json({
            success: false,
            error: "Çalışan verileri yüklenirken hata oluştu: " + error.message,
        });
    }
};

// Çalışan istatistiklerini alma endpoint'i
const getEmployeeStats = async (req, res) => {
    try {
        const QdrantClient = require("../config/qdrant");
        const qdrant = new QdrantClient();

        // Qdrant'dan tüm vektörleri al
        const vectors = await qdrant.getAllVectors(1000);

        // İstatistikleri hesapla
        const totalEmployees = vectors.length;
        let totalRecords = 0;
        let totalWorkHours = 0;
        let workHoursCount = 0;

        vectors.forEach((vector) => {
            if (vector.payload) {
                // Toplam mesai array'ini kontrol et
                if (
                    vector.payload.toplam_mesai &&
                    Array.isArray(vector.payload.toplam_mesai)
                ) {
                    totalRecords += vector.payload.toplam_mesai.length;

                    vector.payload.toplam_mesai.forEach((mesai) => {
                        if (typeof mesai === "number" && mesai > 0) {
                            totalWorkHours += mesai;
                            workHoursCount++;
                        }
                    });
                }

                // Günlük mesai array'ini kontrol et (alternatif)
                if (
                    vector.payload.gunluk_mesai &&
                    Array.isArray(vector.payload.gunluk_mesai)
                ) {
                    totalRecords += vector.payload.gunluk_mesai.length;

                    vector.payload.gunluk_mesai.forEach((mesai) => {
                        if (
                            mesai &&
                            typeof mesai.mesai_saati === "number" &&
                            mesai.mesai_saati > 0
                        ) {
                            totalWorkHours += mesai.mesai_saati;
                            workHoursCount++;
                        }
                    });
                }
            }
        });

        const avgWorkHours =
            workHoursCount > 0 ? totalWorkHours / workHoursCount : 0;

        res.json({
            success: true,
            stats: {
                totalEmployees: totalEmployees,
                totalRecords: totalRecords,
                avgWorkHours: Math.round(avgWorkHours * 100) / 100,
                totalWorkHours: Math.round(totalWorkHours * 100) / 100,
            },
        });
    } catch (error) {
        console.error("İstatistik alma hatası:", error);
        res.status(500).json({
            success: false,
            error: "İstatistikler alınırken hata oluştu: " + error.message,
        });
    }
};

// Çalışan verilerini chat için kullanma
const chatWithEmployees = async (req, res) => {
    try {
        const { prompt } = req.body;
        const start = Date.now();

        // Qdrant'dan çalışan verilerini al
        const QdrantClient = require("../config/qdrant");
        const qdrant = new QdrantClient();
        const vectors = await qdrant.getAllVectors(100);

        if (vectors.length === 0) {
            return res.json({
                success: true,
                response:
                    "Henüz çalışan verisi yüklenmemiş. Lütfen önce Excel dosyası yükleyin.",
                duration: 0,
            });
        }

        // Çalışan verilerini prompt'a ekle
        const employeeData = vectors.map((v) => ({
            isim: v.payload.isim,
            mesai: v.payload.gunluk_mesai || [],
        }));

        const enhancedPrompt = `Aşağıdaki çalışan verileri hakkında soru soruluyor. Lütfen Türkçe yanıt ver:

Çalışan Verileri:
${JSON.stringify(employeeData, null, 2)}

Soru: ${prompt}

Lütfen sadece verilen çalışan verilerine dayanarak yanıt ver. Eğer verilerde bilgi yoksa, "Bu bilgi mevcut verilerde bulunmuyor" de.`;

        const aiResponse = await queryAI(enhancedPrompt);
        const reply = aiResponse.choices?.[0]?.text || "Yanıt alınamadı.";
        const end = Date.now();
        const duration = (end - start) / 1000;

        res.json({
            success: true,
            response: reply,
            duration: duration,
        });
    } catch (error) {
        console.error("Chat hatası:", error);
        res.status(500).json({
            success: false,
            error: "Chat sırasında hata oluştu: " + error.message,
        });
    }
};

// Excel verilerini işleme fonksiyonu
function processExcelData(data) {
    // Aynı isimli çalışanları birleştir
    const grouped = {};
    for (let idx = 0; idx < data.length; idx++) {
        const row = data[idx];

        // İsim temizliği
        const isim = String(row.isim || "")
            .trim()
            .toLowerCase();

        // Tarih aralığı temizliği ve standartlaştırma
        let tarih_araligi = String(row.tarih_araligi || "").trim();
        try {
            const tarih_parts = tarih_araligi.replace(/\./g, "-").split("/");
            if (tarih_parts.length === 2) {
                const std_date = (s) => {
                    s = s.trim();
                    if (s.includes("-") && s.length === 10) {
                        return s;
                    }
                    // Basit tarih formatı kontrolü
                    const parts = s.split("-");
                    if (parts.length === 3) {
                        if (parts[0].length === 4) {
                            return s; // YYYY-MM-DD
                        } else {
                            return `${parts[2]}-${parts[1]}-${parts[0]}`; // DD-MM-YYYY -> YYYY-MM-DD
                        }
                    }
                    return s;
                };
                tarih_araligi = `${std_date(tarih_parts[0])}/${std_date(
                    tarih_parts[1]
                )}`;
            }
        } catch (e) {
            console.log("Tarih formatı hatası:", e);
        }

        // Eksik veri kontrolü
        if (!isim || !row.toplam_mesai || !tarih_araligi) {
            console.log(
                `Eksik veri: Satır ${
                    idx + 2
                } (isim: ${isim}, tarih: ${tarih_araligi})`
            );
            continue;
        }

        // Günlük mesai işleme
        let gunluk_mesai = {};
        try {
            let gunlukStr = row.gunluk_mesai;
            if (typeof gunlukStr === "string") {
                // Tek tırnakları çift tırnağa çevir
                gunlukStr = gunlukStr.replace(/'/g, '"');
                gunluk_mesai = JSON.parse(gunlukStr);
            } else if (typeof gunlukStr === "object") {
                gunluk_mesai = gunlukStr;
            }
        } catch (e) {
            console.log(`Günlük mesai parse hatası: ${e.message}`);
        }

        // Açıklama alanından günlük mesai saatlerini çıkar
        let gunluk_mesai_saatleri = [];
        if (row.aciklama) {
            try {
                // Açıklama alanını JSON olarak parse etmeye çalış
                const aciklamaData = JSON.parse(row.aciklama);
                if (Array.isArray(aciklamaData)) {
                    gunluk_mesai_saatleri = aciklamaData.map((item) => {
                        if (typeof item === "object" && item.saat) {
                            return parseFloat(item.saat) || 0;
                        }
                        return parseFloat(item) || 0;
                    });
                }
            } catch (e) {
                // JSON parse edilemezse, string olarak işle
                const saatMatch = row.aciklama.match(/(\d+(?:\.\d+)?)\s*saat/);
                if (saatMatch) {
                    gunluk_mesai_saatleri = [parseFloat(saatMatch[1])];
                }
            }
        }

        // Çalışanı grupla
        if (!grouped[isim]) {
            grouped[isim] = {
                isim: isim,
                toplam_mesai: 0,
                mesai_gun_sayisi: 0,
                gunluk_mesai_saatleri: [],
                tarih_araliklari: [],
                gunluk_mesai: {},
            };
        }

        // Verileri ekle
        grouped[isim].toplam_mesai += parseFloat(row.toplam_mesai) || 0;
        grouped[isim].mesai_gun_sayisi += 1;
        grouped[isim].tarih_araliklari.push(tarih_araligi);

        // Günlük mesai saatlerini ekle
        if (gunluk_mesai_saatleri.length > 0) {
            grouped[isim].gunluk_mesai_saatleri.push(...gunluk_mesai_saatleri);
        }

        // Günlük mesai detaylarını ekle
        if (Object.keys(gunluk_mesai).length > 0) {
            Object.assign(grouped[isim].gunluk_mesai, gunluk_mesai);
        }
    }

    return Object.values(grouped);
}

// Qdrant'a çalışan verilerini ekleme fonksiyonu
async function insertEmployeesToQdrant(processedData) {
    const QdrantClient = require("../config/qdrant");
    const qdrant = new QdrantClient();
    const EmbeddingService = require("../config/embedding");
    const embeddingService = new EmbeddingService();

    let added = 0;
    let failed = 0;

    for (const employeeData of processedData) {
        try {
            // Embedding oluştur
            const embedding = await embeddingService.getEmbedding(
                employeeData.isim
            );

            // Qdrant'a ekle
            await qdrant.addVector(employeeData.isim, embedding, employeeData);
            added++;
            console.log(`✅ ${employeeData.isim} eklendi`);
        } catch (e) {
            console.error(`❌ ${employeeData.isim} eklenemedi:`, e.message);
            failed++;
        }
    }

    console.log(`📊 Toplam: ${added} başarılı, ${failed} başarısız`);
    return { added, failed };
}

// Otomatik veri yükleme fonksiyonu
async function autoLoadEmployeeData() {
    try {
        console.log("🔄 Otomatik veri yükleme başlatılıyor...");

        // Excel dosyasının varlığını kontrol et
        const excelPath = path.join(__dirname, "../mesai_tablosu_40_kisi.xlsx");
        if (!fs.existsSync(excelPath)) {
            console.log(
                "⚠️ Excel dosyası bulunamadı, otomatik yükleme atlanıyor"
            );
            return;
        }

        // Qdrant'ta veri var mı kontrol et
        const collectionInfo = await qdrant.getCollectionInfo("ai_logs");
        if (collectionInfo.points_count > 0) {
            console.log(
                "✅ Qdrant'ta zaten veri mevcut, otomatik yükleme atlanıyor"
            );
            return;
        }

        console.log("📊 Excel dosyası okunuyor...");
        const workbook = XLSX.readFile(excelPath);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet);

        if (data.length === 0) {
            console.log("⚠️ Excel dosyasında veri bulunamadı");
            return;
        }

        console.log(`📈 ${data.length} kayıt işleniyor...`);

        // Veriyi işle ve Qdrant'a yükle
        const processedData = processExcelData(data);
        await insertEmployeesToQdrant(processedData);

        console.log("✅ Otomatik veri yükleme tamamlandı!");
    } catch (error) {
        console.error("❌ Otomatik veri yükleme hatası:", error.message);
    }
}

// Stream chat endpoint'i
const chatStream = async (req, res) => {
    try {
        const { prompt } = req.body;
        if (!prompt) {
            res.status(400).json({ error: "Prompt gerekli" });
            return;
        }

        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Connection", "keep-alive");
        res.flushHeaders();

        const axios = require("axios");
        const ollamaUrl =
            process.env.OLLAMA_URL || "http://ollama:11434/api/chat";
        const response = await axios({
            method: "post",
            url: ollamaUrl,
            data: {
                model: process.env.OLLAMA_CHAT_MODEL || "llama3",
                messages: [{ role: "user", content: prompt }],
                stream: true,
            },
            responseType: "stream",
        });

        let buffer = "";
        let lastContent = "";
        response.data.on("data", (chunk) => {
            buffer += chunk.toString();
            let lines = buffer.split("\n");
            buffer = lines.pop();

            for (const line of lines) {
                if (!line.trim()) continue;
                try {
                    const json = JSON.parse(line);
                    if (json.message && json.message.content) {
                        const newContent = json.message.content;
                        // Sadece yeni gelen kısmı yaz
                        if (newContent.startsWith(lastContent)) {
                            const diff = newContent.slice(lastContent.length);
                            if (diff) res.write(diff);
                        } else {
                            // Tam eşleşme yoksa, tümünü yaz (fallback)
                            res.write(newContent);
                        }
                        lastContent = newContent;
                    }
                } catch (e) {
                    // JSON parse hatası olursa atla
                }
            }
        });
        response.data.on("end", () => {
            res.end();
        });
        response.data.on("error", (err) => {
            res.write(`event: error\ndata: ${err.message}\n\n`);
            res.end();
        });
    } catch (error) {
        res.write(`event: error\ndata: ${error.message}\n\n`);
        res.end();
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
    simpleChat,
    simpleEmbedding,
    streamChat,
    uploadEmployees,
    getEmployeeStats,
    chatWithEmployees,
    autoLoadEmployeeData,
    chatStream,
};
