import React, { useState, useEffect, useCallback } from "react";
import {
  getClients,
  getClientStats,
  updateClientStatus,
  updateClientPermissions,
  updateBettingLimits,
  updateClientPassword,
  deleteClient,
  createUser,
} from "../../services/adminClientService";
import { getSubAdmins, reassignUser } from "../../services/subAdminService";
import { transferChips } from "../../services/Chipservice";
import { useAdminAuth } from "../../context/AdminAuthContext";
import { useNavigate } from "react-router-dom";
// ─── UTILS ────────────────────────────────────────────────
// All currency values are shown with 2 decimal places, whether abbreviated
// (L/k) or shown in full — for consistency across the table, drawer, and
// stat cards.
const fmt = (n) => {
  const num = Number(n) || 0;
  return num >= 1_00_000
    ? `₹${(num / 1_00_000).toFixed(2)}L`
    : num >= 1_000
      ? `₹${(num / 1_000).toFixed(2)}k`
      : `₹${num.toFixed(2)}`;
};

const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

const statusColors = {
  active: { bg: "var(--admin-success-bg)", color: "var(--admin-success)", dot: "var(--admin-success)" },
  blocked: { bg: "var(--admin-danger-bg)", color: "var(--admin-danger)", dot: "var(--admin-danger)" },
  suspended: { bg: "var(--admin-warning-bg)", color: "var(--admin-warning)", dot: "var(--admin-warning)" },
};

// ─── SMALL COMPONENTS ─────────────────────────────────────
const StatusBadge = ({ status }) => {
  const sc = statusColors[status] || statusColors.active;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        background: sc.bg,
        color: sc.color,
        fontSize: 11,
        fontFamily: "'IBM Plex Mono', monospace",
        fontWeight: 500,
        padding: "3px 8px",
        borderRadius: 4,
        letterSpacing: "0.04em",
      }}
    >
      <span
        style={{
          width: 5,
          height: 5,
          borderRadius: "50%",
          background: sc.dot,
          display: "inline-block",
        }}
      />
      {status}
    </span>
  );
};

const StatCard = ({ label, value, sub, accent }) => (
  <div style={s.statCard}>
    <div
      style={{
        width: 3,
        height: 28,
        background: accent || "#111110",
        borderRadius: 2,
        flexShrink: 0,
      }}
    />
    <div>
      <div style={s.statLabel}>{label}</div>
      <div style={s.statValue}>{value ?? "—"}</div>
      {sub && <div style={s.statSub}>{sub}</div>}
    </div>
  </div>
);

const Spinner = () => (
  <div style={s.spinnerWrap}>
    <div style={s.spinner} />
  </div>
);

const Toast = ({ msg, type, onClose }) => {
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div
      style={{
        ...s.toast,
        background: type === "error" ? "#fdf2f2" : "#eaf3de",
        borderColor: type === "error" ? "#f0d0d0" : "#c0dd97",
        color: type === "error" ? "#a93226" : "#3b6d11",
      }}
    >
      {msg}
    </div>
  );
};

// ─── DETAIL DRAWER ────────────────────────────────────────
const DetailDrawer = ({ user, onClose, onRefresh, showToast }) => {
  const [permLoading, setPermLoading] = useState(false);
  const [limLoading, setLimLoading] = useState(false);
  const [perms, setPerms] = useState(user.permissions || {});
  const [limits, setLimits] = useState(user.bettingLimits || {});
  const [newPassword, setNewPassword] = useState("");
  const [pwLoading, setPwLoading] = useState(false);

  const { admin: currentAdmin } = useAdminAuth();
  const [allAdmins, setAllAdmins] = useState([]);
  const [selectedAdminId, setSelectedAdminId] = useState(
    user.assignedAdmin || "",
  );
  const [reassigning, setReassigning] = useState(false);

  useEffect(() => {
    if (currentAdmin?.role === "superadmin") {
      getSubAdmins().then((res) => {
        if (res.success) setAllAdmins(res.data);
      });
    }
  }, [currentAdmin]);
  const handlePasswordChange = async () => {
    if (!newPassword.trim() || newPassword.trim().length < 6) {
      showToast("Password must be at least 6 characters", "error");
      return;
    }
    setPwLoading(true);
    try {
      await updateClientPassword(user._id, newPassword.trim());
      showToast("Password updated successfully", "success");
      setNewPassword("");
    } catch (err) {
      showToast(
        err?.response?.data?.message || "Failed to update password",
        "error",
      );
    } finally {
      setPwLoading(false);
    }
  };
  const handleReassign = async () => {
    if (!selectedAdminId) return;
    setReassigning(true);
    try {
      await reassignUser(user._id, selectedAdminId);
      showToast("User reassigned successfully", "success");
      onRefresh();
      onClose();
    } catch {
      showToast("Failed to reassign user", "error");
    } finally {
      setReassigning(false);
    }
  };

  const handlePermToggle = async (key) => {
    const next = { ...perms, [key]: !perms[key] };
    setPerms(next);
    setPermLoading(true);
    try {
      await updateClientPermissions(user._id, { [key]: !perms[key] });
      showToast("Permission updated", "success");
      onRefresh();
    } catch {
      setPerms(perms);
      showToast("Failed to update permission", "error");
    } finally {
      setPermLoading(false);
    }
  };

  const handleLimitSave = async () => {
    setLimLoading(true);
    try {
      await updateBettingLimits(user._id, limits);
      showToast("Betting limits saved", "success");
      onRefresh();
    } catch {
      showToast("Failed to save limits", "error");
    } finally {
      setLimLoading(false);
    }
  };

  const permKeys = [
    { key: "canLogin", label: "Can Login" },
    { key: "canBet", label: "Can Bet" },
    { key: "canWithdraw", label: "Can Withdraw" },
    { key: "canDeposit", label: "Can Deposit" },
    { key: "isBetLocked", label: "Bet Locked", danger: true },
    { key: "isAccountLocked", label: "Account Locked", danger: true },
  ];

  const limitKeys = [
    { key: "minBet", label: "Min Bet" },
    { key: "maxBet", label: "Max Bet" },
    { key: "maxExposure", label: "Max Exposure" },
    { key: "maxProfit", label: "Max Profit" },
    { key: "minOdds", label: "Min Odds" },
    { key: "maxOdds", label: "Max Odds" },
  ];

  return (
    <div style={s.drawerOverlay} onClick={onClose}>
      <div style={s.drawer} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={s.drawerHeader}>
          <div>
            <div style={s.drawerName}>{user.username}</div>
            <div style={s.drawerRole}>
              {user.fullName || "—"} &nbsp;·&nbsp;{" "}
              <span style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                {user.role}
              </span>
            </div>
          </div>
          <button style={s.closeBtn} onClick={onClose}>
            ✕
          </button>
        </div>

        <div style={s.drawerBody}>
          {/* Info Grid */}
          <div style={s.drawerSection}>
            <div style={s.drawerSectionLabel}>Account Info</div>
            <div style={s.infoGrid}>
              {[
                ["Email", user.email || "—"],
                ["Phone", user.phone || "—"],
                ["Status", <StatusBadge status={user.status} />],
                ["Joined", fmtDate(user.createdAt)],
                ["Last Login", fmtDate(user.lastLoginAt)],
                ["Login IP", user.loginIp || "—"],
                ["Balance", fmt(user.wallet?.balance)],
                ["Available", fmt(user.wallet?.availableBalance)],
                ["Exposure", fmt(user.wallet?.exposure)],
                ["Total Bets", user.stats?.totalBets ?? 0],
                ["Total Wins", user.stats?.totalWins ?? 0],
                ["Total Losses", user.stats?.totalLosses ?? 0],
              ].map(([label, val]) => (
                <div key={label} style={s.infoRow}>
                  <span style={s.infoLabel}>{label}</span>
                  <span style={s.infoVal}>{val}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Permissions */}
          <div style={s.drawerSection}>
            <div style={s.drawerSectionLabel}>
              Permissions {permLoading && <span style={s.saving}>saving…</span>}
            </div>
            <div style={s.permGrid}>
              {permKeys.map(({ key, label, danger }) => (
                <div key={key} style={s.permRow}>
                  <span
                    style={{
                      ...s.permLabel,
                      color: danger ? "#a93226" : "#3a3a38",
                    }}
                  >
                    {label}
                  </span>
                  <button
                    style={{
                      ...s.toggle,
                      background: perms[key] ? "#111110" : "#e8e6de",
                    }}
                    onClick={() => handlePermToggle(key)}
                    disabled={permLoading}
                  >
                    <span
                      style={{
                        ...s.toggleThumb,
                        transform: perms[key]
                          ? "translateX(16px)"
                          : "translateX(0)",
                      }}
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Betting Limits */}
          <div style={s.drawerSection}>
            <div style={s.drawerSectionLabel}>Betting Limits</div>
            <div style={s.limitsGrid}>
              {limitKeys.map(({ key, label }) => (
                <div key={key} style={s.limitRow}>
                  <label style={s.limitLabel}>{label}</label>
                  <input
                    type="number"
                    value={limits[key] ?? ""}
                    onChange={(e) =>
                      setLimits({
                        ...limits,
                        [key]: parseFloat(e.target.value),
                      })
                    }
                    style={s.limitInput}
                  />
                </div>
              ))}
            </div>
            <button
              style={s.saveBtn}
              onClick={handleLimitSave}
              disabled={limLoading}
            >
              {limLoading ? "Saving…" : "Save Limits"}
            </button>
          </div>

          {/* Reassign Admin (superadmin only) */}
          {currentAdmin?.role === "superadmin" && (
            <div style={s.drawerSection}>
              <div style={s.drawerSectionLabel}>Reassign Admin</div>
              <select
                value={selectedAdminId}
                onChange={(e) => setSelectedAdminId(e.target.value)}
                style={{
                  ...s.limitInput,
                  width: "100%",
                  marginBottom: 10,
                  height: 36,
                }}
              >
                <option value="">— Select an admin —</option>
                {allAdmins.map((a) => (
                  <option key={a._id} value={a._id}>
                    {a.username} ({a.adminStatus})
                  </option>
                ))}
              </select>
              <button
                style={s.saveBtn}
                onClick={handleReassign}
                disabled={reassigning || !selectedAdminId}
              >
                {reassigning ? "Reassigning…" : "Reassign User"}
              </button>
            </div>
          )}

          {currentAdmin?.role === "admin" && (
            <div style={s.drawerSection}>
              <div style={s.drawerSectionLabel}>Change Password</div>
              <input
                type="password"
                placeholder="New password (min 6 chars)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                style={{ ...s.limitInput, width: "100%", marginBottom: 10 }}
              />
              <button
                style={s.saveBtn}
                onClick={handlePasswordChange}
                disabled={pwLoading || !newPassword.trim()}
              >
                {pwLoading ? "Updating…" : "Update Password"}
              </button>
            </div>
          )}
        </div>
        {/* Change Password — admin only, for their own assigned users */}
      </div>
    </div>
  );
};

// ─── MAIN PAGE ────────────────────────────────────────────
const UsersPage = () => {
  const [clients, setClients] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [toast, setToast] = useState(null);
  const [confirmModal, setConfirmModal] = useState(null);
  const [quickTransfer, setQuickTransfer] = useState(null);

  // Filters
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const limit = 15;

  // Create User Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    username: "",
    phone: "",
    password: "",
    fullName: "",
    email: "",
    balance: 0,
    assignedAdmin: "",
  });
  const [createLoading, setCreateLoading] = useState(false);
  const [subAdmins, setSubAdmins] = useState([]);

  const navigate = useNavigate();

  const showToast = useCallback((msg, type = "success") => {
    setToast({ msg, type });
  }, []);

  // ── Open create modal + fetch sub admins ──
  const handleOpenCreateModal = async () => {
    setShowCreateModal(true);
    try {
      const res = await getSubAdmins();
      if (res.success) setSubAdmins(res.data);
    } catch {
      // non-critical — dropdown will just be empty
    }
  };

  // ── Create user submit ──
  const handleCreateUser = async () => {
    setCreateLoading(true);
    try {
      const res = await createUser(createForm);
      if (res.success) {
        showToast(res.message || "User created successfully", "success");
        setShowCreateModal(false);
        setCreateForm({
          username: "",
          phone: "",
          password: "",
          fullName: "",
          email: "",
          balance: 0,
          assignedAdmin: "",
        });
        fetchClients();
        fetchStats();
      }
    } catch (err) {
      showToast(
        err?.response?.data?.message || "Failed to create user",
        "error",
      );
    } finally {
      setCreateLoading(false);
    }
  };

  const fetchStats = useCallback(async () => {
    try {
      setStatsLoading(true);
      const res = await getClientStats();
      if (res.success) setStats(res.data);
    } catch {
      // stats non-critical
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const fetchClients = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getClients({
        page,
        limit,
        search: search.trim(),
        status: status || undefined,
        sortBy,
        sortOrder,
      });
      if (res.success) {
        setClients(res.data);
        setPagination(res.pagination);
      }
    } catch {
      showToast("Failed to fetch clients", "error");
    } finally {
      setLoading(false);
    }
  }, [page, search, status, sortBy, sortOrder, showToast]);

  const openQuickTransfer = (user, type) => {
    setQuickTransfer({
      user,
      type,
      amount: "",
      remark: "",
      loading: false,
      error: null,
    });
  };

  const closeQuickTransfer = () => setQuickTransfer(null);

  const handleQuickTransferChange = (field, value) => {
    setQuickTransfer((prev) =>
      prev ? { ...prev, [field]: value, error: null } : prev,
    );
  };

  const handleQuickTransferSubmit = async () => {
    if (!quickTransfer) return;
    const amountNum = Number(quickTransfer.amount);

    if (!quickTransfer.amount || amountNum <= 0) {
      setQuickTransfer((prev) => ({ ...prev, error: "Enter a valid amount" }));
      return;
    }

    setQuickTransfer((prev) => ({ ...prev, loading: true, error: null }));
    try {
      await transferChips({
        toUserId: quickTransfer.user._id,
        type: quickTransfer.type,
        amount: amountNum,
        remark: quickTransfer.remark,
      });
      showToast(
        `${quickTransfer.type === "give" ? "Deposited" : "Withdrew"} ₹${amountNum} ${
          quickTransfer.type === "give" ? "to" : "from"
        } ${quickTransfer.user.username}`,
        "success",
      );
      setQuickTransfer(null);
      fetchClients();
      fetchStats();
    } catch (err) {
      setQuickTransfer((prev) => ({
        ...prev,
        loading: false,
        error: err?.response?.data?.message || "Transfer failed",
      }));
    }
  };

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    const delay = setTimeout(fetchClients, 300);
    return () => clearTimeout(delay);
  }, [fetchClients]);

  const handleStatusChange = async (user, newStatus) => {
    setConfirmModal({
      message: `${newStatus === "blocked" ? "Block" : newStatus === "active" ? "Unblock" : "Suspend"} "${user.username}"?`,
      onConfirm: async () => {
        setConfirmModal(null);
        try {
          await updateClientStatus(user._id, newStatus);
          showToast(`User ${newStatus}`, "success");
          fetchClients();
          fetchStats();
        } catch {
          showToast("Failed to update status", "error");
        }
      },
    });
  };

  const handleDelete = (user) => {
    setConfirmModal({
      message: `Permanently delete "${user.username}"? This cannot be undone.`,
      danger: true,
      onConfirm: async () => {
        setConfirmModal(null);
        try {
          await deleteClient(user._id);
          showToast("User deleted", "success");
          fetchClients();
          fetchStats();
        } catch {
          showToast("Failed to delete user", "error");
        }
      },
    });
  };

  const handleSort = (col) => {
    if (sortBy === col) {
      setSortOrder((o) => (o === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(col);
      setSortOrder("desc");
    }
    setPage(1);
  };

  const SortIcon = ({ col }) => {
    if (sortBy !== col)
      return <span style={{ color: "#d0cec6", marginLeft: 4 }}>↕</span>;
    return (
      <span style={{ marginLeft: 4, color: "#111110" }}>
        {sortOrder === "asc" ? "↑" : "↓"}
      </span>
    );
  };

  return (
    <div style={s.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@300;400;500&display=swap');
        * { box-sizing: border-box; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes slideIn { from { opacity:0; transform:translateX(24px); } to { opacity:1; transform:translateX(0); } }
        @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
        input[type=number]::-webkit-inner-spin-button { opacity:0.4; }
        input::placeholder { color: #c0bdb4; font-family: 'IBM Plex Mono', monospace; font-size: 12px; }
        tr:hover td { background: #fafaf8 !important; }
        button:disabled { opacity: 0.5; cursor: not-allowed; }
      `}</style>

      {/* Toast */}
      {toast && (
        <Toast
          msg={toast.msg}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Confirm Modal */}
      {confirmModal && (
        <div style={s.modalOverlay} onClick={() => setConfirmModal(null)}>
          <div style={s.modal} onClick={(e) => e.stopPropagation()}>
            <div style={s.modalMsg}>{confirmModal.message}</div>
            <div style={s.modalActions}>
              <button
                style={s.modalCancel}
                onClick={() => setConfirmModal(null)}
              >
                Cancel
              </button>
              <button
                style={{
                  ...s.modalConfirm,
                  background: confirmModal.danger ? "#c0392b" : "#111110",
                }}
                onClick={confirmModal.onConfirm}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Transfer Modal */}
      {quickTransfer && (
        <div style={s.modalOverlay} onClick={closeQuickTransfer}>
          <div
            style={{ ...s.modal, maxWidth: 380 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                fontSize: 15,
                fontWeight: 500,
                color: "#111110",
                marginBottom: 4,
              }}
            >
              {quickTransfer.type === "give"
                ? "Deposit Chips"
                : "Withdraw Chips"}
            </div>
            <div style={{ fontSize: 12, color: "#8a8880", marginBottom: 18 }}>
              {quickTransfer.type === "give" ? "To" : "From"}{" "}
              <strong style={{ color: "#111110" }}>
                {quickTransfer.user.username}
              </strong>
              {"  ·  "}Available:{" "}
              {fmt(quickTransfer.user.wallet?.availableBalance)}
            </div>

            <div style={{ marginBottom: 12 }}>
              <label
                style={{ ...s.limitLabel, display: "block", marginBottom: 4 }}
              >
                Amount (₹) *
              </label>
              <input
                type="number"
                min="1"
                autoFocus
                placeholder="Enter amount"
                value={quickTransfer.amount}
                onChange={(e) =>
                  handleQuickTransferChange("amount", e.target.value)
                }
                style={{ ...s.limitInput, width: "100%", height: 36 }}
              />
            </div>

            <div style={{ marginBottom: 12 }}>
              <label
                style={{ ...s.limitLabel, display: "block", marginBottom: 4 }}
              >
                Remark (optional)
              </label>
              <input
                type="text"
                placeholder="Add a note..."
                value={quickTransfer.remark}
                onChange={(e) =>
                  handleQuickTransferChange("remark", e.target.value)
                }
                style={{ ...s.limitInput, width: "100%", height: 36 }}
              />
            </div>

            {quickTransfer.error && (
              <div
                style={{
                  fontSize: 12,
                  color: "#c0392b",
                  background: "#fdf2f2",
                  border: "1px solid #f5c6c6",
                  borderRadius: 6,
                  padding: "8px 12px",
                  marginBottom: 12,
                }}
              >
                {quickTransfer.error}
              </div>
            )}

            <div style={{ ...s.modalActions, marginTop: 8 }}>
              <button
                style={s.modalCancel}
                onClick={closeQuickTransfer}
                disabled={quickTransfer.loading}
              >
                Cancel
              </button>
              <button
                style={{
                  ...s.modalConfirm,
                  background:
                    quickTransfer.type === "give" ? "#111110" : "#c0392b",
                  opacity: quickTransfer.loading ? 0.6 : 1,
                }}
                onClick={handleQuickTransferSubmit}
                disabled={quickTransfer.loading}
              >
                {quickTransfer.loading
                  ? "Processing…"
                  : quickTransfer.type === "give"
                    ? "Deposit"
                    : "Withdraw"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create User Modal */}
      {showCreateModal && (
        <div style={s.modalOverlay} onClick={() => setShowCreateModal(false)}>
          <div
            style={{
              ...s.modal,
              maxWidth: 440,
              maxHeight: "90vh",
              overflowY: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                fontSize: 15,
                fontWeight: 500,
                color: "#111110",
                marginBottom: 20,
              }}
            >
              Create New User
            </div>

            {[
              {
                key: "username",
                label: "Username *",
                type: "text",
                placeholder: "min 3 characters",
              },
              {
                key: "password",
                label: "Password *",
                type: "password",
                placeholder: "min 6 characters",
              },
              {
                key: "fullName",
                label: "Full Name",
                type: "text",
                placeholder: "optional",
              },
              {
                key: "phone",
                label: "Phone",
                type: "tel",
                placeholder: "10 digits (optional)",
              },
              {
                key: "email",
                label: "Email",
                type: "email",
                placeholder: "optional",
              },
              {
                key: "balance",
                label: "Opening Balance (₹)",
                type: "number",
                placeholder: "0",
              },
            ].map(({ key, label, type, placeholder }) => (
              <div key={key} style={{ marginBottom: 12 }}>
                <label
                  style={{ ...s.limitLabel, display: "block", marginBottom: 4 }}
                >
                  {label}
                </label>
                <input
                  type={type}
                  placeholder={placeholder}
                  value={createForm[key]}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, [key]: e.target.value })
                  }
                  style={{ ...s.limitInput, width: "100%", height: 36 }}
                />
              </div>
            ))}

            {/* Assign to Sub Admin */}
            <div style={{ marginBottom: 12 }}>
              <label
                style={{ ...s.limitLabel, display: "block", marginBottom: 4 }}
              >
                Assign to Sub Admin (optional)
              </label>
              <select
                value={createForm.assignedAdmin}
                onChange={(e) =>
                  setCreateForm({
                    ...createForm,
                    assignedAdmin: e.target.value,
                  })
                }
                style={{ ...s.limitInput, width: "100%", height: 36 }}
              >
                <option value="">— Assign to me (default) —</option>
                {subAdmins.map((a) => (
                  <option key={a._id} value={a._id}>
                    {a.username} ({a.role})
                  </option>
                ))}
              </select>
            </div>

            <div style={{ ...s.modalActions, marginTop: 20 }}>
              <button
                style={s.modalCancel}
                onClick={() => setShowCreateModal(false)}
                disabled={createLoading}
              >
                Cancel
              </button>
              <button
                style={{ ...s.modalConfirm, opacity: createLoading ? 0.6 : 1 }}
                onClick={handleCreateUser}
                disabled={createLoading}
              >
                {createLoading ? "Creating…" : "Create User"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Drawer */}
      {selectedUser && (
        <DetailDrawer
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
          onRefresh={fetchClients}
          showToast={showToast}
        />
      )}

      {/* Page Header */}
      <div style={s.header}>
        <div>
          <div style={s.breadcrumb}>
            admin / <span style={{ color: "#7a7870" }}>users</span>
          </div>
          <h1 style={s.pageTitle}>Clients</h1>
        </div>
        <button
          style={{
            height: 38,
            padding: "0 18px",
            background: "var(--admin-primary-btn)",
            color: "var(--admin-btn-text)",
            border: "none",
            borderRadius: 8,
            fontFamily: "'IBM Plex Sans', sans-serif",
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 6,
            boxShadow: "0 2px 10px rgba(0,0,0,0.15)",
            transition: "transform 0.15s ease",
          }}
          onClick={handleOpenCreateModal}
        >
          + Create User
        </button>
      </div>

      {/* Stat Cards */}
      <div style={s.statsRow}>
        <StatCard
          label="Total Clients"
          value={statsLoading ? "…" : stats?.total?.toLocaleString()}
          sub={`+${stats?.newThisWeek ?? 0} this week`}
          accent="#111110"
        />
        <StatCard
          label="Active"
          value={statsLoading ? "…" : stats?.active?.toLocaleString()}
          accent="#639922"
        />
        <StatCard
          label="Blocked"
          value={statsLoading ? "…" : stats?.blocked?.toLocaleString()}
          accent="#c0392b"
        />
        {/* <StatCard
          label="Suspended"
          value={statsLoading ? "…" : stats?.suspended?.toLocaleString()}
          accent="#ba7517"
        /> */}
        <StatCard
          label="Total Balance"
          value={statsLoading ? "…" : fmt(stats?.totalBalance)}
          sub={`Exposure: ${fmt(stats?.totalExposure)}`}
          accent="#185fa5"
        />
        <StatCard
          label="Demo Users"
          value={statsLoading ? "…" : stats?.demo?.toLocaleString()}
          accent="#8a8880"
        />
      </div>

      {/* Filters */}
      <div style={s.filters}>
        <div style={s.searchWrap}>
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#b0aea6"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search username, email, phone…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            style={s.searchInput}
          />
          {search && (
            <button
              style={s.clearBtn}
              onClick={() => {
                setSearch("");
                setPage(1);
              }}
            >
              ✕
            </button>
          )}
        </div>

        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          style={s.select}
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="blocked">Blocked</option>
          {/* <option value="suspended">Suspended</option> */}
        </select>

        <select
          value={`${sortBy}_${sortOrder}`}
          onChange={(e) => {
            const [col, ord] = e.target.value.split("_");
            setSortBy(col);
            setSortOrder(ord);
            setPage(1);
          }}
          style={s.select}
        >
          <option value="createdAt_desc">Newest First</option>
          <option value="createdAt_asc">Oldest First</option>
          <option value="wallet.balance_desc">Balance ↓</option>
          <option value="wallet.balance_asc">Balance ↑</option>
          <option value="stats.totalBets_desc">Most Bets</option>
        </select>

        <div style={s.filterRight}>
          {pagination && (
            <span style={s.countLabel}>
              {pagination.total.toLocaleString()} clients
            </span>
          )}
        </div>
      </div>

      {/* Table */}
      <div style={s.tableWrap}>
        {loading ? (
          <Spinner />
        ) : clients.length === 0 ? (
          <div style={s.empty}>
            <div style={s.emptyIcon}>⊘</div>
            <div style={s.emptyText}>No clients found</div>
          </div>
        ) : (
          <table style={s.table}>
            <thead>
              <tr>
                {[
                  { label: "User", col: "username" },
                  { label: "Contact", col: null },
                  { label: "Status", col: "status" },
                  { label: "Balance", col: "wallet.balance" },
                  { label: "Exposure", col: "wallet.exposure" },
                  { label: "Bets", col: "stats.totalBets" },
                  { label: "Joined", col: "createdAt" },
                  { label: "Actions", col: null },
                ].map(({ label, col }) => (
                  <th
                    key={label}
                    style={{ ...s.th, cursor: col ? "pointer" : "default" }}
                    onClick={() => col && handleSort(col)}
                  >
                    {label}
                    {col && <SortIcon col={col} />}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {clients.map((user) => (
                <tr key={user._id}>
                  <td style={s.td}>
                    <div style={s.userCell}>
                      <div style={s.avatar}>
                        {(user.username?.[0] || "U").toUpperCase()}
                      </div>
                      <div>
                        <div style={s.userName}>{user.username}</div>
                        <div style={s.userId}>
                          {user.isDemoUser ? (
                            <span style={s.demoBadge}>DEMO</span>
                          ) : (
                            <span style={{ color: "#b0aea6" }}>
                              #{user.providerUserId || user._id?.slice(-6)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td style={s.td}>
                    <div style={s.contactCell}>
                      <span>{user.email || "—"}</span>
                      <span style={{ color: "#b0aea6" }}>
                        {user.phone || ""}
                      </span>
                    </div>
                  </td>
                  <td style={s.td}>
                    <StatusBadge status={user.status} />
                  </td>
                  <td style={{ ...s.td, ...s.monoCell }}>
                    {fmt(user.wallet?.balance)}
                  </td>
                  <td style={{ ...s.td, ...s.monoCell, color: "#ba7517" }}>
                    {fmt(user.wallet?.exposure)}
                  </td>
                  <td style={{ ...s.td, ...s.monoCell }}>
                    {user.stats?.totalBets ?? 0}
                  </td>
                  <td style={{ ...s.td, ...s.monoCell, color: "#8a8880" }}>
                    {fmtDate(user.createdAt)}
                  </td>
                  <td style={s.td}>
                    <div style={s.actions}>
                      {/* View */}
                      <button
                        style={s.actionBtn}
                        title="View details"
                        onClick={() => setSelectedUser(user)}
                      >
                        <svg
                          width="13"
                          height="13"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      </button>

                      <button
                        style={{ ...s.actionBtn, color: "#185fa5" }}
                        title="View insights"
                        onClick={() =>
                          navigate(`/admin/users/${user._id}/insights`, {
                            state: { user },
                          })
                        }
                      >
                        <svg
                          width="13"
                          height="13"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <line x1="18" y1="20" x2="18" y2="10" />
                          <line x1="12" y1="20" x2="12" y2="4" />
                          <line x1="6" y1="20" x2="6" y2="14" />
                        </svg>
                      </button>
                      {/* Quick Deposit */}
                      <button
                        style={{ ...s.actionBtn, color: "#3b6d11" }}
                        title="Deposit chips"
                        onClick={() => openQuickTransfer(user, "give")}
                      >
                        D
                      </button>

                      {/* Quick Withdraw */}
                      <button
                        style={{ ...s.actionBtn, color: "#c0392b" }}
                        title="Withdraw chips"
                        onClick={() => openQuickTransfer(user, "take")}
                      >
                        W
                      </button>

                      {/* Block / Unblock */}
                      {user.status === "active" ? (
                        <button
                          style={{ ...s.actionBtn, color: "#c0392b" }}
                          title="Block user"
                          onClick={() => handleStatusChange(user, "blocked")}
                        >
                          <svg
                            width="13"
                            height="13"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <circle cx="12" cy="12" r="10" />
                            <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                          </svg>
                        </button>
                      ) : (
                        <button
                          style={{ ...s.actionBtn, color: "#639922" }}
                          title="Unblock user"
                          onClick={() => handleStatusChange(user, "active")}
                        >
                          <svg
                            width="13"
                            height="13"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        </button>
                      )}

                      {/* Suspend */}
                      {/* {user.status !== "suspended" && (
                        <button
                          style={{ ...s.actionBtn, color: "#ba7517" }}
                          title="Suspend user"
                          onClick={() => handleStatusChange(user, "suspended")}
                        >
                          <svg
                            width="13"
                            height="13"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" y1="8" x2="12" y2="12" />
                            <line x1="12" y1="16" x2="12.01" y2="16" />
                          </svg>
                        </button>
                      )} */}

                      {/* Delete */}
                      <button
                        style={{ ...s.actionBtn, color: "#c0392b" }}
                        title="Delete user"
                        onClick={() => handleDelete(user)}
                      >
                        <svg
                          width="13"
                          height="13"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6l-1 14H6L5 6" />
                          <path d="M10 11v6M14 11v6" />
                          <path d="M9 6V4h6v2" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div style={s.pagination}>
          <button
            style={s.pageBtn}
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
          >
            ← Prev
          </button>
          <div style={s.pageNumbers}>
            {Array.from(
              { length: Math.min(pagination.totalPages, 7) },
              (_, i) => {
                const p = i + 1;
                return (
                  <button
                    key={p}
                    style={{
                      ...s.pageNum,
                      ...(page === p ? s.pageNumActive : {}),
                    }}
                    onClick={() => setPage(p)}
                  >
                    {p}
                  </button>
                );
              },
            )}
          </div>
          <button
            style={s.pageBtn}
            disabled={page === pagination.totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
};

// ─── STYLES ───────────────────────────────────────────────
const s = {
  page: {
    minHeight: "100%",
    background: "var(--admin-page-bg)",
    color: "var(--admin-body-text)",
    fontFamily: "'IBM Plex Sans', sans-serif",
    padding: "24px 32px 48px",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
    flexWrap: "wrap",
    gap: 16,
  },
  breadcrumb: {
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: 11,
    color: "var(--admin-muted-text)",
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    marginBottom: 4,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: 700,
    color: "var(--admin-heading)",
    letterSpacing: "-0.03em",
    margin: 0,
  },
  statsRow: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: 14,
    marginBottom: 24,
  },
  statCard: {
    background: "var(--admin-card-bg)",
    border: "1px solid var(--admin-border)",
    borderRadius: 12,
    padding: "16px 20px",
    display: "flex",
    gap: 14,
    alignItems: "flex-start",
    boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
    transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
  },
  statLabel: {
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: 10,
    color: "var(--admin-muted-text)",
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    marginBottom: 6,
    fontWeight: 500,
  },
  statValue: {
    fontSize: 22,
    fontWeight: 700,
    color: "var(--admin-heading)",
    letterSpacing: "-0.02em",
    lineHeight: 1,
  },
  statSub: {
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: 10,
    color: "var(--admin-muted-text)",
    marginTop: 6,
  },
  filters: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    marginBottom: 18,
    flexWrap: "wrap",
  },
  searchWrap: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    background: "var(--admin-input-bg)",
    border: "1px solid var(--admin-input-border)",
    borderRadius: 8,
    padding: "0 12px",
    height: 38,
    flex: "1 1 240px",
    maxWidth: 360,
  },
  searchInput: {
    flex: 1,
    background: "transparent",
    border: "none",
    outline: "none",
    fontSize: 12,
    fontFamily: "'IBM Plex Mono', monospace",
    color: "var(--admin-body-text)",
  },
  clearBtn: {
    background: "none",
    border: "none",
    color: "var(--admin-muted-text)",
    cursor: "pointer",
    fontSize: 12,
    padding: 0,
  },
  select: {
    height: 38,
    border: "1px solid var(--admin-input-border)",
    borderRadius: 8,
    background: "var(--admin-input-bg)",
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: 11,
    color: "var(--admin-body-text)",
    padding: "0 12px",
    outline: "none",
    cursor: "pointer",
  },
  filterRight: { marginLeft: "auto" },
  countLabel: {
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: 11,
    color: "var(--admin-muted-text)",
    background: "var(--admin-card-bg)",
    border: "1px solid var(--admin-border)",
    padding: "4px 10px",
    borderRadius: 12,
  },
  tableWrap: {
    background: "var(--admin-card-bg)",
    border: "1px solid var(--admin-border)",
    borderRadius: 14,
    overflow: "hidden",
    marginBottom: 20,
    boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
  },
  table: { width: "100%", borderCollapse: "collapse" },
  th: {
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: 10,
    letterSpacing: "0.08em",
    color: "var(--admin-muted-text)",
    textTransform: "uppercase",
    textAlign: "left",
    padding: "12px 16px",
    borderBottom: "1px solid var(--admin-border)",
    background: "var(--admin-secondary-btn)",
    whiteSpace: "nowrap",
    userSelect: "none",
  },
  td: {
    padding: "12px 16px",
    fontSize: 13,
    color: "var(--admin-body-text)",
    borderBottom: "1px solid var(--admin-border)",
    verticalAlign: "middle",
    transition: "background 0.12s",
  },
  monoCell: { fontFamily: "'IBM Plex Mono', monospace", fontSize: 12 },
  userCell: { display: "flex", alignItems: "center", gap: 10 },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 8,
    background: "var(--admin-primary-btn)",
    color: "var(--admin-btn-text)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: 12,
    fontWeight: 700,
    flexShrink: 0,
  },
  userName: { fontSize: 13, fontWeight: 600, color: "var(--admin-heading)" },
  userId: {
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: 10,
    color: "var(--admin-muted-text)",
    marginTop: 2,
  },
  demoBadge: {
    background: "var(--admin-secondary-btn)",
    color: "var(--admin-secondary-text)",
    fontSize: 9,
    fontFamily: "'IBM Plex Mono', monospace",
    padding: "2px 6px",
    borderRadius: 4,
    letterSpacing: "0.06em",
    border: "1px solid var(--admin-border)",
  },
  contactCell: {
    display: "flex",
    flexDirection: "column",
    gap: 2,
    fontSize: 12,
    fontFamily: "'IBM Plex Mono', monospace",
  },
  actions: { display: "flex", alignItems: "center", gap: 6 },
  actionBtn: {
    width: 30,
    height: 30,
    borderRadius: 6,
    border: "1px solid var(--admin-border)",
    background: "var(--admin-secondary-btn)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    color: "var(--admin-secondary-text)",
    transition: "all 0.15s ease",
    padding: 0,
  },
  empty: { padding: "60px 0", textAlign: "center" },
  emptyIcon: { fontSize: 28, color: "var(--admin-muted-text)", marginBottom: 8 },
  emptyText: {
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: 12,
    color: "var(--admin-muted-text)",
  },
  spinnerWrap: { padding: "60px 0", display: "flex", justifyContent: "center" },
  spinner: {
    width: 24,
    height: 24,
    border: "2px solid var(--admin-border)",
    borderTopColor: "var(--admin-primary-btn)",
    borderRadius: "50%",
    animation: "spin 0.7s linear infinite",
  },
  pagination: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: "14px 0",
  },
  pageBtn: {
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: 11,
    padding: "6px 14px",
    border: "1px solid var(--admin-border)",
    borderRadius: 6,
    background: "var(--admin-secondary-btn)",
    color: "var(--admin-secondary-text)",
    cursor: "pointer",
    fontWeight: 500,
  },
  pageNumbers: { display: "flex", gap: 4 },
  pageNum: {
    width: 30,
    height: 30,
    border: "1px solid var(--admin-border)",
    borderRadius: 6,
    background: "var(--admin-secondary-btn)",
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: 11,
    color: "var(--admin-secondary-text)",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  pageNumActive: {
    background: "var(--admin-primary-btn)",
    color: "var(--admin-btn-text)",
    borderColor: "var(--admin-primary-btn)",
    fontWeight: 700,
  },
  toast: {
    position: "fixed",
    bottom: 24,
    right: 24,
    padding: "10px 18px",
    borderRadius: 8,
    border: "1px solid var(--admin-border)",
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: 12,
    zIndex: 9999,
    animation: "fadeIn 0.2s ease",
    boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
    background: "var(--admin-card-bg)",
    color: "var(--admin-heading)",
  },
  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.6)",
    backdropFilter: "blur(6px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    animation: "fadeIn 0.15s ease",
  },
  modal: {
    background: "var(--admin-card-bg)",
    border: "1px solid var(--admin-border)",
    borderRadius: 14,
    padding: "24px 28px",
    maxWidth: 360,
    width: "90%",
    color: "var(--admin-body-text)",
    boxShadow: "0 20px 50px rgba(0,0,0,0.3)",
  },
  modalMsg: {
    fontSize: 14,
    color: "var(--admin-heading)",
    marginBottom: 20,
    lineHeight: 1.5,
    fontWeight: 500,
  },
  modalActions: { display: "flex", justifyContent: "flex-end", gap: 8 },
  modalCancel: {
    padding: "8px 16px",
    border: "1px solid var(--admin-border)",
    borderRadius: 8,
    background: "var(--admin-secondary-btn)",
    fontSize: 12,
    fontFamily: "'IBM Plex Sans', sans-serif",
    color: "var(--admin-secondary-text)",
    cursor: "pointer",
    fontWeight: 500,
  },
  modalConfirm: {
    padding: "8px 18px",
    border: "none",
    borderRadius: 8,
    background: "var(--admin-primary-btn)",
    color: "var(--admin-btn-text)",
    fontSize: 12,
    fontFamily: "'IBM Plex Sans', sans-serif",
    cursor: "pointer",
    fontWeight: 600,
    boxShadow: "0 2px 10px rgba(0,0,0,0.15)",
  },
  drawerOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.5)",
    backdropFilter: "blur(4px)",
    zIndex: 999,
    display: "flex",
    justifyContent: "flex-end",
    animation: "fadeIn 0.15s ease",
  },
  drawer: {
    width: "min(440px, 95vw)",
    background: "var(--admin-card-bg)",
    color: "var(--admin-body-text)",
    height: "100%",
    overflowY: "auto",
    borderLeft: "1px solid var(--admin-border)",
    display: "flex",
    flexDirection: "column",
    animation: "slideIn 0.2s ease",
    boxShadow: "0 0 40px rgba(0,0,0,0.4)",
  },
  drawerHeader: {
    padding: "20px 24px",
    borderBottom: "1px solid var(--admin-border)",
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    position: "sticky",
    top: 0,
    background: "var(--admin-card-bg)",
    zIndex: 1,
  },
  drawerName: {
    fontSize: 17,
    fontWeight: 700,
    color: "var(--admin-heading)",
    marginBottom: 4,
  },
  drawerRole: { fontSize: 12, color: "var(--admin-muted-text)" },
  closeBtn: {
    width: 30,
    height: 30,
    border: "1px solid var(--admin-border)",
    borderRadius: 7,
    background: "var(--admin-secondary-btn)",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 12,
    color: "var(--admin-secondary-text)",
    padding: 0,
  },
  drawerBody: { padding: "0 24px 24px", flex: 1 },
  drawerSection: { marginTop: 24 },
  drawerSectionLabel: {
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: 10,
    letterSpacing: "0.1em",
    color: "var(--admin-muted-text)",
    textTransform: "uppercase",
    marginBottom: 12,
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontWeight: 600,
  },
  saving: { color: "var(--admin-success)", fontSize: 10, fontWeight: 600 },
  infoGrid: {
    display: "flex",
    flexDirection: "column",
    gap: 0,
    border: "1px solid var(--admin-border)",
    borderRadius: 10,
    overflow: "hidden",
  },
  infoRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "10px 14px",
    borderBottom: "1px solid var(--admin-border)",
    fontSize: 12,
  },
  infoLabel: {
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: 10,
    color: "var(--admin-muted-text)",
  },
  infoVal: {
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: 12,
    color: "var(--admin-heading)",
    textAlign: "right",
    maxWidth: "60%",
    wordBreak: "break-all",
    fontWeight: 500,
  },
  permGrid: {
    display: "flex",
    flexDirection: "column",
    gap: 0,
    border: "1px solid var(--admin-border)",
    borderRadius: 10,
    overflow: "hidden",
  },
  permRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "10px 14px",
    borderBottom: "1px solid var(--admin-border)",
  },
  permLabel: { fontSize: 12, color: "var(--admin-body-text)", fontWeight: 500 },
  toggle: {
    width: 36,
    height: 20,
    borderRadius: 10,
    border: "none",
    cursor: "pointer",
    position: "relative",
    transition: "background 0.2s",
    padding: 0,
    flexShrink: 0,
  },
  toggleThumb: {
    position: "absolute",
    top: 3,
    left: 3,
    width: 14,
    height: 14,
    borderRadius: "50%",
    background: "#ffffff",
    transition: "transform 0.2s",
    display: "block",
  },
  limitsGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 10,
    marginBottom: 14,
  },
  limitRow: { display: "flex", flexDirection: "column", gap: 4 },
  limitLabel: {
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: 10,
    color: "var(--admin-muted-text)",
    letterSpacing: "0.08em",
    textTransform: "uppercase",
  },
  limitInput: {
    height: 36,
    border: "1px solid var(--admin-input-border)",
    borderRadius: 8,
    padding: "0 10px",
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: 12,
    color: "var(--admin-body-text)",
    background: "var(--admin-input-bg)",
    outline: "none",
  },
  saveBtn: {
    width: "100%",
    height: 38,
    background: "var(--admin-primary-btn)",
    color: "var(--admin-btn-text)",
    border: "none",
    borderRadius: 8,
    fontFamily: "'IBM Plex Sans', sans-serif",
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
    boxShadow: "0 2px 10px rgba(0,0,0,0.15)",
  },
};

export default UsersPage;