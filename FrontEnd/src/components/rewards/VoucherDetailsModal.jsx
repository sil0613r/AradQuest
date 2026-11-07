import { useEffect } from "react";
import VoucherQRCode from "./VoucherQRCode.jsx";

// Display a demonstration voucher with its QR code.
function VoucherDetailsModal({ voucher, onClose }) {
  useEffect(() => {
    if (!voucher) return;

    // Allow the user to close the modal with Escape.
    const handleEscape = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, [voucher, onClose]);

  // Do not display the modal without a selected voucher.
  if (!voucher) return null;

  return (
    <div className="reward-modal-overlay" onClick={onClose}>
      <div
        className="reward-modal-content"
        role="dialog"
        aria-modal="true"
        aria-labelledby="voucher-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        {/* Close the voucher preview. */}
        <button
          type="button"
          className="reward-modal-close"
          onClick={onClose}
          aria-label="Close voucher preview"
        >
          ×
        </button>

        <span className="rewards-demo-badge">Preview Only</span>

        <h2 id="voucher-modal-title">{voucher.title}</h2>

        <p>{voucher.partnerName}</p>

        {/* Render the QR code using the generated voucher identifier. */}
        <VoucherQRCode voucherCode={voucher.voucherCode} />

        <p className="reward-modal-notice">
          This is a preview of a future Arad Quest reward. It is not valid for
          purchases or discounts.
        </p>

        <button
          type="button"
          className="reward-modal-generate"
          onClick={onClose}
        >
          Close Preview
        </button>
      </div>
    </div>
  );
}

export default VoucherDetailsModal;
