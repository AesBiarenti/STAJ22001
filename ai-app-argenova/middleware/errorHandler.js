const errorHandler = (err, req, res, next) => {
    console.error("Hata:", err.stack);

    // Bağlantı hatası verirse 500 hatası dönecek burada
    if (err.name === "MongoError" || err.name === "MongoServerError") {
        return res.status(500).json({
            error: "Veritabanı hatası oluştu.",
            details:
                process.env.NODE_ENV === "development"
                    ? err.message
                    : undefined,
        });
    }

    // Burada da validation hatası verirse 400 hatası dönecek
    if (err.name === "ValidationError") {
        return res.status(400).json({
            error: "Veri doğrulama hatası.",
            details: err.message,
        });
    }

    // Genel hata burada da 500 hatası dönecek
    res.status(500).json({
        error: "Sunucu hatası oluştu.",
        details:
            process.env.NODE_ENV === "development" ? err.message : undefined,
    });
};

module.exports = errorHandler;
