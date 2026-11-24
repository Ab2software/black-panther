import React, { useState, useEffect, useCallback } from "react";
import {
  getSubAdmins,
  createSubAdmin,
  activateSubAdmin,
  deactivateSubAdmin,
  deleteSubAdmin,
} from "../services/subAdminService";

// ─── STATUS BADGE ─────────────────────────────────────────
const AdminStatusBadge = ({ status }) => {
  const active = status === "active";
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        background: active ? "var(--admin-success-bg)" : "var(--admin-secondary-btn)",
        color: active ? "var(--admin-success)" : "var(--admin-muted-text)",
        fontSize: 11,
        fontFamily: "'IBM Plex Mono', monospace",
        fontWeight: 600,
        padding: "3px 8px",
        borderRadius: 20,
        letterSpacing: "0.04em",
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: active ? "var(--admin-success)" : "var(--admin-muted-text)",
          display: "inline-block",
        }}
      />
      {active ? "Active" : "Inactive"}
    </span>
  );
};

// ─── TOAST ────────────────────────────────────────────────
const Toast = ({ msg, type, onClose }) => {
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div
      style={{
        position: "fixed",
        bottom: 24,
        right: 24,
        padding: "10px 18px",
        borderRadius: 7,
        border: "1px solid",
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: 12,
        zIndex: 9999,
        background: type === "error" ? "#fdf2f2" : "#eaf3de",
        borderColor: type === "error" ? "#f0d0d0" : "#c0dd97",
        color: type === "error" ? "#a93226" : "#3b6d11",
        boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
      }}
    >
      {msg}
    </div>
  );
};

// ─── CREATE MODAL ─────────────────────────────────────────
const CreateModal = ({ onClose, onCreated }) => {
  const [form, setForm] = useState({ username: "", password: "", fullName: "", email: "", phone: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!form.username || !form.password) {
      setError("Username and password are required.");
      return;
    }
    try {
      setLoading(true);
      setError("");
      const res = await createSubAdmin(form);
      if (res.success) {
        onCreated(res.data);
        onClose();
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create sub-admin.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.modalOverlay} onClick={onClose}>
      <div style={s.modal} onClick={(e) => e.stopPropagation()}>
        <div style={s.modalHeader}>
          <div style={s.modalTitle}>Create sub-admin</div>
          <button style={s.closeBtn} onClick={onClose}>✕</button>
        </div>

        {error && (
          <div style={s.errorBox}>{error}</div>
        )}

        <div style={s.formGrid}>
          {[
            { key: "username", label: "Username *", type: "text" },
            { key: "password", label: "Password *", type: "password" },
            { key: "fullName", label: "Full name", type: "text" },
            { key: "email", label: "Email", type: "email" },
            { key: "phone", label: "Phone", type: "text" },
          ].map(({ key, label, type }) => (
            <div key={key} style={s.fieldGroup}>
              <label style={s.label}>{label}</label>
              <input
                type={type}
                value={form[key]}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                style={s.input}
                placeholder={label.replace(" *", "")}
              />
            </div>
          ))}
        </div>

        <div style={s.modalNote}>
          New sub-admins start as <strong>inactive</strong>. Activate them manually after creation.
        </div>

        <div style={s.modalActions}>
          <button style={s.cancelBtn} onClick={onClose}>Cancel</button>
          <button style={s.createBtn} onClick={handleSubmit} disabled={loading}>
            {loading ? "Creating…" : "Create sub-admin"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── CONFIRM MODAL ────────────────────────────────────────
const ConfirmModal = ({ message, danger, onConfirm, onClose }) => (
  <div style={s.modalOverlay} onClick={onClose}>
    <div style={{ ...s.modal, maxWidth: 360 }} onClick={(e) => e.stopPropagation()}>
      <div style={s.modalMsg}>{message}</div>
      <div style={s.modalActions}>
        <button style={s.cancelBtn} onClick={onClose}>Cancel</button>
        <button
          style={{ ...s.createBtn, background: danger ? "#c0392b" : "#111110" }}
          onClick={onConfirm}
        >
          Confirm
        </button>
      </div>
    </div>
  </div>
);

// ─── MAIN PAGE ────────────────────────────────────────────
const SubAdmins = () => {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [confirmModal, setConfirmModal] = useState(null);

  const showToast = useCallback((msg, type = "success") => setToast({ msg, type }), []);

  const fetchAdmins = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getSubAdmins();
      if (res.success) setAdmins(res.data);
    } catch {
      showToast("Failed to fetch sub-admins.", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { fetchAdmins(); }, [fetchAdmins]);

  const handleToggle = (admin) => {
    const isActive = admin.adminStatus === "active";
    setConfirmModal({
      message: `${isActive ? "Deactivate" : "Activate"} "${admin.username}"? ${
        isActive
          ? "They will lose access to the panel immediately."
          : "New users who register will be assigned to them."
      }`,
      danger: isActive,
      onConfirm: async () => {
        setConfirmModal(null);
        try {
          if (isActive) {
            await deactivateSubAdmin(admin._id);
            showToast(`"${admin.username}" deactivated.`);
          } else {
            await activateSubAdmin(admin._id);
            showToast(`"${admin.username}" activated.`);
          }
          fetchAdmins();
        } catch {
          showToast("Failed to update status.", "error");
        }
      },
    });
  };

  const handleDelete = (admin) => {
    setConfirmModal({
      message: `Delete "${admin.username}"? Their ${admin.userCount} assigned user(s) will be unassigned.`,
      danger: true,
      onConfirm: async () => {
        setConfirmModal(null);
        try {
          await deleteSubAdmin(admin._id);
          showToast(`"${admin.username}" deleted.`);
          fetchAdmins();
        } catch {
          showToast("Failed to delete sub-admin.", "error");
        }
      },
    });
  };

  const activeCount = admins.filter((a) => a.adminStatus === "active").length;

  return (
    <div style={s.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@300;400;500&display=swap');
        * { box-sizing: border-box; }
        @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
        input::placeholder { color: #c0bdb4; font-family: 'IBM Plex Mono', monospace; font-size: 12px; }
        button:disabled { opacity: 0.5; cursor: not-allowed; }
        tr:hover td { background: #fafaf8 !important; }
      `}</style>

      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
      {showCreate && (
        <CreateModal
          onClose={() => setShowCreate(false)}
          onCreated={(newAdmin) => {
            setAdmins((prev) => [{ ...newAdmin, userCount: 0 }, ...prev]);
            showToast(`Sub-admin "${newAdmin.username}" created.`);
          }}
        />
      )}
      {confirmModal && (
        <ConfirmModal
          message={confirmModal.message}
          danger={confirmModal.danger}
          onConfirm={confirmModal.onConfirm}
          onClose={() => setConfirmModal(null)}
        />
      )}

      {/* Header */}
      <div style={s.header}>
        <div>
          <div style={s.breadcrumb}>admin / <span style={{ color: "#7a7870" }}>sub admins</span></div>
          <h1 style={s.pageTitle}>Sub Admins</h1>
        </div>
        <button style={s.createBtn} onClick={() => setShowCreate(true)}>
          + Create sub-admin
        </button>
      </div>

      {/* Summary strip */}
      <div style={s.summaryStrip}>
        <div style={s.summaryItem}>
          <span style={s.summaryLabel}>Total</span>
          <span style={s.summaryValue}>{admins.length}</span>
        </div>
        <div style={s.summaryDivider} />
        <div style={s.summaryItem}>
          <span style={s.summaryLabel}>Active</span>
          <span style={{ ...s.summaryValue, color: "#3b6d11" }}>{activeCount}</span>
        </div>
        <div style={s.summaryDivider} />
        <div style={s.summaryItem}>
          <span style={s.summaryLabel}>Inactive</span>
          <span style={{ ...s.summaryValue, color: "#7a7870" }}>{admins.length - activeCount}</span>
        </div>
        <div style={s.summaryDivider} />
        <div style={s.summaryItem}>
          <span style={s.summaryLabel}>Total users assigned</span>
          <span style={s.summaryValue}>{admins.reduce((acc, a) => acc + (a.userCount || 0), 0)}</span>
        </div>
      </div>

      {/* Info note */}
      <div style={s.infoNote}>
        When a user registers, they are automatically assigned to the currently <strong>active</strong> sub-admin.
        Only super admin can activate, deactivate, or reassign users between admins.
      </div>

      {/* Table */}
      <div style={s.tableWrap}>
        {loading ? (
          <div style={s.empty}>
            <div style={s.spinner} />
          </div>
        ) : admins.length === 0 ? (
          <div style={s.empty}>
            <div style={{ fontSize: 28, color: "#d0cec6", marginBottom: 8 }}>⊘</div>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: "#c0bdb4" }}>
              No sub-admins yet. Create one to get started.
            </div>
          </div>
        ) : (
          <table style={s.table}>
            <thead>
              <tr>
                {["Sub-admin", "Contact", "Status", "Users assigned", "Created", "Actions"].map((h) => (
                  <th key={h} style={s.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {admins.map((admin) => (
                <tr key={admin._id}>
                  <td style={s.td}>
                    <div style={s.userCell}>
                      <div style={s.avatar}>{(admin.username?.[0] || "A").toUpperCase()}</div>
                      <div>
                        <div style={s.userName}>{admin.username}</div>
                        <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "#b0aea6" }}>
                          {admin.fullName || "—"}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td style={s.td}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 2, fontSize: 12, fontFamily: "'IBM Plex Mono', monospace" }}>
                      <span>{admin.email || "—"}</span>
                      <span style={{ color: "#b0aea6" }}>{admin.phone || ""}</span>
                    </div>
                  </td>

                  <td style={s.td}>
                    <AdminStatusBadge status={admin.adminStatus} />
                  </td>

                  <td style={{ ...s.td, fontFamily: "'IBM Plex Mono', monospace", fontSize: 13 }}>
                    {admin.userCount ?? 0} users
                  </td>

                  <td style={{ ...s.td, fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: "#8a8880" }}>
                    {admin.createdAt
                      ? new Date(admin.createdAt).toLocaleDateString("en-IN", {
                          day: "2-digit", month: "short", year: "numeric",
                        })
                      : "—"}
                  </td>

                  <td style={s.td}>
                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      {/* Activate / Deactivate toggle */}
                      <button
                        style={{
                          ...s.actionBtn,
                          color: admin.adminStatus === "active" ? "#ba7517" : "#3b6d11",
                        }}
                        title={admin.adminStatus === "active" ? "Deactivate" : "Activate"}
                        onClick={() => handleToggle(admin)}
                      >
                        {admin.adminStatus === "active" ? (
                          // Pause icon
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>
                          </svg>
                        ) : (
                          // Play icon
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <polygon points="5 3 19 12 5 21 5 3"/>
                          </svg>
                        )}
                      </button>

                      {/* Delete */}
                      {/* <button
                        style={{ ...s.actionBtn, color: "#c0392b" }}
                        title="Delete sub-admin"
                        onClick={() => handleDelete(admin)}
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                          <polyline points="3 6 5 6 21 6"/>
                          <path d="M19 6l-1 14H6L5 6"/>
                          <path d="M10 11v6M14 11v6"/>
                          <path d="M9 6V4h6v2"/>
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
  summaryStrip: {
    background: "var(--admin-card-bg)",
    border: "1px solid var(--admin-border)",
    borderRadius: 12,
    display: "flex",
    alignItems: "center",
    padding: "16px 24px",
    gap: 0,
    marginBottom: 20,
    boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
  },
  summaryItem: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
    padding: "0 24px",
  },
  summaryLabel: {
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: 10,
    color: "var(--admin-muted-text)",
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    fontWeight: 500,
  },
  summaryValue: {
    fontSize: 22,
    fontWeight: 700,
    color: "var(--admin-heading)",
  },
  summaryDivider: {
    width: 1,
    height: 32,
    background: "var(--admin-border)",
  },
  infoNote: {
    background: "var(--admin-card-bg)",
    border: "1px solid var(--admin-border)",
    borderRadius: 10,
    padding: "12px 16px",
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: 11,
    color: "var(--admin-muted-text)",
    lineHeight: 1.6,
    marginBottom: 20,
  },
  tableWrap: {
    background: "var(--admin-card-bg)",
    border: "1px solid var(--admin-border)",
    borderRadius: 14,
    overflow: "hidden",
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
    fontWeight: 600,
  },
  td: {
    padding: "12px 16px",
    fontSize: 13,
    color: "var(--admin-body-text)",
    borderBottom: "1px solid var(--admin-border)",
    verticalAlign: "middle",
    transition: "background 0.12s",
  },
  userCell: { display: "flex", alignItems: "center", gap: 10 },
  avatar: {
    width: 32, height: 32, borderRadius: 8,
    background: "var(--admin-primary-btn)", color: "var(--admin-btn-text)",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, fontWeight: 700,
    flexShrink: 0,
  },
  userName: { fontSize: 13, fontWeight: 600, color: "var(--admin-heading)" },
  actionBtn: {
    width: 30, height: 30, borderRadius: 6,
    border: "1px solid var(--admin-border)", background: "var(--admin-secondary-btn)",
    display: "flex", alignItems: "center", justifyContent: "center",
    cursor: "pointer", color: "var(--admin-secondary-text)",
    transition: "all 0.15s ease", padding: 0,
  },
  empty: { padding: "60px 0", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" },
  spinner: {
    width: 24, height: 24,
    border: "2px solid var(--admin-border)", borderTopColor: "var(--admin-primary-btn)",
    borderRadius: "50%", animation: "spin 0.7s linear infinite",
  },

  // Modal
  modalOverlay: {
    position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)",
    backdropFilter: "blur(6px)",
    display: "flex", alignItems: "center", justifyContent: "center",
    zIndex: 1000, animation: "fadeIn 0.15s ease",
  },
  modal: {
    background: "var(--admin-card-bg)", border: "1px solid var(--admin-border)",
    borderRadius: 14, padding: "24px 28px",
    maxWidth: 480, width: "90%",
    boxShadow: "0 20px 50px rgba(0,0,0,0.4)",
    color: "var(--admin-body-text)",
  },
  modalHeader: {
    display: "flex", justifyContent: "space-between",
    alignItems: "center", marginBottom: 20,
  },
  modalTitle: { fontSize: 16, fontWeight: 700, color: "var(--admin-heading)" },
  closeBtn: {
    width: 30, height: 30, border: "1px solid var(--admin-border)",
    borderRadius: 7, background: "var(--admin-secondary-btn)", cursor: "pointer",
    fontSize: 12, color: "var(--admin-secondary-text)", padding: 0,
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  formGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 },
  fieldGroup: { display: "flex", flexDirection: "column", gap: 5 },
  label: {
    fontFamily: "'IBM Plex Mono', monospace", fontSize: 10,
    color: "var(--admin-muted-text)", letterSpacing: "0.08em", textTransform: "uppercase",
  },
  input: {
    height: 36, border: "1px solid var(--admin-input-border)", borderRadius: 8,
    padding: "0 12px", fontFamily: "'IBM Plex Mono', monospace",
    fontSize: 12, color: "var(--admin-body-text)", background: "var(--admin-input-bg)", outline: "none",
  },
  modalNote: {
    fontFamily: "'IBM Plex Mono', monospace", fontSize: 11,
    color: "var(--admin-muted-text)", background: "var(--admin-secondary-btn)",
    border: "1px solid var(--admin-border)", borderRadius: 8,
    padding: "10px 14px", marginBottom: 16, lineHeight: 1.6,
  },
  modalMsg: { fontSize: 14, color: "var(--admin-heading)", marginBottom: 20, lineHeight: 1.5, fontWeight: 500 },
  modalActions: { display: "flex", justifyContent: "flex-end", gap: 8 },
  cancelBtn: {
    padding: "8px 16px", border: "1px solid var(--admin-border)", borderRadius: 8,
    background: "var(--admin-secondary-btn)", fontSize: 12, color: "var(--admin-secondary-text)", cursor: "pointer",
    fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: 500,
  },
  createBtn: {
    padding: "8px 18px", border: "none", borderRadius: 8,
    background: "var(--admin-primary-btn)", color: "var(--admin-btn-text)", fontSize: 12,
    fontFamily: "'IBM Plex Sans', sans-serif", cursor: "pointer", fontWeight: 600,
    boxShadow: "0 2px 10px rgba(0,0,0,0.15)",
  },
  errorBox: {
    background: "var(--admin-danger-bg)", border: "1px solid var(--admin-border)",
    borderRadius: 8, padding: "10px 14px", marginBottom: 14,
    fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: "var(--admin-danger)",
  },
};

export default SubAdmins;