import api from "../utils/api";

// ================= ADMIN AUTH =================
export const adminLogin = async (data) => {
  const response = await api.post("/admin/login", data);
  return response.data;
};

export const registerAdmin = async (data) => {
  const response = await api.post("/admin/register", data);
  return response.data;
};

export const adminLogout = async () => {
  try {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("admin");
  } catch (error) {
    console.error("Logout Error:", error);
  }
};

// ================= PAYMENT SCANNER =================
// ✅ Add a new scanner (each upload now creates an independent scanner)
export const addScanner = async (formData) => {
  const response = await api.post("/admin/add-scanner", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data;
};

// ✅ Get active scanner (used by end users, resolved via assignedAdmin/parentId)
export const getActiveScanner = async () => {
  const response = await api.get("/admin/active-scanner");
  return response.data;
};

// ✅ Get MY OWN active scanner (used by ADMIN/SUPERADMIN/SUBADMIN dashboard)
export const getMyScanner = async () => {
  const response = await api.get("/admin/my-scanner");
  return response.data;
};

// ✅ Get ALL of my scanners (for the multi-scanner management UI)
export const getAllScanners = async () => {
  const response = await api.get("/admin/all-scanners");
  return response.data;
};

// ✅ Activate one scanner (auto-deactivates all others for this admin)
export const setActiveScanner = async (scannerId) => {
  const response = await api.patch(`/admin/activate-scanner/${scannerId}`);
  return response.data;
};

// ✅ Delete a scanner
export const deleteScanner = async (scannerId) => {
  const response = await api.delete(`/admin/delete-scanner/${scannerId}`);
  return response.data;
};

export const updateUserWhatsapp = async (userId, whatsapp) => {
  const response = await api.patch(`/admin/users/${userId}/whatsapp`, { whatsapp });
  return response.data;
};

export const getPublicWhatsapp = async () => {
  const response = await api.get("/admin/public/whatsapp");
  return response.data;
};

// ================= CHANGE PASSWORD =================
export const resetPassword = async ({ oldPassword, newPassword }) => {
  const response = await api.put("/admin/change-password", {
    oldPassword,
    newPassword,
  });
  return response.data;
};