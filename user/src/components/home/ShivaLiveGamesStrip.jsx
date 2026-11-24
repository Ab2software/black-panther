import React from "react";
import evolutionImg from "../../assets/banners/evolution.webp";
import live88Img from "../../assets/banners/live88.webp";
import sexyImg from "../../assets/banners/sexy-bcrt.webp";
import spribeImg from "../../assets/banners/spribe.webp";
import ezugiImg from "../../assets/banners/ezugi.webp";
import funGamesImg from "../../assets/banners/fun-games.webp";

export const LIVE_MINI_BANNERS = [
  { id: "lightning", name: "LIGHTNING", tag: "ROULETTE", banner: evolutionImg, bg: "linear-gradient(135deg, #1e1b4b, #312e81)" },
  { id: "instalive", name: "INSTA LIVE", tag: "CASINO", banner: live88Img, bg: "linear-gradient(135deg, #064e3b, #047857)" },
  { id: "sexy", name: "SEXY", tag: "BACCARAT", banner: sexyImg, bg: "linear-gradient(135deg, #831843, #be185d)" },
  { id: "aviator", name: "AVIATOR", tag: "SPRIBE", banner: spribeImg, bg: "linear-gradient(135deg, #7f1d1d, #b91c1c)" },
  { id: "mines", name: "MINES", tag: "INSTANT", banner: spribeImg, bg: "linear-gradient(135deg, #1e3a8a, #2563eb)" },
  { id: "bikinigames", name: "BIKINI GAMES", tag: "LIVE", banner: sexyImg, bg: "linear-gradient(135deg, #701a75, #a21caf)" },
  { id: "color", name: "COLOR PREDICTION", tag: "FUN", banner: funGamesImg, bg: "linear-gradient(135deg, #78350f, #b45309)" },
  { id: "chicken", name: "CHICKEN ROAD", tag: "CRASH", banner: funGamesImg, bg: "linear-gradient(135deg, #14532d, #16a34a)" },
];

export default function ShivaLiveGamesStrip({ onGameClick }) {
  return (
    <div className="shiva-strip-wrapper">
      <div className="shiva-strip-scroll">
        {LIVE_MINI_BANNERS.map((b) => (
          <div
            key={b.id}
            className="shiva-mini-banner"
            onClick={() => onGameClick && onGameClick(b)}
            style={{ background: b.bg }}
            title={`Play ${b.name}`}
          >
            <img src={b.banner} alt={b.name} className="shiva-mb-img" loading="lazy" />
            <div className="shiva-mb-overlay">
              <span className="shiva-mb-name">{b.name}</span>
            </div>
          </div>
        ))}
      </div>

      <style>{`
        .shiva-strip-wrapper {
          width: 100%;
          background: #e2e8f0;
          border: 1px solid #cbd5e1;
          border-radius: 4px;
          padding: 6px;
          overflow: hidden;
        }

        .shiva-strip-scroll {
          display: flex;
          gap: 6px;
          overflow-x: auto;
          scrollbar-width: none;
          -webkit-overflow-scrolling: touch;
        }
        .shiva-strip-scroll::-webkit-scrollbar { display: none; }

        .shiva-mini-banner {
          flex: 0 0 135px;
          height: 68px;
          border-radius: 4px;
          overflow: hidden;
          position: relative;
          cursor: pointer;
          border: 1px solid rgba(255, 255, 255, 0.2);
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
          transition: transform 0.15s ease;
        }

        .shiva-mini-banner:hover {
          transform: translateY(-2px);
        }

        .shiva-mb-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .shiva-mb-overlay {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          background: linear-gradient(180deg, transparent 0%, rgba(0, 0, 0, 0.9) 100%);
          padding: 4px 6px;
          text-align: center;
        }

        .shiva-mb-name {
          font-size: 10.5px;
          font-weight: 900;
          color: #ffffff;
          letter-spacing: 0.3px;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          display: block;
        }
      `}</style>
    </div>
  );
}

