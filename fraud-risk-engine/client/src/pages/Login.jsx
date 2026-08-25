import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import api from "../services/api";
import { toast } from "react-toastify";

import "./Login.css";


function Login() {

    const navigate = useNavigate();


    const [form, setForm] = useState({
        email: "",
        password: ""
    });


    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {

        const { name, value } = e.target;

        setForm({
            ...form,
            [name]: value
        });

    };


    const handleSubmit = async (e) => {

        e.preventDefault();


        try {

            setLoading(true);


            const response = await api.post(
                "/auth/login",
                {
                    email: form.email,
                    password: form.password
                }
            );


            console.log(
                "LOGIN RESPONSE:",
                response.data
            );

            if (response.data.token) {

                localStorage.setItem(
                    "token",
                    response.data.token
                );

            }


            toast.success(
                response.data.message ||
                "Login successful!"
            );

            navigate("/", {
                replace: true
            });


        }
        catch (error) {

            console.log(
                "LOGIN ERROR:",
                error.response?.data
            );


            toast.error(
                error.response?.data?.message ||
                "Login failed. Please try again."
            );

        }
        finally {

            setLoading(false);

        }

    };


    return (

        <div className="login-page">

            <div className="login-grid"></div>

            <div className="login-glow login-glow-one"></div>

            <div className="login-glow login-glow-two"></div>


            <div className="login-container">

                <section className="login-info">

                    <div className="login-logo">

                        <span>🛡️</span>

                        DhanRakshak

                    </div>


                    <div className="login-info-content">


                        <div className="login-badge">

                            <span></span>

                            AI SECURITY PLATFORM

                        </div>


                        <h1>

                            Protect What

                            <span>
                                Matters Most.
                            </span>

                        </h1>


                        <p>

                            Intelligent fraud detection powered by AI.
                            Monitor suspicious transactions, analyze phishing
                            attempts and detect potential voice scams.

                        </p>


                        <div className="security-features">


                            <div className="security-feature">

                                <span>🛡️</span>

                                <div>

                                    <strong>
                                        AI Fraud Detection
                                    </strong>

                                    <p>
                                        Detect suspicious activity instantly.
                                    </p>

                                </div>

                            </div>


                            <div className="security-feature">

                                <span>🔍</span>

                                <div>

                                    <strong>
                                        Phishing Protection
                                    </strong>

                                    <p>
                                        Analyze suspicious messages safely.
                                    </p>

                                </div>

                            </div>


                            <div className="security-feature">

                                <span>🎙️</span>

                                <div>

                                    <strong>
                                        Voice Scam Analysis
                                    </strong>

                                    <p>
                                        Detect scam indicators in calls.
                                    </p>

                                </div>

                            </div>


                        </div>

                    </div>


                    <div className="login-info-footer">

                        <span className="footer-live-dot"></span>

                        AI Protection Systems Online

                    </div>

                </section>

                <section className="login-card">


                    <div className="login-card-header">

                        <span className="login-small-label">
                            WELCOME BACK
                        </span>


                        <h2>
                            Sign in to DhanRakshak
                        </h2>


                        <p>
                            Enter your credentials to access your
                            security dashboard.
                        </p>

                    </div>


                    <form onSubmit={handleSubmit}>


                        <div className="login-input-group">

                            <label>
                                Email Address
                            </label>


                            <div className="login-input">

                                <span>✉️</span>

                                <input
                                    type="email"
                                    name="email"
                                    placeholder="Enter your email"
                                    value={form.email}
                                    onChange={handleChange}
                                    required
                                />

                            </div>

                        </div>

                        <div className="login-input-group">

                            <label>
                                Password
                            </label>


                            <div className="login-input">

                                <span>🔒</span>

                                <input
                                    type="password"
                                    name="password"
                                    placeholder="Enter your password"
                                    value={form.password}
                                    onChange={handleChange}
                                    required
                                />

                            </div>

                        </div>


                        <button
                            type="submit"
                            className="login-btn"
                            disabled={loading}
                        >

                            {loading ? (

                                <>
                                    <span className="login-loader"></span>
                                    Signing In...
                                </>

                            ) : (

                                <>
                                    Sign In
                                    <span>→</span>
                                </>

                            )}

                        </button>


                    </form>


                    <div className="login-bottom">

                        <p>

                            Don't have an account?

                            <Link
                                to="/register"
                                className="signup-link"
                            >
                                Create Account
                            </Link>

                        </p>

                    </div>


                    <div className="login-secure">

                        🔐 Your information is securely protected

                    </div>

                </section>


            </div>

        </div>

    );

}


export default Login;