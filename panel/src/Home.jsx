import React, { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import ShivaSidebar from "./components/shiva/ShivaSidebar";
import ShivaOddsTable from "./components/shiva/ShivaOddsTable";
import ShivaLiveGamesStrip from "./components/shiva/ShivaLiveGamesStrip";
import ShivaNewLaunch from "./components/shiva/ShivaNewLaunch";
import ShivaFavourites from "./components/shiva/ShivaFavourites";
import ShivaProviders from "./components/shiva/ShivaProviders";
import FloatingWhatsApp from "./components/shiva/FloatingWhatsApp";
import GamePlayModal from "./components/shiva/GamePlayModal";
import BetSlip from "./components/sports/BetSlip";
import AuthModal from "./components/modals/AuthModal";
import DepositModal from "./components/modals/DepositModal";
import WithdrawModal from "./components/modals/WithdrawModal";
import AccountModal from "./components/modals/AccountModal";
import { useAuth } from "./context/AuthContext";

export default function Home({
  menuDrawerOpen = false,
  onCloseMenuDrawer,
}) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeCategory, setActiveCategory] = useState("Cricket");
  const [activeSelection, setActiveSelection] = useState(null);
  const [activeGameModal, setActiveGameModal] = useState(null);

  // Modals
  const [authModal, setAuthModal] = useState({ open: false, initialTab: "login" });
  const [depositOpen, setDepositOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);

  const handleSelectOdds = useCallback((selection) => {
    setActiveSelection(selection);
  }, []);

  const handleCloseSlip = useCallback(() => {
    setActiveSelection(null);
  }, []);

  const handleGameLaunch = useCallback((game) => {
    setActiveGameModal(game);
  }, []);

  return (
    <div className="shiva-main-wrapper">
      <div className="shiva-main-inner">
        {/* Left Sidebar (Others, All Sports with expandable Accordion - matches Image 1 & 5) */}
        <ShivaSidebar
          drawerOpen={menuDrawerOpen}
          onCloseDrawer={onCloseMenuDrawer}
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
          {/* 1. Yellow Header InPlay Odds Table (matches Image 1) */}
          <ShivaOddsTable
            onSelectOdds={handleSelectOdds}
            activeSelection={activeSelection}
            activeFilter={activeCategory}
            onSelectFilter={(tab) => setActiveCategory(tab)}
            onCloseSlip={handleCloseSlip}
            onBetPlaced={() => setActiveSelection(null)}
            onOpenAuth={(tab) => setAuthModal({ open: true, initialTab: tab })}
          />

          {/* 2. Mini Live Casino Banners Strip (bottom of Image 1) */}
          <ShivaLiveGamesStrip onGameClick={handleGameLaunch} />

          {/* 3. NEW LAUNCH Section (matches Image 2) */}
          <ShivaNewLaunch onGameClick={handleGameLaunch} />

          {/* 4. MY FAVOURITES Section (matches Image 3) */}
          <ShivaFavourites onGameClick={handleGameLaunch} />

          {/* 5. OUR PROVIDERS Section (matches Image 4) */}
          <ShivaProviders onProviderClick={(p) => setActiveGameModal({ name: p, provider: p })} />
        </main>
      </div>

      {/* 6. Floating 24x7 WhatsApp Support (matches all screenshots) */}
      <FloatingWhatsApp phone="919876543210" />

      {/* 7. Interactive Game Play Modal */}
      {activeGameModal && (
        <GamePlayModal
          game={activeGameModal}
          onClose={() => setActiveGameModal(null)}
          onOpenDeposit={() => setDepositOpen(true)}
        />
      )}

      {/* 8. Interactive BetSlip (Floating on Desktop, hidden on mobile since inline is active) */}
      {activeSelection && (
        <div className="shiva-floating-betslip-container desk-only">
          <BetSlip
            selection={activeSelection}
            onClose={handleCloseSlip}
            onBetPlaced={() => setActiveSelection(null)}
            onOpenAuth={(tab) => setAuthModal({ open: true, initialTab: tab })}
          />
        </div>
      )}

      {/* 9. Global Modals */}
      {authModal.open && (
        <AuthModal
          initialTab={authModal.initialTab}
          onClose={() => setAuthModal({ open: false, initialTab: "login" })}
        />
      )}
      {depositOpen && <DepositModal onClose={() => setDepositOpen(false)} />}
      {withdrawOpen && <WithdrawModal onClose={() => setWithdrawOpen(false)} />}
      {accountOpen && <AccountModal onClose={() => setAccountOpen(false)} />}

      <style>{`
        .shiva-main-wrapper {
          min-height: calc(100vh - 100px);
          background: #eaedf0;
          padding: 8px 12px 32px;
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
