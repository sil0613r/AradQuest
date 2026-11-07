import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getProgress } from "../services/gameService.js";
import { ADVENTURE_LOCATIONS } from "../data/adventureLocations.js";

import "../styles/AdventuresPage.css";

// Shared sidebar
import Sidebar from "../layout/Sidebar.jsx";

// Arad Quest assets
import natureImage from "../../assets/images/backgrounds/nature-adventure.JPG";
import historyImage from "../../assets/images/backgrounds/history-adventure.JPG";

// Total clues of an adventure, from its locations.
function clueCount(adventureId) {
  return ADVENTURE_LOCATIONS[adventureId].reduce((sum, location) => sum + location.clues, 0);
}

// Turn the completed location IDs from the server into { adventureId: { completedClues, status } }.
function progressFromServer(completedLocations) {
  const result = {};

  for (const [adventureId, locations] of Object.entries(ADVENTURE_LOCATIONS)) {
    const done = locations.filter((location) => completedLocations.includes(location.id));

    if (done.length === 0) continue;

    result[adventureId] = {
      completedClues: done.reduce((sum, location) => sum + location.clues, 0),
      status: done.length === locations.length ? "completed" : "in-progress",
    };
  }

  return result;
}

const adventures = [
  {
    id: "nature",
    title: "Nature Explorer",
    category: "Nature",
    description:
      "Explore the natural wonders of Arad County. Follow mysterious clues, discover hidden places and uncover the secrets of nature.",
    image: natureImage,
    icon: "🌿",
    points: 750,
    difficulty: "Medium",
    clues: clueCount("nature"),
  },
  {
    id: "history",
    title: "Historical Discoverer",
    category: "History",
    description:
      "Travel through time and uncover the forgotten stories of Arad. Follow the clues and discover the region's historical secrets.",
    image: historyImage,
    icon: "🏛️",
    points: 750,
    difficulty: "Medium",
    clues: clueCount("history"),
  },
];

function AdventuresPage() {
  const navigate = useNavigate();
  const [progress, setProgress] = useState({});
  const [menuOpen, setMenuOpen] = useState(false);

  // Load the player's progress from the server.
  useEffect(() => {
    let isCancelled = false;

    getProgress()
      .then((data) => {
        if (!isCancelled) setProgress(progressFromServer(data.completedLocations));
      })
      .catch((error) => {
        if (!isCancelled) console.error("Failed to load adventure progress:", error);
      });

    return () => {
      isCancelled = true;
    };
  }, []);

  // Calculate total progress
  const totalClues = adventures.reduce(
    (total, adventure) => total + adventure.clues,
    0,
  );

  const completedClues = adventures.reduce(
    (total, adventure) => total + (progress[adventure.id]?.completedClues || 0),
    0,
  );

  const progressPercentage =
    totalClues > 0 ? Math.round((completedClues / totalClues) * 100) : 0;

  // Find an adventure currently in progress
  const ongoingAdventure = adventures.find(
    (adventure) => progress[adventure.id]?.status === "in-progress",
  );

  // Open adventure details
  const handleAdventureClick = (adventureId) => {
    navigate(`/adventures/${adventureId}`);
  };

  // Get adventure status
  const getAdventureStatus = (adventureId) => {
    const adventureProgress = progress[adventureId];

    if (!adventureProgress) {
      return "Not Started";
    }

    if (adventureProgress.status === "completed") {
      return "Completed";
    }

    return "In Progress";
  };

  return (
    <div className="adventures-page">
      {/* SHARED SIDEBAR + MOBILE HAMBURGER MENU */}
      <Sidebar
        activePage="My Adventures"
        menuOpen={menuOpen}
        setMenuOpen={setMenuOpen}
      />

      {/* MAIN CONTENT */}
      <main className="adventures-main">
        {/* PAGE HEADING */}
        <header className="adventures-header">
          <div className="adventures-heading">
            <div className="adventures-heading-icon">🧭</div>

            <div>
              <h1>My Adventures</h1>
              <p>Continue your journey and discover Arad&apos;s hidden gems!</p>
            </div>
          </div>

          <div className="adventures-overall-progress">
            <div
              className="adventures-overall-progress-circle"
              style={{
                background: `conic-gradient(#e5a92f ${progressPercentage}%, #e7d9c4 ${progressPercentage}%)`,
              }}
            >
              <span>{progressPercentage}%</span>
            </div>

            <div>
              <strong>Overall Progress</strong>
              <p>
                {completedClues}/{totalClues} clues solved
              </p>
            </div>
          </div>
        </header>

        {/* ONGOING ADVENTURE */}
        <section className="adventures-ongoing-section">
          <div className="adventures-section-heading">
            <h2>Ongoing Adventure</h2>
          </div>

          {ongoingAdventure ? (
            <article
              className="adventures-ongoing-card"
              style={{
                backgroundImage: `linear-gradient(90deg, rgba(24, 25, 19, 0.88), rgba(24, 25, 19, 0.12)), url(${ongoingAdventure.image})`,
              }}
            >
              <div className="adventures-ongoing-content">
                <span className="adventures-status adventures-ongoing-status">
                  ● In Progress
                </span>

                <h3>{ongoingAdventure.title}</h3>
                <p>{ongoingAdventure.description}</p>

                <div className="adventures-ongoing-progress-info">
                  <div className="adventures-progress-bar">
                    <div
                      className="adventures-progress-bar-fill"
                      style={{
                        width: `${
                          ((progress[ongoingAdventure.id]?.completedClues ||
                            0) /
                            ongoingAdventure.clues) *
                          100
                        }%`,
                      }}
                    />
                  </div>

                  <span>
                    {progress[ongoingAdventure.id]?.completedClues || 0}/
                    {ongoingAdventure.clues} clues
                  </span>
                </div>

                <button
                  className="adventures-continue-button"
                  onClick={() => handleAdventureClick(ongoingAdventure.id)}
                >
                  Continue Adventure →
                </button>
              </div>
            </article>
          ) : (
            <div className="adventures-empty-card">
              <span className="adventures-empty-icon">✨</span>

              <div>
                <h3>Your next adventure is waiting!</h3>
                <p>
                  Choose an adventure below and start discovering the hidden
                  stories of Arad.
                </p>
              </div>
            </div>
          )}
        </section>

        {/* AVAILABLE ADVENTURES */}
        <section className="adventures-available-section">
          <div className="adventures-section-heading">
            <div>
              <h2>Discover Your Adventures</h2>
              <p>Two paths. Countless discoveries.</p>
            </div>
          </div>

          <div className="adventures-cards-grid">
            {adventures.map((adventure) => {
              const completed = progress[adventure.id]?.completedClues || 0;
              const status = getAdventureStatus(adventure.id);

              return (
                <article className="adventures-card" key={adventure.id}>
                  <div className="adventures-card-image">
                    <img
                      src={adventure.image}
                      alt={`${adventure.title} scenery`}
                    />

                    <span className="adventures-card-icon">
                      {adventure.icon}
                    </span>

                    <span
                      className={`adventures-status ${
                        status === "Completed"
                          ? "adventures-completed-status"
                          : status === "In Progress"
                            ? "adventures-ongoing-status"
                            : "adventures-not-started-status"
                      }`}
                    >
                      {status}
                    </span>
                  </div>

                  <div className="adventures-card-content">
                    <span className="adventures-category">
                      {adventure.category}
                    </span>

                    <h3>{adventure.title}</h3>

                    <p className="adventures-description">
                      {adventure.description}
                    </p>

                    <div className="adventures-card-details">
                      <span>⭐ {adventure.points} pts</span>
                      <span>🧩 {adventure.clues} clues</span>
                      <span>◷ {adventure.difficulty}</span>
                    </div>

                    <div className="adventures-card-progress">
                      <div className="adventures-card-progress-label">
                        <span>Your progress</span>
                        <strong>
                          {completed}/{adventure.clues}
                        </strong>
                      </div>

                      <div className="adventures-progress-bar">
                        <div
                          className="adventures-progress-bar-fill"
                          style={{
                            width: `${(completed / adventure.clues) * 100}%`,
                          }}
                        />
                      </div>
                    </div>

                    <button
                      className="adventures-start-button"
                      onClick={() => handleAdventureClick(adventure.id)}
                    >
                      {status === "Not Started"
                        ? "Start Adventure →"
                        : status === "Completed"
                          ? "View Adventure →"
                          : "Continue Adventure →"}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        {/* PROGRESS SUMMARY */}
        <section className="adventures-summary">
          <div className="adventures-summary-item">
            <span className="adventures-summary-icon">🏆</span>
            <div>
              <h3>Clues Solved</h3>
              <strong>
                {completedClues}/{totalClues}
              </strong>
            </div>
          </div>

          <div className="adventures-summary-item">
            <span className="adventures-summary-icon">🧭</span>
            <div>
              <h3>Adventures Completed</h3>
              <strong>
                {
                  adventures.filter(
                    (adventure) =>
                      progress[adventure.id]?.status === "completed",
                  ).length
                }
                /2
              </strong>
            </div>
          </div>

          <div className="adventures-summary-item">
            <span className="adventures-summary-icon">⭐</span>
            <div>
              <h3>Available Points</h3>
              <strong>
                {adventures.reduce((total, adventure) => {
                  const isCompleted =
                    progress[adventure.id]?.status === "completed";

                  return total + (isCompleted ? adventure.points : 0);
                }, 0)}
              </strong>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default AdventuresPage;
