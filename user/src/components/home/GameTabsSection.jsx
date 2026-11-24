import React, { useState, useMemo } from "react";
import { Play, Sparkles, Flame, Users } from "lucide-react";
import { getGamesByTab } from "../../services/gameService";

const TABS = [
  { id: "Popular", label: "Popular", icon: "🔥" },
  { id: "New Launch", label: "New Launch", icon: "✨" },
  { id: "Roulette", label: "Roulette", icon: "🎡" },
  { id: "AE Sexy", label: "AE Sexy", icon: "👙" },
  { id: "Slots", label: "Slots", icon: "🎰" },
];

export default function GameTabsSection({ onGameClick }) {
  const [activeTab, setActiveTab] = useState("Popular");

  const tabGames = useMemo(() => {
    return getGamesByTab(activeTab);
  }, [activeTab]);

  return (
    <section className="bp-gametabs-card">
      {/* Sub Tabs Strip (matches screenshot) */}
      <div className="bp-gametabs-header">
        <div className="bp-gametabs-pills">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                className={`bp-tab-btn ${isActive ? "active" : ""}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid of Games for Active Tab */}
      <div className="bp-gametabs-body">
        {tabGames.length === 0 ? (
          <div className="bp-empty-games">
            <span>No games found for {activeTab}</span>
          </div>
        ) : (
          <div className="bp-games-grid">
            {tabGames.map((g) => (
              <div
                key={g.id}
                className="bp-tab-game-card"
                onClick={() => onGameClick && onGameClick(g)}
                title={`Play ${g.name} by ${g.provider}`}
              >
                <div
                  className="bp-tab-game-thumb"
                  style={{ background: g.bgGradient }}
                >
                  <img
                    src={g.banner}
                    alt={g.name}
                    className="bp-tab-game-img"
                    loading="lazy"
                  />
                  {g.badge && (
                    <span className="bp-game-badge">{g.badge}</span>
                  )}
                  {g.players && (
                    <span className="bp-game-players">
                      <Users size={10} /> {g.players}
                    </span>
                  )}

                  {/* Play Overlay on Hover */}
                  <div className="bp-game-hover-overlay">
                    <div className="bp-game-play-btn">
                      <Play size={16} fill="currentColor" />
                    </div>
                    <span>Play Now</span>
                  </div>
                </div>

                <div className="bp-tab-game-info">
                  <span className="bp-tab-game-title">{g.name}</span>
                  <div className="bp-tab-game-footer">
                    <span className="bp-game-provider">{g.provider}</span>
                    <span className="bp-game-rtp">RTP {g.rtp}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        .bp-gametabs-card {
          background: #ffffff;
          border-radius: 8px;
          border: 1px solid #d5dce3;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
          overflow: hidden;
          width: 100%;
        }

        .bp-gametabs-header {
          display: flex;
          align-items: center;
          padding: 0 16px;
          border-bottom: 1px solid #edf1f5;
          background: #fafbfd;
          overflow-x: auto;
          scrollbar-width: none;
        }

        .bp-gametabs-header::-webkit-scrollbar {
          display: none;
        }

        .bp-gametabs-pills {
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .bp-tab-btn {
          background: transparent;
          border: none;
          padding: 12px 2px;
          font-size: 13.5px;
          font-weight: 600;
          color: #64748b;
          cursor: pointer;
          position: relative;
          white-space: nowrap;
          transition: color 0.15s ease;
        }

        .bp-tab-btn:hover {
          color: #0f172a;
        }

        .bp-tab-btn.active {
          color: #0f172a;
          font-weight: 800;
        }

        .bp-tab-btn.active::after {
          content: "";
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 2.5px;
          background: #2563eb;
          border-radius: 2px 2px 0 0;
        }

        .bp-gametabs-body {
          padding: 14px 16px;
          min-height: 180px;
        }

        .bp-empty-games {
          color: #64748b;
          font-size: 13px;
          font-weight: 500;
          text-align: center;
          padding: 40px 0;
        }

        .bp-games-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
          gap: 12px;
          width: 100%;
        }

        .bp-tab-game-card {
          border-radius: 8px;
          overflow: hidden;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          cursor: pointer;
          transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
          display: flex;
          flex-direction: column;
        }

        .bp-tab-game-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 18px rgba(0, 0, 0, 0.08);
          border-color: #cbd5e1;
        }

        .bp-tab-game-thumb {
          position: relative;
          height: 95px;
          width: 100%;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .bp-tab-game-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          transition: transform 0.3s ease;
        }

        .bp-tab-game-card:hover .bp-tab-game-img {
          transform: scale(1.06);
        }

        .bp-game-badge {
          position: absolute;
          top: 6px;
          left: 6px;
          background: rgba(0, 0, 0, 0.75);
          backdrop-filter: blur(4px);
          color: #facc15;
          font-size: 9.5px;
          font-weight: 800;
          padding: 2px 6px;
          border-radius: 4px;
          border: 1px solid rgba(250, 204, 21, 0.3);
          z-index: 2;
        }

        .bp-game-players {
          position: absolute;
          bottom: 6px;
          right: 6px;
          background: rgba(0, 0, 0, 0.75);
          backdrop-filter: blur(4px);
          color: #4ade80;
          font-size: 9.5px;
          font-weight: 700;
          padding: 2px 6px;
          border-radius: 4px;
          display: flex;
          align-items: center;
          gap: 3px;
          z-index: 2;
        }

        .bp-game-hover-overlay {
          position: absolute;
          inset: 0;
          background: rgba(15, 23, 42, 0.65);
          backdrop-filter: blur(2px);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 4px;
          opacity: 0;
          transition: opacity 0.2s ease;
          z-index: 3;
          color: #ffffff;
          font-size: 11px;
          font-weight: 700;
        }

        .bp-tab-game-card:hover .bp-game-hover-overlay {
          opacity: 1;
        }

        .bp-game-play-btn {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: #2563eb;
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 0 10px rgba(37, 99, 235, 0.6);
        }

        .bp-tab-game-info {
          padding: 8px 10px;
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .bp-tab-game-title {
          font-size: 12.5px;
          font-weight: 700;
          color: #1e293b;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .bp-tab-game-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 11px;
        }

        .bp-game-provider {
          color: #64748b;
          font-weight: 500;
        }

        .bp-game-rtp {
          color: #16a34a;
          font-weight: 700;
          font-size: 10px;
        }

        @media (max-width: 640px) {
          .bp-games-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 8px;
          }
        }
      `}</style>
    </section>
  );
}
