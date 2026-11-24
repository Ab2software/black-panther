import React, { useState, useEffect } from "react";
import {
  X,
  User,
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  History,
  LogOut,
  ShieldCheck,
  Award,
  Sparkles,
  ExternalLink,
  Clock,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { fetchUserBets } from "../../services/sportsService";
import { getTransactions } from "../../services/walletService";

export default function AccountModal({ isOpen = true, onClose, onOpenDeposit, onOpenWithdraw }) {
  const { user, wallet, isDemo, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [bets, setBets] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      loadHistory();
    }
  }, [isOpen, user]);

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

  if (!isOpen || !user) return null;

  const currentBalance = wallet?.balance ?? (isDemo ? 10000 : 50000);
  const exposure = wallet?.exposure ?? 0;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0, 0, 0, 0.8)",
        backdropFilter: "blur(6px)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#0c111a",
          border: "1px solid rgba(212, 175, 55, 0.3)",
          borderRadius: "18px",
          width: "100%",
          maxWidth: "580px",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          boxShadow: "0 24px 60px rgba(0, 0, 0, 0.85)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "14px 16px",
            background: "linear-gradient(180deg, rgba(212, 175, 55, 0.08) 0%, rgba(0, 0, 0, 0) 100%)",
            borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "12px",
                background: "linear-gradient(135deg, #d4af37 0%, #a98518 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#0a0a0a",
                fontWeight: 800,
                fontSize: "18px",
              }}
            >
              {user.username?.charAt(0).toUpperCase() || "U"}
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <h3 style={{ margin: 0, fontSize: "17px", fontWeight: 800, color: "#ffffff" }}>
                  {user.username}
                </h3>
                {isDemo ? (
                  <span
                    style={{
                      background: "rgba(234, 179, 8, 0.15)",
                      border: "1px solid rgba(234, 179, 8, 0.4)",
                      color: "#facc15",
                      fontSize: "11px",
                      fontWeight: 700,
                      padding: "2px 8px",
                      borderRadius: "6px",
                    }}
                  >
                    DEMO USER
                  </span>
                ) : (
                  <span
                    style={{
                      background: "rgba(34, 197, 94, 0.15)",
                      border: "1px solid rgba(34, 197, 94, 0.4)",
                      color: "#4ade80",
                      fontSize: "11px",
                      fontWeight: 700,
                      padding: "2px 8px",
                      borderRadius: "6px",
                    }}
                  >
                    VERIFIED PLAYER
                  </span>
                )}
              </div>
              <span style={{ fontSize: "12px", color: "#94a3b8" }}>
                Role: Player • Panther ID: #{user.id || user._id || "7"}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "#94a3b8",
              cursor: "pointer",
              padding: "6px",
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Balance Stats Bar */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "10px",
            padding: "12px 16px",
            background: "rgba(255, 255, 255, 0.02)",
            borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
          }}
        >
          <div
            style={{
              background: "#121824",
              borderRadius: "10px",
              padding: "10px 14px",
              border: "1px solid rgba(255, 255, 255, 0.06)",
            }}
          >
            <div style={{ fontSize: "10.5px", color: "#94a3b8", fontWeight: 700, textTransform: "uppercase" }}>
              Available Balance
            </div>
            <div style={{ fontSize: "17px", fontWeight: 800, color: "#d4af37", marginTop: "2px" }}>
              ₹{currentBalance.toLocaleString()}
            </div>
          </div>

          <div
            style={{
              background: "#121824",
              borderRadius: "10px",
              padding: "10px 14px",
              border: "1px solid rgba(255, 255, 255, 0.06)",
            }}
          >
            <div style={{ fontSize: "10.5px", color: "#94a3b8", fontWeight: 700, textTransform: "uppercase" }}>
              Total Exposure
            </div>
            <div style={{ fontSize: "17px", fontWeight: 800, color: "#f87171", marginTop: "2px" }}>
              ₹{exposure.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Quick Deposit & Withdraw Buttons */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "8px",
            padding: "10px 16px",
            borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
          }}
        >
          <button
            type="button"
            onClick={() => {
              onClose();
              if (onOpenDeposit) onOpenDeposit();
            }}
            style={{
              padding: "10px",
              background: "linear-gradient(135deg, #16a34a 0%, #15803d 100%)",
              border: "none",
              borderRadius: "8px",
              color: "#ffffff",
              fontSize: "13px",
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
            }}
          >
            <ArrowDownLeft size={16} /> Deposit Funds
          </button>

          <button
            type="button"
            onClick={() => {
              onClose();
              if (onOpenWithdraw) onOpenWithdraw();
            }}
            style={{
              padding: "10px",
              background: "rgba(255, 255, 255, 0.06)",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              borderRadius: "8px",
              color: "#ffffff",
              fontSize: "13px",
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
            }}
          >
            <ArrowUpRight size={16} /> Withdraw
          </button>
        </div>

        {/* Navigation Tabs */}
        <div
          style={{
            display: "flex",
            borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
            padding: "0 24px",
            background: "rgba(0, 0, 0, 0.2)",
          }}
        >
          {[
            { id: "overview", label: "Overview" },
            { id: "bets", label: `My Bets (${bets.length})` },
            { id: "ledger", label: "Transactions" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: "12px 16px",
                background: "none",
                border: "none",
                borderBottom: activeTab === tab.id ? "2px solid #d4af37" : "2px solid transparent",
                color: activeTab === tab.id ? "#d4af37" : "#94a3b8",
                fontSize: "13px",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div style={{ padding: "20px 24px", overflowY: "auto", flex: 1 }}>
          {activeTab === "overview" && (
            <div>
              <div
                style={{
                  background: "#121824",
                  borderRadius: "12px",
                  padding: "16px",
                  marginBottom: "16px",
                  border: "1px solid rgba(255, 255, 255, 0.06)",
                }}
              >
                <h4 style={{ margin: "0 0 12px 0", fontSize: "14px", color: "#f8fafc" }}>
                  Account Details
                </h4>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "13px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#94a3b8" }}>Account Type</span>
                    <span style={{ color: "#ffffff", fontWeight: 600 }}>
                      {isDemo ? "Demo Trial Account" : "Real Money Player"}
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#94a3b8" }}>Assigned Agent</span>
                    <span style={{ color: "#ffffff", fontWeight: 600 }}>agent_test</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#94a3b8" }}>Commission Rate</span>
                    <span style={{ color: "#4ade80", fontWeight: 700 }}>0% Zero Brokerage</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#94a3b8" }}>Security Level</span>
                    <span style={{ color: "#60a5fa", fontWeight: 600 }}>256-Bit SSL Encrypted</span>
                  </div>
                </div>
              </div>

              {isDemo && (
                <div
                  style={{
                    padding: "14px",
                    background: "rgba(212, 175, 55, 0.1)",
                    border: "1px solid rgba(212, 175, 55, 0.25)",
                    borderRadius: "10px",
                    color: "#fef08a",
                    fontSize: "12px",
                    lineHeight: 1.5,
                  }}
                >
                  💡 <strong>Demo Mode Active:</strong> You are playing with ₹10,000 free risk-free credits.
                  To deposit real INR and win real cash, sign in with player credentials (<code>player_test</code>).
                </div>
              )}
            </div>
          )}

          {activeTab === "bets" && (
            <div>
              {(!Array.isArray(bets) || bets.length === 0) ? (
                <div style={{ textAlign: "center", padding: "30px 10px", color: "#64748b" }}>
                  <Clock size={32} style={{ marginBottom: "8px", opacity: 0.5 }} />
                  <div>No bets placed yet.</div>
                  <div style={{ fontSize: "12px", marginTop: "4px" }}>
                    Choose Back or Lay on any live match to place your first bet!
                  </div>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {(Array.isArray(bets) ? bets : []).map((bet, idx) => (
                    <div
                      key={bet._id || idx}
                      style={{
                        padding: "12px 14px",
                        background: "#121824",
                        borderRadius: "10px",
                        border: `1px solid ${bet.side === "back" ? "rgba(114, 187, 239, 0.3)" : "rgba(250, 169, 186, 0.3)"}`,
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span
                          style={{
                            padding: "2px 8px",
                            borderRadius: "4px",
                            background: bet.side === "back" ? "#72bbef" : "#faa9ba",
                            color: bet.side === "back" ? "#061f36" : "#380d17",
                            fontSize: "11px",
                            fontWeight: 800,
                          }}
                        >
                          {bet.side?.toUpperCase()}
                        </span>
                        <span style={{ fontSize: "12px", color: "#94a3b8" }}>
                          Odds: <strong>{bet.price || bet.rate}</strong>
                        </span>
                      </div>
                      <div style={{ fontSize: "14px", fontWeight: 700, color: "#ffffff", marginTop: "6px" }}>
                        {bet.selectionName || bet.sectionTeam || "Selection"}
                      </div>
                      <div style={{ fontSize: "11px", color: "#64748b" }}>{bet.matchName}</div>

                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          marginTop: "8px",
                          paddingTop: "8px",
                          borderTop: "1px solid rgba(255, 255, 255, 0.05)",
                          fontSize: "12px",
                        }}
                      >
                        <span style={{ color: "#94a3b8" }}>
                          Stake: <strong>₹{bet.stake?.toLocaleString()}</strong>
                        </span>
                        <span style={{ color: "#4ade80", fontWeight: 700 }}>
                          Profit: +₹{((bet.potentialProfit || bet.stake * ((bet.price || 2) - 1)) || 0).toFixed(0)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "ledger" && (
            <div>
              {transactions.length === 0 ? (
                <div style={{ textAlign: "center", padding: "30px 10px", color: "#64748b" }}>
                  <History size={32} style={{ marginBottom: "8px", opacity: 0.5 }} />
                  <div>No transaction history recorded yet.</div>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {transactions.map((tx, idx) => (
                    <div
                      key={tx._id || idx}
                      style={{
                        padding: "10px 14px",
                        background: "#121824",
                        borderRadius: "8px",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <div>
                        <div style={{ fontSize: "13px", fontWeight: 700, color: "#ffffff" }}>
                          {tx.type === "deposit" ? "Deposit" : "Withdrawal"}
                        </div>
                        <div style={{ fontSize: "11px", color: "#64748b" }}>
                          {new Date(tx.createdAt || Date.now()).toLocaleDateString()}
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div
                          style={{
                            fontSize: "14px",
                            fontWeight: 800,
                            color: tx.type === "deposit" ? "#4ade80" : "#f87171",
                          }}
                        >
                          {tx.type === "deposit" ? "+" : "-"}₹{tx.amount?.toLocaleString()}
                        </div>
                        <div style={{ fontSize: "10px", color: "#94a3b8", textTransform: "uppercase" }}>
                          {tx.status || "APPROVED"}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Logout Button */}
        <div
          style={{
            padding: "14px 24px",
            background: "rgba(0, 0, 0, 0.4)",
            borderTop: "1px solid rgba(255, 255, 255, 0.08)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span style={{ fontSize: "12px", color: "#64748b" }}>Black Panther Exchange v2.0</span>
          <button
            type="button"
            onClick={() => {
              logout();
              onClose();
            }}
            style={{
              padding: "8px 16px",
              background: "rgba(239, 68, 68, 0.15)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              borderRadius: "8px",
              color: "#f87171",
              fontSize: "13px",
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <LogOut size={15} /> Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}

