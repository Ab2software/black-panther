import React, { useState, useCallback } from "react";
import { useAdminAuth } from "../context/AdminAuthContext";
import { useAdminTheme } from "../context/AdminThemeContext";
import { updateUserWhatsapp } from "../services/adminSettingsService";
import { resetPassword } from "../services/adminAuthService";

const Toast = ({ msg, type, onClose }) => {
  React.useEffect(() => {
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
        boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
        background: type === "error" ? "#fdf2f2" : "#eaf3de",
        borderColor: type === "error" ? "#f0d0d0" : "#c0dd97",
        color: type === "error" ? "#a93226" : "#3b6d11",
      }}
    >
      {msg}
    </div>
  );
};

const Section = ({ title, children }) => (
  <div style={s.section}>
    <div style={s.sectionTitle}>{title}</div>
    <div style={s.sectionBody}>{children}</div>
  </div>
);

const Field = ({ label, hint, children }) => (
  <div style={s.field}>
    <div>
      <div style={s.fieldLabel}>{label}</div>
      {hint && <div style={s.fieldHint}>{hint}</div>}
    </div>
    <div style={s.fieldControl}>{children}</div>
  </div>
);

const Settings = () => {
  const { admin } = useAdminAuth();
  const [toast, setToast] = useState(null);
  const showToast = useCallback(
    (msg, type = "success") => setToast({ msg, type }),
    [],
  );

  // Password
  const [pwd, setPwd] = useState({ current: "", newPwd: "", confirm: "" });
  const [pwdLoading, setPwdLoading] = useState(false);

  // WhatsApp
  const [whatsapp, setWhatsapp] = useState(admin?.whatsapp || "");
  const [whatsappLoading, setWhatsappLoading] = useState(false);

  const handlePasswordChange = async () => {
    if (!pwd.current || !pwd.newPwd || !pwd.confirm)
      return showToast("All password fields are required", "error");
    if (pwd.newPwd !== pwd.confirm)
      return showToast("New passwords do not match", "error");
    if (pwd.newPwd.length < 6)
      return showToast("Password must be at least 6 characters", "error");
    if (pwd.newPwd === pwd.current)
      return showToast(
        "New password must be different from current password",
        "error",
      );

    setPwdLoading(true);
    try {
      await resetPassword({
        oldPassword: pwd.current,
        newPassword: pwd.newPwd,
      });
      showToast("Password changed successfully", "success");
      setPwd({ current: "", newPwd: "", confirm: "" });
    } catch (err) {
      showToast(
        err.response?.data?.message || "Failed to change password",
        "error",
      );
    } finally {
      setPwdLoading(false);
    }
  };

  // ── WhatsApp save ──
  const handleWhatsappSave = async () => {
    if (!whatsapp) return showToast("WhatsApp number is required", "error");
    if (!/^\d{10}$/.test(whatsapp))
      return showToast("Enter a valid 10-digit number", "error");
    setWhatsappLoading(true);
    try {
      await updateUserWhatsapp(admin._id, whatsapp);
      showToast("WhatsApp number updated", "success");
    } catch (err) {
      showToast(
        err.response?.data?.message || "Failed to update WhatsApp",
        "error",
      );
    } finally {
      setWhatsappLoading(false);
    }
  };

  const { theme } = useAdminTheme();
  const meta = {
    label: theme.roleLabel,
    color: theme.badgeColor,
    bg: theme.badgeBg,
    border: theme.badgeBorder,
  };

  return (
    <div style={s.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@300;400;500&display=swap');
        * { box-sizing: border-box; }
        input::placeholder { color: #c0bdb4; font-family: 'IBM Plex Mono', monospace; font-size: 12px; }
        button:disabled { opacity: 0.5; cursor: not-allowed; }
      `}</style>

      {toast && (
        <Toast
          msg={toast.msg}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Header */}
      <div style={s.header}>
        <div>
          <div style={s.breadcrumb}>
            admin / <span style={{ color: "#7a7870" }}>settings</span>
          </div>
          <h1 style={s.pageTitle}>Settings</h1>
        </div>
      </div>

      <div style={s.layout}>
        {/* Left column */}
        <div style={s.leftCol}>
          <div style={s.accountCard}>
            <div style={s.accountAvatar}>
              {(admin?.username?.[0] || "A").toUpperCase()}
            </div>
            <div style={s.accountInfo}>
              <div style={s.accountName}>{admin?.username || "—"}</div>
              <span
                style={{
                  ...s.roleBadge,
                  color: meta.color,
                  background: meta.bg,
                }}
              >
                {meta.label}
              </span>
            </div>

            {whatsapp && /^\d{10}$/.test(whatsapp) && (
              <a
                href={`https://wa.me/91${whatsapp}`}
                target="_blank"
                rel="noreferrer"
                style={s.waLink}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="#25D366">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>{" "}
                wa.me/91{whatsapp}
              </a>
            )}
          </div>

          <div style={s.quickInfo}>
            {[
              ["User ID", admin?._id?.slice(-8) || "—"],
              ["Role", admin?.role || "—"],
              ["Username", admin?.username || "—"],
            ].map(([label, val]) => (
              <div key={label} style={s.quickRow}>
                <span style={s.quickLabel}>{label}</span>
                <span style={s.quickVal}>{val}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right column */}
        <div style={s.rightCol}>
          {/* WhatsApp */}
          <Section title="WhatsApp">
            <Field
              label="WhatsApp Number"
              hint="10-digit number — shown to users assigned to you"
            >
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <div style={s.waPrefix}>+91</div>
                <input
                  type="tel"
                  value={whatsapp}
                  onChange={(e) =>
                    setWhatsapp(e.target.value.replace(/\D/g, "").slice(0, 10))
                  }
                  style={{ ...s.input, width: 150 }}
                  placeholder="9876543210"
                  maxLength={10}
                />
              </div>
            </Field>

            {whatsapp && /^\d{10}$/.test(whatsapp) && (
              <div style={s.waPreview}>
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="#25D366"
                  style={{ flexShrink: 0 }}
                >
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                <span
                  style={{
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: 11,
                    color: "#3b6d11",
                  }}
                >
                  wa.me/91{whatsapp}
                </span>
              </div>
            )}

            <div style={s.sectionFooter}>
              <button
                style={s.saveBtn}
                onClick={handleWhatsappSave}
                disabled={whatsappLoading}
              >
                {whatsappLoading ? "Saving…" : "Save WhatsApp"}
              </button>
            </div>
          </Section>

          {/* Password */}
          <Section title="Change Password">
            <Field label="Current Password">
              <input
                type="password"
                value={pwd.current}
                onChange={(e) => setPwd({ ...pwd, current: e.target.value })}
                style={s.input}
                placeholder="••••••••"
              />
            </Field>
            <Field label="New Password">
              <input
                type="password"
                value={pwd.newPwd}
                onChange={(e) => setPwd({ ...pwd, newPwd: e.target.value })}
                style={s.input}
                placeholder="min 6 characters"
              />
            </Field>
            <Field label="Confirm New Password">
              <input
                type="password"
                value={pwd.confirm}
                onChange={(e) => setPwd({ ...pwd, confirm: e.target.value })}
                style={s.input}
                placeholder="repeat new password"
              />
            </Field>
            <div style={s.sectionFooter}>
              <button
                style={s.saveBtn}
                onClick={handlePasswordChange}
                disabled={pwdLoading}
              >
                {pwdLoading ? "Changing…" : "Change Password"}
              </button>
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
};

const s = {
  page: {
    minHeight: "100vh",
    background: "var(--admin-page-bg)",
    fontFamily: "'IBM Plex Sans', sans-serif",
    padding: "24px 28px",
    color: "var(--admin-body-text)",
  },
  header: { marginBottom: 24 },
  breadcrumb: {
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: 11,
    color: "var(--admin-muted-text)",
    letterSpacing: "0.06em",
    marginBottom: 6,
    textTransform: "uppercase",
  },
  pageTitle: {
    fontSize: 26,
    fontWeight: 700,
    color: "var(--admin-heading)",
    letterSpacing: "-0.02em",
    margin: 0,
  },
  layout: {
    display: "grid",
    gridTemplateColumns: "260px 1fr",
    gap: 20,
    alignItems: "start",
  },
  leftCol: { display: "flex", flexDirection: "column", gap: 14 },
  accountCard: {
    background: "var(--admin-card-bg)",
    border: "1px solid var(--admin-border)",
    borderRadius: 12,
    padding: "24px 18px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 14,
    textAlign: "center",
    boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
  },
  accountAvatar: {
    width: 54,
    height: 54,
    borderRadius: 12,
    background: "var(--admin-primary-btn)",
    color: "var(--admin-btn-text)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: 20,
    fontWeight: 700,
  },
  accountInfo: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 6,
  },
  accountName: { fontSize: 16, fontWeight: 700, color: "var(--admin-heading)" },
  roleBadge: {
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: 10,
    fontWeight: 600,
    letterSpacing: "0.06em",
    padding: "3px 10px",
    borderRadius: 6,
  },
  waLink: {
    display: "flex",
    alignItems: "center",
    gap: 5,
    fontSize: 11,
    fontFamily: "'IBM Plex Mono', monospace",
    color: "#25D366",
    textDecoration: "none",
  },
  waPreview: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    margin: "0 20px 12px",
    padding: "8px 12px",
    background: "var(--admin-success-bg)",
    borderRadius: 8,
    border: "1px solid var(--admin-success)",
  },
  waPrefix: {
    height: 36,
    padding: "0 12px",
    background: "var(--admin-card-hover)",
    border: "1px solid var(--admin-input-border)",
    borderRadius: 8,
    display: "flex",
    alignItems: "center",
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: 12,
    color: "var(--admin-muted-text)",
    flexShrink: 0,
  },
  quickInfo: {
    background: "var(--admin-card-bg)",
    border: "1px solid var(--admin-border)",
    borderRadius: 12,
    overflow: "hidden",
    boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
  },
  quickRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "11px 16px",
    borderBottom: "1px solid var(--admin-border)",
  },
  quickLabel: {
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: 10,
    color: "var(--admin-muted-text)",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    fontWeight: 600,
  },
  quickVal: {
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: 11,
    color: "var(--admin-heading)",
    fontWeight: 600,
  },
  rightCol: { display: "flex", flexDirection: "column", gap: 16 },
  section: {
    background: "var(--admin-card-bg)",
    border: "1px solid var(--admin-border)",
    borderRadius: 12,
    overflow: "hidden",
    boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
  },
  sectionTitle: {
    padding: "16px 22px",
    borderBottom: "1px solid var(--admin-border)",
    fontSize: 14,
    fontWeight: 600,
    color: "var(--admin-heading)",
    background: "var(--admin-sidebar-bg)",
  },
  sectionBody: { padding: "8px 0" },
  sectionFooter: {
    padding: "14px 22px",
    borderTop: "1px solid var(--admin-border)",
    display: "flex",
    justifyContent: "flex-end",
  },
  field: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "14px 22px",
    borderBottom: "1px solid var(--admin-border)",
  },
  fieldLabel: { fontSize: 13, color: "var(--admin-heading)", fontWeight: 500 },
  fieldHint: {
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: 10,
    color: "var(--admin-muted-text)",
    marginTop: 2,
  },
  fieldControl: { display: "flex", alignItems: "center" },
  input: {
    height: 38,
    border: "1px solid var(--admin-input-border)",
    borderRadius: 8,
    padding: "0 12px",
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: 12,
    color: "var(--admin-body-text)",
    background: "var(--admin-input-bg)",
    outline: "none",
    width: 220,
  },
  saveBtn: {
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
  },
};

export default Settings;