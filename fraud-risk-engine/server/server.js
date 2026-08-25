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


// ==========================================
// DATABASE CONNECTION
// ==========================================

connectDB();


// ==========================================
// CORS CONFIGURATION
// ==========================================

const allowedOrigins = [
    "https://sih-ideathon-fraud-risk.vercel.app",
    "http://localhost:5173"
];


app.use(cors({

    origin: (origin, callback) => {

        // Allow Postman and server-to-server requests
        if (!origin) {

            return callback(null, true);

        }


        // Allow configured frontend origins
        if (allowedOrigins.includes(origin)) {

            return callback(null, true);

        }


        console.log(
            "❌ CORS blocked:",
            origin
        );


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


// ==========================================
// MIDDLEWARE
// ==========================================

app.use(express.json());

app.use(express.urlencoded({
    extended: true
}));


// ==========================================
// HOME ROUTE
// ==========================================

app.get("/", (req, res) => {

    return res.status(200).json({

        success: true,

        message:
            "DhanRakshak Fraud Detection API is running 🚀",

        environment:
            process.env.NODE_ENV ||
            "development"

    });

});


// ==========================================
// HEALTH CHECK
// ==========================================

app.get("/health", (req, res) => {

    return res.status(200).json({

        success: true,

        status: "healthy",

        service:
            "DhanRakshak Backend"

    });

});


// ==========================================
// API ROUTES
// ==========================================

app.use(
    "/api/auth",
    authRoutes
);


app.use(
    "/api/transactions",
    transactionRoutes
);


app.use(
    "/api/phishing",
    phishingRoutes
);


app.use(
    "/api/voice",
    voiceRoutes
);


app.use(
    "/api/dashboard",
    dashboardRoutes
);


app.use(
    "/api/notifications",
    notificationRoutes
);


// ==========================================
// 404 HANDLER
// ==========================================

app.use((req, res) => {

    return res.status(404).json({

        success: false,

        message:
            `Route not found: ${req.method} ${req.originalUrl}`

    });

});


// ==========================================
// GLOBAL ERROR HANDLER
// ==========================================

app.use((err, req, res, next) => {

    console.error(
        "❌ SERVER ERROR:",
        err.message
    );


    return res.status(
        err.status || 500
    ).json({

        success: false,

        message:
            err.message ||
            "Internal Server Error"

    });

});


// ==========================================
// START SERVER
// ==========================================

const PORT =
    process.env.PORT ||
    5000;


app.listen(PORT, () => {

    console.log(
        "\n====================================="
    );

    console.log(
        "🚀 DhanRakshak Backend Running"
    );

    console.log(
        `📡 Port: ${PORT}`
    );

    console.log(
        `🌍 Environment: ${
            process.env.NODE_ENV ||
            "development"
        }`
    );

    console.log(
        "=====================================\n"
    );

});