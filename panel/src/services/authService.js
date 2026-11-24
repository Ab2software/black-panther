import api from "../utils/api";

// 🔐 Register user
export const registerUser = async (data) => {
  try {
    const response = await api.post("/auth/register", data);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Something went wrong" };
  }
};

// 🔐 Login user
export const loginUser = async (data) => {
  try {
    const response = await api.post("/auth/login", data);

    if (response.data?.token) {
      localStorage.setItem("token", response.data.token);
    }

    // ✅ ADD THIS — save the user so localStorage is never stale
    if (response.data?.user) { 
      localStorage.setItem("user", JSON.stringify(response.data.user));
    }

    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Something went wrong" };
  }
};

// 🎮 Demo login — no credentials needed
export const demoLogin = async () => {
  try {
    const response = await api.post("/auth/demo-login");
    if (response.data?.token) {
      localStorage.setItem("token", response.data.token);
    }
    return response.data;
  } catch (error) {
    console.log("demoLogin error:", error);
    throw error.response?.data || { message: "Demo login failed" };
  }
};

// 🚪 Logout user
export const logoutUser = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
};

// =======================
// 👤 USER SERVICES
// =======================

// ✅ Get current user
export const getCurrentUser = async () => {
  try {
    const res = await api.get("/auth/get_user"); // adjust prefix if needed
    return res.data;
  } catch (error) {
    throw error.response?.data || { message: "Failed to fetch user" };
  }
};

// ✅ Update profile
export const updateProfile = async (data) => {
  try {
    const res = await api.put("/auth/update-profile", data);
    return res.data;
  } catch (error) {
    throw error.response?.data || { message: "Profile update failed" };
  }
};

// ✅ Reset password
export const resetPassword = async (data) => {
  try {
    const res = await api.post("/auth/password-reset", data);
    return res.data;
  } catch (error) {
    throw error.response?.data || { message: "Password reset failed" };
  }
};