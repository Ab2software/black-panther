import React from "react";
import { useNavigate } from "react-router-dom";

import betsoft from "../../assets/banners/betsoft.webp";
import betgames from "../../assets/banners/betgames.webp";
import mac88 from "../../assets/banners/mac88.webp";
import macexcite from "../../assets/banners/mac_excite.webp";
import live88 from "../../assets/banners/live88.webp";
import evoplay from "../../assets/banners/evoplay-entertainment.webp";
import gamzix from "../../assets/banners/gamzix.webp";
import funGames from "../../assets/banners/fun-games.webp";
import spribe from "../../assets/banners/spribe.webp";
import kingmaker from "../../assets/banners/kingmaker.webp";

const ROW_1 = [
  { id: "live88", title: "Live 88", image: live88, route: "/casino?category=live" },
  { id: "betsoft", title: "Betsoft", image: betsoft, route: "/casino?category=shows" },
  { id: "betgames", title: "Betgames.tv", image: betgames, route: "/casino?category=live" },
  { id: "mac88", title: "Mac88 Gaming", image: mac88, route: "/sports" },
  { id: "macexcite", title: "Mac Excite", image: macexcite, route: "/casino" },
];

const ROW_2 = [
  { id: "kingmaker", title: "Kingmaker", image: kingmaker, route: "/casino?category=roulette" },
  { id: "gamzix", title: "Gamzix", image: gamzix, route: "/casino?category=poker" },
  { id: "evoplay", title: "Evoplay Entertainment", image: evoplay, route: "/casino?category=live" },
  { id: "fungames", title: "Fun Games", image: funGames, route: "/casino?category=color" },
  { id: "spribe", title: "Spribe", image: spribe, route: "/casino?category=crash" },
];

export default function ProviderBanners({ onSelectProvider, selectedProvider }) {
  const navigate = useNavigate();

  const handleCardClick = (item) => {
    if (onSelectProvider) {
      onSelectProvider(item.title);
    } else if (item.route) {
      navigate(item.route);
    }
  };

  return (
    <div className="bp-banners-container">
      {/* Row 1 */}
      <div className="bp-banner-row">
        {ROW_1.map((item) => (
          <div
            key={item.id}
            className={`bp-banner-card ${selectedProvider === item.title ? "active" : ""}`}
            onClick={() => handleCardClick(item)}
            title={item.title}
          >
            <img
              src={item.image}
              alt={item.title}
              className="bp-banner-img"
              loading="lazy"
            />
          </div>
        ))}
      </div>

      {/* Row 2 */}
      <div className="bp-banner-row">
        {ROW_2.map((item) => (
          <div
            key={item.id}
            className={`bp-banner-card ${selectedProvider === item.title ? "active" : ""}`}
            onClick={() => handleCardClick(item)}
            title={item.title}
          >
            <img
              src={item.image}
              alt={item.title}
              className="bp-banner-img"
              loading="lazy"
            />
          </div>
        ))}
      </div>

      <style>{`
        .bp-banners-container {
          display: flex;
          flex-direction: column;
          gap: 6px;
          width: 100%;
        }

        .bp-banner-row {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 6px;
        }

        .bp-banner-card {
          height: 44px;
          border-radius: 6px;
          overflow: hidden;
          background: #ffffff;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
          cursor: pointer;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .bp-banner-card:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);
        }

        .bp-banner-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        @media (max-width: 900px) {
          .bp-banner-row {
            display: flex;
            overflow-x: auto;
            scrollbar-width: none;
            -webkit-overflow-scrolling: touch;
          }
          .bp-banner-row::-webkit-scrollbar {
            display: none;
          }
          .bp-banner-card {
            flex-shrink: 0;
            width: 220px;
          }
        }
      `}</style>
    </div>
  );
}

