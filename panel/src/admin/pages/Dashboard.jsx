import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  UserCheck,
  UserX,
  Wallet,
  TrendingUp,
  TrendingDown,
  UserPlus,
  ArrowDownCircle,
  ArrowUpCircle,
  Clock,
  Calendar,
  ArrowRight,
  RefreshCw,
  Coins,
  ShieldCheck,
  Crown,
  CheckCircle2,
  AlertCircle,
  Layers,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { getClientStats } from "../services/adminClientService";
import { toast } from "../../utils/toast";
import { useAdminTheme } from "../context/AdminThemeContext";

// ─── Stat Card Component ─────────────────────────────────────────────────────

const StatCard = ({ label, value, sub, accent, icon: Icon, theme, badgeText }) => {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? theme.cardHover : theme.cardBg,
        border: `1px solid ${hovered ? theme.focus : theme.border}`,
        borderRadius: 12,
        padding: "18px 20px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        position: "relative",
        overflow: "hidden",
        minHeight: 110,
        boxShadow: hovered
          ? `0 12px 28px -6px ${accent || theme.primaryButton}26`
          : "0 2px 8px rgba(0,0,0,0.04)",
        transform: hovered ? "translateY(-3px)" : "translateY(0)",
        transition: "all 0.22s cubic-bezier(0.16, 1, 0.3, 1)",
      }}
    >
      {/* Glowing Left Indicator */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: 4,
          height: "100%",
          background: accent || theme.primaryButton,
          boxShadow: `0 0 12px ${accent || theme.focus}`,
          borderRadius: "12px 0 0 12px",
        }}
      />

      {/* Header Row: Label + Icon */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          marginBottom: 10,
        }}
      >
        <span
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 11,
            color: theme.mutedText,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            fontWeight: 500,
          }}
        >
          {label}
        </span>
        {Icon && (
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: `${accent || theme.primaryButton}18`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: accent || theme.primaryButton,
              flexShrink: 0,
            }}
          >
            <Icon size={16} />
          </div>
        )}
      </div>

      {/* Value */}
      <div
        style={{
          fontSize: 24,
          fontWeight: 600,
          color: theme.heading,
          letterSpacing: "-0.03em",
          lineHeight: 1.1,
          marginBottom: sub || badgeText ? 8 : 0,
        }}
      >
        {value ?? "—"}
      </div>

      {/* Footer Sub / Badge */}
      {(sub || badgeText) && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 8,
            marginTop: "auto",
          }}
        >
          {sub && (
            <span
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 10,
                color: theme.mutedText,
              }}
            >
              {sub}
            </span>
          )}
          {badgeText && (
            <span
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 9,
                fontWeight: 600,
                padding: "2px 6px",
                borderRadius: 4,
                background: `${accent || theme.primaryButton}20`,
                color: accent || theme.primaryButton,
              }}
            >
              {badgeText}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Alert Stat Card Component ───────────────────────────────────────────────

const AlertStatCard = ({
  label,
  value,
  sub,
  alert,
  alertCount,
  accent,
  icon: Icon,
  theme,
  onClick,
}) => {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: alert
          ? theme.isDark
            ? "#2a1e12"
            : "#fff9ec"
          : hovered
          ? theme.cardHover
          : theme.cardBg,
        border: `1px solid ${
          alert
            ? theme.warning
            : hovered
            ? theme.focus
            : theme.border
        }`,
        borderRadius: 12,
        padding: "18px 20px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        position: "relative",
        overflow: "hidden",
        minHeight: 110,
        cursor: "pointer",
        boxShadow: alert
          ? `0 0 16px ${theme.warning}33, 0 8px 20px rgba(0,0,0,0.06)`
          : hovered
          ? `0 12px 28px -6px ${accent || theme.primaryButton}22`
          : "0 2px 8px rgba(0,0,0,0.04)",
        transform: hovered ? "translateY(-3px)" : "translateY(0)",
        transition: "all 0.22s cubic-bezier(0.16, 1, 0.3, 1)",
      }}
    >
      {/* Alert Glowing Left Indicator */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: 4,
          height: "100%",
          background: alert ? theme.warning : accent || theme.primaryButton,
          boxShadow: `0 0 12px ${alert ? theme.warning : accent || theme.focus}`,
          borderRadius: "12px 0 0 12px",
          animation: alert ? "pulseIndicator 1.8s ease-in-out infinite" : "none",
        }}
      />

      {/* Header Row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          marginBottom: 10,
        }}
      >
        <span
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 11,
            color: alert ? theme.warning : theme.mutedText,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            fontWeight: alert ? 600 : 500,
          }}
        >
          {label}
        </span>
        {alert ? (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              padding: "3px 8px",
              borderRadius: 20,
              background: theme.warningBg,
              color: theme.warning,
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 10,
              fontWeight: 600,
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: theme.warning,
                animation: "pulseDot 1.2s ease-in-out infinite",
              }}
            />
            {alertCount ?? "!"} pending
          </span>
        ) : Icon ? (
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: `${accent || theme.primaryButton}18`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: accent || theme.primaryButton,
              flexShrink: 0,
            }}
          >
            <Icon size={16} />
          </div>
        ) : null}
      </div>

      {/* Value */}
      <div
        style={{
          fontSize: 24,
          fontWeight: 600,
          color: alert ? (theme.isDark ? "#fed7aa" : theme.warning) : theme.heading,
          letterSpacing: "-0.03em",
          lineHeight: 1.1,
          marginBottom: 8,
        }}
      >
        {value}
      </div>

      {/* Footer */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
          marginTop: "auto",
        }}
      >
        {sub && (
          <span
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 10,
              color: theme.mutedText,
            }}
          >
            {sub}
          </span>
        )}
        {alert ? (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 10,
              fontWeight: 600,
              color: theme.warning,
              marginLeft: "auto",
            }}
          >
            Review queue <ArrowRight size={12} />
          </span>
        ) : (
          <span
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 10,
              color: theme.mutedText,
              marginLeft: "auto",
            }}
          >
            Approved
          </span>
        )}
      </div>
    </div>
  );
};

// ─── Main Dashboard Component ────────────────────────────────────────────────

const ACTIVITY_PAGE_SIZE = 6;
const AUTO_REFRESH_MS = 8000;

const Dashboard = () => {
  const navigate = useNavigate();
  const { theme, isDark } = useAdminTheme();

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activityPage, setActivityPage] = useState(1);
  const [beforeDate, setBeforeDate] = useState("");
  const [filterLoading, setFilterLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  const beforeDateRef = useRef(beforeDate);
  useEffect(() => {
    beforeDateRef.current = beforeDate;
  }, [beforeDate]);

  // Live time ticker
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const admin = JSON.parse(localStorage.getItem("admin") || "{}");
  const prevCountsRef = useRef({ deposit: null, withdraw: null });

  const fetchStats = async () => {
    try {
      const currentBefore = beforeDateRef.current;
      const res = await getClientStats(
        currentBefore ? { before: currentBefore } : undefined
      );
      if (!res.success) return;

      setStats(res.data);

      const list = res.data?.recentActivity ?? [];
      const depositCount = list.filter(
        (i) => i.type === "deposit" && i.status === "pending"
      ).length;
      const withdrawCount = list.filter(
        (i) => i.type !== "deposit" && i.status === "pending"
      ).length;

      const prev = prevCountsRef.current;

      if (prev.deposit !== null && depositCount > prev.deposit) {
        const diff = depositCount - prev.deposit;
        toast.success(
          `${diff} new deposit request${diff > 1 ? "s" : ""} pending`
        );
      }
      if (prev.withdraw !== null && withdrawCount > prev.withdraw) {
        const diff = withdrawCount - prev.withdraw;
        toast.success(
          `${diff} new withdrawal request${diff > 1 ? "s" : ""} pending`
        );
      }

      prevCountsRef.current = {
        deposit: depositCount,
        withdraw: withdrawCount,
      };
    } catch (e) {
      console.log(e);
    }
  };

  useEffect(() => {
    (async () => {
      await fetchStats();
      setLoading(false);
    })();

    const interval = setInterval(fetchStats, AUTO_REFRESH_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible") fetchStats();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activityList = stats?.recentActivity ?? [];
  const pendingDeposits = activityList.filter(
    (i) => i.type === "deposit" && i.status === "pending"
  ).length;
  const pendingWithdrawals = activityList.filter(
    (i) => i.type !== "deposit" && i.status === "pending"
  ).length;

  const filteredActivityList = beforeDate
    ? activityList.filter((i) => {
        const created = new Date(i.createdAt).getTime();
        const cutoff = new Date(`${beforeDate}T23:59:59.999`).getTime();
        return created <= cutoff;
      })
    : activityList;

  const handleBeforeDateChange = async (e) => {
    const newDate = e.target.value;
    setBeforeDate(newDate);
    beforeDateRef.current = newDate;
    setActivityPage(1);
    setFilterLoading(true);
    await fetchStats();
    setFilterLoading(false);
  };

  const setDatePreset = async (preset) => {
    let dateStr = "";
    const now = new Date();
    if (preset === "today") {
      dateStr = now.toISOString().split("T")[0];
    } else if (preset === "yesterday") {
      const y = new Date(now);
      y.setDate(y.getDate() - 1);
      dateStr = y.toISOString().split("T")[0];
    } else if (preset === "7days") {
      const d7 = new Date(now);
      d7.setDate(d7.getDate() - 7);
      dateStr = d7.toISOString().split("T")[0];
    }
    setBeforeDate(dateStr);
    beforeDateRef.current = dateStr;
    setActivityPage(1);
    setFilterLoading(true);
    await fetchStats();
    setFilterLoading(false);
  };

  const clearDateFilter = async () => {
    setBeforeDate("");
    beforeDateRef.current = "";
    setActivityPage(1);
    setFilterLoading(true);
    await fetchStats();
    setFilterLoading(false);
  };

  const totalPages = Math.max(
    1,
    Math.ceil(filteredActivityList.length / ACTIVITY_PAGE_SIZE)
  );
  const safePage = Math.min(activityPage, totalPages);
  const pagedActivity = filteredActivityList.slice(
    (safePage - 1) * ACTIVITY_PAGE_SIZE,
    safePage * ACTIVITY_PAGE_SIZE
  );

  const goToRequest = (item) => {
    if (item.type === "deposit") navigate("/admin/deposits");
    else navigate("/admin/withdrawals");
  };

  const todayPnL = stats?.todayClientPnL ?? 0;
  const isPnLProfit = todayPnL >= 0;
  const pnlDisplay = `${isPnLProfit ? "+₹" : "-₹"}${Math.abs(
    todayPnL
  ).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const role = (admin?.role || "admin").toLowerCase();

  return (
    <div
      style={{
        minHeight: "100%",
        padding: "24px 32px 48px",
        background: theme.pageBg,
        color: theme.bodyText,
        transition: "background 0.2s ease, color 0.2s ease",
      }}
    >
      {/* ─── 1. HERO BANNER ───────────────────────────────────────────────── */}
      <div
        style={{
          background: isDark
            ? `linear-gradient(135deg, ${theme.cardBg} 0%, ${theme.sidebarBg} 100%)`
            : `linear-gradient(135deg, ${theme.cardBg} 0%, ${theme.secondaryButton} 100%)`,
          border: `1px solid ${theme.border}`,
          borderRadius: 16,
          padding: "24px 28px",
          marginBottom: 24,
          position: "relative",
          overflow: "hidden",
          boxShadow: isDark
            ? "0 8px 32px rgba(0,0,0,0.4)"
            : "0 4px 16px rgba(0,0,0,0.04)",
        }}
      >
        {/* Ambient background glow matching role theme */}
        <div
          style={{
            position: "absolute",
            top: -40,
            right: -40,
            width: 240,
            height: 240,
            borderRadius: "50%",
            background: `${theme.primaryButton}15`,
            filter: "blur(50px)",
            pointerEvents: "none",
          }}
        />

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 20,
            position: "relative",
            zIndex: 1,
          }}
        >
          {/* Left: Greeting + Role Badge */}
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 8,
              }}
            >
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "4px 10px",
                  borderRadius: 20,
                  background: theme.secondaryButton,
                  border: `1px solid ${theme.border}`,
                  color: theme.secondaryText,
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: 10,
                  fontWeight: 600,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                }}
              >
                {role === "owner" && <Crown size={12} color={theme.primaryButton} />}
                {role === "superadmin" && <ShieldCheck size={12} color={theme.primaryButton} />}
                {role !== "owner" && role !== "superadmin" && (
                  <Sparkles size={12} color={theme.primaryButton} />
                )}
                {theme.roleLabel} CONSOLE
              </span>

              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "4px 10px",
                  borderRadius: 20,
                  background: theme.successBg,
                  color: theme.success,
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: 10,
                  fontWeight: 600,
                }}
              >
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: theme.success,
                    boxShadow: `0 0 6px ${theme.success}`,
                  }}
                />
                LIVE SYSTEM
              </span>
            </div>

            <h1
              style={{
                fontSize: 26,
                fontWeight: 700,
                color: theme.heading,
                margin: "0 0 6px 0",
                letterSpacing: "-0.03em",
              }}
            >
              Welcome back, {admin?.username || "Admin"}
            </h1>

            <p
              style={{
                fontSize: 13,
                color: theme.mutedText,
                margin: 0,
                maxWidth: 580,
                lineHeight: 1.5,
              }}
            >
              Real-time gaming operations, client account balances, transaction
              approvals, and betting health overview.
            </p>
          </div>

          {/* Right: Live Clock & Quick Refresh */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
              gap: 8,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 14px",
                borderRadius: 8,
                background: theme.isDark ? "rgba(255,255,255,0.05)" : "#ffffff",
                border: `1px solid ${theme.border}`,
                boxShadow: "0 2px 6px rgba(0,0,0,0.03)",
              }}
            >
              <Clock size={14} color={theme.primaryButton} />
              <span
                style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: 12,
                  fontWeight: 600,
                  color: theme.heading,
                }}
              >
                {currentTime.toLocaleTimeString("en-IN", { hour12: true })}
              </span>
              <span style={{ color: theme.mutedText, fontSize: 11 }}>·</span>
              <span
                style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: 11,
                  color: theme.mutedText,
                }}
              >
                {currentTime.toLocaleDateString("en-IN", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </span>
            </div>

            <button
              onClick={() => {
                setFilterLoading(true);
                fetchStats().then(() => setFilterLoading(false));
              }}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "6px 12px",
                borderRadius: 6,
                background: theme.secondaryButton,
                border: `1px solid ${theme.border}`,
                color: theme.secondaryText,
                fontSize: 11,
                fontFamily: "'IBM Plex Mono', monospace",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              <RefreshCw
                size={12}
                className={filterLoading ? "spin" : ""}
                style={{
                  animation: filterLoading ? "spin 1s linear infinite" : "none",
                }}
              />
              {filterLoading ? "Updating..." : "Instant Sync"}
            </button>
          </div>
        </div>
      </div>

      {/* ─── 2. QUICK ACTIONS BAR ─────────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          flexWrap: "wrap",
          marginBottom: 20,
        }}
      >
        <span
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 10,
            color: theme.mutedText,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            marginRight: 4,
          }}
        >
          Quick Shortcuts:
        </span>

        <button
          onClick={() => navigate("/admin/users")}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "8px 14px",
            borderRadius: 8,
            background: theme.primaryButton,
            color: theme.buttonText,
            border: "none",
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
            boxShadow: `0 2px 10px ${theme.primaryButton}40`,
            transition: "transform 0.15s ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-1px)")}
          onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
        >
          <UserPlus size={14} />
          Create Client
        </button>

        <button
          onClick={() => navigate("/admin/deposits")}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "8px 14px",
            borderRadius: 8,
            background: pendingDeposits > 0 ? theme.warningBg : theme.secondaryButton,
            color: pendingDeposits > 0 ? theme.warning : theme.secondaryText,
            border: `1px solid ${pendingDeposits > 0 ? theme.warning : theme.border}`,
            fontSize: 12,
            fontWeight: 500,
            cursor: "pointer",
            transition: "all 0.15s ease",
          }}
        >
          <ArrowDownCircle size={14} />
          Deposits {pendingDeposits > 0 && `(${pendingDeposits} Pending)`}
        </button>

        <button
          onClick={() => navigate("/admin/withdrawals")}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "8px 14px",
            borderRadius: 8,
            background: pendingWithdrawals > 0 ? theme.dangerBg : theme.secondaryButton,
            color: pendingWithdrawals > 0 ? theme.danger : theme.secondaryText,
            border: `1px solid ${pendingWithdrawals > 0 ? theme.danger : theme.border}`,
            fontSize: 12,
            fontWeight: 500,
            cursor: "pointer",
            transition: "all 0.15s ease",
          }}
        >
          <ArrowUpCircle size={14} />
          Withdrawals {pendingWithdrawals > 0 && `(${pendingWithdrawals} Pending)`}
        </button>

        <button
          onClick={() => navigate("/admin/chips/transfer")}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "8px 14px",
            borderRadius: 8,
            background: theme.secondaryButton,
            color: theme.secondaryText,
            border: `1px solid ${theme.border}`,
            fontSize: 12,
            fontWeight: 500,
            cursor: "pointer",
          }}
        >
          <Coins size={14} />
          Transfer Chips
        </button>

        <button
          onClick={() => navigate("/admin/bet-history")}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "8px 14px",
            borderRadius: 8,
            background: theme.secondaryButton,
            color: theme.secondaryText,
            border: `1px solid ${theme.border}`,
            fontSize: 12,
            fontWeight: 500,
            cursor: "pointer",
          }}
        >
          <Layers size={14} />
          Bet History
        </button>
      </div>

      {/* ─── 3. DATE CUTOFF FILTER BAR ────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
          padding: "12px 18px",
          borderRadius: 10,
          background: theme.cardBg,
          border: `1px solid ${theme.border}`,
          marginBottom: 20,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              color: theme.mutedText,
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 11,
              textTransform: "uppercase",
            }}
          >
            <Calendar size={14} color={theme.primaryButton} />
            Scope Date:
          </div>

          <input
            id="dashboard-before-date"
            type="date"
            value={beforeDate}
            onChange={handleBeforeDateChange}
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 12,
              padding: "6px 12px",
              borderRadius: 6,
              border: `1px solid ${theme.inputBorder}`,
              color: theme.bodyText,
              background: theme.inputBg,
            }}
          />

          <div style={{ display: "flex", gap: 6 }}>
            <button
              onClick={() => setDatePreset("today")}
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 10,
                padding: "5px 10px",
                borderRadius: 6,
                background: theme.secondaryButton,
                color: theme.secondaryText,
                border: `1px solid ${theme.border}`,
                cursor: "pointer",
              }}
            >
              Today
            </button>
            <button
              onClick={() => setDatePreset("yesterday")}
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 10,
                padding: "5px 10px",
                borderRadius: 6,
                background: theme.secondaryButton,
                color: theme.secondaryText,
                border: `1px solid ${theme.border}`,
                cursor: "pointer",
              }}
            >
              Yesterday
            </button>
            <button
              onClick={() => setDatePreset("7days")}
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 10,
                padding: "5px 10px",
                borderRadius: 6,
                background: theme.secondaryButton,
                color: theme.secondaryText,
                border: `1px solid ${theme.border}`,
                cursor: "pointer",
              }}
            >
              Past 7 Days
            </button>
          </div>
        </div>

        {beforeDate && (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 11,
                color: theme.warning,
                background: theme.warningBg,
                padding: "4px 10px",
                borderRadius: 6,
              }}
            >
              Filtered: on/before {beforeDate}
            </span>
            <button
              onClick={clearDateFilter}
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 11,
                padding: "4px 10px",
                borderRadius: 6,
                background: theme.secondaryButton,
                color: theme.secondaryText,
                border: `1px solid ${theme.border}`,
                cursor: "pointer",
              }}
            >
              Reset to Live
            </button>
          </div>
        )}
      </div>

      {/* ─── 4. CORE STATS METRIC GRID ───────────────────────────────────── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
          gap: 14,
          marginBottom: 16,
        }}
      >
        <StatCard
          label="Total Clients"
          value={loading || filterLoading ? "..." : (stats?.total ?? 0)}
          sub="Registered under upline"
          icon={Users}
          accent={theme.primaryButton}
          theme={theme}
        />
        <StatCard
          label="Active Accounts"
          value={loading || filterLoading ? "..." : (stats?.active ?? 0)}
          sub="Unrestricted access"
          icon={UserCheck}
          accent={theme.success}
          theme={theme}
          badgeText="Healthy"
        />
        <StatCard
          label="Blocked Accounts"
          value={loading || filterLoading ? "..." : (stats?.blocked ?? 0)}
          sub="Locked or suspended"
          icon={UserX}
          accent={theme.danger}
          theme={theme}
        />
        <StatCard
          label="Total Client Balance"
          value={
            loading || filterLoading
              ? "..."
              : `₹${Number(stats?.totalBalance || 0).toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}`
          }
          sub="Held in client wallets"
          icon={Wallet}
          accent={theme.info}
          theme={theme}
        />
        <StatCard
          label="Today's Client P&L"
          value={loading || filterLoading ? "..." : pnlDisplay}
          sub="Net earnings since midnight"
          icon={isPnLProfit ? TrendingUp : TrendingDown}
          accent={isPnLProfit ? theme.success : theme.danger}
          theme={theme}
          badgeText={isPnLProfit ? "Profitable" : "Deficit"}
        />
        <StatCard
          label="New Clients Today"
          value={loading || filterLoading ? "..." : (stats?.newToday ?? 0)}
          sub="Since 12:00 AM IST"
          icon={UserPlus}
          accent={theme.focus}
          theme={theme}
        />
      </div>

      {/* ─── 5. 24H CASHFLOW & ACTION QUEUES ──────────────────────────────── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: 14,
          marginBottom: 24,
        }}
      >
        <AlertStatCard
          label="Today's Deposits (Approved)"
          value={
            loading || filterLoading
              ? "..."
              : `₹${Number(stats?.last24h?.deposit?.approved?.total ?? 0).toLocaleString("en-IN")}`
          }
          sub={`${stats?.last24h?.deposit?.approved?.count ?? 0} settled transactions`}
          alert={!loading && !filterLoading && pendingDeposits > 0}
          alertCount={pendingDeposits}
          icon={ArrowDownCircle}
          accent={theme.success}
          theme={theme}
          onClick={() => navigate("/admin/deposits")}
        />

        <StatCard
          label="Deposits (Rejected)"
          value={
            loading || filterLoading
              ? "..."
              : `₹${Number(stats?.last24h?.deposit?.rejected?.total ?? 0).toLocaleString("en-IN")}`
          }
          sub={`${stats?.last24h?.deposit?.rejected?.count ?? 0} rejected transactions`}
          icon={AlertCircle}
          accent={theme.danger}
          theme={theme}
        />

        <AlertStatCard
          label="Today's Withdrawals (Approved)"
          value={
            loading || filterLoading
              ? "..."
              : `₹${Number(stats?.last24h?.withdrawal?.approved?.total ?? 0).toLocaleString("en-IN")}`
          }
          sub={`${stats?.last24h?.withdrawal?.approved?.count ?? 0} settled payouts`}
          alert={!loading && !filterLoading && pendingWithdrawals > 0}
          alertCount={pendingWithdrawals}
          icon={ArrowUpCircle}
          accent={theme.danger}
          theme={theme}
          onClick={() => navigate("/admin/withdrawals")}
        />

        <StatCard
          label="Withdrawals (Rejected)"
          value={
            loading || filterLoading
              ? "..."
              : `₹${Number(stats?.last24h?.withdrawal?.rejected?.total ?? 0).toLocaleString("en-IN")}`
          }
          sub={`${stats?.last24h?.withdrawal?.rejected?.count ?? 0} rejected requests`}
          icon={AlertCircle}
          accent={theme.danger}
          theme={theme}
        />
      </div>

      {/* ─── 6. RECENT ACTIVITY STREAM & AUDIT LOG ────────────────────────── */}
      <div
        style={{
          background: theme.cardBg,
          border: `1px solid ${theme.border}`,
          borderRadius: 14,
          overflow: "hidden",
          boxShadow: isDark
            ? "0 8px 24px rgba(0,0,0,0.3)"
            : "0 2px 8px rgba(0,0,0,0.04)",
        }}
      >
        {/* Table Header Strip */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 24px",
            borderBottom: `1px solid ${theme.border}`,
            background: isDark ? theme.navbarBg : theme.secondaryButton,
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: theme.heading }}>
              Live Transactions & Requests
            </span>
            <span
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 11,
                padding: "2px 8px",
                borderRadius: 12,
                background: theme.cardBg,
                border: `1px solid ${theme.border}`,
                color: theme.mutedText,
              }}
            >
              {filteredActivityList.length} items
            </span>
          </div>

          <span
            style={{
              fontSize: 11,
              fontFamily: "'IBM Plex Mono', monospace",
              color: theme.mutedText,
            }}
          >
            {filteredActivityList.length
              ? `Showing ${(safePage - 1) * ACTIVITY_PAGE_SIZE + 1}–${Math.min(
                  safePage * ACTIVITY_PAGE_SIZE,
                  filteredActivityList.length
                )} of ${filteredActivityList.length}`
              : "No records found"}
          </span>
        </div>

        {/* Activity Row Items */}
        <div>
          {loading || filterLoading ? (
            <div
              style={{
                padding: "40px 20px",
                textAlign: "center",
                fontSize: 13,
                color: theme.mutedText,
                fontFamily: "'IBM Plex Mono', monospace",
              }}
            >
              Loading live transaction logs...
            </div>
          ) : !filteredActivityList.length ? (
            <div
              style={{
                padding: "48px 20px",
                textAlign: "center",
                color: theme.mutedText,
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: "50%",
                  background: theme.secondaryButton,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 12px",
                  color: theme.mutedText,
                }}
              >
                <Clock size={20} />
              </div>
              <div style={{ fontSize: 13, fontWeight: 500, color: theme.heading }}>
                No Activity Records Found
              </div>
              <div
                style={{
                  fontSize: 11,
                  fontFamily: "'IBM Plex Mono', monospace",
                  color: theme.mutedText,
                  marginTop: 4,
                }}
              >
                {beforeDate
                  ? `No operations recorded on or before ${beforeDate}`
                  : "New deposit and withdrawal requests will appear here in real-time."}
              </div>
            </div>
          ) : (
            pagedActivity.map((item) => {
              const isDeposit = item.type === "deposit";
              const isPending = item.status === "pending";
              const isApproved = item.status === "approved";

              const badgeBg = isApproved
                ? theme.successBg
                : isPending
                ? theme.warningBg
                : theme.dangerBg;

              const badgeColor = isApproved
                ? theme.success
                : isPending
                ? theme.warning
                : theme.danger;

              return (
                <div
                  key={item.id}
                  onClick={isPending ? () => goToRequest(item) : undefined}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "14px 24px",
                    borderBottom: `1px solid ${theme.border}`,
                    cursor: isPending ? "pointer" : "default",
                    background: isPending
                      ? theme.isDark
                        ? "rgba(251, 191, 36, 0.08)"
                        : "#fffdf0"
                      : "transparent",
                    transition: "background 0.15s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = isPending
                      ? theme.isDark
                        ? "rgba(251, 191, 36, 0.14)"
                        : "#fef9c3"
                      : theme.cardHover;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = isPending
                      ? theme.isDark
                        ? "rgba(251, 191, 36, 0.08)"
                        : "#fffdf0"
                      : "transparent";
                  }}
                >
                  {/* Left: Avatar + Details */}
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <div
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: 10,
                        background: isDeposit ? theme.successBg : theme.dangerBg,
                        color: isDeposit ? theme.success : theme.danger,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      {isDeposit ? <ArrowDownCircle size={20} /> : <ArrowUpCircle size={20} />}
                    </div>

                    <div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          marginBottom: 3,
                        }}
                      >
                        <span
                          style={{
                            fontSize: 13,
                            fontWeight: 600,
                            color: theme.heading,
                          }}
                        >
                          {item.user?.username || "Unknown Client"}
                        </span>
                        <span
                          style={{
                            fontSize: 10,
                            fontFamily: "'IBM Plex Mono', monospace",
                            textTransform: "uppercase",
                            padding: "2px 7px",
                            borderRadius: 4,
                            background: isDeposit ? theme.successBg : theme.dangerBg,
                            color: isDeposit ? theme.success : theme.danger,
                            fontWeight: 600,
                          }}
                        >
                          {isDeposit ? "Deposit" : "Withdrawal"}
                        </span>
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: theme.mutedText,
                          fontFamily: "'IBM Plex Mono', monospace",
                        }}
                      >
                        {item.user?.email || "No email"} · ID: {item.id?.slice(-6) || "—"}
                      </div>
                    </div>
                  </div>

                  {/* Right: Amount + Status + Action */}
                  <div style={{ textAlign: "right", display: "flex", alignItems: "center", gap: 16 }}>
                    <div>
                      <div
                        style={{
                          fontFamily: "'IBM Plex Mono', monospace",
                          fontSize: 15,
                          fontWeight: 700,
                          color: isDeposit ? theme.success : theme.heading,
                        }}
                      >
                        {isDeposit ? "+" : "-"}₹{Number(item.amount || 0).toLocaleString("en-IN", {
                          minimumFractionDigits: 2,
                        })}
                      </div>
                      <div
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6,
                          fontSize: 10,
                          fontFamily: "'IBM Plex Mono', monospace",
                          color: badgeColor,
                          textTransform: "capitalize",
                          fontWeight: 600,
                          marginTop: 2,
                        }}
                      >
                        <span
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: "50%",
                            background: badgeColor,
                            display: "inline-block",
                          }}
                        />
                        {item.status} · {new Date(item.createdAt).toLocaleTimeString("en-IN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>

                    {isPending && (
                      <div
                        style={{
                          padding: "6px 12px",
                          borderRadius: 6,
                          background: theme.warning,
                          color: "#ffffff",
                          fontSize: 11,
                          fontWeight: 600,
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                          boxShadow: `0 2px 8px ${theme.warning}44`,
                        }}
                      >
                        Review <ExternalLink size={12} />
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Pagination Footer */}
        {!loading && !filterLoading && filteredActivityList.length > ACTIVITY_PAGE_SIZE && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "14px 24px",
              borderTop: `1px solid ${theme.border}`,
              background: isDark ? theme.navbarBg : theme.secondaryButton,
            }}
          >
            <button
              onClick={() => setActivityPage((p) => Math.max(1, p - 1))}
              disabled={safePage === 1}
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 11,
                padding: "6px 14px",
                borderRadius: 6,
                border: `1px solid ${theme.border}`,
                background: safePage === 1 ? "transparent" : theme.cardBg,
                color: safePage === 1 ? theme.mutedText : theme.heading,
                cursor: safePage === 1 ? "not-allowed" : "pointer",
                opacity: safePage === 1 ? 0.5 : 1,
                fontWeight: 500,
              }}
            >
              ← Previous
            </button>

            <span
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 11,
                color: theme.mutedText,
              }}
            >
              Page {safePage} of {totalPages}
            </span>

            <button
              onClick={() => setActivityPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 11,
                padding: "6px 14px",
                borderRadius: 6,
                border: `1px solid ${theme.border}`,
                background: safePage === totalPages ? "transparent" : theme.cardBg,
                color: safePage === totalPages ? theme.mutedText : theme.heading,
                cursor: safePage === totalPages ? "not-allowed" : "pointer",
                opacity: safePage === totalPages ? 0.5 : 1,
                fontWeight: 500,
              }}
            >
              Next →
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes pulseDot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.35; transform: scale(0.8); }
        }
        @keyframes pulseIndicator {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.45; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default Dashboard;
