    import React, { useState, useEffect, useCallback } from "react";
import {
  getAllSuperAdmins,
  updateSuperAdminStatus,
  deleteSuperAdmin,
  createAccount,
} from "../../services/ownerService";

// ─── UTILS ────────────────────────────────────────────────
const fmt = (n) =>
  n >= 1_00_000
    ? `₹${(n / 1_00_000).toFixed(1)}L`
    : n >= 1_000
      ? `₹${(n / 1_000).toFixed(1)}k`
      : `₹${n ?? 0}`;

const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

const statusColors = {
  active:    { bg: "var(--admin-success-bg)", color: "var(--admin-success)", dot: "var(--admin-success)" },
  blocked:   { bg: "var(--admin-danger-bg)", color: "var(--admin-danger)", dot: "var(--admin-danger)" },
  suspended: { bg: "var(--admin-warning-bg)", color: "var(--admin-warning)", dot: "var(--admin-warning)" },
};

// ─── SMALL COMPONENTS ─────────────────────────────────────
const StatusBadge = ({ status }) => {
  const sc = statusColors[status] || statusColors.active;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      background: sc.bg, color: sc.color, fontSize: 11,
      fontFamily: "'IBM Plex Mono', monospace", fontWeight: 500,
      padding: "3px 8px", borderRadius: 4, letterSpacing: "0.04em",
    }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: sc.dot, display: "inline-block" }} />
      {status}
    </span>
  );
};

const Spinner = () => (
  <div style={s.spinnerWrap}><div style={s.spinner} /></div>
);

const Toast = ({ msg, type, onClose }) => {
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div style={{
      ...s.toast,
      background: type === "error" ? "#fdf2f2" : "#eaf3de",
      borderColor: type === "error" ? "#f0d0d0" : "#c0dd97",
      color: type === "error" ? "#a93226" : "#3b6d11",
    }}>
      {msg}
    </div>
  );
};

const StatCard = ({ label, value, accent }) => (
  <div style={s.statCard}>
    <div style={{ width: 3, height: 28, background: accent || "#111110", borderRadius: 2, flexShrink: 0 }} />
    <div>
      <div style={s.statLabel}>{label}</div>
      <div style={s.statValue}>{value ?? "—"}</div>
    </div>
  </div>
);

// ─── DETAIL DRAWER ────────────────────────────────────────
const DetailDrawer = ({ sa, onClose, onRefresh, showToast }) => {
  const [statusLoading, setStatusLoading] = useState(false);

  const handleStatus = async (newStatus) => {
    setStatusLoading(true);
    try {
      await updateSuperAdminStatus(sa._id, newStatus);
      showToast(`Superadmin ${newStatus}`, "success");
      onRefresh();
      onClose();
    } catch {
      showToast("Failed to update status", "error");
    } finally {
      setStatusLoading(false);
    }
  };

  return (
    <div style={s.drawerOverlay} onClick={onClose}>
      <div style={s.drawer} onClick={(e) => e.stopPropagation()}>
        <div style={s.drawerHeader}>
          <div>
            <div style={s.drawerName}>{sa.username}</div>
            <div style={s.drawerRole}>{sa.fullName || "—"} &nbsp;·&nbsp;
              <span style={{ fontFamily: "'IBM Plex Mono', monospace" }}>superadmin</span>
            </div>
          </div>
          <button style={s.closeBtn} onClick={onClose}>✕</button>
        </div>

        <div style={s.drawerBody}>
          {/* Info */}
          <div style={s.drawerSection}>
            <div style={s.drawerSectionLabel}>Account Info</div>
            <div style={s.infoGrid}>
              {[
                ["Email",      sa.email    || "—"],
                ["Phone",      sa.phone    || "—"],
                ["Status",     <StatusBadge status={sa.status} />],
                ["Admin Status", sa.adminStatus || "—"],
                ["Joined",     fmtDate(sa.createdAt)],
                ["Balance",    fmt(sa.wallet?.balance)],
                ["Available",  fmt(sa.wallet?.availableBalance)],
                ["Exposure",   fmt(sa.wallet?.exposure)],
                ["Admins",     sa.adminCount ?? 0],
                ["Users",      sa.userCount  ?? 0],
                ["Created By", sa.createdBy?.username || "—"],
              ].map(([label, val]) => (
                <div key={label} style={s.infoRow}>
                  <span style={s.infoLabel}>{label}</span>
                  <span style={s.infoVal}>{val}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Status Actions */}
          <div style={s.drawerSection}>
            <div style={s.drawerSectionLabel}>Change Status</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {sa.status !== "active" && (
                <button
                  style={{ ...s.saveBtn, background: "#639922" }}
                  onClick={() => handleStatus("active")}
                  disabled={statusLoading}
                >
                  ✓ Activate
                </button>
              )}
              {sa.status !== "blocked" && (
                <button
                  style={{ ...s.saveBtn, background: "#c0392b" }}
                  onClick={() => handleStatus("blocked")}
                  disabled={statusLoading}
                >
                  ⊘ Block
                </button>
              )}
              {sa.status !== "suspended" && (
                <button
                  style={{ ...s.saveBtn, background: "#ba7517" }}
                  onClick={() => handleStatus("suspended")}
                  disabled={statusLoading}
                >
                  ⚠ Suspend
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── MAIN PAGE ────────────────────────────────────────────
const SuperAdmins = () => {
  const [list, setList]               = useState([]);
  const [loading, setLoading]         = useState(true);
  const [selected, setSelected]       = useState(null);
  const [toast, setToast]             = useState(null);
  const [confirmModal, setConfirmModal] = useState(null);
  const [search, setSearch]           = useState("");

  // Create modal
  const [showCreate, setShowCreate]   = useState(false);
  const [createForm, setCreateForm]   = useState({
    username: "", password: "", fullName: "", email: "", phone: "", balance: 0,
  });
  const [createLoading, setCreateLoading] = useState(false);

  const showToast = useCallback((msg, type = "success") => setToast({ msg, type }), []);

  const fetchList = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getAllSuperAdmins();
      if (res.success) setList(res.data);
    } catch {
      showToast("Failed to fetch superadmins", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { fetchList(); }, [fetchList]);

  const handleDelete = (sa) => {
    setConfirmModal({
      message: `Permanently delete "${sa.username}"? Their admins will be unassigned.`,
      danger: true,
      onConfirm: async () => {
        setConfirmModal(null);
        try {
          await deleteSuperAdmin(sa._id);
          showToast("Superadmin deleted", "success");
          fetchList();
        } catch {
          showToast("Failed to delete", "error");
        }
      },
    });
  };

  const handleCreate = async () => {
    setCreateLoading(true);
    try {
      const res = await createAccount({ ...createForm, role: "superadmin" });
      if (res.success) {
        showToast(res.message || "Superadmin created", "success");
        setShowCreate(false);
        setCreateForm({ username: "", password: "", fullName: "", email: "", phone: "", balance: 0 });
        fetchList();
      }
    } catch (err) {
      showToast(err?.response?.data?.message || "Failed to create", "error");
    } finally {
      setCreateLoading(false);
    }
  };

  const filtered = list.filter((sa) =>
    sa.username.toLowerCase().includes(search.toLowerCase()) ||
    sa.email?.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total:  list.length,
    active: list.filter((s) => s.status === "active").length,
    blocked: list.filter((s) => s.status === "blocked").length,
  };

  return (
    <div style={s.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@300;400;500&display=swap');
        * { box-sizing: border-box; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes slideIn { from { opacity:0; transform:translateX(24px); } to { opacity:1; transform:translateX(0); } }
        @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
        tr:hover td { background: #fafaf8 !important; }
        button:disabled { opacity: 0.5; cursor: not-allowed; }
        input::placeholder { color: #c0bdb4; font-family: 'IBM Plex Mono', monospace; font-size: 12px; }
      `}</style>

      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      {/* Confirm Modal */}
      {confirmModal && (
        <div style={s.modalOverlay} onClick={() => setConfirmModal(null)}>
          <div style={s.modal} onClick={(e) => e.stopPropagation()}>
            <div style={s.modalMsg}>{confirmModal.message}</div>
            <div style={s.modalActions}>
              <button style={s.modalCancel} onClick={() => setConfirmModal(null)}>Cancel</button>
              <button
                style={{ ...s.modalConfirm, background: confirmModal.danger ? "#c0392b" : "#111110" }}
                onClick={confirmModal.onConfirm}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div style={s.modalOverlay} onClick={() => setShowCreate(false)}>
          <div style={{ ...s.modal, maxWidth: 440, maxHeight: "90vh", overflowY: "auto" }}
            onClick={(e) => e.stopPropagation()}>
            <div style={{ fontSize: 15, fontWeight: 500, color: "#111110", marginBottom: 20 }}>
              Create Superadmin
            </div>
            {[
              { key: "username", label: "Username *",        type: "text",     placeholder: "min 3 chars" },
              { key: "password", label: "Password *",        type: "password", placeholder: "min 6 chars" },
              { key: "fullName", label: "Full Name",         type: "text",     placeholder: "optional" },
              { key: "phone",    label: "Phone",             type: "tel",      placeholder: "10 digits (optional)" },
              { key: "email",    label: "Email",             type: "email",    placeholder: "optional" },
              { key: "balance",  label: "Opening Balance (₹)", type: "number", placeholder: "0" },
            ].map(({ key, label, type, placeholder }) => (
              <div key={key} style={{ marginBottom: 12 }}>
                <label style={{ ...s.limitLabel, display: "block", marginBottom: 4 }}>{label}</label>
                <input
                  type={type}
                  placeholder={placeholder}
                  value={createForm[key]}
                  onChange={(e) => setCreateForm({ ...createForm, [key]: e.target.value })}
                  style={{ ...s.limitInput, width: "100%", height: 36 }}
                />
              </div>
            ))}
            <div style={{ ...s.modalActions, marginTop: 20 }}>
              <button style={s.modalCancel} onClick={() => setShowCreate(false)} disabled={createLoading}>
                Cancel
              </button>
              <button
                style={{ ...s.modalConfirm, opacity: createLoading ? 0.6 : 1 }}
                onClick={handleCreate}
                disabled={createLoading}
              >
                {createLoading ? "Creating…" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Drawer */}
      {selected && (
        <DetailDrawer
          sa={selected}
          onClose={() => setSelected(null)}
          onRefresh={fetchList}
          showToast={showToast}
        />
      )}

      {/* Header */}
      <div style={s.header}>
        <div>
          <div style={s.breadcrumb}>owner / <span style={{ color: "#7a7870" }}>superadmins</span></div>
          <h1 style={s.pageTitle}>Superadmins</h1>
        </div>
        <button style={s.createBtn} onClick={() => setShowCreate(true)}>
          + Create Superadmin
        </button>
      </div>

      {/* Stats */}
      <div style={s.statsRow}>
        <StatCard label="Total"   value={stats.total}   accent="#111110" />
        <StatCard label="Active"  value={stats.active}  accent="#639922" />
        <StatCard label="Blocked" value={stats.blocked} accent="#c0392b" />
        <StatCard label="Total Balance"
          value={fmt(list.reduce((a, s) => a + (s.wallet?.balance || 0), 0))}
          accent="#185fa5"
        />
      </div>

      {/* Search */}
      <div style={s.filters}>
        <div style={s.searchWrap}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#b0aea6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search username or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={s.searchInput}
          />
          {search && (
            <button style={s.clearBtn} onClick={() => setSearch("")}>✕</button>
          )}
        </div>
        <span style={s.countLabel}>{filtered.length} superadmins</span>
      </div>

      {/* Table */}
      <div style={s.tableWrap}>
        {loading ? <Spinner /> : filtered.length === 0 ? (
          <div style={s.empty}>
            <div style={s.emptyIcon}>⊘</div>
            <div style={s.emptyText}>No superadmins found</div>
          </div>
        ) : (
          <table style={s.table}>
            <thead>
              <tr>
                {["Superadmin", "Contact", "Status", "Balance", "Admins", "Users", "Joined", "Actions"].map((label) => (
                  <th key={label} style={s.th}>{label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((sa) => (
                <tr key={sa._id}>
                  <td style={s.td}>
                    <div style={s.userCell}>
                      <div style={{ ...s.avatar, background: "#7c3aed" }}>
                        {(sa.username?.[0] || "S").toUpperCase()}
                      </div>
                      <div>
                        <div style={s.userName}>{sa.username}</div>
                        <div style={s.userId}>{sa.fullName || "—"}</div>
                      </div>
                    </div>
                  </td>
                  <td style={s.td}>
                    <div style={s.contactCell}>
                      <span>{sa.email || "—"}</span>
                      <span style={{ color: "#b0aea6" }}>{sa.phone || ""}</span>
                    </div>
                  </td>
                  <td style={s.td}><StatusBadge status={sa.status} /></td>
                  <td style={{ ...s.td, ...s.monoCell }}>{fmt(sa.wallet?.balance)}</td>
                  <td style={{ ...s.td, ...s.monoCell }}>{sa.adminCount ?? 0}</td>
                  <td style={{ ...s.td, ...s.monoCell }}>{sa.userCount ?? 0}</td>
                  <td style={{ ...s.td, ...s.monoCell, color: "#8a8880" }}>{fmtDate(sa.createdAt)}</td>
                  <td style={s.td}>
                    <div style={s.actions}>
                      {/* View */}
                      <button style={s.actionBtn} title="View details" onClick={() => setSelected(sa)}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
                        </svg>
                      </button>
                      {/* Block/Unblock */}
                      {sa.status === "active" ? (
                        <button style={{ ...s.actionBtn, color: "#c0392b" }} title="Block"
                          onClick={async () => {
                            try {
                              await updateSuperAdminStatus(sa._id, "blocked");
                              showToast("Superadmin blocked", "success");
                              fetchList();
                            } catch { showToast("Failed", "error"); }
                          }}>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" /><line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                          </svg>
                        </button>
                      ) : (
                        <button style={{ ...s.actionBtn, color: "#639922" }} title="Activate"
                          onClick={async () => {
                            try {
                              await updateSuperAdminStatus(sa._id, "active");
                              showToast("Superadmin activated", "success");
                              fetchList();
                            } catch { showToast("Failed", "error"); }
                          }}>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        </button>
                      )}
                      {/* Delete */}
                      {/* <button style={{ ...s.actionBtn, color: "#c0392b" }} title="Delete" onClick={() => handleDelete(sa)}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6l-1 14H6L5 6" />
                          <path d="M10 11v6M14 11v6" />
                          <path d="M9 6V4h6v2" />
                        </svg>
                      </button> */}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

// ─── STYLES ───────────────────────────────────────────────
const s = {
  page: { minHeight: "100%", background: "var(--admin-page-bg)", color: "var(--admin-body-text)", fontFamily: "'IBM Plex Sans', sans-serif", padding: "24px 32px 48px" },
  header: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 16 },
  breadcrumb: { fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: "var(--admin-muted-text)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 },
  pageTitle: { fontSize: 24, fontWeight: 700, color: "var(--admin-heading)", letterSpacing: "-0.03em", margin: 0 },
  createBtn: { height: 38, padding: "0 18px", background: "var(--admin-primary-btn)", color: "var(--admin-btn-text)", border: "none", borderRadius: 8, fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 12, fontWeight: 600, cursor: "pointer", boxShadow: "0 2px 10px rgba(0,0,0,0.15)" },
  statsRow: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14, marginBottom: 24 },
  statCard: { background: "var(--admin-card-bg)", border: "1px solid var(--admin-border)", borderRadius: 12, padding: "16px 20px", display: "flex", gap: 14, alignItems: "flex-start", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" },
  statLabel: { fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "var(--admin-muted-text)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6, fontWeight: 500 },
  statValue: { fontSize: 22, fontWeight: 700, color: "var(--admin-heading)", letterSpacing: "-0.02em", lineHeight: 1 },
  filters: { display: "flex", alignItems: "center", gap: 12, marginBottom: 18, flexWrap: "wrap" },
  searchWrap: { display: "flex", alignItems: "center", gap: 8, background: "var(--admin-input-bg)", border: "1px solid var(--admin-input-border)", borderRadius: 8, padding: "0 12px", height: 38, flex: "1 1 240px", maxWidth: 360 },
  searchInput: { flex: 1, background: "transparent", border: "none", outline: "none", fontSize: 12, fontFamily: "'IBM Plex Mono', monospace", color: "var(--admin-body-text)" },
  clearBtn: { background: "none", border: "none", color: "var(--admin-muted-text)", cursor: "pointer", fontSize: 12, padding: 0 },
  countLabel: { fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: "var(--admin-muted-text)", marginLeft: "auto", background: "var(--admin-secondary-btn)", border: "1px solid var(--admin-border)", padding: "4px 10px", borderRadius: 12 },
  tableWrap: { background: "var(--admin-card-bg)", border: "1px solid var(--admin-border)", borderRadius: 14, overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, letterSpacing: "0.08em", color: "var(--admin-muted-text)", textTransform: "uppercase", textAlign: "left", padding: "12px 16px", borderBottom: "1px solid var(--admin-border)", background: "var(--admin-secondary-btn)", whiteSpace: "nowrap", fontWeight: 600 },
  td: { padding: "12px 16px", fontSize: 13, color: "var(--admin-body-text)", borderBottom: "1px solid var(--admin-border)", verticalAlign: "middle", transition: "background 0.12s" },
  monoCell: { fontFamily: "'IBM Plex Mono', monospace", fontSize: 12 },
  userCell: { display: "flex", alignItems: "center", gap: 10 },
  avatar: { width: 32, height: 32, borderRadius: 8, background: "var(--admin-primary-btn)", color: "var(--admin-btn-text)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, fontWeight: 700, flexShrink: 0 },
  userName: { fontSize: 13, fontWeight: 600, color: "var(--admin-heading)" },
  userId: { fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "var(--admin-muted-text)", marginTop: 2 },
  contactCell: { display: "flex", flexDirection: "column", gap: 2, fontSize: 12, fontFamily: "'IBM Plex Mono', monospace" },
  actions: { display: "flex", alignItems: "center", gap: 6 },
  actionBtn: { width: 30, height: 30, borderRadius: 6, border: "1px solid var(--admin-border)", background: "var(--admin-secondary-btn)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--admin-secondary-text)", padding: 0, transition: "all 0.15s ease" },
  empty: { padding: "60px 0", textAlign: "center" },
  emptyIcon: { fontSize: 28, color: "var(--admin-muted-text)", marginBottom: 8 },
  emptyText: { fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: "var(--admin-muted-text)" },
  spinnerWrap: { padding: "60px 0", display: "flex", justifyContent: "center" },
  spinner: { width: 24, height: 24, border: "2px solid var(--admin-border)", borderTopColor: "var(--admin-primary-btn)", borderRadius: "50%", animation: "spin 0.7s linear infinite" },
  toast: { position: "fixed", bottom: 24, right: 24, padding: "10px 18px", borderRadius: 8, border: "1px solid var(--admin-border)", fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, zIndex: 9999, animation: "fadeIn 0.2s ease", boxShadow: "0 8px 24px rgba(0,0,0,0.15)", background: "var(--admin-card-bg)", color: "var(--admin-heading)" },
  modalOverlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, animation: "fadeIn 0.15s ease" },
  modal: { background: "var(--admin-card-bg)", border: "1px solid var(--admin-border)", borderRadius: 14, padding: "24px 28px", maxWidth: 440, width: "90%", color: "var(--admin-body-text)", boxShadow: "0 20px 50px rgba(0,0,0,0.4)" },
  modalMsg: { fontSize: 14, color: "var(--admin-heading)", marginBottom: 20, lineHeight: 1.5, fontWeight: 500 },
  modalActions: { display: "flex", justifyContent: "flex-end", gap: 8 },
  modalCancel: { padding: "8px 16px", border: "1px solid var(--admin-border)", borderRadius: 8, background: "var(--admin-secondary-btn)", fontSize: 12, fontFamily: "'IBM Plex Sans', sans-serif", color: "var(--admin-secondary-text)", cursor: "pointer", fontWeight: 500 },
  modalConfirm: { padding: "8px 18px", border: "none", borderRadius: 8, background: "var(--admin-primary-btn)", color: "var(--admin-btn-text)", fontSize: 12, fontFamily: "'IBM Plex Sans', sans-serif", cursor: "pointer", fontWeight: 600, boxShadow: "0 2px 10px rgba(0,0,0,0.15)" },
  drawerOverlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", zIndex: 999, display: "flex", justifyContent: "flex-end", animation: "fadeIn 0.15s ease" },
  drawer: { width: "min(440px, 95vw)", background: "var(--admin-card-bg)", color: "var(--admin-body-text)", height: "100%", overflowY: "auto", borderLeft: "1px solid var(--admin-border)", display: "flex", flexDirection: "column", animation: "slideIn 0.2s ease", boxShadow: "0 0 50px rgba(0,0,0,0.5)" },
  drawerHeader: { padding: "20px 24px", borderBottom: "1px solid var(--admin-border)", display: "flex", alignItems: "flex-start", justifyContent: "space-between", position: "sticky", top: 0, background: "var(--admin-card-bg)", zIndex: 1 },
  drawerName: { fontSize: 17, fontWeight: 700, color: "var(--admin-heading)", marginBottom: 4 },
  drawerRole: { fontSize: 12, color: "var(--admin-muted-text)" },
  closeBtn: { width: 30, height: 30, border: "1px solid var(--admin-border)", borderRadius: 7, background: "var(--admin-secondary-btn)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "var(--admin-secondary-text)", padding: 0 },
  drawerBody: { padding: "0 24px 24px", flex: 1 },
  drawerSection: { marginTop: 24 },
  drawerSectionLabel: { fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, letterSpacing: "0.1em", color: "var(--admin-muted-text)", textTransform: "uppercase", marginBottom: 12, display: "flex", alignItems: "center", gap: 8, fontWeight: 600 },
  infoGrid: { display: "flex", flexDirection: "column", gap: 0, border: "1px solid var(--admin-border)", borderRadius: 10, overflow: "hidden" },
  infoRow: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", borderBottom: "1px solid var(--admin-border)", fontSize: 12 },
  infoLabel: { fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "var(--admin-muted-text)" },
  infoVal: { fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: "var(--admin-heading)", textAlign: "right", maxWidth: "60%", wordBreak: "break-all", fontWeight: 500 },
  limitLabel: { fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "var(--admin-muted-text)", letterSpacing: "0.08em", textTransform: "uppercase" },
  limitInput: { height: 36, border: "1px solid var(--admin-input-border)", borderRadius: 8, padding: "0 12px", fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: "var(--admin-body-text)", background: "var(--admin-input-bg)", outline: "none" },
  saveBtn: { width: "100%", height: 38, background: "var(--admin-primary-btn)", color: "var(--admin-btn-text)", border: "none", borderRadius: 8, fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 12, fontWeight: 600, cursor: "pointer", boxShadow: "0 2px 10px rgba(0,0,0,0.15)" },
};

export default SuperAdmins;