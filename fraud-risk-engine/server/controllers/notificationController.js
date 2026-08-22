const Transaction = require("../models/Transaction");


// =====================================
// GET NOTIFICATIONS
// =====================================

const getNotifications = async (req, res) => {

    try {

        const transactions =
            await Transaction
                .find()
                .sort({
                    createdAt: -1
                })
                .limit(10);


        const notifications =
            transactions.map((transaction) => {

                const riskLevel =
                    transaction.riskLevel ||
                    "LOW";


                let icon = "🟢";
                let message =
                    "Transaction analyzed successfully";


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

                    id: transaction._id,

                    type: "TRANSACTION",

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


        const unreadCount =
            notifications.filter(
                (notification) =>
                    !notification.read
            ).length;


        res.status(200).json({

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


        res.status(500).json({

            success: false,

            message:
                "Failed to load notifications"

        });

    }

};


// =====================================
// MARK ALL AS READ
// =====================================

const markAllAsRead = async (req, res) => {

    try {

        await Transaction.updateMany(

            {},

            {
                notificationRead: true
            }

        );


        res.status(200).json({

            success: true,

            message:
                "All notifications marked as read"

        });

    }
    catch (error) {

        console.error(
            "MARK READ ERROR:",
            error
        );


        res.status(500).json({

            success: false,

            message:
                "Failed to mark notifications as read"

        });

    }

};


module.exports = {

    getNotifications,

    markAllAsRead

};