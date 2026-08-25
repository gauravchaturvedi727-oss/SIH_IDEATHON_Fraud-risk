import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import { toast } from "react-toastify";
import Navbar from "../components/Navbar";
import "./Transaction.css";

function Transaction() {

  // ==========================================
  // FORM STATE
  // ==========================================

  const [form, setForm] = useState({
    amount: "",
    recipientUPI: "",
    recipientName: "",

    newDevice: false,
    newLocation: false,

    rapidTransactions: 0,
    failedLogins: 0,
    otpRequests: 0,

    coercionDetected: false,
    voicePhishingDetected: false,
    urgentPayment: false,
  });


  // ==========================================
  // RESULT STATE
  // ==========================================

  const [result, setResult] = useState(null);

  const [loading, setLoading] = useState(false);

  const [paymentLoading, setPaymentLoading] =
    useState(false);


  // ==========================================
  // HANDLE INPUT CHANGE
  // ==========================================

  const handleChange = (e) => {

    const {
      name,
      value,
      type,
      checked,
    } = e.target;


    setForm((prev) => ({

      ...prev,

      [name]:
        type === "checkbox"
          ? checked
          : value,

    }));

  };


  // ==========================================
  // NORMALIZE BACKEND TRANSACTION
  // Supports camelCase and snake_case responses
  // ==========================================

  const normalizeTransaction = (transaction) => {

    if (!transaction) {
      return null;
    }


    return {

      ...transaction,

      riskScore:
        transaction.riskScore ??
        transaction.risk_score ??
        0,

      riskLevel:
        transaction.riskLevel ??
        transaction.risk_level ??
        "LOW",

      mlProbability:
        transaction.mlProbability ??
        transaction.fraudProbability ??
        transaction.fraud_probability ??
        0,

      recommendedAction:
        transaction.recommendedAction ??
        transaction.recommended_action ??
        "Verify transaction details before proceeding.",

      reasons:
        Array.isArray(transaction.reasons)
          ? transaction.reasons
          : [],

      paymentStatus:
        transaction.paymentStatus ??
        transaction.payment_status ??
        "PENDING_CONFIRMATION",

    };

  };


  // ==========================================
  // ANALYZE TRANSACTION
  // ==========================================

  const analyzeTransaction = async (e) => {

    e.preventDefault();


    const amount =
      Number(form.amount);


    // ========================================
    // VALIDATE AMOUNT
    // ========================================

    if (
      !form.amount ||
      Number.isNaN(amount) ||
      amount <= 0
    ) {

      toast.error(
        "Please enter a valid transaction amount"
      );

      return;

    }


    // ========================================
    // VALIDATE UPI
    // ========================================

    if (
      !form.recipientUPI.trim()
    ) {

      toast.error(
        "Please enter recipient UPI ID"
      );

      return;

    }


    try {

      setLoading(true);

      setResult(null);


      // ======================================
      // PAYLOAD
      // ======================================

      const payload = {

        amount,

        recipientUPI:
          form.recipientUPI
            .trim()
            .toLowerCase(),

        recipientName:
          form.recipientName.trim(),

        newDevice:
          Boolean(form.newDevice),

        newLocation:
          Boolean(form.newLocation),

        rapidTransactions:
          Math.max(
            0,
            Number(form.rapidTransactions) || 0
          ),

        failedLogins:
          Math.max(
            0,
            Number(form.failedLogins) || 0
          ),

        otpRequests:
          Math.max(
            0,
            Number(form.otpRequests) || 0
          ),

        coercionDetected:
          Boolean(form.coercionDetected),

        voicePhishingDetected:
          Boolean(form.voicePhishingDetected),

        urgentPayment:
          Boolean(form.urgentPayment),

      };


      console.log(
        "SENDING TRANSACTION:",
        payload
      );


      // ======================================
      // API CALL
      // ======================================

      const response =
        await api.post(
          "/transactions",
          payload
        );


      console.log(
        "TRANSACTION RESPONSE:",
        response.data
      );


      if (
        !response.data?.success
      ) {

        throw new Error(
          response.data?.message ||
          "Transaction analysis failed"
        );

      }


      // ======================================
      // SUPPORT MULTIPLE BACKEND FORMATS
      // ======================================

      const transactionData =

        response.data.transaction ||

        response.data.data ||

        (
          response.data.riskScore !== undefined
            ? response.data
            : null
        );


      if (!transactionData) {

        throw new Error(
          "Transaction result was not received"
        );

      }


      const normalizedTransaction =
        normalizeTransaction(
          transactionData
        );


      setResult(
        normalizedTransaction
      );


      toast.success(
        "AI Risk Assessment Complete!"
      );

    }
    catch (error) {

      console.error(
        "TRANSACTION ANALYSIS ERROR:",
        error.response?.data ||
        error.message
      );


      toast.error(

        error.response?.data?.message ||

        error.message ||

        "Transaction analysis failed"

      );

    }
    finally {

      setLoading(false);

    }

  };


  // ==========================================
  // CONFIRM PAYMENT
  // ==========================================

  const confirmPayment = async () => {

    if (!result?._id) {

      toast.error(
        "Transaction ID not found"
      );

      return;

    }


    try {

      setPaymentLoading(true);


      const response =
        await api.put(
          `/transactions/${result._id}/confirm`
        );


      if (
        !response.data?.success
      ) {

        throw new Error(
          response.data?.message ||
          "Payment confirmation failed"
        );

      }


      const updatedTransaction =

        response.data.transaction ||

        response.data.data ||

        null;


      if (updatedTransaction) {

        setResult(
          normalizeTransaction(
            updatedTransaction
          )
        );

      }
      else {

        setResult((prev) => ({

          ...prev,

          paymentStatus:
            "COMPLETED",

        }));

      }


      toast.success(
        "UPI Payment Completed Successfully!"
      );

    }
    catch (error) {

      console.error(
        "CONFIRM PAYMENT ERROR:",
        error.response?.data ||
        error.message
      );


      toast.error(

        error.response?.data?.message ||

        error.message ||

        "Failed to confirm payment"

      );

    }
    finally {

      setPaymentLoading(false);

    }

  };


  // ==========================================
  // CANCEL PAYMENT
  // ==========================================

  const cancelPayment = async () => {

    if (!result?._id) {

      toast.error(
        "Transaction ID not found"
      );

      return;

    }


    try {

      setPaymentLoading(true);


      const response =
        await api.put(
          `/transactions/${result._id}/cancel`
        );


      if (
        !response.data?.success
      ) {

        throw new Error(
          response.data?.message ||
          "Payment cancellation failed"
        );

      }


      const updatedTransaction =

        response.data.transaction ||

        response.data.data ||

        null;


      if (updatedTransaction) {

        setResult(
          normalizeTransaction(
            updatedTransaction
          )
        );

      }
      else {

        setResult((prev) => ({

          ...prev,

          paymentStatus:
            "CANCELLED",

        }));

      }


      toast.info(
        "UPI Payment Cancelled"
      );

    }
    catch (error) {

      console.error(
        "CANCEL PAYMENT ERROR:",
        error.response?.data ||
        error.message
      );


      toast.error(

        error.response?.data?.message ||

        error.message ||

        "Failed to cancel payment"

      );

    }
    finally {

      setPaymentLoading(false);

    }

  };


  // ==========================================
  // RESET FORM
  // ==========================================

  const resetForm = () => {

    setForm({

      amount: "",
      recipientUPI: "",
      recipientName: "",

      newDevice: false,
      newLocation: false,

      rapidTransactions: 0,
      failedLogins: 0,
      otpRequests: 0,

      coercionDetected: false,
      voicePhishingDetected: false,
      urgentPayment: false,

    });


    setResult(null);


    toast.info(
      "Transaction parameters reset"
    );

  };


  // ==========================================
  // NORMALIZE RISK SCORE
  // ==========================================

  const riskScoreNum =
    Math.min(
      Math.max(
        Number(
          result?.riskScore ??
          result?.risk_score ??
          0
        ),
        0
      ),
      100
    );


  // ==========================================
  // CIRCULAR GAUGE
  // ==========================================

  const circumference =
    2 * Math.PI * 50;


  const strokeOffset =
    circumference -
    (
      circumference *
      riskScoreNum
    ) / 100;


  // ==========================================
  // RISK LEVEL
  // ==========================================

  const riskLevel =
    String(
      result?.riskLevel ??
      result?.risk_level ??
      "LOW"
    ).toUpperCase();


  // Critical uses high CSS styling
  const riskLevelClass =
    riskLevel === "CRITICAL"
      ? "high"
      : riskLevel.toLowerCase();


  // ==========================================
  // ML PROBABILITY
  // Supports:
  // mlProbability
  // fraudProbability
  // fraud_probability
  // ==========================================

  let rawProbability =
    Number(

      result?.mlProbability ??

      result?.fraudProbability ??

      result?.fraud_probability ??

      0

    );


  let probabilityPercent;


  if (
    rawProbability <= 1
  ) {

    probabilityPercent =
      rawProbability * 100;

  }
  else {

    probabilityPercent =
      rawProbability;

  }


  probabilityPercent =
    Math.min(
      Math.max(
        probabilityPercent,
        0
      ),
      100
    );


  // ==========================================
  // REASONS
  // ==========================================

  const reasons =
    Array.isArray(result?.reasons)
      ? result.reasons
      : [];


  // ==========================================
  // PAYMENT STATUS
  // ==========================================

  const paymentStatus =
    result?.paymentStatus ??
    result?.payment_status ??
    "PENDING_CONFIRMATION";


  // ==========================================
  // LIVE ROBOT MESSAGE
  // ==========================================

  let robotMessage =
    "SYSTEM READY — ENTER UPI PAYMENT DETAILS TO BEGIN ANALYSIS";


  if (loading) {

    robotMessage =
      "AI ENGINE ANALYZING PAYMENT BEHAVIOUR AND FRAUD SIGNALS...";

  }
  else if (
    result &&
    paymentStatus === "PENDING_CONFIRMATION"
  ) {

    robotMessage =
      `RISK SCORE ${riskScoreNum.toFixed(0)}/100 — REVIEW SECURITY WARNING BEFORE PAYMENT`;

  }
  else if (
    paymentStatus === "COMPLETED"
  ) {

    robotMessage =
      "PAYMENT CONFIRMED — TRANSACTION COMPLETED SUCCESSFULLY";

  }
  else if (
    paymentStatus === "CANCELLED"
  ) {

    robotMessage =
      "PAYMENT CANCELLED — NO FURTHER ACTION REQUIRED";

  }


  return (

    <>

      <Navbar />


      <main className="transaction-page">


        {/* BACKGROUND */}

        <div className="tx-grid"></div>

        <div className="tx-glow tx-glow-one"></div>

        <div className="tx-glow tx-glow-two"></div>


        <div className="tx-container">


          {/* =====================================
              HEADER
          ====================================== */}

          <header className="page-title">


            <Link
              to="/"
              className="back-link"
            >

              <span>←</span>

              Back to Dashboard

            </Link>


            <div className="title-heading-group">


              <span className="tx-badge">

                <span className="badge-dot"></span>

                ML FRAUD DETECTION ENGINE

              </span>


              <h1>

                UPI Payment Risk Analysis

              </h1>


              <p>

                Analyze UPI payments using behavioural,
                device, location and social engineering
                fraud signals before confirming payment.

              </p>


            </div>


          </header>


          {/* =====================================
              ROBOT LIVE BOARD
          ====================================== */}

          <div className="robot-banner-card">


            <div className="robot-character">


              <div className="robot-antenna">

                <div className="antenna-bulb"></div>

              </div>


              <div className="robot-head">

                <div className="robot-visor">

                  <span className="robot-eye"></span>

                  <span className="robot-eye"></span>

                </div>

              </div>


              <div className="robot-arm left"></div>

              <div className="robot-arm right"></div>


              <div className="robot-body">

                <div className="robot-core-light"></div>

              </div>


            </div>


            <div className="robot-signboard">


              <div className="signboard-top-bar">

                <span className="status-indicator"></span>

                DhanRakshak AI LIVE MONITOR

                <span className="live-pill">

                  LIVE

                </span>

              </div>


              <div className="signboard-ticker-text">

                <span className="typewriter-icon">

                  🤖

                </span>

                <p>

                  {robotMessage}

                </p>

              </div>


            </div>


          </div>


          {/* =====================================
              MAIN LAYOUT
          ====================================== */}

          <div className="transaction-layout">


            {/* LEFT FORM */}

            <form
              className="transaction-form"
              onSubmit={analyzeTransaction}
            >


              <div className="form-section-title">

                <span>

                  01 // UPI PAYMENT TELEMETRY

                </span>

                <h3>

                  Payment & Security Details

                </h3>

              </div>


              {/* AMOUNT */}

              <div className="tx-input-group">

                <label htmlFor="amount">

                  Transaction Amount (INR)

                  <span className="req">*</span>

                </label>


                <div className="tx-input-wrapper">

                  <span className="input-prefix">

                    ₹

                  </span>


                  <input
                    id="amount"
                    name="amount"
                    type="number"
                    min="1"
                    step="any"
                    placeholder="e.g. 75000"
                    value={form.amount}
                    onChange={handleChange}
                    disabled={loading}
                    required
                  />

                </div>

              </div>


              {/* RECIPIENT UPI */}

              <div className="tx-input-group">

                <label htmlFor="recipientUPI">

                  Recipient UPI ID

                  <span className="req">*</span>

                </label>


                <div className="tx-input-wrapper">

                  <span className="input-prefix">

                    @

                  </span>


                  <input
                    id="recipientUPI"
                    name="recipientUPI"
                    type="text"
                    placeholder="example@upi"
                    value={form.recipientUPI}
                    onChange={handleChange}
                    disabled={loading}
                    required
                  />

                </div>

              </div>


              {/* RECIPIENT NAME */}

              <div className="tx-input-group">

                <label htmlFor="recipientName">

                  Recipient Name

                  <span className="optional-label">

                    Optional

                  </span>

                </label>


                <div className="tx-input-wrapper">

                  <span className="input-prefix">

                    👤

                  </span>


                  <input
                    id="recipientName"
                    name="recipientName"
                    type="text"
                    placeholder="e.g. Rahul Kumar"
                    value={form.recipientName}
                    onChange={handleChange}
                    disabled={loading}
                  />

                </div>

              </div>


              {/* DEVICE & LOCATION */}

              <div className="tx-input-group">

                <label>

                  Device & Location Signals

                </label>


                <div className="checkbox-group">


                  <label
                    className={`checkbox-card ${
                      form.newDevice
                        ? "checked"
                        : ""
                    }`}
                  >

                    <input
                      name="newDevice"
                      type="checkbox"
                      checked={form.newDevice}
                      onChange={handleChange}
                      disabled={loading}
                    />


                    <div className="checkbox-indicator">

                      <span className="check-icon">

                        {form.newDevice
                          ? "✓"
                          : "+"}

                      </span>

                    </div>


                    <div className="checkbox-meta">

                      <strong>

                        New Device

                      </strong>

                      <small>

                        Unrecognized device

                      </small>

                    </div>

                  </label>


                  <label
                    className={`checkbox-card ${
                      form.newLocation
                        ? "checked"
                        : ""
                    }`}
                  >

                    <input
                      name="newLocation"
                      type="checkbox"
                      checked={form.newLocation}
                      onChange={handleChange}
                      disabled={loading}
                    />


                    <div className="checkbox-indicator">

                      <span className="check-icon">

                        {form.newLocation
                          ? "✓"
                          : "+"}

                      </span>

                    </div>


                    <div className="checkbox-meta">

                      <strong>

                        New Location

                      </strong>

                      <small>

                        Geo anomaly detected

                      </small>

                    </div>

                  </label>


                </div>

              </div>


              {/* COUNTERS */}

              <div className="tx-counters-grid">


                <div className="tx-input-group">

                  <label htmlFor="rapidTransactions">

                    Rapid Transactions

                  </label>


                  <div className="tx-input-wrapper">

                    <span className="input-prefix">

                      ⚡

                    </span>


                    <input
                      id="rapidTransactions"
                      name="rapidTransactions"
                      type="number"
                      min="0"
                      value={form.rapidTransactions}
                      onChange={handleChange}
                      disabled={loading}
                    />

                  </div>

                </div>


                <div className="tx-input-group">

                  <label htmlFor="failedLogins">

                    Failed Logins

                  </label>


                  <div className="tx-input-wrapper">

                    <span className="input-prefix">

                      🔒

                    </span>


                    <input
                      id="failedLogins"
                      name="failedLogins"
                      type="number"
                      min="0"
                      value={form.failedLogins}
                      onChange={handleChange}
                      disabled={loading}
                    />

                  </div>

                </div>


                <div className="tx-input-group">

                  <label htmlFor="otpRequests">

                    OTP Requests

                  </label>


                  <div className="tx-input-wrapper">

                    <span className="input-prefix">

                      📲

                    </span>


                    <input
                      id="otpRequests"
                      name="otpRequests"
                      type="number"
                      min="0"
                      value={form.otpRequests}
                      onChange={handleChange}
                      disabled={loading}
                    />

                  </div>

                </div>


              </div>


              {/* SOCIAL ENGINEERING */}

              <div className="tx-input-group">

                <label>

                  Scam / Social Engineering Signals

                </label>


                <div className="checkbox-group">


                  <label
                    className={`checkbox-card ${
                      form.coercionDetected
                        ? "checked"
                        : ""
                    }`}
                  >

                    <input
                      name="coercionDetected"
                      type="checkbox"
                      checked={form.coercionDetected}
                      onChange={handleChange}
                      disabled={loading}
                    />


                    <div className="checkbox-indicator">

                      <span className="check-icon">

                        {form.coercionDetected
                          ? "✓"
                          : "+"}

                      </span>

                    </div>


                    <div className="checkbox-meta">

                      <strong>

                        Pressure Detected

                      </strong>

                      <small>

                        Someone is forcing payment

                      </small>

                    </div>

                  </label>


                  <label
                    className={`checkbox-card ${
                      form.voicePhishingDetected
                        ? "checked"
                        : ""
                    }`}
                  >

                    <input
                      name="voicePhishingDetected"
                      type="checkbox"
                      checked={form.voicePhishingDetected}
                      onChange={handleChange}
                      disabled={loading}
                    />


                    <div className="checkbox-indicator">

                      <span className="check-icon">

                        {form.voicePhishingDetected
                          ? "✓"
                          : "+"}

                      </span>

                    </div>


                    <div className="checkbox-meta">

                      <strong>

                        Scam Call

                      </strong>

                      <small>

                        Possible voice phishing

                      </small>

                    </div>

                  </label>


                  <label
                    className={`checkbox-card ${
                      form.urgentPayment
                        ? "checked"
                        : ""
                    }`}
                  >

                    <input
                      name="urgentPayment"
                      type="checkbox"
                      checked={form.urgentPayment}
                      onChange={handleChange}
                      disabled={loading}
                    />


                    <div className="checkbox-indicator">

                      <span className="check-icon">

                        {form.urgentPayment
                          ? "✓"
                          : "+"}

                      </span>

                    </div>


                    <div className="checkbox-meta">

                      <strong>

                        Urgent Payment

                      </strong>

                      <small>

                        Payment requested immediately

                      </small>

                    </div>

                  </label>


                </div>

              </div>


              {/* BUTTONS */}

              <div className="form-buttons">


                <button
                  type="submit"
                  className="primary-btn"
                  disabled={loading || paymentLoading}
                >

                  {loading ? (

                    <>

                      <span className="tx-loader"></span>

                      AI Analyzing Risk...

                    </>

                  ) : (

                    <>

                      <span>🛡️</span>

                      Analyze Payment Risk

                    </>

                  )}

                </button>


                <button
                  type="button"
                  className="secondary-btn"
                  onClick={resetForm}
                  disabled={loading || paymentLoading}
                >

                  ↻ Reset

                </button>


              </div>


            </form>


            {/* RIGHT RESULT CARD */}

            <div className="result-card">


              {!result ? (

                <div className="result-empty">


                  <div className="shield-empty-core">

                    <span className="shield-icon">

                      🛡️

                    </span>

                    <div className="pulse-ring"></div>

                  </div>


                  <h2>

                    Awaiting Payment Data

                  </h2>


                  <p>

                    Enter UPI payment and security
                    information to trigger the AI
                    fraud risk analysis.

                  </p>


                  <div className="telemetry-ready-pill">

                    <span className="dot"></span>

                    READY FOR ANALYSIS

                  </div>


                </div>

              ) : (

                <div
                  className={`result-content-wrapper ${riskLevelClass}`}
                >


                  {/* GAUGE */}

                  <div className="result-top">


                    <div className="gauge-wrapper">


                      <svg
                        viewBox="0 0 120 120"
                        className="gauge-svg"
                      >

                        <circle
                          className="gauge-bg"
                          cx="60"
                          cy="60"
                          r="50"
                        />


                        <circle
                          className={`gauge-progress ${riskLevelClass}`}
                          cx="60"
                          cy="60"
                          r="50"
                          style={{
                            strokeDasharray:
                              circumference,

                            strokeDashoffset:
                              strokeOffset,
                          }}
                        />

                      </svg>


                      <div className="gauge-text">

                        <strong>

                          {riskScoreNum.toFixed(0)}

                        </strong>

                        <small>

                          /100

                        </small>

                      </div>


                    </div>


                    <div className="result-status-meta">


                      <span className="meta-label">

                        CLASSIFICATION LEVEL

                      </span>


                      <span
                        className={`large-badge ${riskLevelClass}`}
                      >

                        <span className="dot"></span>

                        {riskLevel} RISK

                      </span>


                      <span className="meta-label">

                        PAYMENT:{" "}

                        {String(paymentStatus)
                          .replaceAll("_", " ")}

                      </span>


                    </div>


                  </div>


                  {/* ACTION */}

                  <div
                    className={`action-box ${riskLevelClass}`}
                  >

                    <div className="action-header">

                      <span className="action-tag">

                        AI ACTION DIRECTIVE

                      </span>


                      <strong>

                        {result.recommendedAction ||
                          result.recommended_action ||
                          "Verify transaction details before proceeding."}

                      </strong>

                    </div>

                  </div>


                  {/* REASONS */}

                  <div className="reasons">


                    <h3>

                      Risk Breakdown & Signals

                    </h3>


                    <div className="reasons-list">


                      {reasons.length > 0 ? (

                        reasons.map(
                          (reason, index) => (

                            <div
                              className={`reason ${riskLevelClass}`}
                              key={index}
                            >

                              <span className="reason-icon">

                                !

                              </span>


                              <p>

                                {reason}

                              </p>

                            </div>

                          )
                        )

                      ) : (

                        <div className="reason safe">

                          <span className="reason-icon">

                            ✓

                          </span>

                          <p>

                            No major anomaly signals detected.

                          </p>

                        </div>

                      )}

                    </div>


                  </div>


                  {/* ML PROBABILITY */}

                  <div className="ml-info">


                    <div className="ml-info-item">

                      <span>

                        ML Fraud Probability

                      </span>

                      <strong>

                        {probabilityPercent.toFixed(2)}%

                      </strong>

                    </div>


                    <div className="ml-progress-track">

                      <div
                        className={`ml-progress-bar ${riskLevelClass}`}
                        style={{
                          width:
                            `${probabilityPercent}%`
                        }}
                      ></div>

                    </div>

                  </div>


                  {/* PAYMENT ACTIONS */}

                  {paymentStatus ===
                    "PENDING_CONFIRMATION" && (

                    <div className="payment-actions">


                      <button
                        type="button"
                        className="confirm-payment-btn"
                        onClick={confirmPayment}
                        disabled={paymentLoading}
                      >

                        {paymentLoading
                          ? "Processing..."
                          : "✓ Confirm Payment"}

                      </button>


                      <button
                        type="button"
                        className="cancel-payment-btn"
                        onClick={cancelPayment}
                        disabled={paymentLoading}
                      >

                        ✕ Cancel Payment

                      </button>


                    </div>

                  )}


                  {/* COMPLETED */}

                  {paymentStatus ===
                    "COMPLETED" && (

                    <div className="payment-completed">

                      ✓ PAYMENT COMPLETED

                    </div>

                  )}


                  {/* CANCELLED */}

                  {paymentStatus ===
                    "CANCELLED" && (

                    <div className="payment-cancelled">

                      ✕ PAYMENT CANCELLED

                    </div>

                  )}


                </div>

              )}


            </div>


          </div>


        </div>


      </main>

    </>

  );

}


export default Transaction;
