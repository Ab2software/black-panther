import React, { useState, useRef } from "react";
import { ChevronLeft, ChevronRight, Gamepad2, Play, Users } from "lucide-react";
import { getLiveGames } from "../../services/gameService";

export default function LiveGamesSection({ onGameClick }) {
  const scrollRef = useRef(null);
  const liveGames = getLiveGames();

  const handleScroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = 300;
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  return (
    <section className="bp-livegames-card">
      {/* Header with Title & Arrow Controls (matches screenshot) */}
      <div className="bp-livegames-header">
        <div className="bp-livegames-title">
          <Gamepad2 size={18} className="bp-livegames-icon" />
          <span>Live Games</span>
          <span className="bp-live-badge-count">{liveGames.length} Active</span>
        </div>

        <div className="bp-livegames-arrows">
          <button
            type="button"
            className="bp-arrow-btn"
            onClick={() => handleScroll("left")}
            aria-label="Previous live games"
            title="Scroll left"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            type="button"
            className="bp-arrow-btn"
            onClick={() => handleScroll("right")}
            aria-label="Next live games"
            title="Scroll right"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Scrollable Live Games Carousel Track */}
      <div className="bp-livegames-track" ref={scrollRef}>
        {liveGames.map((game) => (
          <div
            key={game.id}
            className="bp-live-game-item"
            onClick={() => onGameClick && onGameClick(game)}
            title={`Play ${game.name}`}
          >
            <div
              className="bp-live-game-thumb"
              style={{ background: game.bgGradient }}
            >
              <img
                src={game.banner}
                alt={game.name}
                className="bp-live-game-banner"
                loading="lazy"
              />
              <span className="bp-live-item-badge">{game.badge}</span>
              <div className="bp-live-players-tag">
                <Users size={11} /> {game.players}
              </div>

              {/* Hover overlay with Play button */}
              <div className="bp-live-play-overlay">
                <div className="bp-play-icon-circle">
                  <Play size={16} fill="currentColor" />
                </div>
                <span>Play Live</span>
              </div>
            </div>

            <div className="bp-live-game-info">
              <span className="bp-live-game-title">{game.name}</span>
              <div className="bp-live-game-meta">
                <span className="bp-live-provider">{game.provider}</span>
                <span className="bp-live-rtp">RTP {game.rtp}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <style>{`
        .bp-livegames-card {
          background: #ffffff;
          border-radius: 8px;
          border: 1px solid #d5dce3;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
          overflow: hidden;
          width: 100%;
        }

        .bp-livegames-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 14px;
          border-bottom: 1px solid #edf1f5;
          background: #fafbfd;
        }

        .bp-livegames-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          font-weight: 700;
          color: #1e293b;
        }

        .bp-livegames-icon {
          color: #334155;
        }

        .bp-live-badge-count {
          font-size: 10.5px;
          background: #fee2e2;
          color: #dc2626;
          padding: 1px 6px;
          border-radius: 999px;
          font-weight: 800;
        }

        .bp-livegames-arrows {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .bp-arrow-btn {
          width: 28px;
          height: 28px;
          border-radius: 6px;
          background: #f1f5f9;
          border: 1px solid #cbd5e1;
          color: #475569;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .bp-arrow-btn:hover {
          background: #ffffff;
          color: #0f172a;
          border-color: #94a3b8;
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
        }

        .bp-livegames-track {
          display: flex;
          gap: 12px;
          padding: 12px 14px;
          overflow-x: auto;
          scroll-behavior: smooth;
          scrollbar-width: none;
          -webkit-overflow-scrolling: touch;
        }

        .bp-livegames-track::-webkit-scrollbar {
          display: none;
        }

        .bp-live-game-item {
          flex: 0 0 190px;
          width: 190px;
          border-radius: 8px;
          overflow: hidden;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          cursor: pointer;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          display: flex;
          flex-direction: column;
        }

        .bp-live-game-item:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1);
          border-color: #cbd5e1;
        }

        .bp-live-game-thumb {
          position: relative;
          height: 95px;
          width: 100%;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .bp-live-game-banner {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          transition: transform 0.3s ease;
        }

        .bp-live-game-item:hover .bp-live-game-banner {
          transform: scale(1.06);
        }

        .bp-live-item-badge {
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

        .bp-live-players-tag {
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

        .bp-live-play-overlay {
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

        .bp-live-game-item:hover .bp-live-play-overlay {
          opacity: 1;
        }

        .bp-play-icon-circle {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: #16a34a;
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 0 10px rgba(22, 163, 74, 0.6);
        }

        .bp-live-game-info {
          padding: 8px 10px;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .bp-live-game-title {
          font-size: 12.5px;
          font-weight: 700;
          color: #1e293b;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .bp-live-game-meta {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 11px;
        }

        .bp-live-provider {
          color: #64748b;
          font-weight: 500;
        }

        .bp-live-rtp {
          color: #16a34a;
          font-weight: 700;
          font-size: 10px;
        }
      `}</style>
    </section>
  );
}
