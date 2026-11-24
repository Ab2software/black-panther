import { useAuth } from "../context/AuthContext";
import { Navigate, useLocation } from "react-router-dom";

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <p>Loading...</p>;

  // Don't interfere with admin routes
  if (location.pathname.startsWith("/admin")) return children;

  if (!user) return <Navigate to="/" />;

  return children;
};

export default ProtectedRoute;