import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import { toast } from "react-toastify";
import "./Register.css";

function Register() {
  const navigate = useNavigate();

  const [stage, setStage] = useState("welcome");

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: ""
  });

  const [loading, setLoading] = useState(false);

  // Show / Hide Password
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm({
      ...form,
      [name]: value
    });
  };

  const handleStartRegistration = () => {
    setStage("unlocking");

    setTimeout(() => {
      setStage("registered_view");
    }, 1800);
  };

  // Password validation
  const validatePassword = (password) => {
    if (password.length < 8) {
      return "Password must contain at least 8 characters";
    }

    if (!/[A-Z]/.test(password)) {
      return "Password must contain at least one uppercase letter";
    }

    if (!/[a-z]/.test(password)) {
      return "Password must contain at least one lowercase letter";
    }

    if (!/[0-9]/.test(password)) {
      return "Password must contain at least one number";
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      return "Password must contain at least one special character";
    }

    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const passwordError = validatePassword(form.password);

    if (passwordError) {
      toast.error(passwordError);
      return;
    }

    if (form.password !== form.confirmPassword) {
      toast.error("Passwords do not match!");
      return;
    }

    try {
      setLoading(true);

      const response = await api.post("/auth/register", {
        name: form.name,
        email: form.email,
        password: form.password
      });

      toast.success(
        response.data.message || "Registration Successful!"
      );

      navigate("/login");

    } catch (error) {
      toast.error(
        error.response?.data?.message ||
        "Registration failed. Try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`register-page ${stage}`}>

      <div className="register-grid"></div>
      <div className="register-glow register-glow-one"></div>
      <div className="register-glow register-glow-two"></div>

      {/* STAGE 1 */}
      {stage === "welcome" && (
        <section className="welcome-portal">

          <div className="welcome-shield-icon">🛡️</div>

          <div className="welcome-badge">
            <span></span>
            DHANRAKSHAK AI SECURITY PROTOCOL
          </div>

          <h1>
            WELCOME TO <span>DHANRAKSHAK</span>
          </h1>

          <p>
            India's Advanced AI-Powered Financial Fraud Detection,
            Phishing Guard & Voice Threat Defense System.
          </p>

          <button
            className="welcome-btn"
            onClick={handleStartRegistration}
          >
            <span>INITIALIZE REGISTRATION</span>
            <b>→</b>
          </button>

        </section>
      )}

      {/* STAGE 2 */}
      {stage === "unlocking" && (
        <div className="unlock-scanner-overlay">
          <div className="scanner-reticle"></div>

          <h2>
            [ INITIALIZING DHANRAKSHAK SECURITY SHIELD ]
          </h2>

          <p>
            SCANNING IDENTITY CODES & SECURING PROTOCOLS...
          </p>
        </div>
      )}

      {/* STAGE 3 */}
      {stage === "registered_view" && (
        <div className="register-container">

          {/* LEFT PANEL */}
          <section className="register-info">

            <div className="register-logo">
              <span>🛡️</span> DhanRakshak
            </div>

            <div className="register-info-content">

              <div className="register-badge">
                <span></span>
                CYBER IDENTITY CLEARANCE
              </div>

              <h1>
                Secure Your <span>Digital Wealth.</span>
              </h1>

              <p>
                Join the quantum security grid. Protect your transactions,
                detect voice scams, and prevent phishing with intelligent AI.
              </p>

              <div className="security-features">

                <div className="security-feature">
                  <span>💳</span>
                  <div>
                    <strong>Transaction Sentinel</strong>
                    <p>Real-time payment fraud prevention.</p>
                  </div>
                </div>

                <div className="security-feature">
                  <span>📩</span>
                  <div>
                    <strong>Phishing Shield</strong>
                    <p>Scans SMS, emails & suspicious URLs.</p>
                  </div>
                </div>

                <div className="security-feature">
                  <span>🎙️</span>
                  <div>
                    <strong>Voice AI Scanner</strong>
                    <p>Detects fraudulent scam call patterns.</p>
                  </div>
                </div>

              </div>
            </div>

            <div className="register-info-footer">
              <span className="footer-live-dot"></span>
              DhanRakshak Neural Grid Live
            </div>

          </section>

          {/* RIGHT PANEL */}
          <section className="register-card">

            <div className="register-card-header">

              <span className="register-small-label">
                NEW AGENT REGISTRATION
              </span>

              <h2>Create Security Account</h2>

              <p>
                Enter your details to initiate your DhanRakshak identity.
              </p>

            </div>

            <form onSubmit={handleSubmit}>

              {/* NAME */}
              <div className="register-input-group">

                <label>Full Name</label>

                <div className="register-input">
                  <span>👤</span>

                  <input
                    type="text"
                    name="name"
                    placeholder="Enter your name"
                    value={form.name}
                    onChange={handleChange}
                    required
                  />
                </div>

              </div>

              {/* EMAIL */}
              <div className="register-input-group">

                <label>Email Address</label>

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

              {/* PASSWORD */}
              <div className="register-input-group">

                <label>Password</label>

                <div className="register-input password-input">

                  <span>🔒</span>

                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="Create strong password"
                    value={form.password}
                    onChange={handleChange}
                    required
                  />

                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() =>
                      setShowPassword(!showPassword)
                    }
                  >
                    {showPassword ? "🙈" : "👁️"}
                  </button>

                </div>

                <small className="password-hint">
                  Minimum 8 characters with uppercase, lowercase,
                  number and special character.
                </small>

              </div>

              {/* CONFIRM PASSWORD */}
              <div className="register-input-group">

                <label>Confirm Password</label>

                <div className="register-input password-input">

                  <span>🛡️</span>

                  <input
                    type={
                      showConfirmPassword
                        ? "text"
                        : "password"
                    }
                    name="confirmPassword"
                    placeholder="Re-enter password"
                    value={form.confirmPassword}
                    onChange={handleChange}
                    required
                  />

                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() =>
                      setShowConfirmPassword(
                        !showConfirmPassword
                      )
                    }
                  >
                    {showConfirmPassword ? "🙈" : "👁️"}
                  </button>

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
                    Encrypting Credentials...
                  </>
                ) : (
                  <>
                    Complete Security Registration
                    <span>→</span>
                  </>
                )}
              </button>

            </form>

            <div className="register-bottom">
              <p>
                Already protected by DhanRakshak?

                <Link
                  to="/login"
                  className="signin-link"
                >
                  Sign In
                </Link>
              </p>
            </div>

            <div className="register-secure">
              🔐 256-Bit Encrypted DhanRakshak Vault
            </div>

          </section>

        </div>
      )}

    </div>
  );
}

export default Register;
