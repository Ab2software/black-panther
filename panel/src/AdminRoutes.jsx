import { Routes, Route } from "react-router-dom";
import { AdminThemeProvider } from "./admin/context/AdminThemeContext";

import Login from "./admin/pages/auth/Login";
import AdminLayout from "./admin/components/layout/AdminLayout";

import AdminProtectedRoute from "./admin/components/AdminProtectedRoute";
import Dashboard from "./admin/pages/Dashboard";
import UsersPage from "./admin/pages/users/UsersPage";
import Deposit from "./admin/pages/wallet/Deposit";
import Withdraw from "./admin/pages/wallet/Withdraw";
import SubAdmins from "./admin/pages/SubAdmins";
import BetHistory from "./admin/pages/BetHistory";
import ChipDashboard from "./admin/pages/chips/Chipdashboard";
import ChipTransfer from "./admin/pages/chips/Chiptransfer";
import ChipTransactions from "./admin/pages/chips/Chiptransactions";
import SuperAdmins from "./admin/pages/owner/SuperAdmins";
import Settings from "./admin/pages/Settings";
import CasinoBetHistory from "./admin/pages/CasinoBetHistory";
import UserInsights from "./admin/pages/users/UserInsights";
import PaymentMethod from "./admin/pages/PaymentMethod";
import AccountStatement from "./admin/pages/accountStatement/AccountStatement";

const AdminRoutes = () => {
  return (
    <AdminThemeProvider>
      <Routes>
      <Route path="login" element={<Login />} />

      <Route
        path="dashboard"
        element={
          <AdminProtectedRoute>
            <AdminLayout>
              <Dashboard />
            </AdminLayout>
          </AdminProtectedRoute>
        }
      />
      <Route
        path="users"
        element={
          <AdminProtectedRoute>
            <AdminLayout>
              <UsersPage />
            </AdminLayout>
          </AdminProtectedRoute>
        }
      />


      <Route
        path="users/insights"
        element={
          <AdminProtectedRoute>
            <AdminLayout>
              <UserInsights />
            </AdminLayout>
          </AdminProtectedRoute>
        }
      />
      <Route
        path="users/:userId/insights"
        element={
          <AdminProtectedRoute>
            <AdminLayout>
              <UserInsights />
            </AdminLayout>
          </AdminProtectedRoute>
        }
      />

      <Route
        path="deposits"
        element={
          <AdminProtectedRoute>
            <AdminLayout>
              <Deposit />
            </AdminLayout>
          </AdminProtectedRoute>
        }
      />

      <Route
        path="withdrawals"
        element={
          <AdminProtectedRoute>
            <AdminLayout>
              <Withdraw />
            </AdminLayout>
          </AdminProtectedRoute>
        }
      />

      <Route
        path="payment-method"
        element={
          <AdminProtectedRoute>
            <AdminLayout>
              <PaymentMethod />
            </AdminLayout>
          </AdminProtectedRoute>
        }
      />

      <Route
        path="subadmins"
        element={
          <AdminProtectedRoute>
            <AdminLayout>
              <SubAdmins />
            </AdminLayout>
          </AdminProtectedRoute>
        }
      />

      <Route
        path="bet-history"
        element={
          <AdminProtectedRoute>
            <AdminLayout>
              <BetHistory />
            </AdminLayout>
          </AdminProtectedRoute>
        }
      />

      <Route
        path="chips/dashboard"
        element={
          <AdminProtectedRoute>
            <AdminLayout>
              <ChipDashboard />
            </AdminLayout>
          </AdminProtectedRoute>
        }
      />

      <Route
        path="chips/transfer"
        element={
          <AdminProtectedRoute>
            <AdminLayout>
              <ChipTransfer />
            </AdminLayout>
          </AdminProtectedRoute>
        }
      />
      <Route
        path="chips/transactions"
        element={
          <AdminProtectedRoute>
            <AdminLayout>
              <ChipTransactions />
            </AdminLayout>
          </AdminProtectedRoute>
        }
      />

      <Route
        path="superadmins"
        element={
          <AdminProtectedRoute>
            <AdminLayout>
              <SuperAdmins />
            </AdminLayout>
          </AdminProtectedRoute>
        }
      />

      <Route
        path="settings"
        element={
          <AdminProtectedRoute>
            <AdminLayout>
              <Settings />
            </AdminLayout>
          </AdminProtectedRoute>
        }
      />
      <Route
        path="casino-bet-history"
        element={
          <AdminProtectedRoute>
            <AdminLayout>
              <CasinoBetHistory />
            </AdminLayout>
          </AdminProtectedRoute>
        }
      />

      <Route
        path="account-statement"
        element={
          <AdminProtectedRoute>
            <AdminLayout>
              <AccountStatement />
            </AdminLayout>
          </AdminProtectedRoute>
        }
      />
      </Routes>
    </AdminThemeProvider>
  );
};

export default AdminRoutes;
