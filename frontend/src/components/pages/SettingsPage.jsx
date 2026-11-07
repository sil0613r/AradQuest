import { useEffect, useState } from "react";
import Sidebar from "../layout/Sidebar";
import { useAuth } from "../context/useAuth.js";
import { getSettings, saveSettings, updateProfile } from "../services/authService.js";
import "../styles/SettingsPage.css";

import explorerAvatar from "../../assets/images/avatars/explorer.png";
import adventurerAvatar from "../../assets/images/avatars/adventurer.png";
import championAvatar from "../../assets/images/avatars/champion.png";
import pathfinderAvatar from "../../assets/images/avatars/pathfinder.png";

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

function SettingsPage() {
  const [menuOpen, setMenuOpen] = useState(false);

  // The name, email and avatar come from the logged-in account.
  const { user, updateUser } = useAuth();

  const avatar = avatarOptions[user?.avatar] || avatarOptions.explorer;

  const [username, setUsername] = useState(user?.username || "Explorer");

  const [email, setEmail] = useState(user?.email || "");

  // Notification switches. Defaults are used until the saved settings load.
  const [notifications, setNotifications] = useState({
    adventureUpdates: true,
    rewards: true,
    announcements: false,
  });

  const [saveMessage, setSaveMessage] = useState("");

  const [saveFailed, setSaveFailed] = useState(false);

  useEffect(() => {
    let isCancelled = false;

    getSettings()
      .then((stored) => {
        if (!isCancelled) setNotifications(stored);
      })
      .catch(() => {
        // Keep the default switches if the settings cannot be loaded.
      });

    return () => {
      isCancelled = true;
    };
  }, []);

  // Handle notification changes
  const handleNotificationChange = (name) => {
    setNotifications((previous) => ({
      ...previous,
      [name]: !previous[name],
    }));

    setSaveMessage("");
  };

  // Save the account details and notification switches on the server.
  const handleSave = async (event) => {
    event.preventDefault();

    setSaveFailed(false);
    setSaveMessage("");

    try {
      const updatedUser = await updateProfile({ username, email });
      updateUser(updatedUser);
      await saveSettings(notifications);
      setSaveMessage("Your settings have been saved successfully!");
    } catch (error) {
      setSaveFailed(true);
      setSaveMessage(error.message || "Unable to save your settings.");
    }
  };

  return (
    <div className="settings-page">
      {/* SIDEBAR */}
      <Sidebar
        activePage="Settings"
        menuOpen={menuOpen}
        setMenuOpen={setMenuOpen}
      />

      {/* MAIN CONTENT */}
      <main className="settings-main">
        {/* HEADER */}
        <header className="settings-header">
          <div className="settings-title">
            <button
              className="settings-hamburger"
              onClick={() => setMenuOpen(true)}
              aria-label="Open navigation menu"
            >
              ☰
            </button>

            <div>
              <h1>Settings</h1>
              <p>Manage your Arad Quest experience.</p>
            </div>
          </div>

          <div className="settings-header-icon">⚙️</div>
        </header>

        {/* PAGE INTRO */}
        <section className="settings-intro">
          <div>
            <span className="settings-intro-icon">✦</span>
            <h2>Your Adventure, Your Settings</h2>
            <p>
              Personalize your account and choose how you want to experience
              Arad Quest.
            </p>
          </div>
        </section>

        <form onSubmit={handleSave}>
          {/* ACCOUNT SETTINGS */}
          <section className="settings-section">
            <div className="settings-section-heading">
              <span className="section-icon">♙</span>

              <div>
                <h2>Account Information</h2>
                <p>Manage your personal account details.</p>
              </div>
            </div>

            <div className="settings-card">
              <div className="settings-avatar">
                <img
                  src={avatar.image}
                  alt={`${avatar.label} avatar`}
                  className="settings-avatar-image"
                />
              </div>

              <div className="account-fields">
                <div className="settings-field">
                  <label htmlFor="settings-username">Username</label>

                  <input
                    id="settings-username"
                    type="text"
                    value={username}
                    onChange={(event) => {
                      setUsername(event.target.value);
                      setSaveMessage("");
                    }}
                    placeholder="Enter your username"
                    required
                  />
                </div>

                <div className="settings-field">
                  <label htmlFor="settings-email">Email Address</label>

                  <input
                    id="settings-email"
                    type="email"
                    value={email}
                    onChange={(event) => {
                      setEmail(event.target.value);
                      setSaveMessage("");
                    }}
                    placeholder="Enter your email address"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* NOTIFICATIONS */}
          <section className="settings-section">
            <div className="settings-section-heading">
              <span className="section-icon">♧</span>

              <div>
                <h2>Notifications</h2>
                <p>Choose which updates you want to receive.</p>
              </div>
            </div>

            <div className="settings-card notifications-card">
              {/* ADVENTURE UPDATES */}
              <div className="settings-preference-row">
                <div className="preference-info">
                  <span className="preference-icon">🧭</span>

                  <div>
                    <h3>Adventure Updates</h3>
                    <p>Get updates about your adventures.</p>
                  </div>
                </div>

                <label className="settings-switch">
                  <input
                    type="checkbox"
                    checked={notifications.adventureUpdates}
                    onChange={() =>
                      handleNotificationChange("adventureUpdates")
                    }
                  />
                  <span className="switch-slider"></span>
                </label>
              </div>

              <div className="settings-divider"></div>

              {/* REWARDS */}
              <div className="settings-preference-row">
                <div className="preference-info">
                  <span className="preference-icon">🎁</span>

                  <div>
                    <h3>Rewards & Offers</h3>
                    <p>Stay informed about rewards and special offers.</p>
                  </div>
                </div>

                <label className="settings-switch">
                  <input
                    type="checkbox"
                    checked={notifications.rewards}
                    onChange={() => handleNotificationChange("rewards")}
                  />
                  <span className="switch-slider"></span>
                </label>
              </div>

              <div className="settings-divider"></div>

              {/* ANNOUNCEMENTS */}
              <div className="settings-preference-row">
                <div className="preference-info">
                  <span className="preference-icon">📢</span>

                  <div>
                    <h3>Announcements</h3>
                    <p>Receive news about Arad Quest.</p>
                  </div>
                </div>

                <label className="settings-switch">
                  <input
                    type="checkbox"
                    checked={notifications.announcements}
                    onChange={() => handleNotificationChange("announcements")}
                  />
                  <span className="switch-slider"></span>
                </label>
              </div>
            </div>
          </section>

          {/* SECURITY */}
          <section className="settings-section">
            <div className="settings-section-heading">
              <span className="section-icon">♢</span>

              <div>
                <h2>Privacy & Security</h2>
                <p>Information about your account security.</p>
              </div>
            </div>

            <div className="settings-card security-card">
              <div className="preference-info">
                <span className="preference-icon">🔒</span>

                <div>
                  <h3>Account Security</h3>
                  <p>Keep your account information safe and up to date.</p>
                </div>
              </div>

              <span className="security-status">Account Settings</span>
            </div>
          </section>

          {/* SAVE BUTTON */}
          <div className="settings-save-area">
            {saveMessage && (
              <p className={saveFailed ? "settings-error" : "settings-success"}>
                {saveFailed ? saveMessage : `✓ ${saveMessage}`}
              </p>
            )}

            <button type="submit" className="settings-save-button">
              Save Changes <span>→</span>
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}

export default SettingsPage;
