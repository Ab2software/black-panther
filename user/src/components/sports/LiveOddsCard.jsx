import React, { memo } from "react";
import { Zap, Trophy } from "lucide-react";

const LiveOddsCard = memo(function LiveOddsCard({ match, onSelectOdds, activeSelection }) {
  if (!match) return null;

  return (
    <div
      style={{
        background: "linear-gradient(145deg, #101624 0%, #0c101a 100%)",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        borderRadius: "14px",
        overflow: "hidden",
        boxShadow: "0 6px 20px rgba(0, 0, 0, 0.4)",
        marginBottom: "12px",
        willChange: "transform",
      }}
    >
      {/* Top Header: Tournament & Status */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "8px 12px",
          background: "rgba(255, 255, 255, 0.03)",
          borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "6px", minWidth: 0, flex: 1 }}>
          <Trophy size={13} color="#d4af37" style={{ flexShrink: 0 }} />
          <span
            style={{
              fontSize: "11px",
              fontWeight: 700,
              color: "#94a3b8",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {match.competition || "Live Exchange"}
          </span>
        </div>

        {match.inPlay ? (
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "5px",
              padding: "2px 8px",
              borderRadius: "14px",
              background: "rgba(239, 68, 68, 0.15)",
              border: "1px solid rgba(239, 68, 68, 0.4)",
              color: "#f87171",
              fontSize: "10.5px",
              fontWeight: 800,
              flexShrink: 0,
            }}
          >
            <span
              style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                background: "#ef4444",
                boxShadow: "0 0 6px #ef4444",
              }}
              className="pulse-glow"
            />
            LIVE
          </div>
        ) : (
          <span
            style={{
              fontSize: "10.5px",
              fontWeight: 700,
              color: "#60a5fa",
              background: "rgba(96, 165, 250, 0.12)",
              padding: "2px 6px",
              borderRadius: "4px",
              flexShrink: 0,
            }}
          >
            {match.status}
          </span>
        )}
      </div>

      {/* Match Title & Live Score */}
      <div
        style={{
          padding: "10px 12px 6px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          gap: "8px",
        }}
      >
        <div style={{ minWidth: 0, flex: 1 }}>
          <h3
            style={{
              margin: 0,
              fontSize: "15px",
              fontWeight: 800,
              color: "#ffffff",
              letterSpacing: "-0.2px",
              lineHeight: 1.25,
            }}
          >
            {match.matchName}
          </h3>
          {match.scores && (
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                marginTop: "4px",
                fontSize: "11.5px",
                fontWeight: 700,
                color: "#4ade80",
                background: "rgba(34, 197, 94, 0.12)",
                padding: "2px 6px",
                borderRadius: "4px",
              }}
            >
              <Zap size={11} />
              <span>{match.scores}</span>
            </div>
          )}
        </div>

        {/* Back / Lay Labels Header */}
        <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
          <div
            style={{
              width: "62px",
              textAlign: "center",
              fontSize: "10px",
              fontWeight: 900,
              color: "#72bbef",
              letterSpacing: "0.5px",
            }}
          >
            BACK
          </div>
          <div
            style={{
              width: "62px",
              textAlign: "center",
              fontSize: "10px",
              fontWeight: 900,
              color: "#faa9ba",
              letterSpacing: "0.5px",
            }}
          >
            LAY
          </div>
        </div>
      </div>

      {/* Runners Odds List */}
      <div style={{ padding: "0 12px 10px", display: "flex", flexDirection: "column", gap: "6px" }}>
        {match.runners?.map((runner, idx) => {
          const backPrice = runner.back?.[0]?.price || 1.95;
          const backSize = runner.back?.[0]?.size ? `${(runner.back[0].size / 1000).toFixed(0)}k` : "15k";
          const layPrice = runner.lay?.[0]?.price || 1.98;
          const laySize = runner.lay?.[0]?.size ? `${(runner.lay[0].size / 1000).toFixed(0)}k` : "12k";

          const isBackSelected =
            activeSelection?.marketId === match.marketId &&
            activeSelection?.selectionId === runner.selectionId &&
            activeSelection?.side === "back";

          const isLaySelected =
            activeSelection?.marketId === match.marketId &&
            activeSelection?.selectionId === runner.selectionId &&
            activeSelection?.side === "lay";

          return (
            <div
              key={runner.selectionId || idx}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "6px 8px",
                background: "rgba(255, 255, 255, 0.02)",
                borderRadius: "8px",
                border: "1px solid rgba(255, 255, 255, 0.04)",
                gap: "8px",
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <span
                  style={{
                    fontSize: "13.5px",
                    fontWeight: 700,
                    color: "#f1f5f9",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    display: "block",
                  }}
                >
                  {runner.teamName}
                </span>
              </div>

              {/* Odds Clickable Buttons */}
              <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
                {/* Back Button */}
                <button
                  type="button"
                  onClick={() =>
                    onSelectOdds({
                      marketId: match.marketId,
                      eventId: match.eventId,
                      sport: match.sport,
                      matchName: match.matchName,
                      selectionId: runner.selectionId,
                      selectionName: runner.teamName,
                      side: "back",
                      price: backPrice,
                    })
                  }
                  style={{
                    width: "62px",
                    height: "40px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    background: isBackSelected ? "#47a3e8" : "#72bbef",
                    border: isBackSelected ? "2px solid #ffffff" : "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    boxShadow: isBackSelected ? "0 0 10px rgba(114, 187, 239, 0.8)" : "none",
                    transform: isBackSelected ? "scale(0.96)" : "none",
                    transition: "all 0.1s ease",
                  }}
                >
                  <span style={{ fontSize: "13.5px", fontWeight: 800, color: "#061f36", lineHeight: 1.1 }}>
                    {backPrice.toFixed(2)}
                  </span>
                  <span style={{ fontSize: "9.5px", fontWeight: 700, color: "#1e3a5f" }}>{backSize}</span>
                </button>

                {/* Lay Button */}
                <button
                  type="button"
                  onClick={() =>
                    onSelectOdds({
                      marketId: match.marketId,
                      eventId: match.eventId,
                      sport: match.sport,
                      matchName: match.matchName,
                      selectionId: runner.selectionId,
                      selectionName: runner.teamName,
                      side: "lay",
                      price: layPrice,
                    })
                  }
                  style={{
                    width: "62px",
                    height: "40px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    background: isLaySelected ? "#f488a0" : "#faa9ba",
                    border: isLaySelected ? "2px solid #ffffff" : "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    boxShadow: isLaySelected ? "0 0 10px rgba(250, 169, 186, 0.8)" : "none",
                    transform: isLaySelected ? "scale(0.96)" : "none",
                    transition: "all 0.1s ease",
                  }}
                >
                  <span style={{ fontSize: "13.5px", fontWeight: 800, color: "#380d17", lineHeight: 1.1 }}>
                    {layPrice.toFixed(2)}
                  </span>
                  <span style={{ fontSize: "9.5px", fontWeight: 700, color: "#541b27" }}>{laySize}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});

export default LiveOddsCard;
