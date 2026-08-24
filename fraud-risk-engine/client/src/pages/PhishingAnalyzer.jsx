import { useState } from "react";
import api from "../services/api";
import "./PhishingAnalyzer.css";
import Navbar from "../components/Navbar";

function PhishingAnalyzer() {
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [result, setResult] = useState(null);

    // =====================================
    // ANALYZE MESSAGE
    // =====================================

    const handleAnalyze = async () => {
        const cleanMessage = message.trim();

        if (!cleanMessage) {
            setError("Please enter a message before analyzing.");
            setResult(null);
            return;
        }

        try {
            setLoading(true);
            setError("");
            setResult(null);

            console.log("SENDING MESSAGE:", cleanMessage);

            const response = await api.post(
                "/phishing/analyze",
                {
                    text: cleanMessage
                },
                {
                    headers: {
                        "Content-Type": "application/json"
                    }
                }
            );

            console.log(
                "PHISHING RESPONSE:",
                response.data
            );

            // Important response validation
            if (!response.data) {
                throw new Error("Empty response received from server");
            }

            setResult({
                success: response.data.success,
                riskScore: Number(response.data.riskScore ?? 0),
                riskLevel: String(
                    response.data.riskLevel || "LOW"
                ).toUpperCase(),
                reasons: Array.isArray(response.data.reasons)
                    ? response.data.reasons
                    : [],
                recommendedAction:
                    response.data.recommendedAction ||
                    "Continue to remain cautious with unknown messages."
            });
        }
        catch (err) {
            console.error(
                "PHISHING ERROR:",
                err.response?.data || err.message
            );

            setError(
                err.response?.data?.message ||
                err.message ||
                "Unable to analyze the message. Please try again."
            );
        }
        finally {
            setLoading(false);
        }
    };

    // =====================================
    // RESET
    // =====================================

    const handleReset = () => {
        setMessage("");
        setResult(null);
        setError("");
    };

    // =====================================
    // RISK CLASS
    // =====================================

    const getRiskClass = () => {
        if (!result) return "";

        const level = String(
            result.riskLevel || "LOW"
        ).toLowerCase();

        if (level === "high") return "high";
        if (level === "medium") return "medium";

        return "low";
    };

    const riskLevel = String(
        result?.riskLevel || "LOW"
    ).toUpperCase();

    const riskScore = Math.min(
        Math.max(
            Number(result?.riskScore ?? 0),
            0
        ),
        100
    );

    const reasons = Array.isArray(result?.reasons)
        ? result.reasons
        : [];

    const recommendedAction =
        result?.recommendedAction ||
        "Continue to remain cautious with unknown messages.";

    return (
        <>
            <Navbar />

            <div className="phishing-page">

                <div className="phishing-grid"></div>
                <div className="phishing-glow phishing-glow-one"></div>
                <div className="phishing-glow phishing-glow-two"></div>

                {/* ROBOT */}
                <div className="fraud-robot-scene">

                    <div className="robot-energy-ring ring-one"></div>
                    <div className="robot-energy-ring ring-two"></div>
                    <div className="robot-shadow"></div>

                    <div className="fraud-robot">

                        <div className="robot-antenna">
                            <div className="antenna-stick"></div>
                            <div className="antenna-light"></div>
                        </div>

                        <div className="robot-head">

                            <div className="robot-ear robot-ear-left">
                                <span></span>
                            </div>

                            <div className="robot-face">

                                <div className="robot-eye robot-eye-left">
                                    <span></span>
                                </div>

                                <div className="robot-eye robot-eye-right">
                                    <span></span>
                                </div>

                                <div className="robot-mouth">
                                    <span></span>
                                    <span></span>
                                    <span></span>
                                </div>

                            </div>

                            <div className="robot-ear robot-ear-right">
                                <span></span>
                            </div>

                        </div>

                        <div className="robot-neck"></div>

                        <div className="robot-body">

                            <div className="robot-shoulder-line"></div>

                            <div className="robot-chest">

                                <div className="robot-chest-core">
                                    <span className="core-dot"></span>
                                    <span className="core-pulse"></span>
                                </div>

                                <div className="robot-chest-lines">
                                    <span></span>
                                    <span></span>
                                </div>

                            </div>

                            <div className="robot-arm robot-left-arm">
                                <div className="robot-upper-arm">
                                    <span></span>
                                </div>

                                <div className="robot-elbow"></div>
                                <div className="robot-lower-arm"></div>

                                <div className="robot-hand">
                                    <span></span>
                                    <span></span>
                                </div>
                            </div>

                            <div className="robot-arm robot-right-arm">

                                <div className="robot-upper-arm">
                                    <span></span>
                                </div>

                                <div className="robot-elbow"></div>
                                <div className="robot-lower-arm"></div>

                                <div className="robot-hand">
                                    <span></span>
                                    <span></span>
                                </div>

                                <div className="fraud-notice">

                                    <div className="notice-alert-line">
                                        <span className="notice-warning">
                                            ⚠
                                        </span>

                                        <span>
                                            PHISHING ALERT
                                        </span>
                                    </div>

                                    <div className="notice-divider"></div>

                                    <div className="notice-message">
                                        SUSPICIOUS LINK
                                    </div>

                                    <div className="notice-message small">
                                        DETECTED
                                    </div>

                                    <div className="notice-status">
                                        <span></span>
                                        AI SCANNING
                                    </div>

                                </div>

                            </div>

                        </div>

                        <div className="robot-waist">
                            <span></span>
                            <span></span>
                            <span></span>
                        </div>

                        <div className="robot-legs">

                            <div className="robot-leg robot-leg-left">
                                <div className="robot-thigh">
                                    <span></span>
                                </div>

                                <div className="robot-knee">
                                    <span></span>
                                </div>

                                <div className="robot-shin"></div>
                                <div className="robot-foot"></div>
                            </div>

                            <div className="robot-leg robot-leg-right">
                                <div className="robot-thigh">
                                    <span></span>
                                </div>

                                <div className="robot-knee">
                                    <span></span>
                                </div>

                                <div className="robot-shin"></div>
                                <div className="robot-foot"></div>
                            </div>

                        </div>

                    </div>
                </div>

                {/* MAIN CONTENT */}
                <div className="phishing-container">

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

                    {/* INPUT CARD */}
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
                                    disabled={loading}
                                    onChange={(e) => {
                                        setMessage(e.target.value);
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

                        <div className="phishing-actions">

                            <button
                                type="button"
                                className="analyze-btn"
                                onClick={handleAnalyze}
                                disabled={loading || !message.trim()}
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

                    {/* LOADING */}
                    {loading && (
                        <section className="analysis-loading">

                            <div className="scanner-box">
                                <div className="scanner-line"></div>
                                <span>AI</span>
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

                    {/* RESULT */}
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
                                    {riskLevel} RISK
                                </div>

                            </div>

                            <div className="score-panel">

                                <div className="score-top">

                                    <div>

                                        <span className="score-label">
                                            AI RISK SCORE
                                        </span>

                                        <div className="score-value">
                                            {riskScore}
                                            <small>/100</small>
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
                                            width: `${riskScore}%`
                                        }}
                                    ></div>

                                </div>

                            </div>

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

                                        reasons.map((reason, index) => (
                                            <div
                                                className="reason-item"
                                                key={index}
                                            >

                                                <div className="reason-index">
                                                    {String(index + 1).padStart(2, "0")}
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
                                        ))

                                    ) : (

                                        <div className="no-reasons">

                                            <span>✓</span>

                                            <p>
                                                No major suspicious
                                                indicators were detected.
                                            </p>

                                        </div>

                                    )}

                                </div>

                            </div>

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