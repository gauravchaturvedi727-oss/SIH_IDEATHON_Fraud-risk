const express = require("express");

const router = express.Router();

const multer = require("multer");

const {
    analyzeVoice
} = require("../controllers/voiceController");

const protect =
    require("../middleware/authMiddleware");


const upload =
    multer({
        dest: "uploads/"
    });


router.post(
    "/analyze",
    protect,
    upload.single("audio"),
    analyzeVoice
);


module.exports = router;