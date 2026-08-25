const express = require("express");

const protect =
    require("../middleware/authMiddleware");

const {

    createTransaction,

    confirmPayment,

    cancelPayment,

    getTransactions,

    getTransactionById,

    deleteTransaction

} = require(
    "../controllers/transactionController"
);


const router =
    express.Router();


router.post(
    "/",
    protect,
    createTransaction
);


router.get(
    "/",
    protect,
    getTransactions
);


router.put(
    "/:id/confirm",
    protect,
    confirmPayment
);


router.put(
    "/:id/cancel",
    protect,
    cancelPayment
);


router.get(
    "/:id",
    protect,
    getTransactionById
);


router.delete(
    "/:id",
    protect,
    deleteTransaction
);


module.exports = router;