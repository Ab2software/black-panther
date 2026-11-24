import React from "react";
import jiliImg from "../../assets/banners/jili.webp";
import betsoftImg from "../../assets/banners/betsoft.webp";
import kingmakerImg from "../../assets/banners/kingmaker.webp";
import live88Img from "../../assets/banners/live88.webp";
import sexyImg from "../../assets/banners/sexy-bcrt.webp";
import mac88Img from "../../assets/banners/mac88.webp";
import funGamesImg from "../../assets/banners/fun-games.webp";
import evoplayImg from "../../assets/banners/evoplay-entertainment.webp";
import gamzixImg from "../../assets/banners/gamzix.webp";

export const NEW_LAUNCH_GAMES = [
  { id: "nl_jili", title: "JILI", sub: "CASINO", banner: jiliImg, bg: "linear-gradient(135deg, #713f12, #a16207)" },
  { id: "nl_handcricket", title: "HAND CRICKET", sub: "VS LIVE", banner: funGamesImg, bg: "linear-gradient(135deg, #78350f, #c2410c)" },
  { id: "nl_wicketblast", title: "WICKET BLAST", sub: "CRICKET", banner: mac88Img, bg: "linear-gradient(135deg, #1e3a8a, #0284c7)" },
  { id: "nl_matka", title: "MATKA", sub: "DESI POT", banner: kingmakerImg, bg: "linear-gradient(135deg, #854d0e, #d97706)" },
  { id: "nl_footballx", title: "FOOTBALL-X", sub: "250X CRASH", banner: mac88Img, bg: "linear-gradient(135deg, #991b1b, #dc2626)" },
  { id: "nl_naughtybutton", title: "NAUGHTY BUTTON", sub: "ARCADE", banner: sexyImg, bg: "linear-gradient(135deg, #831843, #db2777)" },
  { id: "nl_instantrummy", title: "INSTANT RUMMY", sub: "CARDS", banner: betsoftImg, bg: "linear-gradient(135deg, #14532d, #16a34a)" },
  { id: "nl_jhandimunda", title: "JHANDI MUNDA", sub: "DICE", banner: funGamesImg, bg: "linear-gradient(135deg, #581c87, #9333ea)" },
  { id: "nl_blackjack", title: "BLACKJACK", sub: "VIP TABLE", banner: live88Img, bg: "linear-gradient(135deg, #0f172a, #1e293b)" },
  { id: "nl_bombdefuse", title: "BOMB DEFUSE", sub: "INSTANT", banner: evoplayImg, bg: "linear-gradient(135deg, #450a0a, #991b1b)" },
  { id: "nl_dealornodeal", title: "DEAL OR NO DEAL", sub: "GAME SHOW", banner: betsoftImg, bg: "linear-gradient(135deg, #713f12, #b45309)" },
  { id: "nl_goldenkick", title: "GOLDEN KICK", sub: "SOCCER", banner: mac88Img, bg: "linear-gradient(135deg, #166534, #15803d)" },
];

export default function ShivaNewLaunch({ onGameClick }) {
  return (
    <section className="shiva-section-card">
      {/* Dark Green Header Bar (matches Image 2) */}
      <div className="shiva-sec-header">
        <h2>NEW LAUNCH</h2>
      </div>

      {/* 4-column Grid of Cards */}
      <div className="shiva-nl-grid">
        {NEW_LAUNCH_GAMES.map((game) => (
          <div
            key={game.id}
            className="shiva-nl-card"
            onClick={() => onGameClick && onGameClick({ name: game.title, provider: "Shiva365", banner: game.banner })}
            style={{ background: game.bg }}
            title={`Play ${game.title}`}
          >
            <img src={game.banner} alt={game.title} className="shiva-nl-img" loading="lazy" />
            <div className="shiva-nl-bottom-bar">
              <span className="shiva-nl-title">{game.title}</span>
            </div>
          </div>
        ))}
      </div>

      <style>{`
        .shiva-section-card {
          width: 100%;
          background: #ffffff;
          border: 1px solid #cbd5e1;
          border-radius: 4px;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        }

        .shiva-sec-header {
          background: #0b4c3e;
          padding: 8px 12px;
          border-bottom: 2px solid #07382d;
        }

        .shiva-sec-header h2 {
          margin: 0;
          font-size: 13px;
          font-weight: 900;
          color: #ffffff;
          letter-spacing: 0.5px;
        }

        .shiva-nl-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 6px;
          padding: 6px;
          background: #e2e8f0;
        }

        .shiva-nl-card {
          height: 120px;
          border-radius: 4px;
          overflow: hidden;
          position: relative;
          cursor: pointer;
          border: 1px solid rgba(255, 255, 255, 0.25);
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.12);
          transition: transform 0.15s ease, box-shadow 0.15s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .shiva-nl-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
        }

        .shiva-nl-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .shiva-nl-bottom-bar {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          background: rgba(0, 0, 0, 0.85);
          padding: 4px 6px;
          text-align: center;
          border-top: 1px solid rgba(255, 255, 255, 0.15);
        }

        .shiva-nl-title {
          font-size: 11px;
          font-weight: 800;
          color: #ffffff;
          text-transform: uppercase;
          letter-spacing: 0.4px;
        }

        @media (max-width: 900px) {
          .shiva-nl-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          .shiva-nl-card {
            height: 100px;
          }
        }
      `}</style>
    </section>
  );
}
