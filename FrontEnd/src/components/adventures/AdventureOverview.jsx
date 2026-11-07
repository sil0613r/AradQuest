import "../styles/AdventureOverview.css";

// Display the adventure summary before gameplay begins.
function AdventureOverview({ adventure, onStart, hasProgress = false }) {
  if (!adventure) {
    return null;
  }

  const totalLocations =
    adventure.totalLocations ?? adventure.locations?.length ?? 0;

  return (
    <section className="adventure-overview">
      <div className="overview-heading">
        <span className="overview-label">
          {adventure.icon} {adventure.category} Adventure
        </span>

        <h2>{adventure.overviewTitle || adventure.title}</h2>
        <p>{adventure.overviewDescription || adventure.description}</p>
      </div>

      <div className="overview-statistics">
        <div className="overview-stat">
          <strong>{totalLocations}</strong>
          <span>Locations</span>
        </div>

        <div className="overview-stat">
          <strong>{adventure.points ?? 0}</strong>
          <span>Possible Points</span>
        </div>

        <div className="overview-stat">
          <strong>{adventure.estimatedDuration || "Coming soon"}</strong>
          <span>Estimated Duration</span>
        </div>
      </div>

      <div className="overview-information">
        <h3>Before You Begin</h3>
        <p>
          Explore Arad, follow the clues and discover the hidden stories behind
          each destination. Your journey will unfold one location at a time.
        </p>
        <p>
          To validate a discovery, you will need to be within 50 meters of the
          objective and submit the correct answer.
        </p>
      </div>

      <button type="button" className="overview-start-button" onClick={onStart}>
        {hasProgress ? "Continue Adventure" : "Start Adventure"}
        <span aria-hidden="true">→</span>
      </button>
    </section>
  );
}

export default AdventureOverview;
