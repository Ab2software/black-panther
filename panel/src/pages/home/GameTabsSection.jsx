import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getGames, launchGame } from "../../services/gameService";
import { useAuth } from "../../context/AuthContext";
import { toast } from "../../utils/toast";

const tabs = ["Popular", "New Launch", "Roulette", "AE Sexy", "Slots"];

const TAB_BRAND_MAP = {
  Popular: 57,
  "New Launch": 140,
  Roulette: 112,
  "AE Sexy": 59,
  Slots: 140,
};

const GameTabsSection = () => {
  const [activeTab, setActiveTab] = useState("Popular");
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const scrollRef = useRef(null);
  const isDraggingRef = useRef(false);
  const { user } = useAuth();

  const fetchGames = async () => {
    try {
      setLoading(true);

      const brandId = TAB_BRAND_MAP[activeTab];
      const data = await getGames(brandId);

      // console.log("Games from API:", data);

      const allGames = Array.isArray(data.games) ? data.games : [];

      // Hide CasinoLive games and games with the vendor's broken/placeholder
      // image path (e.g. "https://igamingapis.com/img/11521.png/images/index.png")
      const filteredGames = allGames.filter((game) => {
        const category = String(game.category || "")
          .trim()
          .toLowerCase();

        if (category === "casinolive") return false;

        const image = game.image || "";
        if (!image.trim()) return false;
        if (image.includes("/images/index.png")) return false;

        return true;
      });

      // console.log("Games after filtering:", filteredGames);

      setGames(filteredGames);
    } catch (err) {
      console.error(err);
      setGames([]);
    } finally {
      setLoading(false);
    }
  };

  // 🔥 Fetch games on tab change
  useEffect(() => {
    const fetchData = async () => {
      await fetchGames();
    };
    fetchData();
  }, [activeTab]);

  const handleMouseDown = (e) => {
    const slider = scrollRef.current;
    if (!slider) return;

    isDraggingRef.current = false;

    const startX = e.pageX;
    const startScrollLeft = slider.scrollLeft;

    const onMouseMove = (moveEvent) => {
      const walk = moveEvent.pageX - startX;

      if (Math.abs(walk) > 5) {
        isDraggingRef.current = true;
      }

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

  // 🚀 Launch game instead of navigate
  const handleCardClick = async (game_uid) => {
    if (isDraggingRef.current) return;

    // ✅ Prevent null crash
    if (!user || !user._id) {
      console.error("User not loaded");
      alert("Please login again");
      return;
    }

    try {
      // console.log("USER:", user);
      const res = await launchGame(user._id, game_uid, user);

      navigate("/game", {
        state: {
          url: res.url,
        },
      });
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
  return (
    <>
      <div className="tabbed-game-section">
        <div className="tabbed-game-header">
          <div className="tabbed-game-tabs-scroll">
            {tabs.map((tab) => (
              <button
                key={tab}
                type="button"
                className={`tabbed-game-tab-btn ${activeTab === tab ? "active" : ""}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div
          className="tabbed-game-cards-row"
          ref={scrollRef}
          onMouseDown={handleMouseDown}
        >
          {loading ? (
            <p style={{ padding: "20px" }}>Loading...</p>
          ) : games.length === 0 ? (
            <p style={{ padding: "20px" }}>No games found</p>
          ) : (
            games.map((game) => (
              <button
                key={game.game_uid}
                type="button"
                className="tabbed-game-card"
                onClick={() => handleCardClick(game.game_uid)}
              >
                <img
                  src={game.image}
                  alt={game.name}
                  draggable="false"
                  loading="lazy"
                />
                <div className="tabbed-game-card-overlay">
                  <span>{game.name}</span>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      <style>{`
          .tabbed-game-section {
            width: 100%;
            background: #efefef;
            border: 1px solid #d8d8d8;
            border-radius: 10px;
            overflow: hidden;
          }

          .tabbed-game-header {
            border-bottom: 1px solid #d8d8d8;
            background: #f5f5f5;
          }

          .tabbed-game-tabs-scroll {
            display: flex;
            align-items: center;
            gap: 18px;
            padding: 0 14px;
            min-height: 52px;
            overflow-x: auto;
            overflow-y: hidden;
            white-space: nowrap;
            scrollbar-width: none;
          }

          .tabbed-game-tabs-scroll::-webkit-scrollbar {
            display: none;
          }

          .tabbed-game-tab-btn {
            position: relative;
            border: 0;
            background: transparent;
            font-size: 15px;
            font-weight: 600;
            color: #6f6f6f;
            cursor: pointer;
            padding: 0;
            flex: 0 0 auto;
            transition: color 0.2s ease;
          }

          .tabbed-game-tab-btn:hover {
            color: #2f5661;
          }

          .tabbed-game-tab-btn.active {
            color: #2f5661;
          }

          .tabbed-game-tab-btn.active::after {
            content: "";
            position: absolute;
            left: 0;
            bottom: -16px;
            width: 100%;
            height: 3px;
            background: #2f5661;
            border-radius: 999px;
          }

          .tabbed-game-cards-row {
            display: flex;
            gap: 12px;
            padding: 14px;
            overflow-x: auto;
            overflow-y: hidden;
            flex-wrap: nowrap;
            cursor: grab;
            scroll-behavior: smooth;
            user-select: none;
            -webkit-user-select: none;
          }

          .tabbed-game-cards-row:active {
            cursor: grabbing;
          }

          .tabbed-game-cards-row::-webkit-scrollbar {
            height: 6px;
          }

          .tabbed-game-cards-row::-webkit-scrollbar-thumb {
            background: #cfcfcf;
            border-radius: 10px;
          }

          .tabbed-game-card {
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

          .tabbed-game-card:hover {
            transform: translateY(-3px);
            box-shadow: 0 10px 24px rgba(0, 0, 0, 0.12);
          }

          .tabbed-game-card img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            display: block;
            pointer-events: none;
            user-drag: none;
            -webkit-user-drag: none;
          }

          .tabbed-game-card-overlay {
            position: absolute;
            left: 0;
            right: 0;
            bottom: 0;
            padding: 10px 12px;
            background: linear-gradient(to top, rgba(0, 0, 0, 0.75), rgba(0, 0, 0, 0));
            display: flex;
            align-items: flex-end;
            justify-content: flex-start;
          }

          .tabbed-game-card-overlay span {
            color: #fff;
            font-size: 14px;
            font-weight: 600;
            line-height: 1.2;
            text-align: left;
          }

          @media (max-width: 768px) {
            .tabbed-game-tabs-scroll {
              gap: 14px;
              padding: 0 12px;
              min-height: 48px;
            }

            .tabbed-game-tab-btn {
              font-size: 14px;
            }

            .tabbed-game-tab-btn.active::after {
              bottom: -14px;
            }

            .tabbed-game-cards-row {
              gap: 10px;
              padding: 12px;
            }

            .tabbed-game-card {
              width: 140px;
              height: 200px;
              border-radius: 10px;
            }

            .tabbed-game-card-overlay {
              padding: 8px 10px;
            }

            .tabbed-game-card-overlay span {
              font-size: 13px;
            }
          }
        `}</style>
    </>
  );
};

export default GameTabsSection;