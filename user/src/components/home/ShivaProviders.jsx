import React from "react";
import mac88Img from "../../assets/banners/mac88.webp";
import macExciteImg from "../../assets/banners/mac_excite.webp";
import ezugiImg from "../../assets/banners/ezugi.webp";
import spribeImg from "../../assets/banners/spribe.webp";
import evolutionImg from "../../assets/banners/evolution.webp";
import jiliImg from "../../assets/banners/jili.webp";
import sexyImg from "../../assets/banners/sexy-bcrt.webp";
import gamzixImg from "../../assets/banners/gamzix.webp";
import betgamesImg from "../../assets/banners/betgames.webp";
import live88Img from "../../assets/banners/live88.webp";
import funGamesImg from "../../assets/banners/fun-games.webp";
import betsoftImg from "../../assets/banners/betsoft.webp";
import evoplayImg from "../../assets/banners/evoplay-entertainment.webp";
import kingmakerImg from "../../assets/banners/kingmaker.webp";

export const PROVIDERS_GRID = [
  { id: "p_mac88_vg", title: "MAC88 VIRTUAL GAMES", banner: mac88Img, bg: "linear-gradient(135deg, #172554, #1e40af)" },
  { id: "p_mac88_cas", title: "MAC88 CASINO", banner: mac88Img, bg: "linear-gradient(135deg, #450a0a, #7f1d1d)" },
  { id: "p_macexcite", title: "MAC EXCITE", banner: macExciteImg, bg: "linear-gradient(135deg, #713f12, #a16207)" },
  { id: "p_creed", title: "CREED ROOMZ", banner: betsoftImg, bg: "linear-gradient(135deg, #312e81, #4338ca)" },
  { id: "p_ezugi", title: "EZUGI SMART MOVE", banner: ezugiImg, bg: "linear-gradient(135deg, #831843, #be185d)" },
  { id: "p_smartsoft", title: "SMARTSOFT GAMING", banner: funGamesImg, bg: "linear-gradient(135deg, #581c87, #7e22ce)" },
  { id: "p_turbogames", title: "TURBO GAMES", banner: spribeImg, bg: "linear-gradient(135deg, #0284c7, #0369a1)" },
  { id: "p_spribe", title: "SPRIBE", banner: spribeImg, bg: "linear-gradient(135deg, #7f1d1d, #991b1b)" },
  { id: "p_instalive", title: "INSTA LIVE", banner: live88Img, bg: "linear-gradient(135deg, #78350f, #b45309)" },
  { id: "p_evolution", title: "EVOLUTION", banner: evolutionImg, bg: "linear-gradient(135deg, #0f172a, #1e293b)" },
  { id: "p_jili", title: "JILI", banner: jiliImg, bg: "linear-gradient(135deg, #854d0e, #d97706)" },
  { id: "p_macsexy", title: "MAC SEXY", banner: sexyImg, bg: "linear-gradient(135deg, #9d174d, #db2777)" },
  { id: "p_gamzix", title: "GAMZIX", banner: gamzixImg, bg: "linear-gradient(135deg, #115e59, #0f766e)" },
  { id: "p_kingmaker", title: "KINGMAKER", banner: kingmakerImg, bg: "linear-gradient(135deg, #3730a3, #4f46e5)" },
  { id: "p_sexy", title: "SEXY GAMING", banner: sexyImg, bg: "linear-gradient(135deg, #be185d, #e11d48)" },
  { id: "p_betgames", title: "BETGAMES.TV", banner: betgamesImg, bg: "linear-gradient(135deg, #14532d, #16a34a)" },
];

export default function ShivaProviders({ onProviderClick }) {
  return (
    <section className="shiva-section-card">
      {/* Dark Green Header Bar (matches Image 4) */}
      <div className="shiva-sec-header">
        <h2>OUR PROVIDERS</h2>
      </div>

      {/* 4-column Grid of Cards */}
      <div className="shiva-prov-grid">
        {PROVIDERS_GRID.map((p) => (
          <div
            key={p.id}
            className="shiva-prov-card"
            onClick={() => onProviderClick && onProviderClick(p.title)}
            style={{ background: p.bg }}
            title={`View ${p.title} Games`}
          >
            <img src={p.banner} alt={p.title} className="shiva-prov-img" loading="lazy" />
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

        .shiva-prov-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 6px;
          padding: 6px;
          background: #e2e8f0;
        }

        .shiva-prov-card {
          height: 105px;
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

        .shiva-prov-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 14px rgba(0, 0, 0, 0.25);
        }

        .shiva-prov-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        @media (max-width: 900px) {
          .shiva-prov-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          .shiva-prov-card {
            height: 90px;
          }
        }
      `}</style>
    </section>
  );
}

