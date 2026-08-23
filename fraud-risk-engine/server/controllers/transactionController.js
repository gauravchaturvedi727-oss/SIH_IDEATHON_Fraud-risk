const axios = require("axios");

const Transaction =
    require("../models/Transaction");

const createTransaction = async (
    req,
    res
) => {

    try {

        const {
            amount,
            newDevice,
            newLocation,
            rapidTransactions,
            failedLogins,
            otpRequests
        } = req.body;

        const mlResponse =
            await axios.post(
                "http://127.0.0.1:8000/predict",

                {
                    amount,
                    newDevice,
                    newLocation,
                    rapidTransactions,
                    failedLogins,
                    otpRequests
                }
            );


        const {

            riskScore,

            riskLevel,

            recommendedAction,

            mlProbability,

            reasons

        } = mlResponse.data;

        
        const transaction =
            await Transaction.create({

                user: req.user.id,

                amount,

                newDevice,

                newLocation,

                rapidTransactions,

                failedLogins,

                otpRequests,

                riskScore,

                riskLevel,

                recommendedAction,

                mlProbability,

                reasons

            });


        res.status(201).json({

            message:
                "Transaction analyzed successfully",

            transaction

        });


    } 
    catch (error) {

        console.error(
            "========== TRANSACTION ERROR =========="
        );

        console.error(
            "ERROR MESSAGE:",
            error.message
        );

        console.error(
            "STATUS:",
            error.response?.status
        );

        console.error(
            "FLASK RESPONSE:",
            error.response?.data
        );

        console.error(
            "ERROR CODE:",
            error.code
        );

        console.error(
            "========================================"
        );


        res.status(500).json({

            message:
                error.response?.data?.message ||
                error.message ||
                "Risk analysis failed",

            details:
                error.response?.data ||
                null

        });

    }



};


const getTransactions = async (
    req,
    res
) => {

    try {

        const transactions =
            await Transaction.find({
                user: req.user.id
            })
            .sort({
                createdAt: -1
            });


        res.json(
            transactions
        );


    } catch (error) {

        res.status(500).json({

            message:
                error.message

        });

    }
};


const getTransactionById = async (
    req,
    res
) => {

    try {

        const transaction =
            await Transaction.findOne({

                _id: req.params.id,

                user: req.user.id

            });


        if (!transaction) {

            return res.status(404).json({

                message:
                    "Transaction not found"

            });

        }


        res.json(
            transaction
        );


    } catch (error) {

        res.status(500).json({

            message:
                error.message

        });

    }
};

const updateTransaction = async (
    req,
    res
) => {

    try {

        const {

            amount,
            newDevice,
            newLocation,
            rapidTransactions,
            failedLogins,
            otpRequests

        } = req.body;


        const mlResponse =
            await axios.post(

                "http://127.0.0.1:8000/predict",

                {

                    amount,
                    newDevice,
                    newLocation,
                    rapidTransactions,
                    failedLogins,
                    otpRequests

                }

            );


        const {

            riskScore,
            riskLevel,
            recommendedAction,
            mlProbability,
            reasons

        } = mlResponse.data;


        const transaction =
            await Transaction.findOneAndUpdate(

                {
                    _id: req.params.id,

                    user: req.user.id
                },

                {

                    amount,

                    newDevice,

                    newLocation,

                    rapidTransactions,

                    failedLogins,

                    otpRequests,

                    riskScore,

                    riskLevel,

                    recommendedAction,

                    mlProbability,

                    reasons

                },

                {
                    new: true,
                    runValidators: true
                }

            );


        if (!transaction) {

            return res.status(404).json({

                message:
                    "Transaction not found"

            });

        }


        res.json({

            message:
                "Transaction updated successfully",

            transaction

        });


    } catch (error) {

        res.status(500).json({

            message:
                error.message

        });

    }
};

const deleteTransaction = async (
    req,
    res
) => {

    try {

        const transaction =
            await Transaction.findOneAndDelete({

                _id: req.params.id,

                user: req.user.id

            });


        if (!transaction) {

            return res.status(404).json({

                message:
                    "Transaction not found"

            });

        }


        res.json({

            message:
                "Transaction deleted successfully"

        });


    } catch (error) {

        res.status(500).json({

            message:
                error.message

        });

    }
};


module.exports = {

    createTransaction,

    getTransactions,

    getTransactionById,

    updateTransaction,

    deleteTransaction

};