import api from "../utils/api";

// ─────────────────────────────────────────────
// AUTH
// ─────────────────────────────────────────────

export const ownerLogin = async ({ username, password }) => {
  const res = await api.post("/owner/login", { username, password });
  return res.data;
};

// ─────────────────────────────────────────────
// STATS
// ─────────────────────────────────────────────

export const getOwnerStats = async () => {
  const res = await api.get("/owner/stats");
  return res.data;
};

// ─────────────────────────────────────────────
// SUPERADMINS
// ─────────────────────────────────────────────

export const getAllSuperAdmins = async () => {
  const res = await api.get("/owner/superadmins");
  return res.data;
};

export const updateSuperAdminStatus = async (id, status) => {
  const res = await api.patch(`/owner/superadmins/${id}/status`, { status });
  return res.data;
};

export const deleteSuperAdmin = async (id) => {
  const res = await api.delete(`/owner/superadmins/${id}`);
  return res.data;
};

// ─────────────────────────────────────────────
// CREATE ACCOUNT (superadmin / admin / user)
// ─────────────────────────────────────────────

export const createAccount = async ({
  username,
  password,
  role,
  fullName,
  email,
  phone,
  balance,
}) => {
  const res = await api.post("/owner/create", {
    username,
    password,
    role,
    fullName,
    email,
    phone,
    balance,
  });
  return res.data;
};

// ─────────────────────────────────────────────
// CHIPS TRANSFER
// ─────────────────────────────────────────────

export const ownerTransferChips = async ({ toUserId, type, amount, remark }) => {
  const res = await api.post("/owner/chips/transfer", {
    toUserId,
    type,
    amount,
    remark,
  });
  return res.data;
};