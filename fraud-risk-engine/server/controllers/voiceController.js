const axios = require("axios");
const fs = require("fs");
const FormData = require("form-data");


// =====================================================
// COMMON SCAM ANALYSIS ENGINE
// =====================================================

const analyzeScamText = (transcript) => {

    const text = String(transcript || "")
        .toLowerCase()
        .replace(/\s+/g, " ")
        .trim();


    const detectedReasons = [];
    const detectedCategories = new Set();

    let riskScore = 0;


    // =====================================================
    // HELPER FUNCTION
    // =====================================================

    const addSignal = (
        condition,
        score,
        reason,
        category
    ) => {

        if (!condition) return;

        riskScore += score;

        if (!detectedReasons.includes(reason)) {
            detectedReasons.push(reason);
        }

        if (category) {
            detectedCategories.add(category);
        }

    };


    // =====================================================
    // 1. OTP / PASSWORD / BANKING CREDENTIAL THEFT
    // =====================================================

    addSignal(
        /\botp\b/.test(text),
        30,
        "Request for OTP detected",
        "credential"
    );

    addSignal(
        /one[- ]?time password/.test(text),
        30,
        "Request for one-time password detected",
        "credential"
    );

    addSignal(
        /\bcvv\b/.test(text),
        30,
        "Request for CVV detected",
        "credential"
    );

    addSignal(
        /\bpin\b/.test(text),
        20,
        "Request for banking PIN detected",
        "credential"
    );

    addSignal(
        /share (your )?password/.test(text),
        35,
        "Request to share password detected",
        "credential"
    );

    addSignal(
        /share (your )?(bank|card|account) details/.test(text),
        30,
        "Request for sensitive banking details detected",
        "credential"
    );

    addSignal(
        /credit card|debit card|card number/.test(text),
        20,
        "Bank card information mentioned",
        "credential"
    );

    addSignal(
        /bank account|account number/.test(text),
        15,
        "Bank account information mentioned",
        "credential"
    );


    // =====================================================
    // 2. FAKE AUTHORITY / IMPERSONATION
    // =====================================================

    addSignal(
        /\bpolice\b/.test(text),
        20,
        "Police or law-enforcement authority mentioned",
        "authority"
    );

    addSignal(
        /criminal justice|legal law services|law enforcement/.test(text),
        35,
        "Possible fake law-enforcement or legal authority impersonation detected",
        "authority"
    );

    addSignal(
        /government|official department|government department/.test(text),
        20,
        "Government or official authority impersonation indicator detected",
        "authority"
    );

    addSignal(
        /bank security department|bank official|bank officer/.test(text),
        25,
        "Possible bank authority impersonation detected",
        "authority"
    );

    addSignal(
        /income tax|tax department|cyber crime/.test(text),
        25,
        "Possible government authority impersonation detected",
        "authority"
    );


    // =====================================================
    // 3. ARREST / LEGAL THREAT
    // =====================================================

    addSignal(
        /\barrest\b/.test(text),
        30,
        "Arrest threat or fear-based language detected",
        "threat"
    );

    addSignal(
        /arrest warrant|warrant.*issued|warrant.*authorized/.test(text),
        45,
        "Arrest warrant threat detected",
        "threat"
    );

    addSignal(
        /complaint against you|complaint.*against/.test(text),
        20,
        "Threat involving a complaint or legal allegation detected",
        "threat"
    );

    addSignal(
        /legal action|strong legal action/.test(text),
        25,
        "Threat of legal action detected",
        "threat"
    );

    addSignal(
        /allegations?|criminal case|case against you/.test(text),
        25,
        "Criminal allegation or legal case threat detected",
        "threat"
    );

    addSignal(
        /jail|prison|custody/.test(text),
        25,
        "Fear-based punishment threat detected",
        "threat"
    );


    // =====================================================
    // 4. URGENCY / PRESSURE
    // =====================================================

    addSignal(
        /\burgent\b/.test(text),
        15,
        "Urgency pressure language detected",
        "urgency"
    );

    addSignal(
        /\bimmediately\b/.test(text),
        15,
        "Immediate action pressure detected",
        "urgency"
    );

    addSignal(
        /time sensitive|extremely time sensitive/.test(text),
        25,
        "Time-pressure tactic detected",
        "urgency"
    );

    addSignal(
        /right now|right away|at once|this instant/.test(text),
        15,
        "Immediate response pressure detected",
        "urgency"
    );

    addSignal(
        /very second you receive|the second you receive/.test(text),
        20,
        "Extreme urgency and pressure tactic detected",
        "urgency"
    );

    addSignal(
        /don't return the call|do not return the call/.test(text),
        20,
        "Threat-based pressure to respond detected",
        "urgency"
    );


    // =====================================================
    // 5. ACCOUNT / KYC SCAMS
    // =====================================================

    addSignal(
        /account blocked|account freeze|account frozen/.test(text),
        25,
        "Account blocking or freezing threat detected",
        "account"
    );

    addSignal(
        /account suspended|account suspension/.test(text),
        25,
        "Account suspension threat detected",
        "account"
    );

    addSignal(
        /verify your account|verify account/.test(text),
        15,
        "Account verification request detected",
        "account"
    );

    addSignal(
        /\bkyc\b|complete kyc|update kyc/.test(text),
        20,
        "KYC-related scam indicator detected",
        "account"
    );


    // =====================================================
    // 6. MONEY / PAYMENT SCAMS
    // =====================================================

    addSignal(
        /send money|transfer money|make a payment/.test(text),
        30,
        "Request to transfer money detected",
        "money"
    );

    addSignal(
        /pay immediately|pay now|immediate payment/.test(text),
        25,
        "Urgent payment demand detected",
        "money"
    );

    addSignal(
        /\brefund\b/.test(text),
        10,
        "Refund-related scam pattern detected",
        "money"
    );

    addSignal(
        /prize|winner|lottery|you have won/.test(text),
        20,
        "Prize or reward scam pattern detected",
        "money"
    );


    // =====================================================
    // 7. PHONE NUMBER CALLBACK
    // =====================================================

    const phoneNumberPattern =
        /\b(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]\d{3}[-.\s]\d{4}\b/;

    addSignal(
        phoneNumberPattern.test(text) &&
        /return the call|call us back|call back/.test(text),
        20,
        "Suspicious callback request with a phone number detected",
        "callback"
    );


    // =====================================================
    // COMBINATION BONUS
    // =====================================================

    if (
        detectedCategories.has("authority") &&
        detectedCategories.has("threat")
    ) {

        riskScore += 25;

        if (
            !detectedReasons.includes(
                "Fake authority combined with legal or fear-based threats"
            )
        ) {

            detectedReasons.push(
                "Fake authority combined with legal or fear-based threats"
            );

        }

    }


    if (
        detectedCategories.has("threat") &&
        detectedCategories.has("urgency")
    ) {

        riskScore += 20;

        if (
            !detectedReasons.includes(
                "Threat combined with urgency pressure is a strong scam indicator"
            )
        ) {

            detectedReasons.push(
                "Threat combined with urgency pressure is a strong scam indicator"
            );

        }

    }


    if (
        detectedCategories.has("authority") &&
        detectedCategories.has("urgency")
    ) {

        riskScore += 15;

        if (
            !detectedReasons.includes(
                "Authority impersonation combined with urgency pressure detected"
            )
        ) {

            detectedReasons.push(
                "Authority impersonation combined with urgency pressure detected"
            );

        }

    }


    if (
        detectedCategories.size >= 3
    ) {

        riskScore += 15;

        if (
            !detectedReasons.includes(
                "Multiple independent scam patterns detected"
            )
        ) {

            detectedReasons.push(
                "Multiple independent scam patterns detected"
            );

        }

    }


    // =====================================================
    // FINAL SCORE
    // =====================================================

    riskScore = Math.min(
        Math.round(riskScore),
        100
    );


    let riskLevel;
    let recommendedAction;


    if (riskScore >= 70) {

        riskLevel = "HIGH";

        recommendedAction =
            "HIGH SCAM RISK: Do not call back, do not share OTP, PIN, passwords or banking information, and do not send money. Disconnect and independently verify the organization using its official website or phone number.";

    }
    else if (riskScore >= 40) {

        riskLevel = "MEDIUM";

        recommendedAction =
            "Possible scam indicators detected. Do not share sensitive information or make payments until the caller and organization are independently verified.";

    }
    else {

        riskLevel = "LOW";

        recommendedAction =
            "No strong scam pattern was detected, but remain cautious with unknown callers and never share sensitive credentials.";

    }


    return {

        riskScore,

        riskLevel,

        reasons:
            detectedReasons.slice(0, 10),

        recommendedAction

    };

};


// =====================================================
// ANALYZE TRANSCRIPT
// =====================================================

const analyzeTranscript = async (
    req,
    res
) => {

    try {

        const {
            transcript
        } = req.body;


        if (
            !transcript ||
            !String(transcript).trim()
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Speech transcript is required"

            });

        }


        const analysis =
            analyzeScamText(transcript);


        return res.status(200).json({

            success: true,

            transcript:
                String(transcript).trim(),

            riskScore:
                analysis.riskScore,

            riskLevel:
                analysis.riskLevel,

            reasons:
                analysis.reasons,

            recommendedAction:
                analysis.recommendedAction

        });

    }
    catch (error) {

        console.error(
            "TRANSCRIPT ANALYSIS ERROR:",
            error.message
        );


        return res.status(500).json({

            success: false,

            message:
                "Failed to analyze speech transcript"

        });

    }

};


// =====================================================
// ANALYZE VOICE
// Audio -> ML Service -> Transcript -> Scam Analysis
// =====================================================

const analyzeVoice = async (
    req,
    res
) => {

    try {

        if (!req.file) {

            return res.status(400).json({

                success: false,

                message:
                    "Audio file is required"

            });

        }


        if (!process.env.ML_SERVICE_URL) {

            return res.status(500).json({

                success: false,

                message:
                    "ML_SERVICE_URL is not configured"

            });

        }


        console.log(
            "========================================"
        );

        console.log(
            "VOICE FILE RECEIVED:",
            req.file.originalname
        );


        const formData =
            new FormData();


        formData.append(

            "audio",

            fs.createReadStream(
                req.file.path
            ),

            {

                filename:
                    req.file.originalname,

                contentType:
                    req.file.mimetype

            }

        );


        const mlUrl =
            `${process.env.ML_SERVICE_URL}/analyze-voice`;


        console.log(
            "SENDING AUDIO TO ML:",
            mlUrl
        );


        const mlResponse =
            await axios.post(

                mlUrl,

                formData,

                {

                    headers:
                        formData.getHeaders(),

                    timeout:
                        300000,

                    maxContentLength:
                        Infinity,

                    maxBodyLength:
                        Infinity

                }

            );


        const transcript =
            String(
                mlResponse.data.transcript ||
                ""
            ).trim();


        console.log(
            "TRANSCRIPT RECEIVED:",
            transcript
        );


        if (!transcript) {

            return res.status(200).json({

                success: true,

                transcript: "",

                riskScore: 0,

                riskLevel: "LOW",

                reasons: [],

                recommendedAction:
                    "No clear speech detected. Please try recording again."

            });

        }


        // =================================================
        // ANALYZE TRANSCRIPT USING COMMON ENGINE
        // =================================================

        const analysis =
            analyzeScamText(transcript);


        console.log(
            "FINAL FRAUD SCORE:",
            analysis.riskScore
        );

        console.log(
            "FINAL RISK LEVEL:",
            analysis.riskLevel
        );

        console.log(
            "REASONS:",
            analysis.reasons
        );

        console.log(
            "========================================"
        );


        return res.status(200).json({

            success: true,

            transcript,

            riskScore:
                analysis.riskScore,

            riskLevel:
                analysis.riskLevel,

            reasons:
                analysis.reasons,

            recommendedAction:
                analysis.recommendedAction

        });

    }
    catch (error) {

        console.error(
            "VOICE ANALYSIS ERROR:",
            error.response?.data ||
            error.message
        );


        return res.status(500).json({

            success: false,

            message:
                error.response?.data?.message ||
                error.message ||
                "Voice analysis failed"

        });

    }
    finally {

        // =============================================
        // DELETE TEMPORARY AUDIO
        // =============================================

        if (
            req.file &&
            req.file.path &&
            fs.existsSync(req.file.path)
        ) {

            try {

                fs.unlinkSync(
                    req.file.path
                );

                console.log(
                    "Temporary audio deleted"
                );

            }
            catch (error) {

                console.error(
                    "Audio delete error:",
                    error.message
                );

            }

        }

    }

};


module.exports = {

    analyzeVoice,

    analyzeTranscript

};