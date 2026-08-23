const axios = require("axios");
const fs = require("fs");
const FormData = require("form-data");

const VoiceAnalysis =
    require("../models/VoiceAnalysis");


const analyzeVoice = async (req, res) => {

    try {

        console.log(
            "VOICE REQUEST USER:",
            req.user
        );

        if (!req.user || !req.user.id) {

            return res.status(401).json({

                success: false,

                message:
                    "User authentication failed. Please login again."

            });

        }

        if (!req.file) {

            return res.status(400).json({

                success: false,

                message: "Audio file is required"

            });

        }

        if (!process.env.ML_SERVICE_URL) {

            return res.status(500).json({

                success: false,

                message:
                    "ML_SERVICE_URL is not configured"

            });

        }


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

        const mlUrl =
            `${process.env.ML_SERVICE_URL}/analyze-voice`;


        console.log(
            "Sending audio to ML service:",
            mlUrl
        );


        const mlResponse =
            await axios.post(

                mlUrl,

                formData,

                {

                    headers:
                        formData.getHeaders(),

                    maxContentLength:
                        Infinity,

                    maxBodyLength:
                        Infinity,

                    timeout:
                        300000

                }

            );


        const voiceData =
            mlResponse.data;


        console.log(
            "VOICE ML RESPONSE:",
            voiceData
        );


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


        const transcript =
            String(
                voiceData.transcript ??
                voiceData.text ??
                ""
            );

        const reasons =

            Array.isArray(
                voiceData.reasons
            )

                ? voiceData.reasons

                : Array.isArray(
                    voiceData.detectedIndicators
                )

                    ? voiceData.detectedIndicators.map(
                        (indicator) =>
                            `Suspicious keyword detected: ${indicator}`
                    )

                    : [];

        const scamIndicators =

            Array.isArray(
                voiceData.detectedIndicators
            )

                ? voiceData.detectedIndicators

                : reasons;

        const prediction =
            voiceData.prediction ??

            (
                riskLevel === "HIGH"

                    ? "Voice Scam Detected"

                    : riskLevel === "MEDIUM"

                    ? "Suspicious Voice Activity"

                    : "Safe / Low Risk"
            );

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

        console.log(
            "SAVING VOICE ANALYSIS FOR USER:",
            req.user.id
        );


        const savedVoiceAnalysis =
            await VoiceAnalysis.create({

                user:
                    req.user.id,

                riskScore,

                riskLevel,

                transcript,

                prediction,

                confidence,

                reasons,

                recommendedAction

            });


        console.log(
            "VOICE ANALYSIS SAVED:",
            savedVoiceAnalysis._id
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

            reasons,

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


        return res.status(500).json({

            success: false,

            message:
                error.response?.data?.message ||
                error.message ||
                "Voice analysis failed"

        });

    }

    finally {

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
                    "Temporary audio file deleted"
                );

            }
            catch (deleteError) {

                console.error(
                    "TEMP FILE DELETE ERROR:",
                    deleteError.message
                );

            }

        }

    }

};


module.exports = {

    analyzeVoice

};