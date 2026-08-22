const axios = require("axios");
const fs = require("fs");
const FormData = require("form-data");

const VoiceAnalysis =
    require("../models/VoiceAnalysis");


// ==========================================
// ANALYZE VOICE
// ==========================================

const analyzeVoice = async (req, res) => {

    try {

        // ==================================
        // CHECK AUDIO FILE
        // ==================================

        if (!req.file) {

            return res.status(400).json({

                success: false,

                message: "Audio file is required"

            });

        }


        // ==================================
        // CREATE FORM DATA
        // ==================================

        const formData = new FormData();


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


        // ==================================
        // SEND AUDIO TO FLASK ML SERVER
        // ==================================

        const mlResponse =
            await axios.post(

                "http://127.0.0.1:8000/analyze-voice",

                formData,

                {

                    headers:
                        formData.getHeaders(),

                    maxContentLength:
                        Infinity,

                    maxBodyLength:
                        Infinity

                }

            );


        // ==================================
        // GET ML RESPONSE
        // ==================================

        const voiceData =
            mlResponse.data;


        console.log(
            "VOICE ML RESPONSE:",
            voiceData
        );


        // ==================================
        // DELETE TEMP AUDIO FILE
        // ==================================

        if (
            req.file.path &&
            fs.existsSync(req.file.path)
        ) {

            fs.unlinkSync(
                req.file.path
            );

        }


        // ==================================
        // NORMALIZE RISK SCORE
        // ==================================

        const riskScore =
            Math.min(
                Math.max(
                    Number(
                        voiceData.riskScore ??
                        voiceData.score ??
                        0
                    ),
                    0
                ),
                100
            );


        // ==================================
        // NORMALIZE RISK LEVEL
        // ==================================

        let riskLevel =
            String(
                voiceData.riskLevel ??
                voiceData.risk ??
                "LOW"
            ).toUpperCase();


        if (
            ![
                "LOW",
                "MEDIUM",
                "HIGH"
            ].includes(riskLevel)
        ) {

            if (riskScore >= 60) {

                riskLevel = "HIGH";

            }
            else if (riskScore >= 30) {

                riskLevel = "MEDIUM";

            }
            else {

                riskLevel = "LOW";

            }

        }


        // ==================================
        // TRANSCRIPT
        // ==================================

        const transcript =
            String(
                voiceData.transcript ??
                voiceData.text ??
                ""
            );


        // ==================================
        // SCAM INDICATORS
        // ==================================

        const scamIndicators =
            Array.isArray(
                voiceData.scamIndicators
            )

                ? voiceData.scamIndicators

                : Array.isArray(
                    voiceData.reasons
                )

                    ? voiceData.reasons

                    : voiceData.reason

                        ? [voiceData.reason]

                        : [];


        // ==================================
        // PREDICTION
        // ==================================

        const prediction =
            voiceData.prediction ??

            (
                riskLevel === "HIGH"
                    ? "Voice Scam Detected"
                    : riskLevel === "MEDIUM"
                    ? "Suspicious Voice Activity"
                    : "Safe / Low Risk"
            );


        // ==================================
        // CONFIDENCE
        // ==================================

        const confidence =
            Math.min(
                Math.max(
                    Number(
                        voiceData.confidence ??
                        riskScore
                    ),
                    0
                ),
                100
            );


        // ==================================
        // SAVE TO MONGODB
        // ==================================

        const savedVoiceAnalysis =
        await VoiceAnalysis.create({

            user:
                req.user.id,

            riskScore,

            riskLevel,

            transcript,

            prediction:
                riskLevel === "HIGH"
                    ? "Voice Scam Detected"
                    : riskLevel === "MEDIUM"
                    ? "Suspicious Voice Activity"
                    : "Safe / Low Risk",

            confidence:
                riskScore,

            reasons,

            recommendedAction

        });


        console.log(
            "VOICE ANALYSIS SAVED:",
            savedVoiceAnalysis._id
        );

        const recommendedAction =
            voiceData.recommendedAction ??
            voiceData.action ??
            (
                riskLevel === "HIGH"
                    ? "Do not share OTP, PIN, passwords or banking information. Verify the caller independently."
                    : riskLevel === "MEDIUM"
                    ? "Be cautious and verify the caller before taking any financial action."
                    : "No strong scam indicators detected. Continue to remain cautious with unknown callers."
            );

        return res.status(200).json({

            success: true,

            message:
                "Voice analyzed and saved successfully",

            id:
                savedVoiceAnalysis._id,

            riskScore,

            riskLevel,

            transcript,

            prediction,

            confidence,

            scamIndicators,

            recommendedAction

        });

    }

    catch (error) {

        console.error(
            "VOICE CONTROLLER ERROR:",
            error.response?.data ||
            error.message
        );


        // ==================================
        // DELETE FILE ON ERROR
        // ==================================

        if (

            req.file &&

            req.file.path &&

            fs.existsSync(
                req.file.path
            )

        ) {

            try {

                fs.unlinkSync(
                    req.file.path
                );

            }
            catch (deleteError) {

                console.error(
                    "TEMP FILE DELETE ERROR:",
                    deleteError.message
                );

            }

        }


        return res.status(500).json({

            success: false,

            message:

                error.response?.data?.message ||

                error.message ||

                "Voice analysis failed"

        });

    }

};


module.exports = {

    analyzeVoice

};