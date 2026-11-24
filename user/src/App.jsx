import React, { useState, useEffect, useCallback } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ShivaHeader from "./components/layout/ShivaHeader";
import ShivaSidebar from "./components/layout/ShivaSidebar";
import Footer from "./components/layout/Footer";
import BottomNav from "./components/layout/BottomNav";
import Home from "./pages/Home";
import Sports from "./pages/Sports";
import MatchDetails from "./pages/MatchDetails";
import Casino from "./pages/Casino";
import MyBets from "./pages/MyBets";
import Account from "./pages/Account";
import AuthModal from "./components/modals/AuthModal";
import DepositModal from "./components/modals/DepositModal";
import WithdrawModal from "./components/modals/WithdrawModal";
import AccountModal from "./components/modals/AccountModal";
import BetSlip from "./components/sports/BetSlip";

function UserApp() {
  const navigate = useNavigate();
  const location = useLocation();
  const isMatchDetailsPage = location.pathname.startsWith("/match/");

  // Mobile drawer toggle
  const [menuDrawerOpen, setMenuDrawerOpen] = useState(false);

  // Active Category & Sport
  const [activeCategory, setActiveCategory] = useState("Cricket");

  // Keep activeCategory synced with route
  useEffect(() => {
    if (location.pathname.startsWith("/sports/")) {
      const s = location.pathname.split("/sports/")[1];
      if (s) {
        setActiveCategory(s.charAt(0).toUpperCase() + s.slice(1));
      }
    } else if (location.pathname === "/sports") {
      setActiveCategory("Cricket");
    } else if (location.pathname === "/casino") {
      setActiveCategory("Casino");
    } else if (location.pathname === "/") {
      setActiveCategory("Home");
    }
  }, [location.pathname]);

  // Global Modals State
  const [authModal, setAuthModal] = useState({ open: false, initialTab: "login" });
  const [depositOpen, setDepositOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);

  // Active Bet Slip Selection
  const [activeSelection, setActiveSelection] = useState(null);

  const handleOpenAuth = useCallback((tab = "login") => {
    setAuthModal({ open: true, initialTab: tab });
  }, []);

  const handleCloseAuth = useCallback(() => {
    setAuthModal({ open: false, initialTab: "login" });
  }, []);

  const handleSelectOdds = useCallback((selection) => {
    setActiveSelection(selection);
  }, []);

  const handleCloseSlip = useCallback(() => {
    setActiveSelection(null);
  }, []);

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#eaedf0" }}>
      {/* ─── 1. Shiva365 Top Header (Brown bar, Emerald Subnav, Racing Ticker) ─── */}
      <ShivaHeader
        onMenuToggle={() => setMenuDrawerOpen((prev) => !prev)}
        onOpenAuth={handleOpenAuth}
        onOpenDeposit={() => setDepositOpen(true)}
        onOpenWithdraw={() => setWithdrawOpen(true)}
        onOpenAccount={() => setAccountOpen(true)}
        activeSubnav={activeCategory}
        onSelectSubnav={(cat) => {
          setActiveCategory(cat);
          const upper = cat.toUpperCase();
          if (upper === "HOME" || upper === "INPLAY") {
            navigate("/");
          } else if (upper === "CASINO") {
            navigate("/casino");
          } else {
            navigate(`/sports/${cat.toLowerCase()}`);
          }
        }}
      />

      {/* ─── 2. Main 2-Column Section (Sidebar + Content) ─── */}
      <div className="shiva-main-wrapper">
        <div className="shiva-main-inner">
          {/* Left Sidebar (Others, All Sports with expandable Accordion) */}
          <ShivaSidebar
            drawerOpen={menuDrawerOpen}
            onCloseDrawer={() => setMenuDrawerOpen(false)}
            activeSport={activeCategory}
            onSelectSport={(item, parentSport) => {
              setActiveCategory(item);
              const upper = (item || "").toUpperCase();
              if (
                upper === "CASINO" ||
                upper === "LIVE CASINO" ||
                upper === "AVIATOR" ||
                upper === "SLOT GAMES" ||
                upper === "ROULETTE" ||
                upper === "CRASH GAMES"
              ) {
                navigate("/casino");
              } else if (upper === "HOME" || upper === "INPLAY") {
                navigate("/");
              } else if (parentSport) {
                navigate(`/sports/${parentSport.toLowerCase()}?tourn=${encodeURIComponent(item)}`);
              } else {
                navigate(`/sports/${item.toLowerCase()}`);
              }
            }}
          />

          {/* Center Main Content Area */}
          <main className="shiva-content-area">
            <Routes>
              <Route
                path="/"
                element={
                  <Home
                    activeSport={activeCategory}
                    onSelectOdds={handleSelectOdds}
                    activeSelection={activeSelection}
                    onCloseSlip={handleCloseSlip}
                    onBetPlaced={handleCloseSlip}
                    onOpenAuth={handleOpenAuth}
                    onOpenDeposit={() => setDepositOpen(true)}
                  />
                }
              />
              <Route
                path="/sports"
                element={
                  <Sports
                    onSelectOdds={handleSelectOdds}
                    activeSelection={activeSelection}
                    onCloseSlip={handleCloseSlip}
                    onBetPlaced={handleCloseSlip}
                    onOpenAuth={handleOpenAuth}
                    onOpenDeposit={() => setDepositOpen(true)}
                  />
                }
              />
              <Route
                path="/sports/:sport"
                element={
                  <Sports
                    onSelectOdds={handleSelectOdds}
                    activeSelection={activeSelection}
                    onCloseSlip={handleCloseSlip}
                    onBetPlaced={handleCloseSlip}
                    onOpenAuth={handleOpenAuth}
                    onOpenDeposit={() => setDepositOpen(true)}
                  />
                }
              />
              <Route
                path="/match/:id"
                element={
                  <MatchDetails
                    onSelectOdds={handleSelectOdds}
                    activeSelection={activeSelection}
                    onCloseSlip={handleCloseSlip}
                    onBetPlaced={handleCloseSlip}
                    onOpenAuth={handleOpenAuth}
                    onOpenDeposit={() => setDepositOpen(true)}
                  />
                }
              />
              <Route
                path="/casino"
                element={
                  <Casino
                    onOpenAuth={handleOpenAuth}
                    onOpenDeposit={() => setDepositOpen(true)}
                  />
                }
              />
              <Route path="/my-bets" element={<MyBets onOpenAuth={handleOpenAuth} />} />
              <Route
                path="/account"
                element={
                  <Account
                    onOpenAuth={handleOpenAuth}
                    onOpenDeposit={() => setDepositOpen(true)}
                    onOpenWithdraw={() => setWithdrawOpen(true)}
                  />
                }
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </div>

      {/* Floating Betslip when an odd is active (disabled on MatchDetails where docked slip is used) */}
      {!isMatchDetailsPage && activeSelection && (
        <div className="shiva-floating-betslip-container">
          <BetSlip
            selection={activeSelection}
            onClose={handleCloseSlip}
            onBetPlaced={handleCloseSlip}
            onOpenAuth={handleOpenAuth}
          />
        </div>
      )}

      {/* Global Modals for Auth / Wallet / Account */}
      {authModal.open && (
        <AuthModal
          isOpen={true}
          initialTab={authModal.initialTab}
          onClose={handleCloseAuth}
        />
      )}
      {depositOpen && (
        <DepositModal
          isOpen={true}
          onClose={() => setDepositOpen(false)}
        />
      )}
      {withdrawOpen && (
        <WithdrawModal
          isOpen={true}
          onClose={() => setWithdrawOpen(false)}
        />
      )}
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

      {/* ─── 4. Mobile Bottom Navigation (only visible on mobile <= 768px) ─── */}
      <BottomNav
        onOpenAuth={handleOpenAuth}
        onOpenAccount={() => setAccountOpen(true)}
      />

      <style>{`
        .shiva-main-wrapper {
          flex: 1;
          width: 100%;
          background: #eaedf0;
          padding: 8px 12px 32px;
          box-sizing: border-box;
        }

        .shiva-main-inner {
          max-width: 1400px;
          margin: 0 auto;
          display: flex;
          gap: 8px;
          align-items: flex-start;
        }

        .shiva-content-area {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .shiva-floating-betslip-container {
          position: fixed;
          bottom: 20px;
          right: 20px;
          z-index: 999;
          width: 360px;
          max-width: calc(100vw - 32px);
          box-shadow: 0 16px 40px rgba(0, 0, 0, 0.6);
        }

        @media (max-width: 900px) {
          .shiva-floating-betslip-container {
            display: none !important;
          }
          .shiva-main-wrapper {
            padding: 4px;
            padding-bottom: 64px;
          }
          .shiva-main-inner {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <UserApp />
      </AuthProvider>
    </Router>
  );
}
