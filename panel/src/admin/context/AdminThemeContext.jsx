import React, { createContext, useContext, useState, useEffect, useMemo } from "react";
import { useAdminAuth } from "./AdminAuthContext";

export const ROLE_THEMES = {
  owner: "#D4AF37",
  superadmin: "#8B5CF6",
  admin: "#2563EB",
  subadmin: "#0891B2",
  master: "#16A34A",
  agent: "#EA580C",
};

export const ROLE_LABELS = {
  owner: "OWNER",
  superadmin: "SUPER ADMIN",
  admin: "ADMIN",
  subadmin: "SUB ADMIN",
  master: "MASTER",
  agent: "AGENT",
};

// ─── Exact Specification from Design Spec ───
export const EXACT_ROLE_THEMES = {
  owner: {
    name: "Owner",
    dark: {
      pageBg: "#0C0B09",
      sidebarBg: "#12110D",
      navbarBg: "#161510",
      cardBg: "#19170F",
      cardHover: "#242012",
      primaryButton: "#D4AF37",
      buttonText: "#17130A",
      secondaryButton: "#302A19",
      secondaryText: "#D6C58E",
      heading: "#FFF8E1",
      bodyText: "#D6D0BD",
      mutedText: "#A39A82",
      border: "#39321D",
      inputBg: "#12110D",
      inputBorder: "#51462A",
      focus: "#D4AF37",
    },
    light: {
      pageBg: "#FAF8F0",
      sidebarBg: "#F3EFE2",
      navbarBg: "#FFFFFF",
      cardBg: "#FFFFFF",
      cardHover: "#FDF9EC",
      primaryButton: "#A98518",
      buttonText: "#FFFFFF",
      secondaryButton: "#F1E9D3",
      secondaryText: "#725B21",
      heading: "#292211",
      bodyText: "#514936",
      mutedText: "#82785F",
      border: "#E8DFC5",
      inputBg: "#FFFFFF",
      inputBorder: "#D8CBA9",
      focus: "#A98518",
    },
  },

  superadmin: {
    name: "Super Admin",
    dark: {
      pageBg: "#0B0915",
      sidebarBg: "#110E20",
      navbarBg: "#151322",
      cardBg: "#171329",
      cardHover: "#211B38",
      primaryButton: "#8B5CF6",
      buttonText: "#FFFFFF",
      secondaryButton: "#30264B",
      secondaryText: "#C4B5FD",
      heading: "#F5F3FF",
      bodyText: "#D1C9E8",
      mutedText: "#A49ABF",
      border: "#342A50",
      inputBg: "#110E20",
      inputBorder: "#45365F",
      focus: "#A78BFA",
    },
    light: {
      pageBg: "#F7F5FF",
      sidebarBg: "#EFEBFF",
      navbarBg: "#FFFFFF",
      cardBg: "#FFFFFF",
      cardHover: "#F4F0FF",
      primaryButton: "#7C3AED",
      buttonText: "#FFFFFF",
      secondaryButton: "#EDE5FF",
      secondaryText: "#6D28D9",
      heading: "#21143F",
      bodyText: "#44365F",
      mutedText: "#766B91",
      border: "#E4DCF9",
      inputBg: "#FFFFFF",
      inputBorder: "#D5C8F0",
      focus: "#7C3AED",
    },
  },

  admin: {
    name: "Admin",
    dark: {
      pageBg: "#080E1A",
      sidebarBg: "#0D1525",
      navbarBg: "#121927",
      cardBg: "#121E33",
      cardHover: "#1B2B46",
      primaryButton: "#2563EB",
      buttonText: "#FFFFFF",
      secondaryButton: "#253653",
      secondaryText: "#93C5FD",
      heading: "#F1F5FF",
      bodyText: "#CBD5E1",
      mutedText: "#94A3B8",
      border: "#293B56",
      inputBg: "#0D1525",
      inputBorder: "#344967",
      focus: "#60A5FA",
    },
    light: {
      pageBg: "#F3F7FF",
      sidebarBg: "#EAF1FF",
      navbarBg: "#FFFFFF",
      cardBg: "#FFFFFF",
      cardHover: "#EEF4FF",
      primaryButton: "#1D4ED8",
      buttonText: "#FFFFFF",
      secondaryButton: "#E3EDFF",
      secondaryText: "#1D4ED8",
      heading: "#14213D",
      bodyText: "#3B4B63",
      mutedText: "#64748B",
      border: "#DCE6F5",
      inputBg: "#FFFFFF",
      inputBorder: "#C8D7EC",
      focus: "#1D4ED8",
    },
  },

  subadmin: {
    name: "Sub Admin",
    dark: {
      pageBg: "#071116",
      sidebarBg: "#0C1920",
      navbarBg: "#111C23",
      cardBg: "#10212A",
      cardHover: "#18303A",
      primaryButton: "#0891B2",
      buttonText: "#FFFFFF",
      secondaryButton: "#1C3944",
      secondaryText: "#67E8F9",
      heading: "#ECFEFF",
      bodyText: "#C7E5E9",
      mutedText: "#91B5BE",
      border: "#24414B",
      inputBg: "#0C1920",
      inputBorder: "#31515D",
      focus: "#22D3EE",
    },
    light: {
      pageBg: "#F0FAFC",
      sidebarBg: "#E5F5F8",
      navbarBg: "#FFFFFF",
      cardBg: "#FFFFFF",
      cardHover: "#E9F8FA",
      primaryButton: "#0E7490",
      buttonText: "#FFFFFF",
      secondaryButton: "#DDF3F7",
      secondaryText: "#0E7490",
      heading: "#10313C",
      bodyText: "#365761",
      mutedText: "#64818A",
      border: "#D2E9ED",
      inputBg: "#FFFFFF",
      inputBorder: "#C3DDE2",
      focus: "#0E7490",
    },
  },

  master: {
    name: "Master",
    dark: {
      pageBg: "#08120B",
      sidebarBg: "#0D1A10",
      navbarBg: "#111E14",
      cardBg: "#14251A",
      cardHover: "#1C3424",
      primaryButton: "#16A34A",
      buttonText: "#FFFFFF",
      secondaryButton: "#23402C",
      secondaryText: "#86EFAC",
      heading: "#F0FDF4",
      bodyText: "#C9E5CF",
      mutedText: "#91B49A",
      border: "#294533",
      inputBg: "#0D1A10",
      inputBorder: "#365541",
      focus: "#4ADE80",
    },
    light: {
      pageBg: "#F1FAF3",
      sidebarBg: "#E6F4E9",
      navbarBg: "#FFFFFF",
      cardBg: "#FFFFFF",
      cardHover: "#EAF7ED",
      primaryButton: "#15803D",
      buttonText: "#FFFFFF",
      secondaryButton: "#DDF2E2",
      secondaryText: "#15803D",
      heading: "#14331E",
      bodyText: "#3D5945",
      mutedText: "#6B8271",
      border: "#D5E9D9",
      inputBg: "#FFFFFF",
      inputBorder: "#C5DDCA",
      focus: "#15803D",
    },
  },

  agent: {
    name: "Agent",
    dark: {
      pageBg: "#120A06",
      sidebarBg: "#1A100A",
      navbarBg: "#1F1510",
      cardBg: "#24170F",
      cardHover: "#352014",
      primaryButton: "#EA580C",
      buttonText: "#FFFFFF",
      secondaryButton: "#402719",
      secondaryText: "#FDBA74",
      heading: "#FFF7ED",
      bodyText: "#E7D2C1",
      mutedText: "#B49A85",
      border: "#493022",
      inputBg: "#1A100A",
      inputBorder: "#553A29",
      focus: "#FB923C",
    },
    light: {
      pageBg: "#FFF7F0",
      sidebarBg: "#FCEDE0",
      navbarBg: "#FFFFFF",
      cardBg: "#FFFFFF",
      cardHover: "#FFF0E3",
      primaryButton: "#C2410C",
      buttonText: "#FFFFFF",
      secondaryButton: "#FCE5D3",
      secondaryText: "#C2410C",
      heading: "#3B1D0C",
      bodyText: "#634735",
      mutedText: "#8B735F",
      border: "#F0DCCB",
      inputBg: "#FFFFFF",
      inputBorder: "#E8CDB7",
      focus: "#C2410C",
    },
  },
};

export const COMMON_STATUS_COLORS = {
  dark: {
    success: "#22C55E",
    successBg: "#12351F",
    warning: "#FBBF24",
    warningBg: "#422D0C",
    danger: "#F87171",
    dangerBg: "#451A1A",
    info: "#60A5FA",
    infoBg: "#172F50",
    disabledBg: "#293548",
    disabledText: "#64748B",
  },
  light: {
    success: "#15803D",
    successBg: "#DCFCE7",
    warning: "#B45309",
    warningBg: "#FEF3C7",
    danger: "#DC2626",
    dangerBg: "#FEE2E2",
    info: "#1D4ED8",
    infoBg: "#DBEAFE",
    disabledBg: "#E2E8F0",
    disabledText: "#94A3B8",
  },
};

export const normalizeRole = (r) => {
  if (!r) return "admin";
  const clean = String(r).trim().toLowerCase().replace(/[\s_-]+/g, "");
  if (clean.includes("super")) return "superadmin";
  if (clean.includes("sub")) return "subadmin";
  if (clean.includes("owner")) return "owner";
  if (clean.includes("master")) return "master";
  if (clean.includes("agent")) return "agent";
  return "admin";
};

const AdminThemeContext = createContext();

export const AdminThemeProvider = ({ children }) => {
  const { admin } = useAdminAuth();
  const [overrideRole, setOverrideRole] = useState(null);

  const [isDark, setIsDark] = useState(() => {
    try {
      const saved = localStorage.getItem("adminThemeMode");
      if (saved === "dark") return true;
      if (saved === "light") return false;
      return false;
    } catch {
      return false;
    }
  });

  // Synchronous initial role detection with localStorage fallback to prevent theme flickering
  const currentRole = useMemo(() => {
    if (overrideRole) return normalizeRole(overrideRole);
    if (admin?.role) return normalizeRole(admin.role);
    try {
      const stored = localStorage.getItem("admin");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.role) return normalizeRole(parsed.role);
      }
    } catch {}
    return "admin";
  }, [admin?.role, overrideRole]);

  const toggleTheme = () => {
    setIsDark((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("adminThemeMode", next ? "dark" : "light");
      } catch {}
      return next;
    });
  };

  const setMode = (mode) => {
    const isDarkMode = mode === "dark";
    setIsDark(isDarkMode);
    try {
      localStorage.setItem("adminThemeMode", isDarkMode ? "dark" : "light");
    } catch {}
  };

  const theme = useMemo(() => {
    const roleItem = EXACT_ROLE_THEMES[currentRole] || EXACT_ROLE_THEMES.admin;
    const roleColors = isDark ? roleItem.dark : roleItem.light;
    const common = isDark ? COMMON_STATUS_COLORS.dark : COMMON_STATUS_COLORS.light;

    const badgeColor = isDark ? roleColors.focus : roleColors.primaryButton;
    const badgeBg = roleColors.secondaryButton;
    const badgeBorder = roleColors.border;

    return {
      isDark,
      mode: isDark ? "dark" : "light",
      role: currentRole,
      roleName: roleItem.name,
      roleLabel: ROLE_LABELS[currentRole] || currentRole.toUpperCase(),
      roleThemeColor: ROLE_THEMES[currentRole] || ROLE_THEMES.admin,
      // Design Spec mapped tokens
      primary: roleColors.primaryButton,
      primaryHover: roleColors.focus,
      buttonBg: roleColors.primaryButton,
      headerBg: roleColors.navbarBg,
      badgeColor,
      badgeBg,
      badgeBorder,
      ...roleColors,
      // Common status colors
      ...common,
    };
  }, [isDark, currentRole]);

  // Inject exact design spec CSS custom properties
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--admin-page-bg", theme.pageBg);
    root.style.setProperty("--admin-sidebar-bg", theme.sidebarBg);
    root.style.setProperty("--admin-navbar-bg", theme.navbarBg);
    root.style.setProperty("--admin-header-bg", theme.navbarBg);
    root.style.setProperty("--admin-card-bg", theme.cardBg);
    root.style.setProperty("--admin-card-hover", theme.cardHover);
    root.style.setProperty("--admin-primary-btn", theme.primaryButton);
    root.style.setProperty("--admin-btn-text", theme.buttonText);
    root.style.setProperty("--admin-secondary-btn", theme.secondaryButton);
    root.style.setProperty("--admin-secondary-text", theme.secondaryText);
    root.style.setProperty("--admin-heading", theme.heading);
    root.style.setProperty("--admin-body-text", theme.bodyText);
    root.style.setProperty("--admin-muted-text", theme.mutedText);
    root.style.setProperty("--admin-border", theme.border);
    root.style.setProperty("--admin-input-bg", theme.inputBg);
    root.style.setProperty("--admin-input-border", theme.inputBorder);
    root.style.setProperty("--admin-focus", theme.focus);

    root.style.setProperty("--admin-badge-color", theme.badgeColor);
    root.style.setProperty("--admin-badge-bg", theme.badgeBg);
    root.style.setProperty("--admin-badge-border", theme.badgeBorder);

    root.style.setProperty("--admin-success", theme.success);
    root.style.setProperty("--admin-success-bg", theme.successBg);
    root.style.setProperty("--admin-warning", theme.warning);
    root.style.setProperty("--admin-warning-bg", theme.warningBg);
    root.style.setProperty("--admin-danger", theme.danger);
    root.style.setProperty("--admin-danger-bg", theme.dangerBg);
    root.style.setProperty("--admin-info", theme.info);
    root.style.setProperty("--admin-info-bg", theme.infoBg);
    root.style.setProperty("--admin-disabled-bg", theme.disabledBg);
    root.style.setProperty("--admin-disabled-text", theme.disabledText);
  }, [theme]);

  return (
    <AdminThemeContext.Provider
      value={{
        isDark,
        toggleTheme,
        setIsDark,
        setMode,
        setOverrideRole,
        theme,
        role: currentRole,
        ROLE_THEMES,
        ROLE_LABELS,
        EXACT_ROLE_THEMES,
        COMMON_STATUS_COLORS,
        normalizeRole,
      }}
    >
      {children}
    </AdminThemeContext.Provider>
  );
};

export const useAdminTheme = () => {
  const context = useContext(AdminThemeContext);
  if (!context) {
    const roleColors = EXACT_ROLE_THEMES.admin.light;
    const common = COMMON_STATUS_COLORS.light;
    return {
      isDark: false,
      toggleTheme: () => {},
      setIsDark: () => {},
      setMode: () => {},
      setOverrideRole: () => {},
      role: "admin",
      ROLE_THEMES,
      ROLE_LABELS,
      EXACT_ROLE_THEMES,
      COMMON_STATUS_COLORS,
      normalizeRole,
      theme: {
        isDark: false,
        mode: "light",
        role: "admin",
        roleName: "Admin",
        roleLabel: "ADMIN",
        roleThemeColor: ROLE_THEMES.admin,
        primary: roleColors.primaryButton,
        primaryHover: roleColors.focus,
        buttonBg: roleColors.primaryButton,
        headerBg: roleColors.navbarBg,
        badgeColor: roleColors.primaryButton,
        badgeBg: roleColors.secondaryButton,
        badgeBorder: roleColors.border,
        ...roleColors,
        ...common,
      },
    };
  }
  return context;
};
