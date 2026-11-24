import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import ShivaOddsTable from "../components/home/ShivaOddsTable";
import ShivaLiveGamesStrip from "../components/home/ShivaLiveGamesStrip";
import ShivaNewLaunch from "../components/home/ShivaNewLaunch";
import ShivaFavourites from "../components/home/ShivaFavourites";
import ShivaProviders from "../components/home/ShivaProviders";
import GamePlayModal from "../components/modals/GamePlayModal";
import FloatingWhatsApp from "../components/common/FloatingWhatsApp";
import BetSlip from "../components/sports/BetSlip";

export default function Sports({
  onSelectOdds,
  activeSelection,
  onCloseSlip,
  onBetPlaced,
  onOpenAuth,
  onOpenDeposit,
}) {
  const { sport } = useParams();
  const [searchParams] = useSearchParams();
  const tourn = searchParams.get("tourn");
  const navigate = useNavigate();

  // Active Sport tab (e.g. "CRICKET", "FOOTBALL", "TENNIS")
  const [currentSport, setCurrentSport] = useState(() => {
    return sport ? sport.toUpperCase() : "CRICKET";
  });

  const [activeGameModal, setActiveGameModal] = useState(null);

  // Sync if URL param changes
  useEffect(() => {
    if (sport) {
      setCurrentSport(sport.toUpperCase());
    }
  }, [sport]);

  const handleFilterChange = useCallback((tab) => {
    setCurrentSport(tab);
    if (tab === "INPLAY") {
      navigate("/");
    } else {
      navigate(`/sports/${tab.toLowerCase()}`);
    }
  }, [navigate]);

  const handleGameLaunch = useCallback((game) => {
    setActiveGameModal(game);
  }, []);

  return (
    <div className="shiva-sports-container">
      {/* ─── 1. InPlay / Sport Odds Table with Yellow Header (Image 2 Style) ─── */}
      <ShivaOddsTable
        onSelectOdds={onSelectOdds}
        activeSelection={activeSelection}
        activeFilter={tourn || currentSport}
        onSelectFilter={handleFilterChange}
        onCloseSlip={onCloseSlip}
        onBetPlaced={onBetPlaced}
        onOpenAuth={onOpenAuth}
      />

      {/* ─── 2. Mini Live Casino Banners Strip ─── */}
      <ShivaLiveGamesStrip onGameClick={handleGameLaunch} />

      {/* ─── 3. NEW LAUNCH Section ─── */}
      <ShivaNewLaunch onGameClick={handleGameLaunch} />

      {/* ─── 4. MY FAVOURITES Section ─── */}
      <ShivaFavourites onGameClick={handleGameLaunch} />

      {/* ─── 5. OUR PROVIDERS Section ─── */}
      <ShivaProviders onProviderClick={(p) => setActiveGameModal({ name: p, provider: p })} />

      {/* ─── 6. Floating 24x7 WhatsApp Support ─── */}
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
        .shiva-sports-container {
          display: flex;
          flex-direction: column;
          gap: 8px;
          width: 100%;
        }
      `}</style>
    </div>
  );
}
