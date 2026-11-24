import React, { useMemo } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const wallet = user?.wallet || {};
  const stats = user?.stats || {};

  const net = useMemo(() => {
    return (wallet.totalProfit ?? 0) - (wallet.totalLoss ?? 0);
  }, [wallet]);

  const winRate = useMemo(() => {
    if (!stats.totalBets) return 0;
    return ((stats.totalWins / stats.totalBets) * 100).toFixed(1);
  }, [stats]);

  const formatCurrency = (num) =>
    new Intl.NumberFormat("en-IN").format(num);

  return (
    <div
      className="dashboard"
      style={{
        minHeight: "100vh",
        background: "#f9fafb",
        padding: "24px",
        display: "flex",
        flexDirection: "column",
        gap: "20px",
      }}
    >
      {/* HEADER */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "10px",
        }}
      >
        <h2 style={{ fontSize: "22px", fontWeight: "600" }}>
          👋 Welcome back,{" "}
          <span style={{ color: "#2563eb" }}>{user?.username}</span>
        </h2>

        <div style={{ display: "flex", gap: "10px" }}>
          {user?.permissions?.canDeposit && (
            <button
              className="deposit"
              style={{
                background: "#16a34a",
                color: "#fff",
                padding: "10px 16px",
                borderRadius: "8px",
                border: "none",
                cursor: "pointer",
                boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
              }}
              onClick={() => navigate("/deposit")}
            >
              + Deposit
            </button>
          )}

          {user?.permissions?.canWithdraw && (
            <button
              className="withdraw"
              style={{
                background: "#dc2626",
                color: "#fff",
                padding: "10px 16px",
                borderRadius: "8px",
                border: "none",
                cursor: "pointer",
                boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
              }}
              onClick={() => navigate("/withdraw")}
            >
              Withdraw
            </button>
          )}
        </div>
      </div>

      {/* CARDS */}
      <div
        className="cards"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "16px",
        }}
      >
        {[
          { label: "Balance", value: wallet.balance, bg: "#1f2937" },
          { label: "Available", value: wallet.availableBalance, bg: "#1f2937" },
          { label: "Exposure", value: wallet.exposure, bg: "#1f2937" },
          {
            label: "Net P/L",
            value: net,
            bg: net >= 0 ? "#16a34a" : "#dc2626",
            isNet: true,
          },
        ].map((item, i) => (
          <div
            key={i}
            className="card"
            style={{
              background: item.bg,
              color: "#fff",
              padding: "18px",
              borderRadius: "14px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
            }}
          >
            <p style={{ fontSize: "13px", opacity: 0.8 }}>
              {item.label}
            </p>
            <h3 style={{ fontSize: "20px", fontWeight: "600" }}>
              ₹ {formatCurrency(item.value ?? 0)}
              {item.isNet && (
                <span style={{ marginLeft: "6px", fontSize: "14px" }}>
                  {net >= 0 ? "▲" : "▼"}
                </span>
              )}
            </h3>
          </div>
        ))}
      </div>

      {/* PERFORMANCE + INSIGHTS */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "2fr 1fr",
          gap: "16px",
        }}
      >
        {/* PERFORMANCE */}
        <div
          style={{
            background: "#fff",
            borderRadius: "14px",
            padding: "18px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
          }}
        >
          <h3 style={{ marginBottom: "14px", fontWeight: "600" }}>
            Performance Overview
          </h3>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              textAlign: "center",
              gap: "10px",
            }}
          >
            <div>
              <p style={{ fontSize: "12px", color: "#6b7280" }}>Total Bets</p>
              <h4>{stats.totalBets ?? 0}</h4>
            </div>

            <div>
              <p style={{ fontSize: "12px", color: "#6b7280" }}>Wins</p>
              <h4 style={{ color: "green" }}>{stats.totalWins ?? 0}</h4>
            </div>

            <div>
              <p style={{ fontSize: "12px", color: "#6b7280" }}>Losses</p>
              <h4 style={{ color: "red" }}>{stats.totalLosses ?? 0}</h4>
            </div>

            <div>
              <p style={{ fontSize: "12px", color: "#6b7280" }}>Win Rate</p>
              <h4>{winRate}%</h4>
            </div>
          </div>

          {/* PROGRESS BAR */}
          <div style={{ marginTop: "16px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "12px",
                color: "#6b7280",
              }}
            >
              <span>Win Rate</span>
              <span>{winRate}%</span>
            </div>

            <div
              style={{
                width: "100%",
                height: "6px",
                background: "#e5e7eb",
                borderRadius: "6px",
                marginTop: "6px",
              }}
            >
              <div
                style={{
                  width: `${winRate}%`,
                  height: "6px",
                  background: "#22c55e",
                  borderRadius: "6px",
                }}
              />
            </div>
          </div>
        </div>

        {/* INSIGHTS */}
        <div
          style={{
            background: "#fff",
            borderRadius: "14px",
            padding: "18px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
          }}
        >
          <h3 style={{ marginBottom: "14px", fontWeight: "600" }}>
            Quick Insights
          </h3>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Profit</span>
              <span style={{ color: "green" }}>
                ₹ {formatCurrency(wallet.totalProfit ?? 0)}
              </span>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Loss</span>
              <span style={{ color: "red" }}>
                ₹ {formatCurrency(wallet.totalLoss ?? 0)}
              </span>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontWeight: "600",
              }}
            >
              <span>Net</span>
              <span style={{ color: net >= 0 ? "green" : "red" }}>
                ₹ {formatCurrency(net)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* EMPTY STATE */}
      <div
        style={{
          background: "#fff",
          borderRadius: "14px",
          padding: "20px",
          textAlign: "center",
          boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
        }}
      >
        <h4>No recent activity</h4>
        <p style={{ fontSize: "14px", color: "#6b7280" }}>
          Your recent bets and transactions will appear here.
        </p>
      </div>
    </div>
  );
};

export default Dashboard;