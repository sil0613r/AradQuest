import { useEffect } from "react";
import "../styles/VisualHintCarousel.css";

function VisualHintCarousel({
  images = [],
  isOpen,
  activeIndex = 0,
  onIndexChange,
  onClose,
}) {
  const count = images.length;
  const currentIndex = count > 0 ? ((activeIndex % count) + count) % count : 0;

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
      if (count < 2) return;
      if (event.key === "ArrowRight") onIndexChange((currentIndex + 1) % count);
      if (event.key === "ArrowLeft")
        onIndexChange((currentIndex - 1 + count) % count);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, count, currentIndex, onClose, onIndexChange]);

  if (!isOpen || count === 0) return null;

  const goPrevious = () => onIndexChange((currentIndex - 1 + count) % count);
  const goNext = () => onIndexChange((currentIndex + 1) % count);

  return (
    <div className="visual-hint-modal-overlay" onClick={onClose}>
      <div
        className="visual-hint-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Visual clue gallery"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          className="visual-hint-modal-close"
          type="button"
          onClick={onClose}
          aria-label="Close visual hints"
        >
          ×
        </button>

        <div className="visual-hint-modal-heading">
          <span>📍 VISUAL DISCOVERY</span>
          <h2>A closer look...</h2>
          <p>Look carefully. Every detail might be important.</p>
        </div>

        <div className="visual-hint-carousel visual-hint-carousel--uniform">
          <button
            className="carousel-arrow carousel-arrow-left"
            type="button"
            onClick={goPrevious}
            aria-label="Previous image"
            disabled={count < 2}
          >
            ‹
          </button>

          <img
            src={images[currentIndex]}
            alt={`Visual hint ${currentIndex + 1}`}
            className="visual-hint-carousel-image visual-hint-carousel-image--uniform"
          />

          <button
            className="carousel-arrow carousel-arrow-right"
            type="button"
            onClick={goNext}
            aria-label="Next image"
            disabled={count < 2}
          >
            ›
          </button>
        </div>

        <div className="visual-hint-carousel-footer">
          <span>
            {currentIndex + 1} / {count}
          </span>
          <div className="carousel-dots">
            {images.map((image, index) => (
              <button
                key={`${image}-${index}`}
                type="button"
                className={
                  index === currentIndex
                    ? "carousel-dot active"
                    : "carousel-dot"
                }
                onClick={() => onIndexChange(index)}
                aria-label={`Go to image ${index + 1}`}
                aria-current={index === currentIndex ? "true" : undefined}
              />
            ))}
          </div>
        </div>

        <button
          className="visual-hint-done-button"
          type="button"
          onClick={onClose}
        >
          Back to the clue
        </button>
      </div>
    </div>
  );
}

export default VisualHintCarousel;
