import React, { useEffect, useState, useMemo } from "react";
import { getGameHistory } from "../../services/gameService";
import {useAuth} from '../../context/AuthContext';

const TABS = [
  { key: "all", label: "All", icon: "🔲" },
  { key: "casino", label: "Casino", icon: "🃏" },
  { key: "crash", label: "Crash", icon: "📈" },
  { key: "aviator", label: "Aviator", icon: "✈️" },
  { key: "mines", label: "Mines", icon: "💣" },
  { key: "plinko", label: "Plinko", icon: "🔵" },
];

const RESULTS = ["all", "WIN", "LOSS", "PENDING"];
const PERIODS = [
  { val: "all", label: "All time" },
  { val: "today", label: "Today" },
  { val: "week", label: "This week" },
  { val: "month", label: "This month" },
];

const inPeriod = (ts, p) => {
  const d = Date.now() - new Date(ts).getTime();
  if (p === "today") return d < 86400000;
  if (p === "week") return d < 604800000;
  if (p === "month") return d < 2592000000;
  return true;
};

const fmtDate = (ts) =>
  new Date(ts).toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

export default function BetsHistory() {
   const { user } = useAuth();  
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("all");
  const [result, setResult] = useState("all");
  const [period, setPeriod] = useState("all");
useEffect(() => {
    if (!user?._id) return;
    (async () => {
      try {
        const res = await getGameHistory(user._id);
        setHistory(res.history || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, [user?._id]); 
  // AFTER (fixed) — move the read inside useEffect so it's always fresh
// useEffect(() => {
//   (async () => {
//     try {
//       // Read fresh on every mount, not at render time
//       const stored = localStorage.getItem("user");
//       if (!stored) return;
//       const user = JSON.parse(stored);
//       if (!user?._id) return;

//       const res = await getGameHistory(user._id);
//       setHistory(res.history || []);
//       console.log("Game history for user:", user._id, res.history);
//     } catch (err) {
//       console.error(err);
//     } finally {
//       setLoading(false);
//     }
//   })();
// }, []); // still fine — now reads fresh inside

  const rows = useMemo(
    () =>
      history.filter((r) => {
        if (
          tab !== "all" &&
          !r.gameName?.toLowerCase().includes(tab.toLowerCase())
        )
          return false;
        if (result !== "all" && r.result !== result) return false;
        if (!inPeriod(r.playedAt, period)) return false;
        return true;
      }),
    [history, tab, result, period],
  );

  const stats = useMemo(() => {
    const wagered = rows.reduce((s, r) => s + Number(r.betAmount || 0), 0);

    const won = rows.reduce((s, r) => s + Number(r.winAmount || 0), 0);
    const pnl = won - wagered;
    const wr = rows.length
      ? Math.round(
          (rows.filter((r) => r.result === "WIN").length / rows.length) * 100,
        )
      : 0;
    return { count: rows.length, wagered, pnl, wr };
  }, [rows]);

  const chip = (active, onClick, label) => (
    <button
      onClick={onClick}
      style={{ ...s.chip, ...(active ? s.chipOn : {}) }}
    >
      {label}
    </button>
  );

  return (
    <div style={s.root}>
      {/* Topbar */}
      <div style={s.topbar}>
        <div style={s.logo}>
          <div style={s.logoDot} />
          BetVault
        </div>
      </div>

      <div style={s.body}>
        <div style={s.pageTitle}>Bet history</div>
        <div style={s.pageSub}>All your wagers across games and rounds</div>

        {/* Stats */}
        <div style={s.statsRow}>
          {[
            { label: "Total bets", val: stats.count, color: null },
            {
              label: "Wagered",
              val: `₹${stats.wagered.toLocaleString()}`,
              color: null,
            },
            {
              label: "Net P&L",
              val: `${stats.pnl >= 0 ? "+" : ""}₹${Math.abs(stats.pnl).toLocaleString()}`,
              color: stats.pnl >= 0 ? "#16a34a" : "#dc2626",
            },
            {
              label: "Win rate",
              val: `${stats.wr}%`,
              color: stats.wr >= 50 ? "#16a34a" : "#dc2626",
            },
          ].map(({ label, val, color }) => (
            <div key={label} style={s.stat}>
              <div style={s.statL}>{label}</div>
              <div style={{ ...s.statV, ...(color ? { color } : {}) }}>
                {val}
              </div>
            </div>
          ))}
        </div>

        {/* Controls */}
        <div style={s.controls}>
          {/* Tabs */}
          <div style={s.tabs}>
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                style={{ ...s.tab, ...(tab === t.key ? s.tabOn : {}) }}
              >
                {t.icon} {t.label}
              </button>
            ))}
          </div>

          {/* Filters */}
          <div style={s.filters}>
            <span style={s.fl}>Result</span>
            {RESULTS.map((v) =>
              chip(
                result === v,
                () => setResult(v),
                v === "all" ? "All" : v.charAt(0) + v.slice(1).toLowerCase(),
              ),
            )}
            <span style={{ ...s.fl, marginLeft: 12 }}>Period</span>
            {PERIODS.map(({ val, label }) =>
              chip(period === val, () => setPeriod(val), label),
            )}
          </div>

          {/* Table */}
          <div style={{ overflowX: "auto" }}>
            {loading ? (
              <div style={s.empty}>Loading…</div>
            ) : rows.length === 0 ? (
              <div style={s.empty}>No bets found</div>
            ) : (
              <table style={s.table}>
                <colgroup>
                  <col style={{ width: 200 }} />
                  <col style={{ width: 100 }} />
                  <col style={{ width: 110 }} />
                  <col style={{ width: 100 }} />
                  <col style={{ width: 90 }} />
                  <col style={{ width: 120 }} />
                </colgroup>
                <thead>
                  <tr>
                    {[
                      "Game",
                      "Bet",
                      "Multiplier",
                      "Payout",
                      "Result",
                      "Date",
                    ].map((h) => (
                      <th
                        key={h}
                        style={{
                          ...s.th,
                          ...(h === "Date" ? { textAlign: "right" } : {}),
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => {
                    const pnl =
                      Number(r.winAmount || 0) - Number(r.betAmount || 0);
                    const multiplier =
                      Number(r.betAmount || 0) > 0
                        ? Number(r.winAmount || 0) / Number(r.betAmount || 1)
                        : 0;

                    const multStr =
                      r.result === "PENDING"
                        ? "—"
                        : multiplier > 0
                          ? `${multiplier.toFixed(2)}×`
                          : "0×";
                    const badge =
                      r.result === "WIN"
                        ? s.bWin
                        : r.result === "LOSS"
                          ? s.bLoss
                          : s.bPend;
                    return (
                      <tr
                        key={r.id}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background = "#fafaf8")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background = "transparent")
                        }
                        style={s.row}
                      >
                        <td style={s.td}>
                          <div style={s.gameCell}>
                            <div style={s.gameIcon}>
                              {r.gameName?.[0]?.toUpperCase() || "G"}
                            </div>
                            <div>
                              <div style={s.gameName}>
                                {r.gameName || r.gameUid}
                              </div>
                              <div style={s.gameRound}>Round {r.gameRound}</div>
                            </div>
                          </div>
                        </td>
                        <td style={s.td}>
                          <span style={s.amt}>
                            ₹{Number(r.betAmount || 0).toFixed(2)}
                          </span>
                        </td>
                        <td style={s.td}>
                          <span style={s.mult}>{multStr}</span>
                        </td>
                        <td style={s.td}>
                          <span style={s.amt}>
                            ₹{Number(r.winAmount || 0).toFixed(2)}
                          </span>
                        </td>
                        <td style={s.td}>
                          <span style={badge}>{r.result}</span>
                        </td>
                        <td
                          style={{
                            ...s.td,
                            textAlign: "right",
                            fontSize: 12,
                            color: "#aaa",
                          }}
                        >
                          {fmtDate(r.playedAt)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const s = {
  root: {
    background: "#f5f5f2",
    minHeight: "100vh",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  topbar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 24px",
    height: 52,
    borderBottom: "1px solid #e8e8e2",
    background: "#fff",
  },
  logo: {
    fontSize: 15,
    fontWeight: 500,
    color: "#1a1a18",
    letterSpacing: "-0.3px",
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  logoDot: { width: 8, height: 8, borderRadius: "50%", background: "#16a34a" },
  topRight: { display: "flex", alignItems: "center", gap: 12 },
  bal: { fontSize: 13, color: "#888780" },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: "50%",
    background: "#f0f0ec",
    border: "1px solid #e8e8e2",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 12,
    color: "#888780",
  },
  body: { padding: 24 },
  pageTitle: {
    fontSize: 18,
    fontWeight: 500,
    color: "#1a1a18",
    marginBottom: 2,
  },
  pageSub: { fontSize: 13, color: "#888780", marginBottom: 20 },
  statsRow: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0,1fr))",
    gap: 10,
    marginBottom: 20,
  },
  stat: {
    background: "#fff",
    border: "1px solid #e8e8e2",
    borderRadius: 8,
    padding: "14px 16px",
  },
  statL: {
    fontSize: 11,
    color: "#888780",
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  statV: { fontSize: 20, fontWeight: 500, color: "#1a1a18" },
  controls: {
    background: "#fff",
    border: "1px solid #e8e8e2",
    borderRadius: 8,
    overflow: "hidden",
  },
  tabs: {
    display: "flex",
    borderBottom: "1px solid #e8e8e2",
    overflowX: "auto",
    background: "#fafaf8",
  },
  tab: {
    padding: "11px 18px",
    fontSize: 13,
    color: "#888780",
    cursor: "pointer",
    border: "none",
    background: "none",
    whiteSpace: "nowrap",
    borderBottom: "2px solid transparent",
    marginBottom: -1,
  },
  tabOn: { color: "#1a1a18", borderBottomColor: "#16a34a", fontWeight: 500 },
  filters: {
    display: "flex",
    gap: 8,
    padding: "12px 16px",
    flexWrap: "wrap",
    alignItems: "center",
    borderBottom: "1px solid #e8e8e2",
  },
  fl: {
    fontSize: 11,
    color: "#aaa",
    textTransform: "uppercase",
    letterSpacing: "0.4px",
  },
  chip: {
    padding: "4px 12px",
    borderRadius: 20,
    fontSize: 12,
    border: "1px solid #e8e8e2",
    background: "#fff",
    color: "#888780",
    cursor: "pointer",
  },
  chipOn: { background: "#1a1a18", color: "#fff", border: "1px solid #1a1a18" },
  table: { width: "100%", borderCollapse: "collapse", tableLayout: "fixed" },
  th: {
    padding: "10px 16px",
    fontSize: 11,
    fontWeight: 500,
    color: "#888780",
    textAlign: "left",
    textTransform: "uppercase",
    letterSpacing: "0.4px",
    background: "#fafaf8",
  },
  row: { borderTop: "1px solid #f0f0ec", transition: "background 0.1s" },
  td: { padding: "12px 16px", fontSize: 13, color: "#888780" },
  gameCell: { display: "flex", alignItems: "center", gap: 10 },
  gameIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    background: "#f0f0ec",
    border: "1px solid #e8e8e2",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 13,
    color: "#888780",
    flexShrink: 0,
  },
  gameName: { fontSize: 13, color: "#1a1a18", fontWeight: 500 },
  gameRound: { fontSize: 11, color: "#aaa", marginTop: 1 },
  amt: { color: "#1a1a18", fontWeight: 500 },
  mult: { color: "#aaa", fontSize: 12 },
  empty: {
    textAlign: "center",
    padding: "40px 16px",
    fontSize: 13,
    color: "#aaa",
  },
  bWin: {
    display: "inline-block",
    padding: "3px 9px",
    borderRadius: 4,
    fontSize: 11,
    fontWeight: 500,
    background: "#dcfce7",
    color: "#15803d",
  },
  bLoss: {
    display: "inline-block",
    padding: "3px 9px",
    borderRadius: 4,
    fontSize: 11,
    fontWeight: 500,
    background: "#fee2e2",
    color: "#b91c1c",
  },
  bPend: {
    display: "inline-block",
    padding: "3px 9px",
    borderRadius: 4,
    fontSize: 11,
    fontWeight: 500,
    background: "#fef9c3",
    color: "#a16207",
  },
};
