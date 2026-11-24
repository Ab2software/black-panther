import React, { useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const menuItems = [
  { label: "HOME",          path: "/" },
    { label: "CRICKET",        path: "/sports/cricket"},
  { label: "FOOTBALL",       path: "/sports/football" },
  { label: "TENNIS",         path: "/sports/tennis" },
  { label: "LIVE CASINO",   path: "/games/casino-live" },
  { label: "AVIATOR",       path: "/games/aviator" },
  { label: "SLOTS",         path: "/games/slots" },
  { label: "ROULETTE",      path: "/games/roulette" },
  { label: "SPORTSBOOK",    path: "/games/sportsbook" },
  { label: "CRASH GAMES",   path: "/games/crash" },
  { label: "MINI GAMES",    path: "/games/mini-games" },
  { label: "POKER",         path: "/games/poker" },
  { label: "GAME SHOWS",    path: "/games/game-shows" },
  { label: "COLOR GAME",    path: "/games/color-game" },
  { label: "CASINO",        path: "/games/casino" },

  // ── Coming soon (sports / other) ──
  { label: "MULTI MARKETS", path: null },

  { label: "HORSE RACING",  path: null },
  { label: "GREYHOUND",     path: null },
  { label: "BASKETBALL",    path: null },
  { label: "BASEBALL",      path: null },
  { label: "COCK FIGHT",    path: null },
  { label: "POLITICS",      path: null },
  { label: "BINARY",        path: null },
  { label: "KABADDI",       path: null },
];

const Header = () => {
  const scrollRef = useRef();
  const navigate  = useNavigate();
  const location  = useLocation();

  const handleClick = (item) => {
    if (item.path) navigate(item.path);
  };

  return (
    <>
      <div className="top-header">
        <div className="top-header-inner" ref={scrollRef}>
          {menuItems.map((item, index) => {
            const isActive = item.path && location.pathname === item.path;
            const isDisabled = !item.path;

            return (
              <button
                key={index}
                className={`menu-pill ${isActive ? "active" : ""} ${isDisabled ? "disabled" : ""}`}
                onClick={() => handleClick(item)}
                title={isDisabled ? "Coming soon" : item.label}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      <style>{`
        .top-header {
          width: 100%;
          background: #efefef;
          border-bottom: 1px solid #d9d9d9;
        }

        .top-header-inner {
          height: 46px;
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 0 10px;
          overflow-x: auto;
          overflow-y: hidden;
          white-space: nowrap;
          scroll-behavior: smooth;
        }

        .top-header-inner::-webkit-scrollbar { display: none; }
        .top-header-inner { -ms-overflow-style: none; scrollbar-width: none; }

        .menu-pill {
          flex-shrink: 0;
          height: 32px;
          padding: 0 14px;
          border-radius: 999px;
          border: 1px solid #d9d9d9;
          background: #eaeaea;
          color: #6d1c67;
          font-size: 12.5px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          white-space: nowrap;
        }

        .menu-pill:hover:not(.disabled) {
          background: #e2e2e2;
          color: #2f5661;
        }

        .menu-pill.active {
          color: #ff4c43;
          background: #f3f3f3;
          border-color: #ff4c43;
        }

        .menu-pill.disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        @media (min-width: 1024px) {
          .top-header-inner {
            justify-content: flex-start;
            overflow-x: auto;
          }
        }
      `}</style>
    </>
  );
};

export default Header;