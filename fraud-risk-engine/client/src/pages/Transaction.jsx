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

        otpRequests: 0

    });


    const [result, setResult] =
        useState(null);


    const [loading, setLoading] =
        useState(false);


    const handleChange = (e) => {

        const {

            name,
            value,
            type,
            checked

        } = e.target;


        setForm({

            ...form,

            [name]:
                type === "checkbox"
                    ? checked
                    : value

        });

    };

    const analyzeTransaction =
        async (e) => {

            e.preventDefault();


            try {

                setLoading(true);


                const response =
                    await api.post(

                        "/transactions",

                        {

                            ...form,

                            amount:
                                Number(
                                    form.amount
                                ),

                            rapidTransactions:
                                Number(
                                    form.rapidTransactions
                                ),

                            failedLogins:
                                Number(
                                    form.failedLogins
                                ),

                            otpRequests:
                                Number(
                                    form.otpRequests
                                )

                        }

                    );


                setResult(
                    response.data.transaction
                );


            } 
            catch (error) {

                console.log(
                    "FULL ERROR:",
                    error
                );

                console.log(
                    "SERVER RESPONSE:",
                    error.response?.data
                );

                toast.error(
                    error.response?.data?.message ||
                    "Transaction analysis failed"
                );

            }
            finally {

                setLoading(false);

            }

        };


    const resetForm = () => {

        setForm({

            amount: "",

            newDevice: false,

            newLocation: false,

            rapidTransactions: 0,

            failedLogins: 0,

            otpRequests: 0

        });


        setResult(null);

    };


    return (

        <>

            <Navbar />


            <main className="transaction-page">


                <div className="page-title">

                    <Link to="/">

                        ← Back to Dashboard

                    </Link>


                    <h1>
                        Transaction Risk Analysis
                    </h1>


                    <p>
                        XGBoost-powered transaction
                        risk assessment.
                    </p>

                </div>


                <div className="transaction-layout">

                    <form

                        className="transaction-form"

                        onSubmit={
                            analyzeTransaction
                        }

                    >


                        <label>

                            Transaction Amount

                            <input

                                name="amount"

                                type="number"

                                min="0"

                                placeholder="e.g. 75000"

                                value={
                                    form.amount
                                }

                                onChange={
                                    handleChange
                                }

                                required

                            />

                        </label>


                        <div className="checkbox-group">


                            <label className="checkbox">

                                <input

                                    name="newDevice"

                                    type="checkbox"

                                    checked={
                                        form.newDevice
                                    }

                                    onChange={
                                        handleChange
                                    }

                                />

                                <span>
                                    New Device
                                </span>

                            </label>


                            <label className="checkbox">

                                <input

                                    name="newLocation"

                                    type="checkbox"

                                    checked={
                                        form.newLocation
                                    }

                                    onChange={
                                        handleChange
                                    }

                                />

                                <span>
                                    New Location
                                </span>

                            </label>


                        </div>


                        <label>

                            Rapid Transactions

                            <input

                                name="rapidTransactions"

                                type="number"

                                min="0"

                                value={
                                    form.rapidTransactions
                                }

                                onChange={
                                    handleChange
                                }

                            />

                        </label>


                        <label>

                            Failed Login Attempts

                            <input

                                name="failedLogins"

                                type="number"

                                min="0"

                                value={
                                    form.failedLogins
                                }

                                onChange={
                                    handleChange
                                }

                            />

                        </label>


                        <label>

                            OTP Requests

                            <input

                                name="otpRequests"

                                type="number"

                                min="0"

                                value={
                                    form.otpRequests
                                }

                                onChange={
                                    handleChange
                                }

                            />

                        </label>


                        <div className="form-buttons">


                            <button

                                type="submit"

                                className="primary-btn"

                                disabled={loading}

                            >

                                {loading
                                    ? "Analyzing..."
                                    : "Analyze Risk"}

                            </button>


                            <button

                                type="button"

                                className="secondary-btn"

                                onClick={
                                    resetForm
                                }

                            >

                                Reset

                            </button>


                        </div>


                    </form>

                    <div className="result-card">


                        {!result ? (

                            <div className="result-empty">

                                <div className="shield">
                                    🛡️
                                </div>


                                <h2>
                                    Waiting for Analysis
                                </h2>


                                <p>
                                    Submit transaction
                                    details to receive
                                    an AI-powered risk
                                    assessment.
                                </p>

                            </div>

                        ) : (

                            <>

                                <div className="result-top">


                                    <div>

                                        <span>
                                            AI RISK SCORE
                                        </span>


                                        <h2>

                                            {
                                                result.riskScore
                                            }

                                            <small>
                                                /100
                                            </small>

                                        </h2>

                                    </div>


                                    <span

                                        className={
                                            `large-badge ${
                                                result.riskLevel
                                                    .toLowerCase()
                                            }`
                                        }

                                    >

                                        {
                                            result.riskLevel
                                        }

                                    </span>

                                </div>


                                <div

                                    className={
                                        `action-box ${
                                            result.riskLevel
                                                .toLowerCase()
                                        }`
                                    }

                                >

                                    <span>
                                        Recommended Action
                                    </span>


                                    <strong>

                                        {
                                            result.recommendedAction
                                        }

                                    </strong>

                                </div>


                                <div className="reasons">


                                    <h3>
                                        Why?
                                    </h3>


                                    {result.reasons?.map(

                                        (
                                            reason,
                                            index
                                        ) => (

                                            <div

                                                className="reason"

                                                key={index}

                                            >

                                                <span>
                                                    !
                                                </span>

                                                {reason}

                                            </div>

                                        )

                                    )}


                                </div>


                                <div className="ml-info">

                                    <span>
                                        ML Probability
                                    </span>

                                    <strong>

                                        {
                                            (
                                                Number(
                                                    result.mlProbability
                                                ) * 100
                                            ).toFixed(2)
                                        }%

                                    </strong>

                                </div>


                            </>

                        )}

                    </div>


                </div>

            </main>

        </>

    );
}


export default Transaction;