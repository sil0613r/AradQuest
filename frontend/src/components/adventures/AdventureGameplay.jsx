import QuestAssistant from "./QuestAssistant.jsx";
import { CHATBOT_MISSION_BY_LOCATION } from "../data/chatbotMissions.js";

// Displays the adventure progress, the current riddle, optional paid hints and AI chat UI.
// GPS and answer verification remain controlled by the parent page.
export default function AdventureGameplay({
  adventure,
  totalLocations,
  completedLocationCount,
  isCompleted,
  currentLocationIndex,
  activeLocation,
  mission,
  missionError,
  isOpeningHint,
  handleNextHint,
  handleOpenVisualHints,
  answer,
  setAnswer,
  isValidating,
  validationMessage,
  validationType,
  handleSubmitAnswer,
  chatOpen,
  setChatOpen,
  onBackToAdventures,
}) {
  // The Quest Assistant follows the location the player is on.
  const chatMissionId = CHATBOT_MISSION_BY_LOCATION[activeLocation?.id] ?? null;

  return (
    <>
      {/* Adventure progress */}

      <section className="clue-progress-section">
        <div className="clue-progress-heading">
          <div>
            <h2>Your Journey</h2>

            <p>Every location brings you closer to the final discovery.</p>
          </div>

          <strong>
            {completedLocationCount}/{totalLocations} locations solved
          </strong>
        </div>

        {/* Progress bar */}

        <div className="progress-bar">
          <div
            className="progress-bar-fill"
            style={{
              width:
                totalLocations > 0
                  ? `${(completedLocationCount / totalLocations) * 100}%`
                  : "0%",
            }}
          />
        </div>

      </section>

      {/* Clue area */}

      <section className="clue-section">
        {isCompleted ? (
          <div className="adventure-completed">
            <span>🏆</span>

            <h2>Adventure Completed!</h2>

            <p>
              Congratulations! You have solved the riddles of every location in this adventure.
            </p>

            <button type="button" onClick={onBackToAdventures}>
              Back to My Adventures
            </button>
          </div>
        ) : activeLocation ? (
          <>
            {/* Fixed location description */}

            <div className="location-description-card">
              <h3>📍 Discover the Location</h3>

              <p>{activeLocation.locationDescription}</p>
            </div>

            {/* Current location number */}

            <div className="clue-number">
              <span>🧩</span>
              LOCATION {currentLocationIndex + 1} OF{" "}
              {adventure.locations.length}
            </div>

            <h2>Solve the riddle</h2>

            <p className="clue-introduction">
              Read carefully. Every detail might help you discover your next
              destination.
            </p>

            {/* Riddle of this location, from the server */}

            {mission ? (
              <div className="clue-card">
                <span className="clue-decoration">❝</span>

                <p>{mission.description}</p>
              </div>
            ) : (
              <p className="clue-introduction">
                {missionError || "Loading the riddle..."}
              </p>
            )}

            {/* Optional hints: opened one by one, in order. Each one costs points. */}

            <div className="hint-container">
              {mission?.hints.length > 0 && (
                <div className="hint-message">
                  <strong>Hints you opened:</strong>

                  <ol>
                    {mission.hints.map((hint, index) => (
                      <li key={index}>{hint}</li>
                    ))}
                  </ol>
                </div>
              )}

              {mission && mission.hintsUsed < mission.clueCount && (
                <button
                  className="hint-button"
                  type="button"
                  onClick={handleNextHint}
                  disabled={isOpeningHint}
                >
                  💡{" "}
                  {isOpeningHint
                    ? "Opening hint..."
                    : `Open next hint (-${mission.hintCost} points)`}
                </button>
              )}

              {mission &&
                mission.clueCount > 0 &&
                mission.hintsUsed >= mission.clueCount && (
                  <p className="clue-introduction">
                    All hints for this location are open.
                  </p>
                )}
            </div>

            {/* Visual hints */}

            <div className="visual-hint-container">
              <div className="visual-hint-copy">
                <span className="visual-hint-icon">📸</span>

                <div>
                  <h3>Need a visual hint?</h3>

                  <p>
                    Explore a few pictures that may help you identify the
                    location.
                  </p>
                </div>
              </div>

              <button
                className="visual-hint-button"
                type="button"
                onClick={handleOpenVisualHints}
              >
                Reveal Photos
                <span>→</span>
              </button>
            </div>

            {/* Player answer and GPS validation */}

            <div className="clue-action">
              <p>
                Have you discovered the location? Enter your answer to verify
                your discovery.
              </p>

              {/* Player answer input */}

              <input
                type="text"
                className="clue-answer-input"
                placeholder="Enter your answer..."
                value={answer}
                onChange={(event) => setAnswer(event.target.value)}
                disabled={isValidating}
              />

              {/* GPS requirement */}

              <p className="clue-gps-notice">
                📍 You must be within 50 meters of the objective.
              </p>

              {/* Validation feedback */}

              {validationMessage && (
                <div
                  className={`clue-validation-message ${validationType}`}
                  role="status"
                  aria-live="polite"
                >
                  {validationMessage}
                </div>
              )}

              {/* Verify answer button */}

              <button
                className="complete-clue-button"
                type="button"
                disabled={isValidating || !answer.trim()}
                onClick={handleSubmitAnswer}
              >
                {isValidating ? "Verifying..." : "Verify GPS & Answer"}
              </button>
            </div>
          </>
        ) : (
          <p>Unable to load the current location.</p>
        )}
      </section>

      {/* Floating AI Chatbot, one fresh chat per location */}

      <QuestAssistant
        key={chatMissionId ?? "no-mission"}
        missionId={chatMissionId}
        chatOpen={chatOpen}
        setChatOpen={setChatOpen}
      />

      {/* Explorer tip */}

      {!isCompleted && (
        <section className="adventure-tip">
          <span>🧭</span>

          <p>
            <strong>Explorer's tip:</strong> Pay attention to your surroundings.
            The smallest details can reveal the biggest secrets!
          </p>
        </section>
      )}
    </>
  );
}
