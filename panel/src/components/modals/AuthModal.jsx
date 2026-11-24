import React, { useState } from "react";
import { X, User, Lock, Play, Sparkles, ShieldCheck, CheckCircle2, AlertCircle } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import PantherLogo from "../common/PantherLogo";

export default function AuthModal({ isOpen = true, onClose }) {
  const { login, demoLogin } = useAuth();
  const [activeTab, setActiveTab] = useState("player"); // "player" | "demo"
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  if (!isOpen) return null;

  const handlePlayerLogin = async (e) => {
    e?.preventDefault();
    setError("");
    setSuccess("");
    if (!username.trim() || !password.trim()) {
      setError("Please enter both username and password");
      return;
    }
    setLoading(true);
    try {
      await login({ username, password });
      setSuccess("Login successful! Welcome back.");
      setTimeout(() => {
        onClose();
      }, 700);
    } catch (err) {
      setError(err.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  const fillTestPlayer = () => {
    setUsername("player_test");
    setPassword("Player@123");
    setError("");
  };

  const handleDemoLogin = async () => {
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      await demoLogin();
      setSuccess("Demo session activated with ₹10,000 Free Chips!");
      setTimeout(() => {
        onClose();
      }, 800);
    } catch (err) {
      setError(err.message || "Failed to start demo login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.overlay} onClick={onClose}>
      <div style={s.modal} onClick={(e) => e.stopPropagation()}>
        {/* Close Button */}
        <button style={s.closeBtn} onClick={onClose} aria-label="Close modal">
          <X size={18} />
        </button>

        {/* Header with Black Panther Logo */}
        <div style={s.header}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "8px" }}>
            <PantherLogo size={46} showText={false} />
          </div>
          <h2 style={s.title}>BLACK PANTHER</h2>
          <p style={s.subtitle}>Premier Sportsbook & Live Casino Portal</p>
        </div>

        {/* Tab Switcher */}
        <div style={s.tabBar}>
          <button
            style={{
              ...s.tabBtn,
              ...(activeTab === "player" ? s.tabBtnActive : {}),
            }}
            onClick={() => {
              setActiveTab("player");
              setError("");
            }}
          >
            <User size={14} />
            Player Login
          </button>
          <button
            style={{
              ...s.tabBtn,
              ...(activeTab === "demo" ? s.tabBtnActiveDemo : {}),
            }}
            onClick={() => {
              setActiveTab("demo");
              setError("");
            }}
          >
            <Play size={14} fill="currentColor" />
            Instant Demo Play
          </button>
        </div>

        {/* Notifications */}
        {error && (
          <div style={s.errorBox}>
            <AlertCircle size={15} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div style={s.successBox}>
            <CheckCircle2 size={15} style={{ flexShrink: 0 }} />
            <span>{success}</span>
          </div>
        )}

        {/* TAB 1: PLAYER LOGIN */}
        {activeTab === "player" && (
          <form onSubmit={handlePlayerLogin} style={s.form}>
            {/* Quick Test Pill */}
            <div style={s.testPillBox}>
              <div style={s.testPillLeft}>
                <span style={s.testPillDot} />
                <span style={s.testPillText}>Player Test Account: <strong>player_test</strong> (₹50,000)</span>
              </div>
              <button
                type="button"
                style={s.fillBtn}
                onClick={fillTestPlayer}
              >
                Auto Fill
              </button>
            </div>

            <div style={s.fieldGroup}>
              <label style={s.label}>Username</label>
              <div style={s.inputWrapper}>
                <User size={15} style={s.inputIcon} />
                <input
                  type="text"
                  placeholder="e.g. player_test"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  style={s.input}
                  autoComplete="username"
                  required
                />
              </div>
            </div>

            <div style={s.fieldGroup}>
              <label style={s.label}>Password</label>
              <div style={s.inputWrapper}>
                <Lock size={15} style={s.inputIcon} />
                <input
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={s.input}
                  autoComplete="current-password"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                ...s.submitBtn,
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? "Authenticating..." : "Sign In to Account"}
            </button>

            {/* Quick demo link */}
            <div style={s.switchModeBox}>
              <span style={s.switchModeText}>Want to try without password?</span>
              <button
                type="button"
                style={s.demoLinkBtn}
                onClick={() => setActiveTab("demo")}
              >
                Launch Demo Login (₹10,000)
              </button>
            </div>
          </form>
        )}

        {/* TAB 2: INSTANT DEMO LOGIN */}
        {activeTab === "demo" && (
          <div style={s.demoContainer}>
            <div style={s.demoCard}>
              <div style={s.demoHeader}>
                <div style={s.demoIconWrap}>
                  <Sparkles size={24} color="#f59e0b" />
                </div>
                <div style={s.demoHeaderRight}>
                  <h4 style={s.demoHeading}>Instant Free Demo Account</h4>
                  <span style={s.freeChipsBadge}>₹10,000 FREE CREDITS</span>
                </div>
              </div>

              <p style={s.demoDesc}>
                Experience real-time sports betting, live cricket exchange rates, and casino games instantly with auto-generated demo access. No password or personal details needed.
              </p>

              <div style={s.demoFeatures}>
                <div style={s.demoFeatureItem}>
                  <ShieldCheck size={14} color="#10b981" />
                  <span>No Registration Needed</span>
                </div>
                <div style={s.demoFeatureItem}>
                  <ShieldCheck size={14} color="#10b981" />
                  <span>Live Match Odds Access</span>
                </div>
                <div style={s.demoFeatureItem}>
                  <ShieldCheck size={14} color="#10b981" />
                  <span>Interactive Bet Slip Simulator</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              disabled={loading}
              onClick={handleDemoLogin}
              style={{
                ...s.demoActionBtn,
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? "Initializing Demo..." : "🚀 Enter Demo Account (₹10,000 Free)"}
            </button>
          </div>
        )}

        {/* Footer info */}
        <div style={s.footer}>
          <span>18+ Responsible Gaming • 256-bit SSL Secure Exchange</span>
        </div>
      </div>
    </div>
  );
}

const s = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(5, 8, 15, 0.8)",
    backdropFilter: "blur(6px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
    padding: 16,
  },
  modal: {
    background: "#0f1628",
    border: "1px solid #1e2c4a",
    borderRadius: 16,
    width: "100%",
    maxWidth: 420,
    maxHeight: "92vh",
    overflowY: "auto",
    padding: "24px 20px 20px",
    position: "relative",
    boxShadow: "0 25px 60px rgba(0,0,0,0.7), 0 0 35px rgba(37,99,235,0.15)",
    fontFamily: "'IBM Plex Sans', -apple-system, sans-serif",
  },
  closeBtn: {
    position: "absolute",
    top: 14,
    right: 14,
    background: "transparent",
    border: "none",
    color: "#64748b",
    cursor: "pointer",
    padding: 6,
    borderRadius: 8,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "color 0.15s",
  },
  header: {
    textAlign: "center",
    marginBottom: 20,
  },
  logoEmblem: {
    fontSize: 32,
    marginBottom: 4,
    filter: "drop-shadow(0 0 12px rgba(212,175,55,0.4))",
  },
  title: {
    fontFamily: "'Outfit', 'IBM Plex Sans', sans-serif",
    fontSize: 20,
    fontWeight: 800,
    color: "#f8fafc",
    letterSpacing: "0.08em",
    margin: 0,
  },
  subtitle: {
    fontSize: 11,
    color: "#94a3b8",
    marginTop: 4,
    fontFamily: "'IBM Plex Mono', monospace",
  },
  tabBar: {
    display: "flex",
    background: "#080c16",
    border: "1px solid #1b263b",
    borderRadius: 10,
    padding: 3,
    marginBottom: 16,
    gap: 4,
  },
  tabBtn: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    padding: "9px 12px",
    borderRadius: 8,
    border: "none",
    background: "transparent",
    color: "#94a3b8",
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.15s ease",
  },
  tabBtnActive: {
    background: "#2563eb",
    color: "#ffffff",
    boxShadow: "0 2px 8px rgba(37,99,235,0.4)",
  },
  tabBtnActiveDemo: {
    background: "linear-gradient(135deg, #d97706, #b45309)",
    color: "#ffffff",
    boxShadow: "0 2px 8px rgba(217,119,6,0.4)",
  },
  errorBox: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    background: "rgba(239, 68, 68, 0.15)",
    border: "1px solid rgba(239, 68, 68, 0.3)",
    borderRadius: 8,
    padding: "8px 12px",
    color: "#fca5a5",
    fontSize: 12,
    marginBottom: 14,
  },
  successBox: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    background: "rgba(16, 185, 129, 0.15)",
    border: "1px solid rgba(16, 185, 129, 0.3)",
    borderRadius: 8,
    padding: "8px 12px",
    color: "#6ee7b7",
    fontSize: 12,
    marginBottom: 14,
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: 14,
  },
  testPillBox: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    background: "rgba(37, 99, 235, 0.1)",
    border: "1px dashed rgba(37, 99, 235, 0.4)",
    borderRadius: 8,
    padding: "7px 10px",
  },
  testPillLeft: {
    display: "flex",
    alignItems: "center",
    gap: 6,
  },
  testPillDot: {
    width: 6,
    height: 6,
    borderRadius: "50%",
    background: "#3b82f6",
    boxShadow: "0 0 6px #3b82f6",
  },
  testPillText: {
    fontSize: 10.5,
    color: "#93c5fd",
    fontFamily: "'IBM Plex Mono', monospace",
  },
  fillBtn: {
    background: "#2563eb",
    color: "#ffffff",
    border: "none",
    borderRadius: 6,
    padding: "3px 8px",
    fontSize: 10,
    fontWeight: 600,
    cursor: "pointer",
  },
  fieldGroup: {
    display: "flex",
    flexDirection: "column",
    gap: 5,
  },
  label: {
    fontSize: 11,
    color: "#94a3b8",
    fontFamily: "'IBM Plex Mono', monospace",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    fontWeight: 600,
  },
  inputWrapper: {
    display: "flex",
    alignItems: "center",
    background: "#080c16",
    border: "1px solid #1e2c4a",
    borderRadius: 8,
    padding: "0 12px",
    gap: 8,
    height: 42,
  },
  inputIcon: {
    color: "#64748b",
  },
  input: {
    flex: 1,
    background: "transparent",
    border: "none",
    outline: "none",
    color: "#f8fafc",
    fontSize: 13,
    fontFamily: "'IBM Plex Mono', monospace",
  },
  submitBtn: {
    height: 44,
    marginTop: 4,
    background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
    color: "#ffffff",
    border: "none",
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
    boxShadow: "0 4px 14px rgba(37,99,235,0.4)",
    letterSpacing: "0.02em",
  },
  switchModeBox: {
    textAlign: "center",
    marginTop: 6,
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },
  switchModeText: {
    fontSize: 11,
    color: "#64748b",
  },
  demoLinkBtn: {
    background: "transparent",
    border: "none",
    color: "#f59e0b",
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
    textDecoration: "underline",
  },
  demoContainer: {
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
  demoCard: {
    background: "rgba(217, 119, 6, 0.08)",
    border: "1px solid rgba(217, 119, 6, 0.25)",
    borderRadius: 12,
    padding: 16,
  },
  demoHeader: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  demoIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 8,
    background: "rgba(217, 119, 6, 0.15)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  demoHeaderRight: {
    display: "flex",
    flexDirection: "column",
    gap: 3,
  },
  demoHeading: {
    margin: 0,
    fontSize: 14,
    fontWeight: 700,
    color: "#f8fafc",
  },
  freeChipsBadge: {
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: 10,
    fontWeight: 700,
    color: "#fbbf24",
    letterSpacing: "0.06em",
  },
  demoDesc: {
    fontSize: 11.5,
    color: "#94a3b8",
    lineHeight: 1.5,
    margin: "0 0 12px",
  },
  demoFeatures: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  demoFeatureItem: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    fontSize: 11,
    color: "#cbd5e1",
  },
  demoActionBtn: {
    height: 46,
    background: "linear-gradient(135deg, #d97706, #b45309)",
    color: "#ffffff",
    border: "none",
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
    boxShadow: "0 4px 16px rgba(217,119,6,0.35)",
    letterSpacing: "0.02em",
  },
  footer: {
    marginTop: 18,
    textAlign: "center",
    fontSize: 10,
    color: "#64748b",
    borderTop: "1px solid #1a233a",
    paddingTop: 12,
    fontFamily: "'IBM Plex Mono', monospace",
  },
};

