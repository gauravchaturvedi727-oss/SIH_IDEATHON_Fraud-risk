import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import api from "../services/api";
import Navbar from "../components/Navbar";
import "./TransactionDetails.css";

function TransactionDetails() {

    const { id } = useParams();
    const navigate = useNavigate();

    const [transaction, setTransaction] = useState(null);
    const [loading, setLoading] = useState(true);

    const [editMode, setEditMode] = useState(false);

    const [form, setForm] = useState({
        amount: "",
        newDevice: false,
        newLocation: false,
        rapidTransactions: 0,
        failedLogins: 0,
        otpRequests: 0
    });

    useEffect(() => {

        const fetchTransaction = async () => {

            try {

                const response =
                    await api.get(
                        `/transactions/${id}`
                    );

                const data = response.data;

                setTransaction(data);

                setForm({
                    amount: data.amount,
                    newDevice: data.newDevice,
                    newLocation: data.newLocation,
                    rapidTransactions:
                        data.rapidTransactions,
                    failedLogins:
                        data.failedLogins,
                    otpRequests:
                        data.otpRequests
                });

            } catch (error) {

                console.log(error);

            } finally {

                setLoading(false);

            }
        };

        fetchTransaction();

    }, [id]);


    // INPUT CHANGE

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


    // UPDATE

    const handleUpdate = async (e) => {

        e.preventDefault();

        try {

            const response =
                await api.put(
                    `/transactions/${id}`,
                    {
                        ...form,
                        amount: Number(form.amount),
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

            setTransaction(
                response.data.transaction
            );

            setEditMode(false);

            alert("Transaction updated successfully");

        } catch (error) {

            alert(
                error.response?.data?.message ||
                "Update failed"
            );

        }
    };


    // DELETE

    const handleDelete = async () => {

        const confirmDelete =
            window.confirm(
                "Delete this transaction?"
            );

        if (!confirmDelete) return;

        try {

            await api.delete(
                `/transactions/${id}`
            );

            navigate("/");

        } catch (error) {

            alert(
                error.response?.data?.message ||
                "Delete failed"
            );

        }
    };


    if (loading) {

        return (
            <>
                <Navbar />

                <div className="details-loading">
                    Loading transaction...
                </div>
            </>
        );

    }


    if (!transaction) {

        return (
            <>
                <Navbar />

                <div className="details-loading">

                    <h2>
                        Transaction not found
                    </h2>

                    <Link to="/">
                        Back to Dashboard
                    </Link>

                </div>

            </>
        );

    }


    return (
        <>

            <Navbar />

            <main className="details-page">

                <Link
                    to="/"
                    className="back-link"
                >
                    ← Back to Dashboard
                </Link>


                <div className="details-header">

                    <div>

                        <span className="dashboard-label">
                            TRANSACTION DETAILS
                        </span>

                        <h1>
                            Transaction Report
                        </h1>

                        <p>
                            Detailed risk analysis and
                            transaction information.
                        </p>

                    </div>


                    <div className="details-actions">

                        <button
                            className="secondary-btn"
                            onClick={() =>
                                setEditMode(!editMode)
                            }
                        >
                            {editMode
                                ? "Cancel Edit"
                                : "Edit"}
                        </button>


                        <button
                            className="delete-btn large-delete"
                            onClick={handleDelete}
                        >
                            Delete
                        </button>

                    </div>

                </div>


                {!editMode ? (

                    /* ================= VIEW MODE ================= */

                    <div className="details-grid">


                        {/* RISK CARD */}

                        <section className="details-card risk-main">

                            <div className="risk-main-top">

                                <div>

                                    <span>
                                        RISK SCORE
                                    </span>

                                    <h2>
                                        {
                                            transaction.riskScore
                                        }

                                        <small>
                                            /100
                                        </small>

                                    </h2>

                                </div>


                                <span
                                    className={
                                        `large-badge ${
                                            transaction.riskLevel
                                                .toLowerCase()
                                        }`
                                    }
                                >
                                    {
                                        transaction.riskLevel
                                    }
                                </span>

                            </div>


                            <div
                                className={
                                    `action-box ${
                                        transaction.riskLevel
                                            .toLowerCase()
                                    }`
                                }
                            >

                                <span>
                                    Recommended Action
                                </span>

                                <strong>
                                    {
                                        transaction.recommendedAction
                                    }
                                </strong>

                            </div>


                            <h3>
                                Why was this flagged?
                            </h3>


                            <div className="detail-reasons">

                                {transaction.reasons.map(
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

                        </section>


                        {/* TRANSACTION INFO */}

                        <section className="details-card">

                            <h2>
                                Transaction Information
                            </h2>


                            <div className="info-list">

                                <div>
                                    <span>
                                        Amount
                                    </span>

                                    <strong>
                                        ₹
                                        {Number(
                                            transaction.amount
                                        ).toLocaleString(
                                            "en-IN"
                                        )}
                                    </strong>
                                </div>


                                <div>
                                    <span>
                                        New Device
                                    </span>

                                    <strong>
                                        {transaction.newDevice
                                            ? "Yes"
                                            : "No"}
                                    </strong>
                                </div>


                                <div>
                                    <span>
                                        New Location
                                    </span>

                                    <strong>
                                        {transaction.newLocation
                                            ? "Yes"
                                            : "No"}
                                    </strong>
                                </div>


                                <div>
                                    <span>
                                        Rapid Transactions
                                    </span>

                                    <strong>
                                        {
                                            transaction
                                                .rapidTransactions
                                        }
                                    </strong>
                                </div>


                                <div>
                                    <span>
                                        Failed Logins
                                    </span>

                                    <strong>
                                        {
                                            transaction
                                                .failedLogins
                                        }
                                    </strong>
                                </div>


                                <div>
                                    <span>
                                        OTP Requests
                                    </span>

                                    <strong>
                                        {
                                            transaction
                                                .otpRequests
                                        }
                                    </strong>
                                </div>


                                <div>
                                    <span>
                                        Created
                                    </span>

                                    <strong>
                                        {new Date(
                                            transaction.createdAt
                                        ).toLocaleString(
                                            "en-IN"
                                        )}
                                    </strong>
                                </div>

                            </div>

                        </section>

                    </div>

                ) : (

                    /* ================= EDIT MODE ================= */

                    <section className="details-card edit-card">

                        <h2>
                            Edit Transaction
                        </h2>


                        <form
                            onSubmit={handleUpdate}
                            className="edit-form"
                        >

                            <label>
                                Amount

                                <input
                                    name="amount"
                                    type="number"
                                    value={form.amount}
                                    onChange={handleChange}
                                />

                            </label>


                            <label className="edit-checkbox">

                                <input
                                    name="newDevice"
                                    type="checkbox"
                                    checked={form.newDevice}
                                    onChange={handleChange}
                                />

                                New Device

                            </label>


                            <label className="edit-checkbox">

                                <input
                                    name="newLocation"
                                    type="checkbox"
                                    checked={form.newLocation}
                                    onChange={handleChange}
                                />

                                New Location

                            </label>


                            <label>
                                Rapid Transactions

                                <input
                                    name="rapidTransactions"
                                    type="number"
                                    value={
                                        form.rapidTransactions
                                    }
                                    onChange={handleChange}
                                />

                            </label>


                            <label>
                                Failed Logins

                                <input
                                    name="failedLogins"
                                    type="number"
                                    value={
                                        form.failedLogins
                                    }
                                    onChange={handleChange}
                                />

                            </label>


                            <label>
                                OTP Requests

                                <input
                                    name="otpRequests"
                                    type="number"
                                    value={
                                        form.otpRequests
                                    }
                                    onChange={handleChange}
                                />

                            </label>


                            <button
                                type="submit"
                                className="primary-btn"
                            >
                                Save Changes
                            </button>

                        </form>

                    </section>

                )}

            </main>

        </>
    );
}

export default TransactionDetails;