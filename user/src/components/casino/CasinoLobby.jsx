import React, { useState } from "react";
import { Play, Sparkles, Flame, Shield, X, RefreshCw, Trophy, Coins } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const CASINO_GAMES = [
  {
    id: "aviator",
    title: "Aviator Crash",
    category: "Crash Games",
    provider: "Spribe",
    players: "3,842",
    badge: "HOT 🔥",
    minBet: 10,
    maxBet: 100000,
    bgGradient: "linear-gradient(135deg, #e11d48 0%, #881337 100%)",
    icon: "✈️",
  },
  {
    id: "teen_patti",
    title: "Teen Patti 20-20",
    category: "Card Games",
    provider: "Evolution",
    players: "2,190",
    badge: "POPULAR",
    minBet: 100,
    maxBet: 200000,
    bgGradient: "linear-gradient(135deg, #d4af37 0%, #78350f 100%)",
    icon: "🃏",
  },
  {
    id: "roulette",
    title: "Lightning Roulette",
    category: "Live Casino",
    provider: "Evolution Gaming",
    players: "1,850",
    badge: "500X",
    minBet: 50,
    maxBet: 500000,
    bgGradient: "linear-gradient(135deg, #0284c7 0%, #0c4a6e 100%)",
    icon: "🎡",
  },
  {
    id: "andar_bahar",
    title: "Super Andar Bahar",
    category: "Card Games",
    provider: "Ezugi",
    players: "1,420",
    badge: "DESI LIVE",
    minBet: 100,
    maxBet: 150000,
    bgGradient: "linear-gradient(135deg, #16a34a 0%, #14532d 100%)",
    icon: "👑",
  },
  {
    id: "dragon_tiger",
    title: "Dragon Tiger 2",
    category: "Live Casino",
    provider: "Pragmatic Play",
    players: "980",
    badge: "FAST",
    minBet: 50,
    maxBet: 100000,
    bgGradient: "linear-gradient(135deg, #9333ea 0%, #581c87 100%)",
    icon: "🐉",
  },
  {
    id: "mines",
    title: "Diamond Mines",
    category: "Arcade",
    provider: "Hacksaw",
    players: "1,670",
    badge: "INSTANT",
    minBet: 20,
    maxBet: 50000,
    bgGradient: "linear-gradient(135deg, #ea580c 0%, #7c2d12 100%)",
    icon: "💎",
  },
  {
    id: "crazy_time",
    title: "Crazy Time",
    category: "Game Shows",
    provider: "Evolution",
    players: "4,210",
    badge: "MEGA BONUS",
    minBet: 50,
    maxBet: 250000,
    bgGradient: "linear-gradient(135deg, #db2777 0%, #831843 100%)",
    icon: "🎪",
  },
  {
    id: "baccarat",
    title: "Speed Baccarat A",
    category: "Live Casino",
    provider: "Evolution",
    players: "890",
    badge: "VIP",
    minBet: 200,
    maxBet: 500000,
    bgGradient: "linear-gradient(135deg, #2563eb 0%, #1e3a8a 100%)",
    icon: "♠️",
  },
];

const CATEGORIES = ["All Games", "Crash Games", "Card Games", "Live Casino", "Arcade", "Game Shows"];

export default function CasinoLobby({ onOpenAuth }) {
  const { user, wallet, isDemo, refreshWallet } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState("All Games");
  const [activeGame, setActiveGame] = useState(null);

  // Mini-game interactive state for Aviator Demo
  const [aviatorMultiplier, setAviatorMultiplier] = useState(1.0);
  const [isFlying, setIsFlying] = useState(false);
  const [crashed, setCrashed] = useState(false);
  const [betAmount, setBetAmount] = useState(100);
  const [gameResult, setGameResult] = useState(null);

  const filteredGames =
    selectedCategory === "All Games"
      ? CASINO_GAMES
      : CASINO_GAMES.filter((g) => g.category === selectedCategory);

  const startAviatorRound = () => {
    setIsFlying(true);
    setCrashed(false);
    setGameResult(null);
    setAviatorMultiplier(1.0);

    const crashPoint = 1.2 + Math.random() * 4.5;
    let curr = 1.0;

    const interval = setInterval(() => {
      curr += 0.08;
      setAviatorMultiplier(parseFloat(curr.toFixed(2)));

      if (curr >= crashPoint) {
        clearInterval(interval);
        setCrashed(true);
        setIsFlying(false);
        setGameResult({ type: "lost", message: `Flew away at ${curr.toFixed(2)}x!` });
      }
    }, 100);
  };

  const cashOutAviator = () => {
    if (!isFlying || crashed) return;
    setIsFlying(false);
    const wonAmt = Math.round(betAmount * aviatorMultiplier);
    setGameResult({
      type: "won",
      message: `Cashed out at ${aviatorMultiplier.toFixed(2)}x! Won ₹${wonAmt.toLocaleString()}`,
    });
    refreshWallet();
  };

  return (
    <div style={{ padding: "8px 0" }}>
      {/* Category Pills Bar (Touch Swipeable) */}
      <div
        className="smooth-scroll-x"
        style={{
          display: "flex",
          gap: "6px",
          paddingBottom: "10px",
          marginBottom: "12px",
        }}
      >
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setSelectedCategory(cat)}
            style={{
              padding: "7px 14px",
              borderRadius: "20px",
              background:
                selectedCategory === cat
                  ? "linear-gradient(135deg, #d4af37 0%, #a98518 100%)"
                  : "rgba(255, 255, 255, 0.05)",
              border: selectedCategory === cat ? "none" : "1px solid rgba(255, 255, 255, 0.1)",
              color: selectedCategory === cat ? "#0c0a06" : "#cbd5e1",
              fontSize: "12px",
              fontWeight: 800,
              cursor: "pointer",
              whiteSpace: "nowrap",
              transition: "all 0.12s ease",
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Casino Games Grid - 2 columns on mobile, multi-column on desktop */}
      <div
        className="casino-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
          gap: "12px",
        }}
      >
        {filteredGames.map((game) => (
          <div
            key={game.id}
            style={{
              background: "#101624",
              borderRadius: "12px",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 6px 18px rgba(0, 0, 0, 0.3)",
              transition: "transform 0.15s ease",
            }}
          >
            {/* Visual Game Poster Banner */}
            <div
              style={{
                height: "100px",
                background: game.bgGradient,
                position: "relative",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
              }}
            >
              <span style={{ fontSize: "44px", filter: "drop-shadow(0 4px 10px rgba(0,0,0,0.4))" }}>
                {game.icon}
              </span>

              {/* Top Badge */}
              <div
                style={{
                  position: "absolute",
                  top: "6px",
                  left: "6px",
                  background: "rgba(0, 0, 0, 0.65)",
                  backdropFilter: "blur(4px)",
                  padding: "2px 6px",
                  borderRadius: "5px",
                  fontSize: "9.5px",
                  fontWeight: 900,
                  color: "#d4af37",
                  border: "1px solid rgba(212, 175, 55, 0.3)",
                }}
              >
                {game.badge}
              </div>

              {/* Online Players Indicator */}
              <div
                style={{
                  position: "absolute",
                  bottom: "6px",
                  right: "6px",
                  background: "rgba(0, 0, 0, 0.75)",
                  padding: "2px 6px",
                  borderRadius: "10px",
                  fontSize: "10px",
                  color: "#4ade80",
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  gap: "3px",
                }}
              >
                <span
                  style={{
                    width: "5px",
                    height: "5px",
                    borderRadius: "50%",
                    background: "#22c55e",
                  }}
                />
                {game.players}
              </div>
            </div>

            {/* Game Content Details */}
            <div style={{ padding: "10px 10px 8px", flex: 1, display: "flex", flexDirection: "column" }}>
              <h4
                style={{
                  margin: "0 0 2px 0",
                  fontSize: "13.5px",
                  fontWeight: 800,
                  color: "#ffffff",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {game.title}
              </h4>

              <span
                style={{
                  fontSize: "10.5px",
                  color: "#64748b",
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  marginBottom: "8px",
                }}
              >
                {game.provider} • {game.category}
              </span>

              {/* Action Buttons */}
              <div style={{ marginTop: "auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
                <button
                  type="button"
                  onClick={() => {
                    if (!user) {
                      onOpenAuth("login");
                    } else {
                      setActiveGame(game);
                    }
                  }}
                  style={{
                    padding: "7px 4px",
                    background: "linear-gradient(135deg, #d4af37 0%, #a98518 100%)",
                    border: "none",
                    borderRadius: "6px",
                    color: "#0a0a0a",
                    fontSize: "11px",
                    fontWeight: 900,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "3px",
                  }}
                >
                  <Play size={11} fill="#0a0a0a" /> Play
                </button>

                <button
                  type="button"
                  onClick={() => setActiveGame(game)}
                  style={{
                    padding: "7px 4px",
                    background: "rgba(255, 255, 255, 0.06)",
                    border: "1px solid rgba(255, 255, 255, 0.12)",
                    borderRadius: "6px",
                    color: "#cbd5e1",
                    fontSize: "11px",
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  Demo
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Interactive Casino Game Preview Modal */}
      {activeGame && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.85)",
            backdropFilter: "blur(8px)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "12px",
          }}
          onClick={() => setActiveGame(null)}
        >
          <div
            className="slide-up"
            style={{
              background: "#0c111c",
              border: "1px solid rgba(212, 175, 55, 0.3)",
              borderRadius: "16px",
              width: "100%",
              maxWidth: "460px",
              maxHeight: "90vh",
              overflowY: "auto",
              boxShadow: "0 24px 60px rgba(0, 0, 0, 0.9)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "12px 16px",
                background: "rgba(255, 255, 255, 0.04)",
                borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "20px" }}>{activeGame.icon}</span>
                <div>
                  <h3 style={{ margin: 0, fontSize: "14px", color: "#ffffff", fontWeight: 800 }}>
                    {activeGame.title}
                  </h3>
                  <span style={{ fontSize: "11px", color: "#d4af37", fontWeight: 700 }}>
                    {isDemo ? "Demo Simulation" : "Live Table"} • {activeGame.provider}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveGame(null)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#94a3b8",
                  cursor: "pointer",
                  padding: "4px",
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Live Interactive Arena */}
            <div style={{ padding: "16px", textAlign: "center" }}>
              <div
                style={{
                  height: "190px",
                  background: "radial-gradient(circle at center, #1e293b 0%, #090d14 100%)",
                  borderRadius: "12px",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    fontSize: "44px",
                    fontWeight: 900,
                    color: crashed ? "#ef4444" : "#22c55e",
                    fontFamily: "'IBM Plex Mono', monospace",
                    letterSpacing: "-1px",
                  }}
                >
                  {crashed ? "FLEW AWAY!" : `${aviatorMultiplier.toFixed(2)}x`}
                </div>

                <div style={{ fontSize: "12px", color: "#94a3b8", marginTop: "6px" }}>
                  {isFlying
                    ? "🚀 Plane airborne! Cash out before crash!"
                    : crashed
                    ? "Round concluded."
                    : "Place stake and tap bet to launch flight!"}
                </div>

                {gameResult && (
                  <div
                    style={{
                      marginTop: "10px",
                      padding: "4px 12px",
                      borderRadius: "6px",
                      background: gameResult.type === "won" ? "rgba(34, 197, 94, 0.2)" : "rgba(239, 68, 68, 0.2)",
                      color: gameResult.type === "won" ? "#4ade80" : "#f87171",
                      fontSize: "12px",
                      fontWeight: 800,
                    }}
                  >
                    {gameResult.message}
                  </div>
                )}
              </div>

              {/* Stake Controls */}
              <div style={{ marginTop: "14px", display: "flex", gap: "8px", alignItems: "center" }}>
                <div style={{ flex: 1, textAlign: "left" }}>
                  <label style={{ fontSize: "10.5px", color: "#94a3b8", fontWeight: 800 }}>STAKE (₹)</label>
                  <input
                    type="number"
                    value={betAmount}
                    onChange={(e) => setBetAmount(Number(e.target.value))}
                    disabled={isFlying}
                    style={{
                      width: "100%",
                      padding: "9px 10px",
                      borderRadius: "8px",
                      background: "#161e2e",
                      border: "1px solid rgba(255, 255, 255, 0.12)",
                      color: "#ffffff",
                      fontSize: "14px",
                      fontWeight: 800,
                      outline: "none",
                      boxSizing: "border-box",
                      marginTop: "2px",
                    }}
                  />
                </div>

                <div style={{ flex: 1, paddingTop: "14px" }}>
                  {!isFlying ? (
                    <button
                      type="button"
                      onClick={startAviatorRound}
                      style={{
                        width: "100%",
                        padding: "11px",
                        background: "linear-gradient(135deg, #16a34a 0%, #15803d 100%)",
                        border: "none",
                        borderRadius: "8px",
                        color: "#ffffff",
                        fontSize: "13px",
                        fontWeight: 900,
                        cursor: "pointer",
                      }}
                    >
                      BET ₹{betAmount}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={cashOutAviator}
                      style={{
                        width: "100%",
                        padding: "11px",
                        background: "linear-gradient(135deg, #eab308 0%, #ca8a04 100%)",
                        border: "none",
                        borderRadius: "8px",
                        color: "#0a0a0a",
                        fontSize: "13px",
                        fontWeight: 900,
                        cursor: "pointer",
                      }}
                    >
                      CASHOUT ₹{Math.round(betAmount * aviatorMultiplier)}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
