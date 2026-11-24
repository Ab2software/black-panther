import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Radio, Tv, Pin, Gamepad2, ChevronDown } from "lucide-react";
import { ALL_SPORTS } from "./ShivaSidebar";
import BetSlip from "../sports/BetSlip";

export const INPLAY_TABS = [
  "INPLAY",
  "CRICKET",
  "FOOTBALL",
  "TENNIS",
  "FANTASY 11",
  "COCK FIGHT",
  "CASINO",
  "HORSE RACING",
  "GREYHOUND RACING",
  "BINARY",
  "KABADDI",
];

export const SHIVA_MATCHES = [
  // ── Tennis Matches (From Image 1) ──
  {
    id: "match_1",
    sport: "Tennis",
    icon: "🎾",
    name: "S Dhakshineswar v Bouzige",
    isLive: true,
    time: "LIVE / Nov 23 2026 08:40 (IST)",
    hasTv: true,
    hasPin: true,
    b1: 1.67,
    l1: 1.72,
    bx: null,
    lx: null,
    b2: 2.38,
    l2: 2.50,
    team1: "S Dhakshineswar",
    team2: "Bouzige",
  },
  {
    id: "match_2",
    sport: "Tennis",
    icon: "🎾",
    name: "Enz Aguiard v Bla Ellis",
    isLive: true,
    time: "LIVE / Nov 23 2026 08:40 (IST)",
    hasTv: true,
    hasPin: true,
    b1: 15.5,
    l1: 17.0,
    bx: null,
    lx: null,
    b2: 1.06,
    l2: 1.07,
    team1: "Enz Aguiard",
    team2: "Bla Ellis",
  },
  {
    id: "match_3",
    sport: "Tennis",
    icon: "🎾",
    name: "Kasid Samrej v D Sakellaridis",
    isLive: true,
    time: "LIVE / Nov 23 2026 09:10 (IST)",
    hasTv: true,
    hasPin: true,
    b1: 1.27,
    l1: 1.29,
    bx: null,
    lx: null,
    b2: 4.50,
    l2: 4.80,
    team1: "Kasid Samrej",
    team2: "D Sakellaridis",
  },
  {
    id: "match_4",
    sport: "Tennis",
    icon: "🎾",
    name: "M Schoenhaus v Mas Imamura",
    isLive: true,
    time: "LIVE / Nov 23 2026 09:10 (IST)",
    hasTv: true,
    hasPin: true,
    b1: 3.40,
    l1: 3.75,
    bx: null,
    lx: null,
    b2: 1.36,
    l2: 1.41,
    team1: "M Schoenhaus",
    team2: "Mas Imamura",
  },
  {
    id: "match_tennis_5",
    sport: "Tennis",
    icon: "🎾",
    name: "Carlos Alcaraz vs Jannik Sinner",
    isLive: true,
    time: "LIVE / Nov 23 2026 18:00 (IST)",
    hasTv: true,
    hasPin: true,
    b1: 1.91,
    l1: 1.94,
    bx: null,
    lx: null,
    b2: 1.96,
    l2: 2.00,
    team1: "Carlos Alcaraz",
    team2: "Jannik Sinner",
  },
  {
    id: "match_tennis_6",
    sport: "Tennis",
    icon: "🎾",
    name: "Novak Djokovic vs Alexander Zverev",
    isLive: false,
    time: "Nov 23 2026 21:30 (IST)",
    hasTv: true,
    hasPin: true,
    b1: 1.82,
    l1: 1.85,
    bx: null,
    lx: null,
    b2: 2.10,
    l2: 2.15,
    team1: "Novak Djokovic",
    team2: "Alexander Zverev",
  },

  // ── Cricket Matches (From Image 1 & Tournaments) ──
  {
    id: "match_5",
    sport: "Cricket",
    icon: "🏏",
    name: "St Lucia Kings SRL vs Antigua and Barbuda Falcons SRL",
    isLive: false,
    time: "Nov 23 2026 10:30 (IST)",
    hasTv: false,
    hasPin: true,
    b1: null,
    l1: null,
    bx: null,
    lx: null,
    b2: null,
    l2: null,
    team1: "St Lucia Kings SRL",
    team2: "Antigua and Barbuda Falcons SRL",
  },
  {
    id: "match_6",
    sport: "Cricket",
    icon: "🏏",
    name: "Sri Lanka W v Pakistan W",
    isLive: true,
    time: "LIVE / Nov 23 2026 10:30 (IST)",
    hasTv: true,
    hasPin: true,
    b1: 1.65,
    l1: 1.71,
    bx: null,
    lx: null,
    b2: 2.42,
    l2: 2.54,
    team1: "Sri Lanka W",
    team2: "Pakistan W",
  },
  {
    id: "match_7",
    sport: "Cricket",
    icon: "🏏",
    name: "India vs Australia",
    isLive: true,
    time: "LIVE / Nov 23 2026 14:00 (IST)",
    hasTv: true,
    hasPin: true,
    b1: 1.62,
    l1: 1.64,
    bx: null,
    lx: null,
    b2: 2.58,
    l2: 2.62,
    team1: "India",
    team2: "Australia",
  },
  {
    id: "match_8",
    sport: "Cricket",
    icon: "🏏",
    name: "Chennai Super Kings vs Mumbai Indians",
    isLive: true,
    time: "LIVE / Nov 23 2026 19:30 (IST)",
    hasTv: true,
    hasPin: true,
    b1: 1.91,
    l1: 1.93,
    bx: null,
    lx: null,
    b2: 1.95,
    l2: 1.98,
    team1: "Chennai Super Kings",
    team2: "Mumbai Indians",
  },
  {
    id: "match_cric_9",
    sport: "Cricket",
    icon: "🏏",
    name: "England vs South Africa",
    isLive: true,
    time: "LIVE / Nov 23 2026 16:30 (IST)",
    hasTv: true,
    hasPin: true,
    b1: 1.85,
    l1: 1.88,
    bx: null,
    lx: null,
    b2: 2.12,
    l2: 2.16,
    team1: "England",
    team2: "South Africa",
  },
  {
    id: "match_cric_10",
    sport: "Cricket",
    icon: "🏏",
    name: "ICC Women's Emerging Nations: India A W vs Bangladesh A W",
    isLive: true,
    time: "LIVE / Nov 23 2026 11:00 (IST)",
    hasTv: true,
    hasPin: true,
    b1: 1.38,
    l1: 1.40,
    bx: null,
    lx: null,
    b2: 3.20,
    l2: 3.40,
    team1: "India A W",
    team2: "Bangladesh A W",
  },
  {
    id: "match_cric_11",
    sport: "Cricket",
    icon: "🏏",
    name: "International League T20: Dubai Capitals vs MI Emirates",
    isLive: true,
    time: "LIVE / Nov 23 2026 18:30 (IST)",
    hasTv: true,
    hasPin: true,
    b1: 1.74,
    l1: 1.77,
    bx: null,
    lx: null,
    b2: 2.22,
    l2: 2.28,
    team1: "Dubai Capitals",
    team2: "MI Emirates",
  },
  {
    id: "match_cric_12",
    sport: "Cricket",
    icon: "🏏",
    name: "Big Bash League SRL: Sydney Sixers SRL vs Perth Scorchers SRL",
    isLive: true,
    time: "LIVE / Nov 23 2026 13:45 (IST)",
    hasTv: true,
    hasPin: true,
    b1: 1.88,
    l1: 1.91,
    bx: null,
    lx: null,
    b2: 2.04,
    l2: 2.08,
    team1: "Sydney Sixers SRL",
    team2: "Perth Scorchers SRL",
  },
  {
    id: "match_cric_13",
    sport: "Cricket",
    icon: "🏏",
    name: "Syed Mushtaq Ali Trophy: Mumbai vs Karnataka",
    isLive: false,
    time: "Nov 23 2026 16:00 (IST)",
    hasTv: true,
    hasPin: true,
    b1: 1.82,
    l1: 1.85,
    bx: null,
    lx: null,
    b2: 2.10,
    l2: 2.15,
    team1: "Mumbai",
    team2: "Karnataka",
  },

  // ── Football Matches ──
  {
    id: "match_fb_1",
    sport: "Football",
    icon: "⚽",
    name: "Real Madrid vs Barcelona",
    isLive: true,
    time: "LIVE / Nov 23 2026 20:45 (IST)",
    hasTv: true,
    hasPin: true,
    b1: 1.44,
    l1: 1.46,
    bx: 4.80,
    lx: 5.10,
    b2: 7.20,
    l2: 7.60,
    team1: "Real Madrid",
    theDraw: "The Draw",
    team2: "Barcelona",
  },
  {
    id: "match_fb_2",
    sport: "Football",
    icon: "⚽",
    name: "Manchester City vs Arsenal",
    isLive: true,
    time: "LIVE / Nov 23 2026 21:00 (IST)",
    hasTv: true,
    hasPin: true,
    b1: 1.75,
    l1: 1.78,
    bx: 3.90,
    lx: 4.10,
    b2: 4.50,
    l2: 4.70,
    team1: "Manchester City",
    theDraw: "The Draw",
    team2: "Arsenal",
  },
  {
    id: "match_fb_3",
    sport: "Football",
    icon: "⚽",
    name: "Liverpool vs Chelsea",
    isLive: true,
    time: "LIVE / Nov 23 2026 19:00 (IST)",
    hasTv: true,
    hasPin: true,
    b1: 1.92,
    l1: 1.95,
    bx: 3.60,
    lx: 3.75,
    b2: 4.10,
    l2: 4.30,
    team1: "Liverpool",
    theDraw: "The Draw",
    team2: "Chelsea",
  },
  {
    id: "match_fb_4",
    sport: "Football",
    icon: "⚽",
    name: "Bayern Munich vs Borussia Dortmund",
    isLive: false,
    time: "Nov 23 2026 22:30 (IST)",
    hasTv: true,
    hasPin: true,
    b1: 1.52,
    l1: 1.55,
    bx: 4.50,
    lx: 4.75,
    b2: 6.00,
    l2: 6.40,
    team1: "Bayern Munich",
    theDraw: "The Draw",
    team2: "Borussia Dortmund",
  },

  // ── Kabaddi Matches ──
  {
    id: "match_kb_1",
    sport: "Kabaddi",
    icon: "🤼",
    name: "Puneri Paltan vs Jaipur Pink Panthers",
    isLive: true,
    time: "LIVE / Nov 23 2026 20:00 (IST)",
    hasTv: true,
    hasPin: true,
    b1: 1.80,
    l1: 1.83,
    bx: null,
    lx: null,
    b2: 2.15,
    l2: 2.20,
    team1: "Puneri Paltan",
    team2: "Jaipur Pink Panthers",
  },
  {
    id: "match_kb_2",
    sport: "Kabaddi",
    icon: "🤼",
    name: "Bengal Warriors vs Patna Pirates",
    isLive: false,
    time: "Nov 23 2026 21:00 (IST)",
    hasTv: true,
    hasPin: true,
    b1: 1.95,
    l1: 1.98,
    bx: null,
    lx: null,
    b2: 1.95,
    l2: 1.98,
    team1: "Bengal Warriors",
    team2: "Patna Pirates",
  },

  // ── Horse Racing ──
  {
    id: "match_hr_1",
    sport: "Horse Racing",
    icon: "🏇",
    name: "Towcester 23rd Nov: 1. Swift Star, 2. Golden Arrow",
    isLive: true,
    time: "LIVE / Nov 23 2026 14:15 (IST)",
    hasTv: true,
    hasPin: true,
    b1: 2.20,
    l1: 2.30,
    bx: null,
    lx: null,
    b2: 3.40,
    l2: 3.60,
    team1: "Swift Star",
    team2: "Golden Arrow",
  },
  {
    id: "match_hr_2",
    sport: "Horse Racing",
    icon: "🏇",
    name: "Dunstall Park 23rd Nov: 1. Royal Thunder, 2. Desert Wind",
    isLive: false,
    time: "Nov 23 2026 16:45 (IST)",
    hasTv: true,
    hasPin: true,
    b1: 1.85,
    l1: 1.92,
    bx: null,
    lx: null,
    b2: 2.50,
    l2: 2.65,
    team1: "Royal Thunder",
    team2: "Desert Wind",
  },

  // ── Greyhound Racing ──
  {
    id: "match_gr_1",
    sport: "Greyhound Racing",
    icon: "🐕",
    name: "Central Park 23rd Nov: 1. Blue Rocket, 2. Silver Shadow",
    isLive: true,
    time: "LIVE / Nov 23 2026 15:00 (IST)",
    hasTv: true,
    hasPin: true,
    b1: 2.10,
    l1: 2.20,
    bx: null,
    lx: null,
    b2: 2.80,
    l2: 3.00,
    team1: "Blue Rocket",
    team2: "Silver Shadow",
  },
  {
    id: "match_gr_2",
    sport: "Greyhound Racing",
    icon: "🐕",
    name: "Romford 23rd Nov: 1. Black Bullet, 2. Red Runner",
    isLive: false,
    time: "Nov 23 2026 17:30 (IST)",
    hasTv: true,
    hasPin: true,
    b1: 1.90,
    l1: 1.98,
    bx: null,
    lx: null,
    b2: 2.40,
    l2: 2.55,
    team1: "Black Bullet",
    team2: "Red Runner",
  },
];

export default function ShivaOddsTable({
  onSelectOdds,
  activeSelection,
  activeFilter = "INPLAY",
  onSelectFilter,
  onMatchClick,
  onCloseSlip,
  onBetPlaced,
  onOpenAuth,
}) {
  const navigate = useNavigate();
  const [currentTab, setCurrentTab] = useState("INPLAY");
  const [filterMode, setFilterMode] = useState("LIVE");
  const [localTableSelection, setLocalTableSelection] = useState(null);

  useEffect(() => {
    if (activeSelection) {
      setLocalTableSelection(activeSelection);
    }
  }, [activeSelection]);

  const handleMatchRowClick = (match) => {
    if (onMatchClick) {
      onMatchClick(match);
    } else {
      navigate(`/match/${match.id}`, { state: match });
    }
  };

  const [activeTournament, setActiveTournament] = useState(null);

  useEffect(() => {
    if (activeFilter) {
      const formatted = activeFilter.toUpperCase();
      if (INPLAY_TABS.includes(formatted)) {
        setCurrentTab(formatted);
        setActiveTournament(null);
      } else {
        // Check if matches known sport name
        const sportObj = ALL_SPORTS?.find(
          (s) => s.name.toUpperCase() === formatted || s.id.toUpperCase() === formatted
        );
        if (sportObj) {
          const sUpper = sportObj.name.toUpperCase();
          setCurrentTab(INPLAY_TABS.includes(sUpper) ? sUpper : "CRICKET");
          setActiveTournament(null);
        } else {
          // It's a tournament or league
          let matchedSport = "CRICKET";
          if (ALL_SPORTS) {
            for (const s of ALL_SPORTS) {
              if (s.tournaments && s.tournaments.some((t) => t.toLowerCase() === activeFilter.toLowerCase())) {
                const sUpper = s.name.toUpperCase();
                if (INPLAY_TABS.includes(sUpper)) {
                  matchedSport = sUpper;
                }
                break;
              }
            }
          }
          setCurrentTab(matchedSport);
          setActiveTournament(activeFilter);
        }
      }
    }
  }, [activeFilter]);

  const filteredMatches = SHIVA_MATCHES.filter((m) => {
    if (activeTournament) {
      const tLower = activeTournament.toLowerCase();
      const mTourn = (m.tournament || "").toLowerCase();
      const mName = (m.name || "").toLowerCase();
      if (
        mTourn.includes(tLower) ||
        tLower.includes(mTourn) ||
        mName.includes(tLower) ||
        tLower.includes(mName)
      ) {
        if (filterMode === "LIVE") return m.isLive;
        return true;
      }
    }

    if (currentTab === "INPLAY") {
      if (filterMode === "LIVE") return m.isLive;
      return true;
    }
    const sportUpper = (m.sport || "").toUpperCase();
    const matchSport =
      sportUpper === currentTab ||
      (currentTab === "CRICKET" && sportUpper.includes("CRICKET"));
    if (filterMode === "LIVE") {
      return matchSport && m.isLive;
    }
    return matchSport;
  });

  // Dynamic matches so tournament is never empty
  const displayMatches = (() => {
    if (filteredMatches.length > 0) return filteredMatches;
    if (activeTournament) {
      const sportName =
        currentTab === "FOOTBALL"
          ? "Football"
          : currentTab === "TENNIS"
          ? "Tennis"
          : currentTab === "KABADDI"
          ? "Kabaddi"
          : "Cricket";
      const icon =
        currentTab === "FOOTBALL"
          ? "⚽"
          : currentTab === "TENNIS"
          ? "🎾"
          : currentTab === "KABADDI"
          ? "🤼"
          : "🏏";

      return [
        {
          id: `match_${activeTournament.toLowerCase().replace(/[^a-z0-9]/g, "_")}_1`,
          sport: sportName,
          icon,
          tournament: activeTournament,
          name: `${activeTournament}: Team A vs Team B`,
          isLive: true,
          time: "LIVE / Today 18:30 (IST)",
          hasTv: true,
          hasPin: true,
          b1: 1.85,
          l1: 1.88,
          bx: currentTab === "FOOTBALL" ? 3.40 : null,
          lx: currentTab === "FOOTBALL" ? 3.50 : null,
          b2: 2.10,
          l2: 2.15,
          team1: "Team A",
          theDraw: currentTab === "FOOTBALL" ? "The Draw" : null,
          team2: "Team B",
        },
        {
          id: `match_${activeTournament.toLowerCase().replace(/[^a-z0-9]/g, "_")}_2`,
          sport: sportName,
          icon,
          tournament: activeTournament,
          name: `${activeTournament}: Club United vs Warriors`,
          isLive: false,
          time: "Today 21:00 (IST)",
          hasTv: true,
          hasPin: true,
          b1: 1.62,
          l1: 1.68,
          bx: currentTab === "FOOTBALL" ? 3.90 : null,
          lx: currentTab === "FOOTBALL" ? 4.10 : null,
          b2: 2.45,
          l2: 2.55,
          team1: "Club United",
          theDraw: currentTab === "FOOTBALL" ? "The Draw" : null,
          team2: "Warriors",
        },
      ];
    }
    return SHIVA_MATCHES.filter((m) => {
      if (currentTab === "INPLAY") return true;
      return (m.sport || "").toUpperCase() === currentTab;
    });
  })();

  const handleOddsClick = (match, team, type, price) => {
    if (!price || price === "-") return;
    const sel = {
      matchId: match.id,
      matchName: match.name,
      team,
      selectionName: team,
      type,
      side: type,
      price,
      odds: price,
    };
    setLocalTableSelection(sel);
    if (onSelectOdds) {
      onSelectOdds(sel);
    }
  };

  return (
    <div className="shiva-odds-wrapper">
      {/* ─── 1. Inplay / Sports Sub-Tabs Bar (matches Image 1) ─── */}
      <div className="shiva-inplay-nav">
        <div className="shiva-inplay-tabs">
          {INPLAY_TABS.map((tab) => {
            const isActive = currentTab === tab;
            return (
              <button
                key={tab}
                type="button"
                className={`shiva-ipt-btn ${isActive ? "active" : ""}`}
                onClick={() => {
                  setCurrentTab(tab);
                  if (onSelectFilter) onSelectFilter(tab);
                }}
              >
                {tab}
              </button>
            );
          })}
        </div>

        {/* Right Filter Pills: LIVE / VIRTUAL / PREMIUM / TIME */}
        <div className="shiva-inplay-actions">
          <button
            type="button"
            className={`shiva-act-pill ${filterMode === "LIVE" ? "active" : ""}`}
            onClick={() => setFilterMode("LIVE")}
          >
            • LIVE
          </button>
          <button
            type="button"
            className={`shiva-act-pill ${filterMode === "VIRTUAL" ? "active" : ""}`}
            onClick={() => setFilterMode("VIRTUAL")}
          >
            • VIRTUAL
          </button>
          <button
            type="button"
            className={`shiva-act-pill ${filterMode === "PREMIUM" ? "active" : ""}`}
            onClick={() => setFilterMode("PREMIUM")}
          >
            • PREMIUM
          </button>
          <div className="shiva-view-by">
            <span>View by:</span>
            <button type="button" className="shiva-time-select">
              TIME <ChevronDown size={11} />
            </button>
          </div>
        </div>
      </div>

      {/* ─── 2. Yellow Header InPlay Odds Table (matches Image 1) ─── */}
      {activeTournament && (
        <div className="shiva-active-tourn-banner">
          <span>🏆 Tournament Filter: <strong>{activeTournament}</strong></span>
          <button type="button" onClick={() => setActiveTournament(null)}>✕ Show All {currentTab}</button>
        </div>
      )}
      <div className="shiva-table-card">
        {/* Table Column Headers (Bright Yellow #facc15) */}
        <div className="shiva-th-row">
          <div className="shiva-th-game">Game</div>
          <div className="shiva-th-col-group">
            <div className="shiva-th-col">1</div>
            <div className="shiva-th-col">X</div>
            <div className="shiva-th-col">2</div>
          </div>
        </div>

        {/* Matches Rows List */}
        <div className="shiva-tb-body">
          {displayMatches.length === 0 ? (
            <div className="shiva-empty-row">No live matches right now in this category.</div>
          ) : (
            displayMatches.map((m) => {
              const currentSel = localTableSelection || activeSelection;
              const isSelected1 = currentSel?.matchId === m.id && currentSel?.team === (m.team1 || "1");
              const isSelected2 = currentSel?.matchId === m.id && currentSel?.team === (m.team2 || "2");
              const isSelectedX = currentSel?.matchId === m.id && currentSel?.team === "The Draw";
              const isMatchSelected = currentSel && String(currentSel.matchId) === String(m.id);

              return (
                <div key={m.id} className="shiva-tr-row-wrap">
                  <div className="shiva-tr-row">
                    {/* Match Info Column (Click to open details page) */}
                    <div
                      className="shiva-td-game"
                      onClick={() => handleMatchRowClick(m)}
                      title={`Click to open ${m.name} match details & markets`}
                    >
                      <span className="shiva-game-icon">{m.icon}</span>
                      <div className="shiva-game-details">
                        <div className="shiva-game-title">
                          <span className="match-name">{m.name}</span>
                          {m.isLive && <span className="shiva-live-badge">LIVE</span>}
                          <span className="match-time">/ {m.time}</span>
                        </div>
                      </div>

                      {/* Status Icons: Green dot, TV, Pin, Gamepad */}
                      <div className="shiva-game-icons">
                        <span className={`shiva-dot-icon ${m.isLive ? "live" : "idle"}`} />
                        {m.hasTv && (
                          <span className="shiva-status-icon tv" title="Live Video Stream">
                            <Tv size={12} />
                          </span>
                        )}
                        {m.hasPin && (
                          <span className="shiva-status-icon pin" title="Pinned Event">
                            <Pin size={12} />
                          </span>
                        )}
                        <span className="shiva-status-icon game" title="Virtual Sports / Score">
                          <Gamepad2 size={12} />
                        </span>
                      </div>
                    </div>

                    {/* Odds Columns: 1 | X | 2 */}
                    <div className="shiva-td-odds-group">
                      {/* Team 1 (Back / Lay) */}
                      <div className="shiva-odds-pair">
                        <button
                          type="button"
                          className={`shiva-odd-box back ${isSelected1 && currentSel?.type === "back" ? "active" : ""}`}
                          onClick={() => handleOddsClick(m, m.team1 || "1", "back", m.b1)}
                          disabled={!m.b1}
                        >
                          <span className="odd-price">{m.b1 ?? "-"}</span>
                        </button>
                        <button
                          type="button"
                          className={`shiva-odd-box lay ${isSelected1 && currentSel?.type === "lay" ? "active" : ""}`}
                          onClick={() => handleOddsClick(m, m.team1 || "1", "lay", m.l1)}
                          disabled={!m.l1}
                        >
                          <span className="odd-price">{m.l1 ?? "-"}</span>
                        </button>
                      </div>

                      {/* Draw / X (Back / Lay) */}
                      <div className="shiva-odds-pair">
                        <button
                          type="button"
                          className={`shiva-odd-box back ${isSelectedX && currentSel?.type === "back" ? "active" : ""}`}
                          onClick={() => handleOddsClick(m, "The Draw", "back", m.bx)}
                          disabled={!m.bx}
                        >
                          <span className="odd-price">{m.bx ?? "-"}</span>
                        </button>
                        <button
                          type="button"
                          className={`shiva-odd-box lay ${isSelectedX && currentSel?.type === "lay" ? "active" : ""}`}
                          onClick={() => handleOddsClick(m, "The Draw", "lay", m.lx)}
                          disabled={!m.lx}
                        >
                          <span className="odd-price">{m.lx ?? "-"}</span>
                        </button>
                      </div>

                      {/* Team 2 (Back / Lay) */}
                      <div className="shiva-odds-pair">
                        <button
                          type="button"
                          className={`shiva-odd-box back ${isSelected2 && currentSel?.type === "back" ? "active" : ""}`}
                          onClick={() => handleOddsClick(m, m.team2 || "2", "back", m.b2)}
                          disabled={!m.b2}
                        >
                          <span className="odd-price">{m.b2 ?? "-"}</span>
                        </button>
                        <button
                          type="button"
                          className={`shiva-odd-box lay ${isSelected2 && currentSel?.type === "lay" ? "active" : ""}`}
                          onClick={() => handleOddsClick(m, m.team2 || "2", "lay", m.l2)}
                          disabled={!m.l2}
                        >
                          <span className="odd-price">{m.l2 ?? "-"}</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Inline BetSlip directly below the clicked match row */}
                  {isMatchSelected && (
                    <div className="shiva-table-inline-betslip">
                      <BetSlip
                        selection={currentSel}
                        inline={true}
                        onClose={() => {
                          setLocalTableSelection(null);
                          if (onCloseSlip) onCloseSlip();
                          if (onSelectOdds) onSelectOdds(null);
                        }}
                        onBetPlaced={(bet) => {
                          setLocalTableSelection(null);
                          if (onBetPlaced) onBetPlaced(bet);
                          if (onCloseSlip) onCloseSlip();
                          if (onSelectOdds) onSelectOdds(null);
                        }}
                        onOpenAuth={onOpenAuth}
                      />
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      <style>{`
        .shiva-odds-wrapper {
          width: 100%;
          background: #ffffff;
          border: 1px solid #cbd5e1;
          border-radius: 4px;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        }

        .shiva-active-tourn-banner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: #fef08a;
          border-bottom: 1px solid #eab308;
          padding: 6px 12px;
          font-size: 12px;
          color: #713f12;
          font-weight: 700;
        }

        .shiva-active-tourn-banner button {
          background: #8c4e09;
          color: #ffffff;
          border: none;
          padding: 3px 8px;
          border-radius: 3px;
          font-size: 11px;
          font-weight: 700;
          cursor: pointer;
        }

        .shiva-active-tourn-banner button:hover {
          background: #733f06;
        }

        /* 1. Inplay subnav bar */
        .shiva-inplay-nav {
          background: #d8dde2;
          border-bottom: 1px solid #cbd5e1;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 3px 6px;
          overflow-x: auto;
          white-space: nowrap;
          gap: 6px;
        }

        .shiva-inplay-tabs {
          display: flex;
          align-items: center;
          gap: 2px;
        }

        .shiva-ipt-btn {
          border: none;
          background: transparent;
          font-size: 11px;
          font-weight: 800;
          color: #334155;
          padding: 6px 10px;
          cursor: pointer;
          border-radius: 2px;
          text-transform: uppercase;
          transition: background 0.1s, color 0.1s;
        }
        .shiva-ipt-btn:hover {
          background: rgba(0, 0, 0, 0.05);
        }
        .shiva-ipt-btn.active {
          background: #0b4c3e;
          color: #ffffff;
        }

        .shiva-inplay-actions {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .shiva-act-pill {
          background: #ffffff;
          border: 1px solid #cbd5e1;
          border-radius: 12px;
          font-size: 10px;
          font-weight: 800;
          color: #64748b;
          padding: 3px 8px;
          cursor: pointer;
        }
        .shiva-act-pill.active {
          background: #f1f5f9;
          color: #0f172a;
          border-color: #94a3b8;
        }

        .shiva-view-by {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 10.5px;
          font-weight: 700;
          color: #475569;
        }

        .shiva-time-select {
          background: #854d0e;
          border: none;
          color: #ffffff;
          border-radius: 3px;
          font-size: 10px;
          font-weight: 800;
          padding: 3px 6px;
          display: flex;
          align-items: center;
          gap: 2px;
          cursor: pointer;
        }

        /* 2. Yellow Header Table */
        .shiva-table-card {
          width: 100%;
          background: #ffffff;
        }

        .shiva-th-row {
          background: #facc15;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 6px 10px;
          border-bottom: 1px solid #eab308;
          font-size: 11.5px;
          font-weight: 900;
          color: #1e293b;
        }

        .shiva-th-game {
          flex: 1;
          text-align: left;
        }

        .shiva-th-col-group {
          display: flex;
          align-items: center;
          gap: 6px;
          width: 288px;
          flex-shrink: 0;
        }

        .shiva-th-col {
          flex: 1;
          text-align: center;
        }

        /* Table Body */
        .shiva-tb-body {
          display: flex;
          flex-direction: column;
        }

        .shiva-tr-row-wrap {
          display: flex;
          flex-direction: column;
          border-bottom: 1px solid #f1f5f9;
        }

        .shiva-table-inline-betslip {
          width: 100%;
          padding: 6px 10px 10px;
          background: #080c16;
          border-bottom: 2px solid #ca8a04;
          box-sizing: border-box;
          animation: slideDown 0.2s ease-out;
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-6px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .shiva-tr-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 7px 10px;
          transition: background 0.1s;
        }
        .shiva-tr-row:nth-child(even) {
          background: #fafafa;
        }
        .shiva-tr-row:hover {
          background: #f8fafc;
        }

        .shiva-td-game {
          flex: 1;
          min-width: 0;
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          border-radius: 3px;
          padding: 2px 4px;
          transition: background 0.15s ease;
        }
        .shiva-td-game:hover {
          background: rgba(2, 132, 199, 0.08);
        }
        .shiva-td-game:hover .match-name {
          color: #0284c7;
          text-decoration: underline;
        }

        .shiva-game-icon {
          font-size: 14px;
          flex-shrink: 0;
        }

        .shiva-game-details {
          flex: 1;
          min-width: 0;
        }

        .shiva-game-title {
          font-size: 11.5px;
          font-weight: 700;
          color: #1e293b;
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 5px;
        }
        .shiva-game-title .match-name {
          font-weight: 800;
          color: #0f172a;
        }
        .shiva-live-badge {
          background: #ef4444;
          color: #ffffff;
          font-size: 9px;
          font-weight: 900;
          padding: 1px 4px;
          border-radius: 2px;
          animation: pulse 1.5s infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        .shiva-game-title .match-time {
          color: #64748b;
          font-size: 10px;
          font-weight: 600;
        }

        .shiva-game-icons {
          display: flex;
          align-items: center;
          gap: 4px;
          margin-left: 8px;
          flex-shrink: 0;
        }

        .shiva-dot-icon {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }
        .shiva-dot-icon.live {
          background: #22c55e;
          box-shadow: 0 0 6px #22c55e;
        }
        .shiva-dot-icon.idle {
          background: #94a3b8;
        }

        .shiva-status-icon {
          width: 18px;
          height: 18px;
          border-radius: 3px;
          background: #f1f5f9;
          border: 1px solid #e2e8f0;
          color: #475569;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* Odds Columns */
        .shiva-td-odds-group {
          display: flex;
          align-items: center;
          gap: 6px;
          width: 288px;
          flex-shrink: 0;
        }

        .shiva-odds-pair {
          flex: 1;
          display: flex;
          gap: 2px;
        }

        .shiva-odd-box {
          flex: 1;
          height: 32px;
          border-radius: 3px;
          border: 1px solid transparent;
          cursor: pointer;
          font-size: 11.5px;
          font-weight: 800;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.1s, filter 0.1s;
        }
        .shiva-odd-box:hover:not(:disabled) {
          filter: brightness(0.95);
          transform: scale(1.02);
        }
        .shiva-odd-box:disabled {
          background: #f1f5f9 !important;
          color: #cbd5e1 !important;
          cursor: not-allowed;
          border-color: #e2e8f0;
        }

        /* Back is light blue (#72bbef) */
        .shiva-odd-box.back {
          background: #72bbef;
          color: #0c4a6e;
          border-color: #38bdf8;
        }
        .shiva-odd-box.back.active {
          outline: 2px solid #0284c7;
          filter: brightness(0.9);
        }

        /* Lay is light pink (#faa9ba) */
        .shiva-odd-box.lay {
          background: #faa9ba;
          color: #881337;
          border-color: #f472b6;
        }
        .shiva-odd-box.lay.active {
          outline: 2px solid #db2777;
          filter: brightness(0.9);
        }

        .shiva-empty-row {
          text-align: center;
          padding: 24px;
          color: #64748b;
          font-size: 12px;
        }

        @media (max-width: 768px) {
          .shiva-th-col-group, .shiva-td-odds-group {
            width: 210px;
            gap: 3px;
          }
          .shiva-odd-box {
            height: 28px;
            font-size: 10px;
          }
          .shiva-game-title {
            font-size: 10.5px;
          }
        }
      `}</style>
    </div>
  );
}
