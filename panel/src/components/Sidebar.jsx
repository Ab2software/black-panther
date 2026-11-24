import React, { useState, useEffect } from "react";
import logo from "../assets/panther-logo.svg";
import { useNavigate, useLocation } from "react-router-dom";

const sidebarItems = [
  { label: "Cricket", icon: "🏏", color: "#8f1d1d", path: "/sports/cricket" },
  { label: "Football", icon: "⚽", color: "#111111", path: "/sports/football" },
  { label: "Tennis", icon: "🎾", color: "#7db63f", path: "/sports/tennis" },
  { label: "Horse Racing", icon: "🐎", color: "#9a5b4f", path: null },
  { label: "Greyhound Racing", icon: "🐕", color: "#315b69", path: null },
  {
    label: "Sportsbook",
    icon: "🏆",
    color: "#f2ac00",
    path: "/games/sportsbook",
  },
  { label: "Casino", icon: "🃏", color: "#666666", path: "/games/casino" },
  {
    label: "Live Casino",
    icon: "🎰",
    color: "#c8102e",
    path: "/games/casino-live",
  },
  { label: "Aviator", icon: "🚀", color: "#c8102e", path: "/games/aviator" },
  { label: "Slot Games", icon: "🎲", color: "#e2574c", path: "/games/slots" },
  { label: "Roulette", icon: "🎡", color: "#2f5661", path: "/games/roulette" },
  { label: "Crash Games", icon: "💥", color: "#e44a42", path: "/games/crash" },
  {
    label: "Mini Games",
    icon: "🕹️",
    color: "#19b7c7",
    path: "/games/mini-games",
  },
  { label: "Poker", icon: "♠️", color: "#333333", path: "/games/poker" },
  {
    label: "Color Game",
    icon: "🎨",
    color: "#d4942e",
    path: "/games/color-game",
  },
  {
    label: "Game Shows",
    icon: "📺",
    color: "#9b59b6",
    path: "/games/game-shows",
  },
  { label: "Binary", icon: "📊", color: "#19b7c7", path: null },
  { label: "Politics", icon: "🏛️", color: "#d4942e", path: null },
  { label: "Table Tennis", icon: "🏓", color: "#e44a42", path: null },
  { label: "Basketball", icon: "🏀", color: "#ef9300", path: null },
];

/**
 * Props:
 *  - children        — page content
 *  - externalOpen    — (optional) boolean to open from outside (e.g. Navbar hamburger)
 *  - onExternalClose — (optional) callback when closed, so parent can reset its state
 */
const SidebarLayout = ({ children, externalOpen, onExternalClose }) => {
  const [internalOpen, setInternalOpen] = useState(false);

  useEffect(() => {
    const handler = () => setInternalOpen(true);
    window.addEventListener("open-game-menu", handler);
    return () => window.removeEventListener("open-game-menu", handler);
  }, []);
  const navigate = useNavigate();
  const location = useLocation();

  // Merge external + internal open state
  const open = internalOpen || !!externalOpen;

  const close = () => {
    setInternalOpen(false);
    if (onExternalClose) onExternalClose();
  };

  const handleItemClick = (item) => {
    if (item.path) navigate(item.path);
    close();
  };

  const activeItem = sidebarItems.find(
    (item) => item.path && location.pathname === item.path,
  );

  return (
    <>
      {/* MOBILE TOP BAR — internal hamburger (still works standalone) */}
      {/* <div className="mobile- header">
        <button onClick={() => setInternalOpen(true)}>☰</button>
        <span>{activeItem?.label ?? "Menu"}</span>
      </div> */}

      <div className="sidebar-page-layout">
        {open && <div className="overlay" onClick={close} />}

        {/* SIDEBAR */}
        <aside className={`sidebar-card ${open ? "open" : ""}`}>
          {/* Mobile-only header inside sidebar */}
          <div className="sl-mob-header">
            <img src={logo} className="sl-mob-logo" alt="Black Panther" />
            
            <button className="sl-mob-close" onClick={close}>
              ✕
            </button>
          </div>
          {sidebarItems.map((item) => {
            const isActive = item.path && location.pathname === item.path;
            const isDisabled = !item.path;
            return (
              <button
                key={item.label}
                className={`sidebar-row ${isActive ? "active" : ""} ${isDisabled ? "disabled" : ""}`}
                onClick={() => handleItemClick(item)}
                title={isDisabled ? "Coming soon" : item.label}
              >
                <span className="sidebar-icon" style={{ color: item.color }}>
                  {item.icon}
                </span>
                <span className="sidebar-label">{item.label}</span>
                {isDisabled && <span className="sidebar-soon">Soon</span>}
              </button>
            );
          })}
        </aside>

        {/* CONTENT */}
        <section className="sidebar-content">{children}</section>
      </div>

      <style>{`
        .sidebar-page-layout {
          display: flex;
          gap: 10px;
          width: 100%;
          padding: 10px;
          background: #dcdcdc;
          box-sizing: border-box;

        }

        .mobile-header {
          display: none;
          height: 45px;
          background: #1a2b30;
          color: white;
          align-items: center;
          gap: 10px;
          padding: 0 12px;
        }

        .mobile-header button {
          font-size: 18px;
          background: none;
          border: none;
          color: white;
          cursor: pointer;
        }

        .sidebar-card {
          width: 230px;
          min-width: 230px;
          height: calc(100vh - 130px);
          background: #efefef;
          border: 1px solid #d4d6db;
          border-radius: 14px;
          display: flex;
          flex-direction: column;
          overflow-y: auto;
          position: sticky;
          top: 10px;
          align-self: flex-start;
        }

        .sidebar-row {
          min-height: 44px;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 0 12px;
          border: none;
          border-bottom: 1px solid #d4d6db;
          background: #efefef;
          cursor: pointer;
          transition: background 0.15s ease;
          text-align: left;
          width: 100%;
        }

        .sidebar-row:hover:not(.disabled) { background: #e2e2e2; }

        .sidebar-row.active {
          background: #dde9ec;
          border-left: 3px solid #2f5661;
        }

        .sidebar-row.disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }

        .sidebar-icon { width: 24px; min-width: 24px; font-size: 18px; }

        .sidebar-label {
          font-size: 14px;
          font-weight: 600;
          color: #333;
          flex: 1;
        }

        .sidebar-row.active .sidebar-label { color: #2f5661; }

        .sidebar-soon {
          font-size: 10px;
          font-weight: 700;
          color: #aaa;
          background: #e0e0e0;
          border-radius: 4px;
          padding: 2px 6px;
          letter-spacing: 0.3px;
        }

        .sidebar-content {
          flex: 1;
          background: #efefef;
          border: 1px solid #d4d6db;
          border-radius: 10px;
          padding: 12px;
          min-width: 0;
        }

        @media (max-width: 1024px) {
          .sidebar-card { width: 180px; min-width: 180px; }
        }

        .sl-mob-header { display: none; }

        @media (max-width: 768px) {
          .sl-mob-header {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 12px 14px;
            background: linear-gradient(90deg, #0b1f23, #132f35);
            border-bottom: 1px solid rgba(255,255,255,0.1);
            position: sticky;
            top: 0;
            z-index: 1;
          }
          .sl-mob-logo { height: 26px; }
          .sl-mob-title { font-size: 15px; font-weight: 700; color: white; flex: 1; }
          .sl-mob-close {
            background: none;
            border: none;
            color: rgba(255,255,255,0.7);
            font-size: 18px;
            cursor: pointer;
            padding: 2px 4px;
            line-height: 1;
          }
          .mobile-header { display: flex; }
          .sidebar-page-layout { padding: 0; }
          .sidebar-card {
            position: fixed;
            top: 0; left: -260px;
            height: 100vh;
            z-index: 1000;
            border-radius: 0;
            transition: left 0.3s ease;
          }
          .sidebar-card.open { left: 0; }
          .overlay {
            position: fixed;
            inset: 0;
            background: rgba(0,0,0,0.4);
            z-index: 999;
          }
          .sidebar-content { border-radius: 0; border: none; }
        }
      `}</style>
    </>
  );
};

export default SidebarLayout;
