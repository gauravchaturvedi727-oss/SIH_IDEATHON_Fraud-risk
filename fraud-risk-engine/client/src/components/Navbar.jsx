import { useState, useEffect, useRef } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import NotificationCenter from "./NotificationCenter";
import "./Navbar.css";

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navRef = useRef(null);

  const navigate = useNavigate();
  const location = useLocation();

  // Handle scroll detection for dynamic glassmorphism
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile drawer on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [location]);

  // Handle outside click to close drawer
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (navRef.current && !navRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };

    const handleEscape = (e) => {
      if (e.key === "Escape") {
        setMenuOpen(false);
      }
    };

    if (menuOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden"; // Lock scroll on mobile
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [menuOpen]);

  const logout = () => {
    localStorage.removeItem("token");
    setMenuOpen(false);
    navigate("/login");
  };

  const closeMenu = () => {
    setMenuOpen(false);
  };

  return (
    <header className={`navbar-header ${scrolled ? "scrolled" : ""}`} ref={navRef}>
      <div className="navbar-container">
        
        {/* Brand Logo & Live Radar */}
        <div className="navbar-brand-group">
          <NavLink to="/" end className="navbar-logo" onClick={closeMenu}>
            <div className="logo-shield-badge">
              <span className="logo-icon">🛡️</span>
              <span className="logo-pulse"></span>
            </div>
            <div className="logo-text-group">
              <span className="logo-text">FraudGuard</span>
              <span className="logo-subtext">AI DEFENSE HUD</span>
            </div>
          </NavLink>

          <div className="navbar-live-pill">
            <span className="live-radar-dot"></span>
            <span>AI SECURE</span>
          </div>
        </div>

        {/* Right Section: Notification, Links & Mobile Toggle */}
        <div className="navbar-actions-wrapper">
          
          {/* Main Navigation Links */}
          <nav 
            className={`navbar-links ${menuOpen ? "menu-open" : ""}`} 
            id="primary-navigation"
          >
            <div className="nav-links-inner">
              <NavLink
                to="/"
                end
                onClick={closeMenu}
                className={({ isActive }) =>
                  isActive ? "nav-link active" : "nav-link"
                }
              >
                <span className="nav-icon">▦</span>
                <span className="nav-label">Dashboard</span>
              </NavLink>

              <NavLink
                to="/transaction"
                onClick={closeMenu}
                className={({ isActive }) =>
                  isActive ? "nav-link active" : "nav-link"
                }
              >
                <span className="nav-icon">💳</span>
                <span className="nav-label">Transaction</span>
              </NavLink>

              <NavLink
                to="/phishing-analyzer"
                onClick={closeMenu}
                className={({ isActive }) =>
                  isActive ? "nav-link active" : "nav-link"
                }
              >
                <span className="nav-icon">🔍</span>
                <span className="nav-label">Phishing</span>
              </NavLink>

              <NavLink
                to="/voice-analyzer"
                onClick={closeMenu}
                className={({ isActive }) =>
                  isActive ? "nav-link active" : "nav-link"
                }
              >
                <span className="nav-icon">🎙️</span>
                <span className="nav-label">Voice AI</span>
              </NavLink>

              <button className="logout-btn" onClick={logout} title="Sign out of current terminal">
                <span className="nav-icon">↪</span>
                <span className="nav-label">Logout</span>
              </button>
            </div>
          </nav>

          {/* Persistent Right Section: Notifications & Menu Toggle */}
          <div className="navbar-utilities">
            <NotificationCenter />

            <button
              className={`menu-toggle ${menuOpen ? "open" : ""}`}
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle Navigation Terminal"
              aria-expanded={menuOpen}
              aria-controls="primary-navigation"
            >
              <span className="hamburger-line"></span>
              <span className="hamburger-line"></span>
              <span className="hamburger-line"></span>
            </button>
          </div>
        </div>

      </div>

      {/* Mobile Backdrop Overlay */}
      {menuOpen && <div className="mobile-backdrop" onClick={closeMenu}></div>}
    </header>
  );
}

export default Navbar;