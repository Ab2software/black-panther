import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  User,
  LogIn,
  Sparkles,
  RefreshCw,
  Menu,
  X,
  Home,
  Trophy,
  Dices,
  ReceiptText,
  ShieldCheck,
  LogOut,
  Zap,
  Flame,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import PantherLogo from "../common/PantherLogo";

export default function Header({ onOpenAuth, onOpenDeposit, onOpenWithdraw, onOpenAccount }) {
  const { user, wallet, isDemo, logout, refreshWallet } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const location = useLocation();

  // Close drawer on route change
  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [drawerOpen]);

  const handleRefresh = async (e) => {
    e?.stopPropagation();
    setRefreshing(true);
    await refreshWallet();
    setTimeout(() => setRefreshing(false), 500);
  };

  const navLinks = [
    { label: "Home", path: "/", icon: Home },
    { label: "Sports", path: "/sports", icon: Trophy },
    { label: "Casino", path: "/casino", icon: Dices },
    { label: "My Bets", path: "/my-bets", icon: ReceiptText },
  ];

  const currentBalance = wallet?.balance ?? (isDemo ? 10000 : 50000);

  return (
    <>
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 90,
          background: "#080c14",
          borderBottom: "1px solid rgba(212, 175, 55, 0.2)",
          boxShadow: "0 4px 16px rgba(0, 0, 0, 0.6)",
        }}
      >
        {/* Top Micro News Ticker Bar */}
        <div
          style={{
            background: "linear-gradient(90deg, #150f05 0%, #201708 50%, #150f05 100%)",
            borderBottom: "1px solid rgba(212, 175, 55, 0.12)",
            padding: "3px 12px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: "11px",
            color: "#d4af37",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "6px", overflow: "hidden", whiteSpace: "nowrap" }}>
            <span style={{ fontWeight: 900, color: "#facc15", letterSpacing: "0.5px" }}>⚡ BLACK PANTHER:</span>
            <span style={{ color: "#d6c58e", fontSize: "10.5px", textOverflow: "ellipsis", overflow: "hidden" }}>
              Instant UPI Withdrawals • 0% Brokerage Exchange
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
            <span style={{ color: "#4ade80", fontWeight: 700, fontSize: "10.5px", display: "flex", alignItems: "center", gap: "4px" }}>
              <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#22c55e", display: "inline-block" }} />
              24/7 LIVE
            </span>
            <span style={{ color: "#94a3b8", fontSize: "10.5px" }}>18+</span>
          </div>
        </div>

        {/* Main Navbar */}
        <div
          style={{
            maxWidth: "1400px",
            margin: "0 auto",
            padding: "8px 12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "8px",
          }}
        >
          {/* Brand Logo */}
          <Link
            to="/"
            style={{
              display: "flex",
              alignItems: "center",
              textDecoration: "none",
              color: "inherit",
              flexShrink: 0,
            }}
          >
            <PantherLogo size={34} compact={true} />
          </Link>

          {/* Desktop Navigation Links */}
          <nav
            style={{
              display: "none",
              gap: "6px",
              alignItems: "center",
            }}
            className="desktop-nav"
          >
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path;
              const Icon = link.icon;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "7px 12px",
                    borderRadius: "8px",
                    textDecoration: "none",
                    fontSize: "13px",
                    fontWeight: 700,
                    color: isActive ? "#d4af37" : "#cbd5e1",
                    background: isActive ? "rgba(212, 175, 55, 0.12)" : "transparent",
                    border: isActive ? "1px solid rgba(212, 175, 55, 0.3)" : "1px solid transparent",
                    transition: "all 0.15s ease",
                  }}
                >
                  <Icon size={14} color={isActive ? "#d4af37" : "#94a3b8"} />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Action Bar (Responsive Mobile & Desktop) */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              flexShrink: 0,
            }}
            className="header-actions"
          >
            {!user ? (
              <>
                {/* 1-Click Demo Login */}
                <button
                  type="button"
                  onClick={() => onOpenAuth("demo")}
                  style={{
                    padding: "6px 10px",
                    borderRadius: "8px",
                    background: "rgba(234, 179, 8, 0.12)",
                    border: "1px solid #eab308",
                    color: "#facc15",
                    fontSize: "12px",
                    fontWeight: 800,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    whiteSpace: "nowrap",
                  }}
                >
                  <Sparkles size={13} />
                  <span>Demo</span>
                </button>

                {/* Login Button */}
                <button
                  type="button"
                  onClick={() => onOpenAuth("login")}
                  style={{
                    padding: "6px 12px",
                    borderRadius: "8px",
                    background: "linear-gradient(135deg, #d4af37 0%, #a98518 100%)",
                    border: "none",
                    color: "#0a0a0a",
                    fontSize: "12px",
                    fontWeight: 800,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "5px",
                    boxShadow: "0 2px 10px rgba(212, 175, 55, 0.3)",
                    whiteSpace: "nowrap",
                  }}
                >
                  <LogIn size={14} />
                  <span>Login</span>
                </button>
              </>
            ) : (
              <>
                {/* Balance Pill Button (Clickable to open Account) */}
                <div
                  onClick={onOpenAccount}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    background: "rgba(255, 255, 255, 0.04)",
                    border: "1px solid rgba(212, 175, 55, 0.3)",
                    borderRadius: "8px",
                    padding: "4px 8px",
                    cursor: "pointer",
                  }}
                >
                  <Wallet size={14} color="#d4af37" />
                  <div style={{ textAlign: "left" }}>
                    <div
                      style={{
                        fontSize: "13px",
                        fontWeight: 800,
                        color: "#ffffff",
                        fontFamily: "'IBM Plex Mono', monospace",
                        lineHeight: 1.1,
                      }}
                    >
                      ₹{currentBalance.toLocaleString()}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleRefresh}
                    title="Refresh Balance"
                    style={{
                      background: "none",
                      border: "none",
                      color: "#94a3b8",
                      cursor: "pointer",
                      padding: "2px",
                      display: "flex",
                    }}
                  >
                    <RefreshCw size={11} className={refreshing ? "spin" : ""} />
                  </button>
                </div>

                {/* Quick Deposit Pill Button */}
                <button
                  type="button"
                  onClick={onOpenDeposit}
                  style={{
                    padding: "6px 10px",
                    borderRadius: "8px",
                    background: "linear-gradient(135deg, #16a34a 0%, #15803d 100%)",
                    border: "none",
                    color: "#ffffff",
                    fontSize: "12px",
                    fontWeight: 800,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    boxShadow: "0 2px 8px rgba(22, 163, 74, 0.3)",
                  }}
                >
                  <ArrowDownLeft size={13} />
                  <span>Deposit</span>
                </button>

                {/* Desktop Withdraw Shortcut */}
                <button
                  type="button"
                  onClick={onOpenWithdraw}
                  className="hide-mobile"
                  style={{
                    padding: "6px 10px",
                    borderRadius: "8px",
                    background: "rgba(255, 255, 255, 0.06)",
                    border: "1px solid rgba(255, 255, 255, 0.12)",
                    color: "#ffffff",
                    fontSize: "12px",
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  <ArrowUpRight size={13} />
                  <span>Withdraw</span>
                </button>

                {/* User Profile Avatar Pill */}
                <button
                  type="button"
                  onClick={onOpenAccount}
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, #d4af37 0%, #a98518 100%)",
                    color: "#0a0a0a",
                    fontSize: "12px",
                    fontWeight: 900,
                    border: "none",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    flexShrink: 0,
                  }}
                >
                  {user.username?.charAt(0).toUpperCase()}
                </button>
              </>
            )}

            {/* Mobile Hamburger Menu Toggle */}
            <button
              type="button"
              className="mobile-menu-btn"
              onClick={() => setDrawerOpen(true)}
              style={{
                display: "flex",
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "8px",
                color: "#ffffff",
                padding: "6px",
                cursor: "pointer",
              }}
              aria-label="Open menu"
            >
              <Menu size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* Modern Slide-In Mobile Off-Canvas Drawer */}
      {drawerOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.75)",
            backdropFilter: "blur(6px)",
            zIndex: 999,
            display: "flex",
            justifyContent: "flex-end",
          }}
          onClick={() => setDrawerOpen(false)}
        >
          <div
            className="slide-in-right"
            style={{
              width: "82%",
              maxWidth: "340px",
              height: "100%",
              background: "#0c111a",
              borderLeft: "1px solid rgba(212, 175, 55, 0.25)",
              display: "flex",
              flexDirection: "column",
              padding: "16px",
              boxShadow: "-12px 0 32px rgba(0, 0, 0, 0.8)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Top Header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                paddingBottom: "14px",
                borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
                marginBottom: "14px",
              }}
            >
              <PantherLogo size={32} />

              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                style={{
                  background: "rgba(255, 255, 255, 0.08)",
                  border: "none",
                  borderRadius: "50%",
                  width: "30px",
                  height: "30px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#cbd5e1",
                  cursor: "pointer",
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* User Info / Quick Actions Card */}
            {user ? (
              <div
                style={{
                  background: "linear-gradient(135deg, rgba(212, 175, 55, 0.12) 0%, rgba(13, 18, 28, 0.8) 100%)",
                  borderRadius: "12px",
                  border: "1px solid rgba(212, 175, 55, 0.3)",
                  padding: "12px 14px",
                  marginBottom: "16px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ fontSize: "14px", fontWeight: 800, color: "#ffffff" }}>{user.username}</div>
                    <div style={{ fontSize: "11px", color: isDemo ? "#facc15" : "#4ade80", fontWeight: 700 }}>
                      {isDemo ? "DEMO TRIAL" : "VERIFIED PLAYER"}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "10px", color: "#94a3b8" }}>BALANCE</div>
                    <div style={{ fontSize: "16px", fontWeight: 900, color: "#d4af37", fontFamily: "'IBM Plex Mono', monospace" }}>
                      ₹{currentBalance.toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* Quick Banking Buttons inside Drawer */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginTop: "12px" }}>
                  <button
                    type="button"
                    onClick={() => {
                      setDrawerOpen(false);
                      onOpenDeposit();
                    }}
                    style={{
                      padding: "8px",
                      background: "linear-gradient(135deg, #16a34a 0%, #15803d 100%)",
                      border: "none",
                      borderRadius: "8px",
                      color: "#ffffff",
                      fontSize: "12px",
                      fontWeight: 800,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "4px",
                    }}
                  >
                    <ArrowDownLeft size={14} /> Deposit
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setDrawerOpen(false);
                      onOpenWithdraw();
                    }}
                    style={{
                      padding: "8px",
                      background: "rgba(255, 255, 255, 0.08)",
                      border: "1px solid rgba(255, 255, 255, 0.15)",
                      borderRadius: "8px",
                      color: "#ffffff",
                      fontSize: "12px",
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "4px",
                    }}
                  >
                    <ArrowUpRight size={14} /> Withdraw
                  </button>
                </div>
              </div>
            ) : (
              <div
                style={{
                  background: "#111726",
                  borderRadius: "12px",
                  padding: "12px",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  marginBottom: "16px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    setDrawerOpen(false);
                    onOpenAuth("login");
                  }}
                  style={{
                    padding: "10px",
                    background: "linear-gradient(135deg, #d4af37 0%, #a98518 100%)",
                    border: "none",
                    borderRadius: "8px",
                    color: "#0a0a0a",
                    fontWeight: 800,
                    fontSize: "13px",
                    cursor: "pointer",
                  }}
                >
                  Player Login (player_test)
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setDrawerOpen(false);
                    onOpenAuth("demo");
                  }}
                  style={{
                    padding: "10px",
                    background: "rgba(234, 179, 8, 0.15)",
                    border: "1px solid #eab308",
                    borderRadius: "8px",
                    color: "#facc15",
                    fontWeight: 800,
                    fontSize: "13px",
                    cursor: "pointer",
                  }}
                >
                  ⚡ 1-Click Demo (₹10,000)
                </button>
              </div>
            )}

            {/* Navigation Links in Drawer */}
            <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "6px" }}>
              <Link
                to="/"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "11px 14px",
                  borderRadius: "10px",
                  textDecoration: "none",
                  color: location.pathname === "/" ? "#d4af37" : "#cbd5e1",
                  background: location.pathname === "/" ? "rgba(212, 175, 55, 0.15)" : "transparent",
                  fontSize: "14px",
                  fontWeight: 700,
                }}
              >
                <Home size={18} /> Home
              </Link>

              <Link
                to="/sports"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "11px 14px",
                  borderRadius: "10px",
                  textDecoration: "none",
                  color: location.pathname === "/sports" ? "#d4af37" : "#cbd5e1",
                  background: location.pathname === "/sports" ? "rgba(212, 175, 55, 0.15)" : "transparent",
                  fontSize: "14px",
                  fontWeight: 700,
                }}
              >
                <Trophy size={18} /> Sports Exchange (Live)
              </Link>

              <Link
                to="/casino"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "11px 14px",
                  borderRadius: "10px",
                  textDecoration: "none",
                  color: location.pathname === "/casino" ? "#d4af37" : "#cbd5e1",
                  background: location.pathname === "/casino" ? "rgba(212, 175, 55, 0.15)" : "transparent",
                  fontSize: "14px",
                  fontWeight: 700,
                }}
              >
                <Dices size={18} /> Live Casino & Aviator
              </Link>

              <Link
                to="/my-bets"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "11px 14px",
                  borderRadius: "10px",
                  textDecoration: "none",
                  color: location.pathname === "/my-bets" ? "#d4af37" : "#cbd5e1",
                  background: location.pathname === "/my-bets" ? "rgba(212, 175, 55, 0.15)" : "transparent",
                  fontSize: "14px",
                  fontWeight: 700,
                }}
              >
                <ReceiptText size={18} /> My Bets
              </Link>

              {user && (
                <button
                  type="button"
                  onClick={() => {
                    setDrawerOpen(false);
                    onOpenAccount();
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: "11px 14px",
                    borderRadius: "10px",
                    background: "none",
                    border: "none",
                    color: "#cbd5e1",
                    fontSize: "14px",
                    fontWeight: 700,
                    textAlign: "left",
                    cursor: "pointer",
                  }}
                >
                  <User size={18} /> Account & Statements
                </button>
              )}
            </div>

            {/* Drawer Footer Actions */}
            <div style={{ paddingTop: "14px", borderTop: "1px solid rgba(255, 255, 255, 0.08)" }}>
              {user ? (
                <button
                  type="button"
                  onClick={() => {
                    setDrawerOpen(false);
                    logout();
                  }}
                  style={{
                    width: "100%",
                    padding: "10px",
                    background: "rgba(239, 68, 68, 0.15)",
                    border: "1px solid rgba(239, 68, 68, 0.3)",
                    borderRadius: "8px",
                    color: "#f87171",
                    fontSize: "13px",
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                  }}
                >
                  <LogOut size={16} /> Sign Out
                </button>
              ) : (
                <div style={{ fontSize: "11px", color: "#64748b", textAlign: "center" }}>
                  Black Panther Exchange • 24/7 Verified
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
