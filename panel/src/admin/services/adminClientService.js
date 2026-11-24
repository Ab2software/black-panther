import api from "../utils/api";

const BASE = "/admin/clients";

// ─── GET ALL CLIENTS ───────────────────────────────────────
// Params: page, limit, search, status, sortBy, sortOrder, isDemoUser
export const getClients = async (params = {}) => {
  const response = await api.get(BASE, { params });
  console.log("response", response);
  return response.data;
};

// ─── GET CLIENT STATS (dashboard cards) ───────────────────
export const getClientStats = async () => {
  const response = await api.get(`${BASE}/stats`);
  // console.log("Response in service", response.data);
  return response.data;
};

// ─── GET SINGLE CLIENT ────────────────────────────────────
export const getClientById = async (id) => {
  const response = await api.get(`${BASE}/${id}`);
  return response.data;
};

// ─── UPDATE CLIENT STATUS ─────────────────────────────────
// status: "active" | "blocked" | "suspended"
export const updateClientStatus = async (id, status) => {
  const response = await api.patch(`${BASE}/${id}/status`, { status });
  return response.data;
};

// ─── UPDATE CLIENT PERMISSIONS ────────────────────────────
// pass only the fields you want to change
// e.g. { canBet: false, isBetLocked: true }
export const updateClientPermissions = async (id, permissions = {}) => {
  const response = await api.patch(`${BASE}/${id}/permissions`, permissions);
  return response.data;
};

// ─── UPDATE BETTING LIMITS ────────────────────────────────
// e.g. { minBet: 100, maxBet: 50000 }
export const updateBettingLimits = async (id, limits = {}) => {
  const response = await api.patch(`${BASE}/${id}/betting-limits`, limits);
  return response.data;
};

// ─── SOFT DELETE CLIENT ───────────────────────────────────
export const deleteClient = async (id) => {
  const response = await api.delete(`${BASE}/${id}`);
  return response.data;
};
export const createUser = async (data) => {
  const response = await api.post("/admin/create-user", data);
  return response.data;
};

// ─── UPDATE CLIENT PASSWORD ────────────────────────────────
// admin can only reset passwords for their own assigned clients
export const updateClientPassword = async (id, newPassword) => {
  const response = await api.patch(`${BASE}/${id}/password`, { newPassword });
  return response.data;
};