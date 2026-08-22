const Transaction = require("../models/Transaction");
const Phishing = require("../models/Phishing");
const VoiceAnalysis = require("../models/VoiceAnalysis");


// =====================================
// GET DASHBOARD DATA
// =====================================

const getDashboardData = async (req, res) => {

    try {

        // =====================================
        // LOGGED-IN USER FILTER
        // =====================================

        const userFilter = {
            user: req.user.id
        };


        // =====================================
        // TOTAL COUNTS
        // =====================================

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


        // =====================================
        // HIGH RISK COUNTS
        // =====================================

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


        // =====================================
        // MEDIUM RISK COUNTS
        // =====================================

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


        // =====================================
        // LOW RISK COUNTS
        // =====================================

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


        // =====================================
        // RECENT DATA
        // =====================================

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


        // =====================================
        // FORMAT TRANSACTION ACTIVITY
        // =====================================

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


        // =====================================
        // FORMAT PHISHING ACTIVITY
        // =====================================

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


        // =====================================
        // FORMAT VOICE ACTIVITY
        // =====================================

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


        // =====================================
        // COMBINE ACTIVITIES
        // =====================================

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


        // =====================================
        // SECURITY SCORE
        // =====================================

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


        // =====================================
        // DETECTION RATE
        // =====================================

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


        // =====================================
        // RESPONSE
        // =====================================

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


module.exports = {
    getDashboardData
};