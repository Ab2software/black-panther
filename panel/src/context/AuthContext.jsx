import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { getCurrentUser, logoutUser, loginUser, demoLogin } from "../services/authService";
import { setUnauthorizedHandler, setPasswordChangeRequiredHandler } from "../utils/api";

const AuthContext = createContext();

const SESSION_TIMEOUT_MS = 30 * 60 * 1000;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const logoutTimerRef = useRef(null);
  const navigate = useNavigate();

  const clearLogoutTimer = () => {
    if (logoutTimerRef.current) {
      clearTimeout(logoutTimerRef.current);
      logoutTimerRef.current = null;
    }
  };

  const startLogoutTimer = useCallback(() => {
    clearLogoutTimer();
    logoutTimerRef.current = setTimeout(() => {
      logoutUser();
      setUser(null);
      alert("Your session has expired. Please log in again.");
    }, SESSION_TIMEOUT_MS);
  }, []);

  const fetchUser = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const res = await getCurrentUser();
      setUser(res.user);
      localStorage.setItem("user", JSON.stringify(res.user));
      startLogoutTimer();

      // ✅ Redirect straight to change-password if flagged, unless already there
      if (res.user?.mustChangePassword && window.location.pathname !== "/change-password") {
        navigate("/change-password", { replace: true });
      }
    } catch (err) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [startLogoutTimer, navigate]);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      clearLogoutTimer();
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      setUser(null);
      setLoading(false);
      if (window.location.pathname !== "/") {
        navigate("/", { replace: true });
      }
    });

    // ✅ Any API call anywhere that hits PASSWORD_CHANGE_REQUIRED bounces here
    setPasswordChangeRequiredHandler(() => {
      if (window.location.pathname !== "/change-password") {
        navigate("/change-password", { replace: true });
      }
    });
  }, [navigate]);

  useEffect(() => {
    if (window.location.pathname.startsWith("/admin")) {
      setLoading(false);
      return;
    }
    fetchUser();
    return () => clearLogoutTimer();
  }, [fetchUser]);

  const login = async (form) => {
    await loginUser(form);
    await fetchUser();
  };

  const handleDemoLogin = async () => {
    await demoLogin();
    await fetchUser();
  };

  const handleLogout = () => {
    clearLogoutTimer();
    logoutUser();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, loading, fetchUser, handleLogout, login, handleDemoLogin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);