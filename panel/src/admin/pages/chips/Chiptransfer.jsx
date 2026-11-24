import React, { useEffect, useState, useRef, useMemo } from "react";
import {
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Search,
  X,
} from "lucide-react";
import { fetchChipDashboard, transferChips } from "../../services/Chipservice";

const ChipTransfer = () => {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form state
  const [toUserId, setToUserId] = useState("");
  const [type, setType] = useState("give");
  const [amount, setAmount] = useState("");
  const [remark, setRemark] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null); // { success, message }

  // Searchable user select state
  const [userSearch, setUserSearch] = useState("");
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const userSelectRef = useRef(null);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchChipDashboard();
      // console.log("Dashboard data:", res.data);
      setDashboard(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  // close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userSelectRef.current && !userSelectRef.current.contains(e.target)) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSubmit = async () => {
    if (!toUserId || !amount) {
      setResult({
        success: false,
        message: "Please select a user and enter amount",
      });
      return;
    }
    if (Number(amount) <= 0) {
      setResult({ success: false, message: "Amount must be greater than 0" });
      return;
    }

    try {
      setSubmitting(true);
      setResult(null);
      const res = await transferChips({
        toUserId,
        type,
        amount: Number(amount),
        remark,
      });
      setResult({ success: true, message: res.message, tx: res.transaction });
      setAmount("");
      setRemark("");
      // Reload dashboard to reflect new balances
      await loadDashboard();
    } catch (err) {
      setResult({
        success: false,
        message: err.response?.data?.message || "Transfer failed",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const selectedUser = dashboard?.downline?.find((u) => u.userId === toUserId);
  const myAvailable = dashboard?.me?.wallet?.availableBalance ?? 0;

  const fmt = (n) =>
    Number(n || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  // filtered list for the searchable dropdown
  const filteredUsers = useMemo(() => {
    const list = dashboard?.downline || [];
    if (!userSearch.trim()) return list;
    const q = userSearch.trim().toLowerCase();
    return list.filter(
      (u) =>
        u.username?.toLowerCase().includes(q) ||
        u.role?.toLowerCase().includes(q) ||
        u.userId?.toLowerCase().includes(q),
    );
  }, [dashboard, userSearch]);

  const handlePickUser = (u) => {
    setToUserId(u.userId);
    setUserSearch(u.username);
    setUserDropdownOpen(false);
  };

  const handleClearUser = () => {
    setToUserId("");
    setUserSearch("");
    setUserDropdownOpen(false);
  };

  return (
    <div style={s.page}>
      <style>{`
      .no-spinner::-webkit-outer-spin-button,
      .no-spinner::-webkit-inner-spin-button {
        -webkit-appearance: none;
        margin: 0;
      }
      .no-spinner[type=number] {
        -moz-appearance: textfield;
      }
    `}</style>
      {/* Header */}
      <div style={s.header}>
        <div>
          <h1 style={s.pageTitle}>Chip Transfer</h1>
          <p style={s.pageSub}>Give or take chips from your direct downline</p>
        </div>
      </div>

      <div style={s.layout}>
        {/* Left: Form */}
        <div style={s.card}>
          <div style={s.cardTitle}>Transfer Chips</div>

          {/* My balance info */}
          {dashboard && (
            <div style={s.myBalBox}>
              <div style={s.myBalItem}>
                <span style={s.myBalLabel}>My Balance</span>
                <span style={s.myBalValue}>
                  ₹ {fmt(dashboard.me.wallet.balance)}
                </span>
              </div>
              <div style={s.divider} />
              <div style={s.myBalItem}>
                <span style={s.myBalLabel}>Available</span>
                <span style={{ ...s.myBalValue, color: "#2d6a4f" }}>
                  ₹ {fmt(myAvailable)}
                </span>
              </div>
            </div>
          )}

          {/* Type toggle */}
          <div style={s.field}>
            <label style={s.label}>Transfer Type</label>
            <div style={s.typeToggle}>
              <button
                style={{
                  ...s.typeBtn,
                  ...(type === "give" ? s.typeBtnActive : {}),
                }}
                onClick={() => setType("give")}
              >
                <ArrowUpRight size={14} />
                Deposit
              </button>
              <button
                style={{
                  ...s.typeBtn,
                  ...(type === "take" ? s.typeBtnActiveRed : {}),
                }}
                onClick={() => setType("take")}
              >
                <ArrowDownLeft size={14} />
                Withdraw
              </button>
            </div>
          </div>

          {/* Select downline user — searchable */}
          <div style={s.field} ref={userSelectRef}>
            <label style={s.label}>Select User</label>
            {loading ? (
              <div style={s.selectPlaceholder}>Loading users...</div>
            ) : (
              <div style={s.comboWrap}>
                <div style={s.comboInputWrap}>
                  <Search size={13} style={s.comboSearchIcon} />
                  <input
                    type="text"
                    style={s.comboInput}
                    placeholder="Search by username or role…"
                    value={userSearch}
                    onFocus={() => setUserDropdownOpen(true)}
                    onChange={(e) => {
                      setUserSearch(e.target.value);
                      setUserDropdownOpen(true);
                      if (toUserId) setToUserId(""); // typing invalidates prior selection
                    }}
                  />
                  {(userSearch || toUserId) && (
                    <button
                      type="button"
                      style={s.comboClearBtn}
                      onClick={handleClearUser}
                      aria-label="Clear selected user"
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>

                {userDropdownOpen && (
                  <div style={s.comboDropdown}>
                    {filteredUsers.length === 0 ? (
                      <div style={s.comboEmpty}>No users found</div>
                    ) : (
                      filteredUsers.map((u) => (
                        <div
                          key={u.userId}
                          style={{
                            ...s.comboRow,
                            ...(toUserId === u.userId ? s.comboRowActive : {}),
                          }}
                          onClick={() => handlePickUser(u)}
                        >
                          <div>
                            <div style={s.comboRowName}>{u.username}</div>
                            <div style={s.comboRowRole}>
                              {u.role?.toUpperCase()}
                            </div>
                          </div>
                          <div style={{ ...s.mono, textAlign: "right" }}>
                            ₹ {fmt(u.availableBalance)} avail.
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Selected user info */}
          {selectedUser && (
            <div style={s.userInfoBox}>
              <div style={s.userInfoRow}>
                <span style={s.userInfoLabel}>Balance</span>
                <span style={s.mono}>₹ {fmt(selectedUser.balance)}</span>
              </div>
              <div style={s.userInfoRow}>
                <span style={s.userInfoLabel}>Exposure</span>
                <span style={{ ...s.mono, color: "#c0392b" }}>
                  ₹ {fmt(selectedUser.exposure)}
                </span>
              </div>
              <div style={s.userInfoRow}>
                <span style={s.userInfoLabel}>Available</span>
                <span style={{ ...s.mono, color: "#2d6a4f" }}>
                  ₹ {fmt(selectedUser.availableBalance)}
                </span>
              </div>
            </div>
          )}

          {/* Amount */}
          <div style={s.field}>
            <label style={s.label}>Amount (₹)</label>
            <input
              type="number"
              min="1"
              placeholder="Enter amount"
              style={s.input}
              className="no-spinner"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>

          {/* Quick amounts */}
          <div style={s.quickAmounts}>
            {[500, 1000, 5000, 10000, 50000].map((v) => (
              <button
                key={v}
                style={s.quickBtn}
                onClick={() => setAmount(String(v))}
              >
                ₹{v.toLocaleString("en-IN")}
              </button>
            ))}
          </div>

          {/* Remark */}
          <div style={s.field}>
            <label style={s.label}>Remark (optional)</label>
            <input
              type="text"
              placeholder="Add a note..."
              style={s.input}
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
            />
          </div>

          {/* Result message */}
          {result && (
            <div
              style={{
                ...s.resultBox,
                ...(result.success ? s.resultSuccess : s.resultError),
              }}
            >
              {result.success ? (
                <CheckCircle size={14} />
              ) : (
                <AlertCircle size={14} />
              )}
              <span>{result.message}</span>
            </div>
          )}

          {/* Submit */}
          <button
            style={{
              ...s.submitBtn,
              ...(type === "take" ? s.submitBtnRed : {}),
            }}
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <RefreshCw
                size={14}
                style={{ animation: "spin 1s linear infinite" }}
              />
            ) : type === "give" ? (
              <ArrowUpRight size={14} />
            ) : (
              <ArrowDownLeft size={14} />
            )}
            {submitting
              ? "Processing..."
              : type === "give"
                ? "Give Chips"
                : "Take Chips"}
          </button>
        </div>

        {/* Right: Downline summary */}
        <div style={s.card}>
          <div style={s.cardTitle}>Downline Summary</div>
          {loading ? (
            <div style={s.centered}>
              <RefreshCw size={16} style={{ color: "#b0aea6" }} />
            </div>
          ) : dashboard?.downline?.length === 0 ? (
            <div style={s.centered}>
              <span style={{ color: "#b0aea6", fontSize: "13px" }}>
                No downline users
              </span>
            </div>
          ) : (
            <div style={s.userList}>
              {dashboard?.downline?.map((u) => (
                <div
                  key={u.userId}
                  style={{
                    ...s.userCard,
                    ...(toUserId === u.userId ? s.userCardSelected : {}),
                  }}
                  onClick={() => handlePickUser(u)}
                >
                  <div style={s.userCardTop}>
                    <div style={s.userAvatar}>
                      {u.username?.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div style={s.userName}>{u.username}</div>
                      <div style={s.userRole}>{u.role?.toUpperCase()}</div>
                    </div>
                    <div style={{ marginLeft: "auto" }}>
                      <StatusDot status={u.status} />
                    </div>
                  </div>
                  <div style={s.userCardStats}>
                    <div style={s.userStat}>
                      <span style={s.userStatLabel}>Balance</span>
                      <span style={s.mono}>₹ {fmt(u.balance)}</span>
                    </div>
                    <div style={s.userStat}>
                      <span style={s.userStatLabel}>Available</span>
                      <span style={{ ...s.mono, color: "#2d6a4f" }}>
                        ₹ {fmt(u.availableBalance)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const StatusDot = ({ status }) => (
  <span
    style={{
      display: "inline-block",
      width: "7px",
      height: "7px",
      borderRadius: "50%",
      background: status === "active" ? "#2d6a4f" : "#c0392b",
    }}
  />
);

const fmt = (n) =>
  Number(n || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const s = {
  page: {
    padding: "24px 28px",
    fontFamily: "'IBM Plex Sans', sans-serif",
    maxWidth: "1200px",
    color: "var(--admin-body-text)",
  },
  header: { marginBottom: "24px" },
  pageTitle: { fontSize: "24px", fontWeight: 700, color: "var(--admin-heading)", margin: 0, letterSpacing: "-0.02em" },
  pageSub: {
    fontSize: "12px",
    color: "var(--admin-muted-text)",
    marginTop: "4px",
    fontFamily: "'IBM Plex Mono', monospace",
  },
  layout: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" },
  card: {
    background: "var(--admin-card-bg)",
    border: "1px solid var(--admin-border)",
    borderRadius: "12px",
    padding: "22px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
  },
  cardTitle: {
    fontSize: "14px",
    fontWeight: 600,
    color: "var(--admin-heading)",
    marginBottom: "16px",
    paddingBottom: "12px",
    borderBottom: "1px solid var(--admin-border)",
  },
  myBalBox: {
    display: "flex",
    gap: "0",
    background: "var(--admin-sidebar-bg)",
    border: "1px solid var(--admin-border)",
    borderRadius: "10px",
    padding: "14px 18px",
    marginBottom: "18px",
  },
  myBalItem: { flex: 1, display: "flex", flexDirection: "column", gap: "4px" },
  myBalLabel: {
    fontSize: "10px",
    color: "var(--admin-muted-text)",
    fontFamily: "'IBM Plex Mono', monospace",
    fontWeight: 600,
    textTransform: "uppercase",
  },
  myBalValue: { fontSize: "18px", fontWeight: 700, color: "var(--admin-heading)" },
  divider: { width: "1px", background: "var(--admin-border)", margin: "0 16px" },
  field: { marginBottom: "16px", position: "relative" },
  label: {
    display: "block",
    fontSize: "11px",
    fontFamily: "'IBM Plex Mono', monospace",
    color: "var(--admin-muted-text)",
    marginBottom: "6px",
    letterSpacing: "0.04em",
    fontWeight: 600,
    textTransform: "uppercase",
  },
  typeToggle: { display: "flex", gap: "8px" },
  typeBtn: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px",
    padding: "10px",
    borderRadius: "8px",
    border: "1px solid var(--admin-border)",
    background: "var(--admin-secondary-btn)",
    cursor: "pointer",
    fontSize: "12px",
    color: "var(--admin-secondary-text)",
    fontFamily: "'IBM Plex Sans', sans-serif",
    fontWeight: 600,
    transition: "all 0.15s",
  },
  typeBtnActive: {
    background: "var(--admin-primary-btn)",
    color: "var(--admin-btn-text)",
    border: "1px solid var(--admin-primary-btn)",
  },
  typeBtnActiveRed: {
    background: "var(--admin-danger)",
    color: "#fff",
    border: "1px solid var(--admin-danger)",
  },
  select: {
    width: "100%",
    padding: "10px 14px",
    borderRadius: "8px",
    border: "1px solid var(--admin-input-border)",
    background: "var(--admin-input-bg)",
    fontSize: "12px",
    color: "var(--admin-body-text)",
    fontFamily: "'IBM Plex Sans', sans-serif",
    outline: "none",
    cursor: "pointer",
  },
  selectPlaceholder: {
    padding: "10px 14px",
    borderRadius: "8px",
    border: "1px solid var(--admin-border)",
    background: "var(--admin-card-hover)",
    fontSize: "12px",
    color: "var(--admin-muted-text)",
  },

  // searchable combobox
  comboWrap: { position: "relative" },
  comboInputWrap: {
    position: "relative",
    display: "flex",
    alignItems: "center",
  },
  comboSearchIcon: {
    position: "absolute",
    left: "10px",
    color: "var(--admin-muted-text)",
    pointerEvents: "none",
  },
  comboInput: {
    width: "100%",
    padding: "10px 32px 10px 32px",
    borderRadius: "8px",
    border: "1px solid var(--admin-input-border)",
    background: "var(--admin-input-bg)",
    fontSize: "12px",
    color: "var(--admin-body-text)",
    fontFamily: "'IBM Plex Sans', sans-serif",
    outline: "none",
    boxSizing: "border-box",
  },
  comboClearBtn: {
    position: "absolute",
    right: "8px",
    background: "transparent",
    border: "none",
    color: "var(--admin-muted-text)",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    padding: "2px",
  },
  comboDropdown: {
    position: "absolute",
    top: "calc(100% + 4px)",
    left: 0,
    right: 0,
    background: "var(--admin-card-bg)",
    border: "1px solid var(--admin-border)",
    borderRadius: "10px",
    maxHeight: "260px",
    overflowY: "auto",
    zIndex: 30,
    boxShadow: "0 10px 25px rgba(0,0,0,0.25)",
  },
  comboEmpty: {
    padding: "14px 12px",
    fontSize: "12px",
    color: "var(--admin-muted-text)",
    textAlign: "center",
    fontFamily: "'IBM Plex Mono', monospace",
  },
  comboRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "10px 14px",
    borderBottom: "1px solid var(--admin-border)",
    cursor: "pointer",
  },
  comboRowActive: { background: "var(--admin-card-hover)" },
  comboRowName: { fontSize: "13px", fontWeight: 600, color: "var(--admin-heading)" },
  comboRowRole: {
    fontSize: "10px",
    color: "var(--admin-muted-text)",
    fontFamily: "'IBM Plex Mono', monospace",
    marginTop: "2px",
    letterSpacing: "0.04em",
  },

  userInfoBox: {
    background: "var(--admin-card-hover)",
    border: "1px solid var(--admin-border)",
    borderRadius: "8px",
    padding: "12px 14px",
    marginBottom: "16px",
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  userInfoRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  userInfoLabel: {
    fontSize: "11px",
    color: "var(--admin-muted-text)",
    fontFamily: "'IBM Plex Mono', monospace",
  },
  input: {
    width: "100%",
    padding: "10px 14px",
    borderRadius: "8px",
    border: "1px solid var(--admin-input-border)",
    background: "var(--admin-input-bg)",
    fontSize: "13px",
    color: "var(--admin-body-text)",
    fontFamily: "'IBM Plex Sans', sans-serif",
    outline: "none",
    boxSizing: "border-box",
  },
  quickAmounts: {
    display: "flex",
    gap: "6px",
    flexWrap: "wrap",
    marginBottom: "16px",
  },
  quickBtn: {
    padding: "6px 12px",
    borderRadius: "6px",
    border: "1px solid var(--admin-border)",
    background: "var(--admin-secondary-btn)",
    fontSize: "11px",
    cursor: "pointer",
    color: "var(--admin-secondary-text)",
    fontFamily: "'IBM Plex Mono', monospace",
    fontWeight: 600,
  },
  resultBox: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "10px 14px",
    borderRadius: "8px",
    marginBottom: "16px",
    fontSize: "12px",
  },
  resultSuccess: {
    background: "var(--admin-success-bg)",
    color: "var(--admin-success)",
    border: "1px solid var(--admin-success)",
  },
  resultError: {
    background: "var(--admin-danger-bg)",
    color: "var(--admin-danger)",
    border: "1px solid var(--admin-danger)",
  },
  submitBtn: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    padding: "12px",
    borderRadius: "8px",
    border: "none",
    background: "var(--admin-primary-btn)",
    color: "var(--admin-btn-text)",
    fontSize: "13px",
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "'IBM Plex Sans', sans-serif",
    transition: "opacity 0.12s",
  },
  submitBtnRed: { background: "var(--admin-danger)", color: "#fff" },
  userList: { display: "flex", flexDirection: "column", gap: "8px" },
  userCard: {
    border: "1px solid var(--admin-border)",
    background: "var(--admin-card-bg)",
    borderRadius: "10px",
    padding: "14px",
    cursor: "pointer",
    transition: "border-color 0.12s, background 0.12s",
  },
  userCardSelected: { border: "2px solid var(--admin-primary-btn)", background: "var(--admin-card-hover)" },
  userCardTop: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: "10px",
  },
  userAvatar: {
    width: "34px",
    height: "34px",
    borderRadius: "8px",
    background: "var(--admin-primary-btn)",
    color: "var(--admin-btn-text)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: "11px",
    fontWeight: 600,
    flexShrink: 0,
  },
  userName: { fontSize: "13px", fontWeight: 600, color: "var(--admin-heading)" },
  userRole: {
    fontSize: "10px",
    color: "var(--admin-muted-text)",
    fontFamily: "'IBM Plex Mono', monospace",
    letterSpacing: "0.06em",
    marginTop: "2px",
  },
  userCardStats: { display: "flex", gap: "16px" },
  userStat: { display: "flex", flexDirection: "column", gap: "3px" },
  userStatLabel: {
    fontSize: "10px",
    color: "var(--admin-muted-text)",
    fontFamily: "'IBM Plex Mono', monospace",
  },
  mono: {
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: "12px",
    color: "var(--admin-heading)",
  },
  centered: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "40px",
  },
};

export default ChipTransfer;
