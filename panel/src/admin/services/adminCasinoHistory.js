import api from "../utils/api";

export const fetchCasinoBetHistory = async (params = {}) => {
  const { data } = await api.get("/admin/casino-bet-history", { params });
  // console.log("Fetched casino bet history:", data);
  return data;
};