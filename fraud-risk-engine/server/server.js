require("dotenv").config();

const express = require("express");
const cors = require("cors");

const connectDB = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const transactionRoutes = require("./routes/transactionRoutes");
const phishingRoutes = require("./routes/phishingRoutes");
const voiceRoutes = require("./routes/voiceRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const notificationRoutes = require("./routes/notificationRoutes");

const app = express();

connectDB();


// =====================================
// CORS - MUST BE BEFORE ALL ROUTES
// =====================================

app.use(cors({
    origin: [
        "https://sih-ideathon.vercel.app",
        "http://localhost:5173"
    ],
    methods: [
        "GET",
        "POST",
        "PUT",
        "PATCH",
        "DELETE",
        "OPTIONS"
    ],
    allowedHeaders: [
        "Content-Type",
        "Authorization"
    ]
}));


// =====================================
// BODY PARSER
// =====================================

app.use(express.json());


// =====================================
// TEST ROUTE
// =====================================

app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "FraudGuard API is running"
    });
});


// =====================================
// API ROUTES
// =====================================

app.use("/api/auth", authRoutes);

app.use("/api/transactions", transactionRoutes);

app.use("/api/phishing", phishingRoutes);

app.use("/api/voice", voiceRoutes);

app.use("/api/dashboard", dashboardRoutes);

app.use("/api/notifications", notificationRoutes);


// =====================================
// ERROR HANDLER
// =====================================

app.use((err, req, res, next) => {

    console.error("SERVER ERROR:", err);

    res.status(500).json({
        success: false,
        message: err.message || "Internal Server Error"
    });

});


// =====================================
// SERVER
// =====================================

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});