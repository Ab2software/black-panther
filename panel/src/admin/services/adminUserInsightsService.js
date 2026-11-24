import api from "../utils/api";

export const searchUsers = async (q) => {
  const response = await api.get("/admin/insights/users/search", { params: { q } });
  return response.data;
};

export const getUserSummary = async (userId, { dateFrom, dateTo } = {}) => {
  const response = await api.get(`/admin/insights/users/${userId}/summary`, {
    params: { dateFrom, dateTo },
  });
  return response.data;
};

export const getUserBetHistory = async (userId, { dateFrom, dateTo, status, page = 1, limit = 20 } = {}) => {
  const response = await api.get(`/admin/insights/users/${userId}/bets`, {
    params: { dateFrom, dateTo, status, page, limit },
  });
  return response.data;
};

export const getUserGameHistory = async (userId, { dateFrom, dateTo, result, page = 1, limit = 20 } = {}) => {
  const response = await api.get(`/admin/insights/users/${userId}/games`, {
    params: { dateFrom, dateTo, result, page, limit },
  });
  return response.data;
};

export const getUserFinanceHistory = async (userId, { dateFrom, dateTo, type = "all", page = 1, limit = 20 } = {}) => {
  const response = await api.get(`/admin/insights/users/${userId}/finance`, {
    params: { dateFrom, dateTo, type, page, limit },
  });
  return response.data;
};  