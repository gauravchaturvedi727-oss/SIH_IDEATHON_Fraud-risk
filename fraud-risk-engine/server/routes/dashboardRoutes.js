const express = require("express");

const router = express.Router();

const protect =
    require("../middleware/authMiddleware");

const {
    getDashboardData,
    clearAllActivity
} = require("../controllers/dashboardController");


router.get(
    "/",
    protect,
    getDashboardData
);


router.delete(
    "/clear-activity",
    protect,
    clearAllActivity
);


module.exports = router;