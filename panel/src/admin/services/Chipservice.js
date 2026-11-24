import api from "../utils/api";

// ── Dashboard ─────────────────────────────────────────────────────────────
export const fetchChipDashboard = async () => {
  try {
    const { data } = await api.get("/chips/dashboard");
    return data;
  } catch (error) {
    console.error("Error fetching chip dashboard:", error);
    throw error.response?.data || error;
  }
};

// ── Transfer chips ────────────────────────────────────────────────────────
export const transferChips = async ({
  toUserId,
  type,
  amount,
  remark = "",
}) => {
  try {
    const { data } = await api.post("/chips/transfer", {
      toUserId,
      type,
      amount,
      remark,
    });

    return data;
  } catch (error) {
    console.error("Error transferring chips:", error);
    throw error.response?.data || error;
  }
};

// ── Transaction history ───────────────────────────────────────────────────
export const fetchChipTransactions = async ({
  page = 1,
  limit = 20,
} = {}) => {
  try {
    const { data } = await api.get("/chips/transactions", {
      params: { page, limit },
    });

    return data;
  } catch (error) {
    console.error("Error fetching chip transactions:", error);
    throw error.response?.data || error;
  }
};