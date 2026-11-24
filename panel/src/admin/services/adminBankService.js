// services/adminBankService.js
import api from "../utils/api"; // adjust path to wherever your axios instance file lives

// Get logged-in admin's own bank details (if you have a GET route for this — see note below)
export const getMyBankDetails = async () => {
  const res = await api.get("/admin/bank-details");
  return res.data;
};

// Create/update logged-in admin's bank details
export const updateMyBankDetails = async ({
  accountHolderName,
  accountNumber,
  ifscCode,
  bankName,
}) => {
  const res = await api.put("/admin/bank-details", {
    accountHolderName,
    accountNumber,
    ifscCode,
    bankName,
  });
  return res.data;
};

export default {
  getMyBankDetails,
  updateMyBankDetails,
};