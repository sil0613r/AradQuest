import { useState, useEffect } from "react";

import { useNavigate, useParams } from "react-router-dom";

import "../styles/AdventureDetailsPage.css";
import Sidebar from "../layout/Sidebar.jsx";
import { historyImages } from "../data/historyImages.js";
import { getOrderedLocations } from "../utils/generateAdventureRoute.js";
import { getCurrentPosition, getProgress, resetAdventureProgress, verifyLocationAnswer } from "../services/gameService.js";

import AdventureOverview from "../adventures/AdventureOverview.jsx";
import natureImage from "../../assets/images/backgrounds/nature-adventure.JPG";
import historyImage from "../../assets/images/backgrounds/history-adventure.JPG";

import AdventureGameplay from "../adventures/AdventureGameplay.jsx";
import VisualHintCarousel from "../adventures/VisualHintCarousel.jsx";

// Temporary adventure data.
// Locations and clues will eventually be loaded from FastAPI.
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

        // This description remains fixed for all three clues.
        locationDescription:
          "La marginea cartierului Micălaca, acolo unde orașul " +
          "se întâlnește cu faleza Mureșului, se întinde un " +
          "spațiu verde modern. Alei, terenuri de sport și " +
          "locuri de joacă îl transformă într-un punct de " +
          "întâlnire pentru toate vârstele.",

        clues: [
          {
            id: "nature-1-clue-1",

            title: "The First Discovery",

            description: "Câte locuri pentru grătar au fost prevăzute în parc?",

            hint: "Look for information about the park facilities.",

            visualHints: [natureImage, natureImage, natureImage],
          },

          {
            id: "nature-1-clue-2",

            title: "The Second Discovery",

            description: "Second clue question goes here.",

            hint: "Second clue hint goes here.",

            visualHints: [natureImage, natureImage, natureImage],
          },

          {
            id: "nature-1-clue-3",

            title: "The Final Discovery",

            description: "Third clue question goes here.",

            hint: "Third clue hint goes here.",

            visualHints: [natureImage, natureImage, natureImage],
          },
        ],
      },

      // TODO: Add Nature Location 2 with its three clues.
      // TODO: Add Nature Location 3 with its three clues.
      // TODO: Add Nature Location 4 with its three clues.
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
        clues: [
          {
            id: "primaria-clue-1",
            title: "A Story in Stone",
            description:
              "I have witnessed generations pass by. My walls hold stories, and my architecture reflects another time. What am I?",
            hint: "Think about the historic buildings in the heart of Arad.",
            visualHints: [historyImage, historyImage, historyImage],
          },
          {
            id: "primaria-clue-2",
            title: "Echoes of the Past",
            description:
              "Culture, history and architecture meet within my walls. Many visitors have crossed my doors. Can you discover me?",
            hint: "Think about a building connected to the cultural life of Arad.",
            visualHints: [historyImage, historyImage, historyImage],
          },
          {
            id: "primaria-clue-3",
            title: "The Final Historical Challenge",
            description:
              "Your journey through history is almost complete. Look for a place that tells the story of the region's past.",
            hint: "Think beyond the city centre and consider the historic fortifications of the county.",
            visualHints: [historyImage, historyImage, historyImage],
          },
        ],
      },
      {
        id: "teatrul-ioan-slavici",
        name: "Teatrul Clasic Ioan Slavici",
        points: 20,
        locationDescription: "Historical location description coming soon.",
        clues: [
          {
            id: "teatrul-clue-1",
            title: "Discover the Location",
            description: "Historical riddle coming soon.",
            hint: "Additional hint coming soon.",
          },
        ],
      },
      {
        id: "biserica-rosie",
        name: "Biserica Roșie Luterană",
        points: 20,
        locationDescription: "Historical location description coming soon.",
        clues: [
          {
            id: "biserica-clue-1",
            title: "Discover the Location",
            description: "Historical riddle coming soon.",
            hint: "Additional hint coming soon.",
          },
        ],
      },
      {
        id: "moise-nicoara",
        name: "Liceul Național Moise Nicoară",
        points: 30,
        locationDescription: "Historical location description coming soon.",
        clues: [
          {
            id: "moise-clue-1",
            title: "Discover the Location",
            description: "Historical riddle coming soon.",
            hint: "Additional hint coming soon.",
          },
        ],
      },
      {
        id: "palatul-cultural",
        name: "Palatul Cultural (Filarmonica)",
        points: 20,
        locationDescription: "Historical location description coming soon.",
        clues: [
          {
            id: "palatul-clue-1",
            title: "Discover the Location",
            description: "Historical riddle coming soon.",
            hint: "Additional hint coming soon.",
          },
        ],
      },
      {
        id: "vechiul-cazino",
        name: "Vechiul Cazino",
        points: 20,
        locationDescription: "Historical location description coming soon.",
        clues: [
          {
            id: "cazino-clue-1",
            title: "Discover the Location",
            description: "Historical riddle coming soon.",
            hint: "Additional hint coming soon.",
          },
        ],
      },
    ],
  },
};

function AdventureDetailsPage() {
  const { adventureId } = useParams();

  const navigate = useNavigate();

  // Retrieve the selected adventure.
  const adventure = adventureData[adventureId];
  // Route IDs will be provided by the backend.

  // TODO: Replace this fallback with the saved route IDs from FastAPI.
  // Never generate a new random route on every render or refresh.
  const routeIds = adventure?.locations.map((location) => location.id) ?? [];

  // Build the ordered locations from the route identifiers.
  const orderedLocations = adventure
    ? getOrderedLocations(adventure.locations, routeIds)
    : [];

  // Use the ordered route throughout the gameplay.
  const gameplayAdventure = adventure
    ? { ...adventure, locations: orderedLocations }
    : null;

  // Sidebar state.
  const [menuOpen, setMenuOpen] = useState(false);

  // Control whether the adventure overview or gameplay is displayed.
  const [showOverview, setShowOverview] = useState(true);

  // Start or continue the adventure.
  const handleStartAdventure = () => {
    setShowOverview(false);
  };

  // Track the current location and clue separately.
  const [currentLocationIndex, setCurrentLocationIndex] = useState(0);

  const [currentClueIndex, setCurrentClueIndex] = useState(0);

  // Locations the player completed (saved on the server) and hints.
  const [completedLocations, setCompletedLocations] = useState([]);

  const [hintVisible, setHintVisible] = useState(false);

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

  /**
   * Load the player's saved progress from the server.
   * The first location that is not completed becomes the current one.
   */
  useEffect(() => {
    let isCancelled = false;

    setAnswer("");
    setValidationMessage("");
    setValidationType("");
    setHintVisible(false);
    setVisualHintOpen(false);
    setVisualHintIndex(0);

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
        setCurrentClueIndex(0);
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
  }, [adventureId]);

  /**
   * Clear the player's progress on this adventure. The server takes back the points it gave.
   */
  const handleResetProgress = async () => {
    const confirmReset = window.confirm(
      "Are you sure you want to reset your progress? All completed clues will be lost.",
    );

    if (!confirmReset) return;

    try {
      await resetAdventureProgress(adventureId);
    } catch (error) {
      setValidationType("error");
      setValidationMessage(error.message || "Unable to reset your progress.");
      return;
    }

    setCompletedLocations([]);
    setCurrentLocationIndex(0);
    setCurrentClueIndex(0);
    setAnswer("");
    setValidationMessage("");
    setValidationType("");
    setHintVisible(false);
    setVisualHintOpen(false);
    setVisualHintIndex(0);
  };

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

  // Calculate the total number of clues in the active route.
  const totalClues = gameplayAdventure.locations.reduce(
    (sum, location) => sum + location.clues.length,
    0,
  );
  // Clues of the locations the player has completed.
  const completedClues = gameplayAdventure.locations
    .filter((location) => completedLocations.includes(location.id))
    .reduce((sum, location) => sum + location.clues.length, 0);

  // Determine whether the adventure is completed.
  const isCompleted = totalClues > 0 && completedClues >= totalClues;

  const activeLocation = gameplayAdventure.locations[currentLocationIndex];
  // Retrieve the current clue within that location.
  const activeClue = activeLocation?.clues[currentClueIndex];

  // Retrieve visual hints for the active historical location.
  // Nature adventures continue using their existing clue images.
  const visualHintImages =
    adventureId === "history"
      ? historyImages[activeLocation?.id]?.clues || []
      : activeClue?.visualHints || [];

  // Show the written hint.
  const handleShowHint = () => {
    setHintVisible(true);
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
    if (!activeClue || !activeLocation) return;

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
        setCurrentClueIndex(0);
        setAnswer("");
        setHintVisible(false);
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
            hasProgress={completedClues > 0}
          />
        ) : (
          <AdventureGameplay
            adventure={gameplayAdventure}
            totalClues={totalClues}
            completedClues={completedClues}
            isCompleted={isCompleted}
            currentLocationIndex={currentLocationIndex}
            currentClueIndex={currentClueIndex}
            activeLocation={activeLocation}
            activeClue={activeClue}
            hintVisible={hintVisible}
            handleShowHint={handleShowHint}
            handleOpenVisualHints={handleOpenVisualHints}
            answer={answer}
            setAnswer={setAnswer}
            isValidating={isValidating}
            validationMessage={validationMessage}
            validationType={validationType}
            handleSubmitAnswer={handleSubmitAnswer}
            handleResetProgress={handleResetProgress}
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
