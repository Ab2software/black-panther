import React, { useState } from "react";
import Sidebar from "../Sidebar";
import Navbar from "../Navbar";
import { useAdminTheme } from "../../context/AdminThemeContext";

const AdminLayout = ({ children }) => {
  const { theme, isDark } = useAdminTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div
      className="admin-root-container"
      style={{
        display: "flex",
        minHeight: "100vh",
        background: theme.pageBg,
        color: theme.bodyText,
        transition: "background 0.2s ease, color 0.2s ease",
        fontFamily: "'IBM Plex Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      {/* Mobile Backdrop Overlay */}
      {sidebarOpen && (
        <div
          className="admin-sidebar-backdrop"
          onClick={() => setSidebarOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.65)",
            backdropFilter: "blur(4px)",
            WebkitBackdropFilter: "blur(4px)",
            zIndex: 998,
            transition: "opacity 0.25s ease",
          }}
          aria-hidden="true"
        />
      )}

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, height: "100vh" }}>
        <Navbar onMenuToggle={() => setSidebarOpen((prev) => !prev)} />

        <main
          className="admin-theme-scope"
          style={{
            flex: 1,
            background: theme.pageBg,
            color: theme.bodyText,
            overflowY: "auto",
            transition: "background 0.2s ease, color 0.2s ease",
            position: "relative",
          }}
        >
          {children}
        </main>
      </div>

      {/* Global Theme Overrides for All Pages, Cards, Tables, Drawers, Modals and Inputs */}
      <style>{`
        :root {
          --admin-page-bg: ${theme.pageBg};
          --admin-sidebar-bg: ${theme.sidebarBg};
          --admin-navbar-bg: ${theme.navbarBg};
          --admin-header-bg: ${theme.headerBg || theme.navbarBg};
          --admin-card-bg: ${theme.cardBg};
          --admin-card-hover: ${theme.cardHover};
          --admin-primary-btn: ${theme.primaryButton};
          --admin-btn-text: ${theme.buttonText};
          --admin-secondary-btn: ${theme.secondaryButton};
          --admin-secondary-text: ${theme.secondaryText};
          --admin-heading: ${theme.heading};
          --admin-body-text: ${theme.bodyText};
          --admin-muted-text: ${theme.mutedText};
          --admin-border: ${theme.border};
          --admin-input-bg: ${theme.inputBg};
          --admin-input-border: ${theme.inputBorder};
          --admin-focus: ${theme.focus};
          --admin-badge-color: ${theme.badgeColor};
          --admin-badge-bg: ${theme.badgeBg};
          --admin-badge-border: ${theme.badgeBorder};
          --admin-success: ${theme.success};
          --admin-success-bg: ${theme.successBg};
          --admin-warning: ${theme.warning};
          --admin-warning-bg: ${theme.warningBg};
          --admin-danger: ${theme.danger};
          --admin-danger-bg: ${theme.dangerBg};
          --admin-info: ${theme.info};
          --admin-info-bg: ${theme.infoBg};
        }

        /* ─── Scrollbars ─── */
        .admin-root-container ::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .admin-root-container ::-webkit-scrollbar-track {
          background: ${theme.pageBg};
        }
        .admin-root-container ::-webkit-scrollbar-thumb {
          background: ${theme.border};
          border-radius: 4px;
        }
        .admin-root-container ::-webkit-scrollbar-thumb:hover {
          background: ${theme.focus};
        }

        /* ─── 1. Page Backgrounds ─── */
        .admin-theme-scope,
        .admin-theme-scope > div,
        .admin-theme-scope [style*="minHeight: 100vh"],
        .admin-theme-scope [style*="min-height: 100vh"],
        .admin-theme-scope [style*="minHeight: 100%"],
        .admin-theme-scope [style*="min-height: 100%"],
        .admin-theme-scope [style*="background: #f5f4f0"],
        .admin-theme-scope [style*="background:#f5f4f0"],
        .admin-theme-scope [style*="background: rgb(245, 244, 240)"],
        .admin-theme-scope [style*="background:rgb(245,244,240)"] {
          background: ${theme.pageBg} !important;
          color: ${theme.bodyText} !important;
        }

        /* ─── 2. Cards & Containers ─── */
        .admin-theme-scope [style*="background: #ffffff"],
        .admin-theme-scope [style*="background: #fff"],
        .admin-theme-scope [style*="background:#ffffff"],
        .admin-theme-scope [style*="background:#fff"],
        .admin-theme-scope [style*="background: rgb(255, 255, 255)"],
        .admin-theme-scope [style*="background:rgb(255,255,255)"],
        .admin-theme-scope [style*="background: #fafaf8"],
        .admin-theme-scope [style*="background:#fafaf8"],
        .admin-theme-scope [style*="background: rgb(250, 250, 248)"],
        .admin-theme-scope [style*="background:rgb(250,250,248)"] {
          background: ${theme.cardBg} !important;
          border-color: ${theme.border} !important;
          color: ${theme.bodyText} !important;
        }

        /* Drawers, Modals & Floating Overlays */
        .admin-theme-scope div[style*="position: fixed"][style*="right: 0"],
        .admin-theme-scope div[style*="position:fixed"][style*="right:0"],
        .admin-theme-scope div[style*="position: fixed"][style*="right: 24"],
        .admin-theme-scope div[style*="position: fixed"][style*="bottom: 24"] {
          background: ${theme.cardBg} !important;
          border-color: ${theme.border} !important;
          color: ${theme.bodyText} !important;
          box-shadow: ${isDark ? "0 10px 40px rgba(0,0,0,0.7)" : "0 8px 30px rgba(0,0,0,0.12)"} !important;
        }

        /* ─── 3. Stat Card Accent Indicators ─── */
        .admin-theme-scope div[style*="width: 3"],
        .admin-theme-scope div[style*="width: 3px"],
        .admin-theme-scope div[style*="width: 4px"] {
          background: ${theme.primaryButton} !important;
          box-shadow: 0 0 10px ${theme.focus}66 !important;
        }

        /* ─── 4. Tables & Table Rows ─── */
        .admin-theme-scope table {
          background: ${theme.cardBg} !important;
          border-color: ${theme.border} !important;
          color: ${theme.bodyText} !important;
        }
        .admin-theme-scope table thead,
        .admin-theme-scope table th {
          background: ${isDark ? theme.navbarBg : theme.sidebarBg} !important;
          color: ${theme.mutedText} !important;
          border-color: ${theme.border} !important;
          font-weight: 600 !important;
        }
        .admin-theme-scope table td {
          background: transparent !important;
          color: ${theme.bodyText} !important;
          border-color: ${theme.border} !important;
        }
        .admin-theme-scope table tbody tr:hover td {
          background: ${theme.cardHover} !important;
        }

        /* ─── 5. Headings & Typography ─── */
        .admin-theme-scope h1,
        .admin-theme-scope h2,
        .admin-theme-scope h3,
        .admin-theme-scope h4,
        .admin-theme-scope h5,
        .admin-theme-scope h6,
        .admin-theme-scope [style*="fontSize: 22"],
        .admin-theme-scope [style*="font-size: 22px"],
        .admin-theme-scope [style*="fontSize: 20"],
        .admin-theme-scope [style*="font-size: 20px"],
        .admin-theme-scope [style*="fontSize: 24"],
        .admin-theme-scope [style*="font-size: 24px"],
        .admin-theme-scope [style*="fontSize: 26"],
        .admin-theme-scope [style*="font-size: 26px"] {
          color: ${theme.heading} !important;
          font-weight: 600;
        }

        .admin-theme-scope [style*="color: #111110"],
        .admin-theme-scope [style*="color:#111110"],
        .admin-theme-scope [style*="color: #1a1a1a"],
        .admin-theme-scope [style*="color:#1a1a1a"],
        .admin-theme-scope [style*="color: rgb(17, 17, 16)"],
        .admin-theme-scope [style*="color: rgb(26, 26, 26)"] {
          color: ${theme.bodyText} !important;
        }

        .admin-theme-scope [style*="color: #3a3a38"],
        .admin-theme-scope [style*="color:#3a3a38"],
        .admin-theme-scope [style*="color: #4a4a46"],
        .admin-theme-scope [style*="color:#4a4a46"] {
          color: ${theme.bodyText} !important;
        }

        .admin-theme-scope [style*="color: #b0aea6"],
        .admin-theme-scope [style*="color:#b0aea6"],
        .admin-theme-scope [style*="color: #7a7870"],
        .admin-theme-scope [style*="color:#7a7870"],
        .admin-theme-scope [style*="color: #8a8880"],
        .admin-theme-scope [style*="color:#8a8880"],
        .admin-theme-scope [style*="color: #c0bdb4"],
        .admin-theme-scope [style*="color:#c0bdb4"],
        .admin-theme-scope [style*="color: #94A3B8"] {
          color: ${theme.mutedText} !important;
        }

        /* ─── 6. Inputs & Selects ─── */
        .admin-theme-scope input,
        .admin-theme-scope select,
        .admin-theme-scope textarea {
          background: ${theme.inputBg} !important;
          border: 1px solid ${theme.inputBorder} !important;
          color: ${theme.bodyText} !important;
          outline: none;
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        .admin-theme-scope input:focus,
        .admin-theme-scope select:focus,
        .admin-theme-scope textarea:focus {
          border-color: ${theme.focus} !important;
          box-shadow: 0 0 0 2px ${theme.focus}40 !important;
        }
        .admin-theme-scope input::placeholder {
          color: ${theme.mutedText} !important;
        }

        /* ─── 7. Primary Action Buttons ─── */
        .admin-theme-scope button[style*="background: #111110"],
        .admin-theme-scope button[style*="background:#111110"],
        .admin-theme-scope button[style*="background: #1a1a1a"],
        .admin-theme-scope button[style*="background:#1a1a1a"],
        .admin-theme-scope button[style*="background: rgb(17, 17, 16)"] {
          background: ${theme.primaryButton} !important;
          color: ${theme.buttonText} !important;
          border: 1px solid ${theme.primaryButton} !important;
          box-shadow: 0 2px 10px ${theme.primaryButton}40 !important;
          font-weight: 600 !important;
          transition: transform 0.12s, filter 0.12s, box-shadow 0.12s;
        }
        .admin-theme-scope button[style*="background: #111110"]:hover,
        .admin-theme-scope button[style*="background:#111110"]:hover {
          filter: brightness(1.1);
          transform: translateY(-1px);
        }

        /* ─── 8. Secondary Buttons & Pagination ─── */
        .admin-theme-scope button[style*="background: #fff"],
        .admin-theme-scope button[style*="background: #ffffff"],
        .admin-theme-scope button[style*="background:#fff"],
        .admin-theme-scope button[style*="background:#ffffff"],
        .admin-theme-scope button[style*="background: rgb(255, 255, 255)"],
        .admin-theme-scope button[style*="background: #f5f4f0"] {
          background: ${theme.secondaryButton} !important;
          color: ${theme.secondaryText} !important;
          border: 1px solid ${theme.border} !important;
          transition: background 0.12s, color 0.12s;
        }
        .admin-theme-scope button[style*="background: #fff"]:hover,
        .admin-theme-scope button[style*="background: #ffffff"]:hover {
          background: ${theme.cardHover} !important;
        }

        /* ─── 9. Borders Across Elements ─── */
        .admin-theme-scope [style*="border: 1px solid #e8e6de"],
        .admin-theme-scope [style*="border: 1px solid #e2e0d8"],
        .admin-theme-scope [style*="border: 1px solid #e0ddd5"],
        .admin-theme-scope [style*="border-bottom: 1px solid #e8e6de"],
        .admin-theme-scope [style*="borderBottom: 1px solid #e8e6de"],
        .admin-theme-scope [style*="borderTop: 1px solid #e8e6de"],
        .admin-theme-scope [style*="borderRight: 1px solid #e8e6de"],
        .admin-theme-scope [style*="border-bottom: 1px solid #f0eee8"],
        .admin-theme-scope [style*="borderBottom: 1px solid #f0eee8"],
        .admin-theme-scope [style*="border-bottom: 1px solid #f5f4f0"],
        .admin-theme-scope [style*="borderBottom: 1px solid #f5f4f0"],
        .admin-theme-scope [style*="border: 1px solid #f0eee8"] {
          border-color: ${theme.border} !important;
        }

        /* ─── 10. Status Badges (Success, Warning, Danger, Info) ─── */
        .admin-theme-scope [style*="background: #eaf3de"],
        .admin-theme-scope [style*="background:#eaf3de"] {
          background: ${theme.successBg} !important;
          color: ${theme.success} !important;
        }
        .admin-theme-scope [style*="background: #fdf2f2"],
        .admin-theme-scope [style*="background:#fdf2f2"] {
          background: ${theme.dangerBg} !important;
          color: ${theme.danger} !important;
        }
        .admin-theme-scope [style*="background: #faeeda"],
        .admin-theme-scope [style*="background:#faeeda"] {
          background: ${theme.warningBg} !important;
          color: ${theme.warning} !important;
        }

        /* ─── 11. Mobile Sidebar Responsive Rules ─── */
        @media (max-width: 1023px) {
          .admin-sidebar {
            position: fixed !important;
            top: 0 !important;
            bottom: 0 !important;
            left: 0 !important;
            height: 100vh !important;
            z-index: 999 !important;
            transform: translateX(-100%);
            transition: transform 0.28s cubic-bezier(0.4, 0, 0.2, 1) !important;
            box-shadow: none;
          }
          .admin-sidebar.open {
            transform: translateX(0) !important;
            box-shadow: 0 0 50px rgba(0, 0, 0, 0.6) !important;
          }
          .sidebar-mobile-close-btn {
            display: flex !important;
          }
          .navbar-search-wrap {
            display: none !important;
          }
          .navbar-profile-info {
            display: none !important;
          }
        }

        @media (min-width: 1024px) {
          .admin-sidebar {
            position: sticky !important;
            top: 0 !important;
            transform: none !important;
            box-shadow: none !important;
          }
          .sidebar-mobile-close-btn {
            display: none !important;
          }
          .admin-sidebar-backdrop {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default AdminLayout;
