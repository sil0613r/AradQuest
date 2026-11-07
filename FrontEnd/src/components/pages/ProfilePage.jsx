import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/ProfilePage.css";
import Sidebar from "../layout/Sidebar.jsx";

// Arad Quest assets
import explorerAvatar from "../../assets/images/avatars/explorer.png";

function ProfilePage() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  // Temporary profile data. Later, these values can come from the backend.
  const username = "Explorer";
  const email = "explorer@aradquest.com";

  const profileStats = [
    { icon: "⭐", value: "250", label: "Total Points" },
    { icon: "🗺️", value: "4", label: "Adventures Started" },
    { icon: "📍", value: "12", label: "Places Discovered" },
    { icon: "🏆", value: "3", label: "Badges Earned" },
  ];

  const badges = [
    {
      icon: "🌿",
      title: "Nature Explorer",
      description: "Discover natural wonders",
      color: "green",
    },
    {
      icon: "🏛️",
      title: "History Lover",
      description: "Explore Arad's history",
      color: "gold",
    },
    {
      icon: "🧭",
      title: "Brave Explorer",
      description: "Complete your first quest",
      color: "blue",
    },
  ];

  const adventureHistory = [
    {
      icon: "🌿",
      title: "Ceala Forest Adventure",
      category: "Nature",
      date: "October 24, 2026",
      progress: 100,
      status: "Completed",
    },
    {
      icon: "🏛️",
      title: "Mysteries of Arad Center",
      category: "History",
      date: "October 20, 2026",
      progress: 60,
      status: "In Progress",
    },
  ];

  return (
    <div className="profile-page">
      {/* SHARED SIDEBAR + HAMBURGER MENU */}
      <Sidebar
        activePage="Profile"
        menuOpen={menuOpen}
        setMenuOpen={setMenuOpen}
      />

      {/* MAIN CONTENT */}
      <main className="profile-main">
        {/* HEADER */}
        <header className="profile-page-header">
          <div>
            <span className="profile-eyebrow">YOUR JOURNEY</span>
            <h1>My Profile</h1>
            <p>Every explorer has a story. This is yours.</p>
          </div>

          <button
            className="profile-edit-button"
            onClick={() => navigate("/settings")}
          >
            ✎ Edit Profile
          </button>
        </header>

        {/* PROFILE HERO */}
        <section className="profile-hero-card">
          <div className="profile-hero-overlay">
            <div className="profile-hero-avatar-wrapper">
              <img
                src={explorerAvatar}
                alt={`${username} avatar`}
                className="profile-hero-avatar"
              />
              <span className="profile-online-indicator"></span>
            </div>

            <div className="profile-hero-info">
              <span className="profile-member-tag">✦ ARAD QUEST EXPLORER</span>
              <h2>{username}</h2>
              <p>{email}</p>

              <div className="profile-hero-meta">
                <span>📍 Arad, Romania</span>
                <span>🗓️ Member since October 2026</span>
              </div>
            </div>

            <div className="profile-level-card">
              <span className="profile-level-icon">🧭</span>
              <span className="profile-level-label">EXPLORER LEVEL</span>
              <strong>Level 3</strong>
              <div className="profile-level-progress">
                <div className="profile-level-progress-fill"></div>
              </div>
              <small>250 / 400 XP</small>
            </div>
          </div>
        </section>

        {/* STATS */}
        <section className="profile-stats-section">
          <div className="profile-section-heading">
            <div>
              <h2>Your Achievements</h2>
              <p>Look how far you've come!</p>
            </div>
          </div>

          <div className="profile-stats-grid">
            {profileStats.map((stat) => (
              <article className="profile-stat-card" key={stat.label}>
                <div className="profile-stat-icon">{stat.icon}</div>
                <strong>{stat.value}</strong>
                <span>{stat.label}</span>
              </article>
            ))}
          </div>
        </section>

        {/* BADGES */}
        <section className="profile-badges-section">
          <div className="profile-section-heading">
            <div>
              <h2>My Badges</h2>
              <p>Special rewards for your discoveries.</p>
            </div>
            <button className="profile-view-all-button">View all →</button>
          </div>

          <div className="profile-badges-grid">
            {badges.map((badge) => (
              <article
                className={`profile-badge-card badge-${badge.color}`}
                key={badge.title}
              >
                <div className="profile-badge-icon">{badge.icon}</div>
                <h3>{badge.title}</h3>
                <p>{badge.description}</p>
                <span className="profile-badge-earned">✓ Earned</span>
              </article>
            ))}
          </div>
        </section>

        {/* ADVENTURE HISTORY */}
        <section className="profile-history-section">
          <div className="profile-section-heading">
            <div>
              <h2>Adventure History</h2>
              <p>Your latest journeys through Arad.</p>
            </div>

            <button
              className="profile-view-all-button"
              onClick={() => navigate("/adventures")}
            >
              View all →
            </button>
          </div>

          <div className="profile-history-list">
            {adventureHistory.map((adventure) => (
              <article className="profile-history-card" key={adventure.title}>
                <div className="profile-history-icon">{adventure.icon}</div>

                <div className="profile-history-info">
                  <div className="profile-history-title-row">
                    <h3>{adventure.title}</h3>
                    <span
                      className={`profile-history-status ${
                        adventure.status === "Completed"
                          ? "completed"
                          : "in-progress"
                      }`}
                    >
                      {adventure.status}
                    </span>
                  </div>

                  <div className="profile-history-meta">
                    <span>{adventure.category}</span>
                    <span>•</span>
                    <span>{adventure.date}</span>
                  </div>

                  <div className="profile-history-progress">
                    <div className="profile-history-progress-track">
                      <div
                        className="profile-history-progress-fill"
                        style={{ width: `${adventure.progress}%` }}
                      ></div>
                    </div>
                    <span>{adventure.progress}%</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* FOOTER */}
        <footer className="profile-page-footer">
          <span>✦</span> Keep exploring. Your next story awaits in Arad.
          <span>✦</span>
        </footer>
      </main>
    </div>
  );
}

export default ProfilePage;
