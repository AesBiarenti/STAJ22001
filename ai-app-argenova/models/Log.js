const mongoose = require("mongoose");

const LogSchema = new mongoose.Schema({
    prompt: {
        type: String,
        required: true,
        trim: true,
    },
    response: {
        type: String,
        required: true,
    },
    duration: {
        type: Number,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model("Log", LogSchema);
