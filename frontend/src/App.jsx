import { useEffect, useState } from "react";
import "./App.css";

import ReportLost from "./pages/ReportLost";
import ReportFound from "./pages/ReportFound";
import Matches from "./pages/Matches";
import ConfirmedMatches from "./pages/ConfirmedMatches";

function App() {

  // =========================================
  // LOST ITEM ID
  // =========================================

  const [lostItemId, setLostItemId] = useState(() => {

    const savedId =
      localStorage.getItem("lostItemId");

    if (!savedId) {
      return null;
    }

    const id = Number(savedId);

    return Number.isNaN(id)
      ? null
      : id;
  });


  // =========================================
  // CURRENT PAGE
  // =========================================

  const [page, setPage] = useState("home");


  // =========================================
  // RECOVER LOST ITEM FROM BACKEND
  // =========================================

  const recoverLostItem = async () => {

    try {

      const response = await fetch(
        "http://127.0.0.1:8000/lost-items/latest"
      );

      if (!response.ok) {
        return null;
      }

      const data = await response.json();

      if (
        data.success &&
        data.item &&
        data.item.id
      ) {

        const id = Number(data.item.id);

        setLostItemId(id);

        localStorage.setItem(
          "lostItemId",
          String(id)
        );

        return id;
      }

    } catch (error) {

      console.error(
        "Could not recover lost item:",
        error
      );
    }

    return null;
  };


  // =========================================
  // AUTOMATICALLY RECOVER ID WHEN APP LOADS
  // =========================================

  useEffect(() => {

    const savedId =
      localStorage.getItem("lostItemId");

    if (!savedId) {

      recoverLostItem();

    }

  }, []);


  // =========================================
  // LOST ITEM SUBMITTED
  // =========================================

  const handleLostItemSubmitted = (id) => {

    const numericId = Number(id);

    console.log(
      "Lost item ID:",
      numericId
    );

    setLostItemId(numericId);

    localStorage.setItem(
      "lostItemId",
      String(numericId)
    );

    // Open AI Matches automatically
    setPage("matches");
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

  const openMatches = async () => {

    // If ID already exists
    if (lostItemId) {

      setPage("matches");

      return;
    }


    // Try to recover latest item
    const recoveredId =
      await recoverLostItem();


    if (recoveredId) {

      setPage("matches");

      return;
    }


    // No lost item exists
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

        <h1>
          AI Lost & Found
        </h1>


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
            onClick={
              startNewLostReport
            }
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
            Confirmed Matches
          </button>

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

            <h2>
              AI Lost & Found System
            </h2>


            <p>
              Find your lost belongings using
              AI-powered matching.
            </p>


            <div className="home-buttons">

              <button
                onClick={
                  startNewLostReport
                }
              >
                🔍 Report Lost Item
              </button>


              <button
                onClick={() =>
                  goToPage("found")
                }
              >
                📦 Report Found Item
              </button>

            </div>


            {lostItemId && (

              <div className="existing-match-section">

                <p>
                  You already have a lost item
                  report.
                  <br />
                  <strong>
                    Lost Item ID: {lostItemId}
                  </strong>
                </p>


                <button
                  onClick={openMatches}
                  className="matches-button"
                >
                  🤖 View AI Matches
                </button>

              </div>

            )}


            {!lostItemId && (

              <div className="existing-match-section">

                <p>
                  Report a lost item to activate
                  AI-powered matching.
                </p>


                <button
                  onClick={
                    startNewLostReport
                  }
                  className="matches-button"
                >
                  🔍 Report Lost Item
                </button>

              </div>

            )}


            <section className="how-it-works">

              <h3>
                How AI Lost & Found Works
              </h3>


              <div className="steps">

                <div className="step-card">

                  <div className="step-number">
                    1
                  </div>

                  <h4>
                    Report
                  </h4>

                  <p>
                    Report your lost or found
                    item with its details.
                  </p>

                </div>


                <div className="step-card">

                  <div className="step-number">
                    2
                  </div>

                  <h4>
                    AI Matching
                  </h4>

                  <p>
                    AI compares item name,
                    description, location and time.
                  </p>

                </div>


                <div className="step-card">

                  <div className="step-number">
                    3
                  </div>

                  <h4>
                    Confirm
                  </h4>

                  <p>
                    Review the match and confirm
                    the correct item.
                  </p>

                </div>


                <div className="step-card">

                  <div className="step-number">
                    4
                  </div>

                  <h4>
                    Return
                  </h4>

                  <p>
                    Contact the finder and mark
                    the item as returned.
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
                onClick={
                  startNewLostReport
                }
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