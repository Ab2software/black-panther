import React, { useState } from "react";
import { Bell, Search, Menu, Sun, Moon } from "lucide-react";
import { useLocation } from "react-router-dom";
import { useAdminAuth } from "../context/AdminAuthContext";
import { useAdminTheme } from "../context/AdminThemeContext";

const pageTitles = {
  "/admin/dashboard":          { title: "Dashboard",     path: "overview" },
  "/admin/users":              { title: "Users",         path: "management" },
  "/admin/superadmins":        { title: "Superadmins",   path: "management" },
  "/admin/subadmins":          { title: "Sub Admins",    path: "management" },
  "/admin/deposits":           { title: "Deposits",      path: "finance" },
  "/admin/withdrawals":        { title: "Withdrawals",   path: "finance" },
  "/admin/wallet":             { title: "Wallet",        path: "finance" },
  "/admin/bet-history":        { title: "Bets",          path: "activity" },
  "/admin/settings":           { title: "Settings",      path: "config" },
  "/admin/chips/dashboard":    { title: "Chips",         path: "finance" },
  "/admin/chips/transfer":     { title: "Transfer",      path: "chips" },
  "/admin/chips/transactions": { title: "History",       path: "chips" },
  "/admin/casino-bet-history": { title: "Casino History",path: "activity" },
  "/admin/account-statement":  { title: "Statement",     path: "activity" },
  "/admin/payment-method":     { title: "Payment Method",path: "finance" },
};

const Navbar = ({ onMenuToggle }) => {
  const { admin } = useAdminAuth();
  const { theme, isDark, toggleTheme } = useAdminTheme();
  const [searchFocused, setSearchFocused] = useState(false);
  const location = useLocation();

  const page = pageTitles[location.pathname] || { title: "Console", path: "admin" };

  const initials = (admin?.username || admin?.name || "A")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      style={{
        ...styles.root,
        background: theme.navbarBg,
        borderBottom: `1px solid ${theme.border}`,
      }}
    >
      {/* Left */}
      <div style={styles.left}>
        <button
          className="navbar-menu-btn"
          style={{
            ...styles.menuBtn,
            background: theme.secondaryButton,
            borderColor: theme.border,
            color: theme.secondaryText,
          }}
          onClick={onMenuToggle}
          aria-label="Toggle menu"
        >
          <Menu size={18} />
        </button>
        <div>
          <span style={{ ...styles.pageTitle, color: theme.heading }}>{page.title}</span>
          <span style={{ ...styles.pagePath, color: theme.mutedText }}>/ {page.path}</span>
        </div>
      </div>

      {/* Search */}
      <div
        className="navbar-search-wrap"
        style={{
          ...styles.searchWrap,
          background: theme.inputBg,
          borderColor: searchFocused ? theme.focus : theme.inputBorder,
          boxShadow: searchFocused ? `0 0 0 2px ${theme.focus}33` : "none",
        }}
      >
        <Search size={13} color={theme.mutedText} />
        <input
          type="text"
          placeholder="Search users, bets, transactions..."
          style={{
            ...styles.searchInput,
            color: theme.bodyText,
          }}
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
        />
      </div>

      {/* Right */}
      <div style={styles.right}>
        {/* Light / Dark Mode Toggle */}
        <button
          style={{
            ...styles.iconBtn,
            background: theme.secondaryButton,
            borderColor: theme.border,
            color: theme.secondaryText,
          }}
          onClick={toggleTheme}
          title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
          aria-label="Toggle theme mode"
        >
          {isDark ? (
            <Sun size={16} color={theme.primaryButton} style={{ filter: `drop-shadow(0 0 4px ${theme.focus})` }} />
          ) : (
            <Moon size={16} color={theme.secondaryText} />
          )}
        </button>

        {/* Notifications */}
        <button
          style={{
            ...styles.iconBtn,
            background: theme.secondaryButton,
            borderColor: theme.border,
            color: theme.secondaryText,
          }}
          aria-label="Notifications"
        >
          <Bell size={15} />
          <span
            style={{
              ...styles.notifDot,
              background: theme.primaryButton,
              borderColor: theme.navbarBg,
            }}
          />
        </button>

        {/* Profile Chip */}
        <div
          style={{
            ...styles.profileChip,
            background: theme.secondaryButton,
            borderColor: theme.border,
          }}
        >
          <div
            style={{
              ...styles.avatar,
              background: theme.primaryButton,
              color: theme.buttonText,
              boxShadow: `0 0 8px ${theme.focus}55`,
            }}
          >
            {initials}
          </div>
          <div className="navbar-profile-info" style={styles.profileInfo}>
            <div style={{ ...styles.profileName, color: theme.heading }}>
              {admin?.username || "Admin"}
            </div>
            <div
              style={{
                ...styles.profileRole,
                color: theme.secondaryText,
                background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
                border: `1px solid ${theme.border}`,
              }}
            >
              {theme.roleLabel}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  root: {
    height: "56px",
    display: "flex",
    alignItems: "center",
    padding: "0 20px",
    gap: "16px",
    fontFamily: "'IBM Plex Sans', sans-serif",
    flexShrink: 0,
    transition: "background 0.2s ease, border-color 0.2s ease",
  },
  left: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    flexShrink: 0,
  },
  menuBtn: {
    width: "32px",
    height: "32px",
    borderRadius: "7px",
    border: "1px solid",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    transition: "background 0.12s, color 0.12s, border-color 0.12s",
  },
  pageTitle: {
    fontSize: "14px",
    fontWeight: 600,
    letterSpacing: "-0.01em",
  },
  pagePath: {
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: "10px",
    marginLeft: "5px",
  },
  searchWrap: {
    flex: 1,
    maxWidth: "320px",
    margin: "0 auto",
    display: "flex",
    alignItems: "center",
    border: "1px solid",
    borderRadius: "7px",
    padding: "0 12px",
    height: "34px",
    gap: "8px",
    transition: "border-color 0.15s, background 0.15s, box-shadow 0.15s",
  },
  searchInput: {
    flex: 1,
    background: "transparent",
    border: "none",
    outline: "none",
    fontSize: "12px",
    fontFamily: "'IBM Plex Mono', monospace",
  },
  right: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginLeft: "auto",
  },
  iconBtn: {
    width: "34px",
    height: "34px",
    borderRadius: "7px",
    border: "1px solid",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    position: "relative",
    transition: "background 0.12s, color 0.12s, border-color 0.12s, transform 0.1s",
  },
  notifDot: {
    position: "absolute",
    top: "7px",
    right: "7px",
    width: "6px",
    height: "6px",
    borderRadius: "50%",
    border: "1.5px solid",
  },
  profileChip: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "4px 10px 4px 4px",
    border: "1px solid",
    borderRadius: "7px",
    cursor: "pointer",
    transition: "background 0.12s, border-color 0.12s",
  },
  avatar: {
    width: "28px",
    height: "28px",
    borderRadius: "6px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: "11px",
    fontWeight: 700,
    flexShrink: 0,
    transition: "box-shadow 0.2s ease, background 0.2s ease",
  },
  profileInfo: {
    display: "flex",
    flexDirection: "column",
    gap: "2px",
  },
  profileName: {
    fontSize: "12px",
    fontWeight: 600,
    lineHeight: 1.2,
  },
  profileRole: {
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: "9px",
    fontWeight: 600,
    letterSpacing: "0.04em",
    padding: "2px 6px",
    borderRadius: "4px",
    alignSelf: "flex-start",
    lineHeight: 1.2,
  },
};

export default Navbar;
