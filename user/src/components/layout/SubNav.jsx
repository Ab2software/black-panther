import React, { useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";

export const SUB_NAV_ITEMS = [
  { id: "home", label: "HOME", path: "/" },
  { id: "cricket", label: "CRICKET", path: "/sports/cricket", sport: "cricket" },
  { id: "football", label: "FOOTBALL", path: "/sports/football", sport: "football" },
  { id: "tennis", label: "TENNIS", path: "/sports/tennis", sport: "tennis" },
  { id: "live-casino", label: "LIVE CASINO", path: "/casino", category: "live" },
  { id: "aviator", label: "AVIATOR", path: "/casino?category=aviator" },
  { id: "slots", label: "SLOTS", path: "/casino?category=slots" },
  { id: "roulette", label: "ROULETTE", path: "/casino?category=roulette" },
  { id: "sportsbook", label: "SPORTSBOOK", path: "/sports" },
  { id: "crash-games", label: "CRASH GAMES", path: "/casino?category=crash" },
  { id: "mini-games", label: "MINI GAMES", path: "/casino?category=mini" },
  { id: "poker", label: "POKER", path: "/casino?category=poker" },
  { id: "game-shows", label: "GAME SHOWS", path: "/casino?category=shows" },
  { id: "color-game", label: "COLOR GAME", path: "/casino?category=color" },
  { id: "casino", label: "CASINO", path: "/casino" },
  { id: "multi-markets", label: "MULTI MARKETS", soon: true },
  { id: "horse-racing", label: "HORSE RACING", soon: true },
  { id: "greyhound", label: "GREYHOUND", soon: true },
];

export default function SubNav({ activeItem = "HOME", onSelect }) {
  const scrollRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  const handleItemClick = (item) => {
    if (item.soon) return;
    if (onSelect) onSelect(item);
    if (item.path) {
      navigate(item.path);
    }
  };

  return (
    <nav className="bp-subnav-root">
      <div className="bp-subnav-container" ref={scrollRef}>
        {SUB_NAV_ITEMS.map((item) => {
          const isActive =
            activeItem === item.label ||
            (location.pathname === item.path && item.path !== "/") ||
            (location.pathname === "/" && item.label === "HOME");

          return (
            <button
              key={item.id}
              type="button"
              className={`bp-subnav-pill ${isActive ? "active" : ""} ${item.soon ? "soon" : ""}`}
              onClick={() => handleItemClick(item)}
              title={item.soon ? "Coming Soon" : item.label}
              disabled={item.soon}
            >
              {item.label}
              {item.soon && <span className="bp-subnav-soon-badge">Soon</span>}
            </button>
          );
        })}
      </div>

      <style>{`
        .bp-subnav-root {
          width: 100%;
          background: #ebeef1;
          border-bottom: 1px solid #d5dce3;
          position: sticky;
          top: 60px;
          z-index: 80;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        }

        .bp-subnav-container {
          max-width: 1440px;
          margin: 0 auto;
          height: 44px;
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 0 12px;
          overflow-x: auto;
          overflow-y: hidden;
          white-space: nowrap;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
        }

        .bp-subnav-container::-webkit-scrollbar {
          display: none;
        }

        .bp-subnav-pill {
          flex-shrink: 0;
          height: 30px;
          padding: 0 14px;
          border-radius: 999px;
          border: 1px solid #ced6de;
          background: #f4f6f8;
          color: #475569;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          transition: all 0.15s ease;
          user-select: none;
        }

        .bp-subnav-pill:hover:not(.soon) {
          background: #ffffff;
          border-color: #94a3b8;
          color: #0f172a;
        }

        /* Active pill matches screenshot: red/burgundy outline with red text */
        .bp-subnav-pill.active {
          background: #ffffff;
          border-color: #b91c1c;
          color: #b91c1c;
          box-shadow: 0 1px 4px rgba(185, 28, 28, 0.15);
        }

        .bp-subnav-pill.soon {
          opacity: 0.6;
          cursor: not-allowed;
          background: #e2e8f0;
          border-style: dashed;
        }

        .bp-subnav-soon-badge {
          font-size: 9px;
          background: #94a3b8;
          color: #ffffff;
          padding: 1px 4px;
          border-radius: 4px;
          font-weight: 800;
          text-transform: uppercase;
        }
      `}</style>
    </nav>
  );
}

