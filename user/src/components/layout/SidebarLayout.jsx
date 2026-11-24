import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ChevronRight, X } from "lucide-react";
import PantherLogo from "../common/PantherLogo";

export const SIDEBAR_ITEMS = [
  { label: "Cricket", icon: "🏏", color: "#b91c1c", path: "/sports/cricket", sport: "cricket" },
  { label: "Football", icon: "⚽", color: "#0f172a", path: "/sports/football", sport: "football" },
  { label: "Tennis", icon: "🎾", color: "#65a30d", path: "/sports/tennis", sport: "tennis" },
  { label: "Horse Racing", icon: "🐎", color: "#854d0e", soon: true },
  { label: "Greyhound Racing", icon: "🐕", color: "#475569", soon: true },
  { label: "Sportsbook", icon: "🏆", color: "#d97706", path: "/sports" },
  { label: "Casino", icon: "🃏", color: "#475569", path: "/casino" },
  { label: "Live Casino", icon: "🎰", color: "#dc2626", path: "/casino?category=live" },
  { label: "Aviator", icon: "🚀", color: "#dc2626", path: "/casino?category=aviator" },
  { label: "Slot Games", icon: "🎲", color: "#ea580c", path: "/casino?category=slots" },
  { label: "Roulette", icon: "🎡", color: "#0891b2", path: "/casino?category=roulette" },
  { label: "Crash Games", icon: "💥", color: "#e11d48", path: "/casino?category=crash" },
  { label: "Mini Games", icon: "🕹️", color: "#06b6d4", path: "/casino?category=mini" },
  { label: "Poker", icon: "♠️", color: "#1e293b", path: "/casino?category=poker" },
  { label: "Color Game", icon: "🎨", color: "#d97706", path: "/casino?category=color" },
  { label: "Game Shows", icon: "📺", color: "#9333ea", path: "/casino?category=shows" },
];

export default function SidebarLayout({
  children,
  drawerOpen = false,
  onCloseDrawer,
  activeItem,
  onItemClick,
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const [showRightDrawer, setShowRightDrawer] = useState(true);

  // Close mobile drawer on route change
  useEffect(() => {
    if (onCloseDrawer) onCloseDrawer();
  }, [location.pathname]);

  const handleItemSelect = (item) => {
    if (item.soon) return;
    if (onItemClick) onItemClick(item);
    if (item.path) navigate(item.path);
    if (onCloseDrawer) onCloseDrawer();
  };

  return (
    <div className="bp-layout-page">
      {/* Mobile Drawer Backdrop */}
      {drawerOpen && (
        <div
          className="bp-drawer-backdrop"
          onClick={onCloseDrawer}
          aria-hidden="true"
        />
      )}

      <div className="bp-layout-container">
        {/* ================= LEFT SIDEBAR ================= */}
        <aside className={`bp-sidebar-card ${drawerOpen ? "drawer-open" : ""}`}>
          {/* Mobile-only drawer header */}
          <div className="bp-drawer-header">
            <div className="bp-drawer-title">
              <PantherLogo size={32} showText={false} compact={true} />
              <span>Menu</span>
            </div>
            <button
              type="button"
              className="bp-drawer-close-btn"
              onClick={onCloseDrawer}
              aria-label="Close menu"
            >
              <X size={20} />
            </button>
          </div>

          {/* Sidebar Menu Items List */}
          <div className="bp-sidebar-list">
            {SIDEBAR_ITEMS.map((item) => {
              const isActive =
                activeItem === item.label ||
                (location.pathname === item.path && item.path !== "/") ||
                (location.pathname === "/" && item.label === "Cricket");

              return (
                <button
                  key={item.label}
                  type="button"
                  className={`bp-sidebar-row ${isActive ? "active" : ""} ${item.soon ? "soon" : ""}`}
                  onClick={() => handleItemSelect(item)}
                  disabled={item.soon}
                  title={item.soon ? "Coming Soon" : item.label}
                >
                  <span className="bp-sidebar-icon">{item.icon}</span>
                  <span className="bp-sidebar-label">{item.label}</span>
                  {item.soon ? (
                    <span className="bp-sidebar-soon">Soon</span>
                  ) : (
                    <ChevronRight size={14} className="bp-sidebar-arrow" />
                  )}
                </button>
              );
            })}
          </div>
        </aside>

        {/* ================= MAIN CENTER CONTENT ================= */}
        <main className="bp-main-content">
          {children}
        </main>
      </div>

      <style>{`
        .bp-layout-page {
          width: 100%;
          min-height: calc(100vh - 104px);
          background: #e6ebef;
          padding: 10px 14px 40px;
          box-sizing: border-box;
        }

        .bp-layout-container {
          max-width: 1440px;
          margin: 0 auto;
          display: flex;
          align-items: flex-start;
          gap: 12px;
        }

        /* ─── Sidebar Card (matches screenshot left column) ─── */
        .bp-sidebar-card {
          width: 200px;
          flex-shrink: 0;
          background: #ffffff;
          border-radius: 8px;
          border: 1px solid #d5dce3;
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
          overflow: hidden;
          position: sticky;
          top: 114px;
          z-index: 50;
        }

        .bp-drawer-header {
          display: none;
        }

        .bp-sidebar-list {
          display: flex;
          flex-direction: column;
          padding: 4px 0;
        }

        .bp-sidebar-row {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 12px;
          background: transparent;
          border: none;
          text-align: left;
          font-size: 13px;
          font-weight: 600;
          color: #334155;
          cursor: pointer;
          transition: background 0.15s ease, color 0.15s ease;
          border-left: 3px solid transparent;
        }

        .bp-sidebar-row:hover:not(.soon) {
          background: #f1f5f9;
          color: #0f172a;
        }

        .bp-sidebar-row.active {
          background: #f8fafc;
          color: #b91c1c;
          border-left-color: #b91c1c;
          font-weight: 700;
        }

        .bp-sidebar-icon {
          font-size: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 20px;
        }

        .bp-sidebar-label {
          flex: 1;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .bp-sidebar-arrow {
          color: #94a3b8;
          opacity: 0.6;
        }

        .bp-sidebar-row:hover .bp-sidebar-arrow {
          opacity: 1;
          color: #475569;
        }

        .bp-sidebar-row.soon {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .bp-sidebar-soon {
          font-size: 9px;
          background: #cbd5e1;
          color: #475569;
          padding: 1px 5px;
          border-radius: 4px;
          font-weight: 700;
          text-transform: uppercase;
        }

        /* ─── Main Content Column ─── */
        .bp-main-content {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        /* ─── Mobile Drawer Handling ─── */
        @media (max-width: 900px) {
          .bp-sidebar-card {
            position: fixed;
            top: 0;
            left: 0;
            bottom: 0;
            height: 100vh;
            width: 260px;
            z-index: 1000;
            transform: translateX(-100%);
            transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
            border-radius: 0;
            box-shadow: 4px 0 20px rgba(0, 0, 0, 0.3);
            overflow-y: auto;
          }

          .bp-sidebar-card.drawer-open {
            transform: translateX(0);
          }

          .bp-drawer-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 14px 16px;
            background: #14222f;
            color: #ffffff;
            border-bottom: 1px solid #1e3a4c;
          }

          .bp-drawer-title {
            display: flex;
            align-items: center;
            gap: 10px;
            font-size: 15px;
            font-weight: 700;
          }

          .bp-drawer-close-btn {
            background: transparent;
            border: none;
            color: #cbd5e1;
            cursor: pointer;
            padding: 4px;
            display: flex;
          }

          .bp-drawer-backdrop {
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.6);
            backdrop-filter: blur(2px);
            z-index: 999;
          }
        }
      `}</style>
    </div>
  );
}

