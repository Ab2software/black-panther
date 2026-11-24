import api from "../utils/api";

export const getAccountStatement = async () => {
  try {
    const res = await api.get(
      "/transaction/user/account-statement"
    );
    return res.data;
  } catch (error) {
    throw (
      error.response?.data || {
        message: "Failed to fetch account statement",
      }
    );
  }
};