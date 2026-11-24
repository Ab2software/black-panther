import api from "../utils/api";

// 💰 Get wallet balance
export const getWallet = async () => {
  const res = await api.get("/wallet/get/wallet");
  return res.data;
};

// 📸 Get QR Scanners for Deposit
export const getScanners = async () => {
  const res = await api.get("/wallet/get/scanner");
  return res.data;
};

// 🏦 Get Admin Bank Details
export const getAdminBankDetails = async () => {
  try {
    const res = await api.get("/user/assigned-admin/bank-details");
    return res.data;
  } catch (err) {
    return { success: false };
  }
};

// 💸 Upload Deposit slip
export const uploadDeposit = async ({ price, transactionId, file, method }) => {
  const formData = new FormData();
  formData.append("price", price);
  formData.append("transactionId", transactionId);
  formData.append("method", method || "upi");
  if (file) {
    formData.append("paymentScreenshot", file);
  }

  const res = await api.post("/wallet/user/payment/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

// 🏧 Request Withdrawal
export const requestWithdrawal = async (data) => {
  const res = await api.post("/wallet/user/withdraw", data);
  return res.data;
};

// 📜 Get User Account Statement / Transactions
export const getTransactions = async (page = 1, limit = 20) => {
  try {
    const res = await api.get(`/transaction/user/account-statement?page=${page}&limit=${limit}`);
    return res.data;
  } catch (err) {
    return { success: false, transactions: [] };
  }
};
