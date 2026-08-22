import { useState } from "react";
import api from "../services/api";
import "./PhishingAnalyzer.css";
import Navbar from "../components/Navbar";

function PhishingAnalyzer() {

    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [result, setResult] = useState(null);


    // =========================================
    // ANALYZE MESSAGE
    // =========================================

    const handleAnalyze = async () => {

        if (!message.trim()) {

            setError(
                "Please enter a message before analyzing."
            );

            return;
        }


        try {

            setLoading(true);

            setError("");

            setResult(null);


            // =====================================
            // API CALL
            // api.js automatically sends JWT token
            // =====================================

            const response = await api.post(

                "/phishing/analyze",

                {
                    text: message.trim()
                }

            );


            console.log(
                "PHISHING RESPONSE:",
                response.data
            );


            setResult(
                response.data
            );

        }
        catch (err) {

            console.error(
                "PHISHING ERROR:",
                err.response?.data || err.message
            );


            setError(

                err.response?.data?.message ||

                "Unable to analyze the message. Please try again."

            );

        }
        finally {

            setLoading(false);

        }

    };


    // =========================================
    // RESET
    // =========================================

    const handleReset = () => {

        setMessage("");

        setResult(null);

        setError("");

    };


    // =========================================
    // GET RISK CLASS
    // =========================================

    const getRiskClass = () => {

        if (!result) {

            return "";

        }


        const level = String(

            result.riskLevel ||

            "LOW"

        ).toLowerCase();


        if (level === "high") {

            return "high";

        }


        if (level === "medium") {

            return "medium";

        }


        return "low";

    };


    // =========================================
    // RESULT DATA
    // =========================================

    const riskLevel =
        result?.riskLevel || "LOW";


    const riskScore =
        Number(
            result?.riskScore || 0
        );


    const reasons =
        Array.isArray(result?.reasons)
            ? result.reasons
            : [];


    const recommendedAction =
        result?.recommendedAction ||
        "Continue to remain cautious with unknown messages.";


    // =========================================
    // JSX
    // =========================================

    return (

        <>

            <Navbar />


            <div className="phishing-page">


                <div className="phishing-grid"></div>

                <div className="phishing-glow phishing-glow-one"></div>

                <div className="phishing-glow phishing-glow-two"></div>


                <div className="phishing-container">


                    {/* =========================================
                        HERO
                    ========================================= */}

                    <section className="phishing-hero">


                        <div className="security-badge">

                            <span className="badge-pulse"></span>

                            AI POWERED SECURITY

                        </div>


                        <h1>

                            Phishing & Scam

                            <span> Analyzer</span>

                        </h1>


                        <p>

                            Detect suspicious messages, scam patterns,
                            phishing attempts, and social engineering
                            indicators using intelligent AI-powered analysis.

                        </p>


                    </section>


                    {/* =========================================
                        ANALYZER CARD
                    ========================================= */}

                    <section className="analyzer-card">


                        <div className="analyzer-header">


                            <div className="analyzer-title">


                                <div className="analyzer-icon">

                                    🛡️

                                </div>


                                <div>

                                    <span className="section-label">

                                        MESSAGE INSPECTION

                                    </span>


                                    <h2>

                                        Analyze suspicious content

                                    </h2>


                                    <p>

                                        Paste a message below and let the AI
                                        identify potential fraud signals.

                                    </p>

                                </div>


                            </div>


                            <div className="system-status">

                                <span></span>

                                SYSTEM READY

                            </div>


                        </div>


                        {/* =========================================
                            TEXTAREA
                        ========================================= */}

                        <div className="message-area">


                            <div className="input-heading">


                                <label htmlFor="message">

                                    Message to Analyze

                                </label>


                                <span>

                                    Secure Input

                                </span>


                            </div>


                            <div className="textarea-wrapper">


                                <textarea

                                    id="message"

                                    value={message}

                                    onChange={(e) => {

                                        setMessage(
                                            e.target.value
                                        );

                                        setError("");

                                    }}

                                    placeholder="Paste a suspicious SMS, WhatsApp message, email, or conversation here..."

                                />


                                <div className="textarea-corner">

                                    ◈

                                </div>


                            </div>


                            <div className="message-meta">


                                <span>

                                    {message.length} characters

                                </span>


                                <span className="ai-secure">

                                    ✦ AI Security Scan Enabled

                                </span>


                            </div>


                        </div>


                        {/* =========================================
                            ERROR
                        ========================================= */}

                        {error && (

                            <div className="phishing-error">


                                <div className="error-icon">

                                    !

                                </div>


                                <span>

                                    {error}

                                </span>


                            </div>

                        )}


                        {/* =========================================
                            BUTTONS
                        ========================================= */}

                        <div className="phishing-actions">


                            <button

                                type="button"

                                className="analyze-btn"

                                onClick={handleAnalyze}

                                disabled={loading}

                            >

                                {loading ? (

                                    <>

                                        <span className="button-loader"></span>

                                        Analyzing Threat...

                                    </>

                                ) : (

                                    <>

                                        <span className="button-icon">

                                            🔍

                                        </span>


                                        Analyze Message


                                        <span className="button-arrow">

                                            →

                                        </span>

                                    </>

                                )}

                            </button>


                            <button

                                type="button"

                                className="reset-btn"

                                onClick={handleReset}

                                disabled={loading}

                            >

                                ↻ Reset

                            </button>


                        </div>


                    </section>


                    {/* =========================================
                        LOADING
                    ========================================= */}

                    {loading && (

                        <section className="analysis-loading">


                            <div className="scanner-box">

                                <div className="scanner-line"></div>

                                <span>

                                    AI

                                </span>

                            </div>


                            <div>


                                <h3>

                                    Scanning security signals

                                </h3>


                                <p>

                                    Detecting suspicious patterns, urgency,
                                    financial requests and phishing indicators...

                                </p>


                            </div>


                        </section>

                    )}


                    {/* =========================================
                        RESULT
                    ========================================= */}

                    {result && !loading && (

                        <section
                            className={`analysis-result ${getRiskClass()}`}
                        >


                            <div className="result-header">


                                <div>


                                    <span className="section-label">

                                        ANALYSIS COMPLETE

                                    </span>


                                    <h2>

                                        Threat Assessment

                                    </h2>


                                </div>


                                <div
                                    className={`risk-badge ${getRiskClass()}`}
                                >

                                    <span></span>

                                    {String(riskLevel).toUpperCase()} RISK

                                </div>


                            </div>


                            {/* SCORE */}

                            <div className="score-panel">


                                <div className="score-top">


                                    <div>


                                        <span className="score-label">

                                            AI RISK SCORE

                                        </span>


                                        <div className="score-value">

                                            {riskScore}

                                            <small>

                                                /100

                                            </small>

                                        </div>


                                    </div>


                                    <div className="score-status">


                                        <span>

                                            Analysis Status

                                        </span>


                                        <strong>

                                            AI Verified

                                        </strong>


                                    </div>


                                </div>


                                <div className="score-progress">


                                    <div

                                        className={`score-fill ${getRiskClass()}`}

                                        style={{

                                            width: `${Math.min(
                                                Math.max(
                                                    riskScore,
                                                    0
                                                ),
                                                100
                                            )}%`

                                        }}

                                    ></div>


                                </div>


                            </div>


                            {/* =========================================
                                REASONS
                            ========================================= */}

                            <div className="reasons-panel">


                                <div className="reasons-heading">


                                    <div>


                                        <h3>

                                            Detected Security Signals

                                        </h3>


                                        <p>

                                            AI identified the following
                                            indicators.

                                        </p>


                                    </div>


                                    <span className="signal-count">

                                        {reasons.length} SIGNALS

                                    </span>


                                </div>


                                <div className="reasons-list">


                                    {reasons.length > 0 ? (

                                        reasons.map(
                                            (reason, index) => (

                                                <div
                                                    className="reason-item"
                                                    key={index}
                                                >


                                                    <div className="reason-index">

                                                        {String(
                                                            index + 1
                                                        ).padStart(
                                                            2,
                                                            "0"
                                                        )}

                                                    </div>


                                                    <div>


                                                        <span>

                                                            DETECTED SIGNAL

                                                        </span>


                                                        <p>

                                                            {reason}

                                                        </p>


                                                    </div>


                                                </div>

                                            )
                                        )

                                    ) : (

                                        <div className="no-reasons">


                                            <span>

                                                ✓

                                            </span>


                                            <p>

                                                No major suspicious
                                                indicators were detected.

                                            </p>


                                        </div>

                                    )}


                                </div>


                            </div>


                            {/* =========================================
                                RECOMMENDATION
                            ========================================= */}

                            <div
                                className={`recommendation ${getRiskClass()}`}
                            >


                                <div className="recommendation-icon">

                                    ⚡

                                </div>


                                <div>


                                    <span>

                                        RECOMMENDED ACTION

                                    </span>


                                    <strong>

                                        {recommendedAction}

                                    </strong>


                                </div>


                            </div>


                        </section>

                    )}


                </div>


            </div>

        </>

    );

}


export default PhishingAnalyzer;