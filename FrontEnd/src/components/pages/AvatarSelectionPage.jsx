import { useState } from "react";
import { useNavigate } from "react-router-dom";
import aradQuestLogo from "../../assets/images/backgrounds/aradquest-logo.png";
import "../styles/AvatarSelectionPage.css";

// AVATARS
import explorerAvatar from "../../assets/images/avatars/explorer.png";
import adventurerAvatar from "../../assets/images/avatars/adventurer.png";
import championAvatar from "../../assets/images/avatars/champion.png";
import pathfinderAvatar from "../../assets/images/avatars/pathfinder.png";

const avatars = [
  {
    id: "explorer",
    name: "Explorer",
    image: explorerAvatar,
  },

  {
    id: "adventurer",
    name: "Adventurer",
    image: adventurerAvatar,
  },

  {
    id: "champion",
    name: "Champion",
    image: championAvatar,
  },

  {
    id: "pathfinder",
    name: "Pathfinder",
    image: pathfinderAvatar,
  },
];

function AvatarSelectionPage() {
  //Stores selected avatar's ID
  const [selectedAvatar, setSelectedAvatar] = useState(null);

  //Allows navigation between pages
  const navigate = useNavigate();

  const handleFinalize = () => {
    if (!selectedAvatar) {
      alert("Please choose an avatar before continuing!");
      return;
    }

    localStorage.setItem("selectedAvatar", selectedAvatar);
    navigate("/home");
  };

  return (
    <main className="avatar-page">
      <img src={aradQuestLogo} alt="ARAD QUEST logo" className="avatar-logo" />
      <header className="avatar-header">
        <h1>One more step!</h1>
        <div className="avatar-title-divider"></div>
        <p>Choose an avatar based on your preference.</p>
      </header>

      {/* Avatar list / options */}
      <section className="avatar-grid" aria-label="Choose your avatar">
        {avatars.map((avatar) => (
          <button
            key={avatar.id}
            type="button"
            className={`avatar-option ${selectedAvatar === avatar.id ? "selected" : ""}`}
            onClick={() => setSelectedAvatar(avatar.id)}
            aria-pressed={selectedAvatar === avatar.id}
            aria-label={`Choose ${avatar.name} avatar`}
          >
            <span className="avatar-image-wrapper">
              {avatar.image ? (
                <img
                  src={avatar.image}
                  alt={avatar.name}
                  className="avatar-image"
                />
              ) : (
                <span className="avatar-image-placeholder" />
              )}
            </span>
            <span className="avatar-name">{avatar.name}</span>
          </button>
        ))}
      </section>

      {/* Confirmation button */}
      <button
        type="button"
        className="avatar-finalize-button"
        onClick={handleFinalize}
      >
        Finalise
      </button>
    </main>
  );
}

export default AvatarSelectionPage;
