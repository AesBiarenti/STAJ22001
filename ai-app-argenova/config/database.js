const mongoose = require("mongoose");

const connectDB = async () => {
    try {
        await mongoose.connect("mongodb://localhost:27017/ai_logs", {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log("MongoDB bağlantısı başarılı");
    } catch (error) {
        console.error("MongoDB bağlantı hatası:", error.message);
        process.exit(1);
    }
};

module.exports = connectDB;
