const QdrantClient = require("./config/qdrant");
const EmbeddingService = require("./config/embedding");

(async () => {
    const qdrant = new QdrantClient();
    const embeddingService = new EmbeddingService();

    // 1. Koleksiyonu oluştur
    console.log("🛠️ Qdrant koleksiyonu oluşturuluyor...");
    const created = await qdrant.createCollection();
    if (created) {
        console.log("✅ Koleksiyon başarıyla oluşturuldu veya zaten mevcut.");
    } else {
        console.error("❌ Koleksiyon oluşturulamadı!");
        process.exit(1);
    }

    // 2. Vektör ekleme testi (mevcut kod)
    console.log("🔍 Vektör ekleme testi başlıyor...");
    const testText = "Test embedding için örnek metin.";
    console.log("📝 Embedding oluşturuluyor...");
    const embedding = await embeddingService.getEmbedding(testText);
    console.log("✅ Embedding oluşturuldu, boyut:", embedding.length);
    console.log("💾 Qdrant'a ekleniyor...");
    const added = await qdrant.addVector("test_id", embedding, { test: true });
    if (added) {
        console.log("✅ Vektör başarıyla eklendi!");
    } else {
        console.error("❌ Vektör eklenemedi!");
    }

    // 3. Koleksiyon durumu
    const info = await qdrant.getCollectionInfo();
    console.log(
        "📊 Koleksiyon durumu:",
        info?.result?.points_count || 0,
        "vektör"
    );

    // 4. Benzer vektör arama
    console.log("🔍 Benzer vektörler aranıyor...");
    const similars = await qdrant.searchSimilar(embedding, 3);
    console.log("📋 Benzer vektörler:", similars.length);
})();
