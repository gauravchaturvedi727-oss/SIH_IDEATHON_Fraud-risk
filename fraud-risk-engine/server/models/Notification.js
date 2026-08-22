const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        title: {
            type: String,
            required: true
        },

        message: {
            type: String,
            required: true
        },

        type: {
            type: String,
            enum: ["transaction", "phishing", "voice"],
            required: true
        },

        riskLevel: {
            type: String,
            enum: ["HIGH", "MEDIUM", "LOW"],
            default: "LOW"
        },

        riskScore: {
            type: Number,
            default: 0
        },

        isRead: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model(
    "Notification",
    notificationSchema
);