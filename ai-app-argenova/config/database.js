const mongoose = require("mongoose");

const connectDB = async () => {
    try {
        const mongoURI =
            process.env.MONGODB_URI || "";

        await mongoose.connect(mongoURI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log("MongoDB bağlantısı başarılı");
        console.log(`📦 Database: ${mongoURI}`);
    } catch (error) {
        console.error("MongoDB bağlantı hatası:", error.message);
        process.exit(1);
    }
};

module.exports = connectDB;
