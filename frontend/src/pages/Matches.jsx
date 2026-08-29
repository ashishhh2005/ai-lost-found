import { useEffect, useState } from "react";

const API_URL = "https://ai-lost-found-bamz.onrender.com";

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

    const response = await fetch(
      `${API_URL}/matches/${lostItemId}`
    );

    const responseText = await response.text();

    if (!response.ok) {
      throw new Error(
        `Server error ${response.status}: ${responseText}`
      );
    }

    let data;

    try {
      data = JSON.parse(responseText);
    } catch {
      throw new Error("Backend returned invalid JSON.");
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

    const seen = new Set();

    const uniqueMatches = matchList.filter((match) => {
      const id =
        match.found_item_id ??
        match.found_id ??
        match.item_id ??
        match.id;

      if (id !== undefined && id !== null) {
        const key = String(id);

        if (seen.has(key)) {
          return false;
        }

        seen.add(key);
        return true;
      }

      const fallbackKey = JSON.stringify(match);

      if (seen.has(fallbackKey)) {
        return false;
      }

      seen.add(fallbackKey);
      return true;
    });

    setMatches(uniqueMatches);
  } catch (err) {
    console.error("MATCH FETCH ERROR:", err);

    setError(
      err?.message || "Could not load matches."
    );
  } finally {
    setLoading(false);
  }
};

fetchMatches();

}, [lostItemId]);

const filteredMatches = matches.filter((match) => {
const search = searchTerm.toLowerCase().trim();


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

const getMatchLevel = (match) => {
if (match.match_level) {
return match.match_level;
}


const score =
  Number(match.match_score) ||
  Number(match.similarity) ||
  Number(match.score) ||
  0;

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
    alert("Found item ID is missing.");
    return;
  }

  const response = await fetch(
    `${API_URL}/confirm-match`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        lost_item_id: Number(lostItemId),
        found_item_id: Number(foundItemId),
      }),
    }
  );

  const responseText = await response.text();

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

if (!lostItemId) {
return ( <div className="matches-container"> <h2>🤖 AI Matches</h2>


    <p>
      Submit a lost item first to see
      possible matches.
    </p>
  </div>
);

}

if (loading) {
return ( <div className="matches-container"> <div className="matches-header"> <div> <h2>🤖 AI Matches</h2>


        <p>
          Our AI is analyzing found
          items...
        </p>
      </div>
    </div>

    <div className="loading-card">
      <div className="loading-icon">
        🤖
      </div>

      <h3>
        Finding the best matches...
      </h3>

      <p>
        Comparing item names,
        descriptions, locations and
        times.
      </p>

      <div className="loading-bar">
        <div className="loading-progress"></div>
      </div>
    </div>
  </div>
);


}

if (error) {
return ( <div className="matches-container"> <div className="error-card"> <div className="no-match-icon">
⚠️ </div>


      <h3>
        Something went wrong
      </h3>

      <p>{error}</p>

      <button
        className="view-match-button"
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

return (
<> <div className="matches-container"> <div className="matches-header"> <div> <h2>
🤖 AI Matches </h2>


        <p>
          Possible matches identified
          by our AI system.
        </p>
      </div>

      <div className="match-count">
        {filteredMatches.length}{" "}
        {filteredMatches.length === 1
          ? "Match"
          : "Matches"}
      </div>
    </div>

    <div className="match-search">
      <input
        type="text"
        placeholder="🔍 Search matches..."
        value={searchTerm}
        onChange={(event) =>
          setSearchTerm(
            event.target.value
          )
        }
      />
    </div>

    {confirmedMatch && (
      <div className="confirmed-match">
        <div className="confirmed-icon">
          {alreadyConfirmed
            ? "ℹ️"
            : "✅"}
        </div>

        <div>
          <h3>
            {alreadyConfirmed
              ? "Match Already Confirmed"
              : "Match Confirmed!"}
          </h3>

          <p>
            {alreadyConfirmed
              ? "This lost and found item pair has already been confirmed."
              : (
                <>
                  You selected{" "}
                  <strong>
                    {
                      confirmedMatch.item_name
                    }
                  </strong>{" "}
                  as your lost item.
                </>
              )}
          </p>

          {confirmedMatch.contact ? (
            <p>
              📞 Contact the finder at:{" "}
              <strong>
                {confirmedMatch.contact}
              </strong>
            </p>
          ) : (
            <p>
              📞 Contact information was
              not provided.
            </p>
          )}

          {confirmedMatch.confirmation_id && (
            <p>
              Confirmation ID: #
              {
                confirmedMatch.confirmation_id
              }
            </p>
          )}
        </div>

        <button
          onClick={() => {
            setConfirmedMatch(null);
            setAlreadyConfirmed(false);
          }}
        >
          ×
        </button>
      </div>
    )}

    {filteredMatches.length === 0 ? (
      <div className="no-matches">
        <div className="no-match-icon">
          🔍
        </div>

        <h3>
          {searchTerm.trim()
            ? "No matching results"
            : "No matches found"}
        </h3>

        <p>
          {searchTerm.trim()
            ? `No matches found for "${searchTerm}". Try another search term.`
            : "We couldn't find any matching found items yet. Try checking again later."}
        </p>

        {searchTerm.trim() && (
          <button
            className="view-match-button"
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
              match.match_score ??
              match.similarity ??
              match.score ??
              match.similarity_score;

            const textScore =
              match.text_score ??
              match.text_similarity;

            const locationScore =
              match.location_score ??
              match.location_similarity;

            const timeScore =
              match.time_score ??
              match.time_similarity;

            const itemNameScore =
              match.item_name_score ??
              match.item_name_similarity;

            const itemName =
              match.item_name ||
              match.title ||
              match.name ||
              "Possible Match";

            const description =
              match.description ||
              "No description available";

            const matchLevel =
              getMatchLevel(match);

            const matchLevelClass =
              getMatchLevelClass(
                matchLevel
              );

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
                <div className="match-card-top">
                  <div className="match-item-icon">
                    👜
                  </div>

                  <div className="match-title">
                    <span className="ai-label">
                      AI MATCH
                    </span>

                    <h3>
                      {itemName}
                    </h3>
                  </div>

                  <div className="similarity-badge">
                    <strong>
                      {similarity !==
                        undefined &&
                      similarity !==
                        null
                        ? `${Number(
                            similarity
                          ).toFixed(0)}%`
                        : "N/A"}
                    </strong>

                    <span>
                      Match
                    </span>
                  </div>
                </div>

                <div
                  className={`match-level-badge ${matchLevelClass}`}
                >
                  {matchLevel ===
                    "Excellent Match" &&
                    "🌟"}

                  {matchLevel ===
                    "Good Match" &&
                    "👍"}

                  {matchLevel ===
                    "Possible Match" &&
                    "🔍"}

                  {" "}
                  {matchLevel}
                </div>

                <div className="match-description">
                  <p>
                    {description}
                  </p>
                </div>

                <div className="match-details">
                  {match.location && (
                    <div className="detail">
                      <span>
                        📍
                      </span>

                      <div>
                        <small>
                          Location
                        </small>

                        <strong>
                          {
                            match.location
                          }
                        </strong>
                      </div>
                    </div>
                  )}

                  {match.date && (
                    <div className="detail">
                      <span>
                        📅
                      </span>

                      <div>
                        <small>
                          Date
                        </small>

                        <strong>
                          {match.date}
                        </strong>
                      </div>
                    </div>
                  )}

                  {match.time && (
                    <div className="detail">
                      <span>
                        🕐
                      </span>

                      <div>
                        <small>
                          Time
                        </small>

                        <strong>
                          {match.time}
                        </strong>
                      </div>
                    </div>
                  )}
                </div>

                <div className="ai-analysis">
                  <h4>
                    AI Analysis
                  </h4>

                  <div className="score-row">
                    <span>
                      Item name similarity
                    </span>

                    <div className="score-bar">
                      <div
                        className="score-fill"
                        style={{
                          width: `${Math.min(
                            Number(
                              itemNameScore
                            ) || 0,
                            100
                          )}%`,
                        }}
                      />
                    </div>

                    <strong>
                      {itemNameScore !==
                        undefined &&
                      itemNameScore !==
                        null
                        ? `${Number(
                            itemNameScore
                          ).toFixed(0)}%`
                        : "N/A"}
                    </strong>
                  </div>

                  <div className="score-row">
                    <span>
                      Text similarity
                    </span>

                    <div className="score-bar">
                      <div
                        className="score-fill"
                        style={{
                          width: `${Math.min(
                            Number(
                              textScore
                            ) || 0,
                            100
                          )}%`,
                        }}
                      />
                    </div>

                    <strong>
                      {textScore !==
                        undefined &&
                      textScore !==
                        null
                        ? `${Number(
                            textScore
                          ).toFixed(0)}%`
                        : "N/A"}
                    </strong>
                  </div>

                  <div className="score-row">
                    <span>
                      Location similarity
                    </span>

                    <div className="score-bar">
                      <div
                        className="score-fill"
                        style={{
                          width: `${Math.min(
                            Number(
                              locationScore
                            ) || 0,
                            100
                          )}%`,
                        }}
                      />
                    </div>

                    <strong>
                      {locationScore !==
                        undefined &&
                      locationScore !==
                        null
                        ? `${Number(
                            locationScore
                          ).toFixed(0)}%`
                        : "N/A"}
                    </strong>
                  </div>

                  <div className="score-row">
                    <span>
                      Time similarity
                    </span>

                    <div className="score-bar">
                      <div
                        className="score-fill"
                        style={{
                          width: `${Math.min(
                            Number(
                              timeScore
                            ) || 0,
                            100
                          )}%`,
                        }}
                      />
                    </div>

                    <strong>
                      {timeScore !==
                        undefined &&
                      timeScore !==
                        null
                        ? `${Number(
                            timeScore
                          ).toFixed(0)}%`
                        : "N/A"}
                    </strong>
                  </div>
                </div>

                <div className="match-footer">
                  <span>
                    🤖 Generated using AI
                    similarity analysis
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
                  </button>
                </div>
              </div>
            );
          }
        )}
      </div>
    )}
  </div>

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

        <div className="modal-icon">
          👜
        </div>

        <span className="ai-label">
          AI MATCH
        </span>

        <h2>
          {selectedMatch.item_name ||
            selectedMatch.title ||
            selectedMatch.name ||
            "Possible Match"}
        </h2>

        <div
          className={`match-level-badge ${getMatchLevelClass(
            getMatchLevel(
              selectedMatch
            )
          )}`}
        >
          {getMatchLevel(
            selectedMatch
          ) === "Excellent Match" &&
            "🌟"}

          {getMatchLevel(
            selectedMatch
          ) === "Good Match" &&
            "👍"}

          {getMatchLevel(
            selectedMatch
          ) === "Possible Match" &&
            "🔍"}

          {" "}
          {getMatchLevel(
            selectedMatch
          )}
        </div>

        <div className="modal-score">
          <strong>
            {selectedMatch.match_score !==
              undefined &&
            selectedMatch.match_score !==
              null
              ? `${Number(
                  selectedMatch.match_score
                ).toFixed(0)}%`
              : "N/A"}
          </strong>

          <span>
            AI Match Confidence
          </span>
        </div>

        <div className="modal-section">
          <h4>
            Description
          </h4>

          <p>
            {selectedMatch.description ||
              "No description available"}
          </p>
        </div>

        <div className="modal-info-grid">
          {selectedMatch.location && (
            <div>
              <span>
                📍
              </span>

              <small>
                Location
              </small>

              <strong>
                {selectedMatch.location}
              </strong>
            </div>
          )}

          {selectedMatch.date && (
            <div>
              <span>
                📅
              </span>

              <small>
                Date
              </small>

              <strong>
                {selectedMatch.date}
              </strong>
            </div>
          )}

          {selectedMatch.time && (
            <div>
              <span>
                🕐
              </span>

              <small>
                Time
              </small>

              <strong>
                {selectedMatch.time}
              </strong>
            </div>
          )}
        </div>

        <div className="modal-section">
          <h4>
            📞 Contact Finder
          </h4>

          {selectedMatch.contact ? (
            <div className="contact-box">
              <p>
                The person who reported
                this item can be contacted
                at:
              </p>

              <strong>
                📞{" "}
                {
                  selectedMatch.contact
                }
              </strong>
            </div>
          ) : (
            <p>
              Contact information was
              not provided for this found
              item.
            </p>
          )}
        </div>

        <div className="modal-section">
          <h4>
            AI Analysis
          </h4>

          <p>
            This match was generated by
            comparing the item name,
            description, location and
            time of the lost and found
            items.
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
            : "✅ This is My Item"}
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
</>


);
}

export default Matches;
