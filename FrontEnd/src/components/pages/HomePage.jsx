import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/HomePage.css";
import Sidebar from "../layout/Sidebar.jsx";
import explorerAvatar from "../../assets/images/avatars/explorer.png";
import adventurerAvatar from "../../assets/images/avatars/adventurer.png";
import championAvatar from "../../assets/images/avatars/champion.png";
import pathfinderAvatar from "../../assets/images/avatars/pathfinder.png";
import heroImage from "../../assets/images/backgrounds/hero.JPG";

import natureImage from "../../assets/images/backgrounds/nature-adventure.JPG";
import historyImage from "../../assets/images/backgrounds/history-adventure.JPG";
// Navigation items
const navigationItems = [
  { name: "Home", icon: "⌂", path: "/home" },
  { name: "My Adventures", icon: "◈", path: "/adventures" },
  { name: "Rewards", icon: "☆", path: "/rewards" },
  { name: "Map", icon: "♧", path: "/map" },
  { name: "Profile", icon: "♙", path: "/profile" },
  { name: "About", icon: "ⓘ", path: "/about" },
  { name: "Settings", icon: "⚙", path: "/settings" },
];

// Avatar information
const avatarOptions = {
  explorer: {
    image: explorerAvatar,
    label: "Explorer",
  },
  adventurer: {
    image: adventurerAvatar,
    label: "Adventurer",
  },
  champion: {
    image: championAvatar,
    label: "Champion",
  },
  pathfinder: {
    image: pathfinderAvatar,
    label: "Pathfinder",
  },
};

// Temporary rewards until the backend is connected
const rewards = [
  {
    title: "Urban Coffee",
    description: "10% off your coffee",
    icon: "☕",
  },
  {
    title: "Arad Museum",
    description: "Free entry",
    icon: "🏛️",
  },
  {
    title: "Local Shop",
    description: "15% off",
    icon: "🎁",
  },
];

function HomePage() {
  const navigate = useNavigate();

  const [menuOpen, setMenuOpen] = useState(false);

  // Retrieve user information from localStorage.
  // These values will later come from the backend.
  const storedUser = JSON.parse(localStorage.getItem("currentUser") || "{}");

  const username =
    storedUser.username ||
    localStorage.getItem("username") ||
    localStorage.getItem("userName") ||
    "Explorer";
  const selectedAvatar =
    storedUser.avatar || localStorage.getItem("selectedAvatar") || "explorer";

  const avatar = avatarOptions[selectedAvatar] || avatarOptions.explorer;

  // Temporary initial statistics until backend integration.
  const userStats = {
    points: 0,
    completed: 0,
    rewards: 0,
  };

  const handleNavigation = (path) => {
    setMenuOpen(false);
    navigate(path);
  };

  return (
    <div className="home-page">
      {/* DESKTOP SIDEBAR */}
      <Sidebar
        activePage="Home"
        menuOpen={menuOpen}
        setMenuOpen={setMenuOpen}
      />

      {/* MAIN CONTENT */}
      <main className="home-main">
        {/* TOP HEADER */}
        <header className="home-header">
          <div className="welcome-section">
            <div className="user-avatar">
              <img
                src={avatar.image}
                alt={`${avatar.label} avatar`}
                className="user-avatar-image"
              />
            </div>

            <div>
              <h1>Hello, {username}!</h1>
              <p>Ready for your next adventure in Arad?</p>
            </div>
          </div>

          <div className="header-actions">
            <div className="points-badge">
              <span>⭐</span>
              <div>
                <strong>{userStats.points}</strong>
                <small>points</small>
              </div>
            </div>

            <button className="notification-button" aria-label="Notifications">
              ♧
            </button>

            <button
              className="header-profile"
              onClick={() => navigate("/profile")}
            >
              <span>{avatar.emoji}</span>
              <strong>{username}</strong>
              <span>⌄</span>
            </button>
          </div>

          {/* MOBILE HAMBURGER */}
          <button
            className="hamburger-button"
            onClick={() => setMenuOpen(true)}
            aria-label="Open navigation menu"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </header>

        {/* HERO BANNER */}
        <section
          className="hero-banner"
          style={{
            backgroundImage: `
      linear-gradient(
        90deg,
        rgba(20, 17, 13, 0.82),
        rgba(20, 17, 13, 0.05)
      ),
      url("${heroImage}")
    `,
          }}
        >
          <div className="hero-content">
            <span className="hero-compass">🧭</span>

            <div>
              <h2>Explore Arad</h2>
              <p>Two paths. Endless stories.</p>
              <span className="hero-tagline">Nature or History?</span>
            </div>
          </div>
        </section>

        {/* ADVENTURE CATEGORIES */}
        <section className="adventure-section">
          <h2>Choose Your Adventure</h2>

          <div className="adventure-grid">
            {/* NATURE EXPLORER */}
            <article
              className="adventure-card nature-card"
              style={{
                backgroundImage: `url("${natureImage}")`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
              }}
            >
              <div className="category-icon">🌿</div>

              <div className="adventure-card-content">
                <h3>Nature Explorer</h3>
                <p
                  style={{
                    color: "#ffffff",
                    opacity: 1,
                    fontWeight: 600,
                    textShadow: "0 2px 5px rgba(0, 0, 0, 0.9)",
                  }}
                >
                  Discover hidden trails, forests and natural wonders around
                  Arad.
                </p>

                <button onClick={() => navigate("/adventures/nature")}>
                  Start Adventure <span>→</span>
                </button>
              </div>
            </article>

            {/* HISTORICAL DISCOVERER */}
            <article
              className="adventure-card history-card"
              style={{
                backgroundImage: `url("${historyImage}")`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
              }}
            >
              <div className="category-icon">🏛️</div>

              <div className="adventure-card-content">
                <h3>Historical Discoverer</h3>

                <p
                  style={{
                    color: "#ffffff",
                    opacity: 1,
                    fontWeight: 600,
                    textShadow: "0 2px 5px rgba(0, 0, 0, 0.9)",
                  }}
                >
                  Uncover the secrets of Arad's historic landmarks and
                  architecture.
                </p>

                <button onClick={() => navigate("/adventures/history")}>
                  Start Adventure <span>→</span>
                </button>
              </div>
            </article>
          </div>
        </section>

        {/* PROGRESS AND REWARDS */}
        <section className="dashboard-bottom">
          {/* USER PROGRESS */}
          <div className="progress-panel">
            <h3>Your Adventure Progress</h3>

            <div className="progress-stats">
              <div className="stat-item">
                <span className="stat-icon">⭐</span>
                <div>
                  <strong>{userStats.points}</strong>
                  <small>Points</small>
                </div>
              </div>

              <div className="stat-item">
                <span className="stat-icon">⚑</span>
                <div>
                  <strong>{userStats.completed}</strong>
                  <small>Completed</small>
                </div>
              </div>

              <div className="stat-item">
                <span className="stat-icon">🎁</span>
                <div>
                  <strong>{userStats.rewards}</strong>
                  <small>Rewards</small>
                </div>
              </div>
            </div>
          </div>

          {/* LATEST REWARDS */}
          <div className="rewards-panel">
            <div className="panel-heading">
              <h3>Latest Rewards</h3>

              <button onClick={() => navigate("/rewards")}>View all →</button>
            </div>

            <div className="rewards-list">
              {rewards.map((reward, index) => (
                <article className="reward-card" key={index}>
                  <span className="reward-icon">{reward.icon}</span>

                  <div>
                    <strong>{reward.title}</strong>
                    <small>{reward.description}</small>
                  </div>

                  <span className="reward-lock">🔒</span>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default HomePage;
