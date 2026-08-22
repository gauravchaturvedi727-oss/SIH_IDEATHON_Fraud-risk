const Phishing = require("../models/Phishing");


const analyzePhishing = async (req, res) => {

    try {

        const { text } = req.body;


        // ==========================================
        // VALIDATE TEXT
        // ==========================================

        if (
            !text ||
            typeof text !== "string" ||
            text.trim() === ""
        ) {

            return res.status(400).json({

                success: false,

                message: "Text is required"

            });

        }


        const lowerText = text
            .toLowerCase()
            .trim();


        // ==========================================
        // SUSPICIOUS PATTERNS
        // ==========================================

        const suspiciousPatterns = [

            {
                keywords: [
                    "otp",
                    "one time password",
                    "share otp",
                    "tell me otp"
                ],

                reason: "Request for OTP detected",

                score: 25
            },

            {
                keywords: [
                    "cvv",
                    "cvv number",
                    "card cvv"
                ],

                reason: "Request for CVV detected",

                score: 20
            },

            {
                keywords: [
                    "atm pin",
                    "upi pin",
                    "share pin",
                    "tell me your pin"
                ],

                reason: "Request for PIN detected",

                score: 25
            },

            {
                keywords: [
                    "share your password",
                    "tell me your password",
                    "login password"
                ],

                reason: "Request for password detected",

                score: 20
            },

            {
                keywords: [
                    "account blocked",
                    "account suspended",
                    "account will be blocked",
                    "account will be suspended",
                    "permanently suspended"
                ],

                reason:
                    "Account blocking or suspension threat detected",

                score: 20
            },

            {
                keywords: [
                    "urgent",
                    "immediately",
                    "right now",
                    "act now",
                    "hurry",
                    "do it now"
                ],

                reason:
                    "Urgency or pressure tactic detected",

                score: 15
            },

            {
                keywords: [
                    "complete kyc",
                    "update kyc",
                    "kyc verification",
                    "verify your kyc"
                ],

                reason:
                    "Suspicious KYC request detected",

                score: 15
            },

            {
                keywords: [
                    "share your bank details",
                    "send your bank details",
                    "share account details",
                    "send account details"
                ],

                reason:
                    "Request for banking information detected",

                score: 15
            },

            {
                keywords: [
                    "bank officer",
                    "calling from your bank",
                    "bank representative",
                    "customer care executive"
                ],

                reason:
                    "Possible bank impersonation detected",

                score: 15
            },

            {
                keywords: [
                    "you will be arrested",
                    "police case",
                    "legal action",
                    "case against you",
                    "court case"
                ],

                reason:
                    "Threat or fear tactic detected",

                score: 20
            },

            {
                keywords: [
                    "send money",
                    "transfer money",
                    "pay immediately",
                    "transfer amount",
                    "make payment now"
                ],

                reason:
                    "Suspicious money transfer request detected",

                score: 20
            },

            {
                keywords: [
                    "claim your refund",
                    "refund amount",
                    "get your refund"
                ],

                reason:
                    "Potential refund scam indicator detected",

                score: 10
            },

            {
                keywords: [
                    "claim your prize",
                    "you are a winner",
                    "you have won",
                    "lottery winner"
                ],

                reason:
                    "Prize or lottery scam indicator detected",

                score: 15
            },

            {
                keywords: [
                    "share your card number",
                    "share card details",
                    "send your card details"
                ],

                reason:
                    "Request for card information detected",

                score: 15
            }

        ];


        // ==========================================
        // ANALYZE MESSAGE
        // ==========================================

        let riskScore = 0;

        const reasons = [];


        for (const pattern of suspiciousPatterns) {

            const foundKeyword =
                pattern.keywords.find(
                    (keyword) =>
                        lowerText.includes(keyword)
                );


            if (foundKeyword) {

                riskScore += pattern.score;

                reasons.push(
                    pattern.reason
                );

            }

        }


        // ==========================================
        // LIMIT SCORE
        // ==========================================

        riskScore = Math.min(
            riskScore,
            100
        );


        // ==========================================
        // RISK LEVEL
        // ==========================================

        let riskLevel;

        let recommendedAction;


        if (riskScore >= 60) {

            riskLevel = "HIGH";

            recommendedAction =
                "Do not share OTP, PIN, CVV, password, card or banking information. Do not send money. Verify the sender independently.";

        }
        else if (riskScore >= 30) {

            riskLevel = "MEDIUM";

            recommendedAction =
                "Be cautious and verify the sender through an official source before taking any action.";

        }
        else {

            riskLevel = "LOW";

            recommendedAction =
                "No strong scam indicators were detected. Continue to remain cautious with unknown messages.";

        }


        // ==========================================
        // SAFE MESSAGE
        // ==========================================

        if (reasons.length === 0) {

            reasons.push(
                "No strong suspicious patterns detected"
            );

        }


        // ==========================================
        // SAVE RESULT TO MONGODB
        // IMPORTANT: SAVE LOGGED-IN USER ID
        // ==========================================

        const savedPhishing =
        await Phishing.create({

            user:
                req.user.id,

            message:
                text.trim(),

            riskScore,

            riskLevel,

            prediction:
                riskLevel === "HIGH"
                    ? "Phishing / Scam Detected"
                    : riskLevel === "MEDIUM"
                    ? "Suspicious Message"
                    : "Safe / Low Risk",

            confidence:
                riskScore

        });


        // ==========================================
        // RESPONSE
        // ==========================================

        return res.status(200).json({

            success: true,

            message:
                "Phishing message analyzed successfully",

            id:
                savedPhishing._id,

            riskScore,

            riskLevel,

            reasons,

            recommendedAction

        });

    }
    catch (error) {

        console.error(
            "PHISHING ANALYSIS ERROR:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Message analysis failed"

        });

    }

};


module.exports = {

    analyzePhishing

};