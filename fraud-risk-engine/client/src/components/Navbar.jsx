import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";

import NotificationCenter from "./NotificationCenter";

import "./Navbar.css";


function Navbar() {

    const [menuOpen, setMenuOpen] = useState(false);

    const navigate = useNavigate();

    const logout = () => {

        localStorage.removeItem("token");

        setMenuOpen(false);

        navigate("/login");

    };

    const closeMenu = () => {

        setMenuOpen(false);

    };


    return (

        <nav className="navbar">

            <div className="navbar-container">


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

                <div className="navbar-right">


                    <NotificationCenter />
                    
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