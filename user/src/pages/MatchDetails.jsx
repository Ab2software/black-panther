import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Tv,
  Radio,
  Pin,
  Trophy,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Zap,
  TrendingUp,
  Sparkles,
  ChevronRight,
  RefreshCw,
} from "lucide-react";
import { SHIVA_MATCHES } from "../components/home/ShivaOddsTable";
import BetSlip from "../components/sports/BetSlip";
import FloatingWhatsApp from "../components/common/FloatingWhatsApp";
import { useAuth } from "../context/AuthContext";

export default function MatchDetails({
  onSelectOdds,
  activeSelection,
  onCloseSlip,
  onBetPlaced,
  onOpenAuth,
  onOpenDeposit,
}) {
  const { id } = useParams();
  const { state: routeMatch } = useLocation();
  const navigate = useNavigate();
  const { user, wallet } = useAuth();

  // Find match by ID or from router state
  const match = useMemo(() => {
    if (routeMatch && routeMatch.id === id) return routeMatch;
    const found = SHIVA_MATCHES.find((m) => String(m.id) === String(id));
    if (found) return found;
    // Fallback default match if ID not in predefined list
    return {
      id: id || "match_live",
      sport: "Cricket",
      icon: "🏏",
      name: "India vs Australia",
      isLive: true,
      time: "LIVE / Nov 23 2026 14:00 (IST)",
      hasTv: true,
      hasPin: true,
      b1: 1.62,
      l1: 1.64,
      b2: 2.58,
      l2: 2.62,
      team1: "India",
      team2: "Australia",
    };
  }, [id, routeMatch]);

  // Tab for Live display: "score" | "tv" | "tracker"
  const [activeMediaTab, setActiveMediaTab] = useState("score");
  const [localSelection, setLocalSelection] = useState(activeSelection || null);
  const [placedBets, setPlacedBets] = useState([]);
  const [betSuccessMsg, setBetSuccessMsg] = useState("");

  const isCricket = match.sport?.toLowerCase().includes("cricket");
  const isFootball = match.sport?.toLowerCase().includes("football");
  const isTennis = match.sport?.toLowerCase().includes("tennis");

  // Keep local selection in sync
  useEffect(() => {
    if (activeSelection) {
      setLocalSelection(activeSelection);
    }
  }, [activeSelection]);

  const handleOddsClick = (runnerName, type, price, marketName = "Match Odds") => {
    if (!price || price === "-") return;
    const selection = {
      matchId: match.id,
      matchName: match.name,
      team: runnerName,
      selectionName: runnerName,
      type,
      side: type,
      odds: price,
      price,
      market: marketName,
      marketName,
    };
    setLocalSelection(selection);
    if (onSelectOdds) {
      onSelectOdds(selection);
    }
  };

  const isInlineActive = (marketName, runnerName) => {
    if (!localSelection) return false;
    const activeMarket = localSelection.marketName || localSelection.market || "Match Odds";
    const activeRunner = localSelection.selectionName || localSelection.team;
    return activeMarket === marketName && activeRunner === runnerName;
  };

  const handleLocalBetPlaced = (bet) => {
    setPlacedBets((prev) => [bet, ...prev]);
    setBetSuccessMsg(`Bet placed on ${bet.team} @ ₹${bet.odds}!`);
    setTimeout(() => setBetSuccessMsg(""), 3500);
    setLocalSelection(null);
    if (onBetPlaced) onBetPlaced(bet);
  };

  const renderInlineSlip = (marketName, runnerName) => {
    if (!isInlineActive(marketName, runnerName)) return null;
    return (
      <div className="shiva-market-inline-betslip">
        <BetSlip
          selection={localSelection}
          inline={true}
          onClose={() => {
            setLocalSelection(null);
            if (onCloseSlip) onCloseSlip();
          }}
          onBetPlaced={handleLocalBetPlaced}
          onOpenAuth={onOpenAuth}
        />
      </div>
    );
  };

  return (
    <div className="shiva-match-detail-page">
      {/* ─── 1. Breadcrumb & Back Navigation Header ─── */}
      <div className="shiva-md-topbar">
        <button
          type="button"
          className="shiva-back-btn"
          onClick={() => navigate(-1)}
          title="Back to matches list"
        >
          <ArrowLeft size={16} /> Back
        </button>

        <div className="shiva-md-breadcrumb">
          <span className="crumb-link" onClick={() => navigate("/")}>Home</span>
          <ChevronRight size={12} className="crumb-sep" />
          <span className="crumb-link" onClick={() => navigate(`/sports/${match.sport.toLowerCase()}`)}>
            {match.sport}
          </span>
          <ChevronRight size={12} className="crumb-sep" />
          <span className="crumb-active">{match.name}</span>
        </div>
      </div>

      {/* ─── 2. Match Title Banner with Live Indicator ─── */}
      <div className="shiva-md-match-banner">
        <div className="shiva-md-mb-left">
          <span className="shiva-md-sport-icon">{match.icon}</span>
          <div>
            <h1 className="shiva-md-match-title">{match.name}</h1>
            <div className="shiva-md-meta">
              {match.isLive && (
                <span className="shiva-md-live-pill">
                  <span className="live-dot" /> LIVE IN-PLAY
                </span>
              )}
              <span className="shiva-md-time-text">
                <Clock size={12} /> {match.time}
              </span>
              <span className="shiva-md-league-text">
                <Trophy size={12} /> {isCricket ? "ICC Champions Trophy 2026" : isFootball ? "Premier League" : "ATP Masters Series"}
              </span>
            </div>
          </div>
        </div>

        {/* Media Switcher Tabs */}
        <div className="shiva-md-media-tabs">
          <button
            type="button"
            className={`media-tab-btn ${activeMediaTab === "score" ? "active" : ""}`}
            onClick={() => setActiveMediaTab("score")}
          >
            📊 Scorecard
          </button>
          <button
            type="button"
            className={`media-tab-btn ${activeMediaTab === "tv" ? "active" : ""}`}
            onClick={() => setActiveMediaTab("tv")}
          >
            📺 Live TV
          </button>
          <button
            type="button"
            className={`media-tab-btn ${activeMediaTab === "tracker" ? "active" : ""}`}
            onClick={() => setActiveMediaTab("tracker")}
          >
            ⚡ Pitch View
          </button>
        </div>
      </div>

      {/* ─── 3. Live Scorecard / TV Arena ─── */}
      <div className="shiva-md-score-arena">
        {activeMediaTab === "score" && (
          <div className="shiva-score-widget">
            {isCricket && (
              <div className="cricket-scorecard">
                <div className="score-main-row">
                  <div className="team-score-block">
                    <span className="team-label">{match.team1 || "Team 1"}</span>
                    <span className="score-big">242/4 <span className="score-overs">(41.2 ov)</span></span>
                  </div>
                  <div className="score-vs-divider">
                    <span className="crr-text">CRR: 5.85 • Target: 288</span>
                    <span className="match-status-note">India needs 46 runs in 52 balls</span>
                  </div>
                  <div className="team-score-block text-right">
                    <span className="team-label">{match.team2 || "Team 2"}</span>
                    <span className="score-big opponent">287/8 <span className="score-overs">(50.0 ov)</span></span>
                  </div>
                </div>

                {/* Current Batters & Bowler */}
                <div className="score-details-strip">
                  <div className="batsmen-info">
                    <span className="player-highlight">🏏 V. Kohli: <strong>78*</strong> (64)</span>
                    <span className="player-highlight">🏏 K.L. Rahul: <strong>42*</strong> (38)</span>
                  </div>
                  <div className="bowler-info">
                    <span>⚾ M. Starc: 8.2-0-48-2</span>
                  </div>
                  <div className="recent-balls">
                    <span className="recent-label">This Over:</span>
                    <span className="ball-circle dot">1</span>
                    <span className="ball-circle four">4</span>
                    <span className="ball-circle dot">0</span>
                    <span className="ball-circle six">6</span>
                    <span className="ball-circle wicket">W</span>
                    <span className="ball-circle dot">2</span>
                  </div>
                </div>
              </div>
            )}

            {isFootball && (
              <div className="football-scorecard">
                <div className="fb-team-block">
                  <span className="fb-name">{match.team1 || "Real Madrid"}</span>
                  <span className="fb-goal">2</span>
                </div>
                <div className="fb-mid-block">
                  <span className="fb-time-badge">68' 2nd Half</span>
                  <span className="fb-sub">Possession: 54% - 46%</span>
                </div>
                <div className="fb-team-block text-right">
                  <span className="fb-goal">1</span>
                  <span className="fb-name">{match.team2 || "Barcelona"}</span>
                </div>
              </div>
            )}

            {isTennis && (
              <div className="tennis-scorecard">
                <div className="tennis-row header">
                  <span className="tennis-col-name">Player</span>
                  <span className="tennis-set">Set 1</span>
                  <span className="tennis-set">Set 2</span>
                  <span className="tennis-set">Set 3</span>
                  <span className="tennis-points">Points</span>
                </div>
                <div className="tennis-row">
                  <span className="tennis-col-name">{match.team1 || "Player 1"}</span>
                  <span className="tennis-set">6</span>
                  <span className="tennis-set">4</span>
                  <span className="tennis-set active">3</span>
                  <span className="tennis-points highlight">40</span>
                </div>
                <div className="tennis-row">
                  <span className="tennis-col-name">{match.team2 || "Player 2"}</span>
                  <span className="tennis-set">4</span>
                  <span className="tennis-set">6</span>
                  <span className="tennis-set active">2</span>
                  <span className="tennis-points highlight">30</span>
                </div>
              </div>
            )}
          </div>
        )}

        {activeMediaTab === "tv" && (
          <div className="shiva-tv-player-mock">
            <div className="tv-player-inner">
              <span className="tv-live-badge">🔴 LIVE STREAM</span>
              <div className="tv-overlay-info">
                <h3>{match.name}</h3>
                <p>1080p Ultra-Low Latency Broadcast Enabled</p>
              </div>
            </div>
          </div>
        )}

        {activeMediaTab === "tracker" && (
          <div className="shiva-pitch-tracker-mock">
            <div className="pitch-canvas">
              <div className="pitch-crease" />
              <div className="pitch-ball-trajectory" />
              <div className="pitch-text">
                <span className="speed">⚡ Ball Speed: 142.4 km/h</span>
                <span className="line">Line: Good Length outside off-stump</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {betSuccessMsg && (
        <div className="shiva-bet-alert-toast">
          <CheckCircle2 size={16} /> {betSuccessMsg}
        </div>
      )}

      {/* ─── 4. Main 2-Column Betting Markets Grid ─── */}
      <div className="shiva-md-content-grid">
        {/* Left Column: All Markets */}
        <div className="shiva-md-markets-col">
          {/* MARKET 1: MATCH ODDS (1 X 2) */}
          <div className="shiva-market-box">
            <div className="shiva-market-header yellow">
              <div className="market-title">
                <Trophy size={14} />
                <span>MATCH ODDS</span>
                <span className="market-limits">Min: ₹100 | Max: ₹5,00,000</span>
              </div>
              <div className="market-back-lay-labels">
                <span className="lbl-back">BACK</span>
                <span className="lbl-lay">LAY</span>
              </div>
            </div>

            <div className="shiva-market-table">
              {/* Runner 1 */}
              <div className="shiva-market-row">
                <div className="runner-name-col">
                  <strong>{match.team1 || "Team 1"}</strong>
                </div>
                <div className="runner-odds-col">
                  <div className="depth-cell back light">
                    <span className="p">{match.b1 ? +(match.b1 - 0.02).toFixed(2) : "-"}</span>
                    <span className="s">45k</span>
                  </div>
                  <div className="depth-cell back med">
                    <span className="p">{match.b1 ? +(match.b1 - 0.01).toFixed(2) : "-"}</span>
                    <span className="s">72k</span>
                  </div>
                  <div
                    className="depth-cell back main"
                    onClick={() => handleOddsClick(match.team1 || "Team 1", "back", match.b1, "Match Odds")}
                  >
                    <span className="p">{match.b1 ?? "-"}</span>
                    <span className="s">120k</span>
                  </div>
                  <div
                    className="depth-cell lay main"
                    onClick={() => handleOddsClick(match.team1 || "Team 1", "lay", match.l1, "Match Odds")}
                  >
                    <span className="p">{match.l1 ?? "-"}</span>
                    <span className="s">98k</span>
                  </div>
                  <div className="depth-cell lay med">
                    <span className="p">{match.l1 ? +(match.l1 + 0.01).toFixed(2) : "-"}</span>
                    <span className="s">54k</span>
                  </div>
                  <div className="depth-cell lay light">
                    <span className="p">{match.l1 ? +(match.l1 + 0.02).toFixed(2) : "-"}</span>
                    <span className="s">22k</span>
                  </div>
                </div>
              </div>
              {renderInlineSlip("Match Odds", match.team1 || "Team 1")}

              {/* The Draw (if football) */}
              {(isFootball || match.theDraw) && (
                <>
                  <div className="shiva-market-row">
                    <div className="runner-name-col">
                      <strong>The Draw</strong>
                    </div>
                    <div className="runner-odds-col">
                      <div className="depth-cell back light">
                        <span className="p">3.80</span>
                        <span className="s">15k</span>
                      </div>
                      <div className="depth-cell back med">
                        <span className="p">3.85</span>
                        <span className="s">28k</span>
                      </div>
                      <div
                        className="depth-cell back main"
                        onClick={() => handleOddsClick("The Draw", "back", match.bx || 3.90, "Match Odds")}
                      >
                        <span className="p">{match.bx || 3.90}</span>
                        <span className="s">45k</span>
                      </div>
                      <div
                        className="depth-cell lay main"
                        onClick={() => handleOddsClick("The Draw", "lay", match.lx || 4.10, "Match Odds")}
                      >
                        <span className="p">{match.lx || 4.10}</span>
                        <span className="s">38k</span>
                      </div>
                      <div className="depth-cell lay med">
                        <span className="p">4.20</span>
                        <span className="s">18k</span>
                      </div>
                      <div className="depth-cell lay light">
                        <span className="p">4.30</span>
                        <span className="s">12k</span>
                      </div>
                    </div>
                  </div>
                  {renderInlineSlip("Match Odds", "The Draw")}
                </>
              )}

              {/* Runner 2 */}
              <div className="shiva-market-row">
                <div className="runner-name-col">
                  <strong>{match.team2 || "Team 2"}</strong>
                </div>
                <div className="runner-odds-col">
                  <div className="depth-cell back light">
                    <span className="p">{match.b2 ? +(match.b2 - 0.02).toFixed(2) : "-"}</span>
                    <span className="s">32k</span>
                  </div>
                  <div className="depth-cell back med">
                    <span className="p">{match.b2 ? +(match.b2 - 0.01).toFixed(2) : "-"}</span>
                    <span className="s">48k</span>
                  </div>
                  <div
                    className="depth-cell back main"
                    onClick={() => handleOddsClick(match.team2 || "Team 2", "back", match.b2, "Match Odds")}
                  >
                    <span className="p">{match.b2 ?? "-"}</span>
                    <span className="s">85k</span>
                  </div>
                  <div
                    className="depth-cell lay main"
                    onClick={() => handleOddsClick(match.team2 || "Team 2", "lay", match.l2, "Match Odds")}
                  >
                    <span className="p">{match.l2 ?? "-"}</span>
                    <span className="s">72k</span>
                  </div>
                  <div className="depth-cell lay med">
                    <span className="p">{match.l2 ? +(match.l2 + 0.01).toFixed(2) : "-"}</span>
                    <span className="s">35k</span>
                  </div>
                  <div className="depth-cell lay light">
                    <span className="p">{match.l2 ? +(match.l2 + 0.02).toFixed(2) : "-"}</span>
                    <span className="s">19k</span>
                  </div>
                </div>
              </div>
              {renderInlineSlip("Match Odds", match.team2 || "Team 2")}
            </div>
          </div>

          {/* MARKET 2: BOOKMAKER 0% COMMISSION (Very popular in Shiva365) */}
          <div className="shiva-market-box">
            <div className="shiva-market-header emerald">
              <div className="market-title">
                <Zap size={14} />
                <span>BOOKMAKER 0% COMMISSION</span>
                <span className="market-limits">Max: ₹10,00,000</span>
              </div>
              <div className="market-back-lay-labels">
                <span className="lbl-back">BACK</span>
                <span className="lbl-lay">LAY</span>
              </div>
            </div>

            <div className="shiva-market-table">
              <div className="shiva-market-row">
                <div className="runner-name-col">
                  <strong>{match.team1 || "Team 1"}</strong>
                </div>
                <div className="runner-odds-col simple">
                  <div
                    className="depth-cell back main"
                    onClick={() => handleOddsClick(match.team1 || "Team 1", "back", 1.98, "Bookmaker")}
                  >
                    <span className="p">98</span>
                    <span className="s">100k</span>
                  </div>
                  <div
                    className="depth-cell lay main"
                    onClick={() => handleOddsClick(match.team1 || "Team 1", "lay", 2.00, "Bookmaker")}
                  >
                    <span className="p">100</span>
                    <span className="s">100k</span>
                  </div>
                </div>
              </div>
              {renderInlineSlip("Bookmaker", match.team1 || "Team 1")}

              <div className="shiva-market-row">
                <div className="runner-name-col">
                  <strong>{match.team2 || "Team 2"}</strong>
                </div>
                <div className="runner-odds-col simple">
                  <div
                    className="depth-cell back main"
                    onClick={() => handleOddsClick(match.team2 || "Team 2", "back", 1.98, "Bookmaker")}
                  >
                    <span className="p">98</span>
                    <span className="s">100k</span>
                  </div>
                  <div
                    className="depth-cell lay main"
                    onClick={() => handleOddsClick(match.team2 || "Team 2", "lay", 2.00, "Bookmaker")}
                  >
                    <span className="p">100</span>
                    <span className="s">100k</span>
                  </div>
                </div>
              </div>
              {renderInlineSlip("Bookmaker", match.team2 || "Team 2")}
            </div>
          </div>

          {/* MARKET 3: FANCY / SESSION BETTING (For Cricket) */}
          {isCricket && (
            <div className="shiva-market-box">
              <div className="shiva-market-header brown">
                <div className="market-title">
                  <TrendingUp size={14} />
                  <span>FANCY / SESSION MARKETS</span>
                  <span className="market-limits">Min: ₹100 | Max: ₹50,000</span>
                </div>
                <div className="market-back-lay-labels fancy">
                  <span className="lbl-no">NO</span>
                  <span className="lbl-yes">YES</span>
                </div>
              </div>

              <div className="shiva-market-table fancy-table">
                {[
                  { id: "f1", title: "6 Over IND Runs", noP: 48, yesP: 50 },
                  { id: "f2", title: "10 Over IND Runs", noP: 82, yesP: 84 },
                  { id: "f3", title: "15 Over IND Runs", noP: 135, yesP: 138 },
                  { id: "f4", title: "20 Over IND Runs", noP: 186, yesP: 188 },
                  { id: "f5", title: "Fall of 5th Wicket IND", noP: 264, yesP: 268 },
                  { id: "f6", title: "V. Kohli Runs 100", noP: 98, yesP: 100 },
                  { id: "f7", title: "Total Match Sixes", noP: 12, yesP: 14 },
                ].map((f) => (
                  <React.Fragment key={f.id}>
                    <div className="shiva-market-row fancy-row">
                      <div className="runner-name-col">
                        <span>{f.title}</span>
                      </div>
                      <div className="runner-odds-col simple">
                        <div
                          className="depth-cell lay main"
                          onClick={() => handleOddsClick(f.title, "no", f.noP, "Fancy Session")}
                          title={`Bet NO on ${f.title}`}
                        >
                          <span className="p">{f.noP}</span>
                          <span className="s">100</span>
                        </div>
                        <div
                          className="depth-cell back main"
                          onClick={() => handleOddsClick(f.title, "yes", f.yesP, "Fancy Session")}
                          title={`Bet YES on ${f.title}`}
                        >
                          <span className="p">{f.yesP}</span>
                          <span className="s">100</span>
                        </div>
                      </div>
                    </div>
                    {renderInlineSlip("Fancy Session", f.title)}
                  </React.Fragment>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Docked BetSlip & My Bets */}
        <div className="shiva-md-sidebar-col">
          {/* Bet Slip Box */}
          <div className="shiva-detail-betslip-dock">
            {localSelection ? (
              <BetSlip
                selection={localSelection}
                onClose={() => {
                  setLocalSelection(null);
                  if (onCloseSlip) onCloseSlip();
                }}
                onBetPlaced={handleLocalBetPlaced}
                onOpenAuth={onOpenAuth}
              />
            ) : (
              <div className="empty-slip-dock-card">
                <div className="slip-icon-badge">
                  <Sparkles size={22} />
                </div>
                <h3>Bet Slip</h3>
                <p>Click any <strong>Back</strong> (Blue) or <strong>Lay</strong> (Pink) price to place your bet.</p>
              </div>
            )}
          </div>

          {/* Placed Bets on this Match */}
          {placedBets.length > 0 && (
            <div className="shiva-placed-bets-card">
              <div className="pb-header">
                <h4>My Bets ({placedBets.length})</h4>
              </div>
              <div className="pb-list">
                {placedBets.map((b, idx) => (
                  <div key={idx} className="pb-item">
                    <div className="pb-top">
                      <span className={`pb-type-tag ${b.type}`}>{b.type.toUpperCase()}</span>
                      <strong className="pb-runner">{b.team}</strong>
                    </div>
                    <div className="pb-bottom">
                      <span>Odds: {b.odds}</span>
                      <span>Stake: ₹{b.stake}</span>
                      <span className="pb-profit">Win: ₹{b.potentialProfit}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Floating 24x7 WhatsApp Support */}
      <FloatingWhatsApp phone="919876543210" />

      <style>{`
        .shiva-match-detail-page {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        /* Top Breadcrumb */
        .shiva-md-topbar {
          background: #ffffff;
          border: 1px solid #cbd5e1;
          border-radius: 4px;
          padding: 6px 12px;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .shiva-back-btn {
          background: #0b4c3e;
          border: none;
          color: #ffffff;
          font-size: 11.5px;
          font-weight: 800;
          padding: 4px 10px;
          border-radius: 3px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 4px;
          transition: background 0.15s;
        }
        .shiva-back-btn:hover {
          background: #07382d;
        }

        .shiva-md-breadcrumb {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 11.5px;
        }
        .crumb-link {
          color: #0284c7;
          cursor: pointer;
          font-weight: 600;
        }
        .crumb-link:hover {
          text-decoration: underline;
        }
        .crumb-sep {
          color: #94a3b8;
        }
        .crumb-active {
          color: #1e293b;
          font-weight: 800;
        }

        /* Match Title Banner */
        .shiva-md-match-banner {
          background: #8c4e09;
          border-radius: 4px;
          padding: 10px 14px;
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 10px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .shiva-md-mb-left {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .shiva-md-sport-icon {
          font-size: 26px;
        }
        .shiva-md-match-title {
          margin: 0 0 3px 0;
          font-size: 17px;
          font-weight: 900;
          letter-spacing: 0.3px;
        }
        .shiva-md-meta {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 11px;
          color: #fde68a;
          flex-wrap: wrap;
        }
        .shiva-md-live-pill {
          background: #ef4444;
          color: #ffffff;
          font-size: 9.5px;
          font-weight: 900;
          padding: 2px 6px;
          border-radius: 2px;
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .live-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #ffffff;
          animation: pulse 1.2s infinite;
        }
        .shiva-md-time-text, .shiva-md-league-text {
          display: flex;
          align-items: center;
          gap: 3px;
        }

        .shiva-md-media-tabs {
          display: flex;
          gap: 4px;
        }
        .media-tab-btn {
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: #ffffff;
          font-size: 11px;
          font-weight: 700;
          padding: 5px 10px;
          border-radius: 3px;
          cursor: pointer;
        }
        .media-tab-btn.active {
          background: #facc15;
          color: #713f12;
          font-weight: 900;
        }

        /* Score Arena */
        .shiva-md-score-arena {
          background: #ffffff;
          border: 1px solid #cbd5e1;
          border-radius: 4px;
          padding: 10px;
        }

        .cricket-scorecard {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .score-main-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 6px 10px;
          background: #f8fafc;
          border-radius: 4px;
          border: 1px solid #e2e8f0;
        }
        .team-score-block {
          display: flex;
          flex-direction: column;
        }
        .team-score-block.text-right {
          text-align: right;
        }
        .team-label {
          font-size: 12px;
          font-weight: 800;
          color: #0f172a;
        }
        .score-big {
          font-size: 19px;
          font-weight: 900;
          color: #0284c7;
        }
        .score-big.opponent {
          color: #64748b;
        }
        .score-overs {
          font-size: 11px;
          font-weight: 600;
          color: #64748b;
        }
        .score-vs-divider {
          text-align: center;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .crr-text {
          font-size: 11px;
          font-weight: 800;
          color: #15803d;
        }
        .match-status-note {
          font-size: 10.5px;
          color: #475569;
          font-weight: 600;
        }

        .score-details-strip {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 6px;
          background: #f1f5f9;
          padding: 6px 10px;
          border-radius: 4px;
          font-size: 11px;
        }
        .batsmen-info {
          display: flex;
          gap: 12px;
        }
        .player-highlight strong {
          color: #0b4c3e;
        }
        .recent-balls {
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .recent-label {
          font-weight: 700;
          color: #64748b;
        }
        .ball-circle {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 9.5px;
          font-weight: 900;
          color: #ffffff;
        }
        .ball-circle.dot { background: #94a3b8; }
        .ball-circle.four { background: #0284c7; }
        .ball-circle.six { background: #7c3aed; }
        .ball-circle.wicket { background: #dc2626; }

        /* Football Scorecard */
        .football-scorecard {
          display: flex;
          align-items: center;
          justify-content: space-around;
          padding: 10px;
          background: #f8fafc;
          border-radius: 4px;
        }
        .fb-team-block {
          display: flex;
          align-items: center;
          gap: 14px;
        }
        .fb-name { font-size: 15px; font-weight: 900; color: #0f172a; }
        .fb-goal { font-size: 26px; font-weight: 900; color: #0b4c3e; }
        .fb-mid-block { text-align: center; }
        .fb-time-badge { background: #ef4444; color: #ffffff; padding: 2px 8px; border-radius: 3px; font-size: 11px; font-weight: 900; }
        .fb-sub { display: block; font-size: 10.5px; color: #64748b; margin-top: 3px; }

        /* TV Mock */
        .shiva-tv-player-mock {
          height: 220px;
          background: #0f172a;
          border-radius: 4px;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ffffff;
          overflow: hidden;
        }
        .tv-live-badge {
          position: absolute;
          top: 10px;
          left: 10px;
          background: rgba(220, 38, 38, 0.9);
          padding: 2px 8px;
          border-radius: 3px;
          font-size: 10.5px;
          font-weight: 900;
        }
        .tv-overlay-info { text-align: center; }

        /* Pitch Tracker Mock */
        .shiva-pitch-tracker-mock {
          height: 180px;
          background: linear-gradient(180deg, #166534 0%, #14532d 100%);
          border-radius: 4px;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ffffff;
        }
        .pitch-canvas { text-align: center; }
        .pitch-text { font-size: 12px; font-weight: 700; display: flex; flex-direction: column; gap: 4px; }

        .shiva-bet-alert-toast {
          background: #15803d;
          color: #ffffff;
          padding: 8px 14px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 800;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        /* 2-Column Grid */
        .shiva-md-content-grid {
          display: flex;
          gap: 8px;
          align-items: flex-start;
        }
        .shiva-md-markets-col {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .shiva-md-sidebar-col {
          width: 340px;
          flex-shrink: 0;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        /* Market Box */
        .shiva-market-box {
          background: #ffffff;
          border: 1px solid #cbd5e1;
          border-radius: 4px;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        }

        .shiva-market-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 6px 10px;
          font-size: 12px;
          font-weight: 900;
        }
        .shiva-market-header.yellow {
          background: #facc15;
          color: #713f12;
          border-bottom: 1px solid #eab308;
        }
        .shiva-market-header.emerald {
          background: #0b4c3e;
          color: #ffffff;
          border-bottom: 1px solid #07382d;
        }
        .shiva-market-header.brown {
          background: #8c4e09;
          color: #ffffff;
          border-bottom: 1px solid #703e07;
        }

        .market-title {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .market-limits {
          font-size: 9.5px;
          font-weight: 600;
          opacity: 0.85;
          margin-left: 6px;
        }

        .market-back-lay-labels {
          display: flex;
          width: 140px;
          text-align: center;
          font-size: 10.5px;
          font-weight: 900;
        }
        .market-back-lay-labels .lbl-back { flex: 1; color: #0369a1; }
        .market-back-lay-labels .lbl-lay { flex: 1; color: #be185d; }
        .market-back-lay-labels.fancy .lbl-no { flex: 1; color: #be185d; }
        .market-back-lay-labels.fancy .lbl-yes { flex: 1; color: #0369a1; }

        /* Market Table */
        .shiva-market-table {
          display: flex;
          flex-direction: column;
        }
        .shiva-market-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 6px 10px;
          border-bottom: 1px solid #f1f5f9;
        }
        .shiva-market-row:last-child {
          border-bottom: none;
        }
        .runner-name-col {
          flex: 1;
          font-size: 12px;
          color: #0f172a;
        }
        .runner-odds-col {
          display: flex;
          gap: 3px;
        }
        .runner-odds-col.simple {
          width: 140px;
        }

        .depth-cell {
          width: 58px;
          height: 34px;
          border-radius: 3px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          border: 1px solid transparent;
          transition: transform 0.1s;
        }
        .depth-cell:hover {
          filter: brightness(0.95);
          transform: scale(1.02);
        }
        .depth-cell .p {
          font-size: 12px;
          font-weight: 900;
          line-height: 1.1;
        }
        .depth-cell .s {
          font-size: 9px;
          font-weight: 600;
          line-height: 1;
          opacity: 0.8;
        }

        .depth-cell.back.main { background: #72bbef; color: #0c4a6e; border-color: #38bdf8; }
        .depth-cell.back.med { background: #bae6fd; color: #0369a1; }
        .depth-cell.back.light { background: #e0f2fe; color: #0284c7; }

        .depth-cell.lay.main { background: #faa9ba; color: #881337; border-color: #f472b6; }
        .depth-cell.lay.med { background: #fbcfe8; color: #9d174d; }
        .depth-cell.lay.light { background: #fdf2f8; color: #be185d; }

        /* Empty Slip Dock */
        .empty-slip-dock-card {
          background: #ffffff;
          border: 1px dashed #cbd5e1;
          border-radius: 4px;
          padding: 24px 16px;
          text-align: center;
          color: #64748b;
        }
        .slip-icon-badge {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: #fef08a;
          color: #854d0e;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 8px;
        }
        .empty-slip-dock-card h3 {
          margin: 0 0 4px 0;
          font-size: 14px;
          color: #1e293b;
        }
        .empty-slip-dock-card p {
          margin: 0;
          font-size: 11.5px;
          line-height: 1.4;
        }

        /* Placed Bets */
        .shiva-placed-bets-card {
          background: #ffffff;
          border: 1px solid #cbd5e1;
          border-radius: 4px;
          overflow: hidden;
        }
        .pb-header {
          background: #0b4c3e;
          color: #ffffff;
          padding: 6px 10px;
        }
        .pb-header h4 { margin: 0; font-size: 12px; }
        .pb-list { display: flex; flex-direction: column; }
        .pb-item {
          padding: 6px 10px;
          border-bottom: 1px solid #f1f5f9;
          font-size: 11px;
        }
        .pb-top { display: flex; align-items: center; gap: 6px; margin-bottom: 2px; }
        .pb-type-tag {
          font-size: 9px;
          font-weight: 900;
          padding: 1px 4px;
          border-radius: 2px;
          color: #ffffff;
        }
        .pb-type-tag.back { background: #0284c7; }
        .pb-type-tag.lay { background: #db2777; }
        .pb-type-tag.yes { background: #0284c7; }
        .pb-type-tag.no { background: #db2777; }
        .pb-bottom { display: flex; gap: 10px; color: #64748b; }
        .pb-profit { color: #16a34a; font-weight: 800; margin-left: auto; }

        .shiva-market-inline-betslip {
          width: 100%;
          padding: 4px 6px 8px;
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

        @media (max-width: 900px) {
          .shiva-md-content-grid {
            flex-direction: column;
          }
          .shiva-md-sidebar-col {
            display: none !important;
          }
          .depth-cell {
            width: 44px;
            height: 30px;
          }
          .depth-cell .p { font-size: 10.5px; }
          .depth-cell .s { font-size: 8px; }
        }
      `}</style>
    </div>
  );
}

