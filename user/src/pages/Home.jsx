import React, { useState } from "react";
import ShivaOddsTable from "../components/home/ShivaOddsTable";
import ShivaLiveGamesStrip from "../components/home/ShivaLiveGamesStrip";
import ShivaNewLaunch from "../components/home/ShivaNewLaunch";
import ShivaFavourites from "../components/home/ShivaFavourites";
import ShivaProviders from "../components/home/ShivaProviders";
import GamePlayModal from "../components/modals/GamePlayModal";
import FloatingWhatsApp from "../components/common/FloatingWhatsApp";

export default function Home({
  activeSport = "Cricket",
  onSelectOdds,
  activeSelection,
  onCloseSlip,
  onBetPlaced,
  onOpenAuth,
  onOpenDeposit,
}) {
  const [activeGameModal, setActiveGameModal] = useState(null);

  const handleGameLaunch = (game) => {
    setActiveGameModal(game);
  };

  return (
    <div className="shiva-home-container">
      {/* ─── 1. InPlay Matches & Yellow Header Odds Table (matches Image 1) ─── */}
      <ShivaOddsTable
        onSelectOdds={onSelectOdds}
        activeSelection={activeSelection}
        activeFilter={activeSport}
        onCloseSlip={onCloseSlip}
        onBetPlaced={onBetPlaced}
        onOpenAuth={onOpenAuth}
      />

      {/* ─── 2. Mini Live Casino Banners Strip (bottom of Image 1) ─── */}
      <ShivaLiveGamesStrip onGameClick={handleGameLaunch} />

      {/* ─── 3. NEW LAUNCH Section (matches Image 2) ─── */}
      <ShivaNewLaunch onGameClick={handleGameLaunch} />

      {/* ─── 4. MY FAVOURITES Section (matches Image 3) ─── */}
      <ShivaFavourites onGameClick={handleGameLaunch} />

      {/* ─── 5. OUR PROVIDERS Section (matches Image 4) ─── */}
      <ShivaProviders onProviderClick={(p) => setActiveGameModal({ name: p, provider: p })} />

      {/* ─── 6. Floating 24x7 WhatsApp Support (matches all screenshots) ─── */}
      <FloatingWhatsApp phone="919876543210" />

      {/* ─── 7. Interactive Game Play Modal / Arena ─── */}
      {activeGameModal && (
        <GamePlayModal
          game={activeGameModal}
          onClose={() => setActiveGameModal(null)}
          onOpenDeposit={onOpenDeposit}
        />
      )}

      <style>{`
        .shiva-home-container {
          display: flex;
          flex-direction: column;
          gap: 8px;
          width: 100%;
        }
      `}</style>
    </div>
  );
}
