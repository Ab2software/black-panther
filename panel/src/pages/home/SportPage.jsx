import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import ShivaSidebar from "../../components/shiva/ShivaSidebar";
import ShivaOddsTable from "../../components/shiva/ShivaOddsTable";
import ShivaLiveGamesStrip from "../../components/shiva/ShivaLiveGamesStrip";
import ShivaNewLaunch from "../../components/shiva/ShivaNewLaunch";
import ShivaFavourites from "../../components/shiva/ShivaFavourites";
import ShivaProviders from "../../components/shiva/ShivaProviders";
import FloatingWhatsApp from "../../components/shiva/FloatingWhatsApp";
import GamePlayModal from "../../components/shiva/GamePlayModal";
import BetSlip from "../../components/sports/BetSlip";

const SportPage = () => {
  const { sport } = useParams(); // "cricket" | "football" | "tennis"
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tourn = searchParams.get("tourn");

  const [activeCategory, setActiveCategory] = useState(() => {
    return sport ? sport.toUpperCase() : "CRICKET";
  });
  const [activeSelection, setActiveSelection] = useState(null);
  const [activeGameModal, setActiveGameModal] = useState(null);
  const [menuDrawerOpen, setMenuDrawerOpen] = useState(false);

  useEffect(() => {
    if (sport) {
      setActiveCategory(sport.toUpperCase());
    }
  }, [sport]);

  const handleSelectOdds = useCallback((selection) => {
    setActiveSelection(selection);
  }, []);

  const handleCloseSlip = useCallback(() => {
    setActiveSelection(null);
  }, []);

  const handleGameLaunch = useCallback((game) => {
    setActiveGameModal(game);
  }, []);

  const handleFilterChange = useCallback(
    (tab) => {
      setActiveCategory(tab);
      if (tab === "INPLAY") {
        navigate("/");
      } else {
        navigate(`/sports/${tab.toLowerCase()}`);
      }
    },
    [navigate],
  );

  return (
    <div className="shiva-main-wrapper">
      <div className="shiva-main-inner">
        {/* Left Sidebar */}
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
          {/* 1. Yellow Header Odds Table (Image 2 Style) */}
          <ShivaOddsTable
            onSelectOdds={handleSelectOdds}
            activeSelection={activeSelection}
            activeFilter={tourn || activeCategory}
            onSelectFilter={handleFilterChange}
          />

          {/* 2. Mini Live Casino Banners Strip */}
          <ShivaLiveGamesStrip onGameClick={handleGameLaunch} />

          {/* 3. NEW LAUNCH Section */}
          <ShivaNewLaunch onGameClick={handleGameLaunch} />

          {/* 4. MY FAVOURITES Section */}
          <ShivaFavourites onGameClick={handleGameLaunch} />

          {/* 5. OUR PROVIDERS Section */}
          <ShivaProviders onProviderClick={(p) => setActiveGameModal({ name: p, provider: p })} />
        </main>
      </div>

      {/* 6. Floating 24x7 WhatsApp Support */}
      <FloatingWhatsApp phone="919876543210" />

      {/* 7. Interactive Game Play Modal */}
      {activeGameModal && (
        <GamePlayModal
          game={activeGameModal}
          onClose={() => setActiveGameModal(null)}
        />
      )}

      {/* 8. Interactive BetSlip */}
      <BetSlip
        selection={activeSelection}
        onClose={handleCloseSlip}
        onBetPlaced={() => setActiveSelection(null)}
      />

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

        @media (max-width: 900px) {
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
};

export default SportPage;
