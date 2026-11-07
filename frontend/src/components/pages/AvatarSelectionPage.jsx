import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth.js";
import { updateProfile } from "../services/authService.js";
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

  const { updateUser } = useAuth();

  const handleFinalize = async () => {
    if (!selectedAvatar) {
      alert("Please choose an avatar before continuing!");
      return;
    }

    // Save the avatar on the server, then keep the updated user in the app
    try {
      const updatedUser = await updateProfile({ avatar: selectedAvatar });
      updateUser(updatedUser);
    } catch (error) {
      alert(error.message || "Unable to save your avatar. Please try again.");
      return;
    }

    // Continue to HomePage
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
