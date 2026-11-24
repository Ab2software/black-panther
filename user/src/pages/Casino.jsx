import React, { useState } from "react";
import ShivaLiveGamesStrip from "../components/home/ShivaLiveGamesStrip";
import ShivaNewLaunch from "../components/home/ShivaNewLaunch";
import ShivaFavourites from "../components/home/ShivaFavourites";
import ShivaProviders from "../components/home/ShivaProviders";
import GamePlayModal from "../components/modals/GamePlayModal";
import FloatingWhatsApp from "../components/common/FloatingWhatsApp";

export default function Casino({ onOpenAuth, onOpenDeposit }) {
  const [activeGameModal, setActiveGameModal] = useState(null);

  const handleGameLaunch = (game) => {
    setActiveGameModal(game);
  };

  return (
    <div className="shiva-casino-container">
      {/* 1. Mini Live Casino Banners Strip */}
      <ShivaLiveGamesStrip onGameClick={handleGameLaunch} />

      {/* 2. MY FAVOURITES (Dense 7-Column Cards) */}
      <ShivaFavourites onGameClick={handleGameLaunch} />

      {/* 3. NEW LAUNCH (4-Column Cards) */}
      <ShivaNewLaunch onGameClick={handleGameLaunch} />

      {/* 4. OUR PROVIDERS */}
      <ShivaProviders onProviderClick={(p) => setActiveGameModal({ name: p, provider: p })} />

      {/* 5. Floating 24x7 WhatsApp Support */}
      <FloatingWhatsApp phone="919876543210" />

      {/* 6. Interactive Game Play Modal */}
      {activeGameModal && (
        <GamePlayModal
          game={activeGameModal}
          onClose={() => setActiveGameModal(null)}
          onOpenDeposit={onOpenDeposit}
        />
      )}

      <style>{`
        .shiva-casino-container {
          display: flex;
          flex-direction: column;
          gap: 8px;
          width: 100%;
        }
      `}</style>
    </div>
  );
}
