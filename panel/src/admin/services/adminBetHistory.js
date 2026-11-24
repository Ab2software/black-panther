import api from "../utils/api";

export const fetchAdminBets = async (params) => {
  try {
    const response = await api.get("/admin/bets", { params });
    return response.data;
  } catch (error) {
    console.error("Error fetching admin bets:", error);
    throw error;
  }
};

export const fetchAdminAnalytics = async () => {
  try {
    const response = await api.get("/admin/analytics");
    return response.data;
  } catch (error) {
    console.error("Error fetching admin analytics:", error);
    throw error;
  }
};

export const settleBet = async (betId, status, price) => {
  try {
    const response = await api.patch(`/admin/bets/${betId}/settle`, {
      status,
      ...(price != null ? { price } : {}),
    });
    return response.data;
  } catch (error) {
    console.error("Error settling bet:", error);
    throw error;
  }
};

// ── Rollback: preview what a revert+resettle would change, no writes ──────
export const previewRollback = async (eventId) => {
  try {
    const response = await api.get("/sports/settle/rollback/preview", {
      params: { eventId },
    });
    return response.data;
  } catch (error) {
    console.error("Error previewing rollback:", error);
    throw error;
  }
};

// ── Rollback: revert all settled bets for an eventId and re-settle ────────
export const rollbackEvent = async (eventId) => {
  try {
    const response = await api.post("/sports/settle/rollback", { eventId });
    return response.data;
  } catch (error) {
    console.error("Error rolling back event:", error);
    throw error;
  }
};