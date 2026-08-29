
import { useEffect, useState } from "react";
import "./Matches.css";

// =========================================
// PRODUCTION BACKEND URL
// =========================================

const API_URL =
  "https://ai-lost-found-backend.onrender.com";

function Matches({ lostItemId }) {
  const [matches, setMatches] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [confirmedMatch, setConfirmedMatch] = useState(null);
  const [confirming, setConfirming] = useState(false);
  const [alreadyConfirmed, setAlreadyConfirmed] = useState(false);

  useEffect(() => {
    if (!lostItemId) {
      setLoading(false);
      return;
    }

    const fetchMatches = async () => {
      try {
        setLoading(true);
        setError("");

        console.log(
          "Fetching matches for Lost Item ID:",
          lostItemId
        );

        console.log(
          "Using backend:",
          API_URL
        );

        const response = await fetch(
          `${API_URL}/matches/${lostItemId}`
        );

        const responseText = await response.text();

        console.log(
          "Matches API status:",
          response.status
        );

        console.log(
          "Matches API response:",
          responseText
        );

        if (!response.ok) {
          throw new Error(
            `Server error ${response.status}: ${responseText}`
          );
        }

        let data;

        try {
          data = JSON.parse(responseText);
        } catch {
          throw new Error(
            "Backend returned invalid JSON."
          );
        }

        let matchList = [];

        if (Array.isArray(data)) {
          matchList = data;
        } else if (
          data &&
          Array.isArray(data.matches)
        ) {
          matchList = data.matches;
        }

        console.log(
          "Raw match list:",
          matchList
        );

        // =========================================
        // REMOVE DUPLICATE FOUND ITEMS
        // =========================================

        const seen = new Set();

        const uniqueMatches =
          matchList.filter((match) => {
            const id =
              match.found_item_id ??
              match.found_id ??
              match.item_id ??
              match.id;

            if (
              id !== undefined &&
              id !== null
            ) {
              const key = String(id);

              if (seen.has(key)) {
                return false;
              }

              seen.add(key);
              return true;
            }

            const fallbackKey =
              JSON.stringify(match);

            if (seen.has(fallbackKey)) {
              return false;
            }

            seen.add(fallbackKey);
            return true;
          });

        console.log(
          "Unique matches:",
          uniqueMatches
        );

        setMatches(uniqueMatches);
      } catch (err) {
        console.error(
          "MATCH FETCH ERROR:",
          err
        );

        setError(
          err?.message ||
            "Could not load matches."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchMatches();
  }, [lostItemId]);

  // =========================================
  // SEARCH
  // =========================================

  const filteredMatches =
    matches.filter((match) => {
      const search =
        searchTerm.toLowerCase().trim();

      if (!search) {
        return true;
      }

      const itemName = String(
        match.item_name ||
          match.title ||
          match.name ||
          ""
      ).toLowerCase();

      const description = String(
        match.description || ""
      ).toLowerCase();

      const location = String(
        match.location || ""
      ).toLowerCase();

      return (
        itemName.includes(search) ||
        description.includes(search) ||
        location.includes(search)
      );
    });

  // =========================================
  // MATCH SCORE
  // =========================================

  const getMatchScore = (match) => {
    return Number(
      match.match_score ??
        match.similarity ??
        match.score ??
        match.similarity_score ??
        0
    );
  };

  // =========================================
  // MATCH LEVEL
  // =========================================

  const getMatchLevel = (match) => {
    if (match.match_level) {
      return match.match_level;
    }

    const score = getMatchScore(match);

    if (score >= 80) {
      return "Excellent Match";
    }

    if (score >= 60) {
      return "Good Match";
    }

    return "Possible Match";
  };

  const getMatchLevelClass = (level) => {
    if (level === "Excellent Match") {
      return "excellent-match";
    }

    if (level === "Good Match") {
      return "good-match";
    }

    return "possible-match";
  };

  const getMatchIcon = (level) => {
    if (level === "Excellent Match") {
      return "🌟";
    }

    if (level === "Good Match") {
      return "👍";
    }

    return "🔎";
  };

  // =========================================
  // CONFIRM MATCH
  // =========================================

  const handleConfirmMatch = async (match) => {
    if (!match || !lostItemId) {
      return;
    }

    try {
      setConfirming(true);
      setAlreadyConfirmed(false);

      const foundItemId =
        match.found_item_id ??
        match.found_id ??
        match.item_id ??
        match.id;

      if (
        foundItemId === undefined ||
        foundItemId === null
      ) {
        alert(
          "Found item ID is missing."
        );
        return;
      }

      const response = await fetch(
        `${API_URL}/confirm-match`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            lost_item_id:
              Number(lostItemId),
            found_item_id:
              Number(foundItemId),
          }),
        }
      );

      const responseText =
        await response.text();

      if (!response.ok) {
        throw new Error(
          `Server error ${response.status}: ${responseText}`
        );
      }

      let data;

      try {
        data = JSON.parse(
          responseText
        );
      } catch {
        throw new Error(
          "Backend returned invalid JSON."
        );
      }

      if (
        data.success &&
        data.already_confirmed
      ) {
        setAlreadyConfirmed(true);

        setConfirmedMatch({
          ...match,
          contact:
            data.confirmation?.contact ??
            match.contact,
          confirmation_id:
            data.confirmation?.id,
          already_confirmed: true,
        });

        return;
      }

      if (
        data.success &&
        !data.already_confirmed
      ) {
        setAlreadyConfirmed(false);

        setConfirmedMatch({
          ...match,
          contact:
            data.confirmation?.contact ??
            match.contact,
          confirmation_id:
            data.confirmation?.id,
          already_confirmed: false,
        });

        return;
      }

      alert(
        data.message ||
          "Could not confirm this match."
      );
    } catch (error) {
      console.error(
        "Confirmation error:",
        error
      );

      alert(
        error?.message ||
          "Could not confirm the match."
      );
    } finally {
      setConfirming(false);
    }
  };

  // =========================================
  // NO LOST ITEM
  // =========================================

  if (!lostItemId) {
    return (
      <div className="matches-page">
        <div className="matches-empty-state">
          <div className="empty-state-icon">
            🔎
          </div>

          <h2>AI Matches</h2>

          <p>
            Submit a lost item first to see
            possible matches.
          </p>
        </div>
      </div>
    );
  }

  // =========================================
  // LOADING
  // =========================================

  if (loading) {
    return (
      <div className="matches-page">
        <div className="matches-hero">
          <div>
            <span className="page-eyebrow">
              ARTIFICIAL INTELLIGENCE
            </span>

            <h1>AI Matches</h1>

            <p>
              Finding the most likely match
              for your lost item.
            </p>
          </div>

          <div className="ai-orb">
            🤖
          </div>
        </div>

        <div className="matches-loading-card">
          <div className="loading-icon">
            🤖
          </div>

          <h2>
            Finding the best matches...
          </h2>

          <p>
            Comparing item names,
            descriptions, locations and
            times.
          </p>

          <div className="loading-bar">
            <div className="loading-progress"></div>
          </div>

          <span className="loading-note">
            AI analysis in progress
          </span>
        </div>
      </div>
    );
  }

  // =========================================
  // ERROR
  // =========================================

  if (error) {
    return (
      <div className="matches-page">
        <div className="matches-error-card">
          <div className="error-icon">
            ⚠️
          </div>

          <span className="page-eyebrow">
            CONNECTION ERROR
          </span>

          <h2>
            Unable to load matches
          </h2>

          <p>{error}</p>

          <button
            className="primary-button"
            onClick={() =>
              window.location.reload()
            }
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // =========================================
  // MAIN MATCHES PAGE
  // =========================================

  return (
    <div className="matches-page">

      <div className="matches-hero">
        <div>
          <span className="page-eyebrow">
            AI-POWERED SEARCH
          </span>

          <h1>AI Matches</h1>

          <p>
            Our AI compared your lost item
            with reported found items.
          </p>
        </div>

        <div className="hero-ai-badge">
          <span>🤖</span>

          <div>
            <strong>
              AI Analysis
            </strong>

            <small>
              Smart matching enabled
            </small>
          </div>
        </div>
      </div>

      <div className="matches-toolbar">

        <div className="match-summary">
          <strong>
            {filteredMatches.length}
          </strong>

          <span>
            {filteredMatches.length === 1
              ? "potential match"
              : "potential matches"}
          </span>
        </div>

        <div className="match-search">
          <span>⌕</span>

          <input
            type="text"
            placeholder="Search matches..."
            value={searchTerm}
            onChange={(event) =>
              setSearchTerm(
                event.target.value
              )
            }
          />

          {searchTerm && (
            <button
              className="clear-search"
              onClick={() =>
                setSearchTerm("")
              }
            >
              ×
            </button>
          )}
        </div>

      </div>

      {/* =====================================
          CONFIRMATION SUCCESS
      ===================================== */}

      {confirmedMatch && (
        <div
          className={`confirmation-success ${
            alreadyConfirmed
              ? "confirmation-info"
              : ""
          }`}
        >

          <div className="confirmation-success-icon">
            {alreadyConfirmed
              ? "ℹ️"
              : "✓"}
          </div>

          <div className="confirmation-content">

            <span className="confirmation-label">
              {alreadyConfirmed
                ? "ALREADY CONFIRMED"
                : "MATCH CONFIRMED"}
            </span>

            <h3>
              {alreadyConfirmed
                ? "This match was already confirmed"
                : "Great! You found a match."}
            </h3>

            <p>
              {alreadyConfirmed
                ? "This lost and found item pair is already connected."
                : (
                  <>
                    You selected{" "}
                    <strong>
                      {
                        confirmedMatch.item_name
                      }
                    </strong>{" "}
                    as your matching found
                    item.
                  </>
                )}
            </p>

            <div className="confirmation-contact">
              <span>📞</span>

              <div>
                <small>
                  CONTACT FINDER
                </small>

                <strong>
                  {confirmedMatch.contact ||
                    "Contact information not provided"}
                </strong>
              </div>
            </div>

            {confirmedMatch.confirmation_id && (
              <span className="confirmation-id">
                Confirmation #
                {
                  confirmedMatch.confirmation_id
                }
              </span>
            )}

          </div>

          <button
            className="confirmation-close"
            onClick={() => {
              setConfirmedMatch(null);
              setAlreadyConfirmed(false);
            }}
          >
            ×
          </button>

        </div>
      )}

      {/* =====================================
          NO MATCHES
      ===================================== */}

      {filteredMatches.length === 0 ? (

        <div className="matches-empty-state">

          <div className="empty-state-icon">
            {searchTerm
              ? "⌕"
              : "🔎"}
          </div>

          <h2>
            {searchTerm
              ? "No matching results"
              : "No matches found"}
          </h2>

          <p>
            {searchTerm
              ? `Nothing matched "${searchTerm}". Try another search.`
              : "We couldn't find any matching found items yet. Check again later."}
          </p>

          {searchTerm && (
            <button
              className="secondary-button"
              onClick={() =>
                setSearchTerm("")
              }
            >
              Clear Search
            </button>
          )}

        </div>

      ) : (

        <div className="matches-list">

          {filteredMatches.map(
            (match, index) => {

              const similarity =
                getMatchScore(match);

              const textScore = Number(
                match.text_score ??
                  match.text_similarity ??
                  0
              );

              const locationScore =
                Number(
                  match.location_score ??
                    match.location_similarity ??
                    0
                );

              const timeScore = Number(
                match.time_score ??
                  match.time_similarity ??
                  0
              );

              const itemNameScore =
                Number(
                  match.item_name_score ??
                    match.item_name_similarity ??
                    0
                );

              const itemName =
                match.item_name ||
                match.title ||
                match.name ||
                "Possible Match";

              const description =
                match.description ||
                "No description available.";

              const matchLevel =
                getMatchLevel(match);

              const foundItemId =
                match.found_item_id ??
                match.found_id ??
                match.item_id ??
                match.id;

              return (
                <div
                  className="match-card"
                  key={
                    foundItemId ??
                    index
                  }
                >

                  <div className="match-card-header">

                    <div className="item-icon">
                      👜
                    </div>

                    <div className="match-title-area">

                      <span className="ai-match-label">
                        <span>✦</span>{" "}
                        AI MATCH
                      </span>

                      <h2>
                        {itemName}
                      </h2>

                      <span
                        className={`match-level ${getMatchLevelClass(
                          matchLevel
                        )}`}
                      >
                        {getMatchIcon(
                          matchLevel
                        )}{" "}
                        {matchLevel}
                      </span>

                    </div>

                    <div className="match-score-circle">

                      <strong>
                        {similarity.toFixed(
                          0
                        )}
                        %
                      </strong>

                      <span>
                        Match
                      </span>

                    </div>

                  </div>

                  <div className="match-description-box">

                    <span>
                      FOUND ITEM
                    </span>

                    <p>
                      {description}
                    </p>

                  </div>

                  <div className="match-info-grid">

                    {match.location && (
                      <div className="info-item">

                        <div className="info-icon">
                          📍
                        </div>

                        <div>
                          <small>
                            LOCATION
                          </small>

                          <strong>
                            {match.location}
                          </strong>
                        </div>

                      </div>
                    )}

                    {match.date && (
                      <div className="info-item">

                        <div className="info-icon">
                          📅
                        </div>

                        <div>
                          <small>
                            DATE
                          </small>

                          <strong>
                            {match.date}
                          </strong>
                        </div>

                      </div>
                    )}

                    {match.time && (
                      <div className="info-item">

                        <div className="info-icon">
                          🕐
                        </div>

                        <div>
                          <small>
                            TIME
                          </small>

                          <strong>
                            {match.time}
                          </strong>
                        </div>

                      </div>
                    )}

                  </div>

                  {/* =====================================
                      AI ANALYSIS
                  ===================================== */}

                  <div className="ai-analysis-card">

                    <div className="analysis-heading">

                      <div>
                        <span>✦</span>

                        <strong>
                          AI Analysis
                        </strong>
                      </div>

                      <small>
                        4 factors analyzed
                      </small>

                    </div>

                    <div className="score-grid">

                      <div className="score-item">

                        <div className="score-top">
                          <span>
                            Item Name
                          </span>

                          <strong>
                            {itemNameScore.toFixed(
                              0
                            )}
                            %
                          </strong>
                        </div>

                        <div className="score-track">

                          <div
                            className="score-fill"
                            style={{
                              width: `${Math.min(
                                Math.max(
                                  itemNameScore,
                                  0
                                ),
                                100
                              )}%`,
                            }}
                          />

                        </div>

                      </div>

                      <div className="score-item">

                        <div className="score-top">
                          <span>
                            Description
                          </span>

                          <strong>
                            {textScore.toFixed(
                              0
                            )}
                            %
                          </strong>
                        </div>

                        <div className="score-track">

                          <div
                            className="score-fill"
                            style={{
                              width: `${Math.min(
                                Math.max(
                                  textScore,
                                  0
                                ),
                                100
                              )}%`,
                            }}
                          />

                        </div>

                      </div>

                      <div className="score-item">

                        <div className="score-top">
                          <span>
                            Location
                          </span>

                          <strong>
                            {locationScore.toFixed(
                              0
                            )}
                            %
                          </strong>
                        </div>

                        <div className="score-track">

                          <div
                            className="score-fill"
                            style={{
                              width: `${Math.min(
                                Math.max(
                                  locationScore,
                                  0
                                ),
                                100
                              )}%`,
                            }}
                          />

                        </div>

                      </div>

                      <div className="score-item">

                        <div className="score-top">
                          <span>
                            Time
                          </span>

                          <strong>
                            {timeScore.toFixed(
                              0
                            )}
                            %
                          </strong>
                        </div>

                        <div className="score-track">

                          <div
                            className="score-fill"
                            style={{
                              width: `${Math.min(
                                Math.max(
                                  timeScore,
                                  0
                                ),
                                100
                              )}%`,
                            }}
                          />

                        </div>

                      </div>

                    </div>

                  </div>

                  <div className="match-card-footer">

                    <span>
                      🤖 AI confidence analysis
                    </span>

                    <button
                      className="view-match-button"
                      onClick={() =>
                        setSelectedMatch(
                          match
                        )
                      }
                    >
                      View Match
                      <span>→</span>
                    </button>

                  </div>

                </div>
              );
            }
          )}

        </div>
      )}

      {/* =====================================
          MATCH DETAILS MODAL
      ===================================== */}

      {selectedMatch && (

        <div
          className="modal-overlay"
          onClick={() =>
            !confirming &&
            setSelectedMatch(null)
          }
        >

          <div
            className="match-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <button
              className="modal-close"
              onClick={() =>
                !confirming &&
                setSelectedMatch(null)
              }
              disabled={confirming}
            >
              ×
            </button>

            <div className="modal-header">

              <div className="modal-item-icon">
                👜
              </div>

              <div>

                <span className="ai-match-label">
                  <span>✦</span>{" "}
                  AI MATCH
                </span>

                <h2>
                  {selectedMatch.item_name ||
                    selectedMatch.title ||
                    selectedMatch.name ||
                    "Possible Match"}
                </h2>

              </div>

            </div>

            <div className="modal-confidence">

              <div>

                <span>
                  AI MATCH CONFIDENCE
                </span>

                <strong>
                  {getMatchScore(
                    selectedMatch
                  ).toFixed(0)}
                  %
                </strong>

              </div>

              <div className="modal-confidence-track">

                <div
                  style={{
                    width: `${Math.min(
                      Math.max(
                        getMatchScore(
                          selectedMatch
                        ),
                        0
                      ),
                      100
                    )}%`,
                  }}
                />

              </div>

            </div>

            <span
              className={`match-level ${getMatchLevelClass(
                getMatchLevel(
                  selectedMatch
                )
              )}`}
            >
              {getMatchIcon(
                getMatchLevel(
                  selectedMatch
                )
              )}{" "}
              {getMatchLevel(
                selectedMatch
              )}
            </span>

            <div className="modal-section">

              <span className="modal-section-label">
                FOUND ITEM DESCRIPTION
              </span>

              <p>
                {selectedMatch.description ||
                  "No description available."}
              </p>

            </div>

            <div className="modal-info-grid">

              {selectedMatch.location && (
                <div>
                  <span>📍</span>

                  <small>
                    LOCATION
                  </small>

                  <strong>
                    {selectedMatch.location}
                  </strong>
                </div>
              )}

              {selectedMatch.date && (
                <div>
                  <span>📅</span>

                  <small>
                    DATE
                  </small>

                  <strong>
                    {selectedMatch.date}
                  </strong>
                </div>
              )}

              {selectedMatch.time && (
                <div>
                  <span>🕐</span>

                  <small>
                    TIME
                  </small>

                  <strong>
                    {selectedMatch.time}
                  </strong>
                </div>
              )}

            </div>

            <div className="modal-contact">

              <div className="contact-icon">
                📞
              </div>

              <div>

                <small>
                  CONTACT FINDER
                </small>

                <strong>
                  {selectedMatch.contact ||
                    "Not provided"}
                </strong>

              </div>

            </div>

            <div className="modal-analysis">

              <h4>
                Why AI thinks this matches
              </h4>

              <p>
                The system compares item
                name, description, location
                and time to calculate the
                overall match confidence.
              </p>

            </div>

            <button
              className="confirm-match-button"
              disabled={confirming}
              onClick={async () => {
                await handleConfirmMatch(
                  selectedMatch
                );

                setSelectedMatch(null);
              }}
            >
              {confirming
                ? "⏳ Confirming..."
                : "✓ This Is My Item"}
            </button>

            <button
              className="modal-done-button"
              disabled={confirming}
              onClick={() =>
                setSelectedMatch(null)
              }
            >
              Close
            </button>

          </div>

        </div>
      )}

    </div>
  );
}

export default Matches;

