const Phishing = require("../models/Phishing");


// ======================================================
// PHISHING / SCAM TEXT ANALYSIS ENGINE
// ======================================================

const analyzeMessage = (message) => {

    const text = String(message || "")
        .toLowerCase()
        .replace(/\s+/g, " ")
        .trim();


    let riskScore = 0;

    const reasons = [];

    const categories = new Set();


    // ==================================================
    // HELPER
    // ==================================================

    const addSignal = (
        condition,
        score,
        reason,
        category
    ) => {

        if (!condition) return;

        riskScore += score;

        if (!reasons.includes(reason)) {

            reasons.push(reason);

        }

        if (category) {

            categories.add(category);

        }

    };


    // ==================================================
    // 1. LINKS / URL DETECTION
    // ==================================================

    const hasUrl =
        /(https?:\/\/|www\.|bit\.ly\/|tinyurl\.com\/|t\.co\/)/i
            .test(text);


    addSignal(
        hasUrl,
        20,
        "Suspicious link or URL detected",
        "link"
    );


    // ==================================================
    // 2. OTP / PASSWORD
    // ==================================================

    addSignal(
        /\botp\b/.test(text),
        30,
        "OTP-related request detected",
        "credential"
    );

    addSignal(
        /one[- ]?time password/.test(text),
        30,
        "One-time password request detected",
        "credential"
    );

    addSignal(
        /share.{0,30}otp|send.{0,30}otp|tell.{0,30}otp/i.test(text),
        20,
        "Request to share OTP detected",
        "credential"
    );

    addSignal(
        /\bcvv\b|cvv number|card cvv/.test(text),
        30,
        "Request for CVV detected",
        "credential"
    );

    addSignal(
        /atm pin|upi pin|share.{0,20}pin|tell.{0,20}pin/.test(text),
        30,
        "Request for PIN detected",
        "credential"
    );

    addSignal(
        /share.{0,30}password|send.{0,30}password|tell.{0,30}password|login password/.test(text),
        30,
        "Request for password detected",
        "credential"
    );


    // ==================================================
    // 3. CARD / BANK DETAILS
    // ==================================================

    addSignal(
        /card number|card details|debit card details|credit card details/.test(text),
        25,
        "Request for card information detected",
        "credential"
    );

    addSignal(
        /bank details|bank account|account details|account number/.test(text),
        20,
        "Sensitive banking information mentioned",
        "credential"
    );


    // ==================================================
    // 4. ACCOUNT BLOCK / KYC
    // ==================================================

    addSignal(
        /account.{0,30}(blocked|suspended|freeze|frozen|closed)|blocked.{0,30}account/.test(text),
        25,
        "Account blocking or suspension threat detected",
        "account"
    );

    addSignal(
        /\bkyc\b|complete kyc|update kyc|kyc verification|verify.{0,20}kyc/.test(text),
        20,
        "KYC verification request detected",
        "account"
    );


    // ==================================================
    // 5. URGENCY / PRESSURE
    // ==================================================

    addSignal(
        /\burgent\b|urgently|immediately|right now|act now|hurry|do it now|without delay/.test(text),
        15,
        "Urgency or pressure tactic detected",
        "urgency"
    );

    addSignal(
        /within.{0,20}(minutes?|hours?)|last chance|final warning/.test(text),
        15,
        "Deadline or final-warning pressure detected",
        "urgency"
    );


    // ==================================================
    // 6. BANK / AUTHORITY IMPERSONATION
    // ==================================================

    addSignal(
        /bank security|bank officer|bank representative|calling from.{0,20}bank|customer care/.test(text),
        20,
        "Possible bank impersonation detected",
        "authority"
    );

    addSignal(
        /government|police|cyber crime|income tax|tax department|legal department/.test(text),
        20,
        "Possible authority impersonation detected",
        "authority"
    );


    // ==================================================
    // 7. FEAR / THREATS
    // ==================================================

    addSignal(
        /arrest warrant|you will be arrested|\barrest\b/.test(text),
        35,
        "Arrest or warrant threat detected",
        "threat"
    );

    addSignal(
        /legal action|police case|court case|case against you|criminal case/.test(text),
        25,
        "Legal or criminal threat detected",
        "threat"
    );

    addSignal(
        /complaint against you|allegations?|jail|prison/.test(text),
        20,
        "Fear-based threat language detected",
        "threat"
    );


    // ==================================================
    // 8. MONEY TRANSFER
    // ==================================================

    addSignal(
        /send money|transfer money|make payment|pay immediately|pay now|transfer amount/.test(text),
        30,
        "Suspicious request for money or payment detected",
        "money"
    );

    addSignal(
        /upi.{0,30}(pay|payment|transfer)|scan.{0,20}(qr|code)/.test(text),
        25,
        "Suspicious UPI or payment request detected",
        "money"
    );


    // ==================================================
    // 9. REFUND / PRIZE
    // ==================================================

    addSignal(
        /claim.{0,20}refund|refund amount|get.{0,20}refund/.test(text),
        15,
        "Potential refund scam pattern detected",
        "money"
    );

    addSignal(
        /claim.{0,20}prize|you are a winner|you have won|lottery winner|congratulations.{0,50}(won|winner|prize)/.test(text),
        20,
        "Prize or lottery scam indicator detected",
        "money"
    );


    // ==================================================
    // 10. CALLBACK + PHONE NUMBER
    // ==================================================

    const phonePattern =
        /\b(?:\+?\d{1,3}[-.\s]?)?\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/;


    addSignal(
        phonePattern.test(text) &&
        /call.{0,20}back|return.{0,20}call|contact.{0,20}immediately/.test(text),
        20,
        "Suspicious callback request with phone number detected",
        "callback"
    );


    // ==================================================
    // COMBINATION BONUSES
    // ==================================================

    if (
        categories.has("link") &&
        categories.has("credential")
    ) {

        riskScore += 20;

        reasons.push(
            "Link combined with a request for sensitive credentials"
        );

    }


    if (
        categories.has("urgency") &&
        categories.has("credential")
    ) {

        riskScore += 15;

        reasons.push(
            "Urgency combined with credential theft indicators"
        );

    }


    if (
        categories.has("authority") &&
        categories.has("threat")
    ) {

        riskScore += 25;

        reasons.push(
            "Authority impersonation combined with fear or legal threats"
        );

    }


    if (
        categories.has("threat") &&
        categories.has("urgency")
    ) {

        riskScore += 20;

        reasons.push(
            "Threat combined with urgency is a strong scam indicator"
        );

    }


    if (
        categories.has("money") &&
        categories.has("urgency")
    ) {

        riskScore += 15;

        reasons.push(
            "Urgent demand for money detected"
        );

    }


    if (categories.size >= 3) {

        riskScore += 15;

        reasons.push(
            "Multiple independent phishing indicators detected"
        );

    }


    // ==================================================
    // FINAL SCORE
    // ==================================================

    riskScore = Math.min(
        Math.round(riskScore),
        100
    );


    let riskLevel;
    let recommendedAction;
    let prediction;


    if (riskScore >= 70) {

        riskLevel = "HIGH";

        prediction =
            "Phishing / Scam Detected";

        recommendedAction =
            "HIGH RISK: Do not click links, call unknown numbers, share OTP, PIN, CVV, passwords, card details or banking information. Do not send money. Verify the sender independently using an official source.";

    }
    else if (riskScore >= 35) {

        riskLevel = "MEDIUM";

        prediction =
            "Suspicious Message";

        recommendedAction =
            "Possible phishing indicators detected. Do not share sensitive information or click suspicious links until the sender is independently verified.";

    }
    else {

        riskLevel = "LOW";

        prediction =
            "Safe / Low Risk";

        recommendedAction =
            "No strong phishing pattern was detected. Continue to remain cautious with unknown messages.";

    }


    if (reasons.length === 0) {

        reasons.push(
            "No strong suspicious patterns detected"
        );

    }


    return {

        riskScore,
        riskLevel,
        prediction,
        reasons,
        recommendedAction

    };

};


// ======================================================
// ANALYZE PHISHING MESSAGE
// ======================================================

const analyzePhishing = async (req, res) => {

    try {

        console.log(
            "PHISHING REQUEST BODY:",
            req.body
        );


        const { text } = req.body;


        // ==================================================
        // VALIDATION
        // ==================================================

        if (
            !text ||
            typeof text !== "string" ||
            text.trim() === ""
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Text is required"

            });

        }


        if (
            !req.user ||
            !req.user.id
        ) {

            return res.status(401).json({

                success: false,

                message:
                    "User authentication failed. Please login again."

            });

        }


        // ==================================================
        // ANALYZE
        // ==================================================

        const analysis =
            analyzeMessage(text);


        console.log(
            "PHISHING SCORE:",
            analysis.riskScore
        );

        console.log(
            "PHISHING LEVEL:",
            analysis.riskLevel
        );

        console.log(
            "PHISHING REASONS:",
            analysis.reasons
        );


        // ==================================================
        // SAVE DATABASE
        // ==================================================

        const savedPhishing =
            await Phishing.create({

                user:
                    req.user.id,

                message:
                    text.trim(),

                riskScore:
                    analysis.riskScore,

                riskLevel:
                    analysis.riskLevel,

                prediction:
                    analysis.prediction,

                confidence:
                    analysis.riskScore

            });


        // ==================================================
        // RESPONSE
        // ==================================================

        return res.status(200).json({

            success: true,

            message:
                "Phishing message analyzed successfully",

            id:
                savedPhishing._id,

            // Main fields
            riskScore:
                analysis.riskScore,

            riskLevel:
                analysis.riskLevel,

            prediction:
                analysis.prediction,

            confidence:
                analysis.riskScore,

            reasons:
                analysis.reasons,

            recommendedAction:
                analysis.recommendedAction,

            // Compatibility fields
            risk_score:
                analysis.riskScore,

            risk_level:
                analysis.riskLevel

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
                "Message analysis failed",

            error:
                error.message

        });

    }

};


module.exports = {

    analyzePhishing

};