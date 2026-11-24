import React, { useState, useEffect } from "react";
import { ReceiptText, Clock, Trophy, AlertCircle, ArrowUpRight, LogIn, Sparkles } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { fetchUserBets } from "../services/sportsService";

export default function MyBets({ onOpenAuth }) {
  const { user, isDemo } = useAuth();
  const [filter, setFilter] = useState("all");
  const [bets, setBets] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      loadBets();
    }
  }, [user]);

  const loadBets = async () => {
    setLoading(true);
    try {
      const data = await fetchUserBets();
      setBets(Array.isArray(data) ? data : []);
    } catch (e) {
      console.warn("Failed to fetch bets:", e);
      setBets([]);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="shiva-mybets-wrapper">
        <div className="shiva-mybets-guest-card">
          <div className="guest-icon-box">
            <ReceiptText size={26} />
          </div>

          <h2 className="guest-title">Sign In to View Bets</h2>
          <p className="guest-subtitle">
            Track open bets, live market P&L, settled history, and instant cashouts.
          </p>

          <div className="guest-actions">
            <button
              type="button"
              className="guest-btn primary"
              onClick={() => onOpenAuth && onOpenAuth("login")}
            >
              <LogIn size={15} /> Player Login
            </button>

            <button
              type="button"
              className="guest-btn demo"
              onClick={() => onOpenAuth && onOpenAuth("demo")}
            >
              <Sparkles size={15} /> 1-Click Demo
            </button>
          </div>
        </div>

        <style>{`
          .shiva-mybets-wrapper {
            max-width: 520px;
            margin: 40px auto 80px;
            padding: 16px;
          }
          .shiva-mybets-guest-card {
            background: #ffffff;
            border-radius: 12px;
            border: 1px solid #cbd5e1;
            padding: 32px 20px;
            text-align: center;
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
          }
          .guest-icon-box {
            width: 52px;
            height: 52px;
            border-radius: 50%;
            background: #fef08a;
            color: #8c4e09;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 14px;
          }
          .guest-title {
            margin: 0 0 6px 0;
            color: #0f172a;
            font-size: 19px;
            font-weight: 900;
          }
          .guest-subtitle {
            margin: 0 0 20px 0;
            color: #64748b;
            font-size: 13px;
            line-height: 1.5;
          }
          .guest-actions {
            display: flex;
            justify-content: center;
            gap: 10px;
            flex-wrap: wrap;
          }
          .guest-btn {
            padding: 9px 18px;
            border-radius: 6px;
            font-weight: 800;
            font-size: 13px;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 6px;
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
            border: 1px solid #ca8a04;
          }
        `}</style>
      </div>
    );
  }

  const safeBets = Array.isArray(bets) ? bets : [];

  const filtered = safeBets.filter((b) => {
    if (filter === "all") return true;
    if (filter === "open") return b.status === "OPEN" || !b.status;
    if (filter === "settled") return b.status === "SETTLED" || b.status === "WON" || b.status === "LOST";
    return true;
  });

  const totalStake = safeBets.reduce((acc, curr) => acc + (curr.stake || 0), 0);

  return (
    <div className="shiva-mybets-container">
      {/* ─── Header & Top Stats ─── */}
      <div className="shiva-mybets-header">
        <div className="shiva-mybets-title-group">
          <h1 className="shiva-mybets-title">My Bet History</h1>
          <span className="shiva-mybets-account">
            Account: <strong>{user.username}</strong> {isDemo && "(Demo Mode)"}
          </span>
        </div>

        {/* Aggregate Stats Cards */}
        <div className="shiva-mybets-stats">
          <div className="stat-card">
            <span className="stat-card-lbl">TOTAL STAKE</span>
            <span className="stat-card-val stake">₹{totalStake.toLocaleString()}</span>
          </div>

          <div className="stat-card">
            <span className="stat-card-lbl">TOTAL BETS</span>
            <span className="stat-card-val count">{safeBets.length}</span>
          </div>
        </div>
      </div>

      {/* ─── Filter Tabs (All, Open, Settled) ─── */}
      <div className="shiva-mybets-filter-tabs">
        {[
          { id: "all", label: `All (${safeBets.length})` },
          { id: "open", label: "Open Bets" },
          { id: "settled", label: "Settled" },
        ].map((tab) => {
          const isActive = filter === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              className={`shiva-tab-btn ${isActive ? "active" : ""}`}
              onClick={() => setFilter(tab.id)}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ─── Bets Content Area ─── */}
      {loading ? (
        <div className="shiva-mybets-loading">Loading bets...</div>
      ) : filtered.length === 0 ? (
        /* Empty State */
        <div className="shiva-mybets-empty-card">
          <Clock size={36} className="empty-clock-icon" />
          <h3 className="empty-title">No Bets In This Category</h3>
          <p className="empty-subtitle">Tap any live sports odds to place your first bet.</p>
        </div>
      ) : (
        /* Bets List */
        <div className="shiva-bets-list">
          {filtered.map((bet, idx) => {
            const isBack = String(bet.side || bet.type || "back").toLowerCase() === "back";
            return (
              <div
                key={bet._id || idx}
                className={`shiva-bet-row-card ${isBack ? "back-card" : "lay-card"}`}
              >
                {/* Left: Bet Info */}
                <div className="bet-info-col">
                  <div className="bet-badges-row">
                    <span className={`bet-side-badge ${isBack ? "back" : "lay"}`}>
                      {isBack ? "BACK (LAGAI)" : "LAY (KHAI)"}
                    </span>
                    <span className="bet-odds-badge">
                      Odds: <strong>{bet.price || bet.rate || "--"}</strong>
                    </span>
                    <span className="bet-status-badge">
                      {bet.status || "MATCHED"}
                    </span>
                  </div>

                  <div className="bet-selection-name">
                    {bet.selectionName || bet.sectionTeam || "Selection"}
                  </div>
                  <div className="bet-match-name">
                    {bet.matchName || "Live Match"}
                  </div>
                </div>

                {/* Right: Stake & Profit/Liability */}
                <div className="bet-numbers-col">
                  <div className="num-box">
                    <span className="num-lbl">STAKE</span>
                    <span className="num-val stake">₹{bet.stake?.toLocaleString()}</span>
                  </div>

                  <div className="num-box">
                    <span className="num-lbl">{isBack ? "PROFIT" : "LIABILITY"}</span>
                    <span className={`num-val ${isBack ? "profit" : "liability"}`}>
                      ₹{((bet.potentialProfit || bet.stake * ((bet.price || 2) - 1)) || 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <style>{`
        .shiva-mybets-container {
          max-width: 1000px;
          margin: 0 auto;
          padding: 12px 10px 80px;
          width: 100%;
        }

        /* ── Header ── */
        .shiva-mybets-header {
          display: flex;
          flex-wrap: wrap;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
        }

        .shiva-mybets-title-group {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .shiva-mybets-title {
          margin: 0;
          font-size: 22px;
          font-weight: 900;
          color: #0f172a;
          letter-spacing: -0.3px;
        }

        .shiva-mybets-account {
          font-size: 12.5px;
          color: #475569;
          font-weight: 600;
        }

        .shiva-mybets-account strong {
          color: #8c4e09;
          font-weight: 800;
        }

        /* Aggregate Stats */
        .shiva-mybets-stats {
          display: flex;
          gap: 8px;
        }

        .stat-card {
          background: #ffffff;
          padding: 8px 14px;
          border-radius: 8px;
          border: 1px solid #cbd5e1;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
          display: flex;
          flex-direction: column;
          min-width: 90px;
        }

        .stat-card-lbl {
          font-size: 9.5px;
          color: #64748b;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }

        .stat-card-val {
          font-size: 15px;
          font-weight: 900;
          font-family: 'IBM Plex Mono', monospace;
        }

        .stat-card-val.stake {
          color: #0f172a;
        }

        .stat-card-val.count {
          color: #8c4e09;
        }

        /* ── Filter Tabs ── */
        .shiva-mybets-filter-tabs {
          display: flex;
          gap: 6px;
          margin-bottom: 14px;
        }

        .shiva-tab-btn {
          padding: 8px 16px;
          border-radius: 6px;
          background: #ffffff;
          border: 1px solid #cbd5e1;
          color: #334155;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.12s ease;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
        }

        .shiva-tab-btn:hover {
          background: #f8fafc;
          border-color: #8c4e09;
          color: #8c4e09;
        }

        .shiva-tab-btn.active {
          background: #fef08a;
          border: 1.5px solid #ca8a04;
          color: #713f12;
          font-weight: 900;
          box-shadow: 0 2px 4px rgba(202, 138, 4, 0.2);
        }

        /* ── Empty Card ── */
        .shiva-mybets-loading {
          text-align: center;
          padding: 40px;
          color: #475569;
          font-size: 13.5px;
          font-weight: 700;
        }

        .shiva-mybets-empty-card {
          background: #ffffff;
          border-radius: 10px;
          border: 1px solid #cbd5e1;
          padding: 44px 16px;
          text-align: center;
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
        }

        .empty-clock-icon {
          color: #94a3b8;
          margin-bottom: 10px;
        }

        .empty-title {
          margin: 0 0 6px 0;
          font-size: 16px;
          font-weight: 900;
          color: #0f172a;
        }

        .empty-subtitle {
          margin: 0;
          font-size: 12.5px;
          color: #64748b;
          font-weight: 600;
        }

        /* ── Bet Cards ── */
        .shiva-bets-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .shiva-bet-row-card {
          background: #ffffff;
          border-radius: 8px;
          padding: 12px 14px;
          display: flex;
          flex-wrap: wrap;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
          transition: transform 0.1s ease, box-shadow 0.12s ease;
        }

        .shiva-bet-row-card:hover {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        }

        .shiva-bet-row-card.back-card {
          border-left: 5px solid #2563eb;
          border-top: 1px solid #cbd5e1;
          border-right: 1px solid #cbd5e1;
          border-bottom: 1px solid #cbd5e1;
        }

        .shiva-bet-row-card.lay-card {
          border-left: 5px solid #db2777;
          border-top: 1px solid #cbd5e1;
          border-right: 1px solid #cbd5e1;
          border-bottom: 1px solid #cbd5e1;
        }

        .bet-info-col {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .bet-badges-row {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 2px;
        }

        .bet-side-badge {
          padding: 2px 8px;
          border-radius: 3px;
          font-size: 10.5px;
          font-weight: 900;
          letter-spacing: 0.3px;
        }

        .bet-side-badge.back {
          background: #72bbef;
          color: #0c2b4e;
        }

        .bet-side-badge.lay {
          background: #faa9ba;
          color: #4c0d1e;
        }

        .bet-odds-badge {
          font-size: 11.5px;
          color: #475569;
          font-weight: 600;
        }

        .bet-odds-badge strong {
          color: #0f172a;
          font-weight: 800;
        }

        .bet-status-badge {
          font-size: 9.5px;
          color: #166534;
          background: #dcfce7;
          border: 1px solid #86efac;
          padding: 1px 6px;
          border-radius: 3px;
          font-weight: 800;
          text-transform: uppercase;
        }

        .bet-selection-name {
          font-size: 15px;
          font-weight: 900;
          color: #0f172a;
        }

        .bet-match-name {
          font-size: 12px;
          color: #64748b;
          font-weight: 600;
        }

        .bet-numbers-col {
          display: flex;
          align-items: center;
          gap: 16px;
          text-align: right;
        }

        .num-box {
          display: flex;
          flex-direction: column;
        }

        .num-lbl {
          font-size: 9.5px;
          color: #64748b;
          font-weight: 800;
          text-transform: uppercase;
        }

        .num-val {
          font-size: 14.5px;
          font-weight: 900;
          font-family: 'IBM Plex Mono', monospace;
        }

        .num-val.stake {
          color: #0f172a;
        }

        .num-val.profit {
          color: #15803d;
        }

        .num-val.liability {
          color: #b91c1c;
        }

        @media (max-width: 600px) {
          .shiva-mybets-header {
            flex-direction: column;
            align-items: flex-start;
          }
          .shiva-mybets-stats {
            width: 100%;
          }
          .stat-card {
            flex: 1;
          }
          .bet-numbers-col {
            width: 100%;
            justify-content: space-between;
            border-top: 1px solid #f1f5f9;
            padding-top: 8px;
            margin-top: 4px;
            text-align: left;
          }
        }
      `}</style>
    </div>
  );
}
