import { useState } from "react";
import { useNavigate } from "react-router-dom";

import "../styles/RewardsPage.css";

// Shared sidebar
import Sidebar from "../layout/Sidebar.jsx";
// Reward preview modal for demonstration offers.
import RewardDetailsModal from "../rewards/RewardDetailsModal.jsx";
// Display the generated demonstration voucher.
import VoucherDetailsModal from "../rewards/VoucherDetailsModal.jsx";

function RewardsPage() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  // Store the reward currently selected for preview.
  const [selectedReward, setSelectedReward] = useState(null);
  // Store the voucher currently selected for preview.// Store the voucher currently displayed in the QR preview.
  const [selectedVoucher, setSelectedVoucher] = useState(null);

  // Temporary demo data. Later, these values will come from the backend.
  const [points] = useState(250);

  const [availableRewards] = useState([
    {
      id: "museum-discount",
      icon: "🏛️",
      title: "Arad Museum Discount",
      description:
        "Discover Arad's cultural heritage with a proposed 10% ticket discount.",
      category: "Cultural Experience",
      points: 100,
      color: "ticket",

      // The location is real, but the partnership is not confirmed.
      partnerName: "Complexul Muzeal Arad",
      offerStatus: "coming_soon",
    },
    {
      id: "restaurant-discount",
      icon: "🍽️",
      title: "Restaurant Experience",
      description:
        "Enjoy a proposed 10% discount at a local restaurant in Arad.",
      category: "Local Gastronomy",
      points: 150,
      color: "coffee",

      // Example business; no active discount agreement exists.
      partnerName: "Mondo Restaurant",
      offerStatus: "coming_soon",
    },
    {
      id: "coffee-discount",
      icon: "☕",
      title: "Coffee Explorer",
      description: "Take a break with a proposed 15% discount on coffee.",
      category: "Local Experience",
      points: 80,
      color: "coffee",

      // Example business; this is not an approved offer.
      partnerName: "Tucano Coffee",
      offerStatus: "coming_soon",
    },
    {
      id: "golden-explorer",
      icon: "🏅",
      title: "Golden Explorer",
      description:
        "Celebrate your achievements with a digital explorer reward.",
      category: "Digital Reward",
      points: 300,
      color: "gold",

      // This reward can eventually be issued directly by Arad Quest.
      partnerName: "Arad Quest",
      offerStatus: "coming_soon",
    },
  ]);

  const [claimedRewards] = useState([]);

  // Open the details modal for the selected reward.
  // This does not deduct XP or create a real voucher.
  const handleRedeemReward = (reward) => {
    setSelectedReward(reward);
  };

  // Close the reward preview modal.
  const handleCloseRewardModal = () => {
    setSelectedReward(null);
  };

  // Generate a unique demonstration identifier for each preview.
  // This identifier is not issued or validated by the backend.
  const handleGenerateDemoVoucher = (reward) => {
    // Digital badges do not require a QR code.
    if (reward.id === "golden-explorer") {
      setSelectedReward(null);
      return;
    }

    // Generate a random UUID for this demonstration voucher.
    const uniqueId = crypto.randomUUID(); //creaza un identificator nou pentru fiecare previzualizare

    // Create a clearly marked, non-redeemable preview voucher.
    const demoVoucher = {
      id: uniqueId,
      rewardId: reward.id,
      title: reward.title,
      partnerName: reward.partnerName,
      voucherCode: `AQ-DEMO-${uniqueId}`,
      status: "preview",
    };

    // Close the reward details and open the QR preview.
    setSelectedReward(null);
    setSelectedVoucher(demoVoucher);
  };

  return (
    <div className="rewards-page">
      {/* SIDEBAR */}

      {/* SHARED SIDEBAR + MOBILE HAMBURGER MENU */}
      <Sidebar
        activePage="Rewards"
        menuOpen={menuOpen}
        setMenuOpen={setMenuOpen}
      />
      {/* MAIN CONTENT */}
      <main className="rewards-main">
        {/* HEADER */}
        <header className="rewards-page-header">
          <div>
            <span className="rewards-eyebrow">YOUR TREASURE COLLECTION</span>
            <h1>Rewards & Treasures</h1>
            <p>Turn your adventures into unforgettable rewards.</p>
          </div>

          <button
            className="rewards-profile-button"
            onClick={() => navigate("/profile")}
          >
            ♙ My Profile
          </button>
        </header>

        {/* POINTS BALANCE */}
        <section className="rewards-balance-card">
          <div className="rewards-balance-content">
            <div className="rewards-balance-text">
              <span className="rewards-balance-label">
                ✦ YOUR TREASURE BALANCE
              </span>

              <h2>{points.toLocaleString()} XP</h2>

              <p>Every discovery brings you closer to a new reward.</p>

              <button
                className="rewards-explore-button"
                onClick={() => navigate("/adventures")}
              >
                Explore Adventures <span>→</span>
              </button>
            </div>

            <div className="rewards-treasure-illustration">
              <span className="rewards-sparkle sparkle-one">✦</span>
              <span className="rewards-sparkle sparkle-two">✧</span>
              <div className="rewards-treasure-circle">
                <span>🧰</span>
              </div>
              <span className="rewards-sparkle sparkle-three">✦</span>
            </div>
          </div>

          <div className="rewards-balance-decoration"></div>
        </section>

        {/* AVAILABLE REWARDS */}
        <section className="rewards-available-section">
          <div className="rewards-section-heading">
            <div>
              <span className="rewards-section-eyebrow">
                THE TREASURE CHEST
              </span>
              <h2>Available Rewards</h2>
              <p>Choose a treasure and make your journey even more special.</p>
            </div>

            <span className="rewards-count">
              {availableRewards.length} rewards
            </span>
          </div>

          {availableRewards.length > 0 ? (
            <div className="rewards-grid">
              {availableRewards.map((reward) => {
                return (
                  <article
                    className={`rewards-card reward-${reward.color}`}
                    key={reward.id}
                  >
                    <div className="rewards-card-top">
                      {/* Display the reward category and its demo status. */}
                      <div className="rewards-card-labels">
                        <span className="rewards-category">
                          {reward.category}
                        </span>

                        {/* Clearly identify rewards without real partners. */}
                        {reward.isDemo && (
                          <span className="rewards-demo-badge"></span>
                        )}
                      </div>

                      <span className="rewards-card-star">✦</span>
                    </div>

                    <div className="rewards-card-icon">{reward.icon}</div>

                    <h3>{reward.title}</h3>

                    <p className="rewards-card-description">
                      {reward.description}
                    </p>

                    <div className="rewards-card-footer">
                      <div className="rewards-cost">
                        <span>⭐</span>
                        <strong>{reward.points} XP</strong>
                      </div>

                      {/* Open a demo preview instead of purchasing a reward. */}
                      <button
                        type="button"
                        className="rewards-redeem-button"
                        onClick={() => handleRedeemReward(reward)}
                      >
                        Preview Reward
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="rewards-empty-state">
              <span>✨</span>
              <h3>You've discovered every treasure!</h3>
              <p>New rewards will be waiting for you soon.</p>
            </div>
          )}
        </section>

        {/* MY REWARDS */}
        <section className="rewards-claimed-section">
          <div className="rewards-section-heading">
            <div>
              <span className="rewards-section-eyebrow">YOUR COLLECTION</span>
              <h2>My Rewards</h2>
              <p>Your treasures, ready to be enjoyed.</p>
            </div>

            <span className="rewards-count">
              {claimedRewards.length} claimed
            </span>
          </div>

          {claimedRewards.length > 0 ? (
            <div className="rewards-claimed-list">
              {claimedRewards.map((reward) => (
                <article className="rewards-claimed-card" key={reward.id}>
                  <div
                    className={`rewards-claimed-icon reward-${reward.color}`}
                  >
                    {reward.icon}
                  </div>

                  <div className="rewards-claimed-info">
                    <h3>{reward.title}</h3>
                    <p>{reward.description}</p>

                    <div className="rewards-claimed-meta">
                      <span>Claimed on {reward.claimedAt}</span>
                      <span>•</span>
                      <span>{reward.points} XP</span>
                    </div>
                  </div>

                  <div className="rewards-claimed-code">
                    <span>REWARD CODE</span>
                    <strong>{reward.rewardCode}</strong>
                    <small>Demo code</small>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="rewards-empty-state rewards-claimed-empty">
              <span>🎁</span>
              <h3>Your treasure collection is waiting.</h3>
              <p>Redeem your first reward and it will appear here.</p>
            </div>
          )}
        </section>

        {/* FOOTER */}
        <footer className="rewards-page-footer">
          <span>✦</span>
          Every quest has a treasure. Keep exploring Arad.
          <span>✦</span>
        </footer>
      </main>

      {/* Show the preview only when a reward is selected. */}
      <RewardDetailsModal
        reward={selectedReward}
        onClose={handleCloseRewardModal}
        onGenerateDemo={handleGenerateDemoVoucher}
      />

      {/* Display the QR code after generating a demo voucher. */}
      <VoucherDetailsModal
        voucher={selectedVoucher}
        onClose={() => setSelectedVoucher(null)}
      />
    </div>
  );
}

export default RewardsPage;
