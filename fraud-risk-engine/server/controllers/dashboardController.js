const Transaction = require("../models/Transaction");
const Phishing = require("../models/Phishing");
const VoiceAnalysis = require("../models/VoiceAnalysis");

const getDashboardData = async (req, res) => {

    try {

        const userFilter = {
            user: req.user.id
        };

        const [
            totalTransactions,
            totalPhishing,
            totalVoice
        ] = await Promise.all([

            Transaction.countDocuments(userFilter),

            Phishing.countDocuments(userFilter),

            VoiceAnalysis.countDocuments(userFilter)

        ]);


        const totalScans =
            totalTransactions +
            totalPhishing +
            totalVoice;

        const [
            highRiskTransactions,
            highRiskPhishing,
            highRiskVoice
        ] = await Promise.all([

            Transaction.countDocuments({
                ...userFilter,
                riskLevel: "HIGH"
            }),

            Phishing.countDocuments({
                ...userFilter,
                riskLevel: "HIGH"
            }),

            VoiceAnalysis.countDocuments({
                ...userFilter,
                riskLevel: "HIGH"
            })

        ]);


        const totalHighRisk =
            highRiskTransactions +
            highRiskPhishing +
            highRiskVoice;

        const [
            mediumRiskTransactions,
            mediumRiskPhishing,
            mediumRiskVoice
        ] = await Promise.all([

            Transaction.countDocuments({
                ...userFilter,
                riskLevel: "MEDIUM"
            }),

            Phishing.countDocuments({
                ...userFilter,
                riskLevel: "MEDIUM"
            }),

            VoiceAnalysis.countDocuments({
                ...userFilter,
                riskLevel: "MEDIUM"
            })

        ]);


        const totalMediumRisk =
            mediumRiskTransactions +
            mediumRiskPhishing +
            mediumRiskVoice;

        const [
            lowRiskTransactions,
            lowRiskPhishing,
            lowRiskVoice
        ] = await Promise.all([

            Transaction.countDocuments({
                ...userFilter,
                riskLevel: "LOW"
            }),

            Phishing.countDocuments({
                ...userFilter,
                riskLevel: "LOW"
            }),

            VoiceAnalysis.countDocuments({
                ...userFilter,
                riskLevel: "LOW"
            })

        ]);


        const totalLowRisk =
            lowRiskTransactions +
            lowRiskPhishing +
            lowRiskVoice;

        const [
            recentTransactions,
            recentPhishing,
            recentVoice
        ] = await Promise.all([

            Transaction
                .find(userFilter)
                .sort({ createdAt: -1 })
                .limit(5),

            Phishing
                .find(userFilter)
                .sort({ createdAt: -1 })
                .limit(5),

            VoiceAnalysis
                .find(userFilter)
                .sort({ createdAt: -1 })
                .limit(5)

        ]);

        const transactionActivities =
            recentTransactions.map(
                (transaction) => ({

                    id: transaction._id,

                    type: "TRANSACTION",

                    icon: "💳",

                    title:
                        transaction.riskLevel === "HIGH"
                            ? "High risk transaction detected"
                            : "Transaction analyzed",

                    description:
                        `Risk score: ${
                            transaction.riskScore || 0
                        }/100`,

                    riskLevel:
                        transaction.riskLevel || "LOW",

                    riskScore:
                        transaction.riskScore || 0,

                    createdAt:
                        transaction.createdAt

                })
            );

        const phishingActivities =
            recentPhishing.map(
                (phishing) => ({

                    id: phishing._id,

                    type: "PHISHING",

                    icon: "📩",

                    title:
                        phishing.riskLevel === "HIGH"
                            ? "High risk phishing attempt detected"
                            : "Phishing message analyzed",

                    description:
                        `Risk score: ${
                            phishing.riskScore || 0
                        }/100`,

                    riskLevel:
                        phishing.riskLevel || "LOW",

                    riskScore:
                        phishing.riskScore || 0,

                    createdAt:
                        phishing.createdAt

                })
            );

        const voiceActivities =
            recentVoice.map(
                (voice) => ({

                    id: voice._id,

                    type: "VOICE",

                    icon: "🎙️",

                    title:
                        voice.riskLevel === "HIGH"
                            ? "High risk voice scam detected"
                            : "Voice analysis completed",

                    description:
                        `Risk score: ${
                            voice.riskScore || 0
                        }/100`,

                    riskLevel:
                        voice.riskLevel || "LOW",

                    riskScore:
                        voice.riskScore || 0,

                    createdAt:
                        voice.createdAt

                })
            );

        const recentActivity = [

            ...transactionActivities,

            ...phishingActivities,

            ...voiceActivities

        ]
            .sort(
                (a, b) =>
                    new Date(b.createdAt) -
                    new Date(a.createdAt)
            )
            .slice(0, 10);

        let securityScore = 100;


        if (totalScans > 0) {

            const riskPenalty =

                (
                    totalHighRisk +
                    (totalMediumRisk * 0.5)
                )

                /

                totalScans

                *

                100;


            securityScore =
                Math.max(
                    0,
                    Math.round(
                        100 - riskPenalty
                    )
                );

        }

        const detectedThreats =
            totalHighRisk +
            totalMediumRisk;


        const detectionRate =

            totalScans > 0

                ? Number(
                    (
                        (
                            detectedThreats /
                            totalScans
                        )
                        *
                        100
                    ).toFixed(1)
                )

                : 0;

        return res.status(200).json({

            success: true,

            stats: {

                securityScore,

                totalScans,

                totalTransactions,

                totalPhishing,

                totalVoice,

                highRisk:
                    totalHighRisk,

                mediumRisk:
                    totalMediumRisk,

                lowRisk:
                    totalLowRisk,

                detectedThreats,

                detectionRate

            },

            recentActivity,

            lastUpdated:
                new Date()

        });

    }
    catch (error) {

        console.error(
            "DASHBOARD ERROR:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Failed to load dashboard data"

        });

    }

};

const clearAllActivity = async (req, res) => {

    try {

        console.log(
            "CLEAR ACTIVITY REQUEST USER:",
            req.user
        );


        if (!req.user || !req.user.id) {

            return res.status(401).json({

                success: false,

                message:
                    "User authentication failed. Please login again."

            });

        }


        const userId = req.user.id;


        const [
            transactionResult,
            phishingResult,
            voiceResult
        ] = await Promise.all([

            Transaction.deleteMany({
                user: userId
            }),

            Phishing.deleteMany({
                user: userId
            }),

            VoiceAnalysis.deleteMany({
                user: userId
            })

        ]);


        console.log(
            "DELETE RESULTS:",
            {
                transactions:
                    transactionResult.deletedCount,

                phishing:
                    phishingResult.deletedCount,

                voice:
                    voiceResult.deletedCount
            }
        );


        return res.status(200).json({

            success: true,

            message:
                "All security activity deleted successfully",

            deleted: {

                transactions:
                    transactionResult.deletedCount,

                phishing:
                    phishingResult.deletedCount,

                voice:
                    voiceResult.deletedCount

            }

        });

    }
    catch (error) {

        console.error(
            "CLEAR ACTIVITY ERROR:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                error.message ||
                "Failed to clear security activity"

        });

    }

};

module.exports = {
    getDashboardData,
    clearAllActivity
};