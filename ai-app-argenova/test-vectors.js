const QdrantClient = require("./config/qdrant");
const EmbeddingService = require("./config/embedding");

async function testVectorAddition() {
    const qdrant = new QdrantClient();
    const embeddingService = new EmbeddingService();

    console.log("🔍 Vektör ekleme testi başlıyor...");

    try {
        // Test metni
        const testText = "Pazartesi: 08:30-17:00\nSalı: 09:00-17:30";

        // Embedding oluştur
        console.log("📝 Embedding oluşturuluyor...");
        const embedding = await embeddingService.getEmbedding(testText);
        console.log("✅ Embedding oluşturuldu, boyut:", embedding.length);

        // Qdrant'a ekle
        console.log("💾 Qdrant'a ekleniyor...");
        const success = await qdrant.addVector("test-1", embedding, {
            prompt: testText,
            response: "Test yanıtı",
            timestamp: new Date().toISOString(),
        });

        if (success) {
            console.log("✅ Vektör başarıyla eklendi!");

            // Koleksiyon durumunu kontrol et
            const info = await qdrant.getCollectionInfo();
            console.log(
                "📊 Koleksiyon durumu:",
                info.result.points_count,
                "vektör"
            );

            // Benzer vektörleri ara
            console.log("🔍 Benzer vektörler aranıyor...");
            const similar = await qdrant.searchSimilar(embedding, 5);
            console.log("📋 Benzer vektörler:", similar.length);
        } else {
            console.log("❌ Vektör eklenemedi!");
        }
    } catch (error) {
        console.error("❌ Hata:", error.message);
    }
}

testVectorAddition();
