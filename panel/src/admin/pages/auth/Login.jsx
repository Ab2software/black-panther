import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

import { adminLogin } from "../../services/adminAuthService";
import { useAdminAuth } from "../../context/AdminAuthContext";

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAdminAuth();

  const [formData, setFormData] = useState({ username: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [focused, setFocused] = useState("");



  const handleChange = (e) => {
    setError("");
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  setError("");

  try {
    setLoading(true);

    const response = await adminLogin(formData);

    // console.log("LOGIN RESPONSE:", response);

    if (!response?.success) {
      setError(response?.message || "Login failed");
      return;
    }

    // FIX: normalize admin object
    const adminData = response.admin || response.data?.admin || response.data;

    if (!adminData) {
      setError("Invalid server response (no admin data)");
      return;
    }

    // 🔥 CRITICAL FIX: ensure role is not lost
    const normalizedAdmin = {
      ...adminData,
      role: adminData.role || "admin",
    };

    login(normalizedAdmin, response.token);

    navigate("/admin/dashboard");
  } catch (err) {
    setError(err.response?.data?.message || "Invalid credentials");
  } finally {
    setLoading(false);
  }
};

  return (
    <div style={styles.root}>
      {/* Subtle grid overlay */}
      <div style={styles.grid} aria-hidden="true" />

      <div style={styles.wrapper}>
        {/* Left accent bar */}
        <div style={styles.accentBar} aria-hidden="true" />

        <div style={styles.card}>
          {/* Header */}
          <div style={styles.header}>
            <div style={styles.badge}>
              <span style={styles.badgeDot} />
              <span style={styles.badgeText}>MANAGEMENT CONSOLE</span>
            </div>
            <h1 style={styles.heading}>Sign in</h1>
            <p style={styles.subheading}>Restricted access. Authorized personnel only.</p>
          </div>

          {/* Error */}
          {error && (
            <div style={styles.errorBox} role="alert">
              <span style={styles.errorIcon}>!</span>
              <span style={styles.errorText}>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} style={styles.form} noValidate>
            <div style={styles.fieldGroup}>
              <label style={styles.label} htmlFor="username">
                Username
              </label>
              <div style={{
                ...styles.inputWrapper,
                ...(focused === "username" ? styles.inputWrapperFocused : {})
              }}>
                <span style={styles.inputPrefix}>@</span>
                <input
                  id="username"
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  onFocus={() => setFocused("username")}
                  onBlur={() => setFocused("")}
                  placeholder="your_username"
                  style={styles.input}
                  autoComplete="username"
                  spellCheck={false}
                  required
                />
              </div>
            </div>

            <div style={styles.fieldGroup}>
              <label style={styles.label} htmlFor="password">
                Password
              </label>
              <div style={{
                ...styles.inputWrapper,
                ...(focused === "password" ? styles.inputWrapperFocused : {})
              }}>
                <span style={styles.inputPrefix}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </span>
                <input
                  id="password"
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  onFocus={() => setFocused("password")}
                  onBlur={() => setFocused("")}
                  placeholder="••••••••••"
                  style={styles.input}
                  autoComplete="current-password"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                ...styles.button,
                ...(loading ? styles.buttonLoading : {})
              }}
            >
              {loading ? (
                <span style={styles.buttonInner}>
                  <span style={styles.spinner} />
                  Authenticating
                </span>
              ) : (
                <span style={styles.buttonInner}>
                  Continue
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </span>
              )}
            </button>
          </form>

          {/* Footer */}
          <p style={styles.footerText}>
            All activity on this platform is monitored and logged.
          </p>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@300;400;500&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes errorIn {
          from { opacity: 0; transform: translateX(-4px); }
          to   { opacity: 1; transform: translateX(0); }
        }

        input::placeholder {
          color: #c8c6bc;
          font-family: 'IBM Plex Mono', monospace;
        }
        input:-webkit-autofill {
          -webkit-box-shadow: 0 0 0px 1000px #fafaf8 inset !important;
          -webkit-text-fill-color: #111110 !important;
        }
        button:hover:not(:disabled) {
          background: #2a2a28 !important;
        }
        button:active:not(:disabled) {
          transform: scale(0.985) !important;
        }
      `}</style>
    </div>
  );
};

const styles = {
  root: {
    minHeight: "100vh",
    background: "#080c14",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "'IBM Plex Sans', sans-serif",
    padding: "24px",
    position: "relative",
    overflow: "hidden",
  },

  grid: {
    position: "absolute",
    inset: 0,
    backgroundImage: `
      linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)
    `,
    backgroundSize: "40px 40px",
    pointerEvents: "none",
  },

  wrapper: {
    position: "relative",
    width: "100%",
    maxWidth: "420px",
    display: "flex",
    animation: "fadeSlideIn 0.4s ease both",
  },

  accentBar: {
    width: "4px",
    background: "linear-gradient(180deg, #d4af37, #8b5cf6, #2563eb)",
    borderRadius: "4px 0 0 4px",
    flexShrink: 0,
    minHeight: "200px",
  },

  card: {
    flex: 1,
    background: "#111726",
    border: "1px solid #1e293b",
    borderLeft: "none",
    borderRadius: "0 12px 12px 0",
    padding: "36px 32px 28px",
    boxShadow: "0 25px 60px rgba(0,0,0,0.5), 0 0 40px rgba(37,99,235,0.08)",
  },

  header: {
    marginBottom: "28px",
  },

  badge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    background: "rgba(34, 197, 94, 0.12)",
    border: "1px solid rgba(34, 197, 94, 0.25)",
    borderRadius: "6px",
    padding: "4px 10px",
    marginBottom: "20px",
  },

  badgeDot: {
    width: "6px",
    height: "6px",
    borderRadius: "50%",
    background: "#22c55e",
    boxShadow: "0 0 8px #22c55e",
    display: "block",
  },

  badgeText: {
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: "10px",
    letterSpacing: "0.12em",
    color: "#4ade80",
    fontWeight: 600,
  },

  heading: {
    fontSize: "28px",
    fontWeight: 700,
    color: "#f8fafc",
    letterSpacing: "-0.02em",
    lineHeight: 1.2,
    marginBottom: "6px",
  },

  subheading: {
    fontSize: "12px",
    color: "#94a3b8",
    fontFamily: "'IBM Plex Mono', monospace",
    letterSpacing: "0.01em",
    lineHeight: 1.5,
  },

  errorBox: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    background: "rgba(220, 38, 38, 0.15)",
    border: "1px solid rgba(220, 38, 38, 0.3)",
    borderRadius: "8px",
    padding: "10px 12px",
    marginBottom: "20px",
    animation: "errorIn 0.25s ease both",
  },

  errorIcon: {
    width: "18px",
    height: "18px",
    borderRadius: "50%",
    background: "rgba(220, 38, 38, 0.3)",
    color: "#f87171",
    fontSize: "11px",
    fontWeight: 700,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    fontFamily: "'IBM Plex Mono', monospace",
  },

  errorText: {
    fontSize: "12px",
    color: "#fca5a5",
    fontFamily: "'IBM Plex Mono', monospace",
  },

  form: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },

  fieldGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },

  label: {
    fontSize: "11px",
    color: "#94a3b8",
    fontFamily: "'IBM Plex Mono', monospace",
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    fontWeight: 600,
  },

  inputWrapper: {
    display: "flex",
    alignItems: "center",
    background: "#0a0f1d",
    border: "1px solid #1e293b",
    borderRadius: "8px",
    transition: "border-color 0.15s, box-shadow 0.15s",
    overflow: "hidden",
  },

  inputWrapperFocused: {
    borderColor: "#3b82f6",
    boxShadow: "0 0 0 3px rgba(59, 130, 246, 0.2)",
  },

  inputPrefix: {
    padding: "0 10px 0 12px",
    color: "#64748b",
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: "14px",
    userSelect: "none",
    display: "flex",
    alignItems: "center",
    flexShrink: 0,
  },

  input: {
    flex: 1,
    height: "44px",
    background: "transparent",
    border: "none",
    outline: "none",
    color: "#f8fafc",
    fontSize: "13px",
    fontFamily: "'IBM Plex Mono', monospace",
    paddingRight: "12px",
  },

  button: {
    height: "46px",
    marginTop: "8px",
    background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
    color: "#ffffff",
    border: "none",
    borderRadius: "8px",
    fontSize: "13px",
    fontWeight: 600,
    fontFamily: "'IBM Plex Sans', sans-serif",
    cursor: "pointer",
    transition: "all 0.15s",
    letterSpacing: "0.02em",
    boxShadow: "0 4px 14px rgba(37,99,235,0.4)",
  },

  buttonLoading: {
    background: "#1e293b",
    color: "#64748b",
    cursor: "not-allowed",
    boxShadow: "none",
  },

  buttonInner: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
  },

  spinner: {
    width: "14px",
    height: "14px",
    border: "2px solid rgba(255,255,255,0.3)",
    borderTopColor: "#ffffff",
    borderRadius: "50%",
    animation: "spin 0.7s linear infinite",
    display: "inline-block",
  },

  footerText: {
    marginTop: "24px",
    fontSize: "10px",
    color: "#64748b",
    fontFamily: "'IBM Plex Mono', monospace",
    textAlign: "center",
    lineHeight: 1.6,
    borderTop: "1px solid #1e293b",
    paddingTop: "16px",
  },
};

export default Login;