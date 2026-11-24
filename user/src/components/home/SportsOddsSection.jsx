import React from "react";
import { Zap, Radio } from "lucide-react";

export default function SportsOddsSection({
  matches = [],
  activeSport = "Cricket",
  onSelectOdds,
  activeSelection,
}) {
  if (!matches || matches.length === 0) {
    return (
      <div className="bp-sports-card">
        <div className="bp-sports-header">
          <div className="bp-sports-title">
            <span>🏏 {activeSport} Matches</span>
          </div>
        </div>
        <div className="bp-sports-empty">
          <span>No live {activeSport.toLowerCase()} matches at this moment</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bp-sports-card">
      <div className="bp-sports-header">
        <div className="bp-sports-title">
          <span>
            {activeSport === "Cricket" ? "🏏" : activeSport === "Football" ? "⚽" : "🎾"}{" "}
            {activeSport} Matches
          </span>
          <span className="bp-live-indicator">
            <Radio size={12} className="bp-pulse" />
            LIVE
          </span>
        </div>

        <div className="bp-odds-col-headers">
          <span className="bp-col-h back">1 (Back)</span>
          <span className="bp-col-h lay">1 (Lay)</span>
          <span className="bp-col-h back">2 (Back)</span>
          <span className="bp-col-h lay">2 (Lay)</span>
        </div>
      </div>

      <div className="bp-matches-list">
        {matches.map((m) => {
          const isSelectedTeam1Back =
            activeSelection?.matchId === m.id &&
            activeSelection?.team === m.team1 &&
            activeSelection?.type === "back";
          const isSelectedTeam1Lay =
            activeSelection?.matchId === m.id &&
            activeSelection?.team === m.team1 &&
            activeSelection?.type === "lay";
          const isSelectedTeam2Back =
            activeSelection?.matchId === m.id &&
            activeSelection?.team === m.team2 &&
            activeSelection?.type === "back";
          const isSelectedTeam2Lay =
            activeSelection?.matchId === m.id &&
            activeSelection?.team === m.team2 &&
            activeSelection?.type === "lay";

          return (
            <div key={m.id} className="bp-match-row">
              {/* Match Details */}
              <div className="bp-match-info">
                <div className="bp-match-league">{m.competition || "International / League"}</div>
                <div className="bp-match-teams">
                  <span className="bp-team-name">{m.team1}</span>
                  <span className="bp-vs">vs</span>
                  <span className="bp-team-name">{m.team2}</span>
                </div>
                {m.score && (
                  <div className="bp-match-score">
                    <span className="bp-score-tag">{m.score}</span>
                  </div>
                )}
              </div>

              {/* Odds Grid */}
              <div className="bp-odds-cells">
                {/* Team 1 Back */}
                <button
                  type="button"
                  className={`bp-odds-btn back ${isSelectedTeam1Back ? "selected" : ""}`}
                  onClick={() =>
                    onSelectOdds &&
                    onSelectOdds({
                      matchId: m.id,
                      matchName: `${m.team1} vs ${m.team2}`,
                      team: m.team1,
                      type: "back",
                      odds: m.oddsTeam1Back || 1.95,
                    })
                  }
                >
                  <span className="bp-price">{m.oddsTeam1Back || 1.95}</span>
                  <span className="bp-size">₹50k</span>
                </button>

                {/* Team 1 Lay */}
                <button
                  type="button"
                  className={`bp-odds-btn lay ${isSelectedTeam1Lay ? "selected" : ""}`}
                  onClick={() =>
                    onSelectOdds &&
                    onSelectOdds({
                      matchId: m.id,
                      matchName: `${m.team1} vs ${m.team2}`,
                      team: m.team1,
                      type: "lay",
                      odds: m.oddsTeam1Lay || 1.97,
                    })
                  }
                >
                  <span className="bp-price">{m.oddsTeam1Lay || 1.97}</span>
                  <span className="bp-size">₹45k</span>
                </button>

                {/* Team 2 Back */}
                <button
                  type="button"
                  className={`bp-odds-btn back ${isSelectedTeam2Back ? "selected" : ""}`}
                  onClick={() =>
                    onSelectOdds &&
                    onSelectOdds({
                      matchId: m.id,
                      matchName: `${m.team1} vs ${m.team2}`,
                      team: m.team2,
                      type: "back",
                      odds: m.oddsTeam2Back || 1.94,
                    })
                  }
                >
                  <span className="bp-price">{m.oddsTeam2Back || 1.94}</span>
                  <span className="bp-size">₹38k</span>
                </button>

                {/* Team 2 Lay */}
                <button
                  type="button"
                  className={`bp-odds-btn lay ${isSelectedTeam2Lay ? "selected" : ""}`}
                  onClick={() =>
                    onSelectOdds &&
                    onSelectOdds({
                      matchId: m.id,
                      matchName: `${m.team1} vs ${m.team2}`,
                      team: m.team2,
                      type: "lay",
                      odds: m.oddsTeam2Lay || 1.96,
                    })
                  }
                >
                  <span className="bp-price">{m.oddsTeam2Lay || 1.96}</span>
                  <span className="bp-size">₹42k</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <style>{`
        .bp-sports-card {
          background: #ffffff;
          border-radius: 8px;
          border: 1px solid #d5dce3;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
          overflow: hidden;
          width: 100%;
        }

        .bp-sports-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 14px;
          background: #f8fafc;
          border-bottom: 1px solid #edf1f5;
        }

        .bp-sports-title {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 14px;
          font-weight: 700;
          color: #0f172a;
        }

        .bp-live-indicator {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 10.5px;
          font-weight: 800;
          color: #ef4444;
          background: #fee2e2;
          padding: 2px 6px;
          border-radius: 4px;
        }

        .bp-pulse {
          animation: pulse 1s infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }

        .bp-odds-col-headers {
          display: grid;
          grid-template-columns: repeat(4, 55px);
          gap: 4px;
          text-align: center;
        }

        .bp-col-h {
          font-size: 10px;
          font-weight: 700;
          padding: 2px 0;
          border-radius: 2px;
        }
        .bp-col-h.back {
          color: #0284c7;
          background: #e0f2fe;
        }
        .bp-col-h.lay {
          color: #db2777;
          background: #fce7f3;
        }

        .bp-matches-list {
          display: flex;
          flex-direction: column;
        }

        .bp-match-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 14px;
          border-bottom: 1px solid #f1f5f9;
          transition: background 0.15s ease;
        }

        .bp-match-row:hover {
          background: #f8fafc;
        }

        .bp-match-info {
          flex: 1;
          min-width: 0;
          padding-right: 12px;
        }

        .bp-match-league {
          font-size: 11px;
          color: #64748b;
          font-weight: 600;
          margin-bottom: 2px;
        }

        .bp-match-teams {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13.5px;
          font-weight: 700;
          color: #1e293b;
        }

        .bp-vs {
          font-size: 11px;
          color: #94a3b8;
          font-weight: 500;
        }

        .bp-match-score {
          margin-top: 3px;
        }

        .bp-score-tag {
          font-size: 11px;
          font-weight: 700;
          color: #059669;
          background: #ecfdf5;
          padding: 1px 6px;
          border-radius: 4px;
          display: inline-block;
        }

        .bp-odds-cells {
          display: grid;
          grid-template-columns: repeat(4, 55px);
          gap: 4px;
          flex-shrink: 0;
        }

        .bp-odds-btn {
          height: 38px;
          border-radius: 4px;
          border: none;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.15s ease;
          padding: 2px;
        }

        .bp-odds-btn.back {
          background: #72bbef;
          color: #0c4a6e;
        }
        .bp-odds-btn.back:hover {
          background: #5ab1eb;
        }

        .bp-odds-btn.lay {
          background: #faa9ba;
          color: #831843;
        }
        .bp-odds-btn.lay:hover {
          background: #f897ab;
        }

        .bp-odds-btn.selected {
          outline: 2px solid #0f172a;
          transform: scale(0.96);
        }

        .bp-price {
          font-size: 13px;
          font-weight: 800;
          line-height: 1.1;
        }

        .bp-size {
          font-size: 9.5px;
          opacity: 0.8;
          line-height: 1;
        }

        .bp-sports-empty {
          padding: 30px;
          text-align: center;
          color: #64748b;
          font-size: 13px;
        }

        @media (max-width: 640px) {
          .bp-odds-col-headers {
            display: none;
          }
          .bp-odds-cells {
            grid-template-columns: repeat(4, 46px);
            gap: 2px;
          }
          .bp-odds-btn {
            height: 34px;
          }
          .bp-price {
            font-size: 12px;
          }
        }
      `}</style>
    </div>
  );
}

