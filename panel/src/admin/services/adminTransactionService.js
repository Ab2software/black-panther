import api from '../utils/api'

export const getAllTransactions = async (params = {}) => {
  const response = await api.get("/transaction/all", { params });
  return response.data;
};

export const updateTransactionStatus = async (id, status, remark) => {
  const response = await api.put(`/transaction/status/${id}`, {
    status, // "approved" | "rejected" | "pending"
    remark
  });
  return response.data;
};

// GET withdraws
export const getAllWithdraws = async () => {
  const response = await api.get("/transaction/withdraws");
  return response.data;
};

// UPDATE withdraw status
// status: "approved" | "rejected"
// extra: { proofImage: File }  → required when status === "approved"
// extra: { reason: string }    → required when status === "rejected"
export const updateWithdrawStatus = async (id, status, extra = {}) => {
  if (status === "approved") {
    const formData = new FormData();
    formData.append("status", status);
    formData.append("proofImage", extra.proofImage);

    const response = await api.put(`/transaction/withdraw/${id}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  }

  // rejected
  const response = await api.put(`/transaction/withdraw/${id}`, {
    status,
    reason: extra.reason,
  });
  return response.data;
};