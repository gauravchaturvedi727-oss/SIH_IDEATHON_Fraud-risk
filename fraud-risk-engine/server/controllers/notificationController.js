const Transaction =
    require("../models/Transaction");

const Phishing =
    require("../models/Phishing");

const VoiceAnalysis =
    require("../models/VoiceAnalysis");

const getNotifications = async (req, res) => {

    try {

        const transactions =
            await Transaction
                .find({
                    user: req.user.id
                })
                .sort({
                    createdAt: -1
                })
                .limit(10);


        const phishingAnalyses =
            await Phishing
                .find({
                    user: req.user.id
                })
                .sort({
                    createdAt: -1
                })
                .limit(10);


        const voiceAnalyses =
            await VoiceAnalysis
                .find({
                    user: req.user.id
                })
                .sort({
                    createdAt: -1
                })
                .limit(10);

        const transactionNotifications =
            transactions.map((transaction) => {

                const riskLevel =
                    transaction.riskLevel || "LOW";


                let icon = "🟢";
                let message = "";


                if (riskLevel === "HIGH") {

                    icon = "🔴";

                    message =
                        `High risk transaction detected. Risk score: ${transaction.riskScore}/100`;

                }
                else if (riskLevel === "MEDIUM") {

                    icon = "🟡";

                    message =
                        `Suspicious transaction detected. Risk score: ${transaction.riskScore}/100`;

                }
                else {

                    message =
                        `Low risk transaction. Risk score: ${transaction.riskScore}/100`;

                }


                return {

                    id:
                        `transaction-${transaction._id}`,

                    originalId:
                        transaction._id,

                    type:
                        "TRANSACTION",

                    icon,

                    riskLevel,

                    message,

                    riskScore:
                        transaction.riskScore,

                    createdAt:
                        transaction.createdAt,

                    read:
                        transaction.notificationRead ||
                        false

                };

            });

        const phishingNotifications =
            phishingAnalyses.map((phishing) => {

                const riskLevel =
                    phishing.riskLevel || "LOW";


                let icon = "🟢";
                let message = "";


                if (riskLevel === "HIGH") {

                    icon = "🔴";

                    message =
                        `High risk phishing message detected. Risk score: ${phishing.riskScore}/100`;

                }
                else if (riskLevel === "MEDIUM") {

                    icon = "🟡";

                    message =
                        `Suspicious phishing message detected. Risk score: ${phishing.riskScore}/100`;

                }
                else {

                    message =
                        `Message analyzed as safe. Risk score: ${phishing.riskScore}/100`;

                }


                return {

                    id:
                        `phishing-${phishing._id}`,

                    originalId:
                        phishing._id,

                    type:
                        "PHISHING",

                    icon,

                    riskLevel,

                    message,

                    riskScore:
                        phishing.riskScore,

                    createdAt:
                        phishing.createdAt,

                    read:
                        phishing.notificationRead ||
                        false

                };

            });

        const voiceNotifications =
            voiceAnalyses.map((voice) => {

                const riskLevel =
                    voice.riskLevel || "LOW";


                let icon = "🟢";
                let message = "";


                if (riskLevel === "HIGH") {

                    icon = "🔴";

                    message =
                        `High risk scam indicators detected in voice analysis. Risk score: ${voice.riskScore}/100`;

                }
                else if (riskLevel === "MEDIUM") {

                    icon = "🟡";

                    message =
                        `Suspicious voice activity detected. Risk score: ${voice.riskScore}/100`;

                }
                else {

                    message =
                        `Voice analysis completed safely. Risk score: ${voice.riskScore}/100`;

                }


                return {

                    id:
                        `voice-${voice._id}`,

                    originalId:
                        voice._id,

                    type:
                        "VOICE",

                    icon,

                    riskLevel,

                    message,

                    riskScore:
                        voice.riskScore,

                    createdAt:
                        voice.createdAt,

                    read:
                        voice.notificationRead ||
                        false

                };

            });

        const notifications = [

            ...transactionNotifications,

            ...phishingNotifications,

            ...voiceNotifications

        ]
            .sort(

                (a, b) =>

                    new Date(b.createdAt) -
                    new Date(a.createdAt)

            )
            .slice(0, 20);


        const unreadCount =
            notifications.filter(
                (notification) =>
                    !notification.read
            ).length;


        return res.status(200).json({

            success: true,

            unreadCount,

            notifications

        });

    }
    catch (error) {

        console.error(
            "NOTIFICATION ERROR:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Failed to load notifications"

        });

    }

};

const markAsRead = async (req, res) => {

    try {

        const {
            id
        } = req.params;


        const [
            type,
            originalId
        ] = id.split("-");


        let result;


        if (type === "transaction") {

            result =
                await Transaction.findByIdAndUpdate(

                    originalId,

                    {
                        notificationRead: true
                    },

                    {
                        new: true
                    }

                );

        }
        else if (type === "phishing") {

            result =
                await Phishing.findByIdAndUpdate(

                    originalId,

                    {
                        notificationRead: true
                    },

                    {
                        new: true
                    }

                );

        }
        else if (type === "voice") {

            result =
                await VoiceAnalysis.findByIdAndUpdate(

                    originalId,

                    {
                        notificationRead: true
                    },

                    {
                        new: true
                    }

                );

        }


        if (!result) {

            return res.status(404).json({

                success: false,

                message:
                    "Notification not found"

            });

        }


        return res.status(200).json({

            success: true,

            message:
                "Notification marked as read"

        });

    }
    catch (error) {

        console.error(
            "MARK AS READ ERROR:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Failed to mark notification as read"

        });

    }

};

const markAllAsRead = async (req, res) => {

    try {

        await Promise.all([

            Transaction.updateMany(

                {
                    user: req.user.id
                },

                {
                    notificationRead: true
                }

            ),

            Phishing.updateMany(

                {
                    user: req.user.id
                },

                {
                    notificationRead: true
                }

            ),

            VoiceAnalysis.updateMany(

                {
                    user: req.user.id
                },

                {
                    notificationRead: true
                }

            )

        ]);


        return res.status(200).json({

            success: true,

            message:
                "All notifications marked as read"

        });

    }
    catch (error) {

        console.error(
            "MARK ALL READ ERROR:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Failed to mark notifications as read"

        });

    }

};

module.exports = {

    getNotifications,

    markAsRead,

    markAllAsRead

};