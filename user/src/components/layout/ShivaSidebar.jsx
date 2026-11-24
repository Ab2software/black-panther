import React, { useState } from "react";
import { ChevronRight, ChevronDown, Plus, Minus, X } from "lucide-react";

export const CRICKET_TOURNAMENTS = [
  "ICC Women's Emerging Nations Trophy",
  "International League T20",
  "International Twenty20 Matches",
  "One Day Matches",
  "Simulated Reality League / Big Bash League SRL",
  "Simulated Reality League / Caribbean Premier League SRL",
  "Simulated Reality League / Pakistan Super League SRL",
  "Simulated Reality League / Premier League SRL",
  "Simulated Reality League / Super Smash SRL",
  "Simulated Reality League / T20 International SRL",
  "Syed Mushtaq Ali Trophy",
  "Test Matches",
  "Indian Premier League (IPL)",
  "ICC Men's T20 World Cup",
];

export const FOOTBALL_TOURNAMENTS = [
  "English Premier League",
  "UEFA Champions League",
  "Spanish La Liga",
  "Italian Serie A",
  "German Bundesliga",
  "French Ligue 1",
  "UEFA Europa League",
  "Indian Super League (ISL)",
  "FIFA World Cup Qualifiers",
  "FA Cup",
  "Copa del Rey",
];

export const TENNIS_TOURNAMENTS = [
  "ATP Masters Series",
  "WTA Tour",
  "Australian Open",
  "Wimbledon",
  "US Open",
  "French Open",
  "ATP Challenger Tour",
  "Davis Cup",
  "ITF Men's World Tour",
];

export const TABLE_TENNIS_TOURNAMENTS = [
  "ITTF World Cup",
  "TT Cup",
  "Setka Cup",
  "Czech Liga Pro",
  "WTT Contender",
  "Russia Liga Pro",
];

export const BADMINTON_TOURNAMENTS = [
  "BWF World Tour Finals",
  "All England Open",
  "Thomas & Uber Cup",
  "India Open Super 750",
  "Indonesia Open",
  "Malaysia Open",
];

export const BASKETBALL_TOURNAMENTS = [
  "NBA",
  "EuroLeague",
  "FIBA World Cup",
  "NCAA Division I",
  "Liga ACB Spain",
  "Basketball Champions League",
];

export const VOLLEYBALL_TOURNAMENTS = [
  "FIVB Nations League",
  "CEV Champions League",
  "Olympic Games Men",
  "Italian SuperLega",
  "FIVB Club World Championship",
];

export const SNOOKER_TOURNAMENTS = [
  "World Snooker Championship",
  "UK Championship",
  "The Masters",
  "European Masters",
  "Champion of Champions",
];

export const ICE_HOCKEY_TOURNAMENTS = [
  "NHL",
  "KHL",
  "IIHF World Championship",
  "Swedish Hockey League (SHL)",
  "Champions Hockey League",
];

export const POLITICS_TOURNAMENTS = [
  "US Presidential Election 2028",
  "UK Next General Election",
  "India Lok Sabha Elections",
  "London Mayoral Election",
];

export const HANDBALL_TOURNAMENTS = [
  "EHF Champions League",
  "World Men's Handball Championship",
  "European Handball Championship",
  "Handball Bundesliga",
];

export const KABADDI_TOURNAMENTS = [
  "Pro Kabaddi League (PKL)",
  "Kabaddi World Cup",
  "National Kabaddi Championship",
  "Asian Games Kabaddi",
];

export const BASEBALL_TOURNAMENTS = [
  "Major League Baseball (MLB)",
  "Nippon Professional Baseball (NPB)",
  "World Baseball Classic",
  "KBO League Korea",
];

export const DARTS_TOURNAMENTS = [
  "PDC World Darts Championship",
  "Premier League Darts",
  "World Matchplay",
  "Grand Slam of Darts",
];

export const FUTSAL_TOURNAMENTS = [
  "FIFA Futsal World Cup",
  "UEFA Futsal Euro",
  "Spanish Primera Division LNFS",
];

export const MMA_TOURNAMENTS = [
  "UFC Championship",
  "ONE Championship",
  "Bellator MMA",
  "PFL (Professional Fighters League)",
];

export const RUGBY_TOURNAMENTS = [
  "Six Nations Championship",
  "Rugby World Cup",
  "The Rugby Championship",
  "European Champions Cup",
];

export const ALL_SPORTS = [
  { id: "cricket", name: "Cricket", icon: "🏏", tournaments: CRICKET_TOURNAMENTS },
  { id: "football", name: "Football", icon: "⚽", tournaments: FOOTBALL_TOURNAMENTS },
  { id: "tennis", name: "Tennis", icon: "🎾", tournaments: TENNIS_TOURNAMENTS },
  { id: "tabletennis", name: "Table Tennis", icon: "🏓", tournaments: TABLE_TENNIS_TOURNAMENTS },
  { id: "badminton", name: "Badminton", icon: "🏸", tournaments: BADMINTON_TOURNAMENTS },
  { id: "basketball", name: "Basketball", icon: "🏀", tournaments: BASKETBALL_TOURNAMENTS },
  { id: "volleyball", name: "Volleyball", icon: "🏐", tournaments: VOLLEYBALL_TOURNAMENTS },
  { id: "snooker", name: "Snooker", icon: "🎱", tournaments: SNOOKER_TOURNAMENTS },
  { id: "icehockey", name: "Ice Hockey", icon: "🏒", tournaments: ICE_HOCKEY_TOURNAMENTS },
  { id: "politics", name: "Politics", icon: "🗳️", tournaments: POLITICS_TOURNAMENTS },
  { id: "handball", name: "Handball", icon: "🤾", tournaments: HANDBALL_TOURNAMENTS },
  { id: "kabaddi", name: "Kabaddi", icon: "🤼", tournaments: KABADDI_TOURNAMENTS },
  { id: "baseball", name: "Baseball", icon: "⚾", tournaments: BASEBALL_TOURNAMENTS },
  { id: "darts", name: "Darts", icon: "🎯", tournaments: DARTS_TOURNAMENTS },
  { id: "futsal", name: "Futsal", icon: "⚽", tournaments: FUTSAL_TOURNAMENTS },
  { id: "mma", name: "Mixed Martial Arts", icon: "🥋", tournaments: MMA_TOURNAMENTS },
  { id: "rugby", name: "Rugby Union", icon: "🏉", tournaments: RUGBY_TOURNAMENTS },
];

export const OTHERS_ITEMS = [
  { id: "horseracing", name: "Horse Racing", icon: "🏇", path: "/sports/horse racing", badge: "Live" },
  { id: "greyhound", name: "Greyhound Racing", icon: "🐕", path: "/sports/greyhound racing", badge: "Live" },
  { id: "sportsbook", name: "Sportsbook", icon: "🏆", path: "/sports" },
  { id: "casino", name: "Casino", icon: "🎰", path: "/casino" },
  { id: "livecasino", name: "Live Casino", icon: "🏛️", path: "/casino" },
  { id: "aviator", name: "Aviator", icon: "✈️", path: "/casino", badge: "Hot" },
  { id: "slots", name: "Slot Games", icon: "🎲", path: "/casino" },
  { id: "roulette", name: "Roulette", icon: "🎡", path: "/casino" },
  { id: "crash", name: "Crash Games", icon: "💥", path: "/casino" },
];

export default function ShivaSidebar({
  activeSport = "Cricket",
  onSelectSport,
  drawerOpen = false,
  onCloseDrawer,
}) {
  // Track expanded state for all sports dynamically
  const [expandedSports, setExpandedSports] = useState({
    cricket: true, // Cricket starts expanded by default (matches Image 5)
  });

  const [othersOpen, setOthersOpen] = useState(false);
  const [allSportsOpen, setAllSportsOpen] = useState(true);
  const [selectedTournament, setSelectedTournament] = useState(null);

  // Toggle single sport accordion (+ / -)
  const toggleSportAccordion = (sportId, e) => {
    if (e) e.stopPropagation();
    setExpandedSports((prev) => ({
      ...prev,
      [sportId]: !prev[sportId],
    }));
  };

  // Click on main sport row
  const handleSportClick = (sport) => {
    // Also toggle its accordion
    setExpandedSports((prev) => ({
      ...prev,
      [sport.id]: !prev[sport.id],
    }));
    setSelectedTournament(null);
    if (onSelectSport) onSelectSport(sport.name);
    if (onCloseDrawer) onCloseDrawer();
  };

  // Click on a child tournament
  const handleTournamentClick = (tourn, sport, e) => {
    e.stopPropagation();
    setSelectedTournament(tourn);
    if (onSelectSport) onSelectSport(tourn, sport.name);
    if (onCloseDrawer) onCloseDrawer();
  };

  // Click on an item in "Others"
  const handleOtherClick = (item) => {
    setSelectedTournament(null);
    if (onSelectSport) onSelectSport(item.name);
    if (onCloseDrawer) onCloseDrawer();
  };

  return (
    <>
      {/* Mobile Drawer Overlay */}
      {drawerOpen && (
        <div className="shiva-drawer-overlay" onClick={onCloseDrawer} />
      )}

      <aside className={`shiva-sidebar-card ${drawerOpen ? "drawer-open" : ""}`}>
        {/* Mobile Header Close */}
        <div className="shiva-mob-bar">
          <span>Sports Navigation</span>
          <button type="button" onClick={onCloseDrawer}>✕</button>
        </div>

        {/* ─── Header 1: Others > (Brown, matches Image 1) ─── */}
        <div
          className="shiva-side-header brown top"
          onClick={() => setOthersOpen((prev) => !prev)}
        >
          <span>Others</span>
          {othersOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </div>

        {/* Expandable Others Menu */}
        {othersOpen && (
          <div className="shiva-others-menu">
            {OTHERS_ITEMS.map((item) => (
              <div
                key={item.id}
                className="shiva-other-item"
                onClick={() => handleOtherClick(item)}
              >
                <span className="shiva-sport-icon">{item.icon}</span>
                <span className="shiva-other-name">{item.name}</span>
                {item.badge && (
                  <span className={`shiva-other-badge ${item.badge.toLowerCase()}`}>
                    {item.badge}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ─── Header 2: All Sports ▾ (Brown, matches Image 1) ─── */}
        <div
          className="shiva-side-header brown"
          onClick={() => setAllSportsOpen((prev) => !prev)}
        >
          <span>All Sports</span>
          {allSportsOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </div>

        {/* ─── Dynamic Sports List with Child Menus ─── */}
        {allSportsOpen && (
          <div className="shiva-sports-list">
            {ALL_SPORTS.map((s) => {
              const isExpanded = !!expandedSports[s.id];
              const isSelected =
                activeSport &&
                activeSport.toLowerCase() === s.name.toLowerCase() &&
                !selectedTournament;

              return (
                <div key={s.id} className="shiva-sport-group">
                  {/* Parent Sport Row */}
                  <div
                    className={`shiva-sport-item ${isSelected ? "selected" : ""}`}
                    onClick={() => handleSportClick(s)}
                    title={s.name}
                  >
                    {/* Toggle +/- square box */}
                    <button
                      type="button"
                      className="shiva-plus-icon"
                      onClick={(e) => toggleSportAccordion(s.id, e)}
                      title={isExpanded ? "Collapse" : "Expand"}
                    >
                      {isExpanded ? <Minus size={10} /> : <Plus size={10} />}
                    </button>

                    {/* Sport Icon */}
                    <span className="shiva-sport-icon" aria-hidden="true">
                      {s.icon}
                    </span>

                    {/* Sport Name */}
                    <span className="shiva-sport-name">{s.name}</span>
                  </div>

                  {/* Dynamic Child Tournaments Accordion */}
                  {isExpanded && s.tournaments && s.tournaments.length > 0 && (
                    <div className="shiva-sub-tournaments">
                      {s.tournaments.map((t) => {
                        const isTournSelected = selectedTournament === t;
                        return (
                          <div
                            key={t}
                            className={`shiva-tourn-item ${isTournSelected ? "selected" : ""}`}
                            onClick={(e) => handleTournamentClick(t, s, e)}
                            title={t}
                          >
                            <span className="shiva-tourn-plus-icon">
                              <Plus size={8} />
                            </span>
                            <span className="shiva-tourn-name">{t}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </aside>

      <style>{`
        .shiva-sidebar-card {
          width: 220px;
          flex-shrink: 0;
          background: #ffffff;
          border: 1px solid #cbd5e1;
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
          overflow: hidden;
          position: sticky;
          top: 130px;
          z-index: 40;
          max-height: calc(100vh - 140px);
          overflow-y: auto;
        }

        .shiva-sidebar-card::-webkit-scrollbar {
          width: 4px;
        }
        .shiva-sidebar-card::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 4px;
        }

        .shiva-mob-bar {
          display: none;
        }

        .shiva-side-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 12px;
          font-size: 13px;
          font-weight: 800;
          color: #ffffff;
          cursor: pointer;
          user-select: none;
        }

        .shiva-side-header.brown {
          background: #8c4e09;
          border-bottom: 1px solid #733f06;
        }

        .shiva-side-header.top {
          border-bottom: 1px solid #a15c10;
        }

        /* Others Menu */
        .shiva-others-menu {
          background: #fffdf5;
          border-bottom: 2px solid #8c4e09;
          display: flex;
          flex-direction: column;
        }

        .shiva-other-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 12px;
          font-size: 12px;
          font-weight: 700;
          color: #334155;
          cursor: pointer;
          border-bottom: 1px solid #f1f5f9;
          transition: background 0.12s ease;
        }

        .shiva-other-item:hover {
          background: #fef3c7;
          color: #8c4e09;
        }

        .shiva-other-name {
          flex: 1;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .shiva-other-badge {
          font-size: 9px;
          padding: 1px 5px;
          border-radius: 3px;
          font-weight: 800;
          text-transform: uppercase;
        }

        .shiva-other-badge.live {
          background: #ef4444;
          color: #ffffff;
        }

        .shiva-other-badge.hot {
          background: #f59e0b;
          color: #ffffff;
        }

        /* Sports List */
        .shiva-sports-list {
          display: flex;
          flex-direction: column;
          background: #f8fafc;
        }

        .shiva-sport-group {
          border-bottom: 1px solid #e2e8f0;
        }

        .shiva-sport-item {
          display: flex;
          align-items: center;
          gap: 7px;
          padding: 6px 9px;
          font-size: 12px;
          font-weight: 700;
          color: #1e293b;
          cursor: pointer;
          background: #ffffff;
          transition: background 0.12s ease, color 0.12s ease;
          user-select: none;
        }

        .shiva-sport-item:hover {
          background: #f1f5f9;
          color: #8c4e09;
        }

        .shiva-sport-item.selected {
          background: #fef08a;
          color: #713f12;
          font-weight: 800;
        }

        .shiva-plus-icon {
          width: 14px;
          height: 14px;
          border: 1px solid #94a3b8;
          border-radius: 2px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          color: #334155;
          flex-shrink: 0;
          background: #f8fafc;
          padding: 0;
          cursor: pointer;
          outline: none;
        }

        .shiva-plus-icon:hover {
          border-color: #8c4e09;
          background: #e2e8f0;
        }

        .shiva-sport-icon {
          font-size: 14px;
          line-height: 1;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .shiva-sport-name {
          flex: 1;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        /* Child Tournaments Accordion (matches Image 5) */
        .shiva-sub-tournaments {
          background: #f8fafc;
          border-top: 1px solid #e2e8f0;
          padding: 3px 0 3px 12px;
        }

        .shiva-tourn-item {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 4px 6px;
          font-size: 11px;
          font-weight: 600;
          color: #334155;
          cursor: pointer;
          transition: all 0.12s ease;
          border-radius: 2px;
        }

        .shiva-tourn-item:hover {
          color: #8c4e09;
          background: #f1f5f9;
        }

        .shiva-tourn-item.selected {
          color: #8c4e09;
          background: #fef08a;
          font-weight: 800;
        }

        .shiva-tourn-plus-icon {
          width: 11px;
          height: 11px;
          border: 1px solid #cbd5e1;
          border-radius: 2px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          color: #64748b;
          background: #ffffff;
          flex-shrink: 0;
        }

        .shiva-tourn-name {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        @media (max-width: 900px) {
          .shiva-sidebar-card {
            position: fixed;
            top: 0;
            left: 0;
            bottom: 0;
            height: 100vh;
            max-height: 100vh;
            width: 270px;
            z-index: 1000;
            transform: translateX(-100%);
            transition: transform 0.25s ease;
            box-shadow: 4px 0 24px rgba(0, 0, 0, 0.4);
            overflow-y: auto;
          }

          .shiva-sidebar-card.drawer-open {
            transform: translateX(0);
          }

          .shiva-mob-bar {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 12px 14px;
            background: #8c4e09;
            color: white;
            font-size: 14px;
            font-weight: 800;
          }

          .shiva-mob-bar button {
            background: none;
            border: none;
            color: white;
            font-size: 16px;
            cursor: pointer;
          }

          .shiva-drawer-overlay {
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.6);
            backdrop-filter: blur(2px);
            z-index: 999;
          }
        }
      `}</style>
    </>
  );
}
