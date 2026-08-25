import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import api from "../services/api";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import Navbar from "../components/Navbar";

import "./Dashboard.css";


function Dashboard() {

    const [mounted, setMounted] = useState(false);

    const [dashboardData, setDashboardData] =
        useState(null);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState("");

    const navigate = useNavigate();

    const fetchDashboard = async () => {

        try {

            setLoading(true);

            setError("");


            const response =
                await api.get("/dashboard");


            console.log(
                "DASHBOARD RESPONSE:",
                response.data
            );


            setDashboardData(
                response.data
            );

        }
        catch (error) {

            console.error(
                "DASHBOARD ERROR:",
                error.response?.data ||
                error.message
            );


            setError(
                error.response?.data?.message ||
                "Unable to load latest dashboard data."
            );

        }
        finally {

            setLoading(false);

        }

    };


    const clearAllActivity = async () => {

        const confirmDelete =
            window.confirm(
                "Are you sure you want to delete all security activity?"
            );


        if (!confirmDelete) {

            return;

        }


        try {

            await api.delete("/dashboard/clear-activity");


            setDashboardData(
                (previousData) => ({

                    ...previousData,

                    stats: {

                        securityScore: 100,

                        totalScans: 0,

                        totalTransactions: 0,

                        totalPhishing: 0,

                        totalVoice: 0,

                        highRisk: 0,

                        mediumRisk: 0,

                        lowRisk: 0,

                        detectedThreats: 0,

                        detectionRate: 0

                    },

                    recentActivity: [],

                    lastUpdated:
                        new Date().toISOString()

                })
            );

            await fetchDashboard();


            toast.success(
                "All security activity deleted successfully"
            );

        }
        catch (error) {

            console.error(
                "CLEAR ACTIVITY ERROR:",
                error.response?.data ||
                error.message
            );


            toast.error(

                error.response?.data?.message ||

                "Failed to delete security activity"

            );

        }

    };

    useEffect(() => {

        setMounted(true);

        fetchDashboard();

    }, []);

    const dashboardStats =
        dashboardData?.stats || {};


    const recentActivities =
        dashboardData?.recentActivity || [];

    const totalAnalyses =
        Number(
            dashboardStats.totalScans || 0
        );


    const totalTransactions =
        Number(
            dashboardStats.totalTransactions || 0
        );


    const totalPhishing =
        Number(
            dashboardStats.totalPhishing || 0
        );


    const totalVoice =
        Number(
            dashboardStats.totalVoice || 0
        );


    const highRisk =
        Number(
            dashboardStats.highRisk || 0
        );


    const mediumRisk =
        Number(
            dashboardStats.mediumRisk || 0
        );


    const lowRisk =
        Number(
            dashboardStats.lowRisk || 0
        );


    const securityScore =
        Number(
            dashboardStats.securityScore ?? 100
        );


    const detectedThreats =
        Number(
            dashboardStats.detectedThreats || 0
        );


    const detectionRate =
        Number(
            dashboardStats.detectionRate || 0
        );

    const calculatePercentage = (value) => {

        if (!totalAnalyses) {

            return 0;

        }


        return Math.min(

            Math.round(

                (
                    Number(value) /
                    totalAnalyses
                ) * 100

            ),

            100

        );

    };

    const transactionRisk =
        calculatePercentage(
            highRisk
        );


    const phishingRisk =
        calculatePercentage(
            totalPhishing
        );


    const voiceRisk =
        calculatePercentage(
            totalVoice
        );


    const riskScore =

        totalAnalyses > 0

            ? Math.min(
                100,
                Math.max(
                    0,
                    100 - securityScore
                )
            )

            : 0;

    let overallRiskLevel = "LOW";

    let riskText =
        "Security level is excellent";

    let riskDescription =
        "AI systems have detected very low suspicious activity across recent scans.";


    if (riskScore >= 60) {

        overallRiskLevel = "HIGH";

        riskText =
            "High risk activity detected";

        riskDescription =
            "Multiple suspicious activities require your immediate attention.";

    }
    else if (riskScore >= 30) {

        overallRiskLevel = "MEDIUM";

        riskText =
            "Some suspicious activity detected";

        riskDescription =
            "Review recent security events and remain cautious.";

    }


    const stats = [

        {

            icon: "🛡️",

            label: "Total Analyses",

            value:
                totalAnalyses,

            suffix: "",

            change:
                `${totalTransactions} Transactions • ${totalPhishing} Phishing • ${totalVoice} Voice`,

            type: "blue",

            progress:
                Math.min(
                    totalAnalyses,
                    100
                )

        },

        {

            icon: "🔍",

            label: "High Risk Detected",

            value:
                highRisk,

            suffix: "",

            change:
                "Requires immediate attention",

            type: "red",

            progress:
                calculatePercentage(
                    highRisk
                )

        },

        {

            icon: "⚠️",

            label: "Medium Risk",

            value:
                mediumRisk,

            suffix: "",

            change:
                "Review recommended",

            type: "yellow",

            progress:
                calculatePercentage(
                    mediumRisk
                )

        },

        {

            icon: "📊",

            label: "Low Risk / Safe",

            value:
                lowRisk,

            suffix: "",

            change:
                "System protected",

            type: "green",

            progress:
                calculatePercentage(
                    lowRisk
                )

        }

    ];


    const getActivityIcon = (type) => {

        const activityType =
            String(
                type || ""
            ).toLowerCase();


        if (
            activityType.includes(
                "transaction"
            )
        ) {

            return "💳";

        }


        if (
            activityType.includes(
                "phishing"
            )
        ) {

            return "📩";

        }


        if (
            activityType.includes(
                "voice"
            )
        ) {

            return "🎙️";

        }


        return "🛡️";

    };


    const formatTime = (date) => {

        if (!date) {

            return "Just now";

        }


        const activityDate =
            new Date(date);


        const difference =
            Date.now() -
            activityDate.getTime();


        const minutes =
            Math.floor(
                difference / 60000
            );


        if (minutes < 1) {

            return "Just now";

        }


        if (minutes < 60) {

            return `${minutes} min ago`;

        }


        const hours =
            Math.floor(
                minutes / 60
            );


        if (hours < 24) {

            return `${hours} hour${
                hours > 1
                    ? "s"
                    : ""
            } ago`;

        }


        const days =
            Math.floor(
                hours / 24
            );


        return `${days} day${
            days > 1
                ? "s"
                : ""
        } ago`;

    };


    if (loading) {

        return (

            <>

                <Navbar />


                <div className="dashboard-page">

                    <div className="dashboard-grid"></div>

                    <div className="dashboard-glow glow-one"></div>

                    <div className="dashboard-glow glow-two"></div>


                    <main className="dashboard-container">

                        <div className="dashboard-data-loading">

                            <div className="dashboard-loader"></div>


                            <h2>
                                Loading Security Dashboard
                            </h2>


                            <p>
                                Fetching your latest AI security data...
                            </p>

                        </div>

                    </main>

                </div>

            </>

        );

    }


    return (

        <>

            <Navbar />


            <div className="dashboard-page">

                <div className="dashboard-grid"></div>

                <div className="dashboard-glow glow-one"></div>

                <div className="dashboard-glow glow-two"></div>

                <div className="dashboard-glow glow-three"></div>


                <main className="dashboard-container">


                    <section
                        className={`dashboard-hero ${
                            mounted
                                ? "show"
                                : ""
                        }`}
                    >

                        <div className="hero-content">


                            <div className="hero-top">


                                <div className="dashboard-badge">

                                    <span className="badge-dot"></span>

                                    DHANRAKSHAK AI SYSTEM

                                </div>


                                <div className="live-status">

                                    <span className="live-dot"></span>

                                    LIVE PROTECTION

                                </div>

                            </div>


                            <h1>

                                Your Security.

                                <span>
                                    Always Protected.
                                </span>

                            </h1>


                            <p>

                                Monitor real fraud activity,
                                detect suspicious behavior,
                                and protect your digital transactions
                                using intelligent AI-powered security.

                            </p>


                            <div className="hero-actions">


                                <button
                                    className="hero-primary"
                                    onClick={() =>
                                        navigate(
                                            "/transaction"
                                        )
                                    }
                                >

                                    <span>
                                        🛡️
                                    </span>

                                    Analyze Transaction

                                    <b>
                                        →
                                    </b>

                                </button>


                                <button
                                    className="hero-secondary"
                                    onClick={() =>
                                        navigate(
                                            "/phishing-analyzer"
                                        )
                                    }
                                >

                                    <span>
                                        🔍
                                    </span>

                                    Analyze Threat

                                </button>

                            </div>


                            {error && (

                                <div className="dashboard-api-error">

                                    ⚠ {error}


                                    <button
                                        onClick={
                                            fetchDashboard
                                        }
                                    >
                                        Retry
                                    </button>

                                </div>

                            )}

                        </div>


                        {/* SECURITY CORE */}

                        <div className="security-core-wrapper">

                            <div className="core-rings ring-one"></div>

                            <div className="core-rings ring-two"></div>

                            <div className="core-rings ring-three"></div>


                            <div className="security-core">

                                <div className="core-shield">
                                    🛡️
                                </div>

                                <span>
                                    AI SECURITY
                                </span>

                                <strong>
                                    ACTIVE
                                </strong>

                            </div>


                            <div className="core-status-card">

                                <span>
                                    PROTECTION STATUS
                                </span>


                                <strong>

                                    {
                                        overallRiskLevel === "HIGH"

                                            ? "Attention Required"

                                            : overallRiskLevel === "MEDIUM"

                                            ? "Review Recommended"

                                            : "Fully Protected"

                                    }

                                </strong>


                                <div>

                                    <i></i>

                                    AI systems operational

                                </div>

                            </div>

                        </div>

                    </section>


                    {/* STATS */}

                    <section className="stats-section">


                        <div className="section-heading">

                            <div>

                                <span>
                                    SECURITY METRICS
                                </span>

                                <h2>
                                    Real System Overview
                                </h2>

                            </div>


                            <div className="dashboard-refresh-area">

                                <p>
                                    Live data from your AI security analysis
                                </p>


                                <button
                                    className="dashboard-refresh-btn"
                                    onClick={
                                        fetchDashboard
                                    }
                                >
                                    ↻ Refresh
                                </button>

                            </div>

                        </div>


                        <div className="stats-grid">

                            {

                                stats.map(
                                    (stat, index) => (

                                        <div
                                            className={
                                                `stat-card ${stat.type}`
                                            }
                                            key={index}
                                            style={{
                                                animationDelay:
                                                    `${index * 0.12}s`
                                            }}
                                        >

                                            <div className="stat-top">

                                                <div className="stat-icon">
                                                    {stat.icon}
                                                </div>

                                                <span className="stat-menu">
                                                    LIVE
                                                </span>

                                            </div>


                                            <span className="stat-label">
                                                {stat.label}
                                            </span>


                                            <div className="stat-value">

                                                {stat.value}

                                                <small>
                                                    {stat.suffix}
                                                </small>

                                            </div>


                                            <div className="stat-bottom">

                                                <span className="stat-change">
                                                    {stat.change}
                                                </span>


                                                <div className="mini-progress">

                                                    <div
                                                        style={{
                                                            width:
                                                                `${stat.progress}%`
                                                        }}
                                                    ></div>

                                                </div>

                                            </div>

                                        </div>

                                    )
                                )

                            }

                        </div>

                    </section>


                    {/* MAIN GRID */}

                    <section className="dashboard-main-grid">


                        {/* RISK PANEL */}

                        <div className="dashboard-panel risk-panel">


                            <div className="panel-header">

                                <div>

                                    <span className="panel-label">
                                        REAL AI ANALYTICS
                                    </span>

                                    <h2>
                                        Threat Risk Overview
                                    </h2>

                                </div>


                                <button
                                    className="panel-action"
                                    onClick={() =>
                                        navigate(
                                            "/transaction"
                                        )
                                    }
                                >
                                    Analyze Now →
                                </button>

                            </div>


                            <div className="risk-score-area">


                                <div className="risk-circle">

                                    <svg viewBox="0 0 120 120">

                                        <circle
                                            className="circle-bg"
                                            cx="60"
                                            cy="60"
                                            r="50"
                                        />

                                        <circle
                                            className="circle-progress"
                                            cx="60"
                                            cy="60"
                                            r="50"
                                            style={{
                                                strokeDashoffset:
                                                    314 -
                                                    (
                                                        314 *
                                                        riskScore
                                                    ) / 100
                                            }}
                                        />

                                    </svg>


                                    <div className="circle-content">

                                        <strong>
                                            {riskScore}
                                        </strong>

                                        <span>
                                            RISK SCORE
                                        </span>

                                    </div>

                                </div>


                                <div className="risk-info">


                                    <div
                                        className={
                                            `risk-status ${
                                                overallRiskLevel.toLowerCase()
                                            }`
                                        }
                                    >

                                        <span></span>

                                        {overallRiskLevel} RISK

                                    </div>


                                    <h3>
                                        {riskText}
                                    </h3>


                                    <p>
                                        {riskDescription}
                                    </p>


                                    <div className="risk-bars">


                                        <div>

                                            <span>
                                                Phishing Analyses
                                            </span>

                                            <div className="bar">

                                                <i
                                                    className={
                                                        phishingRisk >= 60

                                                            ? "bar-high"

                                                            : phishingRisk >= 30

                                                            ? "bar-medium"

                                                            : "bar-low"
                                                    }
                                                    style={{
                                                        width:
                                                            `${phishingRisk}%`
                                                    }}
                                                ></i>

                                            </div>

                                            <b>
                                                {
                                                    String(
                                                        phishingRisk
                                                    ).padStart(
                                                        2,
                                                        "0"
                                                    )
                                                }%
                                            </b>

                                        </div>


                                        <div>

                                            <span>
                                                High Risk Detection
                                            </span>

                                            <div className="bar">

                                                <i
                                                    className={
                                                        riskScore >= 60

                                                            ? "bar-high"

                                                            : riskScore >= 30

                                                            ? "bar-medium"

                                                            : "bar-low"
                                                    }
                                                    style={{
                                                        width:
                                                            `${calculatePercentage(
                                                                highRisk
                                                            )}%`
                                                    }}
                                                ></i>

                                            </div>

                                            <b>
                                                {
                                                    String(
                                                        calculatePercentage(
                                                            highRisk
                                                        )
                                                    ).padStart(
                                                        2,
                                                        "0"
                                                    )
                                                }%
                                            </b>

                                        </div>


                                        <div>

                                            <span>
                                                Voice Analyses
                                            </span>

                                            <div className="bar">

                                                <i
                                                    className={
                                                        voiceRisk >= 60

                                                            ? "bar-high"

                                                            : voiceRisk >= 30

                                                            ? "bar-medium"

                                                            : "bar-low"
                                                    }
                                                    style={{
                                                        width:
                                                            `${voiceRisk}%`
                                                    }}
                                                ></i>

                                            </div>

                                            <b>
                                                {
                                                    String(
                                                        voiceRisk
                                                    ).padStart(
                                                        2,
                                                        "0"
                                                    )
                                                }%
                                            </b>

                                        </div>

                                    </div>

                                </div>

                            </div>

                        </div>


                        {/* QUICK TOOLS */}

                        <div className="dashboard-panel quick-panel">


                            <div className="panel-header">

                                <div>

                                    <span className="panel-label">
                                        QUICK ACCESS
                                    </span>

                                    <h2>
                                        Security Tools
                                    </h2>

                                </div>

                            </div>


                            <div className="quick-actions">


                                <button
                                    className="quick-action"
                                    onClick={() =>
                                        navigate(
                                            "/transaction"
                                        )
                                    }
                                >

                                    <div className="quick-icon transaction">
                                        💳
                                    </div>

                                    <div>

                                        <strong>
                                            Transaction Check
                                        </strong>

                                        <span>
                                            Analyze payment risk
                                        </span>

                                    </div>

                                    <b>
                                        →
                                    </b>

                                </button>


                                <button
                                    className="quick-action"
                                    onClick={() =>
                                        navigate(
                                            "/phishing-analyzer"
                                        )
                                    }
                                >

                                    <div className="quick-icon phishing">
                                        📩
                                    </div>

                                    <div>

                                        <strong>
                                            Phishing Analyzer
                                        </strong>

                                        <span>
                                            Scan suspicious messages
                                        </span>

                                    </div>

                                    <b>
                                        →
                                    </b>

                                </button>


                                <button
                                    className="quick-action"
                                    onClick={() =>
                                        navigate(
                                            "/voice-analyzer"
                                        )
                                    }
                                >

                                    <div className="quick-icon voice">
                                        🎙️
                                    </div>

                                    <div>

                                        <strong>
                                            Voice Analyzer
                                        </strong>

                                        <span>
                                            Detect scam indicators
                                        </span>

                                    </div>

                                    <b>
                                        →
                                    </b>

                                </button>

                            </div>

                        </div>

                    </section>


                    {/* RECENT ACTIVITY */}

                    <section className="dashboard-panel activity-panel">


                        <div className="panel-header">

                            <div>

                                <span className="panel-label">
                                    LIVE MONITORING
                                </span>

                                <h2>
                                    Recent Security Activity
                                </h2>

                            </div>


                            <div className="activity-header-actions">

                                <button
                                    className="clear-activity-btn"
                                    onClick={clearAllActivity}
                                    disabled={recentActivities.length === 0}
                                >
                                    🗑 Clear All
                                </button>


                                <div className="activity-live">

                                    <span></span>

                                    Monitoring Live

                                </div>

                            </div>

                        </div>


                        <div className="activity-list">


                            {

                                recentActivities.length === 0

                                    ? (

                                        <div className="empty-dashboard-activity">

                                            <div>
                                                🛡️
                                            </div>

                                            <h3>
                                                No Security Activity Yet
                                            </h3>

                                            <p>
                                                Analyze a transaction,
                                                phishing message or voice
                                                recording to see real activity
                                                here.
                                            </p>

                                        </div>

                                    )

                                    : (

                                        recentActivities.map(
                                            (activity, index) => {

                                                const risk =
                                                    String(
                                                        activity.riskLevel ||
                                                        "LOW"
                                                    ).toUpperCase();


                                                return (

                                                    <div
                                                        className="activity-item"
                                                        key={
                                                            activity.id ||
                                                            activity._id ||
                                                            index
                                                        }
                                                    >

                                                        <div
                                                            className={
                                                                `activity-icon ${
                                                                    risk.toLowerCase()
                                                                }`
                                                            }
                                                        >

                                                            {
                                                                activity.icon ||
                                                                getActivityIcon(
                                                                    activity.type
                                                                )
                                                            }

                                                        </div>


                                                        <div className="activity-content">

                                                            <strong>

                                                                {
                                                                    activity.title ||
                                                                    "Security analysis completed"
                                                                }

                                                            </strong>


                                                            <span>

                                                                {
                                                                    activity.description ||
                                                                    "AI analyzed security activity."
                                                                }

                                                            </span>

                                                        </div>


                                                        <div className="activity-right">

                                                            <span
                                                                className={
                                                                    `activity-risk ${
                                                                        risk.toLowerCase()
                                                                    }`
                                                                }
                                                            >
                                                                {risk}
                                                            </span>


                                                            <small>

                                                                {
                                                                    formatTime(
                                                                        activity.createdAt
                                                                    )
                                                                }

                                                            </small>

                                                        </div>

                                                    </div>

                                                );

                                            }
                                        )

                                    )

                            }

                        </div>

                    </section>


                    {/* FOOTER */}

                    <div className="dashboard-footer-status">


                        <div>

                            <span className="footer-status-dot"></span>

                            DhanRakshak AI Engine Online

                        </div>


                        <span>

                            Threats detected:
                            {" "}
                            {detectedThreats}

                            {" • "}

                            Detection rate:
                            {" "}
                            {detectionRate}%

                            {" • "}

                            Last update:
                            {" "}

                            {
                                dashboardData?.lastUpdated

                                    ? formatTime(
                                        dashboardData.lastUpdated
                                    )

                                    : "Just now"

                            }

                        </span>

                    </div>


                </main>

            </div>

        </>

    );

}


export default Dashboard;