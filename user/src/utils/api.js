import axios from "axios";

const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:5002") + "/api/v1";

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("player_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("player_token");
      localStorage.removeItem("player_user");
    }
    return Promise.reject(error);
  }
);

export default api;
