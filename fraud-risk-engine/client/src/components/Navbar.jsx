import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";

import NotificationCenter from "./NotificationCenter";

import "./Navbar.css";


function Navbar() {

    const [menuOpen, setMenuOpen] = useState(false);

    const navigate = useNavigate();


    // ================================
    // LOGOUT
    // ================================

    const logout = () => {

        localStorage.removeItem("token");

        setMenuOpen(false);

        navigate("/login");

    };


    // ================================
    // CLOSE MOBILE MENU
    // ================================

    const closeMenu = () => {

        setMenuOpen(false);

    };


    return (

        <nav className="navbar">

            <div className="navbar-container">


                {/* ================= LOGO ================= */}

                <NavLink
                    to="/"
                    end
                    className="navbar-logo"
                    onClick={closeMenu}
                >

                    <span className="logo-icon">
                        🛡️
                    </span>

                    <span className="logo-text">
                        FraudGuard
                    </span>

                </NavLink>


                {/* ================= RIGHT SIDE ================= */}

                <div className="navbar-right">


                    {/* NOTIFICATION BELL */}

                    <NotificationCenter />


                    {/* MOBILE MENU BUTTON */}

                    <button
                        className="menu-toggle"
                        onClick={() =>
                            setMenuOpen(!menuOpen)
                        }
                        aria-label="Toggle navigation"
                    >

                        {menuOpen ? "✕" : "☰"}

                    </button>

                </div>


                {/* ================= NAV LINKS ================= */}

                <div
                    className={
                        `navbar-links ${
                            menuOpen ? "menu-open" : ""
                        }`
                    }
                >


                    <NavLink
                        to="/"
                        end
                        onClick={closeMenu}
                        className={({ isActive }) =>
                            isActive
                                ? "nav-link active"
                                : "nav-link"
                        }
                    >
                        <span>▦</span>
                        Dashboard
                    </NavLink>


                    <NavLink
                        to="/transaction"
                        onClick={closeMenu}
                        className={({ isActive }) =>
                            isActive
                                ? "nav-link active"
                                : "nav-link"
                        }
                    >
                        <span>💳</span>
                        Transaction
                    </NavLink>


                    <NavLink
                        to="/phishing-analyzer"
                        onClick={closeMenu}
                        className={({ isActive }) =>
                            isActive
                                ? "nav-link active"
                                : "nav-link"
                        }
                    >
                        <span>🔍</span>
                        Phishing
                    </NavLink>


                    <NavLink
                        to="/voice-analyzer"
                        onClick={closeMenu}
                        className={({ isActive }) =>
                            isActive
                                ? "nav-link active"
                                : "nav-link"
                        }
                    >
                        <span>🎙️</span>
                        Voice Analyzer
                    </NavLink>


                    {/* LOGOUT */}

                    <button
                        className="logout-btn"
                        onClick={logout}
                    >
                        <span>↪</span>
                        Logout
                    </button>

                </div>

            </div>

        </nav>

    );

}


export default Navbar;