import { useEffect } from "react";

// Display a reward preview without making a real purchase.
function RewardDetailsModal({ reward, onClose, onGenerateDemo }) {
  // Close the modal when the Escape key is pressed.
  useEffect(() => {
    if (!reward) return;
    // Identify whether the selected reward is a digital badge.

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, [reward, onClose]);

  // Do not render the modal if no reward is selected.
  if (!reward) return null;

  const isDigitalBadge = reward.type === "digitalBadge";
  return (
    <div className="reward-modal-overlay" onClick={onClose}>
      <div
        className="reward-modal-content"
        role="dialog"
        aria-modal="true"
        aria-labelledby="reward-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        {/* Close button */}
        <button
          type="button"
          className="reward-modal-close"
          onClick={onClose}
          aria-label="Close reward details"
        >
          ×
        </button>

        {/* Reward details */}
        <div className="reward-modal-icon">{reward.icon}</div>

        {/* Display the appropriate status for each reward type. */}
        <span className="rewards-demo-badge">
          {isDigitalBadge ? "Digital Badge" : "Coming Soon"}
        </span>

        <h2 id="reward-modal-title">{reward.title}</h2>

        {/* Display the reward description. */}
        <p>{reward.description}</p>

        {/* Show the partner location only for future discount offers. */}
        {!isDigitalBadge && (
          <p className="reward-modal-partner">📍 {reward.partnerName}</p>
        )}

        {/* Display the reward's point cost. */}
        <div className="reward-modal-points">⭐ {reward.points} XP</div>

        {/* Explain the availability of each reward type. */}
        <p className="reward-modal-notice">
          {isDigitalBadge
            ? "This is a virtual Arad Quest badge. Badge collection will be available as part of the rewards system."
            : "This is a proposed future reward. The discount is not currently available and no partnership has been confirmed."}
        </p>

        {/* Generate a demo voucher in the next step. */}
        <button
          type="button"
          className="reward-modal-generate"
          onClick={() => onGenerateDemo(reward)}
        >
          {/* Preview the selected reward without deducting XP. */}
          {isDigitalBadge ? "Preview Digital Badge" : "Preview Future Voucher"}
        </button>
      </div>
    </div>
  );
}

export default RewardDetailsModal;
