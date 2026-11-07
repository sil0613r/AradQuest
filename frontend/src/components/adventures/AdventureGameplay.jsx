import QuestAssistant from "./QuestAssistant.jsx";
import { CHATBOT_MISSION_BY_LOCATION } from "../data/chatbotMissions.js";

// Displays the adventure progress, current clue, hints and AI chat UI.
// GPS and answer verification remain controlled by the parent page.
export default function AdventureGameplay({
  adventure,
  totalClues,
  completedClues,
  isCompleted,
  currentLocationIndex,
  currentClueIndex,
  activeLocation,
  activeClue,
  hintVisible,
  handleShowHint,
  handleOpenVisualHints,
  answer,
  setAnswer,
  isValidating,
  validationMessage,
  validationType,
  handleSubmitAnswer,
  handleResetProgress,
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

            <p>Every clue brings you closer to the final discovery.</p>
          </div>

          <strong>
            {completedClues}/{totalClues} clues solved
          </strong>
        </div>

        {/* Progress bar */}

        <div className="progress-bar">
          <div
            className="progress-bar-fill"
            style={{
              width:
                totalClues > 0
                  ? `${(completedClues / totalClues) * 100}%`
                  : "0%",
            }}
          />
        </div>

        {/* Reset progress */}

        <button
          className="reset-progress-button"
          onClick={handleResetProgress}
          type="button"
        >
          <span className="reset-icon">↻</span>
          Reset Progress
        </button>
      </section>

      {/* Clue area */}

      <section className="clue-section">
        {isCompleted ? (
          <div className="adventure-completed">
            <span>🏆</span>

            <h2>Adventure Completed!</h2>

            <p>
              Congratulations! You have solved all the clues in this adventure.
            </p>

            <button type="button" onClick={onBackToAdventures}>
              Back to My Adventures
            </button>
          </div>
        ) : activeLocation && activeClue ? (
          <>
            {/* Fixed location description */}

            <div className="location-description-card">
              <h3>📍 Discover the Location</h3>

              <p>{activeLocation.locationDescription}</p>
            </div>

            {/* Current location and clue number */}

            <div className="clue-number">
              <span>🧩</span>
              LOCATION {currentLocationIndex + 1} OF{" "}
              {adventure.locations.length}
              {" — "}
              CLUE {currentClueIndex + 1} OF {activeLocation.clues.length}
            </div>

            {/* Current clue title */}

            <h2>{activeClue.title}</h2>

            <p className="clue-introduction">
              Read carefully. Every detail might help you discover your next
              destination.
            </p>

            {/* Main clue */}

            <div className="clue-card">
              <span className="clue-decoration">❝</span>

              <p>{activeClue.description}</p>
            </div>

            {/* Written hint */}

            <div className="hint-container">
              {!hintVisible ? (
                <button
                  className="hint-button"
                  type="button"
                  onClick={handleShowHint}
                >
                  💡 Need a hint?
                </button>
              ) : (
                <div className="hint-message">
                  <strong>Here's a little help:</strong>

                  <p>{activeClue.hint}</p>
                </div>
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
          <p>Unable to load the current clue.</p>
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
