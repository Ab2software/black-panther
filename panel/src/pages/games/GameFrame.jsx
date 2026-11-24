import React, { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getUserWallet } from "../../utils/userHelpers";

// How often to re-pull the user (and therefore wallet.availableBalance)
// while a game is open. This is the SAME field the callback controller
// writes to on every bet/settlement — polling just keeps this screen from
// showing a stale snapshot while the iframe is running its own thing.
const BALANCE_POLL_MS = 4000;

const GameFrame = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { fetchUser, user } = useAuth();
  const wallet = getUserWallet(user);
  const pollRef = useRef(null);

  const url = location.state?.url;

  const handleBack = async () => {
    await fetchUser();
    navigate(-1);
  };

  // Poll for balance updates while the game is mounted. This does NOT
  // touch auth/session state — it just re-reads the current user (and
  // therefore wallet.availableBalance) on an interval so bets/wins placed
  // inside the iframe are reflected here without waiting for "Back".
  useEffect(() => {
    if (!url) return;

    pollRef.current = setInterval(() => {
      // Only poll while the tab is actually visible — avoids burning
      // requests (and hammering the callback-adjacent user endpoint)
      // when the game is backgrounded.
      if (document.visibilityState === "visible") {
        fetchUser();
      }
    }, BALANCE_POLL_MS);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [url, fetchUser]);

  if (!url) {
    return (
      <div style={{ padding: 20 }}>
        No game URL found
        <button onClick={() => navigate(-1)}>Go Back</button>
      </div>
    );
  }

  return (
    <div style={{ width: "100%", height: "100vh", background: "#000" }}>
      <div style={{
        padding: "8px 16px",
        background: "#111",
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        <button
          onClick={handleBack}
          style={{ background: "none", border: "none", color: "#fff", fontSize: 16, cursor: "pointer" }}
        >
          ← Back
        </button>

        <div style={{ fontSize: 13, color: "#ccc" }}>
          Available Balance: <strong style={{ color: "#4ade80" }}>₹ {wallet.available.toFixed(2)}</strong>
        </div>
      </div>

      <iframe
        src={url}
        title="Game Frame"
        style={{
          width: "100%",
          height: "calc(100vh - 41px)",
          border: "none",
        }}
        allowFullScreen
      />
    </div>
  );
};

export default GameFrame;