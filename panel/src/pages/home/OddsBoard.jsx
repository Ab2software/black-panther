import React from "react";
import "./style/OddsBoard.css";

const defaultFilters = ["Live", "Virtual", "Premium"];

const OddsCell = ({ cell, index }) => {
  if (!cell || cell.type === "empty") {
    const isEven = index % 2 === 1; // 0,2,4 = back (blue), 1,3,5 = lay (red)
    return (
      <div className="odds-cell empty" style={{ background: isEven ? "#f3dde4" : "#dfeef9" }}>
        <span>-</span>
      </div>
    );
  }

  return (
    <div className={`odds-cell ${cell.type}`}>
      <div className="odds-value">{cell.value}</div>
      <div className="odds-amount">{cell.amount}</div>
    </div>
  );
};

const ControllerIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M7 7h10a4 4 0 0 1 3.98 4.4l-.6 5.4a2.2 2.2 0 0 1-3.77 1.28L14.5 16h-5l-2.11 2.08a2.2 2.2 0 0 1-3.77-1.28l-.6-5.4A4 4 0 0 1 7 7Z"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
    <path d="M8.5 10.5v3M7 12h3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    <circle cx="16" cy="10.5" r="0.9" fill="currentColor" />
    <circle cx="18" cy="12.5" r="0.9" fill="currentColor" />
  </svg>
);

const StreamIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="4" width="18" height="12" rx="2" stroke="currentColor" strokeWidth="1.8" />
    <path d="M9 20h6M12 16v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    <path d="M10.5 8.3v3.4a.5.5 0 0 0 .76.43l2.8-1.7a.5.5 0 0 0 0-.86l-2.8-1.7a.5.5 0 0 0-.76.43Z" fill="currentColor" />
  </svg>
);

const Badge = ({ label }) => {
  if (label === "🎮" || label === "GAME" || label === "controller") {
    return (
      <span className="market-badge green icon-badge">
        <ControllerIcon />
      </span>
    );
  }

  if (label === "▶" || label === "STREAM" || label === "stream") {
    return (
      <span className="market-badge green icon-badge">
        <StreamIcon />
      </span>
    );
  }

  return <span className="market-badge">{label}</span>;
};

const OddsBoard = ({
  title = "Cricket",
  filters = defaultFilters,
  matches = [], // ✅ comes from Home
  onFilterClick,
  onOddsClick,
  onMatchClick,
}) => {
  return (
    <div className="cricket-board">
      <div className="cricket-board-header">
        <div className="cricket-board-title-wrap">
          <span className="cricket-title-icon" />
          <h2 className="cricket-board-title">{title}</h2>
        </div>

        <div className="cricket-board-filters">
          {filters.map((filter) => (
            <button
              key={filter}
              className="filter-pill"
              onClick={() => onFilterClick?.(filter)}
              type="button"
            >
              <span className="filter-plus">+</span>
              {filter}
            </button>
          ))}
        </div>
      </div>

      <div className="cricket-board-body">
        {matches.map((match) => (
          <div
            key={match.id}
            className="match-row"
            onClick={() => onMatchClick?.(match)}
          >
            <div className="match-time-col">
              <div className="match-day">{match.day}</div>
              <div className="match-time">{match.time}</div>
              {match.isLive && <span className="live-badge">LIVE</span>}
            </div>

            <div className="match-name-col">
              {match.teams.map((team, index) => (
                <div key={index} className="team-name">
                  {team}
                </div>
              ))}
            </div>

            <div className="match-badges-col">
              {match.badges?.map((badge, index) => (
                <Badge key={`${badge}-${index}`} label={badge} />
              ))}
              <Badge label="stream" />
            </div>

            <div className="match-odds-col">
              {match.odds.map((cell, index) => (
                <div
                  key={index}
                  className="odds-cell-wrap"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (cell?.type !== "empty") {
                      onOddsClick?.({
                        match,
                        cell,
                        cellIndex: index,
                      });
                    }
                  }}
                >
                  <OddsCell cell={cell} index={index}/>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OddsBoard;