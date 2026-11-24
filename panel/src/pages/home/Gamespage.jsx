import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getGames, launchGame } from "../../services/gameService";
import { useAuth } from "../../context/AuthContext";
import { toast } from "../../utils/toast";

/**
 * Real data from your API:
 *
 * brandId 57  → categories: ['flash', 'Casino']           (12 games)
 * brandId 112  → categories: ['CasinoLive']               (237 games)
 * brandId 59  → categories: ['CasinoLive', 'Lobby']      (189 games)
 * brandId 140 → categories: ['Mini Games', 'Live', 'Virtual', 'Slot Games',
 *               'Crash Games', 'Casual Games', 'Live Roulette', 'Color Game',
 *               'Lobby', 'Live Game Shows', 'Poker', 'Game Shows'] (179 games)
 *
 * Each entry below: { brandId, category }
 * - If category is null  → fetch ALL games for that brand (no filter)
 * - If category is set   → fetch brand then filter by game.category
 */
export const GAME_CATEGORY_CONFIG = {
  // Header / Sidebar casino routes
  Casino: { brandId: 57, category: "Casino" },
  CasinoLive: { brandId: 59, category: "CasinoLive" },
  Roulette: { brandId: 140, category: "Live Roulette" },
  "AE Sexy": { brandId: 59, category: null }, // all 189 games
  "Slot Games": { brandId: 140, category: "Slot Games" },
  Aviator: { brandId: 140, category: "Crash Games" }, // Aviator is a crash game
  "Mini Games": { brandId: 140, category: "Mini Games" },
  Live: { brandId: 140, category: "Live" },
  Virtual: { brandId: 140, category: "Virtual" },
  "Crash Games": { brandId: 140, category: "Crash Games" },
  "Casual Games": { brandId: 140, category: "Casual Games" },
  "Color Game": { brandId: 140, category: "Color Game" },
  Poker: { brandId: 140, category: "Poker" },
  "Game Shows": { brandId: 140, category: "Game Shows" },
  "Live Game Shows": { brandId: 140, category: "Live Game Shows" },
  Popular: { brandId: 112, category: null }, // all CasinoLive as "popular"
  Sportsbook: { brandId: 112, category: null },
};

const GamesPage = ({ category = "Casino" }) => {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const scrollRef = useRef(null);
  const isDraggingRef = useRef(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  /* ── Fetch + Filter ── */
  useEffect(() => {
    const config = GAME_CATEGORY_CONFIG[category];

    if (!config) {
      setGames([]);
      return;
    }

    const fetchGames = async () => {
      try {
        setLoading(true);
        setError(null);
        setGames([]);

        const response = await getGames(config.brandId);
const allGames = response.games || [];

// console.log("Category:", category);
// console.log("Brand:", config.brandId);
// console.log("Games:", allGames.length);

console.log(
  [...new Set(allGames.map(g => g.category))]
);

        const filtered = config.category
          ? allGames.filter(
              (g) =>
                g.category?.toLowerCase() === config.category.toLowerCase(),
            )
          : allGames;

        setGames(filtered);
      } catch (err) {
        console.error(err);
        setError("Failed to load games.");
      } finally {
        setLoading(false);
      }
    };

    fetchGames();
  }, [category]);

  /* ── Drag-to-scroll ── */
  const handleMouseDown = (e) => {
    const slider = scrollRef.current;
    if (!slider) return;
    isDraggingRef.current = false;
    const startX = e.pageX;
    const startScrollLeft = slider.scrollLeft;

    const onMouseMove = (ev) => {
      const walk = ev.pageX - startX;
      if (Math.abs(walk) > 5) isDraggingRef.current = true;
      slider.scrollLeft = startScrollLeft - walk;
    };
    const onMouseUp = () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      setTimeout(() => {
        isDraggingRef.current = false;
      }, 50);
    };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

  /* ── Launch ── */
  const handleCardClick = async (game_uid) => {
    if (isDraggingRef.current) return;
    if (!user?._id) {
      alert("Please login again");
      return;
    }
    try {
      const res = await launchGame(user._id, game_uid, user);
      navigate("/game", { state: { url: res.url } });
    } catch (err) {
      if (err?.isDemoBlocked) {
        toast.error(
          "Demo accounts cannot play games. Please register to play!",
        );
      } else {
        toast.error(err?.message || "Failed to launch game");
      }
    }
  };

  /* ── Render ── */
  const renderContent = () => {
    if (!GAME_CATEGORY_CONFIG[category])
      return <NoGames message={`"${category}" is not a game category`} />;
    if (loading) return <LoadingGrid />;
    if (error) return <NoGames message={error} isError />;
    if (!games.length)
      return <NoGames message={`No games found for "${category}"`} />;

    return (
      <div className="gp-grid" ref={scrollRef} onMouseDown={handleMouseDown}>
        {games.map((game) => (
          <button
            key={game.game_uid}
            type="button"
            className="gp-card"
            onClick={() => handleCardClick(game.game_uid)}
          >
            <img
              src={game.image}
              alt={game.name}
              draggable="false"
              loading="lazy"
            />
            <div className="gp-overlay">
              <span>{game.name}</span>
            </div>
          </button>
        ))}
      </div>
    );
  };

  return (
    <>
      <div className="gp-wrapper">
        <h2 className="gp-title">{category}</h2>
        <p className="gp-count">
          {!loading && !error && games.length > 0 && `${games.length} games`}
        </p>
        {renderContent()}
      </div>

      <style>{`
        .gp-wrapper { width: 100%; }

        .gp-title {
          font-size: 18px;
          font-weight: 700;
          color: #2f5661;
          margin: 0 0 4px 0;
          padding-bottom: 10px;
          border-bottom: 2px solid #d8d8d8;
          text-transform: capitalize;
        }

        .gp-count {
          font-size: 13px;
          color: #999;
          margin: 0 0 14px 0;
          min-height: 18px;
        }

        .gp-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 14px;
          user-select: none;
          -webkit-user-select: none;
        }

        .gp-card {
          position: relative;
          flex: 0 0 auto;
          width: 170px;
          height: 230px;
          border: 0;
          border-radius: 12px;
          overflow: hidden;
          cursor: pointer;
          background: #ddd;
          padding: 0;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .gp-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 28px rgba(0,0,0,0.14);
        }

        .gp-card img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          pointer-events: none;
          -webkit-user-drag: none;
        }

        .gp-overlay {
          position: absolute;
          left: 0; right: 0; bottom: 0;
          padding: 10px 12px;
          background: linear-gradient(to top, rgba(0,0,0,0.75), transparent);
          display: flex;
          align-items: flex-end;
        }

        .gp-overlay span {
          color: #fff;
          font-size: 14px;
          font-weight: 600;
          line-height: 1.2;
        }

        /* Skeleton */
        .gp-skeleton-grid { display: flex; flex-wrap: wrap; gap: 14px; }
        .gp-skeleton-card {
          width: 170px;
          height: 230px;
          border-radius: 12px;
          background: linear-gradient(90deg, #e0e0e0 25%, #ececec 50%, #e0e0e0 75%);
          background-size: 200% 100%;
          animation: gp-shimmer 1.4s infinite;
        }
        @keyframes gp-shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        /* No Games */
        .gp-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 16px;
          min-height: 300px;
          width: 100%;
          border: 2px dashed #d0d0d0;
          border-radius: 16px;
          background: #f9f9f9;
          padding: 40px 20px;
          text-align: center;
        }
        .gp-empty-icon  { font-size: 56px; line-height: 1; }
        .gp-empty-title { font-size: 18px; font-weight: 700; color: #444; margin: 0; }
        .gp-empty-sub   { font-size: 14px; color: #888; margin: 0; max-width: 280px; }

        @media (max-width: 768px) {
          .gp-title { font-size: 16px; }
          .gp-card, .gp-skeleton-card { width: 140px; height: 200px; }
        }
        @media (max-width: 480px) {
          .gp-grid { justify-content: center; }
        }
      `}</style>
    </>
  );
};

const LoadingGrid = () => (
  <div className="gp-skeleton-grid">
    {Array.from({ length: 10 }).map((_, i) => (
      <div key={i} className="gp-skeleton-card" />
    ))}
  </div>
);

const NoGames = ({ message, isError = false }) => (
  <div className="gp-empty">
    <div className="gp-empty-icon">{isError ? "⚠️" : "🎮"}</div>
    <p className="gp-empty-title">
      {isError ? "Something went wrong" : "No Games Available"}
    </p>
    <p className="gp-empty-sub">
      {message || "Check back soon for new games!"}
    </p>
  </div>
);

export default GamesPage;
