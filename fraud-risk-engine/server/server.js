require("dotenv").config();

const express = require("express");
const cors = require("cors");

const connectDB = require("./config/db");


const authRoutes =
    require("./routes/authRoutes");

const transactionRoutes =
    require("./routes/transactionRoutes");

const phishingRoutes =
    require("./routes/phishingRoutes");

const voiceRoutes =
    require("./routes/voiceRoutes");

const dashboardRoutes =
    require("./routes/dashboardRoutes");


const notificationRoutes =
    require("./routes/notificationRoutes");

const app = express();


connectDB();


app.use(cors());

app.use(express.json());


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

app.get(
    "/",
    (req, res) => {

        res.json({
            success: true,
            message: "FraudGuard API is running"
        });

    }
);

app.use(
    (err, req, res, next) => {

        console.error(
            "SERVER ERROR:",
            err
        );

        res.status(500).json({

            success: false,

            message:
                err.message ||
                "Internal Server Error"

        });

    }
);

const PORT =
    process.env.PORT || 5000;


app.listen(
    PORT,
    () => {

        console.log(
            `Server running on port ${PORT}`
        );

    }
);