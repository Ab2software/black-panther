import React from "react";
import { Navigate } from "react-router-dom";

const ALLOWED_ROLES = [
  "owner",
  "superadmin",
  "admin",
  "subadmin",
  "master",
  "agent",
];

const AdminProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("adminToken");
  const admin = JSON.parse(localStorage.getItem("admin") || "null");

  if (!token || !ALLOWED_ROLES.includes(admin?.role)) {
    return <Navigate to="/admin/login" />;
  }

  return children;
};

export default AdminProtectedRoute;