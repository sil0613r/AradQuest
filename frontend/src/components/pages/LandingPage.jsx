// This page contains the main landing page component for the application
import { useNavigate } from "react-router-dom";
import cityHallImage from "../../assets/images/backgrounds/arad-city-hall.png";
import aradQuestLogo from "../../assets/images/backgrounds/aradquest-logo.png";
import "../styles/LandingPage.css";

function LandingPage() {
  const navigate = useNavigate();
  return (
    <main className="landing-page">
      {/* Upper section with city hall image */}
      <section className="hero-section">
        <img
          src={cityHallImage}
          alt="Primăria Municipiului Arad"
          className="landing-background"
        />

        <div className="landing-overlay" aria-hidden="true"></div>
      </section>
      {/* Lower section with title, description & buttons */}
      <section className="landing-content">
        <h1 className="landing-title">ARAD QUEST</h1>
        <p className="landing-tagline">
          Discover Arad and get rewarded for it!
        </p>

        <div className="landing-actions">
          <button
            type="button"
            className="landing-button landing-button-primary"
            onClick={() => navigate("/login")}
          >
            Log in
          </button>

          <button
            type="button"
            className="landing-button landing-button-secondary"
            onClick={() => navigate("/register")}
          >
            Register
          </button>
        </div>
      </section>
      <img
        className="landing-logo-corner"
        src={aradQuestLogo}
        alt="Arad Quest Logo"
      />
    </main>
  );
}
// Export the LandingPage component as the default export
export default LandingPage;
