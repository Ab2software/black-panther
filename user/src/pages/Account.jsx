import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  User,
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  ReceiptText,
  RotateCw,
  LogOut,
  ShieldCheck,
  Award,
  Sparkles,
  ExternalLink,
  Clock,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ChevronRight,
  LogIn,
  Dices,
  Trophy,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { fetchUserBets } from "../services/sportsService";
import { getTransactions } from "../services/walletService";

export default function Account({ onOpenAuth, onOpenDeposit, onOpenWithdraw }) {
  const { user, wallet, refreshWallet, isDemo, logout } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("overview"); // "overview" | "transactions" | "bets"
  const [bets, setBets] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user) {
      loadHistory();
    }
  }, [user]);

  const loadHistory = async () => {
    setLoadingHistory(true);
    try {
      const [betsData, txData] = await Promise.allSettled([
        fetchUserBets(),
        getTransactions(1, 20),
      ]);

      if (betsData.status === "fulfilled") {
        const val = betsData.value;
        const arr = Array.isArray(val) ? val : (Array.isArray(val?.data) ? val.data : []);
        setBets(arr);
      }
      if (txData.status === "fulfilled") {
        const val = txData.value;
        const arr = Array.isArray(val) ? val : (Array.isArray(val?.transactions) ? val.transactions : []);
        setTransactions(arr);
      }
    } catch (e) {
      console.warn("Failed to load user history:", e);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      if (refreshWallet) await refreshWallet();
      await loadHistory();
    } finally {
      setRefreshing(false);
    }
  };

  // Guest State
  if (!user) {
    return (
      <div className="shiva-account-wrapper">
        <div className="shiva-account-guest-card">
          <div className="guest-icon-box">
            <User size={30} />
          </div>

          <h2 className="guest-title">Sign In to View Account</h2>
          <p className="guest-subtitle">
            Manage your wallet, view bet history, make deposits & withdrawals, and access exclusive promotions.
          </p>

          <div className="guest-actions">
            <button
              type="button"
              className="guest-btn primary"
              onClick={() => onOpenAuth && onOpenAuth("login")}
            >
              <LogIn size={16} /> Player Login
            </button>

            <button
              type="button"
              className="guest-btn demo"
              onClick={() => onOpenAuth && onOpenAuth("demo")}
            >
              <Sparkles size={16} /> 1-Click Demo
            </button>
          </div>

          <div className="guest-footer">
            <span>Need Help?</span>
            <a
              href="https://wa.me/919876543210?text=Hello%20Support,%20I%20need%20help%20logging%20in"
              target="_blank"
              rel="noreferrer"
              className="guest-support-link"
            >
              Chat on WhatsApp (24x7)
            </a>
          </div>
        </div>

        <style>{`
          .shiva-account-wrapper {
            max-width: 520px;
            margin: 40px auto 80px;
            padding: 16px;
            width: 100%;
          }
          .shiva-account-guest-card {
            background: #ffffff;
            border-radius: 12px;
            border: 1px solid #cbd5e1;
            padding: 36px 24px;
            text-align: center;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
          }
          .guest-icon-box {
            width: 58px;
            height: 58px;
            border-radius: 50%;
            background: #fef08a;
            color: #8c4e09;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 16px;
          }
          .guest-title {
            margin: 0 0 8px 0;
            color: #0f172a;
            font-size: 20px;
            font-weight: 900;
          }
          .guest-subtitle {
            margin: 0 0 24px 0;
            color: #64748b;
            font-size: 13.5px;
            line-height: 1.5;
          }
          .guest-actions {
            display: flex;
            justify-content: center;
            gap: 12px;
            flex-wrap: wrap;
            margin-bottom: 24px;
          }
          .guest-btn {
            padding: 11px 22px;
            border-radius: 8px;
            font-weight: 800;
            font-size: 13.5px;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 8px;
            border: none;
            transition: transform 0.1s ease;
          }
          .guest-btn:active {
            transform: scale(0.97);
          }
          .guest-btn.primary {
            background: #8c4e09;
            color: #ffffff;
          }
          .guest-btn.demo {
            background: #fef08a;
            color: #713f12;
            border: 1.5px solid #ca8a04;
          }
          .guest-footer {
            border-top: 1px solid #f1f5f9;
            padding-top: 18px;
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 8px;
            font-size: 13px;
            color: #64748b;
          }
          .guest-support-link {
            color: #16a34a;
            font-weight: 800;
            text-decoration: none;
          }
          .guest-support-link:hover {
            text-decoration: underline;
          }
        `}</style>
      </div>
    );
  }

  // Logged-in State Calculations
  const currentBalance = wallet?.balance ?? (isDemo ? 10000 : 50000);
  const exposure = wallet?.exposure ?? 0;
  const availableBal = wallet?.availableBalance ?? (currentBalance - Math.abs(exposure));

  return (
    <div className="shiva-account-page">
      {/* ─── 1. User Profile Header Card ─── */}
      <div className="shiva-acc-card profile-banner">
        <div className="profile-top-row">
          <div className="user-avatar-wrap">
            <User size={28} className="user-icon" />
            <span className="online-dot" />
          </div>

          <div className="user-details-wrap">
            <div className="user-name-row">
              <h1 className="user-title">{user.username}</h1>
              {isDemo ? (
                <span className="demo-pill">DEMO ACCOUNT</span>
              ) : (
                <span className="verified-pill">
                  <ShieldCheck size={12} /> VERIFIED
                </span>
              )}
            </div>
            <div className="user-subtext">
              <span>Role: <strong>{user.role || "Player"}</strong></span>
              <span>•</span>
              <span>Currency: <strong>INR (₹)</strong></span>
            </div>
          </div>

          <button
            type="button"
            className="refresh-btn"
            onClick={handleRefresh}
            title="Refresh Balance"
          >
            <RotateCw size={16} className={refreshing ? "spin" : ""} />
          </button>
        </div>

        {/* Balance Grid */}
        <div className="balance-grid">
          <div className="bal-box main-bal">
            <span className="bal-label">MAIN BALANCE</span>
            <span className="bal-val">₹{currentBalance.toLocaleString()}</span>
          </div>

          <div className="bal-box exp-bal">
            <span className="bal-label">EXPOSURE</span>
            <span className="bal-val exposure">₹{Math.abs(exposure).toLocaleString()}</span>
          </div>

          <div className="bal-box avail-bal">
            <span className="bal-label">AVAILABLE PTS</span>
            <span className="bal-val avail">₹{availableBal.toLocaleString()}</span>
          </div>
        </div>

        {/* Deposit / Withdraw Action Buttons */}
        <div className="wallet-actions-row">
          <button
            type="button"
            className="wallet-action-btn deposit"
            onClick={() => onOpenDeposit && onOpenDeposit()}
          >
            <ArrowDownLeft size={16} /> + Deposit
          </button>

          <button
            type="button"
            className="wallet-action-btn withdraw"
            onClick={() => onOpenWithdraw && onOpenWithdraw()}
          >
            <ArrowUpRight size={16} /> Withdraw
          </button>
        </div>
      </div>

      {/* ─── 2. Quick Links Grid ─── */}
      <div className="shiva-acc-card nav-grid-card">
        <h3 className="section-title">Quick Services</h3>
        <div className="quick-links-grid">
          <Link to="/my-bets" className="quick-link-item">
            <div className="icon-wrap bets">
              <ReceiptText size={20} />
            </div>
            <div className="link-text">
              <span className="link-title">My Bets</span>
              <span className="link-desc">View Open & Settled Bets</span>
            </div>
            <ChevronRight size={16} className="arrow-icon" />
          </Link>

          <Link to="/sports" className="quick-link-item">
            <div className="icon-wrap sports">
              <Trophy size={20} />
            </div>
            <div className="link-text">
              <span className="link-title">Live Sports</span>
              <span className="link-desc">Cricket, Football, Tennis Odds</span>
            </div>
            <ChevronRight size={16} className="arrow-icon" />
          </Link>

          <Link to="/casino" className="quick-link-item">
            <div className="icon-wrap casino">
              <Dices size={20} />
            </div>
            <div className="link-text">
              <span className="link-title">Live Casino</span>
              <span className="link-desc">Roulette, Teen Patti, Slots</span>
            </div>
            <ChevronRight size={16} className="arrow-icon" />
          </Link>

          <a
            href="https://wa.me/919876543210?text=Hello%20Customer%20Support,%20I%20need%20assistance"
            target="_blank"
            rel="noreferrer"
            className="quick-link-item"
          >
            <div className="icon-wrap support">
              <HelpCircle size={20} />
            </div>
            <div className="link-text">
              <span className="link-title">24x7 WhatsApp Help</span>
              <span className="link-desc">Instant deposit & withdrawal help</span>
            </div>
            <ExternalLink size={15} className="arrow-icon" />
          </a>
        </div>
      </div>

      {/* ─── 3. History Tabs (Recent Bets & Transactions) ─── */}
      <div className="shiva-acc-card history-card">
        <div className="history-tabs-header">
          <button
            type="button"
            className={`tab-btn ${activeTab === "overview" ? "active" : ""}`}
            onClick={() => setActiveTab("overview")}
          >
            Recent Activity
          </button>
          <button
            type="button"
            className={`tab-btn ${activeTab === "transactions" ? "active" : ""}`}
            onClick={() => setActiveTab("transactions")}
          >
            Transactions ({transactions.length})
          </button>
          <button
            type="button"
            className={`tab-btn ${activeTab === "bets" ? "active" : ""}`}
            onClick={() => setActiveTab("bets")}
          >
            Bets ({bets.length})
          </button>
        </div>

        <div className="history-tab-content">
          {loadingHistory ? (
            <div className="loading-state">Loading history...</div>
          ) : activeTab === "transactions" ? (
            transactions.length === 0 ? (
              <div className="empty-box">
                <Clock size={32} />
                <p>No transactions found</p>
              </div>
            ) : (
              <div className="tx-list">
                {transactions.map((tx, idx) => (
                  <div key={tx._id || idx} className="tx-row">
                    <div className="tx-left">
                      <div className={`tx-icon ${tx.type === "deposit" ? "deposit" : "withdraw"}`}>
                        {tx.type === "deposit" ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                      </div>
                      <div className="tx-info">
                        <span className="tx-name">{tx.type === "deposit" ? "Deposit" : "Withdrawal"}</span>
                        <span className="tx-date">{new Date(tx.createdAt || Date.now()).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="tx-right">
                      <span className={`tx-amount ${tx.type === "deposit" ? "green" : "red"}`}>
                        {tx.type === "deposit" ? "+" : "-"}₹{tx.amount?.toLocaleString()}
                      </span>
                      <span className="tx-status">{tx.status || "APPROVED"}</span>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            /* Recent Bets list or Quick Overview */
            bets.length === 0 ? (
              <div className="empty-box">
                <ReceiptText size={32} />
                <p>No recent bets recorded yet</p>
                <Link to="/sports" className="place-bet-link">Start Betting</Link>
              </div>
            ) : (
              <div className="bets-preview-list">
                {bets.slice(0, 5).map((b, idx) => {
                  const isBack = String(b.side || b.type || "back").toLowerCase() === "back";
                  return (
                    <div key={b._id || idx} className={`bet-item-row ${isBack ? "back" : "lay"}`}>
                      <div className="bet-desc">
                        <span className={`badge ${isBack ? "back" : "lay"}`}>
                          {isBack ? "BACK" : "LAY"}
                        </span>
                        <strong>{b.selectionName || b.sectionTeam || "Selection"}</strong>
                        <span className="match-title">{b.matchName || "Live Match"}</span>
                      </div>
                      <div className="bet-amount">
                        <span className="stake">₹{b.stake?.toLocaleString()}</span>
                        <span className="odds">Odds: {b.price || b.rate || "1.98"}</span>
                      </div>
                    </div>
                  );
                })}
                {bets.length > 5 && (
                  <div className="view-more-row">
                    <Link to="/my-bets" className="view-more-link">
                      View All {bets.length} Bets →
                    </Link>
                  </div>
                )}
              </div>
            )
          )}
        </div>
      </div>

      {/* ─── 4. Sign Out Button ─── */}
      <div className="signout-section">
        <button
          type="button"
          className="signout-btn"
          onClick={() => {
            if (logout) logout();
            navigate("/");
          }}
        >
          <LogOut size={16} /> Sign Out of {user.username}
        </button>
      </div>

      <style>{`
        .shiva-account-page {
          max-width: 900px;
          margin: 0 auto;
          padding: 8px 10px 80px;
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .shiva-acc-card {
          background: #ffffff;
          border-radius: 10px;
          border: 1px solid #cbd5e1;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
          overflow: hidden;
        }

        /* ── Profile Banner ── */
        .profile-banner {
          padding: 16px;
          background: #ffffff;
        }

        .profile-top-row {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
        }

        .user-avatar-wrap {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: #8c4e09;
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          flex-shrink: 0;
        }

        .online-dot {
          position: absolute;
          bottom: 2px;
          right: 2px;
          width: 11px;
          height: 11px;
          border-radius: 50%;
          background: #22c55e;
          border: 2px solid #ffffff;
        }

        .user-details-wrap {
          flex: 1;
          min-width: 0;
        }

        .user-name-row {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .user-title {
          margin: 0;
          font-size: 19px;
          font-weight: 900;
          color: #0f172a;
          letter-spacing: -0.2px;
        }

        .demo-pill {
          background: #fef08a;
          color: #713f12;
          border: 1px solid #ca8a04;
          font-size: 10px;
          font-weight: 900;
          padding: 2px 7px;
          border-radius: 4px;
        }

        .verified-pill {
          background: #dcfce7;
          color: #15803d;
          border: 1px solid #86efac;
          font-size: 10px;
          font-weight: 800;
          padding: 2px 7px;
          border-radius: 4px;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .user-subtext {
          font-size: 12px;
          color: #64748b;
          display: flex;
          align-items: center;
          gap: 6px;
          margin-top: 2px;
        }

        .user-subtext strong {
          color: #1e293b;
        }

        .refresh-btn {
          width: 36px;
          height: 36px;
          border-radius: 8px;
          border: 1px solid #cbd5e1;
          background: #f8fafc;
          color: #475569;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .refresh-btn:hover {
          background: #e2e8f0;
          color: #0f172a;
        }

        .spin {
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        /* Balance Grid */
        .balance-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
          gap: 8px;
          margin-bottom: 14px;
        }

        .bal-box {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 10px 12px;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .bal-label {
          font-size: 10px;
          font-weight: 800;
          color: #64748b;
          letter-spacing: 0.3px;
        }

        .bal-val {
          font-size: 16px;
          font-weight: 900;
          color: #0f172a;
          font-family: 'IBM Plex Mono', monospace;
        }

        .bal-val.exposure {
          color: #dc2626;
        }

        .bal-val.avail {
          color: #15803d;
        }

        .wallet-actions-row {
          display: flex;
          gap: 10px;
        }

        .wallet-action-btn {
          flex: 1;
          height: 40px;
          border-radius: 7px;
          font-size: 13.5px;
          font-weight: 900;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          border: none;
          cursor: pointer;
          transition: transform 0.1s ease;
        }

        .wallet-action-btn:active {
          transform: scale(0.98);
        }

        .wallet-action-btn.deposit {
          background: #16a34a;
          color: #ffffff;
        }

        .wallet-action-btn.withdraw {
          background: #334155;
          color: #ffffff;
        }

        /* ── Quick Links ── */
        .nav-grid-card {
          padding: 14px;
        }

        .section-title {
          margin: 0 0 10px 0;
          font-size: 14px;
          font-weight: 900;
          color: #0f172a;
          letter-spacing: -0.2px;
        }

        .quick-links-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 8px;
        }

        .quick-link-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
          background: #f8fafc;
          text-decoration: none;
          transition: all 0.12s ease;
        }

        .quick-link-item:hover {
          background: #f1f5f9;
          border-color: #cbd5e1;
        }

        .icon-wrap {
          width: 38px;
          height: 38px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .icon-wrap.bets {
          background: #fef3c7;
          color: #92400e;
        }

        .icon-wrap.sports {
          background: #dbeafe;
          color: #1d4ed8;
        }

        .icon-wrap.casino {
          background: #fce7f3;
          color: #be185d;
        }

        .icon-wrap.support {
          background: #dcfce7;
          color: #15803d;
        }

        .link-text {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 1px;
        }

        .link-title {
          font-size: 13px;
          font-weight: 800;
          color: #0f172a;
        }

        .link-desc {
          font-size: 11px;
          color: #64748b;
        }

        .arrow-icon {
          color: #94a3b8;
        }

        /* ── History Card ── */
        .history-card {
          padding: 0;
        }

        .history-tabs-header {
          display: flex;
          border-bottom: 1px solid #e2e8f0;
          background: #f8fafc;
        }

        .tab-btn {
          flex: 1;
          padding: 11px 12px;
          background: none;
          border: none;
          border-bottom: 2px solid transparent;
          font-size: 12.5px;
          font-weight: 700;
          color: #64748b;
          cursor: pointer;
          transition: all 0.12s ease;
        }

        .tab-btn.active {
          color: #8c4e09;
          border-bottom-color: #8c4e09;
          background: #ffffff;
          font-weight: 900;
        }

        .history-tab-content {
          padding: 14px;
        }

        .loading-state {
          text-align: center;
          padding: 24px;
          color: #64748b;
          font-size: 13px;
        }

        .empty-box {
          text-align: center;
          padding: 28px 12px;
          color: #94a3b8;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
        }

        .empty-box p {
          margin: 0;
          font-size: 13px;
          font-weight: 700;
          color: #64748b;
        }

        .place-bet-link {
          margin-top: 4px;
          background: #8c4e09;
          color: #ffffff;
          padding: 6px 14px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 800;
          text-decoration: none;
        }

        .tx-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .tx-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 10px;
          border-radius: 6px;
          border: 1px solid #f1f5f9;
          background: #f8fafc;
        }

        .tx-left {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .tx-icon {
          width: 30px;
          height: 30px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .tx-icon.deposit {
          background: #dcfce7;
          color: #16a34a;
        }

        .tx-icon.withdraw {
          background: #fee2e2;
          color: #dc2626;
        }

        .tx-info {
          display: flex;
          flex-direction: column;
        }

        .tx-name {
          font-size: 12.5px;
          font-weight: 800;
          color: #0f172a;
        }

        .tx-date {
          font-size: 10.5px;
          color: #64748b;
        }

        .tx-right {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
        }

        .tx-amount {
          font-size: 13.5px;
          font-weight: 900;
          font-family: 'IBM Plex Mono', monospace;
        }

        .tx-amount.green {
          color: #16a34a;
        }

        .tx-amount.red {
          color: #dc2626;
        }

        .tx-status {
          font-size: 10px;
          font-weight: 800;
          color: #64748b;
          text-transform: uppercase;
        }

        .bets-preview-list {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .bet-item-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 10px;
          border-radius: 6px;
          border: 1px solid #e2e8f0;
          background: #ffffff;
        }

        .bet-item-row.back {
          border-left: 4px solid #2563eb;
        }

        .bet-item-row.lay {
          border-left: 4px solid #db2777;
        }

        .bet-desc {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12.5px;
          color: #0f172a;
        }

        .match-title {
          font-size: 11px;
          color: #64748b;
          font-weight: normal;
        }

        .badge {
          font-size: 9.5px;
          font-weight: 900;
          padding: 1px 5px;
          border-radius: 3px;
        }

        .badge.back {
          background: #dbeafe;
          color: #1e40af;
        }

        .badge.lay {
          background: #fce7f3;
          color: #9d174d;
        }

        .bet-amount {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
        }

        .stake {
          font-size: 13px;
          font-weight: 800;
          color: #0f172a;
          font-family: 'IBM Plex Mono', monospace;
        }

        .odds {
          font-size: 10.5px;
          color: #64748b;
        }

        .view-more-row {
          text-align: center;
          padding-top: 8px;
        }

        .view-more-link {
          font-size: 12px;
          font-weight: 800;
          color: #8c4e09;
          text-decoration: none;
        }

        .view-more-link:hover {
          text-decoration: underline;
        }

        /* ── Sign Out ── */
        .signout-section {
          text-align: center;
          padding: 8px 0;
        }

        .signout-btn {
          background: #fee2e2;
          color: #dc2626;
          border: 1px solid #fca5a5;
          padding: 10px 20px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 800;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          transition: background 0.12s ease;
        }

        .signout-btn:hover {
          background: #fecaca;
        }
      `}</style>
    </div>
  );
}

