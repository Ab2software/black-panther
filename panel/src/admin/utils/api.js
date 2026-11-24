import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL + "/api/v1";
// const BASE_URL = "http://localhost:5001/api/v1";

const api = axios.create({
  baseURL: BASE_URL,
  // withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// ✅ Request interceptor (adds token)
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("adminToken");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ✅ Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API Error:", error.response?.data || error.message);

    // 🔥 OPTIONAL: auto logout on 401
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/"; // or /login
    }

    return Promise.reject(error);
  }
);

export default api;