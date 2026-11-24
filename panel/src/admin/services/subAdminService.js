import api from "../utils/api";

// Fetch all sub-admins
export const getSubAdmins = async () => {
  const res = await api.get("/admin/subadmins");
  return res.data;
};

// Create sub-admin
export const createSubAdmin = async (data) => {
  const res = await api.post("/admin/subadmins", data);
  return res.data;
};

// Activate
export const activateSubAdmin = async (id) => {
  const res = await api.patch(`/admin/subadmins/${id}/activate`);
  return res.data;
};

// Deactivate
export const deactivateSubAdmin = async (id) => {
  const res = await api.patch(`/admin/subadmins/${id}/deactivate`);
  return res.data;
};

// Delete
export const deleteSubAdmin = async (id) => {
  const res = await api.delete(`/admin/subadmins/${id}`);
  return res.data;
};

// Reassign
export const reassignUser = async (userId, newAdminId) => {
  const res = await api.patch("/admin/subadmins/reassign-user", {
    userId,
    newAdminId,
  });
  return res.data;
};