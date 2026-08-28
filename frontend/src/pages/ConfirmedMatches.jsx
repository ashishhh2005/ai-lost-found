
import { useEffect, useState } from "react";

function ConfirmedMatches() {
  const [confirmedMatches, setConfirmedMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState(null);

  // =========================================
  // FETCH CONFIRMED MATCHES
  // =========================================

  const fetchConfirmedMatches = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "http://127.0.0.1:8000/confirmed-matches"
      );

      if (!response.ok) {
        throw new Error(
          `Server error: ${response.status}`
        );
      }

      const data = await response.json();

      console.log(
        "CONFIRMED MATCHES:",
        JSON.stringify(data, null, 2)
      );

      if (
        data.success &&
        Array.isArray(data.confirmed_matches)
      ) {
        setConfirmedMatches(data.confirmed_matches);
      } else {
        setConfirmedMatches([]);
      }
    } catch (err) {
      console.error(
        "Confirmed matches error:",
        err
      );

      setError(
        "Could not load confirmed matches."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfirmedMatches();
  }, []);

  // =========================================
  // UPDATE STATUS
  // =========================================

  const handleStatusChange = async (
    confirmationId,
    newStatus
  ) => {
    if (!confirmationId || !newStatus) {
      return;
    }

    try {
      setUpdatingId(confirmationId);

      const response = await fetch(
        `http://127.0.0.1:8000/confirmed-matches/${confirmationId}/status`,
        {
          method: "PUT",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            status: newStatus,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(
          `Server error: ${response.status}`
        );
      }

      const data = await response.json();

      console.log(
        "STATUS UPDATE RESPONSE:",
        JSON.stringify(data, null, 2)
      );

      if (data.success) {
        setConfirmedMatches((previousMatches) =>
          previousMatches.map((match) =>
            match.confirmation_id === confirmationId
              ? {
                  ...match,
                  status:
                    data.confirmation?.status ||
                    newStatus,
                }
              : match
          )
        );

        alert(
          "Match status updated successfully."
        );
      } else {
        alert(
          data.message ||
            "Could not update match status."
        );
      }
    } catch (err) {
      console.error(
        "Status update error:",
        err
      );

      alert(
        "Could not update the match status. Please try again."
      );
    } finally {
      setUpdatingId(null);
    }
  };

  // =========================================
  // STATUS DISPLAY
  // =========================================

  const getStatusLabel = (status) => {
    if (status === "returned") {
      return "Returned";
    }

    if (status === "contacted") {
      return "Contacted";
    }

    return "Confirmed";
  };

  // =========================================
  // LOADING
  // =========================================

  if (loading) {
    return (
      <div className="confirmed-matches-page">

        <div className="loading-card">

          <div className="loading-icon">
            🤖
          </div>

          <h3>
            Loading confirmed matches...
          </h3>

          <p>
            Getting your successfully matched
            lost and found items.
          </p>

          <div className="loading-bar">
            <div className="loading-progress"></div>
          </div>

        </div>

      </div>
    );
  }

  // =========================================
  // ERROR
  // =========================================

  if (error) {
    return (
      <div className="confirmed-matches-page">

        <div className="error-card">

          <div className="no-match-icon">
            ⚠️
          </div>

          <h3>
            Something went wrong
          </h3>

          <p>
            {error}
          </p>

          <button
            onClick={fetchConfirmedMatches}
          >
            Try Again
          </button>

        </div>

      </div>
    );
  }

  // =========================================
  // MAIN PAGE
  // =========================================

  return (
    <div className="confirmed-matches-page">

      {/* =====================================
          PAGE HEADER
      ===================================== */}

      <div className="matches-header">

        <div>

          <h2>
            ✅ Confirmed Matches
          </h2>

          <p>
            Your successfully matched lost and
            found items.
          </p>

        </div>

        <div className="match-count">

          {confirmedMatches.length}{" "}

          {confirmedMatches.length === 1
            ? "Match"
            : "Matches"}

        </div>

      </div>


      {/* =====================================
          EMPTY STATE
      ===================================== */}

      {confirmedMatches.length === 0 ? (

        <div className="confirmed-empty">

          <div className="confirmed-empty-icon">
            🔍
          </div>

          <h3>
            No confirmed matches yet
          </h3>

          <p>
            When you confirm an AI match,
            it will appear here.
          </p>

        </div>

      ) : (

        <>

          {/* =================================
              SUCCESS MESSAGE
          ================================= */}

          <div className="confirmed-match">

            <div className="confirmed-icon">
              🎉
            </div>

            <div>

              <h3>
                Great! Your matches are confirmed.
              </h3>

              <p>
                Contact the finder using the phone
                number provided below.
              </p>

            </div>

          </div>


          {/* =================================
              MATCH LIST
          ================================= */}

          <div className="matches-list">

            {confirmedMatches.map(
              (match, index) => {

                const currentStatus =
                  match.status || "confirmed";

                const isUpdating =
                  updatingId ===
                  match.confirmation_id;

                return (

                  <div
                    className="confirmed-match-card"
                    key={
                      match.confirmation_id ??
                      index
                    }
                  >

                    {/* ==========================
                        CARD HEADER
                    ========================== */}

                    <div className="confirmed-card-header">

                      <div className="match-item-icon">
                        👜
                      </div>

                      <div className="confirmed-card-title">

                        <span className="ai-label">
                          MATCH CONFIRMED
                        </span>

                        <h3>
                          {match.lost_item_name ||
                            "Lost Item"}
                        </h3>

                      </div>

                      <div className="confirmed-status">

                        ✓{" "}
                        {getStatusLabel(
                          currentStatus
                        )}

                      </div>

                    </div>


                    {/* ==========================
                        LOST / FOUND
                    ========================== */}

                    <div className="confirmed-comparison">

                      <div className="confirmed-comparison-item">

                        <small>
                          YOU REPORTED
                        </small>

                        <strong>
                          {match.lost_item_name ||
                            "Unknown Item"}
                        </strong>

                      </div>


                      <div className="confirmed-arrow">
                        ↔
                      </div>


                      <div className="confirmed-comparison-item">

                        <small>
                          FOUND ITEM
                        </small>

                        <strong>
                          {match.found_item_name ||
                            "Unknown Item"}
                        </strong>

                      </div>

                    </div>


                    {/* ==========================
                        DESCRIPTION
                    ========================== */}

                    {match.description && (

                      <div className="match-description">

                        <p>
                          {match.description}
                        </p>

                      </div>

                    )}


                    {/* ==========================
                        DETAILS
                    ========================== */}

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
                              {match.location}
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


                    {/* ==========================
                        CONTACT FINDER
                    ========================== */}

                    <div className="confirmed-contact">

                      <h4>
                        📞 Contact Finder
                      </h4>

                      <p>
                        The person who reported the
                        found item can be contacted at:
                      </p>

                      {match.contact ? (

                        <a
                          href={`tel:${match.contact}`}
                        >
                          📞 {match.contact}
                        </a>

                      ) : (

                        <p>
                          Contact information was not
                          provided.
                        </p>

                      )}

                    </div>


                    {/* ==========================
                        UPDATE STATUS
                    ========================== */}

                    <div className="status-update-section">

                      <h4>
                        🔄 Update Match Status
                      </h4>

                      <div className="status-update-controls">

                        <select
                          value={currentStatus}
                          disabled={isUpdating}
                          onChange={(event) => {
                            const newStatus =
                              event.target.value;

                            handleStatusChange(
                              match.confirmation_id,
                              newStatus
                            );
                          }}
                        >

                          <option value="confirmed">
                            Confirmed
                          </option>

                          <option value="contacted">
                            Contacted
                          </option>

                          <option value="returned">
                            Returned
                          </option>

                        </select>

                        {isUpdating && (
                          <span>
                            ⏳ Updating...
                          </span>
                        )}

                      </div>

                    </div>


                    {/* ==========================
                        FOOTER
                    ========================== */}

                    <div className="confirmed-card-footer">

                      <span>
                        Confirmation ID: #
                        {match.confirmation_id}
                      </span>

                      <span>
                        Status:{" "}
                        {getStatusLabel(
                          currentStatus
                        )}
                      </span>

                    </div>

                  </div>

                );
              }
            )}

          </div>

        </>

      )}

    </div>
  );
}

export default ConfirmedMatches;
