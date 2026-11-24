import React, { useEffect, useMemo, useState, useRef } from "react";
import { loginUser, registerUser, demoLogin } from "../services/authService";
import { getOpenBets } from "../services/sportsService";
import { toast } from "../utils/toast";
import LoginModal from "./LoginModal";
import SignupModal from "./SignupModal";
import { useAuth } from "../context/AuthContext";
import { getUserWallet, getUserPermissions } from "../utils/userHelpers";
import { useNavigate, useLocation } from "react-router-dom";
import logo from "../assets/panther-logo.svg";

const Navbar = ({ sidebarOpen, setSidebarOpen, onOpenGameMenu }) => {
  const navigate = useNavigate();
  const [now, setNow] = useState(new Date());
  const [showLogin, setShowLogin] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // ✅ Exposure modal — shows the user's open bets. Triggered by clicking
  // either the desktop "Exposure: ₹..." line or the sidebar's "NET
  // EXPOSURE" card. Bets are fetched fresh each time the modal opens
  // rather than kept in sync continuously, since exposure only needs to
  // be accurate at the moment the user asks to see it.
  const [showExposureModal, setShowExposureModal] = useState(false);
  const [openBets, setOpenBets] = useState([]);
  const [openBetsLoading, setOpenBetsLoading] = useState(false);
  const [openBetsError, setOpenBetsError] = useState(null);

  const location = useLocation();
  const isAutoRoute = location.pathname === "/auto";
  useEffect(() => {
    if (isAutoRoute) {
      setShowSignup(true);
    }
  }, [isAutoRoute]);
  const { user, fetchUser, handleLogout } = useAuth();
  const isAuthenticated = !!user && user?.status === "active";
  const menuRef = useRef();
  const wallet = getUserWallet(user);
  const permissions = getUserPermissions(user);

  useEffect(() => {
    if (!isAuthenticated) return;
    const interval = setInterval(() => {
      fetchUser();
    }, 2000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formattedDate = useMemo(() => now.toLocaleDateString(), [now]);
  const formattedTime = useMemo(() => now.toLocaleTimeString(), [now]);
// console.log("User: ", user)
  // ================= LOGIN =================
  const handleLogin = async (formData) => {
    try {
      setLoading(true);
      await loginUser(formData);
      await fetchUser();
      toast.success("Login successful 🎉");
      setShowLogin(false);
    } catch (err) {
      toast.error(err?.message || "Login failed ❌");
    } finally {
      setLoading(false);
    }
  };

  // ================= DEMO LOGIN =================
  const handleDemoLogin = async () => {
    try {
      setLoading(true);
      await demoLogin();
      await fetchUser();
      toast.success("Welcome to Demo Mode 🎮");
      setShowLogin(false);
    } catch (err) {
      toast.error(err?.message || "Demo login failed ❌");
    } finally {
      setLoading(false);
    }
  };

  // ================= REGISTER =================
  const handleRegister = async (formData) => {
    try {
      setLoading(true);
      const res = await registerUser(formData);
      toast.success(res.message || "Registered successfully 🎉");
      setShowSignup(false);
      setShowLogin(true);
    } catch (err) {
      toast.error(err?.message || "Registration failed ❌");
    } finally {
      setLoading(false);
    }
  };

  // ================= LOGOUT =================
  const handleLogoutClick = () => {
    handleLogout();
    setSidebarOpen(false);
    setMobileMenuOpen(false);
    toast.success("Logged out ✅");
  };

  // ================= EXPOSURE MODAL =================
  const openExposureModal = () => {
    // Close the sidebar/mobile menu first if it's open, same pattern as
    // the deposit/withdraw buttons — avoids stacking the exposure modal
    // on top of the sidebar overlay.
    setSidebarOpen(false);
    setMobileMenuOpen(false);
    setShowExposureModal(true);
    loadOpenBets();
  };

  const loadOpenBets = async () => {
    setOpenBetsLoading(true);
    setOpenBetsError(null);
    try {
      const res = await getOpenBets();
      if (res?.success) {
        setOpenBets(res.data || []);
      } else {
        setOpenBetsError("Failed to load open bets");
      }
    } catch (err) {
      setOpenBetsError(
        err?.response?.data?.message || "Failed to load open bets",
      );
    } finally {
      setOpenBetsLoading(false);
    }
  };

  useEffect(() => {
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        // close dropdown if needed
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <>
      {/* ===================== DESKTOP NAVBAR ===================== */}
      <header className="nav-header">
        <div className="nav-container">
          <div className="nav-left">
            {/* Mobile: hamburger before logo */}
            <button
              className="mob-hamburger"
              onClick={() =>
                window.dispatchEvent(new CustomEvent("open-game-menu"))
              }
            >
              ☰
            </button>
            <img
              src={logo}
              className="logo cursor-pointer"
              onClick={() => navigate("/")}
            />
          </div>

          {/* Desktop: search box */}
          <div className="nav-center">
            <div className="search-box">
              <input placeholder="Search Events (At least 3 letters)" />
            </div>
          </div>

          {/* Desktop: right section */}
          <div className="nav-right">
            <div className="date-box">
              {isAuthenticated && (
                <div className="login-as">
                  Login as <b>{user?.username || "Demo User"}</b>
                  {user?.isDemoUser && <span className="demo-badge">DEMO</span>}
                </div>
              )}
              <div>{formattedDate} (GMT +05:30)</div>
              <div className="time">{formattedTime}</div>
            </div>

            {!isAuthenticated ? (
              <>
                <button
                  className="btn login"
                  onClick={() => setShowLogin(true)}
                >
                  Login
                </button>
                {isAutoRoute && (
                  <button
                    className="btn signup"
                    onClick={() => setShowSignup(true)}
                  >
                    Sign up
                  </button>
                )}
              </>
            ) : (
              <>
                <div className="balance-box">
                  <div>
                    Available Balance: ₹{" "}
                    {Number(wallet?.available ?? 0).toFixed(2)}
                  </div>
                  <div
                    className="exposure-line"
                    onClick={openExposureModal}
                    role="button"
                    tabIndex={0}
                    title="View open bets"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        openExposureModal();
                      }
                    }}
                  >
                    Exposure: ₹ {Number(wallet?.exposure ?? 0).toFixed(2)}
                  </div>
                </div>

                {!user?.isDemoUser && (
                  <>
                    {/* <button
                      className="btn bonus"
                      onClick={() => navigate("/check-bonus")}
                    >
                      Check Bonuses
                    </button> */}
                    <button
                      className="btn deposit"
                      onClick={() => navigate("/deposit")}
                    >
                      Deposit
                    </button>
                    <button
                      className="btn withdraw"
                      onClick={() => navigate("/withdraw")}
                    >
                      Withdraw
                    </button>
                  </>
                )}

                {user?.isDemoUser && (
                  <button
                    className="btn signup"
                    onClick={() => setShowSignup(true)}
                  >
                    🎮 Register to Play
                  </button>
                )}

                <div className="bell">
                  🔔<span>1</span>
                </div>
                <div className="account" onClick={() => setSidebarOpen(true)}>
                  ⚙ Account
                </div>
              </>
            )}

            {/* Mobile: guest buttons (only visible on small screens when not logged in) */}
            {!isAuthenticated && (
              <>
                <button
                  className="mob-login"
                  onClick={() => setShowLogin(true)}
                >
                  Login
                </button>
                {/* <button className="mob-signup" onClick={() => setShowSignup(true)}>Sign up</button> */}
                {isAutoRoute && (
                  <button
                    className="mob-signup"
                    onClick={() => setShowSignup(true)}
                  >
                    Sign up
                  </button>
                )}
              </>
            )}

            {/* Mobile: authenticated bar (bell + deposit + balance chip) */}
            {isAuthenticated && (
              <div className="mob-auth-bar">
                <div className="mob-bell" onClick={() => {}}>
                  🔔
                  <span className="mob-bell-badge">1</span>
                </div>

                {!user?.isDemoUser && (
                  <button
                    className="mob-deposit-btn"
                    onClick={() => navigate("/deposit")}
                  >
                    Deposit
                  </button>
                )}

                <div
                  className="mob-balance-chip"
                  onClick={() => setMobileMenuOpen(true)}
                >
                  <span>₹ {Number(wallet?.available ?? 0).toFixed(2)}</span>
                  <span className="mob-account-icon">👤</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ===================== DEMO BANNER ===================== */}
      {isAuthenticated && user?.isDemoUser && (
        <div className="demo-banner">
          🎮 You're in <strong>Demo Mode</strong> — balances are not real.
          <button onClick={() => setShowSignup(true)}>Create Account →</button>
        </div>
      )}

      {/* ===================== SHARED SIDEBAR ===================== */}
      {(sidebarOpen || mobileMenuOpen) && (
        <div
          className="sidebar-overlay"
          onClick={() => {
            setSidebarOpen(false);
            setMobileMenuOpen(false);
          }}
        >
          <div className="sidebar" onClick={(e) => e.stopPropagation()}>
            <div className="sidebar-header">
              <span>
                👤 {isAuthenticated ? user?.username || "Demo User" : "Guest"}
              </span>
              <span
                className="close"
                onClick={() => {
                  setSidebarOpen(false);
                  setMobileMenuOpen(false);
                }}
              >
                ✕
              </span>
            </div>

            {!isAuthenticated ? (
              /* ── Guest: login / signup ── */
              <div className="menu" style={{ padding: "12px" }}>
                <button
                  className="login-btn"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setSidebarOpen(false);
                    setShowLogin(true);
                  }}
                >
                  Login
                </button>
                {isAutoRoute && (
                  <button
                    className="mob-signup"
                    onClick={() => setShowSignup(true)}
                  >
                    Sign up
                  </button>
                )}
              </div>
            ) : (
              <>
                {/* ── Balance section ── */}
                <div className="balance-section">
                  <h4>Balance Information</h4>
                  <div className="balance-card">
                    <div>BALANCE</div>
                    <strong>
                      ₹ {Number(user?.wallet?.availableBalance ?? 0).toFixed(2)}
                    </strong>
                    {user?.isDemoUser && (
                      <span className="demo-tag"> (Demo)</span>
                    )}
                  </div>
                  <div className="balance-row">
                    <div className="card" style={{ color: "#000" }}>
                      <div>BONUS</div>
                      <strong>₹ {user?.wallet?.bonusBalance ?? 0}</strong>
                    </div>
                    <div
                      className="card red exposure-card"
                      onClick={openExposureModal}
                      role="button"
                      tabIndex={0}
                      title="View open bets"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          openExposureModal();
                        }
                      }}
                    >
                      <div>NET EXPOSURE</div>
                      <strong>
                        ₹ {Number(user?.wallet?.exposure ?? 0).toFixed(2)}
                      </strong>
                    </div>
                  </div>

                  {!user?.isDemoUser && (
                    <>
                      <div className="action-row">
                        <button
                          className="sb-deposit-btn"
                          onClick={() => {
                            navigate("/deposit");
                            setSidebarOpen(false);
                            setMobileMenuOpen(false);
                          }}
                        >
                          <span className="sb-btn-icon">🏦</span>
                          <span>Deposit</span>
                        </button>
                        <button
                          className="sb-withdraw-btn"
                          onClick={() => {
                            navigate("/withdraw");
                            setSidebarOpen(false);
                            setMobileMenuOpen(false);
                          }}
                        >
                          <span className="sb-btn-icon">💸</span>
                          <span>Withdraw</span>
                        </button>
                      </div>
                      {/* <button
                        className="sb-bonus-btn"
                        onClick={() => {
                          navigate("/check-bonus");
                          setSidebarOpen(false);
                          setMobileMenuOpen(false);
                        }} 
                      >
                        Claim Bonuses
                      </button> */}
                    </>
                  )}
                </div>

                {/* ── Menu items ── */}
                <div className="menu">
                  <button
                    onClick={() => {
                      navigate("/dashboard");
                      setSidebarOpen(false);
                      setMobileMenuOpen(false);
                    }}
                  >
                    Dashboard
                  </button>
                  <p className="section">Statements</p>
                  <button
                    onClick={() => {
                      navigate("/my-bets");
                      setSidebarOpen(false);
                      setMobileMenuOpen(false);
                    }}
                  >
                    Sports History
                  </button>
                  <button
                    onClick={() => {
                      navigate("/bets-history");
                      setSidebarOpen(false);
                      setMobileMenuOpen(false);
                    }}
                  >
                    Casino History
                  </button>
                  <button
                    onClick={() => {
                      navigate("/profit-loss");
                      setSidebarOpen(false);
                      setMobileMenuOpen(false);
                    }}
                  >
                    Betting Profit & Loss
                  </button>
                  <button
                    onClick={() => {
                      navigate("/account-statement");
                      setSidebarOpen(false);
                      setMobileMenuOpen(false);
                    }}
                  >
                    Account Statement
                  </button>
                  <button>Deposit Turnover</button>
                  <p className="section">Account Settings</p>
                  <button
                    onClick={() => {
                      navigate("/settings");
                      setSidebarOpen(false);
                      setMobileMenuOpen(false);
                    }}
                  >
                    Settings
                  </button>
                  <button className="highlight">2FA</button>
                  <p className="section">Legal & Compliance</p>
                  <button>Rules & Regulations</button>
                  <button>Exclusion Policy</button>
                  <button>Responsible Gambling</button>
                  <button>Privacy Policy</button>
                  <p className="section">Account Actions</p>
                  <button className="logout" onClick={handleLogoutClick}>
                    Sign Out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ===================== EXPOSURE / OPEN BETS MODAL ===================== */}
      {showExposureModal && (
        <div
          className="exposure-modal-overlay"
          onClick={() => setShowExposureModal(false)}
        >
          <div className="exposure-modal" onClick={(e) => e.stopPropagation()}>
            <div className="exposure-modal-header">
              <div>
                <div className="exposure-modal-title">Open Bets</div>
                <div className="exposure-modal-subtitle">
                  Net Exposure: ₹{" "}
                  {Number(user?.wallet?.exposure ?? 0).toFixed(2)}
                </div>
              </div>
              <button
                className="exposure-modal-close"
                onClick={() => setShowExposureModal(false)}
              >
                ✕
              </button>
            </div>

            <div className="exposure-modal-body">
              {openBetsLoading ? (
                <div className="exposure-modal-state">Loading…</div>
              ) : openBetsError ? (
                <div className="exposure-modal-state error">
                  {openBetsError}
                </div>
              ) : openBets.length === 0 ? (
                <div className="exposure-modal-state">
                  No open bets right now.
                </div>
              ) : (
                <div className="exposure-bet-list">
                  {openBets.map((bet) => (
                    <div
                      key={bet._id || bet.betId}
                      className={`exposure-bet-card ${bet.side || bet.type}`}
                    >
                      <div className="exposure-bet-row">
                        <strong>{bet.sectionTeam || bet.team}</strong>
                        <span className="exposure-bet-side">
                          {(bet.side || bet.type)?.toUpperCase()}
                        </span>
                      </div>
                      <div className="exposure-bet-row">
                        <span className="exposure-bet-market">
                          {bet.selectionName}
                        </span>
                        <span
                          className={`exposure-bet-status ${bet.status?.toLowerCase()}`}
                        >
                          {bet.status}
                        </span>
                      </div>
                      <div className="exposure-bet-row">
                        <span>Odds: {bet.price}</span>
                        <span>Stake: ₹{bet.stake}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="exposure-modal-footer">
              <button
                className="exposure-modal-viewall"
                onClick={() => {
                  setShowExposureModal(false);
                  navigate("/my-bets");
                }}
              >
                View Full Bet History
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================== MODALS ===================== */}
      {showLogin && (
        <LoginModal
          onClose={() => setShowLogin(false)}
          onLogin={handleLogin}
          onDemoLogin={handleDemoLogin}
          loading={loading}
        />
      )}
      {showSignup && (
        <SignupModal
          onClose={() => setShowSignup(false)}
          onRegister={handleRegister}
          loading={loading}
        />
      )}

      <style>{`
        /* ===== DEMO ===== */
        .demo-banner { background:#1e3a5f; color:white; text-align:center; padding:6px 12px; font-size:13px; display:flex; align-items:center; justify-content:center; gap:12px; }
        .demo-banner button { background:white; color:#1e3a5f; border:none; padding:4px 10px; border-radius:4px; cursor:pointer; font-weight:bold; font-size:12px; }
        .demo-badge { background:#f59e0b; color:black; font-size:10px; padding:1px 6px; border-radius:4px; margin-left:6px; font-weight:bold; }
        .demo-tag { font-size:11px; color:#f59e0b; margin-left:4px; }

        /* ===== SIDEBAR ===== */
        .sidebar-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.6); z-index:9999; }
        .sidebar { position:absolute; right:0; top:0; width:320px; height:100%; background:#f5f5f5; overflow-y:auto; animation:slideIn 0.25s ease; }
        @keyframes slideIn { from { transform:translateX(100%); } to { transform:translateX(0); } }
        .sidebar-header { display:flex; justify-content:space-between; padding:15px; font-weight:bold; background:white; }
        .close { cursor:pointer; }
        .balance-section { padding:12px; }
        .balance-card { background:#ddd; padding:10px; border-radius:6px; }
        .balance-row { display:flex; gap:8px; margin-top:8px; }
        .card { flex:1; background:#ddd; padding:10px; border-radius:6px; }
        .card.red { color:red; }
        .exposure-card { cursor:pointer; transition:filter 0.15s ease; }
        .exposure-card:hover { filter:brightness(0.95); }
        .action-row { display:flex; gap:8px; margin-top:10px; }
        .sb-deposit-btn {
          flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center;
          gap:6px; padding:12px 8px; border:none; border-radius:8px;
          background:#16a34a; color:white; font-size:13px; font-weight:700; cursor:pointer;
        }
        .sb-withdraw-btn {
          flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center;
          gap:6px; padding:12px 8px; border:none; border-radius:8px;
          background:#dc2626; color:white; font-size:13px; font-weight:700; cursor:pointer;
        }
        .sb-btn-icon { font-size:20px; }
        .sb-bonus-btn {
          width:100%; margin-top:8px; padding:14px; border:none; border-radius:8px;
          background:#7c4a1e; color:white; font-size:14px; font-weight:700; cursor:pointer;
          letter-spacing:0.3px;
        }
        .sb-deposit-btn:hover { background:#15803d; }
        .sb-withdraw-btn:hover { background:#b91c1c; }
        .sb-bonus-btn:hover { background:#6b3d18; }
        .menu { padding:10px; }
        .menu button { width:100%; text-align:left; padding:10px; border:none; background:none; cursor:pointer; }
        .menu button:hover { background:#eee; }
        .section { font-size:12px; margin-top:10px; color:#666; }
        .highlight { background:gold !important; }
        .logout { color:red; }
        .login-btn { width:calc(100% - 20px); margin:10px; padding:10px; border-radius:6px; border:1px solid #ccc; background:white; cursor:pointer; text-align:center; }
        .signup-btn { width:calc(100% - 20px); margin:10px; padding:10px; border-radius:6px; border:none; background:#2c4f58; color:white; cursor:pointer; text-align:center; }

        /* ===== DESKTOP NAVBAR ===== */
        .nav-header { position:relative; height:75px; width:100%; background:linear-gradient(90deg,#0b1f23,#132f35); padding:0 16px; align-items:center; color:white; }
        .nav-container { display:flex; align-items:center; justify-content:space-between; height:100%; width:100%; }
        .logo { height:70px; }
        .nav-center { flex:1; display:flex; justify-content:center; }
        .search-box { width:350px; }
        .search-box input { width:100%; height:36px; border-radius:50px; border:none; padding:0 15px; outline:none; background:#e5e7eb; color:#111; }
        .nav-right { display:flex; align-items:center; gap:10px; }
        .date-box { font-size:12px; text-align:right; }
        .time { font-weight:bold; }
        .balance-box { font-size:12px; text-align:right; }
        .exposure-line { cursor:pointer; text-decoration:underline; text-decoration-style:dotted; text-underline-offset:2px; }
        .exposure-line:hover { color:#ffb4b4; }
        .btn { padding:6px 12px; border-radius:6px; font-size:12px; border:none; cursor:pointer; }
        .login { background:white; color:black; }
        .signup { background:#2c4f58; color:white; }
        .bonus { background:#1e40ff; color:white; }
        .deposit { background:#16a34a; color:white; }
        .withdraw { background:#dc2626; color:#f7f2f2; }
        .bell { position:relative; font-size:18px; cursor:pointer; }
        .bell span { position:absolute; top:-5px; right:-8px; background:white; color:black; font-size:10px; padding:2px 5px; border-radius:50%; }
        .account { background:#2c4f58; padding:6px 12px; border-radius:20px; cursor:pointer; font-size:13px; }
        .login-as { font-size:12px; }

        /* ===== EXPOSURE / OPEN BETS MODAL ===== */
        .exposure-modal-overlay {
          position:fixed; inset:0; background:rgba(0,0,0,0.6); z-index:10000;
          display:flex; align-items:center; justify-content:center; padding:16px;
        }
        .exposure-modal {
          width:100%; max-width:420px; max-height:80vh; background:#fff;
          border-radius:10px; overflow:hidden; display:flex; flex-direction:column;
          animation:exposureModalIn 0.18s ease;
        }
        @keyframes exposureModalIn { from { opacity:0; transform:scale(0.97); } to { opacity:1; transform:scale(1); } }
        .exposure-modal-header {
          background:linear-gradient(90deg,#0b1f23,#132f35); color:white;
          padding:14px 16px; display:flex; align-items:flex-start; justify-content:space-between;
        }
        .exposure-modal-title { font-size:15px; font-weight:700; }
        .exposure-modal-subtitle { font-size:12px; color:#ffb4b4; margin-top:2px; }
        .exposure-modal-close {
          background:rgba(255,255,255,0.15); border:none; color:white; width:26px; height:26px;
          border-radius:6px; cursor:pointer; font-size:13px; flex-shrink:0;
        }
        .exposure-modal-body { padding:12px 16px; overflow-y:auto; flex:1; }
        .exposure-modal-state { text-align:center; padding:30px 10px; color:#888; font-size:13px; font-style:italic; }
        .exposure-modal-state.error { color:#dc2626; font-style:normal; }
        .exposure-bet-list { display:flex; flex-direction:column; gap:8px; }
        .exposure-bet-card { padding:10px; border-radius:6px; border-left:4px solid transparent; font-size:12px; background:#f5f5f5; }
        .exposure-bet-card.back { background:#e3f2fd; border-left-color:#2196f3; }
        .exposure-bet-card.lay { background:#ffebee; border-left-color:#f44336; }
        .exposure-bet-row { display:flex; justify-content:space-between; margin-bottom:4px; }
        .exposure-bet-row:last-child { margin-bottom:0; }
        .exposure-bet-side { font-size:10px; font-weight:bold; padding:1px 6px; border-radius:3px; background:rgba(0,0,0,0.08); }
        .exposure-bet-market { color:#555; }
        .exposure-bet-status { font-weight:bold; font-size:10px; padding:2px 6px; border-radius:3px; }
        .exposure-bet-status.pending { background:#fff3e0; color:#e65100; }
        .exposure-bet-status.won { background:#e8f5e9; color:#2e7d32; }
        .exposure-bet-status.lost { background:#ffebee; color:#c62828; }
        .exposure-modal-footer { padding:12px 16px; border-top:1px solid #eee; }
        .exposure-modal-viewall {
          width:100%; padding:10px; background:#2c4f58; color:white; border:none;
          border-radius:6px; cursor:pointer; font-size:13px; font-weight:600;
        }
        .exposure-modal-viewall:hover { background:#234047; }

        /* ===== HAMBURGER (mobile only) ===== */
        .hamburger { display:none; font-size:22px; background:none; border:none; color:white; cursor:pointer; padding:4px 8px; }

        /* ===== MOBILE HAMBURGER (before logo, hidden on desktop) ===== */
        .mob-hamburger { display:none; font-size:22px; background:none; border:none; color:white; cursor:pointer; padding:4px 6px; line-height:1; }

        /* ===== MOBILE AUTH BUTTONS (hidden on desktop, full styles here) ===== */
        .mob-login { display:none; padding:6px 12px; border-radius:6px; font-size:12px; border:none; cursor:pointer; background:white; color:black; }
        .mob-signup { display:none; padding:6px 12px; border-radius:6px; font-size:12px; border:none; cursor:pointer; background:#2c4f58; color:white; }

        /* ===== MOBILE AUTHENTICATED BAR (hidden on desktop) ===== */
        .mob-auth-bar { display:none; }

        /* ===== MOBILE OVERRIDES ===== */
        @media (max-width: 768px) {
          .nav-header { height:60px; padding:0 12px; }

          /* Hide desktop-only elements */
          .nav-center,
          .balance-box,
          .date-box,
          .btn,
          .bell,
          .account { display:none !important; }

          /* Show mobile hamburger */
          .mob-hamburger { display:block; }

          /* Show mobile auth buttons (guest) */
          .mob-login { display:block; font-size:11px; padding:5px 10px; }
          .mob-signup { display:block; font-size:11px; padding:5px 10px; }

          /* Left side: hamburger + logo, no flex:1 so it doesn't push right */
          .nav-left { display:flex; align-items:center; gap:6px; flex-shrink:0; }
          .nav-left .logo { height:54px; }
          .mob-hamburger { font-size:20px; padding:4px; }

          /* Right side: shrink to content */
          .nav-right { gap:6px; flex-shrink:0; }

          /* Sidebar full width on small screens */
          .sidebar { width:100%; max-width:320px; }

          /* ── Mobile authenticated bar ── */
          .mob-auth-bar {
            display:flex;
            align-items:center;
            gap:5px;
          }

          .mob-bell {
            position:relative;
            font-size:18px;
            cursor:pointer;
            line-height:1;
            flex-shrink:0;
          }

          .mob-bell-badge {
            position:absolute;
            top:-3px;
            right:-5px;
            background:#f59e0b;
            color:#000;
            font-size:8px;
            font-weight:700;
            min-width:14px;
            height:14px;
            border-radius:50%;
            display:flex;
            align-items:center;
            justify-content:center;
            padding:0 2px;
          }

          .mob-deposit-btn {
            background:white;
            color:#0b1f23;
            border:none;
            padding:5px 10px;
            border-radius:20px;
            font-size:11px;
            font-weight:600;
            cursor:pointer;
            white-space:nowrap;
            flex-shrink:0;
          }

          .mob-balance-chip {
            display:flex;
            align-items:center;
            gap:4px;
            background:rgba(255,255,255,0.12);
            border:1px solid rgba(255,255,255,0.2);
            padding:5px 8px;
            border-radius:20px;
            font-size:11px;
            font-weight:600;
            color:white;
            cursor:pointer;
            white-space:nowrap;
            flex-shrink:0;
            max-width:110px;
            overflow:hidden;
          }

          .mob-account-icon {
            font-size:13px;
            opacity:0.85;
            flex-shrink:0;
          }

          .exposure-modal { max-height:75vh; }
        }

      `}</style>
    </>
  );
};

export default Navbar;