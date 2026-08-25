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
// VALIDATE UPI ID
// ==========================================

const isValidUPIId = (upiId) => {

    if (!upiId) {

        return false;

    }

    // Example:
    // name@upi
    // user@ybl
    // 9876543210@paytm

    const upiRegex =
        /^[a-zA-Z0-9._-]{2,256}@[a-zA-Z]{2,64}$/;

    return upiRegex.test(
        String(upiId).trim()
    );

};


// ==========================================
// VALIDATE TRANSACTION DATA
// ==========================================

const validateTransactionData = (data) => {

    const amount = Number(data.amount);

    const recipientUPI =
        String(
            data.recipientUPI || ""
        ).trim().toLowerCase();


    if (
        data.amount === undefined ||
        data.amount === null ||
        data.amount === "" ||
        Number.isNaN(amount) ||
        amount <= 0
    ) {

        throw new Error(
            "Valid transaction amount is required"
        );

    }


    if (
        !isValidUPIId(recipientUPI)
    ) {

        throw new Error(
            "Valid recipient UPI ID is required"
        );

    }


    return {

        amount,

        recipientUPI,

        recipientName:
            String(
                data.recipientName || ""
            ).trim(),

        newDevice:
            toBoolean(data.newDevice),

        newLocation:
            toBoolean(data.newLocation),

        rapidTransactions:
            Math.max(
                0,
                Number(data.rapidTransactions) || 0
            ),

        failedLogins:
            Math.max(
                0,
                Number(data.failedLogins) || 0
            ),

        otpRequests:
            Math.max(
                0,
                Number(data.otpRequests) || 0
            ),

        coercionDetected:
            toBoolean(
                data.coercionDetected
            ),

        voicePhishingDetected:
            toBoolean(
                data.voicePhishingDetected
            ),

        urgentPayment:
            toBoolean(
                data.urgentPayment
            )

    };

};
// ==========================================
// CHECK IF BENEFICIARY IS NEW
// ==========================================

const checkNewBeneficiary = async (
    userId,
    recipientUPI
) => {

    const previousTransaction =
        await Transaction.findOne({

            user: userId,

            recipientUPI

        });


    // If no previous transaction exists,
    // beneficiary is new

    return !previousTransaction;

};


// ==========================================
// ANALYZE WITH ML SERVICE
// ==========================================

const analyzeWithML = async (
    data
) => {

    const mlUrl = getMLUrl();


    console.log(
        "SENDING TRANSACTION TO ML:",
        mlUrl
    );


    const mlResponse =
        await axios.post(

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


    const mlData =
        mlResponse.data;


    // ======================================
    // VALIDATE ML RESPONSE
    // ======================================

    if (
        typeof mlData.riskScore ===
        "undefined"
    ) {

        throw new Error(
            "Invalid response received from ML service"
        );

    }


    return {

        riskScore:
            Number(
                mlData.riskScore
            ) || 0,

        riskLevel:
            String(
                mlData.riskLevel || "LOW"
            ).toUpperCase(),

        recommendedAction:
            mlData.recommendedAction ||
            "Verify the transaction before proceeding.",

        mlProbability:
            Number(
                mlData.mlProbability ??
                mlData.fraudProbability ??
                mlData.fraud_probability ??
                0
            ) || 0,
        reasons:
            Array.isArray(
                mlData.reasons
            )
                ? mlData.reasons
                : []

    };

};


// ==========================================
// ADD EXPLAINABLE UPI RISK REASONS
// ==========================================

const addUPIReasons = (
    data,
    mlResult
) => {

    const reasons =
        [...mlResult.reasons];


    // ======================================
    // NEW BENEFICIARY
    // ======================================

    if (data.isNewBeneficiary) {

        reasons.push(
            "This is the first payment to this UPI recipient."
        );

    }


    // ======================================
    // NEW DEVICE
    // ======================================

    if (data.newDevice) {

        reasons.push(
            "The payment is being initiated from a new device."
        );

    }


    // ======================================
    // NEW LOCATION
    // ======================================

    if (data.newLocation) {

        reasons.push(
            "The payment location is different from your usual activity."
        );

    }


    // ======================================
    // RAPID TRANSACTIONS
    // ======================================

    if (data.rapidTransactions) {

        reasons.push(
            "Multiple transactions were detected in a short period."
        );

    }


    // ======================================
    // FAILED LOGINS
    // ======================================

    if (data.failedLogins) {

        reasons.push(
            "Recent failed login attempts were detected."
        );

    }


    // ======================================
    // OTP ACTIVITY
    // ======================================

    if (data.otpRequests) {

        reasons.push(
            "Unusual OTP or verification activity was detected."
        );

    }


    // ======================================
    // COERCION / SOCIAL ENGINEERING
    // ======================================

    if (data.coercionDetected) {

        reasons.push(
            "The payment may be influenced by pressure or social engineering."
        );

    }


    // ======================================
    // VOICE PHISHING
    // ======================================

    if (data.voicePhishingDetected) {

        reasons.push(
            "Possible voice phishing or scam-call indicators were detected."
        );

    }


    // ======================================
    // URGENCY
    // ======================================

    if (data.urgentPayment) {

        reasons.push(
            "The payment was marked as urgent, which can be associated with scam pressure tactics."
        );

    }


    return reasons;

};


// ==========================================
// CALCULATE FINAL RISK
// Combines ML + UPI specific signals
// ==========================================

const calculateFinalRisk = (
    data,
    mlResult
) => {

    let riskScore =
        Number(
            mlResult.riskScore
        ) || 0;


    // ======================================
    // ADDITIONAL UPI SIGNAL WEIGHTS
    // ======================================

    if (data.isNewBeneficiary) {

        riskScore += 10;

    }

    if (data.coercionDetected) {

        riskScore += 20;

    }

    if (data.voicePhishingDetected) {

        riskScore += 25;

    }

    if (data.urgentPayment) {

        riskScore += 10;

    }


    // Maximum risk = 100

    riskScore =
        Math.min(
            Math.round(riskScore),
            100
        );


    let riskLevel = "LOW";


    if (riskScore >= 75) {

        riskLevel = "HIGH";

    }
    else if (riskScore >= 40) {

        riskLevel = "MEDIUM";

    }


    let recommendedAction =
        "Transaction appears normal. Review recipient details before payment.";


    if (riskLevel === "MEDIUM") {

        recommendedAction =
            "Please verify the UPI ID and ensure nobody is pressuring you to make this payment.";

    }


    if (riskLevel === "HIGH") {

        recommendedAction =
            "High fraud risk detected. Verify the recipient independently. Do not share your UPI PIN or OTP. If someone is pressuring you, cancel the payment.";

    }


    return {

        riskScore,

        riskLevel,

        recommendedAction

    };

};


// ==========================================
// CREATE TRANSACTION / UPI PAYMENT ANALYSIS
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


        // =====================================
        // CHECK NEW BENEFICIARY AUTOMATICALLY
        // =====================================

        const isNewBeneficiary =
            await checkNewBeneficiary(

                req.user.id,

                transactionData.recipientUPI

            );


        transactionData.isNewBeneficiary =
            isNewBeneficiary;


        console.log(
            "UPI TRANSACTION DATA:",
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
        // CALCULATE FINAL COMBINED RISK
        // =====================================

        const finalRisk =
            calculateFinalRisk(

                transactionData,

                mlResult

            );


        // =====================================
        // GENERATE EXPLAINABLE REASONS
        // =====================================

        const reasons =
            addUPIReasons(

                transactionData,

                mlResult

            );


        // =====================================
        // CREATE TRANSACTION
        // STATUS = PENDING
        //
        // IMPORTANT:
        // Payment is NOT automatically blocked.
        // User can review and confirm.
        // =====================================

        const transaction =
            await Transaction.create({

                user:
                    req.user.id,

                ...transactionData,

                riskScore:
                    finalRisk.riskScore,

                riskLevel:
                    finalRisk.riskLevel,

                recommendedAction:
                    finalRisk.recommendedAction,

                mlProbability:
                    mlResult.mlProbability,

                reasons,

                paymentStatus:
                    "PENDING_CONFIRMATION"

            });


        return res.status(201).json({

            success: true,

            message:
                "UPI payment analyzed successfully. Please review the risk warning before confirming.",

            requiresConfirmation:
                true,

            transaction

        });

    }
    catch (error) {

        console.error(
            "========== UPI TRANSACTION ERROR =========="
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
            "=========================================="
        );


        return res.status(

            error.message.includes(
                "required"
            ) ||
            error.message.includes(
                "Valid transaction"
            )
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
// CONFIRM UPI PAYMENT
//
// User can proceed even if HIGH risk.
// This satisfies:
// "without blocking legitimate urgent payments"
// ==========================================

const confirmPayment = async (
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


        if (
            transaction.paymentStatus ===
            "COMPLETED"
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Payment has already been completed"

            });

        }


        // =====================================
        // MOCK UPI PAYMENT SUCCESS
        //
        // Later actual banking/UPI API can
        // replace this section.
        // =====================================

        transaction.paymentStatus =
            "COMPLETED";

        transaction.userConfirmed =
            true;

        transaction.confirmedAt =
            new Date();


        await transaction.save();


        return res.status(200).json({

            success: true,

            message:
                "UPI payment completed successfully",

            transaction

        });

    }
    catch (error) {

        console.error(
            "CONFIRM PAYMENT ERROR:",
            error.message
        );


        return res.status(500).json({

            success: false,

            message:
                "Failed to confirm payment"

        });

    }

};


// ==========================================
// CANCEL UPI PAYMENT
// ==========================================

const cancelPayment = async (
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


        transaction.paymentStatus =
            "CANCELLED";


        await transaction.save();


        return res.status(200).json({

            success: true,

            message:
                "UPI payment cancelled successfully"

        });

    }
    catch (error) {

        console.error(
            "CANCEL PAYMENT ERROR:",
            error.message
        );


        return res.status(500).json({

            success: false,

            message:
                "Failed to cancel payment"

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

        return res.status(500).json({

            success: false,

            message:
                "Failed to fetch transaction"

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

    confirmPayment,

    cancelPayment,

    getTransactions,

    getTransactionById,

    deleteTransaction

};