const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        amount: {
            type: Number,
            required: true
        },

        newDevice: {
            type: Boolean,
            default: false
        },

        newLocation: {
            type: Boolean,
            default: false
        },

        rapidTransactions: {
            type: Number,
            default: 0
        },

        failedLogins: {
            type: Number,
            default: 0
        },

        otpRequests: {
            type: Number,
            default: 0
        },

        riskScore: {
            type: Number,
            default: 0
        },

        riskLevel: {
            type: String,
            enum: [
                "LOW",
                "MEDIUM",
                "HIGH"
            ],
            default: "LOW"
        },

        recommendedAction: {
            type: String,
            default: "ALLOW"
        },

        mlProbability: {
            type: Number,
            default: 0
        },

        reasons: {
            type: [String],
            default: []
        }
    },

    {
        timestamps: true
    }
);


module.exports =
    mongoose.model(
        "Transaction",
        transactionSchema
    );