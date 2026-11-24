import React, { useEffect, useState } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Wallet,
  ArrowDownCircle,
  ArrowUpCircle,
  Layers,
  Settings,
  LogOut,
  Coins,
  ArrowLeftRight,
  ClockIcon,
  Crown,
  ShieldCheck,
  Gamepad2,
  Receipt,
  UserCheck,
  Briefcase,
  ChevronRight,
  Sparkles,
  X,
} from "lucide-react";
import { adminLogout } from "../services/adminAuthService";
import { useAdminAuth } from "../context/AdminAuthContext";
import { useAdminTheme } from "../context/AdminThemeContext";
import { fetchChipDashboard } from "../services/Chipservice";

const Sidebar = ({ isOpen, onClose }) => {
  const { admin } = useAdminAuth();
  const { theme, isDark } = useAdminTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const role = (admin?.role || "admin").toLowerCase();

  const [chipData, setChipData] = useState(null);

  // Auto-close on mobile when route changes
  useEffect(() => {
    if (isOpen && onClose) {
      onClose();
    }
  }, [location.pathname]);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen && onClose) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    fetchChipDashboard()
      .then((res) => setChipData(res.data))
      .catch(() => {});
  }, [role]);

  const fmt = (n) =>
    Number(n || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  // ── Navigation sections by role ──
  const ownerSections = [
    {
      label: "OVERVIEW",
      items: [
        { title: "Dashboard",   icon: LayoutDashboard, path: "/admin/dashboard" },
        { title: "Superadmins", icon: ShieldCheck,     path: "/admin/superadmins" },
        { title: "All Users",   icon: Users,           path: "/admin/users" },
      ],
    },
    {
      label: "CHIPS",
      items: [
        { title: "Transfer Chips", icon: ArrowLeftRight, path: "/admin/chips/transfer" },
        { title: "Chip History",   icon: ClockIcon,      path: "/admin/chips/transactions" },
      ],
    },
    {
      label: "FINANCE",
      items: [
        { title: "Payment Method", icon: Wallet, path: "/admin/payment-method" },
      ],
    },
    {
      label: "ACTIVITY & SYSTEM",
      items: [
        { title: "Bets",           icon: Layers,   path: "/admin/bet-history" },
        { title: "Casino History", icon: Gamepad2, path: "/admin/casino-bet-history" },
        { title: "Settings",       icon: Settings, path: "/admin/settings" },
      ],
    },
  ];

  const superAdminSections = [
    {
      label: "OVERVIEW",
      items: [
        { title: "Dashboard",  icon: LayoutDashboard, path: "/admin/dashboard" },
        { title: "Users",      icon: Users,           path: "/admin/users" },
        { title: "Sub Admins", icon: ShieldCheck,     path: "/admin/subadmins" },
      ],
    },
    {
      label: "CHIPS",
      items: [
        { title: "Chip Dashboard", icon: Coins,          path: "/admin/chips/dashboard" },
        { title: "Transfer Chips", icon: ArrowLeftRight, path: "/admin/chips/transfer" },
        { title: "Chip History",   icon: ClockIcon,      path: "/admin/chips/transactions" },
      ],
    },
    {
      label: "FINANCE",
      items: [
        { title: "Deposits",       icon: ArrowDownCircle, path: "/admin/deposits" },
        { title: "Withdrawals",    icon: ArrowUpCircle,   path: "/admin/withdrawals" },
        { title: "Payment Method", icon: Wallet,          path: "/admin/payment-method" },
      ],
    },
    {
      label: "ACTIVITY & SYSTEM",
      items: [
        { title: "Bets",           icon: Layers,   path: "/admin/bet-history" },
        { title: "Casino History", icon: Gamepad2, path: "/admin/casino-bet-history" },
        { title: "Settings",       icon: Settings, path: "/admin/settings" },
      ],
    },
  ];

  const adminSections = [
    {
      label: "OVERVIEW",
      items: [
        { title: "Dashboard",  icon: LayoutDashboard, path: "/admin/dashboard" },
        { title: "Users",      icon: Users,           path: "/admin/users" },
        { title: "Sub Admins", icon: ShieldCheck,     path: "/admin/subadmins" },
      ],
    },
    {
      label: "CHIPS",
      items: [
        { title: "Chip Dashboard", icon: Coins,          path: "/admin/chips/dashboard" },
        { title: "Transfer Chips", icon: ArrowLeftRight, path: "/admin/chips/transfer" },
        { title: "Chip History",   icon: ClockIcon,      path: "/admin/chips/transactions" },
      ],
    },
    {
      label: "FINANCE",
      items: [
        { title: "Deposits",       icon: ArrowDownCircle, path: "/admin/deposits" },
        { title: "Withdrawals",    icon: ArrowUpCircle,   path: "/admin/withdrawals" },
        { title: "Payment Method", icon: Wallet,          path: "/admin/payment-method" },
      ],
    },
    {
      label: "ACTIVITY & SYSTEM",
      items: [
        { title: "Bets",              icon: Layers,   path: "/admin/bet-history" },
        { title: "Casino History",    icon: Gamepad2, path: "/admin/casino-bet-history" },
        { title: "Account Statement", icon: Receipt,  path: "/admin/account-statement" },
        { title: "Settings",          icon: Settings, path: "/admin/settings" },
      ],
    },
  ];

  const subAdminSections = [
    {
      label: "OVERVIEW",
      items: [
        { title: "Dashboard", icon: LayoutDashboard, path: "/admin/dashboard" },
        { title: "Users",     icon: Users,           path: "/admin/users" },
      ],
    },
    {
      label: "CHIPS",
      items: [
        { title: "Chip Dashboard", icon: Coins,          path: "/admin/chips/dashboard" },
        { title: "Transfer Chips", icon: ArrowLeftRight, path: "/admin/chips/transfer" },
        { title: "Chip History",   icon: ClockIcon,      path: "/admin/chips/transactions" },
      ],
    },
    {
      label: "ACTIVITY & SYSTEM",
      items: [
        { title: "Bets",              icon: Layers,   path: "/admin/bet-history" },
        { title: "Casino History",    icon: Gamepad2, path: "/admin/casino-bet-history" },
        { title: "Account Statement", icon: Receipt,  path: "/admin/account-statement" },
        { title: "Settings",          icon: Settings, path: "/admin/settings" },
      ],
    },
  ];

  const masterSections = [
    {
      label: "OVERVIEW",
      items: [
        { title: "Dashboard", icon: LayoutDashboard, path: "/admin/dashboard" },
        { title: "Users",     icon: Users,           path: "/admin/users" },
      ],
    },
    {
      label: "CHIPS",
      items: [
        { title: "Chip Dashboard", icon: Coins,          path: "/admin/chips/dashboard" },
        { title: "Transfer Chips", icon: ArrowLeftRight, path: "/admin/chips/transfer" },
        { title: "Chip History",   icon: ClockIcon,      path: "/admin/chips/transactions" },
      ],
    },
    {
      label: "ACTIVITY & SYSTEM",
      items: [
        { title: "Bets",              icon: Layers,   path: "/admin/bet-history" },
        { title: "Casino History",    icon: Gamepad2, path: "/admin/casino-bet-history" },
        { title: "Account Statement", icon: Receipt,  path: "/admin/account-statement" },
        { title: "Settings",          icon: Settings, path: "/admin/settings" },
      ],
    },
  ];

  const agentSections = [
    {
      label: "OVERVIEW",
      items: [
        { title: "Dashboard", icon: LayoutDashboard, path: "/admin/dashboard" },
        { title: "Users",     icon: Users,           path: "/admin/users" },
      ],
    },
    {
      label: "CHIPS",
      items: [
        { title: "Chip Dashboard", icon: Coins,          path: "/admin/chips/dashboard" },
        { title: "Transfer Chips", icon: ArrowLeftRight, path: "/admin/chips/transfer" },
        { title: "Chip History",   icon: ClockIcon,      path: "/admin/chips/transactions" },
      ],
    },
    {
      label: "ACTIVITY & SYSTEM",
      items: [
        { title: "Bets",           icon: Layers,   path: "/admin/bet-history" },
        { title: "Casino History", icon: Gamepad2, path: "/admin/casino-bet-history" },
        { title: "Settings",       icon: Settings, path: "/admin/settings" },
      ],
    },
  ];

  const sections =
    role === "owner"      ? ownerSections :
    role === "superadmin" ? superAdminSections :
    role === "admin"      ? adminSections :
    role === "subadmin"   ? subAdminSections :
    role === "master"     ? masterSections :
    role === "agent"      ? agentSections :
    adminSections;

  const handleLogout = () => {
    adminLogout();
    navigate("/admin/login");
  };

  const getRoleIcon = () => {
    if (role === "owner") return <Crown size={15} color={theme.buttonText} />;
    if (role === "superadmin") return <ShieldCheck size={15} color={theme.buttonText} />;
    if (role === "subadmin") return <UserCheck size={15} color={theme.buttonText} />;
    if (role === "master") return <Briefcase size={15} color={theme.buttonText} />;
    return (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={theme.buttonText} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2L2 7l10 5 10-5-10-5z" />
        <path d="M2 17l10 5 10-5" />
        <path d="M2 12l10 5 10-5" />
      </svg>
    );
  };

  return (
    <aside
      className={`admin-sidebar ${isOpen ? "open" : ""}`}
      style={{
        ...s.root,
        background: theme.sidebarBg,
        borderRight: `1px solid ${theme.border}`,
      }}
    >
      {/* ── Brand / Header ── */}
      <div
        style={{
          ...s.brandArea,
          borderBottom: `1px solid ${theme.border}`,
        }}
      >
        <div
          style={{
            ...s.brandIconBox,
            background: `linear-gradient(135deg, ${theme.primaryButton}, ${theme.focus})`,
            boxShadow: `0 4px 14px ${theme.focus}40`,
          }}
        >
          {getRoleIcon()}
        </div>
        <div style={s.brandInfo}>
          <div style={{ ...s.brandTitle, color: theme.heading }}>
            {theme.roleName ? `${theme.roleName.toUpperCase()}` : "ADMIN"}
            <span style={{ color: theme.primaryButton, marginLeft: 4 }}>•</span>
          </div>
          <div style={{ ...s.brandSub, color: theme.mutedText }}>
            MANAGEMENT CONSOLE
          </div>
        </div>

        {/* Mobile Close Button */}
        {onClose && (
          <button
            onClick={onClose}
            className="sidebar-mobile-close-btn"
            style={{
              marginLeft: "auto",
              width: "32px",
              height: "32px",
              borderRadius: "8px",
              border: `1px solid ${theme.border}`,
              background: theme.secondaryButton,
              color: theme.secondaryText,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
            aria-label="Close sidebar"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* ── User & Role Quick Card ── */}
      <div style={s.userCardWrap}>
        <div
          style={{
            ...s.userCard,
            background: isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)",
            border: `1px solid ${theme.border}`,
          }}
        >
          <div style={s.userRow}>
            <div
              style={{
                ...s.userAvatar,
                background: theme.primaryButton,
                color: theme.buttonText,
                boxShadow: `0 0 10px ${theme.focus}33`,
              }}
            >
              {(admin?.username?.[0] || "A").toUpperCase()}
            </div>
            <div style={s.userDetails}>
              <span style={{ ...s.userNameText, color: theme.heading }}>
                {admin?.username || "Admin"}
              </span>
              <span
                style={{
                  ...s.roleBadgePill,
                  color: theme.secondaryText,
                  background: theme.secondaryButton,
                  border: `1px solid ${theme.border}`,
                }}
              >
                {theme.roleLabel}
              </span>
            </div>
          </div>

          {/* Quick Chip Balance inside Card */}
          {chipData && (
            <div
              style={{
                ...s.quickBalContainer,
                background: isDark ? "rgba(0,0,0,0.25)" : "rgba(255,255,255,0.6)",
                border: `1px solid ${theme.border}`,
              }}
            >
              <div style={s.quickBalItem}>
                <span style={{ ...s.quickBalLabel, color: theme.mutedText }}>Balance</span>
                <span style={{ ...s.quickBalVal, color: theme.heading }}>
                  ₹{fmt(chipData.me?.wallet?.balance)}
                </span>
              </div>
              <div style={{ ...s.quickBalSep, background: theme.border }} />
              <div style={s.quickBalItem}>
                <span style={{ ...s.quickBalLabel, color: theme.mutedText }}>Available</span>
                <span style={{ ...s.quickBalVal, color: theme.success }}>
                  ₹{fmt(chipData.me?.wallet?.availableBalance)}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Navigation Menu List ── */}
      <nav style={s.navContainer} className="sidebar-nav-scroll">
        {sections.map((section, idx) => (
          <div key={section.label} style={s.sectionBlock}>
            <div style={s.sectionHeader}>
              <span
                style={{
                  ...s.sectionIndicator,
                  background: theme.primaryButton,
                }}
              />
              <span style={{ ...s.sectionHeaderText, color: theme.mutedText }}>
                {section.label}
              </span>
            </div>

            <div style={s.menuList}>
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;

                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => onClose && onClose()}
                    className="sidebar-menu-link"
                    style={{
                      ...s.menuItem,
                      color: isActive ? theme.heading : theme.mutedText,
                      background: isActive
                        ? isDark
                          ? `linear-gradient(90deg, ${theme.primaryButton}22, rgba(255,255,255,0.02))`
                          : `linear-gradient(90deg, ${theme.primaryButton}15, rgba(0,0,0,0.02))`
                        : "transparent",
                      borderColor: isActive ? `${theme.primaryButton}40` : "transparent",
                    }}
                  >
                    {/* Active Left Neon Glow Indicator */}
                    {isActive && (
                      <span
                        style={{
                          ...s.activeGlowBar,
                          background: theme.primaryButton,
                          boxShadow: `0 0 10px ${theme.focus}`,
                        }}
                      />
                    )}

                    {/* Icon Tile */}
                    <div
                      style={{
                        ...s.iconTile,
                        background: isActive
                          ? theme.primaryButton
                          : isDark
                          ? "rgba(255,255,255,0.04)"
                          : "rgba(0,0,0,0.03)",
                        color: isActive ? theme.buttonText : "inherit",
                        borderColor: isActive ? theme.primaryButton : theme.border,
                      }}
                    >
                      <Icon size={15} strokeWidth={isActive ? 2.4 : 1.8} />
                    </div>

                    {/* Menu Label */}
                    <span
                      style={{
                        ...s.menuLabel,
                        fontWeight: isActive ? 600 : 500,
                        color: isActive ? theme.heading : theme.bodyText,
                      }}
                    >
                      {item.title}
                    </span>

                    {/* Active Chevron Indicator */}
                    <ChevronRight
                      size={14}
                      style={{
                        ...s.menuChevron,
                        opacity: isActive ? 1 : 0,
                        color: theme.primaryButton,
                        transform: isActive ? "translateX(0)" : "translateX(-4px)",
                      }}
                    />
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* ── Footer / Logout ── */}
      <div
        style={{
          ...s.footerBar,
          borderTop: `1px solid ${theme.border}`,
          background: isDark ? "rgba(0,0,0,0.2)" : "rgba(255,255,255,0.5)",
        }}
      >
        <button
          onClick={handleLogout}
          className="sidebar-logout-btn"
          style={{
            ...s.logoutButton,
            border: `1px solid ${theme.danger}33`,
            color: theme.danger,
            background: isDark ? "rgba(239, 68, 68, 0.08)" : "rgba(239, 68, 68, 0.06)",
          }}
        >
          <LogOut size={15} strokeWidth={2} />
          <span style={s.logoutText}>Sign Out</span>
        </button>
      </div>

      {/* CSS Styles for sidebar interactions */}
      <style>{`
        .sidebar-menu-link {
          transition: all 0.18s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .sidebar-menu-link:hover {
          transform: translateX(3px);
          background: ${isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)"} !important;
          color: ${theme.heading} !important;
        }
        .sidebar-menu-link:hover .lucide-chevron-right {
          opacity: 0.6 !important;
          transform: translateX(0) !important;
        }
        .sidebar-logout-btn {
          transition: all 0.18s ease;
        }
        .sidebar-logout-btn:hover {
          background: ${theme.danger} !important;
          color: #ffffff !important;
          border-color: ${theme.danger} !important;
          box-shadow: 0 4px 12px ${theme.danger}40;
        }
        .sidebar-nav-scroll::-webkit-scrollbar {
          width: 4px;
        }
        .sidebar-nav-scroll::-webkit-scrollbar-thumb {
          background: ${theme.border};
          border-radius: 4px;
        }
      `}</style>
    </aside>
  );
};

const s = {
  root: {
    width: "250px",
    minWidth: "250px",
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    fontFamily: "'IBM Plex Sans', -apple-system, BlinkMacSystemFont, sans-serif",
    transition: "background 0.25s ease, border-color 0.25s ease",
    position: "sticky",
    top: 0,
    zIndex: 100,
  },
  brandArea: {
    height: "64px",
    display: "flex",
    alignItems: "center",
    padding: "0 18px",
    gap: "12px",
    flexShrink: 0,
  },
  brandIconBox: {
    width: "34px",
    height: "34px",
    borderRadius: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    transition: "all 0.25s ease",
  },
  brandInfo: {
    display: "flex",
    flexDirection: "column",
    gap: "2px",
  },
  brandTitle: {
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: "12px",
    fontWeight: 700,
    letterSpacing: "0.08em",
    lineHeight: 1.2,
  },
  brandSub: {
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: "9px",
    letterSpacing: "0.1em",
    fontWeight: 500,
  },
  userCardWrap: {
    padding: "12px 14px 6px",
    flexShrink: 0,
  },
  userCard: {
    borderRadius: "12px",
    padding: "10px 12px",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  userRow: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  userAvatar: {
    width: "32px",
    height: "32px",
    borderRadius: "8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: "12px",
    fontWeight: 700,
    flexShrink: 0,
  },
  userDetails: {
    display: "flex",
    flexDirection: "column",
    gap: "3px",
    minWidth: 0,
  },
  userNameText: {
    fontSize: "13px",
    fontWeight: 600,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    lineHeight: 1.2,
  },
  roleBadgePill: {
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: "9px",
    fontWeight: 600,
    letterSpacing: "0.06em",
    padding: "2px 7px",
    borderRadius: "4px",
    alignSelf: "flex-start",
    lineHeight: 1.2,
  },
  quickBalContainer: {
    borderRadius: "8px",
    padding: "8px 10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  quickBalItem: {
    display: "flex",
    flexDirection: "column",
    gap: "2px",
  },
  quickBalLabel: {
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: "9px",
    textTransform: "uppercase",
    letterSpacing: "0.04em",
    fontWeight: 500,
  },
  quickBalVal: {
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: "11px",
    fontWeight: 700,
  },
  quickBalSep: {
    width: "1px",
    height: "22px",
  },
  navContainer: {
    flex: 1,
    padding: "10px 12px",
    display: "flex",
    flexDirection: "column",
    gap: "14px",
    overflowY: "auto",
  },
  sectionBlock: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  sectionHeader: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "0 8px",
    marginBottom: "4px",
  },
  sectionIndicator: {
    width: "4px",
    height: "4px",
    borderRadius: "50%",
    opacity: 0.8,
  },
  sectionHeaderText: {
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: "9px",
    fontWeight: 600,
    letterSpacing: "0.12em",
  },
  menuList: {
    display: "flex",
    flexDirection: "column",
    gap: "3px",
  },
  menuItem: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "8px 10px",
    borderRadius: "10px",
    border: "1px solid transparent",
    cursor: "pointer",
    fontSize: "13px",
    textDecoration: "none",
    position: "relative",
  },
  activeGlowBar: {
    position: "absolute",
    left: "-2px",
    top: "50%",
    transform: "translateY(-50%)",
    width: "4px",
    height: "20px",
    borderRadius: "0 4px 4px 0",
  },
  iconTile: {
    width: "28px",
    height: "28px",
    borderRadius: "8px",
    border: "1px solid transparent",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    transition: "all 0.18s ease",
  },
  menuLabel: {
    flex: 1,
    fontSize: "13px",
    letterSpacing: "-0.01em",
  },
  menuChevron: {
    flexShrink: 0,
    transition: "all 0.18s ease",
  },
  footerBar: {
    padding: "12px 14px",
    flexShrink: 0,
  },
  logoutButton: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    padding: "10px 14px",
    borderRadius: "10px",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: 600,
    fontFamily: "'IBM Plex Sans', sans-serif",
  },
  logoutText: {
    letterSpacing: "0.02em",
  },
};

export default Sidebar;
