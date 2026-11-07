import { useEffect, useMemo, useRef, useState } from "react";

import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";

import L from "leaflet";

import "leaflet/dist/leaflet.css";
import "../styles/MapPage.css";

import Sidebar from "../layout/Sidebar.jsx";

import { demoObjectives } from "../data/objectives.js";

// --------------------------------------------------
// CUSTOM MAP MARKERS
// --------------------------------------------------

const createObjectiveIcon = (objective) => {
  const finalClass = objective.isFinal ? "final-objective-pin" : "";

  return L.divIcon({
    className: "objective-div-icon",
    html: `
      <div class="objective-pin ${finalClass}">
        <img src="${objective.image}" alt="${objective.name}" />
        ${objective.isFinal ? '<span class="objective-pin-star">★</span>' : ""}
      </div>
    `,
    iconSize: [58, 68],
    iconAnchor: [29, 64],
    popupAnchor: [0, -60],
  });
};

const userLocationIcon = L.divIcon({
  className: "user-location-div-icon",
  html: `
    <div class="user-location-marker">
      <div class="user-location-pulse"></div>
      <div class="user-location-dot"></div>
    </div>
  `,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

// --------------------------------------------------
// MAP HELPER
// --------------------------------------------------

function MapRecenter({ position }) {
  const map = useMap();

  useEffect(() => {
    if (position) {
      map.flyTo(position, 16, {
        duration: 1.2,
      });
    }
  }, [position, map]);

  return null;
}

// --------------------------------------------------
// MAIN COMPONENT / MAIN STATES
// --------------------------------------------------

function MapPage() {
  const [menuOpen, setMenuOpen] = useState(false);

  const [activeAdventure, setActiveAdventure] = useState("nature");
  const [userPosition, setUserPosition] = useState(null);

  // Load the saved progress once, when the page opens.
  const [discoveryProgress, setDiscoveryProgress] = useState(() =>
    JSON.parse(localStorage.getItem("adventureProgress") || "{}"),
  );
  const [showFinalDiscovery, setShowFinalDiscovery] = useState(false);
  const [arModalOpen, setArModalOpen] = useState(false);

  const watchIdRef = useRef(null);
  const lastFinalDiscoveryRef = useRef(null); //we'll use it to start and stop the gps tracking when the user completes the adventure, so we don't show the final discovery modal multiple times

  // Display only the objectives confirmed as completed.
  // The backend will eventually provide completedLocationIds.
  const discoveredObjectives = useMemo(() => {
    // Retrieve the completed location IDs for the selected adventure.
    const completedLocationIds =
      discoveryProgress[activeAdventure]?.completedLocationIds ?? [];

    // Convert the IDs into a Set for efficient lookups.
    const completedIds = new Set(
      Array.isArray(completedLocationIds) ? completedLocationIds : [],
    );

    // Show only locations that belong to the active adventure
    // and have been explicitly marked as completed.
    return demoObjectives.filter(
      (objective) =>
        objective.adventureId === activeAdventure &&
        completedIds.has(objective.id),
    );
  }, [activeAdventure, discoveryProgress]);

  const completedClues =
    discoveryProgress[activeAdventure]?.completedClues || 0;

  const totalClues = demoObjectives.filter(
    (objective) => objective.adventureId === activeAdventure,
  ).length;

  const isAdventureCompleted = completedClues >= totalClues;

  //This temporary function is used to simulate the completion of a clue. In a real application, this would be triggered by the user solving a clue or completing an objective.

  const handleCompleteClue = () => {
    if (completedClues >= totalClues) return;

    const updatedProgress = {
      ...discoveryProgress,
      [activeAdventure]: {
        completedClues: completedClues + 1,
      },
    };

    setDiscoveryProgress(updatedProgress);

    localStorage.setItem("adventureProgress", JSON.stringify(updatedProgress));
  };

  // --------------------------------------------------
  // GPS TRACKING
  // --------------------------------------------------

  const handleStartGPS = () => {
    if (!navigator.geolocation) {
      return;
    }

    if (watchIdRef.current !== null) {
      return;
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        // Retrieve the player's current GPS coordinates.
        const currentLatitude = position.coords.latitude;
        const currentLongitude = position.coords.longitude;

        // Update the player's marker position on the map.
        // We no longer calculate the travelled distance.
        setUserPosition([currentLatitude, currentLongitude]);
      },

      () => {
        if (watchIdRef.current !== null) {
          navigator.geolocation.clearWatch(watchIdRef.current);
          watchIdRef.current = null;
        }
      },
      {
        enableHighAccuracy: true,
        maximumAge: 3000,
        timeout: 15000,
      },
    );
  };

  // Stop GPS tracking when leaving the page.
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  // --------------------------------------------------
  // FINAL DISCOVERY EFFECT
  // --------------------------------------------------

  useEffect(() => {
    if (!isAdventureCompleted) return;

    const discoveryKey = `${activeAdventure}-${completedClues}`;

    if (lastFinalDiscoveryRef.current === discoveryKey) {
      return;
    }

    lastFinalDiscoveryRef.current = discoveryKey;
    setShowFinalDiscovery(true);
  }, [activeAdventure, completedClues, isAdventureCompleted]);

  // --------------------------------------------------
  // MY LOCATION BUTTON
  // --------------------------------------------------

  const handleMyLocation = () => {
    if (!userPosition) {
      handleStartGPS();
      return;
    }
  };

  // --------------------------------------------------
  // RENDER
  // --------------------------------------------------

  return (
    <div className="map-page-layout">
      {/* SHARED SIDEBAR */}

      <Sidebar activePage="Map" menuOpen={menuOpen} setMenuOpen={setMenuOpen} />

      {/* MAIN CONTENT */}

      <main className="map-page-main">
        <header className="map-page-header">
          <div>
            <span className="map-page-eyebrow">YOUR DISCOVERY JOURNEY</span>

            <h1>Explorer's Map</h1>

            <p>Every discovery reveals a new piece of your adventure.</p>
          </div>

          <div className="map-header-badge">
            <span>🧭</span>
            <div>
              <strong>Adventure Mode</strong>
              <small>Hidden discoveries</small>
            </div>
          </div>
        </header>

        {/* ADVENTURE SELECTOR */}

        <section className="map-adventure-selector">
          <button
            className={
              activeAdventure === "nature"
                ? "map-adventure-tab active"
                : "map-adventure-tab"
            }
            onClick={() => setActiveAdventure("nature")}
          >
            🌿 Nature Explorer
          </button>

          <button
            className={
              activeAdventure === "history"
                ? "map-adventure-tab active"
                : "map-adventure-tab"
            }
            onClick={() => setActiveAdventure("history")}
          >
            🏛️ Historical Discoverer
          </button>
        </section>

        {/* MAP AND SIDE PANEL */}

        <div className="map-page-content">
          <section className="map-container-wrapper">
            <div className="map-top-overlay">
              <div className="map-status-pill">
                <span className="map-status-dot"></span>
                Discovery map
              </div>

              <button
                className="map-my-location-button"
                onClick={handleMyLocation}
              >
                📍 My Location
              </button>
            </div>

            <MapContainer
              center={[46.1667, 21.3167]}
              zoom={14}
              minZoom={11}
              maxZoom={19}
              scrollWheelZoom={true}
              className="arad-leaflet-map"
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {userPosition && (
                <>
                  <Marker position={userPosition} icon={userLocationIcon}>
                    <Popup>
                      <strong>You are here!</strong>
                      <p>Your current GPS location.</p>
                    </Popup>
                  </Marker>

                  <MapRecenter position={userPosition} />
                </>
              )}

              {discoveredObjectives.map((objective) => (
                <Marker
                  key={objective.id}
                  position={[objective.latitude, objective.longitude]}
                  icon={createObjectiveIcon(objective)}
                >
                  <Popup className="objective-popup">
                    <div className="objective-popup-content">
                      <img src={objective.image} alt={objective.name} />

                      <span className="objective-popup-category">
                        {objective.category} DISCOVERY
                      </span>

                      <h3>{objective.name}</h3>

                      <p>{objective.story}</p>

                      {objective.isFinal && (
                        <strong className="objective-final-label">
                          🏆 Final Discovery
                        </strong>
                      )}
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>

            {/* MAP LEGEND */}

            <div className="map-legend">
              <div>
                <span className="legend-user-dot"></span>
                Your location
              </div>

              <div>
                <span className="legend-discovery-pin">📍</span>
                Discovered objective
              </div>

              <div>
                <span className="legend-hidden-icon">🔒</span>
                Hidden objectives
              </div>
            </div>
          </section>

          {/* DISCOVERY PANEL */}

          <aside className="map-discovery-panel">
            <div className="map-panel-heading">
              <span>✨ YOUR JOURNEY</span>

              <h2>Discovery Progress</h2>

              <p>Unlock each objective by solving its clue.</p>
            </div>

            <div className="map-progress-summary">
              <div className="map-progress-number">
                <strong>{completedClues}</strong>
                <span>/ {totalClues}</span>
              </div>

              <div className="map-progress-bar">
                <div
                  className="map-progress-fill"
                  style={{
                    width: `${Math.min(
                      (completedClues / totalClues) * 100,
                      100,
                    )}%`,
                  }}
                />
              </div>

              <span className="map-progress-caption">
                {Math.round(Math.min((completedClues / totalClues) * 100, 100))}
                % completed
              </span>
            </div>

            <div className="map-discovery-list">
              {Array.from({ length: totalClues }, (_, index) => {
                const objective = demoObjectives.filter(
                  (item) => item.adventureId === activeAdventure,
                )[index];

                const unlocked = index < completedClues;

                return (
                  <div
                    key={objective.id}
                    className={
                      unlocked
                        ? "map-discovery-item unlocked"
                        : "map-discovery-item locked"
                    }
                  >
                    <div className="map-discovery-item-icon">
                      {unlocked ? (
                        <img src={objective.image} alt={objective.name} />
                      ) : (
                        <span>🔒</span>
                      )}
                    </div>

                    <div className="map-discovery-item-text">
                      <strong>
                        {unlocked ? objective.name : `Discovery ${index + 1}`}
                      </strong>

                      <span>
                        {unlocked
                          ? "Objective unlocked"
                          : "Solve the clue to reveal"}
                      </span>
                    </div>

                    <span className="map-discovery-status">
                      {unlocked ? "✓" : "•"}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* TEMPORARY TEST BUTTON */}
            <button
              className="map-complete-clue-button"
              onClick={handleCompleteClue}
              disabled={isAdventureCompleted}
            >
              {isAdventureCompleted
                ? "🏆 Adventure Completed"
                : "🔓 Complete Clue"}
            </button>

            {/* GPS DISTANCE */}

            {/* AR EXPERIENCE */}

            <button
              className="map-ar-button"
              onClick={() => setArModalOpen(true)}
            >
              <span>✨</span>

              <div>
                <strong>Enter AR Experience</strong>
                <small>Meet the location guardian</small>
              </div>

              <span>→</span>
            </button>
          </aside>
        </div>

        {/* FINAL DISCOVERY MODAL */}

        {showFinalDiscovery && (
          <div className="map-final-modal-overlay">
            <div className="map-final-modal">
              <div className="map-final-confetti">
                {Array.from({ length: 24 }, (_, index) => (
                  <span key={index}>✦</span>
                ))}
              </div>

              <div className="map-final-treasure">🏆</div>

              <span className="map-final-eyebrow">LEGENDARY DISCOVERY</span>

              <h2>Adventure Completed!</h2>

              <p>
                You have uncovered every secret in this adventure. Your journey
                through Arad is complete!
              </p>

              <div className="map-final-reward">
                <span>⭐</span>
                <strong>750 points earned</strong>
              </div>

              <button onClick={() => setShowFinalDiscovery(false)}>
                Claim Discovery
              </button>
            </div>
          </div>
        )}

        {/* AR MODAL PLACEHOLDER */}

        {arModalOpen && (
          <div
            className="map-ar-modal-overlay"
            onClick={() => setArModalOpen(false)}
          >
            <div
              className="map-ar-modal"
              onClick={(event) => event.stopPropagation()}
            >
              <button
                className="map-ar-modal-close"
                onClick={() => setArModalOpen(false)}
              >
                ×
              </button>

              <div className="map-ar-modal-icon">📱✨</div>

              <h2>AR Guardian Experience</h2>

              <p>
                Soon, you will be able to meet a 3D guardian, explore hidden
                stories and take photos with augmented reality.
              </p>

              <span className="map-ar-coming-soon">
                AR EXPERIENCE — COMING SOON
              </span>

              <button onClick={() => setArModalOpen(false)}>Back to Map</button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default MapPage;
