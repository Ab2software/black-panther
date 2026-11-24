import React, { useState, Suspense, lazy } from "react";
import { Routes, Route, useLocation } from "react-router-dom";

import ShivaHeader from "./components/shiva/ShivaHeader";
import BottomNav from "./components/BottomNav";
import Home from "./Home"; // keep eager — it's the landing page
import ToastProvider from "./components/commom/ToastProvider";

import { AuthProvider } from "./context/AuthContext";
import { AdminAuthProvider } from "./admin/context/AdminAuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import SidebarLayout from "./components/Sidebar";

import AuthModal from "./components/modals/AuthModal";
import DepositModal from "./components/modals/DepositModal";
import WithdrawModal from "./components/modals/WithdrawModal";
import AccountModal from "./components/modals/AccountModal";

// Lazy-loaded route components
const MatchDetails = lazy(() => import("./pages/home/MatchDetails"));
const MyBets = lazy(() => import("./pages/bets/MyBets"));
const SportPage = lazy(() => import("./pages/home/SportPage"));
const ProfitLoss = lazy(() => import("./pages/users/ProfitLoss"));
const Dashboard = lazy(() => import("./pages/users/Dashboard"));
const Settings = lazy(() => import("./pages/users/Settings"));
const GameFrame = lazy(() => import("./pages/games/GameFrame"));
const DepositPage = lazy(() => import("./pages/wallet/Deposit"));
const WithdrawPage = lazy(() => import("./pages/wallet/Withdraw"));
const CheckBonus = lazy(() => import("./pages/wallet/CheckBonus"));
const AccountStatement = lazy(() => import("./pages/users/AccountStatement"));
const BetsHistory = lazy(() => import("./pages/users/BetsHistory"));
const GamesPage = lazy(() => import("./pages/home/Gamespage"));
const Auto = lazy(() => import("./pages/Auto"));
const AdminRoutes = lazy(() => import("./AdminRoutes"));
const ChangePassword = lazy(() => import("./pages/users/ChangePassword"));
const AccountPage = lazy(() => import("./pages/users/Account"));
const Casino = lazy(() => import("./pages/Casino"));

const gameRoutes = [
  { path: "/games/casino", category: "Casino" },
  { path: "/games/casino-live", category: "CasinoLive" },
  { path: "/games/roulette", category: "Roulette" },
  { path: "/games/ae-sexy", category: "AE Sexy" },
  { path: "/games/slots", category: "Slot Games" },
  { path: "/games/aviator", category: "Aviator" },
  { path: "/games/mini-games", category: "Mini Games" },
  { path: "/games/live", category: "Live" },
  { path: "/games/virtual", category: "Virtual" },
  { path: "/games/crash", category: "Crash Games" },
  { path: "/games/casual", category: "Casual Games" },
  { path: "/games/color-game", category: "Color Game" },
  { path: "/games/poker", category: "Poker" },
  { path: "/games/game-shows", category: "Game Shows" },
  { path: "/games/live-game-shows", category: "Live Game Shows" },
  { path: "/games/popular", category: "Popular" },
  { path: "/games/sportsbook", category: "Sportsbook" },
];

// Simple full-page loader shown while a lazy chunk downloads
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <div className="animate-spin h-8 w-8 border-4 border-gray-300 border-t-gray-800 rounded-full" />
  </div>
);

const App = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [gameMenuOpen, setGameMenuOpen] = useState(false);
  const [authModal, setAuthModal] = useState({ open: false, initialTab: "login" });
  const [depositOpen, setDepositOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);

  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith("/admin");

  return (
    <AuthProvider>
      <AdminAuthProvider>
        <ToastProvider>
          <div className="min-h-screen bg-[#eaedf0]">
            {!isAdminRoute && (
              <ShivaHeader
                onMenuToggle={() => setSidebarOpen((prev) => !prev)}
                onOpenAuth={(tab = "login") => setAuthModal({ open: true, initialTab: tab })}
                onOpenDeposit={() => setDepositOpen(true)}
                onOpenWithdraw={() => setWithdrawOpen(true)}
                onOpenAccount={() => setAccountOpen(true)}
              />
            )}

            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route
                  path="/"
                  element={
                    <Home
                      menuDrawerOpen={sidebarOpen}
                      onCloseMenuDrawer={() => setSidebarOpen(false)}
                    />
                  }
                />
                <Route path="/match/:id" element={<MatchDetails />} />

                <Route
                  path="/my-bets"
                  element={
                    <ProtectedRoute>
                      <MyBets />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/profit-loss"
                  element={
                    <ProtectedRoute>
                      <ProfitLoss />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/settings"
                  element={
                    <ProtectedRoute>
                      <Settings />
                    </ProtectedRoute>
                  }
                />
                <Route path="/game" element={<GameFrame />} />
                <Route
                  path="/deposit"
                  element={
                    <ProtectedRoute>
                      <DepositPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/withdraw"
                  element={
                    <ProtectedRoute>
                      <WithdrawPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/check-bonus"
                  element={
                    <ProtectedRoute>
                      <SidebarLayout
                        externalOpen={gameMenuOpen}
                        onExternalClose={() => setGameMenuOpen(false)}
                      >
                        <CheckBonus />
                      </SidebarLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/account-statement"
                  element={
                    <ProtectedRoute>
                      <SidebarLayout
                        externalOpen={gameMenuOpen}
                        onExternalClose={() => setGameMenuOpen(false)}
                      >
                        <AccountStatement />
                      </SidebarLayout>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/change-password"
                  element={
                    <ProtectedRoute>
                      <ChangePassword />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/bets-history"
                  element={
                    <ProtectedRoute>
                      <SidebarLayout
                        externalOpen={gameMenuOpen}
                        onExternalClose={() => setGameMenuOpen(false)}
                      >
                        <BetsHistory />
                      </SidebarLayout>
                    </ProtectedRoute>
                  }
                />

                {gameRoutes.map(({ path, category }) => (
                  <Route
                    key={path}
                    path={path}
                    element={
                      <SidebarLayout
                        externalOpen={gameMenuOpen}
                        onExternalClose={() => setGameMenuOpen(false)}
                      >
                        <GamesPage category={category} />
                      </SidebarLayout>
                    }
                  />
                ))}
                <Route path="/auto" element={<Auto />} />
                <Route path="/sports/:sport" element={<SportPage />} />
                <Route
                  path="/casino"
                  element={
                    <Casino
                      onOpenAuth={(tab) => setAuthModal({ open: true, initialTab: tab || "login" })}
                      onOpenDeposit={() => setDepositOpen(true)}
                    />
                  }
                />
                <Route
                  path="/account"
                  element={
                    <AccountPage
                      onOpenAuth={(tab) => setAuthModal({ open: true, initialTab: tab || "login" })}
                      onOpenDeposit={() => setDepositOpen(true)}
                      onOpenWithdraw={() => setWithdrawOpen(true)}
                    />
                  }
                />
                <Route path="/admin/*" element={<AdminRoutes />} />
              </Routes>
            </Suspense>

            {/* Global Modals for Auth / Wallet / Account */}
            {authModal.open && (
              <AuthModal
                isOpen={true}
                initialTab={authModal.initialTab}
                onClose={() => setAuthModal({ open: false, initialTab: "login" })}
              />
            )}
            {depositOpen && <DepositModal isOpen={true} onClose={() => setDepositOpen(false)} />}
            {withdrawOpen && <WithdrawModal isOpen={true} onClose={() => setWithdrawOpen(false)} />}
            {accountOpen && (
              <AccountModal
                isOpen={true}
                onClose={() => setAccountOpen(false)}
                onOpenDeposit={() => {
                  setAccountOpen(false);
                  setDepositOpen(true);
                }}
                onOpenWithdraw={() => {
                  setAccountOpen(false);
                  setWithdrawOpen(true);
                }}
              />
            )}

            {/* Mobile Bottom Navigation (only visible <= 768px on user pages) */}
            {!isAdminRoute && (
              <BottomNav
                onOpenAuth={(tab) => setAuthModal({ open: true, initialTab: tab || "login" })}
                onOpenAccount={() => setAccountOpen(true)}
              />
            )}
          </div>
        </ToastProvider>
      </AdminAuthProvider>
    </AuthProvider>
  );
};

export default App;
