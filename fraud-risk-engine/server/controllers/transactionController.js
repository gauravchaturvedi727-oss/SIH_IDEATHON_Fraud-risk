const axios = require("axios");
const Transaction = require("../models/Transaction");


// ==========================================
// GET ML SERVICE URL
// ==========================================

const getMLUrl = () => {

    const baseUrl = process.env.ML_SERVICE_URL;

    if (!baseUrl) {

        throw new Error(
            "ML_SERVICE_URL is not configured"
        );

    }

    return `${baseUrl.replace(/\/$/, "")}/predict`;

};


// ==========================================
// CONVERT VALUE TO BOOLEAN
// Handles true, false, "true", "false", 1, 0
// ==========================================

const toBoolean = (value) => {

    if (
        value === true ||
        value === "true" ||
        value === 1 ||
        value === "1"
    ) {
        return true;
    }

    return false;

};


// ==========================================
// VALIDATE TRANSACTION DATA
// ==========================================

const validateTransactionData = (data) => {

    const amount = Number(data.amount);

    if (
        data.amount === undefined ||
        data.amount === null ||
        data.amount === "" ||
        Number.isNaN(amount) ||
        amount < 0
    ) {

        throw new Error(
            "Valid transaction amount is required"
        );

    }

    return {

        amount,

        newDevice:
            toBoolean(data.newDevice),

        newLocation:
            toBoolean(data.newLocation),

        rapidTransactions:
            toBoolean(data.rapidTransactions),

        failedLogins:
            toBoolean(data.failedLogins),

        otpRequests:
            toBoolean(data.otpRequests)

    };

};


// ==========================================
// ANALYZE WITH ML SERVICE
// ==========================================

const analyzeWithML = async (data) => {

    const mlUrl = getMLUrl();

    console.log(
        "SENDING TRANSACTION TO ML:",
        mlUrl
    );


    const mlResponse = await axios.post(

        mlUrl,

        data,

        {

            timeout: 300000,

            headers: {

                "Content-Type":
                    "application/json"

            }

        }

    );


    console.log(
        "ML RESPONSE:",
        mlResponse.data
    );


    const mlData = mlResponse.data;


    // ======================================
    // VALIDATE ML RESPONSE
    // ======================================

    if (
        typeof mlData.riskScore === "undefined" ||
        !mlData.riskLevel
    ) {

        throw new Error(
            "Invalid response received from ML service"
        );

    }


    return {

        riskScore:
            Number(mlData.riskScore) || 0,

        riskLevel:
            String(
                mlData.riskLevel || "LOW"
            ).toUpperCase(),

        recommendedAction:
            mlData.recommendedAction ||
            "Verify the transaction before proceeding.",

        mlProbability:
            Number(mlData.mlProbability) || 0,

        reasons:
            Array.isArray(mlData.reasons)
                ? mlData.reasons
                : []

    };

};


// ==========================================
// CREATE TRANSACTION
// ==========================================

const createTransaction = async (
    req,
    res
) => {

    try {

        // =====================================
        // CHECK AUTHENTICATION
        // =====================================

        if (!req.user?.id) {

            return res.status(401).json({

                success: false,

                message:
                    "User authentication failed. Please login again."

            });

        }


        // =====================================
        // VALIDATE DATA
        // =====================================

        const transactionData =
            validateTransactionData(
                req.body
            );


        console.log(
            "TRANSACTION DATA:",
            transactionData
        );


        // =====================================
        // ML ANALYSIS
        // =====================================

        const mlResult =
            await analyzeWithML(
                transactionData
            );


        // =====================================
        // SAVE TRANSACTION
        // =====================================

        const transaction =
            await Transaction.create({

                user:
                    req.user.id,

                ...transactionData,

                ...mlResult

            });


        return res.status(201).json({

            success: true,

            message:
                "Transaction analyzed successfully",

            transaction

        });

    }
    catch (error) {

        console.error(
            "========== CREATE TRANSACTION ERROR =========="
        );

        console.error(
            "MESSAGE:",
            error.message
        );

        console.error(
            "STATUS:",
            error.response?.status
        );

        console.error(
            "ML RESPONSE:",
            error.response?.data
        );

        console.error(
            "CODE:",
            error.code
        );

        console.error(
            "=============================================="
        );


        return res.status(

            error.message.includes("required") ||
            error.message.includes("Valid transaction")
                ? 400
                : 500

        ).json({

            success: false,

            message:
                error.response?.data?.message ||
                error.message ||
                "Risk analysis failed"

        });

    }

};


// ==========================================
// GET ALL TRANSACTIONS
// ==========================================

const getTransactions = async (
    req,
    res
) => {

    try {

        if (!req.user?.id) {

            return res.status(401).json({

                success: false,

                message:
                    "User authentication failed"

            });

        }


        const transactions =
            await Transaction.find({

                user:
                    req.user.id

            })
                .sort({

                    createdAt: -1

                });


        return res.status(200).json({

            success: true,

            transactions

        });

    }
    catch (error) {

        console.error(
            "GET TRANSACTIONS ERROR:",
            error.message
        );


        return res.status(500).json({

            success: false,

            message:
                "Failed to fetch transactions"

        });

    }

};


// ==========================================
// GET TRANSACTION BY ID
// ==========================================

const getTransactionById = async (
    req,
    res
) => {

    try {

        const transaction =
            await Transaction.findOne({

                _id:
                    req.params.id,

                user:
                    req.user.id

            });


        if (!transaction) {

            return res.status(404).json({

                success: false,

                message:
                    "Transaction not found"

            });

        }


        return res.status(200).json({

            success: true,

            transaction

        });

    }
    catch (error) {

        console.error(
            "GET TRANSACTION ERROR:",
            error.message
        );


        return res.status(500).json({

            success: false,

            message:
                "Failed to fetch transaction"

        });

    }

};


// ==========================================
// UPDATE TRANSACTION
// ==========================================

const updateTransaction = async (
    req,
    res
) => {

    try {

        // =====================================
        // CHECK TRANSACTION EXISTS
        // =====================================

        const existingTransaction =
            await Transaction.findOne({

                _id:
                    req.params.id,

                user:
                    req.user.id

            });


        if (!existingTransaction) {

            return res.status(404).json({

                success: false,

                message:
                    "Transaction not found"

            });

        }


        // =====================================
        // VALIDATE UPDATED DATA
        // =====================================

        const transactionData =
            validateTransactionData(
                req.body
            );


        // =====================================
        // RUN ML ANALYSIS AGAIN
        // =====================================

        const mlResult =
            await analyzeWithML(
                transactionData
            );


        // =====================================
        // UPDATE DATABASE
        // =====================================

        const transaction =
            await Transaction.findByIdAndUpdate(

                req.params.id,

                {

                    ...transactionData,

                    ...mlResult

                },

                {

                    new: true,

                    runValidators: true

                }

            );


        return res.status(200).json({

            success: true,

            message:
                "Transaction updated and re-analyzed successfully",

            transaction

        });

    }
    catch (error) {

        console.error(
            "UPDATE TRANSACTION ERROR:",
            error.response?.data ||
            error.message
        );


        return res.status(500).json({

            success: false,

            message:
                error.response?.data?.message ||
                error.message ||
                "Failed to update transaction"

        });

    }

};


// ==========================================
// DELETE TRANSACTION
// ==========================================

const deleteTransaction = async (
    req,
    res
) => {

    try {

        const transaction =
            await Transaction.findOneAndDelete({

                _id:
                    req.params.id,

                user:
                    req.user.id

            });


        if (!transaction) {

            return res.status(404).json({

                success: false,

                message:
                    "Transaction not found"

            });

        }


        return res.status(200).json({

            success: true,

            message:
                "Transaction deleted successfully"

        });

    }
    catch (error) {

        console.error(
            "DELETE TRANSACTION ERROR:",
            error.message
        );


        return res.status(500).json({

            success: false,

            message:
                "Failed to delete transaction"

        });

    }

};


// ==========================================
// EXPORTS
// ==========================================

module.exports = {

    createTransaction,

    getTransactions,

    getTransactionById,

    updateTransaction,

    deleteTransaction

};