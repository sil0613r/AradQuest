import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/ProfilePage.css";
import Sidebar from "../layout/Sidebar.jsx";
import { useAuth } from "../context/useAuth.js";
import { getProfile } from "../services/authService.js";

// Arad Quest assets
import explorerAvatar from "../../assets/images/avatars/explorer.png";
import adventurerAvatar from "../../assets/images/avatars/adventurer.png";
import championAvatar from "../../assets/images/avatars/champion.png";
import pathfinderAvatar from "../../assets/images/avatars/pathfinder.png";

const avatarImages = {
  explorer: explorerAvatar,
  adventurer: adventurerAvatar,
  champion: championAvatar,
  pathfinder: pathfinderAvatar,
};

const ADVENTURE_ICONS = { nature: "🌿", history: "🏛️" };
const ADVENTURE_CATEGORIES = { nature: "Nature", history: "History" };

// Shown as empty fields until the database has a value for them.
const EMPTY_STATS = { totalPoints: 0, adventuresStarted: 0, placesDiscovered: 0, badgesEarned: 0 };

function formatDate(value) {
  if (!value) return "";
  return new Date(value).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatMonthYear(value) {
  if (!value) return "";
  return new Date(value).toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
  });
}

function ProfilePage() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  // The name, email and avatar come from the logged-in account.
  const { user } = useAuth();
  const username = user?.username || "";
  const email = user?.email || "";
  const avatarImage = avatarImages[user?.avatar] || explorerAvatar;

  // Everything else comes from the database (GET /users/me). Null until it has loaded.
  const [profile, setProfile] = useState(null);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let cancelled = false;
    getProfile()
      .then((data) => {
        if (!cancelled) setProfile(data);
      })
      .catch(() => {
        if (!cancelled) setLoadError("Your profile could not be loaded. Please refresh the page.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const stats = profile?.profile?.stats ?? EMPTY_STATS;
  const badges = profile?.profile?.badges ?? [];
  const adventureHistory = profile?.profile?.adventureHistory ?? [];
  const joinedAt = formatMonthYear(profile?.joinedAt);
  const completedAdventures = adventureHistory.filter((a) => a.status === "completed").length;

  const profileStats = [
    { icon: "⭐", value: stats.totalPoints, label: "Total Points" },
    { icon: "🗺️", value: stats.adventuresStarted, label: "Adventures Started" },
    { icon: "📍", value: stats.placesDiscovered, label: "Places Discovered" },
    { icon: "🏆", value: stats.badgesEarned, label: "Badges Earned" },
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

          {/* Update: name, email and avatar are changed on the Settings page */}
          <button
            className="profile-edit-button"
            onClick={() => navigate("/settings")}
          >
            ✎ Edit Profile
          </button>
        </header>

        {loadError && <p className="profile-empty">{loadError}</p>}

        {/* PROFILE HERO */}
        <section className="profile-hero-card">
          <div className="profile-hero-overlay">
            <div className="profile-hero-avatar-wrapper">
              <img
                src={avatarImage}
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
                {joinedAt && <span>🗓️ Member since {joinedAt}</span>}
              </div>
            </div>

            <div className="profile-level-card">
              <span className="profile-level-icon">🧭</span>
              <span className="profile-level-label">ADVENTURES</span>
              <strong>{stats.adventuresStarted}</strong>
              <small>{completedAdventures} completed</small>
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
          </div>

          {badges.length === 0 ? (
            <p className="profile-empty">No badges yet. Complete locations to earn them.</p>
          ) : (
            <div className="profile-badges-grid">
              {badges.map((badge) => (
                <article className="profile-badge-card badge-blue" key={badge.name}>
                  <div className="profile-badge-icon">🏅</div>
                  <h3>{badge.name}</h3>
                  <p>{badge.description}</p>
                  <span className="profile-badge-earned">
                    ✓ Earned {formatDate(badge.earnedAt)}
                  </span>
                </article>
              ))}
            </div>
          )}
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

          {adventureHistory.length === 0 ? (
            <p className="profile-empty">No adventures started yet.</p>
          ) : (
            <div className="profile-history-list">
              {adventureHistory.map((adventure) => {
                const completed = adventure.status === "completed";
                return (
                  <article className="profile-history-card" key={adventure.routeId}>
                    <div className="profile-history-icon">
                      {ADVENTURE_ICONS[adventure.adventure] ?? "🧭"}
                    </div>

                    <div className="profile-history-info">
                      <div className="profile-history-title-row">
                        <h3>{adventure.title}</h3>
                        <span
                          className={`profile-history-status ${
                            completed ? "completed" : "in-progress"
                          }`}
                        >
                          {completed ? "Completed" : "In Progress"}
                        </span>
                      </div>

                      <div className="profile-history-meta">
                        <span>{ADVENTURE_CATEGORIES[adventure.adventure] ?? ""}</span>
                        <span>•</span>
                        <span>{formatDate(adventure.startedAt)}</span>
                      </div>

                      <div className="profile-history-progress">
                        <div className="profile-history-progress-track">
                          <div
                            className="profile-history-progress-fill"
                            style={{ width: `${adventure.progressPercentage}%` }}
                          ></div>
                        </div>
                        <span>{adventure.progressPercentage}%</span>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
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
