const express = require("express");

const router = express.Router();

const {
    analyzePhishing
} = require("../controllers/phishingController");

const protect =
    require("../middleware/authMiddleware");


router.post(
    "/analyze",
    protect,
    analyzePhishing
);


module.exports = router;