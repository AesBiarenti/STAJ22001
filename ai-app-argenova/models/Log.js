const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema({
    sender: {
        type: String,
        enum: ["user", "bot"],
        required: true,
    },
    content: {
        type: String,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

const LogSchema = new mongoose.Schema({
    messages: {
        type: [MessageSchema],
        required: true,
        default: [],
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
