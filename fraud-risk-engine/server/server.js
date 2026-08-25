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

const allowedOrigins = [
    "https://sih-ideathon-fraud-risk.vercel.app",
    "http://localhost:5173"
];


app.use(cors({
    origin: (origin, callback) => {

        // Allow requests without Origin
        // Example: Postman / server-to-server
        if (!origin) {
            return callback(null, true);
        }

        // Allow known frontend URLs
        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }

        console.log("❌ CORS blocked:", origin);

        return callback(
            new Error("Not allowed by CORS")
        );
    },

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
    ],

    credentials: true
}));

app.use(express.json());

app.use(express.urlencoded({
    extended: true
}));


app.get("/", (req, res) => {

    res.status(200).json({
        success: true,
        message: "DhanRakshak Fraud Detection API is running 🚀",
        environment: process.env.NODE_ENV || "development"
    });

});


app.get("/health", (req, res) => {

    res.status(200).json({
        success: true,
        status: "healthy",
        service: "DhanRakshak Backend"
    });

});


app.use("/api/auth", authRoutes);

app.use("/api/transactions", transactionRoutes);

app.use("/api/phishing", phishingRoutes);

app.use("/api/voice", voiceRoutes);

app.use("/api/dashboard", dashboardRoutes);

app.use("/api/notifications", notificationRoutes);


app.use((req, res) => {

    res.status(404).json({
        success: false,
        message: `Route not found: ${req.method} ${req.originalUrl}`
    });

});

app.use((err, req, res, next) => {

    console.error("❌ SERVER ERROR:", err.message);

    res.status(err.status || 500).json({
        success: false,
        message: err.message || "Internal Server Error"
    });

});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {

    console.log("\n=====================================");
    console.log("🚀 DhanRakshak Backend Running");
    console.log(`📡 Port: ${PORT}`);
    console.log(
        `🌍 Environment: ${
            process.env.NODE_ENV || "development"
        }`
    );
    console.log("=====================================\n");

});