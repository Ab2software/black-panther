import React, { useEffect, useState } from "react";
import { Coins, TrendingUp, TrendingDown, Users, ArrowUpRight, ArrowDownLeft, RefreshCw } from "lucide-react";
import { fetchChipDashboard } from "../../services/Chipservice";

const ChipDashboard = () => {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchChipDashboard();
      setData(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (loading) return <PageShell><LoadingState /></PageShell>;
  if (error)   return <PageShell><ErrorState message={error} onRetry={load} /></PageShell>;

  const { me, upline, downline, clientsPL, downlinePL } = data;
  const netPL = clientsPL?.netPL ?? 0;

  return (
    <PageShell>
      {/* Header */}
      <div style={s.header}>
        <div>
          <h1 style={s.pageTitle}>Chip Dashboard</h1>
          <p style={s.pageSub}>Overview of your chips, upline and client activity</p>
        </div>
        <button style={s.refreshBtn} onClick={load}>
          <RefreshCw size={13} />
          Refresh
        </button>
      </div>

      {/* My wallet cards */}
      <div style={s.cardRow}>
        <StatCard
          label="My Balance"
          value={`₹ ${fmt(me.wallet.balance)}`}
          icon={<Coins size={16} />}
          color="#111110"
        />
        <StatCard
          label="Available Balance"
          value={`₹ ${fmt(me.wallet.availableBalance)}`}
          icon={<ArrowUpRight size={16} />}
          color="#2d6a4f"
        />
        <StatCard
          label="Exposure"
          value={`₹ ${fmt(me.wallet.exposure)}`}
          icon={<ArrowDownLeft size={16} />}
          color="#c0392b"
        />
        <StatCard
          label="Clients Net P&L"
          value={`₹ ${fmt(Math.abs(netPL))}`}
          icon={netPL >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
          color={netPL >= 0 ? "#2d6a4f" : "#c0392b"}
          sub={netPL >= 0 ? "You are in profit" : "You are in loss"}
        />
      </div>

      {/* Upline */}
      {upline && (
        <Section title="Upline">
          <div style={s.uplineCard}>
            <div style={s.uplineLeft}>
              <div style={s.uplineAvatar}>
                {upline.username?.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div style={s.uplineName}>{upline.username}</div>
                <div style={s.uplineRole}>{upline.role?.toUpperCase()}</div>
              </div>
            </div>
            <div style={s.uplineBalance}>
              <div style={s.uplineBalLabel}>Balance</div>
              <div style={s.uplineBalValue}>₹ {fmt(upline.balance)}</div>
            </div>
          </div>
        </Section>
      )}

      {/* Downline users */}
      <Section title={`Direct Downline (${downline.length})`}>
        {downline.length === 0 ? (
          <EmptyState message="No downline users yet" />
        ) : (
          <div style={s.table}>
            <div style={{ ...s.tableRow, ...s.tableHead }}>
              <span>Username</span>
              <span>Role</span>
              <span>Balance</span>
              <span>Exposure</span>
              <span>Available</span>
              <span>Status</span>
            </div>
            {downline.map((u) => (
              <div key={u.userId} style={s.tableRow}>
                <span style={s.mono}>{u.username}</span>
                <span>
                  <RoleBadge role={u.role} />
                </span>
                <span style={s.mono}>₹ {fmt(u.balance)}</span>
                <span style={{ ...s.mono, color: "#c0392b" }}>₹ {fmt(u.exposure)}</span>
                <span style={{ ...s.mono, color: "#2d6a4f" }}>₹ {fmt(u.availableBalance)}</span>
                <span>
                  <StatusBadge status={u.status} />
                </span>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* Per-user P&L */}
      <Section title="Clients P&L Breakdown">
        <div style={s.plSummary}>
          <PLStat label="Total Bets"  value={clientsPL.totalBets} />
          <PLStat label="Total Won"   value={clientsPL.totalWon} color="#2d6a4f" />
          <PLStat label="Total Lost"  value={clientsPL.totalLost} color="#c0392b" />
          <PLStat label="Total Stake" value={`₹ ${fmt(clientsPL.totalStake)}`} />
        </div>

        {downlinePL.length === 0 ? (
          <EmptyState message="No settled bets yet" />
        ) : (
          <div style={{ ...s.table, marginTop: "16px" }}>
            <div style={{ ...s.tableRow, ...s.tableHead }}>
              <span>Username</span>
              <span>Total Bets</span>
              <span>Total Stake</span>
              <span>Net P&L (House)</span>
            </div>
            {downlinePL.map((u) => (
              <div key={u.userId} style={s.tableRow}>
                <span style={s.mono}>{u.username}</span>
                <span style={s.mono}>{u.totalBets}</span>
                <span style={s.mono}>₹ {fmt(u.totalStake)}</span>
                <span style={{ ...s.mono, color: -u.totalPL >= 0 ? "#2d6a4f" : "#c0392b", fontWeight: 600 }}>
                  {-u.totalPL >= 0 ? "+" : ""}₹ {fmt(Math.abs(u.totalPL))}
                </span>
              </div>
            ))}
          </div>
        )}
      </Section>
    </PageShell>
  );
};

// ── Sub-components ────────────────────────────────────────────────────────

const PageShell = ({ children }) => (
  <div style={s.page}>{children}</div>
);

const Section = ({ title, children }) => (
  <div style={s.section}>
    <div style={s.sectionTitle}>{title}</div>
    {children}
  </div>
);

const StatCard = ({ label, value, icon, color, sub }) => (
  <div style={s.statCard}>
    <div style={{ ...s.statIcon, color }}>{icon}</div>
    <div style={s.statLabel}>{label}</div>
    <div style={{ ...s.statValue, color }}>{value}</div>
    {sub && <div style={s.statSub}>{sub}</div>}
  </div>
);

const PLStat = ({ label, value, color = "#111110" }) => (
  <div style={s.plStat}>
    <div style={s.plStatLabel}>{label}</div>
    <div style={{ ...s.plStatValue, color }}>{value}</div>
  </div>
);

const RoleBadge = ({ role }) => (
  <span style={{ ...s.badge, background: role === "admin" ? "#e8f4fd" : "#f0efea", color: role === "admin" ? "#1a6ea0" : "#7a7870" }}>
    {role}
  </span>
);

const StatusBadge = ({ status }) => (
  <span style={{ ...s.badge, background: status === "active" ? "#e8f5e9" : "#fdf2f2", color: status === "active" ? "#2d6a4f" : "#c0392b" }}>
    {status}
  </span>
);

const LoadingState = () => (
  <div style={s.centered}>
    <RefreshCw size={20} style={{ animation: "spin 1s linear infinite", color: "#b0aea6" }} />
    <span style={{ color: "#b0aea6", fontSize: "13px", marginLeft: "8px" }}>Loading...</span>
  </div>
);

const ErrorState = ({ message, onRetry }) => (
  <div style={s.centered}>
    <span style={{ color: "#c0392b", fontSize: "13px" }}>{message}</span>
    <button style={s.retryBtn} onClick={onRetry}>Retry</button>
  </div>
);

const EmptyState = ({ message }) => (
  <div style={{ ...s.centered, padding: "32px", color: "#b0aea6", fontSize: "13px" }}>
    {message}
  </div>
);

const fmt = (n) =>
  Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// ── Styles ────────────────────────────────────────────────────────────────
const s = {
  page:         { padding: "24px 28px", fontFamily: "'IBM Plex Sans', sans-serif", maxWidth: "1200px", color: "var(--admin-body-text)" },
  header:       { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" },
  pageTitle:    { fontSize: "24px", fontWeight: 700, color: "var(--admin-heading)", margin: 0, letterSpacing: "-0.02em" },
  pageSub:      { fontSize: "12px", color: "var(--admin-muted-text)", marginTop: "4px", fontFamily: "'IBM Plex Mono', monospace" },
  refreshBtn:   { display: "flex", alignItems: "center", gap: "6px", padding: "8px 14px", borderRadius: "8px", border: "1px solid var(--admin-border)", background: "var(--admin-secondary-btn)", fontSize: "12px", cursor: "pointer", color: "var(--admin-secondary-text)", fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: 600 },
  cardRow:      { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "14px", marginBottom: "28px" },
  statCard:     { background: "var(--admin-card-bg)", border: "1px solid var(--admin-border)", borderRadius: "12px", padding: "18px", display: "flex", flexDirection: "column", gap: "6px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" },
  statIcon:     { marginBottom: "4px" },
  statLabel:    { fontSize: "11px", color: "var(--admin-muted-text)", fontFamily: "'IBM Plex Mono', monospace", letterSpacing: "0.04em", fontWeight: 600, textTransform: "uppercase" },
  statValue:    { fontSize: "22px", fontWeight: 700, color: "var(--admin-heading)", letterSpacing: "-0.02em" },
  statSub:      { fontSize: "11px", color: "var(--admin-muted-text)" },
  section:      { background: "var(--admin-card-bg)", border: "1px solid var(--admin-border)", borderRadius: "12px", padding: "22px", marginBottom: "20px", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" },
  sectionTitle: { fontSize: "14px", fontWeight: 600, color: "var(--admin-heading)", marginBottom: "16px", paddingBottom: "12px", borderBottom: "1px solid var(--admin-border)" },
  uplineCard:   { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px", background: "var(--admin-sidebar-bg)", border: "1px solid var(--admin-border)", borderRadius: "10px" },
  uplineLeft:   { display: "flex", alignItems: "center", gap: "12px" },
  uplineAvatar: { width: "36px", height: "36px", borderRadius: "8px", background: "var(--admin-primary-btn)", color: "var(--admin-btn-text)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'IBM Plex Mono', monospace", fontSize: "12px", fontWeight: 600 },
  uplineName:   { fontSize: "14px", fontWeight: 600, color: "var(--admin-heading)" },
  uplineRole:   { fontSize: "10px", color: "var(--admin-muted-text)", fontFamily: "'IBM Plex Mono', monospace", letterSpacing: "0.06em", marginTop: "2px" },
  uplineBalance:{ textAlign: "right" },
  uplineBalLabel:{ fontSize: "10px", color: "var(--admin-muted-text)", fontFamily: "'IBM Plex Mono', monospace", textTransform: "uppercase" },
  uplineBalValue:{ fontSize: "18px", fontWeight: 700, color: "var(--admin-heading)", marginTop: "2px" },
  table:        { width: "100%", borderRadius: "10px", overflow: "hidden", border: "1px solid var(--admin-border)" },
  tableHead:    { background: "var(--admin-sidebar-bg)", fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", color: "var(--admin-muted-text)", letterSpacing: "0.06em", fontWeight: 600, textTransform: "uppercase" },
  tableRow:     { display: "grid", gridTemplateColumns: "2fr 1fr 1.5fr 1.5fr 1.5fr 1fr", padding: "12px 16px", borderBottom: "1px solid var(--admin-border)", fontSize: "12px", color: "var(--admin-body-text)", alignItems: "center" },
  mono:         { fontFamily: "'IBM Plex Mono', monospace", fontSize: "12px", color: "var(--admin-heading)" },
  badge:        { padding: "3px 8px", borderRadius: "5px", fontSize: "10px", fontFamily: "'IBM Plex Mono', monospace", fontWeight: 600 },
  plSummary:    { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: "8px" },
  plStat:       { background: "var(--admin-sidebar-bg)", border: "1px solid var(--admin-border)", borderRadius: "10px", padding: "14px 16px" },
  plStatLabel:  { fontSize: "10px", color: "var(--admin-muted-text)", fontFamily: "'IBM Plex Mono', monospace", marginBottom: "6px", textTransform: "uppercase", fontWeight: 600 },
  plStatValue:  { fontSize: "18px", fontWeight: 700, color: "var(--admin-heading)" },
  centered:     { display: "flex", alignItems: "center", justifyContent: "center", padding: "60px", gap: "8px" },
  retryBtn:     { marginLeft: "12px", padding: "6px 14px", borderRadius: "6px", border: "1px solid var(--admin-border)", background: "var(--admin-secondary-btn)", color: "var(--admin-secondary-text)", cursor: "pointer", fontSize: "12px", fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: 600 },
};

export default ChipDashboard;