import { useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../../assets/images/backgrounds/aradquest-logo.png";
import "../styles/Sidebar.css";
import { useAuth } from "../context/useAuth.js";

// Navigation items — păstrăm emoji-urile colorate din MapPage
const navigationItems = [
  { name: "Home", icon: "🏠", path: "/home" },
  { name: "My Adventures", icon: "🧭", path: "/adventures" },
  { name: "Rewards", icon: "🎁", path: "/rewards" },
  { name: "Map", icon: "🗺️", path: "/map" },
  { name: "Profile", icon: "👤", path: "/profile" },
  { name: "About", icon: "ℹ️", path: "/about" },
  { name: "Settings", icon: "⚙️", path: "/settings" },
];

function Sidebar({ activePage, menuOpen, setMenuOpen }) {
  const navigate = useNavigate();

  const { logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState("");

  // End the backend session before returning to the landing page.
  const handleLogout = async () => {
    if (isLoggingOut) return;

    setIsLoggingOut(true);
    setLogoutError("");

    try {
      await logout();
      setMenuOpen(false);
      navigate("/", { replace: true });
    } catch (error) {
      setLogoutError(error.message || "Unable to log out. Please try again.");
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleMenuToggle = () => {
    setMenuOpen((prev) => !prev);
  };

  const handleNavigation = (path) => {
    setMenuOpen(false);
    navigate(path);
  };

  const renderNavigation = () =>
    navigationItems.map((item) => (
      <button
        key={item.name}
        className={`app-nav-item ${activePage === item.name ? "active" : ""}`}
        onClick={() => handleNavigation(item.path)}
      >
        <span className="app-nav-icon">{item.icon}</span>
        <span className="app-nav-label">{item.name}</span>
      </button>
    ));

  return (
    <>
      {/* MOBILE HAMBURGER BUTTON */}
      <button
        className="app-hamburger-button"
        onClick={handleMenuToggle}
        aria-label="Open navigation menu"
        aria-expanded={menuOpen}
      >
        ☰
      </button>
      {/* DESKTOP SIDEBAR */}
      <aside className="app-sidebar">
        {/* LOGO */}
        <div className="app-sidebar-logo">
          <img src={logo} alt="Arad Quest Logo" />
        </div>

        {/* NAVIGATION */}
        <nav className="app-sidebar-navigation">{renderNavigation()}</nav>

        {/* Desktop logout button */}
        <div className="app-sidebar-logout">
          <button
            type="button"
            className="app-logout-button"
            onClick={handleLogout}
            disabled={isLoggingOut}
          >
            <span aria-hidden="true">🚪</span>
            <span>{isLoggingOut ? "Logging out..." : "Log Out"}</span>
          </button>

          {logoutError && (
            <p className="app-logout-error" role="alert">
              {logoutError}
            </p>
          )}
        </div>

        {/* SIDEBAR FOOTER */}
        <div className="app-sidebar-bottom">
          <span>✦ Explore. Discover. Earn. ✦</span>
          <small>Arad Quest © 2026</small>
        </div>
      </aside>

      {/* MOBILE MENU OVERLAY */}
      {menuOpen && (
        <div className="app-mobile-overlay" onClick={() => setMenuOpen(false)}>
          <aside
            className="app-mobile-menu"
            onClick={(event) => event.stopPropagation()}
          >
            {/* MOBILE HEADER */}
            <div className="app-mobile-header">
              <h2>ARAD QUEST</h2>

              <button
                onClick={() => setMenuOpen(false)}
                aria-label="Close navigation menu"
              >
                ✕
              </button>
            </div>

            {/* MOBILE LOGO */}
            <div className="app-mobile-logo">
              <img src={logo} alt="Arad Quest Logo" />
            </div>

            {/* MOBILE NAVIGATION */}
            <nav className="app-mobile-navigation">{renderNavigation()}</nav>

            {/* Mobile logout button */}
            <div className="app-sidebar-logout">
              <button
                type="button"
                className="app-logout-button"
                onClick={handleLogout}
                disabled={isLoggingOut}
              >
                <span aria-hidden="true">🚪</span>
                <span>{isLoggingOut ? "Logging out..." : "Log Out"}</span>
              </button>

              {logoutError && (
                <p className="app-logout-error" role="alert">
                  {logoutError}
                </p>
              )}
            </div>

            {/* MOBILE FOOTER */}
            <div className="app-mobile-footer">
              <span>✦ Explore. Discover. Earn. ✦</span>
              <small>Arad Quest © 2026</small>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}

export default Sidebar;
