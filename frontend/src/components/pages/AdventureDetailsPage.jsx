import { useState, useEffect, useMemo } from "react";

import { useNavigate, useParams } from "react-router-dom";

import "../styles/AdventureDetailsPage.css";
import Sidebar from "../layout/Sidebar.jsx";
import { historyImages } from "../data/historyImages.js";
import { getOrderedLocations } from "../utils/generateAdventureRoute.js";
import {
  getCurrentPosition,
  getMission,
  getProgress,
  requestNextHint,
  verifyLocationAnswer,
} from "../services/gameService.js";

import AdventureOverview from "../adventures/AdventureOverview.jsx";
import natureImage from "../../assets/images/backgrounds/nature-adventure.JPG";
import historyImage from "../../assets/images/backgrounds/history-adventure.JPG";

import AdventureGameplay from "../adventures/AdventureGameplay.jsx";
import VisualHintCarousel from "../adventures/VisualHintCarousel.jsx";

// Temporary adventure data.
// Locations will eventually be loaded from FastAPI. Riddles and hints come from the server (ai_bot missions).
const adventureData = {
  nature: {
    title: "Nature Explorer",

    category: "Nature",

    description:
      "Discover the hidden beauty of Arad County. Follow mysterious clues, explore nature and uncover stories waiting to be discovered.",

    image: natureImage,

    icon: "🌿",

    points: 750,

    // Nature Explorer will contain 4 tourist locations.
    locations: [
      {
        id: "nature-location-1",

        name: "Parcul Micălaca – Zona 300",

        // Fixed location description. The riddle and hints come from the server.
        locationDescription:
          "La marginea cartierului Micălaca, acolo unde orașul " +
          "se întâlnește cu faleza Mureșului, se întinde un " +
          "spațiu verde modern. Alei, terenuri de sport și " +
          "locuri de joacă îl transformă într-un punct de " +
          "întâlnire pentru toate vârstele.",

        visualHints: [natureImage, natureImage, natureImage],
      },

      // TODO: Add Nature Location 2 with its photos.
      // TODO: Add Nature Location 3 with its photos.
      // TODO: Add Nature Location 4 with its photos.
    ],
  },

  history: {
    title: "Historical Discoverer",
    category: "History",
    description:
      "Travel through time and uncover the forgotten stories of Arad. Solve riddles and discover the historical treasures of the region.",
    image: historyImage,
    icon: "🏛️",
    points: 130,
    overviewTitle: "Discover Arad",
    overviewDescription:
      "Explore the rich history of Arad and solve fascinating riddles to uncover its hidden treasures.",
    totalLocations: 6,
    estimatedDuration: "2-3 hours",

    // Historical Discoverer will contain 6 tourist locations.

    locations: [
      {
        id: "primaria-arad",
        name: "Primăria Arad",
        points: 20,
        locationDescription:
          "Discover the history and architecture of Arad City Hall.",
      },
      {
        id: "teatrul-ioan-slavici",
        name: "Teatrul Clasic Ioan Slavici",
        points: 20,
        locationDescription: "Historical location description coming soon.",
      },
      {
        id: "biserica-rosie",
        name: "Biserica Roșie Luterană",
        points: 20,
        locationDescription: "Historical location description coming soon.",
      },
      {
        id: "moise-nicoara",
        name: "Liceul Național Moise Nicoară",
        points: 30,
        locationDescription: "Historical location description coming soon.",
      },
      {
        id: "palatul-cultural",
        name: "Palatul Cultural (Filarmonica)",
        points: 20,
        locationDescription: "Historical location description coming soon.",
      },
      {
        id: "vechiul-cazino",
        name: "Vechiul Cazino",
        points: 20,
        locationDescription: "Historical location description coming soon.",
      },
    ],
  },
};

function AdventureDetailsPage() {
  const { adventureId } = useParams();

  const navigate = useNavigate();

  // Retrieve the selected adventure.
  const adventure = adventureData[adventureId];
  // Build the ordered route once per adventure, so its reference stays stable between renders.
  // Route IDs will be provided by the backend.
  // TODO: Replace this fallback with the saved route IDs from FastAPI.
  // Never generate a new random route on every render or refresh.
  const gameplayAdventure = useMemo(() => {
    if (!adventure) return null;

    const routeIds = adventure.locations.map((location) => location.id);

    return {
      ...adventure,
      locations: getOrderedLocations(adventure.locations, routeIds),
    };
  }, [adventure]);

  // Sidebar state.
  const [menuOpen, setMenuOpen] = useState(false);

  // Control whether the adventure overview or gameplay is displayed.
  const [showOverview, setShowOverview] = useState(true);

  // Start or continue the adventure.
  const handleStartAdventure = () => {
    setShowOverview(false);
  };

  // Track the current location. Each location has one riddle.
  const [currentLocationIndex, setCurrentLocationIndex] = useState(0);

  // Locations the player completed (saved on the server).
  const [completedLocations, setCompletedLocations] = useState([]);

  // Riddle and opened hints, stored with their location ID so they are never shown for another location.
  const [missionState, setMissionState] = useState(null);

  // True while the next hint is being opened.
  const [isOpeningHint, setIsOpeningHint] = useState(false);

  // The location the player is on now (null when the adventure is unknown).
  const activeLocationId =
    gameplayAdventure?.locations[currentLocationIndex]?.id ?? null;

  // Visual hint gallery.
  const [visualHintOpen, setVisualHintOpen] = useState(false);

  const [visualHintIndex, setVisualHintIndex] = useState(0);

  // AI chatbot.
  const [chatOpen, setChatOpen] = useState(false);

  // Answer input and validation feedback.
  const [answer, setAnswer] = useState("");

  const [validationMessage, setValidationMessage] = useState("");

  const [validationType, setValidationType] = useState("");

  const [isValidating, setIsValidating] = useState(false);

  // Reset the answer and hint state when the player opens a different adventure.
  // This runs during render instead of in an effect, so no stale state is shown.
  const [loadedAdventureId, setLoadedAdventureId] = useState(adventureId);

  if (loadedAdventureId !== adventureId) {
    setLoadedAdventureId(adventureId);
    setAnswer("");
    setValidationMessage("");
    setValidationType("");
    setVisualHintOpen(false);
    setVisualHintIndex(0);
  }

  /**
   * Load the player's saved progress from the server.
   * The first location that is not completed becomes the current one.
   */
  useEffect(() => {
    let isCancelled = false;

    const loadProgress = async () => {
      try {
        const data = await getProgress();

        if (isCancelled) return;

        const locations = gameplayAdventure?.locations || [];
        const firstOpen = locations.findIndex(
          (location) => !data.completedLocations.includes(location.id),
        );

        setCompletedLocations(data.completedLocations);
        setCurrentLocationIndex(firstOpen === -1 ? locations.length : firstOpen);
      } catch (error) {
        if (isCancelled) return;

        setValidationType("error");
        setValidationMessage(error.message || "Unable to load your progress.");
      }
    };

    loadProgress();

    return () => {
      isCancelled = true;
    };
  }, [adventureId, gameplayAdventure?.locations]);

  /**
   * Load the riddle and the opened hints for the active location.
   * Runs again when the player moves to another location.
   */
  useEffect(() => {
    if (!activeLocationId) return;

    let isCancelled = false;

    getMission(activeLocationId)
      .then((data) => {
        if (!isCancelled) {
          setMissionState({ locationId: activeLocationId, data });
        }
      })
      .catch((error) => {
        if (!isCancelled) {
          setMissionState({
            locationId: activeLocationId,
            error: error.message || "Unable to load this location.",
          });
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [activeLocationId]);

  // Close the visual hint modal when Escape is pressed.
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setVisualHintOpen(false);
      }
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, []);

  // Handle invalid adventure IDs.
  if (!adventure) {
    return (
      <main className="adventure-details-page">
        <h1>Adventure not found</h1>

        <button type="button" onClick={() => navigate("/adventures")}>
          Back to My Adventures
        </button>
      </main>
    );
  }

  // Count locations: the player solves one riddle per location.
  const totalLocations = gameplayAdventure.locations.length;

  // Number of locations the player has completed.
  const completedLocationCount = gameplayAdventure.locations.filter(
    (location) => completedLocations.includes(location.id),
  ).length;

  // Determine whether the adventure is completed.
  const isCompleted =
    totalLocations > 0 && completedLocationCount >= totalLocations;

  const activeLocation = gameplayAdventure.locations[currentLocationIndex];

  // The riddle and hints belong to one location. Ignore them if they are for another one.
  const mission =
    missionState?.locationId === activeLocationId ? missionState.data : null;
  const missionError =
    missionState?.locationId === activeLocationId ? missionState.error : "";

  // Retrieve visual hints for the active location.
  // History locations use their photos; nature locations use their own images.
  const visualHintImages =
    adventureId === "history"
      ? historyImages[activeLocation?.id]?.clues || []
      : activeLocation?.visualHints || [];

  /**
   * Open the next hint for the active location. It is optional and costs points,
   * which the server takes from the total right away.
   */
  const handleNextHint = async () => {
    if (!activeLocation || isOpeningHint) return;

    setIsOpeningHint(true);
    setValidationMessage("");
    setValidationType("");

    try {
      const result = await requestNextHint(activeLocation.id);

      // Add the new hint after the hints already open, so they stay in order.
      setMissionState((previous) => {
        if (previous?.locationId !== activeLocation.id || !previous.data) {
          return previous;
        }

        return {
          locationId: activeLocation.id,
          data: {
            ...previous.data,
            hintsUsed: result.hintsUsed,
            hints: [...previous.data.hints, result.hint],
          },
        };
      });

      setValidationType("warning");
      setValidationMessage(
        `${result.hintCost} points were taken from your total for this hint.`,
      );
    } catch (error) {
      setValidationType("error");
      setValidationMessage(error.message || "Unable to open the hint.");
    } finally {
      setIsOpeningHint(false);
    }
  };

  // Open the visual hint gallery.
  const handleOpenVisualHints = () => {
    if (visualHintImages.length === 0) return;

    setVisualHintIndex(0);

    setVisualHintOpen(true);
  };

  /**
   * Handle the player's answer submission.
   * The server checks the GPS position and the answer, and saves the result.
   * The next location opens only after the server confirms it.
   */
  const handleSubmitAnswer = async () => {
    if (!activeLocation) return;

    if (!answer.trim()) {
      setValidationMessage("Please enter your answer.");
      setValidationType("warning");
      return;
    }

    if (isValidating) return;

    setIsValidating(true);
    setValidationMessage("");
    setValidationType("");

    try {
      const position = await getCurrentPosition();
      const result = await verifyLocationAnswer({
        locationId: activeLocation.id,
        answer: answer.trim(),
        latitude: position.latitude,
        longitude: position.longitude,
      });

      setValidationMessage(result.message);

      if (result.missionCompleted) {
        setCompletedLocations((previous) =>
          previous.includes(activeLocation.id)
            ? previous
            : [...previous, activeLocation.id],
        );
        setCurrentLocationIndex(currentLocationIndex + 1);
        setAnswer("");
        setValidationType("success");
      } else {
        setValidationType(result.gpsValid ? "warning" : "error");
      }
    } catch (error) {
      setValidationMessage(error.message || "Unable to verify your answer.");
      setValidationType("error");
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <div className="adventure-details-layout">
      {/* Shared Sidebar */}

      <Sidebar
        activePage="My Adventures"
        menuOpen={menuOpen}
        setMenuOpen={setMenuOpen}
      />

      {/* Main page */}

      <main className="adventure-details-page">
        {/* Back navigation */}

        <button
          className="back-to-adventures"
          type="button"
          onClick={() => navigate("/adventures")}
        >
          ← Back to My Adventures
        </button>

        {/* Adventure hero */}

        <section
          className="adventure-details-hero"
          style={{
            backgroundImage: `linear-gradient(

        rgba(25, 25, 20, 0.65),

        rgba(25, 25, 20, 0.65)

      ), url(${adventure.image})`,
          }}
        >
          <span className="details-category">
            {adventure.icon} {adventure.category} Adventure
          </span>

          <h1>{adventure.title}</h1>

          <p>{adventure.description}</p>

          <span className="details-reward">⭐ {adventure.points} points</span>
        </section>

        {/* Display the overview before the gameplay */}
        {showOverview ? (
          <AdventureOverview
            adventure={adventure}
            onStart={handleStartAdventure}
            hasProgress={completedLocationCount > 0}
          />
        ) : (
          <AdventureGameplay
            adventure={gameplayAdventure}
            totalLocations={totalLocations}
            completedLocationCount={completedLocationCount}
            isCompleted={isCompleted}
            currentLocationIndex={currentLocationIndex}
            activeLocation={activeLocation}
            mission={mission}
            missionError={missionError}
            isOpeningHint={isOpeningHint}
            handleNextHint={handleNextHint}
            handleOpenVisualHints={handleOpenVisualHints}
            answer={answer}
            setAnswer={setAnswer}
            isValidating={isValidating}
            validationMessage={validationMessage}
            validationType={validationType}
            handleSubmitAnswer={handleSubmitAnswer}
            chatOpen={chatOpen}
            setChatOpen={setChatOpen}
            onBackToAdventures={() => navigate("/adventures")}
          />
        )}
      </main>

      {/* Visual hint gallery */}
      <VisualHintCarousel
        images={visualHintImages}
        isOpen={visualHintOpen}
        activeIndex={visualHintIndex}
        onIndexChange={setVisualHintIndex}
        onClose={() => setVisualHintOpen(false)}
      />
    </div>
  );
}

export default AdventureDetailsPage;
