import { QRCodeSVG } from "qrcode.react";

// Render a QR code for a demonstration voucher.
// The code is not valid for purchases at real businesses.
function VoucherQRCode({ voucherCode }) {
  // Avoid rendering an empty QR code.
  if (!voucherCode) return null;

  return (
    <div className="voucher-qr-container">
      {/* Generate a QR code from the provided voucher code. */}
      <QRCodeSVG
        value={voucherCode}
        size={180}
        bgColor="#ffffff"
        fgColor="#211d17"
        level="H"
        marginSize={2}
      />

      {/* Display the code as readable text. */}
      <p className="voucher-qr-code">{voucherCode}</p>

      {/* Explain that this QR code is for demonstration only. */}
      <p className="voucher-qr-notice">
        Preview QR Code — Not valid for real redemption.
      </p>
    </div>
  );
}

export default VoucherQRCode;
