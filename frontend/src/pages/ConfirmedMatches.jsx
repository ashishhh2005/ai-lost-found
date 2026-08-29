
import { useEffect, useState } from "react";
import "./Matches.css";

const API_URL = "https://ai-lost-found-bamz.onrender.com";

function ConfirmedMatches() {
  const [confirmedMatches, setConfirmedMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState(null);

  const fetchConfirmedMatches = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_URL}/confirmed-matches`
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

      if (
        data.success &&
        Array.isArray(data.confirmed_matches)
      ) {
        setConfirmedMatches(data.confirmed_matches);
      } else {
        setConfirmedMatches([]);
      }
    } catch (err) {
      console.error("Confirmed matches error:", err);

      setError(
        err?.message ||
          "Could not load confirmed matches."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfirmedMatches();
  }, []);

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
        `${API_URL}/confirmed-matches/${confirmationId}/status`,
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
      } else {
        alert(
          data.message ||
            "Could not update match status."
        );
      }
    } catch (err) {
      console.error("Status update error:", err);

      alert(
        err?.message ||
          "Could not update the match status."
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const getStatusLabel = (status) => {
    if (status === "returned") {
      return "Returned";
    }

    if (status === "contacted") {
      return "Contacted";
    }

    return "Confirmed";
  };

  const getStatusClass = (status) => {
    if (status === "returned") {
      return "status-returned";
    }

    if (status === "contacted") {
      return "status-contacted";
    }

    return "status-confirmed";
  };

  if (loading) {
    return (
      <div className="matches-page">

        <div className="matches-hero">

          <div className="ai-orb">
            ✅
          </div>

          <div>
            <span className="page-eyebrow">
              SUCCESSFULLY MATCHED
            </span>

            <h1>
              Confirmed Matches
            </h1>

            <p>
              Loading your confirmed lost and
              found item matches.
            </p>
          </div>

          <div className="hero-confirmed-badge">
            <span>⏳</span>

            <div>
              <strong>
                Loading
              </strong>

              <small>
                Please wait
              </small>
            </div>
          </div>

        </div>

        <div className="matches-loading-card">

          <div className="loading-icon">
            🤖
          </div>

          <h2>
            Loading confirmed matches...
          </h2>

          <p>
            Getting your successfully matched
            items.
          </p>

          <div className="loading-bar">
            <div className="loading-progress" />
          </div>

          <span className="loading-note">
            AI Lost &amp; Found
          </span>

        </div>

      </div>
    );
  }

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
            Unable to load confirmations
          </h2>

          <p>
            {error}
          </p>

          <button
            className="primary-button"
            onClick={fetchConfirmedMatches}
          >
            Try Again
          </button>

        </div>

      </div>
    );
  }

  return (
    <div className="matches-page">

      {/* =====================================================
          HERO
      ====================================================== */}

      <div className="matches-hero">

        <div className="ai-orb">
          ✅
        </div>

        <div>
          <span className="page-eyebrow">
            SUCCESSFULLY MATCHED
          </span>

          <h1>
            Confirmed Matches
          </h1>

          <p>
            Your confirmed lost and found
            item matches are shown here.
          </p>
        </div>

        <div className="hero-confirmed-badge">

          <span>
            🤝
          </span>

          <div>
            <strong>
              {confirmedMatches.length}{" "}
              {confirmedMatches.length === 1
                ? "Match"
                : "Matches"}
            </strong>

            <small>
              Successfully confirmed
            </small>
          </div>

        </div>

      </div>

      {/* =====================================================
          EMPTY STATE
      ====================================================== */}

      {confirmedMatches.length === 0 ? (

        <div className="matches-empty-state">

          <div className="empty-state-icon">
            🔍
          </div>

          <span className="page-eyebrow">
            NOTHING HERE YET
          </span>

          <h2>
            No confirmed matches
          </h2>

          <p>
            When you confirm an AI match,
            it will appear here with the
            finder&apos;s contact information.
          </p>

        </div>

      ) : (

        <>

          {/* =================================================
              SUMMARY
          ================================================== */}

          <div className="confirmed-summary">

            <div className="summary-icon">
              🎉
            </div>

            <div>

              <span>
                MATCHES CONFIRMED
              </span>

              <h2>
                You have{" "}
                {confirmedMatches.length}{" "}
                confirmed{" "}
                {confirmedMatches.length === 1
                  ? "match"
                  : "matches"}
              </h2>

              <p>
                Contact the finder and update
                the match status as it progresses.
              </p>

            </div>

          </div>

          {/* =================================================
              SUCCESS INFORMATION
          ================================================== */}

          <div className="confirmation-success">

            <div className="confirmation-success-icon">
              ✓
            </div>

            <div className="confirmation-content">

              <span className="confirmation-label">
                SUCCESS
              </span>

              <h3>
                Your AI match has been confirmed
              </h3>

              <p>
                The lost and found reports have
                been connected successfully.
              </p>

            </div>

          </div>

          {/* =================================================
              CONFIRMED MATCHES
          ================================================== */}

          <div className="confirmed-list">

            {confirmedMatches.map(
              (match, index) => {

                const currentStatus =
                  match.status ||
                  "confirmed";

                const isUpdating =
                  updatingId ===
                  match.confirmation_id;

                return (
                  <div
                    className="confirmed-card"
                    key={
                      match.confirmation_id ??
                      index
                    }
                  >

                    {/* ================================
                        CARD HEADER
                    ================================= */}

                    <div className="confirmed-card-top">

                      <div className="confirmed-item-icon">
                        🎒
                      </div>

                      <div className="confirmed-title">

                        <span className="confirmed-label">
                          ✓ MATCH CONFIRMED
                        </span>

                        <h2>
                          {match.lost_item_name ||
                            "Lost Item"}
                        </h2>

                        <p>
                          AI Lost &amp; Found
                          Confirmation
                        </p>

                      </div>

                      <div
                        className={`confirmed-status-pill ${getStatusClass(
                          currentStatus
                        )}`}
                      >

                        <span>
                          ✓
                        </span>

                        {getStatusLabel(
                          currentStatus
                        )}

                      </div>

                    </div>

                    {/* ================================
                        LOST → FOUND CONNECTION
                    ================================= */}

                    <div className="match-connection">

                      <div className="connection-item">

                        <span>
                          YOU REPORTED
                        </span>

                        <strong>
                          {match.lost_item_name ||
                            "Unknown Item"}
                        </strong>

                      </div>

                      <div className="connection-line">

                        <span>
                          →
                        </span>

                      </div>

                      <div className="connection-item">

                        <span>
                          FOUND ITEM
                        </span>

                        <strong>
                          {match.found_item_name ||
                            "Unknown Item"}
                        </strong>

                      </div>

                    </div>

                    {/* ================================
                        DESCRIPTION
                    ================================= */}

                    {match.description && (

                      <div className="confirmed-description">

                        <span>
                          ITEM DESCRIPTION
                        </span>

                        <p>
                          {match.description}
                        </p>

                      </div>

                    )}

                    {/* ================================
                        DETAILS
                    ================================= */}

                    <div className="confirmed-info-grid">

                      {match.location && (

                        <div className="confirmed-info">

                          <span className="info-icon">
                            📍
                          </span>

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

                        <div className="confirmed-info">

                          <span className="info-icon">
                            📅
                          </span>

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

                        <div className="confirmed-info">

                          <span className="info-icon">
                            🕒
                          </span>

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

                    {/* ================================
                        FINDER CONTACT
                    ================================= */}

                    <div className="finder-contact">

                      <div className="contact-icon">
                        📞
                      </div>

                      <div>

                        <small>
                          FINDER CONTACT
                        </small>

                        <strong>
                          {match.contact ||
                            "Contact information not provided"}
                        </strong>

                      </div>

                      {match.contact && (

                        <a
                          className="call-button"
                          href={`tel:${match.contact}`}
                        >
                          Call Finder
                        </a>

                      )}

                    </div>

                    {/* ================================
                        STATUS
                    ================================= */}

                    <div className="status-section">

                      <div>

                        <span>
                          MATCH PROGRESS
                        </span>

                        <strong>
                          {isUpdating
                            ? "Updating status..."
                            : "Update Match Status"}
                        </strong>

                      </div>

                      <div className="status-control">

                        {isUpdating && (
                          <span>
                            Saving...
                          </span>
                        )}

                        <select
                          value={currentStatus}
                          disabled={isUpdating}
                          onChange={(event) =>
                            handleStatusChange(
                              match.confirmation_id,
                              event.target.value
                            )
                          }
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

                      </div>

                    </div>

                    {/* ================================
                        FOOTER
                    ================================= */}

                    <div className="confirmed-footer">

                      <span>
                        Confirmation ID
                      </span>

                      <strong>
                        #
                        {match.confirmation_id}
                      </strong>

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

