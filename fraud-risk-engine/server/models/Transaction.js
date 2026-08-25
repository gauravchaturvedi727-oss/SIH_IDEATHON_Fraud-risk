const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
    {
        // ==========================================
        // USER
        // ==========================================

        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        },


        // ==========================================
        // UPI PAYMENT DETAILS
        // ==========================================

        amount: {
            type: Number,
            required: true,
            min: 1
        },

        recipientUPI: {
            type: String,
            required: true,
            trim: true,
            lowercase: true,
            index: true
        },

        recipientName: {
            type: String,
            default: "",
            trim: true
        },

        isNewBeneficiary: {
            type: Boolean,
            default: false
        },


        // ==========================================
        // DEVICE / LOCATION SIGNALS
        // ==========================================

        newDevice: {
            type: Boolean,
            default: false
        },

        newLocation: {
            type: Boolean,
            default: false
        },


        // ==========================================
        // BEHAVIOURAL SIGNALS
        // ==========================================

        rapidTransactions: {
            type: Number,
            default: 0,
            min: 0
        },

        failedLogins: {
            type: Number,
            default: 0,
            min: 0
        },

        otpRequests: {
            type: Number,
            default: 0,
            min: 0
        },


        // ==========================================
        // SOCIAL ENGINEERING SIGNALS
        // ==========================================

        coercionDetected: {
            type: Boolean,
            default: false
        },

        voicePhishingDetected: {
            type: Boolean,
            default: false
        },

        urgentPayment: {
            type: Boolean,
            default: false
        },


        // ==========================================
        // FRAUD ANALYSIS RESULT
        // ==========================================

        riskScore: {
            type: Number,
            default: 0,
            min: 0,
            max: 100
        },

        riskLevel: {
            type: String,
            enum: [
                "LOW",
                "MEDIUM",
                "HIGH",
                "CRITICAL"
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
        },


        // ==========================================
        // PAYMENT CONFIRMATION FLOW
        // ==========================================

        paymentStatus: {
            type: String,
            enum: [
                "PENDING_CONFIRMATION",
                "COMPLETED",
                "CANCELLED",
                "FAILED"
            ],
            default: "PENDING_CONFIRMATION"
        },

        userConfirmed: {
            type: Boolean,
            default: false
        },

        confirmedAt: {
            type: Date,
            default: null
        },


        // ==========================================
        // NOTIFICATION
        // ==========================================

        notificationRead: {
            type: Boolean,
            default: false
        }

    },

    {
        timestamps: true
    }
);


// ==========================================
// INDEX FOR FAST BENEFICIARY LOOKUP
// Used to detect whether this UPI recipient
// is new for the current user.
// ==========================================

transactionSchema.index({
    user: 1,
    recipientUPI: 1
});


module.exports =
    mongoose.model(
        "Transaction",
        transactionSchema
    );