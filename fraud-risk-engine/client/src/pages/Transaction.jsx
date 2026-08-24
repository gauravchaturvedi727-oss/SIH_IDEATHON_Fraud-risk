import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import { toast } from "react-toastify";
import Navbar from "../components/Navbar";
import "./Transaction.css";

function Transaction() {

  const [form, setForm] = useState({
    amount: "",
    newDevice: false,
    newLocation: false,
    rapidTransactions: 0,
    failedLogins: 0,
    otpRequests: 0,
  });

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);


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
  // ANALYZE TRANSACTION
  // ==========================================

  const analyzeTransaction = async (e) => {

    e.preventDefault();


    const amount =
      Number(form.amount);


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


    try {

      setLoading(true);


      const payload = {

        amount,

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

      };


      console.log(
        "SENDING TRANSACTION:",
        payload
      );


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
        !response.data.success
      ) {

        throw new Error(
          response.data.message ||
          "Transaction analysis failed"
        );

      }


      if (
        !response.data.transaction
      ) {

        throw new Error(
          "Transaction result was not received from server"
        );

      }


      setResult(
        response.data.transaction
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
  // RESET
  // ==========================================

  const resetForm = () => {

    setForm({

      amount: "",

      newDevice: false,

      newLocation: false,

      rapidTransactions: 0,

      failedLogins: 0,

      otpRequests: 0,

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
        Number(result?.riskScore) || 0,
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
      result?.riskLevel || "LOW"
    ).toUpperCase();


  const riskLevelClass =
    riskLevel.toLowerCase();


  // ==========================================
  // NORMALIZE ML PROBABILITY
  //
  // Supports:
  // 0.85 -> 85%
  // 85   -> 85%
  // ==========================================

  let rawProbability =
    Number(
      result?.mlProbability || 0
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


  const reasons =
    Array.isArray(result?.reasons)
      ? result.reasons
      : [];


  return (

    <>

      <Navbar />


      <main className="transaction-page">


        {/* =====================================
            BACKGROUND EFFECTS
        ====================================== */}

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

                ML XGBOOST ENGINE

              </span>


              <h1>

                Transaction Risk Analysis

              </h1>


              <p>

                Analyze suspicious payment parameters,
                anomalous devices, velocity bursts,
                and authentication failures in real-time.

              </p>


            </div>


          </header>


          {/* =====================================
              MAIN LAYOUT
          ====================================== */}

          <div className="transaction-layout">


            {/* =====================================
                LEFT FORM
            ====================================== */}

            <form
              className="transaction-form"
              onSubmit={analyzeTransaction}
            >


              <div className="form-section-title">

                <span>

                  01 // TELEMETRY PARAMETERS

                </span>

                <h3>

                  Payment & Session Details

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


              {/* =====================================
                  SECURITY FLAGS
              ====================================== */}

              <div className="tx-input-group">


                <label>

                  Security Flags

                </label>


                <div className="checkbox-group">


                  {/* NEW DEVICE */}

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

                        Unrecognized fingerprint

                      </small>

                    </div>

                  </label>


                  {/* NEW LOCATION */}

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

                        IP / Geo anomaly detected

                      </small>

                    </div>

                  </label>


                </div>

              </div>


              {/* =====================================
                  COUNTERS
              ====================================== */}

              <div className="tx-counters-grid">


                {/* RAPID TRANSACTIONS */}

                <div className="tx-input-group">

                  <label htmlFor="rapidTransactions">

                    Rapid Transactions (10m)

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


                {/* FAILED LOGINS */}

                <div className="tx-input-group">

                  <label htmlFor="failedLogins">

                    Failed Login Attempts

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


                {/* OTP REQUESTS */}

                <div className="tx-input-group">

                  <label htmlFor="otpRequests">

                    OTP Requests (Session)

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


              {/* =====================================
                  BUTTONS
              ====================================== */}

              <div className="form-buttons">


                <button

                  type="submit"

                  className="primary-btn"

                  disabled={loading}

                >

                  {loading ? (

                    <>

                      <span className="tx-loader"></span>

                      Evaluating Neural Trees...

                    </>

                  ) : (

                    <>

                      <span>🛡️</span>

                      Analyze Transaction Risk

                    </>

                  )}

                </button>


                <button

                  type="button"

                  className="secondary-btn"

                  onClick={resetForm}

                  disabled={loading}

                >

                  ↻ Reset Parameters

                </button>


              </div>


            </form>


            {/* =====================================
                RIGHT RESULT CARD
            ====================================== */}

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

                    Awaiting Input Telemetry

                  </h2>


                  <p>

                    Provide payment velocity,
                    geo parameters and authentication
                    data to trigger the ML risk score.

                  </p>


                  <div className="telemetry-ready-pill">

                    <span className="dot"></span>

                    READY FOR INGESTION

                  </div>


                </div>

              ) : (

                <div
                  className={`result-content-wrapper ${riskLevelClass}`}
                >


                  {/* =====================================
                      GAUGE
                  ====================================== */}

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


                    </div>


                  </div>


                  {/* =====================================
                      ACTION
                  ====================================== */}

                  <div
                    className={`action-box ${riskLevelClass}`}
                  >


                    <div className="action-header">


                      <span className="action-tag">

                        ACTION DIRECTIVE

                      </span>


                      <strong>

                        {result.recommendedAction ||
                          "Verify transaction details before proceeding."}

                      </strong>


                    </div>


                  </div>


                  {/* =====================================
                      REASONS
                  ====================================== */}

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

                            No major anomaly signals were detected.

                          </p>


                        </div>

                      )}


                    </div>


                  </div>


                  {/* =====================================
                      ML PROBABILITY
                  ====================================== */}

                  <div className="ml-info">


                    <div className="ml-info-item">


                      <span>

                        ML Probability

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