import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Search,
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  LogOut,
  User,
  RefreshCw,
  Menu,
  X,
  Sparkles,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import PantherLogo from "../common/PantherLogo";

export default function Navbar({
  onMenuToggle,
  onOpenAuth,
  onOpenDeposit,
  onOpenWithdraw,
  onOpenAccount,
  onSearch,
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, wallet, isDemo, logout, demoLogin, refreshWallet } = useAuth();

  const [now, setNow] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  // Live ticking clock (matches screenshot: 23/11/2026 (GMT +05:30) 11:06:26)
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedDate = useMemo(() => {
    const d = String(now.getDate()).padStart(2, "0");
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const y = now.getFullYear();
    return `${d}/${m}/${y}`;
  }, [now]);

  const formattedTime = useMemo(() => {
    return now.toTimeString().split(" ")[0]; // HH:MM:SS
  }, [now]);

  const handleRefresh = async (e) => {
    e?.stopPropagation();
    setRefreshing(true);
    await refreshWallet();
    setTimeout(() => setRefreshing(false), 500);
  };

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (onSearch) onSearch(val);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (onSearch) onSearch(searchQuery);
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    if (onSearch) onSearch("");
  };

  const currentBalance = wallet?.balance ?? (isDemo ? 10000 : 50000);

  return (
    <header className="bp-navbar-root">
      <div className="bp-navbar-inner">
        {/* Left Section: 4-square Grid Menu Icon + Panther Logo */}
        <div className="bp-navbar-left">
          <button
            type="button"
            className="bp-grid-menu-btn"
            onClick={onMenuToggle}
            title="Toggle Sports & Games Menu"
            aria-label="Toggle menu"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <rect x="3" y="3" width="7" height="7" rx="1.5" />
              <rect x="14" y="3" width="7" height="7" rx="1.5" />
              <rect x="3" y="14" width="7" height="7" rx="1.5" />
              <rect x="14" y="14" width="7" height="7" rx="1.5" />
            </svg>
          </button>

          <div
            className="bp-logo-wrap"
            onClick={() => navigate("/")}
            title="Black Panther Exchange"
          >
            <PantherLogo size={42} showText={false} compact={true} />
          </div>
        </div>

        {/* Center Section: Rounded Search Bar (matches screenshot) */}
        <div className="bp-navbar-center">
          <form onSubmit={handleSearchSubmit} className="bp-search-form" style={{ position: "relative" }}>
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Search Events (At least 3 letters)"
              className="bp-search-input"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={handleClearSearch}
                style={{
                  position: "absolute",
                  right: "10px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "#94a3b8",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "50%",
                  width: "18px",
                  height: "18px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "11px",
                  cursor: "pointer",
                }}
                title="Clear search"
              >
                ✕
              </button>
            )}
          </form>
        </div>

        {/* Right Section: Clock + Auth / Balance controls */}
        <div className="bp-navbar-right">
          {/* Live Date / Time Box */}
          <div className="bp-clock-box">
            <div className="bp-date-line">{formattedDate} (GMT +05:30)</div>
            <div className="bp-time-line">{formattedTime}</div>
          </div>

          {/* User Controls: Login Button or Balance & Actions */}
          {!user ? (
            <div className="bp-auth-btns">
              <button
                type="button"
                className="bp-login-btn"
                onClick={() => onOpenAuth("login")}
              >
                Login
              </button>
              <button
                type="button"
                className="bp-demo-btn"
                onClick={() => demoLogin()}
                title="Instant Demo Access (₹10,000)"
              >
                Demo
              </button>
            </div>
          ) : (
            <div className="bp-user-info-box">
              {/* Balance Widget */}
              <div
                className="bp-balance-pill"
                onClick={onOpenAccount}
                title="View Wallet & Account"
              >
                <span className="bp-bal-label">Bal:</span>
                <span className="bp-bal-amount">
                  ₹{Number(currentBalance).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <button
                  type="button"
                  className={`bp-refresh-btn ${refreshing ? "spin" : ""}`}
                  onClick={handleRefresh}
                  title="Refresh Balance"
                >
                  <RefreshCw size={13} />
                </button>
              </div>

              {/* Action Buttons */}
              <div className="bp-user-actions">
                <button
                  type="button"
                  className="bp-action-btn deposit"
                  onClick={onOpenDeposit}
                  title="Deposit Funds"
                >
                  Deposit
                </button>
                <button
                  type="button"
                  className="bp-action-btn withdraw"
                  onClick={onOpenWithdraw}
                  title="Withdraw Funds"
                >
                  Withdraw
                </button>
                <button
                  type="button"
                  className="bp-logout-btn"
                  onClick={logout}
                  title="Logout"
                >
                  <LogOut size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .bp-navbar-root {
          background: #14222f;
          background: linear-gradient(90deg, #101d29 0%, #152536 50%, #11202e 100%);
          border-bottom: 1px solid #0d1720;
          height: 60px;
          width: 100%;
          position: sticky;
          top: 0;
          z-index: 100;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.4);
        }

        .bp-navbar-inner {
          max-width: 1440px;
          margin: 0 auto;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 16px;
          gap: 16px;
        }

        .bp-navbar-left {
          display: flex;
          align-items: center;
          gap: 14px;
          flex-shrink: 0;
        }

        .bp-grid-menu-btn {
          background: transparent;
          border: none;
          color: #cbd5e1;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          padding: 6px;
          border-radius: 6px;
          transition: background 0.15s ease, color 0.15s ease;
        }

        .bp-grid-menu-btn:hover {
          color: #d4af37;
          background: rgba(255, 255, 255, 0.08);
        }

        .bp-logo-wrap {
          cursor: pointer;
          display: flex;
          align-items: center;
        }

        .bp-navbar-center {
          flex: 1;
          max-width: 520px;
          display: flex;
          justify-content: center;
        }

        .bp-search-form {
          width: 100%;
        }

        .bp-search-input {
          width: 100%;
          height: 34px;
          border-radius: 999px;
          background: #d8e2eb;
          border: 1px solid #c4d3e0;
          padding: 0 16px;
          font-size: 13px;
          color: #1e293b;
          outline: none;
          font-family: inherit;
          transition: all 0.2s ease;
        }

        .bp-search-input::placeholder {
          color: #64748b;
          font-size: 12.5px;
        }

        .bp-search-input:focus {
          background: #ffffff;
          border-color: #d4af37;
          box-shadow: 0 0 0 3px rgba(212, 175, 55, 0.2);
        }

        .bp-navbar-right {
          display: flex;
          align-items: center;
          gap: 16px;
          flex-shrink: 0;
        }

        .bp-clock-box {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          line-height: 1.25;
          user-select: none;
        }

        .bp-date-line {
          font-size: 11px;
          color: #94a3b8;
          font-weight: 500;
          letter-spacing: 0.2px;
        }

        .bp-time-line {
          font-size: 12px;
          color: #f1f5f9;
          font-weight: 700;
          font-family: 'IBM Plex Mono', monospace;
          letter-spacing: 0.5px;
        }

        .bp-auth-btns {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .bp-login-btn {
          height: 32px;
          padding: 0 20px;
          border-radius: 999px;
          background: #ffffff;
          color: #0f172a;
          border: 1px solid #cbd5e1;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.15s ease;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
        }

        .bp-login-btn:hover {
          background: #f8fafc;
          border-color: #d4af37;
          color: #000000;
        }

        .bp-demo-btn {
          height: 32px;
          padding: 0 14px;
          border-radius: 999px;
          background: rgba(212, 175, 55, 0.15);
          color: #d4af37;
          border: 1px solid rgba(212, 175, 55, 0.4);
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .bp-demo-btn:hover {
          background: rgba(212, 175, 55, 0.25);
          border-color: #d4af37;
        }

        .bp-user-info-box {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .bp-balance-pill {
          display: flex;
          align-items: center;
          gap: 6px;
          background: rgba(0, 0, 0, 0.35);
          border: 1px solid rgba(212, 175, 55, 0.35);
          padding: 4px 12px;
          border-radius: 999px;
          cursor: pointer;
          transition: border-color 0.15s ease;
        }

        .bp-balance-pill:hover {
          border-color: #d4af37;
        }

        .bp-bal-label {
          font-size: 11px;
          color: #94a3b8;
          font-weight: 600;
        }

        .bp-bal-amount {
          font-size: 13px;
          color: #facc15;
          font-weight: 800;
          font-family: 'IBM Plex Mono', monospace;
        }

        .bp-refresh-btn {
          background: transparent;
          border: none;
          color: #94a3b8;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2px;
          cursor: pointer;
          transition: color 0.15s ease;
        }

        .bp-refresh-btn:hover {
          color: #ffffff;
        }

        .bp-refresh-btn.spin svg {
          animation: bpSpin 0.5s linear infinite;
        }

        @keyframes bpSpin {
          100% { transform: rotate(360deg); }
        }

        .bp-user-actions {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .bp-action-btn {
          height: 30px;
          padding: 0 12px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          border: none;
          transition: all 0.15s ease;
        }

        .bp-action-btn.deposit {
          background: #16a34a;
          color: #ffffff;
        }
        .bp-action-btn.deposit:hover {
          background: #15803d;
        }

        .bp-action-btn.withdraw {
          background: #334155;
          color: #e2e8f0;
          border: 1px solid #475569;
        }
        .bp-action-btn.withdraw:hover {
          background: #475569;
          color: #ffffff;
        }

        .bp-logout-btn {
          background: transparent;
          border: none;
          color: #94a3b8;
          cursor: pointer;
          padding: 6px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.15s ease;
        }

        .bp-logout-btn:hover {
          color: #f87171;
          background: rgba(239, 68, 68, 0.1);
        }

        @media (max-width: 900px) {
          .bp-clock-box {
            display: none;
          }
          .bp-navbar-center {
            max-width: 280px;
          }
        }

        @media (max-width: 640px) {
          .bp-navbar-inner {
            padding: 0 10px;
            gap: 10px;
          }
          .bp-navbar-center {
            display: none;
          }
          .bp-bal-label {
            display: none;
          }
          .bp-balance-pill {
            padding: 4px 8px;
          }
          .bp-action-btn.withdraw {
            display: none;
          }
        }
      `}</style>
    </header>
  );
}

