
import { useEffect, useState } from "react";
import "./App.css";

import ReportLost from "./pages/ReportLost";
import ReportFound from "./pages/ReportFound";
import Matches from "./pages/Matches";
import ConfirmedMatches from "./pages/ConfirmedMatches";

// =========================================
// PRODUCTION BACKEND URL
// =========================================

const API_URL =
  "https://ai-lost-found-bamz.onrender.com";

function App() {
  // =========================================
  // LOST ITEM ID
  // =========================================

  const [lostItemId, setLostItemId] = useState(() => {
    const savedId = localStorage.getItem("lostItemId");

    if (!savedId) {
      return null;
    }

    const id = Number(savedId);

    return Number.isNaN(id) ? null : id;
  });

  // =========================================
  // CURRENT PAGE
  // =========================================

  const [page, setPage] = useState("home");

  // =========================================
  // LOST ITEM SUBMITTED
  // =========================================

  const handleLostItemSubmitted = (id) => {
    const numericId = Number(id);

    console.log(
      "Lost item ID:",
      numericId
    );

    if (!Number.isNaN(numericId) && numericId > 0) {
      setLostItemId(numericId);

      localStorage.setItem(
        "lostItemId",
        String(numericId)
      );

      setPage("matches");
    }
  };

  // =========================================
  // START NEW LOST REPORT
  // =========================================

  const startNewLostReport = () => {
    localStorage.removeItem(
      "lostItemId"
    );

    setLostItemId(null);
    setPage("lost");
  };

  // =========================================
  // OPEN AI MATCHES
  // =========================================

  const openMatches = () => {
    if (lostItemId) {
      setPage("matches");
      return;
    }

    // Do NOT automatically fetch the latest
    // lost item from the backend.
    //
    // This prevents a new user/incognito user
    // from seeing another user's lost item.

    setPage("lost");
  };

  // =========================================
  // NAVIGATION
  // =========================================

  const goToPage = (nextPage) => {
    if (nextPage === "matches") {
      openMatches();
      return;
    }

    setPage(nextPage);
  };

  return (
    <div className="app">

      {/* =====================================
          NAVBAR
      ===================================== */}

      <nav className="navbar">

        <div className="navbar-inner">

          <button
            className="brand"
            onClick={() =>
              goToPage("home")
            }
          >
            <span className="brand-icon">
              🔎
            </span>

            <span>
              AI Lost & Found
            </span>
          </button>

          <div className="nav-buttons">

            <button
              onClick={() =>
                goToPage("home")
              }
              className={
                page === "home"
                  ? "active"
                  : ""
              }
            >
              Home
            </button>

            <button
              onClick={startNewLostReport}
              className={
                page === "lost"
                  ? "active"
                  : ""
              }
            >
              Report Lost
            </button>

            <button
              onClick={() =>
                goToPage("found")
              }
              className={
                page === "found"
                  ? "active"
                  : ""
              }
            >
              Report Found
            </button>

            <button
              onClick={openMatches}
              className={
                page === "matches"
                  ? "active"
                  : ""
              }
            >
              AI Matches
            </button>

            <button
              onClick={() =>
                goToPage("confirmed")
              }
              className={
                page === "confirmed"
                  ? "active"
                  : ""
              }
            >
              Confirmed
            </button>

          </div>

        </div>

      </nav>

      {/* =====================================
          MAIN CONTENT
      ===================================== */}

      <main className="main-content">

        {/* ===================================
            HOME
        =================================== */}

        {page === "home" && (

          <div className="home-page">

            {/* HERO */}

            <section className="hero-section">

              <div className="hero-badge">
                <span>✦</span>
                AI-Powered Lost & Found
              </div>

              <h2>
                Find What You Lost,
                <br />
                <span>Faster With AI.</span>
              </h2>

              <p className="hero-description">
                Report a lost item and let our AI
                compare it with found items using
                descriptions, locations and timing.
              </p>

              <div className="home-buttons">

                <button
                  className="primary-home-button"
                  onClick={startNewLostReport}
                >
                  <span>🔍</span>
                  Report Lost Item
                </button>

                <button
                  className="secondary-home-button"
                  onClick={() =>
                    goToPage("found")
                  }
                >
                  <span>📦</span>
                  Report Found Item
                </button>

              </div>

            </section>

            {/* EXISTING LOST ITEM */}

            {lostItemId && (

              <section className="existing-match-section">

                <div className="existing-match-content">

                  <div className="existing-match-icon">
                    🤖
                  </div>

                  <div>
                    <h3>
                      Your AI matching is ready
                    </h3>

                    <p>
                      Lost Item ID:{" "}
                      <strong>
                        #{lostItemId}
                      </strong>
                    </p>
                  </div>

                </div>

                <button
                  onClick={openMatches}
                  className="matches-button"
                >
                  View AI Matches
                  <span>→</span>
                </button>

              </section>

            )}

            {!lostItemId && (

              <section className="activation-card">

                <div className="activation-icon">
                  ✨
                </div>

                <div>
                  <h3>
                    Ready to find your item?
                  </h3>

                  <p>
                    Submit a lost item to activate
                    AI-powered matching.
                  </p>
                </div>

              </section>

            )}

            {/* HOW IT WORKS */}

            <section className="how-it-works">

              <div className="section-heading">

                <span className="section-label">
                  SIMPLE PROCESS
                </span>

                <h3>
                  How AI Lost & Found Works
                </h3>

                <p>
                  Four simple steps from reporting
                  to recovering your belongings.
                </p>

              </div>

              <div className="steps">

                <div className="step-card">

                  <div className="step-icon">
                    📝
                  </div>

                  <div className="step-content">

                    <h4>
                      Report
                    </h4>

                    <p>
                      Submit details about your
                      lost or found item.
                    </p>

                  </div>

                </div>

                <div className="step-card">

                  <div className="step-icon">
                    🤖
                  </div>

                  <div className="step-content">

                    <h4>
                      AI Matching
                    </h4>

                    <p>
                      AI compares descriptions,
                      locations and times.
                    </p>

                  </div>

                </div>

                <div className="step-card">

                  <div className="step-icon">
                    🎯
                  </div>

                  <div className="step-content">

                    <h4>
                      Confirm
                    </h4>

                    <p>
                      Review the best match and
                      confirm your item.
                    </p>

                  </div>

                </div>

                <div className="step-card">

                  <div className="step-icon">
                    🤝
                  </div>

                  <div className="step-content">

                    <h4>
                      Return
                    </h4>

                    <p>
                      Contact the finder and
                      arrange the return.
                    </p>

                  </div>

                </div>

              </div>

            </section>

            {/* AI FEATURES */}

            <section className="features-section">

              <div className="feature-item">

                <span>
                  🧠
                </span>

                <div>

                  <strong>
                    Smart Matching
                  </strong>

                  <p>
                    AI-powered similarity analysis
                  </p>

                </div>

              </div>

              <div className="feature-item">

                <span>
                  📍
                </span>

                <div>

                  <strong>
                    Location Analysis
                  </strong>

                  <p>
                    Compare where items were reported
                  </p>

                </div>

              </div>

              <div className="feature-item">

                <span>
                  ⏱️
                </span>

                <div>

                  <strong>
                    Time Comparison
                  </strong>

                  <p>
                    Analyze when items were reported
                  </p>

                </div>

              </div>

            </section>

          </div>

        )}

        {/* ===================================
            REPORT LOST
        =================================== */}

        {page === "lost" && (

          <ReportLost
            onSubmitted={
              handleLostItemSubmitted
            }
          />

        )}

        {/* ===================================
            REPORT FOUND
        =================================== */}

        {page === "found" && (

          <ReportFound />

        )}

        {/* ===================================
            AI MATCHES
        =================================== */}

        {page === "matches" && (

          lostItemId ? (

            <Matches
              lostItemId={lostItemId}
            />

          ) : (

            <div className="empty-page">

              <h2>
                No Lost Item Selected
              </h2>

              <p>
                Report a lost item first to
                generate AI matches.
              </p>

              <button
                onClick={startNewLostReport}
              >
                🔍 Report Lost Item
              </button>

            </div>

          )

        )}

        {/* ===================================
            CONFIRMED MATCHES
        =================================== */}

        {page === "confirmed" && (

          <ConfirmedMatches />

        )}

      </main>

    </div>
  );
}

export default App;

