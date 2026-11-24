import React from "react";
import evolutionImg from "../../assets/banners/evolution.webp";
import live88Img from "../../assets/banners/live88.webp";
import sexyImg from "../../assets/banners/sexy-bcrt.webp";
import kingmakerImg from "../../assets/banners/kingmaker.webp";
import betsoftImg from "../../assets/banners/betsoft.webp";
import betgamesImg from "../../assets/banners/betgames.webp";
import ezugiImg from "../../assets/banners/ezugi.webp";
import funGamesImg from "../../assets/banners/fun-games.webp";
import mac88Img from "../../assets/banners/mac88.webp";

export const FAVOURITES_LIST = [
  { id: "fav_dt", title: "DRAGON TIGER", banner: evolutionImg, bg: "linear-gradient(135deg, #450a0a, #7f1d1d)" },
  { id: "fav_dtl", title: "DRAGON TIGER LION", banner: kingmakerImg, bg: "linear-gradient(135deg, #1e1b4b, #312e81)" },
  { id: "fav_1ddt", title: "1 DAY DRAGON TIGER", banner: funGamesImg, bg: "linear-gradient(135deg, #78350f, #b45309)" },
  { id: "fav_bacc1d", title: "BACCARAT ONE DAY", banner: live88Img, bg: "linear-gradient(135deg, #064e3b, #047857)" },
  { id: "fav_bacc", title: "BACCARAT", banner: sexyImg, bg: "linear-gradient(135deg, #831843, #be185d)" },
  { id: "fav_29bacc", title: "29 CARD BACCARAT", banner: betsoftImg, bg: "linear-gradient(135deg, #172554, #1e40af)" },
  { id: "fav_sicbo", title: "SIC BO", banner: betgamesImg, bg: "linear-gradient(135deg, #581c87, #7e22ce)" },

  { id: "fav_roul", title: "ROULETTE", banner: evolutionImg, bg: "linear-gradient(135deg, #1e3a8a, #2563eb)" },
  { id: "fav_poker2020", title: "POKER 20-20", banner: mac88Img, bg: "linear-gradient(135deg, #701a75, #a21caf)" },
  { id: "fav_poker1d", title: "POKER 1 DAY", banner: kingmakerImg, bg: "linear-gradient(135deg, #713f12, #a16207)" },
  { id: "fav_lucky7", title: "LUCKY 7", banner: ezugiImg, bg: "linear-gradient(135deg, #0f766e, #0d9488)" },
  { id: "fav_ab", title: "ANDAR BAHAR", banner: ezugiImg, bg: "linear-gradient(135deg, #14532d, #15803d)" },
  { id: "fav_tp1d", title: "TEENPATTI ONE DAY", banner: funGamesImg, bg: "linear-gradient(135deg, #854d0e, #ca8a04)" },
  { id: "fav_testtp", title: "TEST TEENPATTI", banner: kingmakerImg, bg: "linear-gradient(135deg, #881337, #e11d48)" },

  { id: "fav_2cardtp", title: "2 CARD TEENPATTI", banner: live88Img, bg: "linear-gradient(135deg, #0284c7, #0369a1)" },
  { id: "fav_muflis", title: "MUFLIS TEENPATTI", banner: mac88Img, bg: "linear-gradient(135deg, #b45309, #d97706)" },
  { id: "fav_32cards", title: "32 CARDS", banner: betsoftImg, bg: "linear-gradient(135deg, #3730a3, #4338ca)" },
  { id: "fav_aaa", title: "AMAR AKBAR ANTHONY", banner: funGamesImg, bg: "linear-gradient(135deg, #991b1b, #dc2626)" },
  { id: "fav_3cards", title: "3 CARDS JUDGEMENT", banner: sexyImg, bg: "linear-gradient(135deg, #4c0519, #9f1239)" },
  { id: "fav_queenrace", title: "QUEEN RACE", banner: betgamesImg, bg: "linear-gradient(135deg, #3b0764, #6b21a8)" },
  { id: "fav_lottery", title: "LOTTERY", banner: funGamesImg, bg: "linear-gradient(135deg, #15803d, #22c55e)" },

  { id: "fav_superover", title: "SUPER OVER 1 DAY", banner: mac88Img, bg: "linear-gradient(135deg, #c2410c, #ea580c)" },
  { id: "fav_highlow", title: "HIGH LOW", banner: ezugiImg, bg: "linear-gradient(135deg, #0369a1, #0284c7)" },
  { id: "fav_dreamwheel", title: "DREAM WHEEL", banner: evolutionImg, bg: "linear-gradient(135deg, #4338ca, #6366f1)" },
  { id: "fav_centercard", title: "CENTER CARD 1 DAY", banner: live88Img, bg: "linear-gradient(135deg, #831843, #db2777)" },
  { id: "fav_trio", title: "TRIO", banner: betsoftImg, bg: "linear-gradient(135deg, #1e293b, #334155)" },
];

export default function ShivaFavourites({ onGameClick }) {
  return (
    <section className="shiva-section-card">
      {/* Dark Green Header Bar (matches Image 3) */}
      <div className="shiva-sec-header">
        <h2>MY FAVOURITES</h2>
      </div>

      {/* Dense Grid of Cards */}
      <div className="shiva-fav-grid">
        {FAVOURITES_LIST.map((game) => (
          <div
            key={game.id}
            className="shiva-fav-card"
            onClick={() => onGameClick && onGameClick({ name: game.title, provider: "Casino Fav", banner: game.banner })}
            style={{ background: game.bg }}
            title={`Play ${game.title}`}
          >
            <img src={game.banner} alt={game.title} className="shiva-fav-img" loading="lazy" />
            <div className="shiva-fav-bottom-bar">
              <span className="shiva-fav-title">{game.title}</span>
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

        .shiva-fav-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 5px;
          padding: 6px;
          background: #e2e8f0;
        }

        .shiva-fav-card {
          height: 90px;
          border-radius: 4px;
          overflow: hidden;
          position: relative;
          cursor: pointer;
          border: 1px solid rgba(255, 255, 255, 0.25);
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          transition: transform 0.15s ease, box-shadow 0.15s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .shiva-fav-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
        }

        .shiva-fav-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .shiva-fav-bottom-bar {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          background: rgba(0, 0, 0, 0.85);
          padding: 3px 4px;
          text-align: center;
          border-top: 1px solid rgba(255, 255, 255, 0.15);
        }

        .shiva-fav-title {
          font-size: 9.5px;
          font-weight: 800;
          color: #ffffff;
          text-transform: uppercase;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          display: block;
        }

        @media (max-width: 1100px) {
          .shiva-fav-grid {
            grid-template-columns: repeat(4, 1fr);
          }
        }

        @media (max-width: 640px) {
          .shiva-fav-grid {
            grid-template-columns: repeat(3, 1fr);
          }
          .shiva-fav-card {
            height: 75px;
          }
        }
      `}</style>
    </section>
  );
}

