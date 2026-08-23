import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import api from "../services/api";
import { toast } from "react-toastify";

import "./Register.css";


function Register() {

    const navigate = useNavigate();


    const [form, setForm] = useState({
        name: "",
        email: "",
        password: "",
        confirmPassword: ""
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


        if (form.password !== form.confirmPassword) {

            toast.error(
                "Passwords do not match"
            );

            return;

        }


        if (form.password.length < 6) {

            toast.error(
                "Password must be at least 6 characters"
            );

            return;

        }


        try {

            setLoading(true);


            const response = await api.post(
                "/auth/register",
                {
                    name: form.name,
                    email: form.email,
                    password: form.password
                }
            );


            console.log(
                "REGISTER RESPONSE:",
                response.data
            );


            toast.success(
                response.data.message ||
                "Account created successfully!"
            );

            navigate("/login", {
                replace: true
            });


        }
        catch (error) {

            console.log(
                "REGISTER ERROR:",
                error.response?.data
            );


            toast.error(
                error.response?.data?.message ||
                "Registration failed"
            );

        }
        finally {

            setLoading(false);

        }

    };


    return (

        <div className="register-page">

            <div className="register-grid"></div>

            <div className="register-glow register-glow-one"></div>

            <div className="register-glow register-glow-two"></div>



            <div className="register-container">

                <section className="register-info">


                    <div className="register-logo">

                        <span>🛡️</span>

                        FraudGuard

                    </div>


                    <div className="register-info-content">


                        <div className="register-badge">

                            <span></span>

                            JOIN FRAUDGUARD

                        </div>


                        <h1>

                            Your Digital

                            <span>
                                Security Starts Here.
                            </span>

                        </h1>


                        <p>

                            Create your FraudGuard account and access
                            AI-powered tools designed to detect fraud,
                            phishing attempts and suspicious activity.

                        </p>


                        <div className="register-features">


                            <div className="register-feature">

                                <span>⚡</span>

                                <div>

                                    <strong>
                                        Real-Time Detection
                                    </strong>

                                    <p>
                                        Analyze suspicious activity instantly.
                                    </p>

                                </div>

                            </div>


                            <div className="register-feature">

                                <span>🤖</span>

                                <div>

                                    <strong>
                                        AI Powered Security
                                    </strong>

                                    <p>
                                        Intelligent fraud risk analysis.
                                    </p>

                                </div>

                            </div>


                            <div className="register-feature">

                                <span>🔒</span>

                                <div>

                                    <strong>
                                        Secure Protection
                                    </strong>

                                    <p>
                                        Your security is our priority.
                                    </p>

                                </div>

                            </div>


                        </div>

                    </div>


                    <div className="register-info-footer">

                        <span className="footer-live-dot"></span>

                        FraudGuard AI Systems Online

                    </div>

                </section>

                <section className="register-card">


                    <div className="register-card-header">

                        <span className="register-small-label">
                            CREATE ACCOUNT
                        </span>


                        <h2>
                            Join FraudGuard
                        </h2>


                        <p>
                            Create your account and start protecting
                            yourself with AI-powered security.
                        </p>

                    </div>



                    <form onSubmit={handleSubmit}>

                        <div className="register-input-group">

                            <label>
                                Full Name
                            </label>


                            <div className="register-input">

                                <span>👤</span>

                                <input
                                    type="text"
                                    name="name"
                                    placeholder="Enter your full name"
                                    value={form.name}
                                    onChange={handleChange}
                                    required
                                />

                            </div>

                        </div>

                        <div className="register-input-group">

                            <label>
                                Email Address
                            </label>


                            <div className="register-input">

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

                        <div className="register-input-group">

                            <label>
                                Password
                            </label>


                            <div className="register-input">

                                <span>🔒</span>

                                <input
                                    type="password"
                                    name="password"
                                    placeholder="Create a password"
                                    value={form.password}
                                    onChange={handleChange}
                                    required
                                />

                            </div>

                        </div>

                        <div className="register-input-group">

                            <label>
                                Confirm Password
                            </label>


                            <div className="register-input">

                                <span>🔐</span>

                                <input
                                    type="password"
                                    name="confirmPassword"
                                    placeholder="Confirm your password"
                                    value={form.confirmPassword}
                                    onChange={handleChange}
                                    required
                                />

                            </div>

                        </div>

                        <button
                            type="submit"
                            className="register-btn"
                            disabled={loading}
                        >

                            {loading ? (

                                <>
                                    <span className="register-loader"></span>
                                    Creating Account...
                                </>

                            ) : (

                                <>
                                    Create Account
                                    <span>→</span>
                                </>

                            )}

                        </button>


                    </form>

                    <div className="register-bottom">

                        <p>

                            Already have an account?

                            <Link
                                to="/login"
                                className="login-link"
                            >
                                Sign In
                            </Link>

                        </p>

                    </div>


                    <div className="register-secure">

                        🔐 Your information is securely protected

                    </div>


                </section>

            </div>

        </div>

    );

}


export default Register;