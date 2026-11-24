import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL + "/api/v1";

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ✅ Unauthorized handler — set once by AuthProvider, called by interceptor
let onUnauthorized = null;
export const setUnauthorizedHandler = (fn) => {
  onUnauthorized = fn;
};

// ✅ Password-change-required handler — set once by AuthProvider
let onPasswordChangeRequired = null;
export const setPasswordChangeRequiredHandler = (fn) => {
  onPasswordChangeRequired = fn;
};

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API Error:", error.response?.data || error.message);

    if (error.response?.status === 401) {
      if (onUnauthorized) {
        onUnauthorized();
      } else {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        if (window.location.pathname !== "/") {
          window.location.href = "/";
        }
      }
    }

    // ✅ Backend blocks every route with this code until password is changed
    if (
      error.response?.status === 403 &&
      error.response?.data?.code === "PASSWORD_CHANGE_REQUIRED"
    ) {
      if (onPasswordChangeRequired) {
        onPasswordChangeRequired();
      }
    }

    return Promise.reject(error);
  }
);

export default api;