import React, { useState } from "react";
import ShivaLiveGamesStrip from "../components/shiva/ShivaLiveGamesStrip";
import ShivaNewLaunch from "../components/shiva/ShivaNewLaunch";
import ShivaFavourites from "../components/shiva/ShivaFavourites";
import ShivaProviders from "../components/shiva/ShivaProviders";
import GamePlayModal from "../components/shiva/GamePlayModal";
import FloatingWhatsApp from "../components/shiva/FloatingWhatsApp";

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
          padding: 8px 12px 64px;
          max-width: 1400px;
          margin: 0 auto;
        }

        @media (max-width: 768px) {
          .shiva-casino-container {
            padding: 4px 6px 80px;
          }
        }
      `}</style>
    </div>
  );
}
