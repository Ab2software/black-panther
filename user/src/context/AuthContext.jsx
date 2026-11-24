import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import api from "../utils/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const cached = localStorage.getItem("player_user");
    return cached ? JSON.parse(cached) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem("player_token") || null);
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);

  const isLoggedIn = !!token && !!user;
  const isDemo = !!user?.isDemoUser;

  // Fetch latest user details and wallet
  const refreshUser = useCallback(async () => {
    const activeToken = localStorage.getItem("player_token");
    if (!activeToken) {
      setLoading(false);
      return;
    }
    try {
      const res = await api.get("/auth/get_user");
      if (res.data?.success && res.data?.user) {
        setUser(res.data.user);
        localStorage.setItem("player_user", JSON.stringify(res.data.user));
        if (res.data.user.wallet) {
          setWallet(res.data.user.wallet);
        }
      }
    } catch (err) {
      console.warn("Could not refresh user:", err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch wallet explicitly
  const refreshWallet = useCallback(async () => {
    if (!token) return;
    try {
      const res = await api.get("/wallet/get/wallet");
      if (res.data?.wallet) {
        setWallet(res.data.wallet);
      }
    } catch (e) {
      // Wallet fallback
    }
  }, [token]);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  // Regular Player Login
  const login = async ({ username, password }) => {
    try {
      const res = await api.post("/auth/login", { username, password });
      if (!res.data?.success) {
        throw new Error(res.data?.message || "Login failed");
      }
      const authToken = res.data.token;
      const userData = res.data.user;

      localStorage.setItem("player_token", authToken);
      localStorage.setItem("player_user", JSON.stringify(userData));

      setToken(authToken);
      setUser(userData);
      if (userData?.wallet) {
        setWallet(userData.wallet);
      } else {
        refreshWallet();
      }

      return { success: true, user: userData };
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Invalid username or password";
      throw new Error(msg);
    }
  };

  // Instant Demo Login (₹10,000 Free, No credentials needed)
  const demoLogin = async () => {
    try {
      const res = await api.post("/auth/demo-login");
      if (!res.data?.success) {
        throw new Error(res.data?.message || "Demo login failed");
      }
      const authToken = res.data.token;
      const userData = res.data.user;

      localStorage.setItem("player_token", authToken);
      localStorage.setItem("player_user", JSON.stringify(userData));

      setToken(authToken);
      setUser(userData);
      setWallet(userData?.wallet || { balance: 10000, availableBalance: 10000, exposure: 0 });

      return { success: true, user: userData };
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Failed to start demo session";
      throw new Error(msg);
    }
  };

  const logout = () => {
    localStorage.removeItem("player_token");
    localStorage.removeItem("player_user");
    setToken(null);
    setUser(null);
    setWallet(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        wallet,
        isLoggedIn,
        isDemo,
        loading,
        login,
        demoLogin,
        logout,
        refreshUser,
        refreshWallet,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};

