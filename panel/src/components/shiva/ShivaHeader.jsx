import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FileText,
  User,
  LogOut,
  Wallet,
  Menu,
  X,
  Search,
  ShieldCheck,
  RefreshCw,
  CreditCard,
  ReceiptText,
  ChevronDown,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export const SUBNAV_TABS = [
  { id: "home", label: "HOME", path: "/" },
  { id: "cricket", label: "CRICKET", path: "/sports/cricket" },
  { id: "football", label: "FOOTBALL", path: "/sports/football" },
  { id: "tennis", label: "TENNIS", path: "/sports/tennis" },
  { id: "fantasy11", label: "FANTASY 11", active: true },
  { id: "cockfight", label: "COCK FIGHT" },
  { id: "casino", label: "CASINO", path: "/casino" },
  { id: "sportsbook", label: "SPORTS BOOK", path: "/sports" },
  { id: "horseracing", label: "HORSE RACING" },
  { id: "greyhound", label: "GREYHOUND RACING" },
  { id: "other", label: "OTHER" },
  { id: "binary", label: "BINARY" },
  { id: "kabaddi", label: "KABADDI" },
  { id: "politics", label: "POLITICS" },
  { id: "basketball", label: "BASKETBALL" },
];

export const RACING_CHIPS = [
  { id: "towcester", name: "Towcester 23rd Nov", time: "23/11/2026 05:30", type: "dog" },
  { id: "yarmouth", name: "Yarmouth 23rd Nov", time: "23/11/2026 05:30", type: "dog" },
  { id: "centralpark", name: "Central Park 23rd Nov", time: "23/11/2026 05:30", type: "dog" },
  { id: "dunstall", name: "Dunstall Park 23rd Nov", time: "23/11/2026 05:30", type: "horse" },
  { id: "nottingham", name: "Nottingham 23rd Nov", time: "23/11/2026 05:30", type: "dog" },
  { id: "monmore", name: "Monmore 23rd Nov", time: "23/11/2026 05:30", type: "dog" },
  { id: "romford", name: "Romford 23rd Nov", time: "23/11/2026 05:30", type: "dog" },
  { id: "ballina", name: "Ballina 23rd Nov", time: "23/11/2026 05:30", type: "horse" },
];

export default function ShivaHeader({
  onMenuToggle,
  onOpenAuth,
  onOpenDeposit,
  onOpenWithdraw,
  onOpenAccount,
  activeSubnav = "FANTASY 11",
  onSelectSubnav,
}) {
  const navigate = useNavigate();
  const auth = useAuth() || {};
  const user = auth.user;
  const logout = auth.logout || auth.handleLogout;
  const demoLogin = auth.demoLogin || auth.handleDemoLogin;
  const refreshWallet = auth.refreshWallet;

  const [refreshing, setRefreshing] = useState(false);
  const [rulesOpen, setRulesOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const balance =
    auth.wallet?.balance ??
    user?.balance ??
    (auth.isDemo || user?.isDemoUser ? 10000 : 50000);
  const exposure = auth.wallet?.exposure ?? user?.exposure ?? 0;

  const handleRefresh = async (e) => {
    e?.stopPropagation();
    setRefreshing(true);
    if (refreshWallet) await refreshWallet();
    setTimeout(() => setRefreshing(false), 500);
  };

  const handleTabClick = (tab) => {
    if (onSelectSubnav) onSelectSubnav(tab.label);
    if (tab.path) navigate(tab.path);
  };

  const handleSearchSubmit = (e) => {
    e?.preventDefault();
    if (searchQuery.trim().length >= 2) {
      navigate(`/sports?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
    }
  };

  return (
    <div className="shiva-header-wrapper">
      {/* ─── 1. TOP BROWN BAR ─── */}
      <header className="shiva-top-bar">
        <div className="shiva-top-inner">
          {/* Left: Menu Hamburger + Logo */}
          <div className="shiva-left">
            <button
              type="button"
              className="shiva-menu-btn"
              onClick={onMenuToggle}
              title="Toggle Sports Menu"
              aria-label="Toggle Menu"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <rect x="3" y="3" width="7" height="7" rx="1.5" />
                <rect x="14" y="3" width="7" height="7" rx="1.5" />
                <rect x="3" y="14" width="7" height="7" rx="1.5" />
                <rect x="14" y="14" width="7" height="7" rx="1.5" />
              </svg>
            </button>

            {/* Logo: Panther365 */}
            <div className="shiva-logo" onClick={() => navigate("/")} title="Black Panther 365 Home">
              <span className="shiva-logo-text white">PAN</span>
              <span className="shiva-logo-bolt">⚡</span>
              <span className="shiva-logo-text white">THER</span>
              <span className="shiva-logo-text yellow">365</span>
            </div>
          </div>

          {/* Center Search Input (Visible on Desktop >= 992px) */}
          <div className="shiva-center-search hide-mobile">
            <form onSubmit={handleSearchSubmit} className="shiva-desk-search-form">
              <Search size={14} className="shiva-desk-search-icon" />
              <input
                type="text"
                placeholder="Search Events (At least 3 letters)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  type="button"
                  className="shiva-desk-search-clear"
                  onClick={() => setSearchQuery("")}
                >
                  ✕
                </button>
              )}
            </form>
          </div>

          {/* Right: Search Toggle + Rules + Auth / Logged Group */}
          <div className="shiva-right">
            {/* Search Toggle Icon Button */}
            <button
              type="button"
              className={`shiva-icon-btn ${searchOpen ? "active" : ""}`}
              onClick={() => setSearchOpen((prev) => !prev)}
              title="Search Events"
              aria-label="Search"
            >
              <Search size={14} />
            </button>

            {/* Rules Button */}
            <button
              type="button"
              className="shiva-rules-link"
              onClick={() => setRulesOpen(true)}
              title="Exchange Rules & Payouts"
            >
              <FileText size={13} />
              <span className="rules-text">Rules</span>
            </button>

            {/* Guest State: Signup, Login, Demo */}
            {!user ? (
              <div className="shiva-auth-group">
                <button
                  type="button"
                  className="shiva-btn demo"
                  onClick={() => demoLogin && demoLogin()}
                  title="Demo ₹10,000"
                >
                  Demo
                </button>

                <button
                  type="button"
                  className="shiva-btn login"
                  onClick={() => onOpenAuth && onOpenAuth("login")}
                >
                  Login
                </button>

                <button
                  type="button"
                  className="shiva-btn signup"
                  onClick={() => onOpenAuth && onOpenAuth("register")}
                >
                  Signup
                </button>
              </div>
            ) : (
              /* Logged In State */
              <div className="shiva-logged-group">
                {/* Desktop Balance Card (Hidden on mobile because Mobile Wallet Bar takes over) */}
                <div
                  className="shiva-bal-card desk-only"
                  onClick={onOpenAccount}
                  title="Click to view Account & Statement"
                >
                  <div className="shiva-bal-row">
                    <span className="shiva-bal-lbl">PTS:</span>
                    <span className="shiva-bal-val">
                      ₹{Number(balance).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    <button
                      type="button"
                      className={`shiva-ref-btn ${refreshing ? "spin" : ""}`}
                      onClick={handleRefresh}
                      title="Refresh Balance"
                    >
                      <RefreshCw size={10} />
                    </button>
                  </div>

                  <div className="shiva-exp-row hide-mobile">
                    <span>Exp: <b>₹{Number(exposure).toFixed(2)}</b></span>
                    <span className="shiva-user-tag">{user?.username || "user"}</span>
                  </div>
                </div>

                {/* Desktop Deposit Button */}
                <button
                  type="button"
                  className="shiva-quick-act dep desk-only"
                  onClick={onOpenDeposit}
                  title="Deposit Funds"
                >
                  Deposit
                </button>

                {/* Desktop Withdraw Button */}
                <button
                  type="button"
                  className="shiva-quick-act with desk-only"
                  onClick={onOpenWithdraw}
                  title="Withdraw Funds"
                >
                  Withdraw
                </button>

                {/* User Menu Avatar Button (Visible on mobile & desktop) */}
                <button
                  type="button"
                  className={`shiva-user-menu-btn ${userMenuOpen ? "active" : ""}`}
                  onClick={() => setUserMenuOpen((prev) => !prev)}
                  title="Account Menu"
                >
                  <User size={14} />
                  <span className="online-indicator" />
                </button>

                {/* Logout Button */}
                <button
                  type="button"
                  className="shiva-logout-btn"
                  onClick={logout}
                  title="Logout"
                >
                  <LogOut size={15} />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Expandable Mobile Search Row */}
        {searchOpen && (
          <div className="shiva-expand-search-row">
            <form onSubmit={handleSearchSubmit} className="shiva-expand-search-form">
              <Search size={14} className="shiva-expand-search-icon" />
              <input
                type="text"
                placeholder="Search Teams, Tournaments or Matches..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />
              {searchQuery && (
                <button
                  type="button"
                  className="shiva-expand-clear-btn"
                  onClick={() => setSearchQuery("")}
                >
                  ✕
                </button>
              )}
              <button type="submit" className="shiva-expand-submit-btn">
                Search
              </button>
              <button
                type="button"
                className="shiva-expand-close-btn"
                onClick={() => setSearchOpen(false)}
              >
                ✕
              </button>
            </form>
          </div>
        )}
      </header>

      {/* ─── 2. MOBILE WALLET & ACTIONS BAR (Visible on mobile <= 768px when logged in) ─── */}
      {user && (
        <div className="shiva-mobile-wallet-bar">
          <div
            className="shiva-mob-wallet-left"
            onClick={onOpenAccount}
            title="Click to view Account & Statement"
          >
            <div className="shiva-mob-pts-row">
              <span className="shiva-mob-pts-lbl">PTS:</span>
              <span className="shiva-mob-pts-val">
                ₹{Number(balance).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <button
                type="button"
                className={`shiva-ref-btn ${refreshing ? "spin" : ""}`}
                onClick={handleRefresh}
                title="Refresh Balance"
              >
                <RefreshCw size={11} />
              </button>
            </div>
            <div className="shiva-mob-exp-row">
              <span>Exp: <b>₹{Number(exposure).toFixed(2)}</b></span>
            </div>
          </div>

          <div className="shiva-mob-wallet-right">
            <button
              type="button"
              className="shiva-mob-act-btn dep"
              onClick={onOpenDeposit}
              title="Deposit Funds"
            >
              + Deposit
            </button>

            <button
              type="button"
              className="shiva-mob-act-btn with"
              onClick={onOpenWithdraw}
              title="Withdraw Funds"
            >
              Withdraw
            </button>
          </div>
        </div>
      )}

      {/* ─── 3. SUBNAV DARK EMERALD GREEN STRIP ─── */}
      <nav className="shiva-subnav-strip">
        <div className="shiva-subnav-inner">
          {SUBNAV_TABS.map((tab) => {
            const isTabActive =
              activeSubnav === tab.label ||
              (tab.label === "FANTASY 11" && !activeSubnav);

            return (
              <button
                key={tab.id}
                type="button"
                className={`shiva-subnav-item ${isTabActive ? "active" : ""}`}
                onClick={() => handleTabClick(tab)}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </nav>

      {/* ─── 4. RACING CHIPS TICKER ─── */}
      <div className="shiva-ticker-row">
        <div className="shiva-ticker-inner">
          {RACING_CHIPS.map((chip) => (
            <div key={chip.id} className="shiva-race-chip">
              <span className="shiva-race-icon">{chip.type === "dog" ? "🐕" : "🐎"}</span>
              <div className="shiva-race-details">
                <span className="shiva-race-name">{chip.name}</span>
                <span className="shiva-race-time">{chip.time}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── 5. USER QUICK MOBILE POPOVER MENU ─── */}
      {userMenuOpen && user && (
        <>
          <div
            className="shiva-user-menu-backdrop"
            onClick={() => setUserMenuOpen(false)}
          />
          <div className="shiva-user-menu-popover">
            <div className="shiva-popover-header">
              <div className="shiva-popover-avatar">
                <User size={16} />
              </div>
              <div className="shiva-popover-meta">
                <span className="shiva-popover-username">
                  {user?.username || "Player"}
                </span>
                <span className="shiva-popover-status">● Verified Account</span>
              </div>
              <button
                type="button"
                className="shiva-popover-close"
                onClick={() => setUserMenuOpen(false)}
              >
                ✕
              </button>
            </div>

            <div className="shiva-popover-stats">
              <div className="shiva-popover-stat-card">
                <span className="popover-stat-lbl">Wallet Balance</span>
                <span className="popover-stat-val bal">
                  ₹{Number(balance).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="shiva-popover-stat-card">
                <span className="popover-stat-lbl">Net Exposure</span>
                <span className="popover-stat-val exp">
                  ₹{Number(exposure).toFixed(2)}
                </span>
              </div>
            </div>

            <div className="shiva-popover-quick-btns">
              <button
                type="button"
                className="popover-act dep"
                onClick={() => {
                  setUserMenuOpen(false);
                  if (onOpenDeposit) onOpenDeposit();
                }}
              >
                <Wallet size={14} /> Deposit
              </button>
              <button
                type="button"
                className="popover-act with"
                onClick={() => {
                  setUserMenuOpen(false);
                  if (onOpenWithdraw) onOpenWithdraw();
                }}
              >
                <CreditCard size={14} /> Withdraw
              </button>
            </div>

            <div className="shiva-popover-links">
              <button
                type="button"
                className="popover-link-item"
                onClick={() => {
                  setUserMenuOpen(false);
                  if (onOpenAccount) onOpenAccount();
                }}
              >
                <User size={14} /> Profile & Settings
              </button>
              <button
                type="button"
                className="popover-link-item"
                onClick={() => {
                  setUserMenuOpen(false);
                  navigate("/my-bets");
                }}
              >
                <ReceiptText size={14} /> My Open & Settled Bets
              </button>
              <button
                type="button"
                className="popover-link-item"
                onClick={() => {
                  setUserMenuOpen(false);
                  setRulesOpen(true);
                }}
              >
                <FileText size={14} /> Exchange Rules & Limits
              </button>
            </div>

            <div className="shiva-popover-footer">
              <button
                type="button"
                className="popover-logout-btn"
                onClick={() => {
                  setUserMenuOpen(false);
                  if (logout) logout();
                }}
              >
                <LogOut size={14} /> Logout Account
              </button>
            </div>
          </div>
        </>
      )}

      {/* ─── 6. IN-APP RULES MODAL ─── */}
      {rulesOpen && (
        <div
          className="shiva-rules-modal-overlay"
          onClick={() => setRulesOpen(false)}
        >
          <div
            className="shiva-rules-modal-box"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="shiva-rules-modal-header">
              <div className="shiva-rules-modal-title">
                <FileText size={16} />
                <span>Panther 365 Exchange Rules & Payout Policy</span>
              </div>
              <button
                type="button"
                className="shiva-rules-modal-close"
                onClick={() => setRulesOpen(false)}
              >
                ✕
              </button>
            </div>

            <div className="shiva-rules-modal-body">
              <div className="rule-section">
                <h4>1. General Betting Guidelines</h4>
                <p>
                  Minimum bet stake across all sports is <strong>₹50</strong>.
                  Maximum single bet profit payout is <strong>₹50,00,000</strong>.
                  All bets matched are final and cannot be cancelled by user.
                </p>
              </div>

              <div className="rule-section">
                <h4>2. Back (Lagai) & Lay (Khai) Mechanism</h4>
                <p>
                  <strong>Back (Blue Odds):</strong> You win when your selected team wins. Profit = Stake × (Odds - 1).
                </p>
                <p>
                  <strong>Lay (Pink Odds):</strong> You act as bookmaker and win when the selected team loses. Liability = Stake × (Odds - 1).
                </p>
              </div>

              <div className="rule-section">
                <h4>3. In-Play Match Delay</h4>
                <p>
                  To maintain fair play, in-play bets undergo a live delay of 3 to 5 seconds before matching.
                </p>
              </div>

              <div className="rule-section">
                <h4>4. Session & Fancy Markets</h4>
                <p>
                  Fancy bets are settled strictly on official scorecard overs. If overs are curtailed due to rain, incomplete session bets will be voided.
                </p>
              </div>

              <div className="rule-section">
                <h4>5. Deposit & Withdrawal Guarantee</h4>
                <p>
                  24x7 instant UPI and bank transfers with 0% gateway fee. Verified withdrawals are approved within 15-30 minutes.
                </p>
              </div>
            </div>

            <div className="shiva-rules-modal-footer">
              <button
                type="button"
                className="shiva-rules-ack-btn"
                onClick={() => setRulesOpen(false)}
              >
                I Understand & Agree
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .shiva-header-wrapper {
          width: 100%;
          position: sticky;
          top: 0;
          z-index: 100;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
        }

        /* ── Top Bar ── */
        .shiva-top-bar {
          background: linear-gradient(90deg, #7c3f03 0%, #924b07 50%, #7c3f03 100%);
          border-bottom: 1px solid #6b3400;
          height: 48px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          position: relative;
        }

        .shiva-top-inner {
          max-width: 1440px;
          width: 100%;
          margin: 0 auto;
          padding: 0 12px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 6px;
        }

        .shiva-left {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;
        }

        .shiva-menu-btn {
          background: transparent;
          border: none;
          color: #ffffff;
          cursor: pointer;
          padding: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 4px;
          transition: background 0.12s ease;
        }

        .shiva-menu-btn:hover {
          background: rgba(255, 255, 255, 0.15);
        }

        /* Logo */
        .shiva-logo {
          display: flex;
          align-items: center;
          cursor: pointer;
          user-select: none;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          font-weight: 900;
          letter-spacing: -0.5px;
          font-size: 21px;
          line-height: 1;
        }

        .shiva-logo-text.white {
          color: #ffffff;
        }

        .shiva-logo-text.yellow {
          color: #facc15;
          margin-left: 2px;
        }

        .shiva-logo-bolt {
          color: #facc15;
          font-size: 19px;
          margin: 0 -1px;
          filter: drop-shadow(0 0 6px rgba(250, 204, 21, 0.8));
        }

        /* Desktop Center Search */
        .shiva-center-search {
          flex: 1;
          max-width: 320px;
          margin: 0 10px;
        }

        .shiva-desk-search-form {
          position: relative;
          display: flex;
          align-items: center;
          width: 100%;
        }

        .shiva-desk-search-icon {
          position: absolute;
          left: 10px;
          color: #94a3b8;
          pointer-events: none;
        }

        .shiva-desk-search-form input {
          width: 100%;
          height: 30px;
          padding: 0 28px 0 30px;
          background: rgba(0, 0, 0, 0.35);
          border: 1px solid rgba(255, 255, 255, 0.25);
          border-radius: 15px;
          color: #ffffff;
          font-size: 11.5px;
          outline: none;
          transition: all 0.15s ease;
        }

        .shiva-desk-search-form input:focus {
          background: rgba(0, 0, 0, 0.55);
          border-color: #facc15;
        }

        .shiva-desk-search-form input::placeholder {
          color: #cbd5e1;
        }

        .shiva-desk-search-clear {
          position: absolute;
          right: 8px;
          background: none;
          border: none;
          color: #94a3b8;
          font-size: 12px;
          cursor: pointer;
        }

        /* Right Group */
        .shiva-right {
          display: flex;
          align-items: center;
          gap: 6px;
          flex-shrink: 0;
        }

        .shiva-icon-btn {
          width: 28px;
          height: 28px;
          border-radius: 4px;
          background: rgba(255, 255, 255, 0.12);
          border: 1px solid rgba(255, 255, 255, 0.25);
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: background 0.12s ease;
        }

        .shiva-icon-btn:hover, .shiva-icon-btn.active {
          background: rgba(255, 255, 255, 0.25);
          color: #facc15;
        }

        .shiva-rules-link {
          background: rgba(255, 255, 255, 0.12);
          border: 1px solid rgba(255, 255, 255, 0.25);
          color: #ffffff;
          font-size: 11.5px;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 4px;
          height: 28px;
          padding: 0 8px;
          border-radius: 4px;
          transition: all 0.15s ease;
        }

        .shiva-rules-link:hover {
          color: #facc15;
          background: rgba(255, 255, 255, 0.22);
        }

        /* Auth Buttons */
        .shiva-auth-group {
          display: flex;
          align-items: center;
          gap: 5px;
        }

        .shiva-btn {
          height: 28px;
          padding: 0 12px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 800;
          cursor: pointer;
          transition: all 0.15s ease;
          border: 1px solid #ffffff;
          white-space: nowrap;
        }

        .shiva-btn.signup, .shiva-btn.login {
          background: #ffffff;
          color: #8c4e09;
        }

        .shiva-btn.signup:hover, .shiva-btn.login:hover {
          background: #fef08a;
          color: #713f12;
        }

        .shiva-btn.demo {
          background: rgba(250, 204, 21, 0.2);
          color: #facc15;
          border-color: #facc15;
        }

        /* Logged In Info */
        .shiva-logged-group {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .shiva-bal-card {
          background: rgba(0, 0, 0, 0.45);
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-radius: 4px;
          padding: 3px 8px;
          cursor: pointer;
          line-height: 1.2;
          transition: border-color 0.15s ease;
        }

        .shiva-bal-card:hover {
          border-color: #facc15;
        }

        .shiva-bal-row {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 12px;
        }

        .shiva-bal-lbl {
          color: #ffffff;
          font-weight: 800;
          font-size: 10px;
          letter-spacing: 0.3px;
        }

        .shiva-bal-val {
          color: #facc15;
          font-weight: 900;
          font-family: 'IBM Plex Mono', monospace;
        }

        .shiva-ref-btn {
          background: transparent;
          border: none;
          color: #cbd5e1;
          padding: 1px;
          cursor: pointer;
          display: flex;
        }

        .shiva-ref-btn.spin svg {
          animation: spin 0.5s linear infinite;
        }
        @keyframes spin { 100% { transform: rotate(360deg); } }

        .shiva-exp-row {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 10px;
          color: #e2e8f0;
          font-weight: 600;
        }

        .shiva-exp-row b {
          color: #fca5a5;
        }

        .shiva-user-tag {
          color: #facc15;
          font-weight: 800;
        }

        .shiva-quick-act {
          height: 28px;
          padding: 0 12px;
          border-radius: 4px;
          border: none;
          font-size: 11.5px;
          font-weight: 800;
          cursor: pointer;
          white-space: nowrap;
        }

        .shiva-quick-act.dep {
          background: #22c55e;
          color: #ffffff;
        }

        .shiva-quick-act.dep:hover {
          background: #16a34a;
        }

        .shiva-quick-act.with {
          background: #334155;
          color: #ffffff;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .shiva-quick-act.with:hover {
          background: #1e293b;
        }

        .shiva-user-menu-btn {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          border: 1.5px solid #ffffff;
          background: rgba(255, 255, 255, 0.15);
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          position: relative;
        }

        .shiva-user-menu-btn.active {
          border-color: #facc15;
          background: rgba(250, 204, 21, 0.25);
        }

        .online-indicator {
          position: absolute;
          bottom: -1px;
          right: -1px;
          width: 7px;
          height: 7px;
          background: #22c55e;
          border: 1.5px solid #8c4e09;
          border-radius: 50%;
        }

        .shiva-logout-btn {
          background: transparent;
          border: none;
          color: #fca5a5;
          padding: 4px;
          cursor: pointer;
          display: flex;
        }

        .shiva-logout-btn:hover {
          color: #ef4444;
        }

        /* ── Mobile Wallet Bar (Row 2 on mobile) ── */
        .shiva-mobile-wallet-bar {
          display: none;
        }

        @media (max-width: 768px) {
          .shiva-mobile-wallet-bar {
            display: flex;
            align-items: center;
            justify-content: space-between;
            background: linear-gradient(90deg, #622f01 0%, #7c3f03 100%);
            border-top: 1px solid rgba(255, 255, 255, 0.15);
            border-bottom: 1px solid #5a2800;
            padding: 6px 12px;
            min-height: 40px;
          }

          .shiva-mob-wallet-left {
            display: flex;
            flex-direction: column;
            justify-content: center;
            cursor: pointer;
            line-height: 1.2;
          }

          .shiva-mob-pts-row {
            display: flex;
            align-items: center;
            gap: 5px;
          }

          .shiva-mob-pts-lbl {
            font-size: 10px;
            font-weight: 800;
            color: #f1f5f9;
          }

          .shiva-mob-pts-val {
            font-size: 13.5px;
            font-weight: 900;
            color: #facc15;
            font-family: 'IBM Plex Mono', monospace;
          }

          .shiva-mob-exp-row {
            font-size: 9.5px;
            color: #fca5a5;
            font-weight: 600;
          }

          .shiva-mob-wallet-right {
            display: flex;
            align-items: center;
            gap: 8px;
          }

          .shiva-mob-act-btn {
            height: 29px;
            padding: 0 13px;
            border-radius: 4px;
            font-size: 11.5px;
            font-weight: 800;
            border: none;
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            white-space: nowrap;
            box-shadow: 0 1px 4px rgba(0, 0, 0, 0.25);
            transition: transform 0.1s ease;
          }

          .shiva-mob-act-btn:active {
            transform: scale(0.96);
          }

          .shiva-mob-act-btn.dep {
            background: #22c55e;
            color: #ffffff;
          }

          .shiva-mob-act-btn.dep:hover {
            background: #16a34a;
          }

          .shiva-mob-act-btn.with {
            background: #334155;
            color: #ffffff;
            border: 1px solid rgba(255, 255, 255, 0.25);
          }

          .shiva-mob-act-btn.with:hover {
            background: #1e293b;
          }
        }

        /* Expandable Mobile Search Row */
        .shiva-expand-search-row {
          background: #733f06;
          border-top: 1px solid rgba(255, 255, 255, 0.15);
          padding: 6px 12px;
          position: absolute;
          top: 48px;
          left: 0;
          right: 0;
          z-index: 105;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        }

        .shiva-expand-search-form {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .shiva-expand-search-icon {
          color: #facc15;
          flex-shrink: 0;
        }

        .shiva-expand-search-form input {
          flex: 1;
          height: 30px;
          padding: 0 10px;
          background: #ffffff;
          border: 1px solid #cbd5e1;
          border-radius: 4px;
          font-size: 12px;
          outline: none;
          color: #1e293b;
        }

        .shiva-expand-clear-btn {
          background: none;
          border: none;
          color: #64748b;
          font-size: 13px;
          cursor: pointer;
          padding: 0 4px;
        }

        .shiva-expand-submit-btn {
          height: 30px;
          padding: 0 12px;
          background: #facc15;
          color: #000000;
          font-weight: 800;
          font-size: 11.5px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }

        .shiva-expand-close-btn {
          height: 30px;
          padding: 0 8px;
          background: rgba(255, 255, 255, 0.15);
          color: #ffffff;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 13px;
        }

        /* ── Subnav Strip ── */
        .shiva-subnav-strip {
          background: #0b4c3e;
          border-bottom: 1px solid #07382d;
          height: 38px;
          display: flex;
          align-items: center;
        }

        .shiva-subnav-inner {
          max-width: 1440px;
          width: 100%;
          margin: 0 auto;
          padding: 0 6px;
          display: flex;
          align-items: center;
          gap: 2px;
          overflow-x: auto;
          white-space: nowrap;
          scrollbar-width: none;
          -webkit-overflow-scrolling: touch;
        }
        .shiva-subnav-inner::-webkit-scrollbar { display: none; }

        .shiva-subnav-item {
          background: transparent;
          border: none;
          color: #ffffff;
          font-size: 11.5px;
          font-weight: 800;
          padding: 5px 11px;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.12s ease;
          border-radius: 3px;
          letter-spacing: 0.2px;
          flex-shrink: 0;
        }

        .shiva-subnav-item:hover {
          background: rgba(255, 255, 255, 0.1);
          color: #facc15;
        }

        .shiva-subnav-item.active {
          background: #facc15;
          color: #000000;
          font-weight: 900;
        }

        /* ── Racing Ticker ── */
        .shiva-ticker-row {
          background: #083b30;
          border-bottom: 1px solid #062e26;
          padding: 4px 0;
        }

        .shiva-ticker-inner {
          max-width: 1440px;
          margin: 0 auto;
          padding: 0 8px;
          display: flex;
          align-items: center;
          gap: 6px;
          overflow-x: auto;
          scrollbar-width: none;
          -webkit-overflow-scrolling: touch;
        }
        .shiva-ticker-inner::-webkit-scrollbar { display: none; }

        .shiva-race-chip {
          flex: 0 0 auto;
          background: #0f5446;
          border: 1px solid #166b59;
          border-radius: 4px;
          padding: 3px 8px;
          display: flex;
          align-items: center;
          gap: 6px;
          cursor: pointer;
          transition: background 0.12s ease;
        }

        .shiva-race-chip:hover {
          background: #156d5b;
        }

        .shiva-race-icon {
          font-size: 12px;
        }

        .shiva-race-details {
          display: flex;
          flex-direction: column;
          line-height: 1.15;
        }

        .shiva-race-name {
          font-size: 10.5px;
          font-weight: 700;
          color: #ffffff;
        }

        .shiva-race-time {
          font-size: 9px;
          color: #86efac;
          font-family: 'IBM Plex Mono', monospace;
        }

        /* ── User Quick Popover Menu ── */
        .shiva-user-menu-backdrop {
          position: fixed;
          inset: 0;
          z-index: 199;
        }

        .shiva-user-menu-popover {
          position: absolute;
          top: 50px;
          right: 10px;
          width: 270px;
          background: #ffffff;
          border-radius: 8px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.35);
          border: 1px solid #cbd5e1;
          z-index: 200;
          overflow: hidden;
          animation: popIn 0.15s ease-out;
        }

        @keyframes popIn {
          from { opacity: 0; transform: translateY(-8px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        .shiva-popover-header {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px;
          background: #8c4e09;
          color: #ffffff;
        }

        .shiva-popover-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .shiva-popover-meta {
          flex: 1;
          line-height: 1.2;
        }

        .shiva-popover-username {
          font-size: 13px;
          font-weight: 800;
          display: block;
        }

        .shiva-popover-status {
          font-size: 10px;
          color: #86efac;
          font-weight: 600;
        }

        .shiva-popover-close {
          background: none;
          border: none;
          color: #ffffff;
          font-size: 14px;
          cursor: pointer;
        }

        .shiva-popover-stats {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          padding: 10px 12px;
          background: #f8fafc;
          border-bottom: 1px solid #e2e8f0;
        }

        .shiva-popover-stat-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 5px;
          padding: 6px 8px;
        }

        .popover-stat-lbl {
          font-size: 9.5px;
          color: #64748b;
          font-weight: 700;
          text-transform: uppercase;
          display: block;
        }

        .popover-stat-val {
          font-size: 12px;
          font-weight: 800;
          font-family: 'IBM Plex Mono', monospace;
        }

        .popover-stat-val.bal {
          color: #15803d;
        }

        .popover-stat-val.exp {
          color: #b91c1c;
        }

        .shiva-popover-quick-btns {
          display: flex;
          gap: 8px;
          padding: 10px 12px;
          border-bottom: 1px solid #f1f5f9;
        }

        .popover-act {
          flex: 1;
          height: 32px;
          border-radius: 4px;
          font-size: 11.5px;
          font-weight: 800;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 5px;
          cursor: pointer;
        }

        .popover-act.dep {
          background: #22c55e;
          color: #ffffff;
        }

        .popover-act.with {
          background: #334155;
          color: #ffffff;
        }

        .shiva-popover-links {
          display: flex;
          flex-direction: column;
          padding: 4px 0;
        }

        .popover-link-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 14px;
          font-size: 12px;
          font-weight: 700;
          color: #334155;
          background: none;
          border: none;
          text-align: left;
          cursor: pointer;
          transition: background 0.12s ease;
        }

        .popover-link-item:hover {
          background: #f1f5f9;
          color: #8c4e09;
        }

        .shiva-popover-footer {
          padding: 8px 12px;
          background: #f8fafc;
          border-top: 1px solid #e2e8f0;
        }

        .popover-logout-btn {
          width: 100%;
          height: 30px;
          background: #fee2e2;
          color: #b91c1c;
          border: 1px solid #fca5a5;
          border-radius: 4px;
          font-size: 11.5px;
          font-weight: 800;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          cursor: pointer;
        }

        /* ── Rules Modal ── */
        .shiva-rules-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(2px);
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
        }

        .shiva-rules-modal-box {
          background: #ffffff;
          border-radius: 8px;
          max-width: 500px;
          width: 100%;
          max-height: 85vh;
          display: flex;
          flex-direction: column;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
          overflow: hidden;
        }

        .shiva-rules-modal-header {
          background: #8c4e09;
          color: #ffffff;
          padding: 12px 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .shiva-rules-modal-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13.5px;
          font-weight: 800;
        }

        .shiva-rules-modal-close {
          background: none;
          border: none;
          color: #ffffff;
          font-size: 16px;
          cursor: pointer;
        }

        .shiva-rules-modal-body {
          padding: 16px;
          overflow-y: auto;
          font-size: 12.5px;
          color: #334155;
          line-height: 1.5;
        }

        .rule-section {
          margin-bottom: 12px;
          border-bottom: 1px solid #f1f5f9;
          padding-bottom: 8px;
        }

        .rule-section h4 {
          font-size: 13px;
          font-weight: 800;
          color: #8c4e09;
          margin-bottom: 4px;
        }

        .rule-section p {
          margin: 0;
          color: #475569;
        }

        .shiva-rules-modal-footer {
          padding: 10px 16px;
          background: #f8fafc;
          border-top: 1px solid #e2e8f0;
          display: flex;
          justify-content: flex-end;
        }

        .shiva-rules-ack-btn {
          background: #8c4e09;
          color: #ffffff;
          border: none;
          padding: 8px 18px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 800;
          cursor: pointer;
        }

        /* ── Responsive Visibility Helpers ── */
        .desk-only { display: inline-flex; }

        @media (max-width: 991px) {
          .hide-mobile { display: none !important; }
        }

        @media (max-width: 768px) {
          .desk-only { display: none !important; }

          .shiva-top-inner {
            padding: 0 8px;
            gap: 4px;
          }

          .shiva-left {
            gap: 4px;
          }

          .shiva-logo {
            font-size: 17px;
          }

          .shiva-logo-bolt {
            font-size: 15px;
          }

          .shiva-right {
            gap: 4px;
          }

          .shiva-icon-btn {
            width: 28px;
            height: 28px;
          }

          .shiva-rules-link {
            height: 28px;
            padding: 0 7px;
            font-size: 11px;
            gap: 3px;
          }

          .shiva-btn {
            height: 27px;
            padding: 0 8px;
            font-size: 11px;
          }

          .shiva-user-menu-btn {
            width: 28px;
            height: 28px;
          }

          .shiva-subnav-strip {
            height: 35px;
          }

          .shiva-subnav-item {
            font-size: 10.5px;
            padding: 4px 8px;
          }
        }

        @media (max-width: 380px) {
          .shiva-logo {
            font-size: 15px;
          }

          .rules-text {
            display: none;
          }

          .shiva-btn {
            padding: 0 6px;
            font-size: 10px;
          }
        }
      `}</style>
    </div>
  );
}
