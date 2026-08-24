const express = require("express");

const router = express.Router();

const multer = require("multer");

const {
    analyzeVoice,
    analyzeTranscript
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


// NEW - LIVE SPEECH TRANSCRIPT ANALYSIS
router.post(
    "/analyze-text",
    protect,
    analyzeTranscript
);


module.exports = router;