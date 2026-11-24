import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getGames, launchGame } from "../../services/gameService";
import { useAuth } from "../../context/AuthContext";
import { toast } from "../../utils/toast";

// Brand IDs
// limit = null means show ALL games returned by backend
const SOURCES = [
  { brandId: 57, limit: 1 },
  { brandId: 140, limit: 100 },
  { brandId: 112, limit: 20 },
  { brandId: 59, limit: 50 }, // ALL BRAND 59 GAMES
];

const GameTabsSection2 = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [launchingUid, setLaunchingUid] = useState(null);

  // =====================================================
  // FETCH GAMES
  // =====================================================

useEffect(() => {
  const fetchAll = async () => {
    try {
      setLoading(true);

      const results = await Promise.all(
        SOURCES.map(async ({ brandId, limit }) => {
          try {
            const data = await getGames(brandId);

            console.log("Fetched games for brand:", data?.games);

            const list = Array.isArray(data?.games)
              ? data.games.filter((game) => {
                  const image = String(game?.image || "").trim();
                  const gameName = String(game?.name || "")
                    .trim()
                    .toLowerCase();

                  // ==========================================
                  // HIDE DRAGON TIGER (and any variants, e.g.
                  // "Dragon Tiger 20-20", "Dragon Tiger VIP")
                  // ==========================================
                  if (gameName.includes("dragon tiger")) {
                    return false;
                  }

                  // Hide games with no image
                  if (!image) return false;

                  // Hide fallback index.png image
                  if (/\/index\.png(?:\?.*)?$/i.test(image)) {
                    return false;
                  }

                  return true;
                })
              : [];

            // Brand 59 = show ALL games with logo
            if (limit === null) {
              return list;
            }

            // Other brands = apply their limits
            return list.slice(0, limit);
          } catch (err) {
            console.error(`Failed to load brand ${brandId}:`, err);
            return [];
          }
        }),
      );

      const mergedGames = results.flat();

      // Remove duplicate game_uid
      const uniqueGames = [];
      const seen = new Set();

      for (const game of mergedGames) {
        if (!game?.game_uid) continue;

        if (seen.has(String(game.game_uid))) {
          continue;
        }

        seen.add(String(game.game_uid));
        uniqueGames.push(game);
      }

      setGames(uniqueGames);
    } finally {
      setLoading(false);
    }
  };

  fetchAll();
}, []);

  // =====================================================
  // LAUNCH GAME
  // =====================================================

  const handleCardClick = async (game_uid) => {
    if (!user || !user._id) {
      alert("Please login again");
      return;
    }

    // Prevent double click
    if (launchingUid) return;

    setLaunchingUid(game_uid);

    try {
      const res = await launchGame(user._id, game_uid, user);

      if (!res?.url) {
        throw new Error("Game launch URL not received");
      }

      navigate("/game", {
        state: {
          url: res.url,
        },
      });
    } catch (err) {
      console.error("Launch error:", err);

      // Demo user
      if (err?.isDemoBlocked) {
        toast.error(
          "Demo accounts cannot play games. Please register to play!",
        );

        return;
      }

      // Game not found
      const isGameNotFound =
        err?.code === 1 ||
        err?.response?.data?.code === 1 ||
        /game not found/i.test(
          err?.message || err?.msg || err?.response?.data?.msg || "",
        );

      if (isGameNotFound) {
        // Remove unavailable game immediately
        setGames((prev) =>
          prev.filter((game) => String(game.game_uid) !== String(game_uid)),
        );

        toast.error(
          "This table is currently unavailable. Please try another game.",
        );

        return;
      }

      toast.error(
        err?.message || err?.response?.data?.msg || "Failed to launch game",
      );
    } finally {
      setLaunchingUid(null);
    }
  };

  // =====================================================
  // EMPTY STATE
  // =====================================================

  if (!loading && games.length === 0) {
    return null;
  }

  // =====================================================
  // UI
  // =====================================================

  return (
    <>
      <div className="game-cards-grid">
        {loading ? (
          <p style={{ padding: "20px" }}>Loading games...</p>
        ) : (
          games.map((game, index) => (
            <button
              key={`${game.game_uid}-${index}`}
              type="button"
              className="game-card"
              disabled={launchingUid === game.game_uid}
              onClick={() => handleCardClick(game.game_uid)}
            >
              <img
                src={game.image}
                alt={game.name || "Game"}
                draggable="false"
                loading="lazy"
              />
            </button>
          ))
        )}
      </div>

      <style>{`
        .game-cards-grid {
          display: grid;
          grid-template-columns: repeat(10, 1fr);
          gap: 4px;
          padding: 0;
          width: 100%;
          margin-top: 10px;
        }

        .game-card {
          position: relative;
          width: 100%;
          aspect-ratio: 1 / 1;
          border: 0;
        //   border-radius: 6px;
          overflow: hidden;
          cursor: pointer;
          background: #000;
          padding: 0;
          transition:
            transform 0.15s ease,
            opacity 0.15s ease;
        }

        .game-card:hover {
          transform: scale(1.03);
        }

        .game-card:disabled {
          opacity: 0.6;
          cursor: wait;
        }

        .game-card img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center;
          display: block;
          pointer-events: none;
          user-drag: none;
          -webkit-user-drag: none;
        }

        @media (max-width: 1400px) {
          .game-cards-grid {
            grid-template-columns: repeat(8, 1fr);
          }
        }

        @media (max-width: 1100px) {
          .game-cards-grid {
            grid-template-columns: repeat(6, 1fr);
          }
        }

        @media (max-width: 768px) {
          .game-cards-grid {
            grid-template-columns: repeat(4, 1fr);
            gap: 3px;
          }
        }

        @media (max-width: 480px) {
          .game-cards-grid {
            grid-template-columns: repeat(3, 1fr);
            gap: 2px;
          }
        }
      `}</style>
    </>
  );
};

export default GameTabsSection2;