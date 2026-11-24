import React, { useState, useEffect } from "react";
import { X, Maximize2, Minimize2, Volume2, VolumeX, ShieldCheck, Zap, Coins } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export default function GamePlayModal({ game, onClose, onOpenDeposit }) {
  const { user, wallet, isDemo, updateBalance } = useAuth();
  const [fullscreen, setFullscreen] = useState(false);
  const [sound, setSound] = useState(true);
  const [betAmount, setBetAmount] = useState(50);
  const [gameState, setGameState] = useState("ready"); // "ready" | "playing" | "won" | "cashed"
  const [multiplier, setMultiplier] = useState(1.0);
  const [winAmount, setWinAmount] = useState(0);

  const balance = wallet?.balance ?? (isDemo ? 10000 : 50000);

  // Aviator / Crash simulation if crash game
  useEffect(() => {
    let timer;
    if (gameState === "playing") {
      setMultiplier(1.0);
      timer = setInterval(() => {
        setMultiplier((prev) => {
          const next = +(prev + 0.05 + Math.random() * 0.05).toFixed(2);
          if (next > 4.5 + Math.random() * 3) {
            // Crashed!
            clearInterval(timer);
            setGameState("crashed");
            return next;
          }
          return next;
        });
      }, 150);
    }
    return () => clearInterval(timer);
  }, [gameState]);

  if (!game) return null;

  const handleStartGame = () => {
    if (betAmount > balance) {
      alert("Insufficient balance. Please deposit or choose lower bet.");
      return;
    }
    if (updateBalance) {
      updateBalance(-betAmount);
    }
    setGameState("playing");
    setWinAmount(0);
  };

  const handleCashout = () => {
    if (gameState !== "playing") return;
    const won = Math.round(betAmount * multiplier);
    setWinAmount(won);
    setGameState("cashed");
    if (updateBalance) {
      updateBalance(won);
    }
  };

  const isCrashGame =
    game.isCrash ||
    game.name?.toLowerCase().includes("aviator") ||
    game.name?.toLowerCase().includes("crash");

  return (
    <div className="bp-game-modal-overlay" onClick={onClose}>
      <div
        className={`bp-game-modal-container ${fullscreen ? "fullscreen" : ""}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Game Modal Top Header */}
        <div className="bp-game-modal-header">
          <div className="bp-gm-title-area">
            <span className="bp-gm-title">{game.name}</span>
            <span className="bp-gm-provider">{game.provider}</span>
            <span className="bp-gm-badge">{game.badge || "VERIFIED"}</span>
          </div>

          <div className="bp-gm-controls">
            <div className="bp-gm-bal-pill">
              <span>Bal:</span>
              <b>₹{Number(balance).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</b>
              {onOpenDeposit && (
                <button
                  type="button"
                  className="bp-gm-dep-link"
                  onClick={onOpenDeposit}
                >
                  + Add
                </button>
              )}
            </div>

            <button
              type="button"
              className="bp-gm-ctrl-btn"
              onClick={() => setSound(!sound)}
              title={sound ? "Mute" : "Unmute"}
            >
              {sound ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </button>

            <button
              type="button"
              className="bp-gm-ctrl-btn"
              onClick={() => setFullscreen(!fullscreen)}
              title={fullscreen ? "Exit Fullscreen" : "Fullscreen"}
            >
              {fullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>

            <button
              type="button"
              className="bp-gm-close-btn"
              onClick={onClose}
              title="Close Game"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Game Stage / Screen */}
        <div className="bp-game-stage">
          {isCrashGame ? (
            /* Aviator Crash Simulator */
            <div className="bp-aviator-stage">
              <div className="bp-aviator-graph">
                <div
                  className={`bp-mult-display ${gameState === "crashed" ? "crashed" : ""}`}
                >
                  {multiplier.toFixed(2)}x
                </div>
                {gameState === "crashed" && (
                  <div className="bp-crashed-text">FLEW AWAY!</div>
                )}
                {gameState === "cashed" && (
                  <div className="bp-cashed-text">WON ₹{winAmount}!</div>
                )}
                {gameState === "ready" && (
                  <div className="bp-ready-text">READY FOR NEXT ROUND</div>
                )}
              </div>

              {/* Crash Controls */}
              <div className="bp-aviator-controls">
                <div className="bp-stake-selector">
                  <span>Bet Amount (₹):</span>
                  <div className="bp-stake-stepper">
                    {[50, 100, 500, 1000].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        className={betAmount === amt ? "active" : ""}
                        onClick={() => setBetAmount(amt)}
                      >
                        ₹{amt}
                      </button>
                    ))}
                  </div>
                </div>

                {gameState === "playing" ? (
                  <button
                    type="button"
                    className="bp-cashout-btn"
                    onClick={handleCashout}
                  >
                    CASHOUT ₹{Math.round(betAmount * multiplier)}
                  </button>
                ) : (
                  <button
                    type="button"
                    className="bp-bet-btn"
                    onClick={handleStartGame}
                  >
                    PLACE BET (₹{betAmount})
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* Standard Casino Game Screen */
            <div className="bp-standard-game-screen">
              <div className="bp-game-brand-banner">
                <img src={game.banner} alt={game.name} />
                <h2>{game.name}</h2>
                <p>Powered by {game.provider} • Certified RNG 97.5%</p>
              </div>

              <div className="bp-casino-sim-panel">
                <div className="bp-sim-chips">
                  <span>Select Bet:</span>
                  <div className="bp-chip-btns">
                    {[50, 100, 250, 500, 1000].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        className={betAmount === amt ? "active" : ""}
                        onClick={() => setBetAmount(amt)}
                      >
                        ₹{amt}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  className="bp-spin-deal-btn"
                  onClick={() => {
                    handleStartGame();
                    setTimeout(() => {
                      const won = Math.random() > 0.45 ? Math.round(betAmount * 1.95) : 0;
                      if (won > 0) {
                        setWinAmount(won);
                        setGameState("won");
                        if (updateBalance) updateBalance(won);
                      } else {
                        setGameState("lost");
                      }
                    }, 1200);
                  }}
                  disabled={gameState === "playing"}
                >
                  {gameState === "playing" ? "DEALING / SPINNING..." : "PLAY ROUND"}
                </button>

                {gameState === "won" && (
                  <div className="bp-round-won">🎉 Congratulations! You won ₹{winAmount}!</div>
                )}
                {gameState === "lost" && (
                  <div className="bp-round-lost">Round finished. Better luck next time!</div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Security Badge */}
        <div className="bp-game-modal-footer">
          <div className="bp-gm-footer-text">
            <ShieldCheck size={14} color="#22c55e" />
            <span>Fair Play Certified • Provably Fair 256-Bit SSL • Instant Auto Payouts</span>
          </div>
        </div>
      </div>

      <style>{`
        .bp-game-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(10, 15, 25, 0.85);
          backdrop-filter: blur(6px);
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
        }

        .bp-game-modal-container {
          background: #111827;
          border: 1px solid #374151;
          border-radius: 12px;
          width: 100%;
          max-width: 820px;
          height: 560px;
          max-height: 90vh;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          box-shadow: 0 25px 60px rgba(0, 0, 0, 0.7);
        }

        .bp-game-modal-container.fullscreen {
          max-width: 100vw;
          height: 100vh;
          max-height: 100vh;
          border-radius: 0;
        }

        .bp-game-modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 16px;
          background: #1f2937;
          border-bottom: 1px solid #374151;
        }

        .bp-gm-title-area {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .bp-gm-title {
          font-size: 15px;
          font-weight: 800;
          color: #ffffff;
        }

        .bp-gm-provider {
          font-size: 11px;
          color: #9ca3af;
          background: #374151;
          padding: 2px 6px;
          border-radius: 4px;
        }

        .bp-gm-badge {
          font-size: 10px;
          font-weight: 800;
          color: #facc15;
          background: rgba(250, 204, 21, 0.15);
          border: 1px solid rgba(250, 204, 21, 0.3);
          padding: 2px 6px;
          border-radius: 4px;
        }

        .bp-gm-controls {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .bp-gm-bal-pill {
          display: flex;
          align-items: center;
          gap: 6px;
          background: #111827;
          border: 1px solid #374151;
          padding: 4px 10px;
          border-radius: 999px;
          font-size: 12px;
          color: #9ca3af;
        }

        .bp-gm-bal-pill b {
          color: #facc15;
          font-family: 'IBM Plex Mono', monospace;
        }

        .bp-gm-dep-link {
          background: #16a34a;
          color: white;
          border: none;
          font-size: 10px;
          font-weight: 700;
          padding: 2px 6px;
          border-radius: 4px;
          cursor: pointer;
        }

        .bp-gm-ctrl-btn, .bp-gm-close-btn {
          background: transparent;
          border: none;
          color: #9ca3af;
          cursor: pointer;
          padding: 6px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.15s ease;
        }

        .bp-gm-ctrl-btn:hover {
          color: #ffffff;
          background: #374151;
        }

        .bp-gm-close-btn:hover {
          color: #ef4444;
          background: rgba(239, 68, 68, 0.15);
        }

        .bp-game-stage {
          flex: 1;
          background: #0b0f19;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        /* Aviator Simulator */
        .bp-aviator-stage {
          flex: 1;
          display: flex;
          flex-direction: column;
          background: radial-gradient(circle at center, #1e1b4b 0%, #030712 100%);
          padding: 20px;
        }

        .bp-aviator-graph {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          position: relative;
        }

        .bp-mult-display {
          font-size: 64px;
          font-weight: 900;
          color: #ffffff;
          font-family: 'IBM Plex Mono', monospace;
          text-shadow: 0 0 30px rgba(239, 68, 68, 0.6);
        }

        .bp-mult-display.crashed {
          color: #ef4444;
          text-shadow: 0 0 30px rgba(239, 68, 68, 0.9);
        }

        .bp-crashed-text {
          font-size: 20px;
          font-weight: 800;
          color: #ef4444;
          margin-top: 8px;
        }

        .bp-cashed-text {
          font-size: 20px;
          font-weight: 800;
          color: #22c55e;
          margin-top: 8px;
        }

        .bp-ready-text {
          font-size: 14px;
          color: #94a3b8;
          margin-top: 8px;
        }

        .bp-aviator-controls {
          background: #111827;
          border: 1px solid #374151;
          border-radius: 10px;
          padding: 14px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
        }

        .bp-stake-selector {
          display: flex;
          flex-direction: column;
          gap: 6px;
          color: #9ca3af;
          font-size: 12px;
        }

        .bp-stake-stepper {
          display: flex;
          gap: 6px;
        }

        .bp-stake-stepper button {
          padding: 6px 12px;
          border-radius: 6px;
          background: #1f2937;
          border: 1px solid #374151;
          color: #e5e7eb;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
        }

        .bp-stake-stepper button.active {
          background: #d4af37;
          color: #000000;
          border-color: #d4af37;
        }

        .bp-bet-btn {
          height: 48px;
          padding: 0 28px;
          border-radius: 8px;
          background: #16a34a;
          color: white;
          font-size: 15px;
          font-weight: 800;
          border: none;
          cursor: pointer;
          box-shadow: 0 4px 14px rgba(22, 163, 74, 0.4);
        }

        .bp-bet-btn:hover {
          background: #15803d;
        }

        .bp-cashout-btn {
          height: 48px;
          padding: 0 28px;
          border-radius: 8px;
          background: #ea580c;
          color: white;
          font-size: 15px;
          font-weight: 800;
          border: none;
          cursor: pointer;
          animation: pulse 1s infinite;
        }

        /* Standard Casino Screen */
        .bp-standard-game-screen {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 24px;
          text-align: center;
        }

        .bp-game-brand-banner img {
          width: 220px;
          border-radius: 8px;
          margin-bottom: 12px;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
        }

        .bp-game-brand-banner h2 {
          color: #ffffff;
          font-size: 22px;
          margin-bottom: 4px;
        }

        .bp-game-brand-banner p {
          color: #9ca3af;
          font-size: 12px;
          margin-bottom: 20px;
        }

        .bp-casino-sim-panel {
          background: #1f2937;
          border: 1px solid #374151;
          padding: 16px 24px;
          border-radius: 10px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }

        .bp-sim-chips {
          display: flex;
          align-items: center;
          gap: 10px;
          color: #cbd5e1;
          font-size: 12px;
        }

        .bp-chip-btns {
          display: flex;
          gap: 6px;
        }

        .bp-chip-btns button {
          padding: 6px 10px;
          border-radius: 999px;
          background: #374151;
          border: 1px solid #4b5563;
          color: #f3f4f6;
          font-size: 11px;
          font-weight: 700;
          cursor: pointer;
        }

        .bp-chip-btns button.active {
          background: #d4af37;
          color: black;
          border-color: #d4af37;
        }

        .bp-spin-deal-btn {
          height: 42px;
          padding: 0 32px;
          border-radius: 8px;
          background: #2563eb;
          color: white;
          font-size: 14px;
          font-weight: 800;
          border: none;
          cursor: pointer;
        }

        .bp-spin-deal-btn:hover {
          background: #1d4ed8;
        }

        .bp-round-won {
          color: #4ade80;
          font-weight: 800;
          font-size: 14px;
        }

        .bp-round-lost {
          color: #f87171;
          font-weight: 700;
          font-size: 13px;
        }

        .bp-game-modal-footer {
          padding: 8px 16px;
          background: #111827;
          border-top: 1px solid #1f2937;
        }

        .bp-gm-footer-text {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          color: #6b7280;
        }
      `}</style>
    </div>
  );
}

