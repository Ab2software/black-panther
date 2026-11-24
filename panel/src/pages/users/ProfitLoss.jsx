import React, { useMemo } from "react";
import { useAuth } from "../../context/AuthContext";

const ProfitLoss = () => {
  const { user } = useAuth();

  const totalProfit = user?.wallet?.totalProfit ?? 0;
  const totalLoss = user?.wallet?.totalLoss ?? 0;

  const totalBets = user?.stats?.totalBets ?? 0;
  const wins = user?.stats?.totalWins ?? 0;
  const losses = user?.stats?.totalLosses ?? 0;

  const netResult = useMemo(() => {
    return totalProfit - totalLoss;
  }, [totalProfit, totalLoss]);

  const winRate = useMemo(() => {
    if (!totalBets) return 0;
    return ((wins / totalBets) * 100).toFixed(1);
  }, [wins, totalBets]);

  const formatCurrency = (num) =>
    new Intl.NumberFormat("en-IN").format(num);

  return (
    <div className="pl-container">
      <h2>📊 Betting Profit & Loss</h2>

      {/* SUMMARY CARDS */}
      <div className="cards">
        <div className="card profit">
          <p>Total Profit</p>
          <h3>₹ {formatCurrency(totalProfit)}</h3>
        </div>

        <div className="card loss">
          <p>Total Loss</p>
          <h3>₹ {formatCurrency(totalLoss)}</h3>
        </div>

        <div className={`card net ${netResult >= 0 ? "positive" : "negative"}`}>
          <p>Net Result</p>
          <h3>
            ₹ {formatCurrency(netResult)}{" "}
            <span className="trend">
              {netResult >= 0 ? "▲" : "▼"}
            </span>
          </h3>
        </div>
      </div>

      {/* STATS */}
      <div className="stats">
        <div className="stat-box">
          <p>Total Bets</p>
          <strong>{totalBets}</strong>
        </div>
        <div className="stat-box">
          <p>Wins</p>
          <strong>{wins}</strong>
        </div>
        <div className="stat-box">
          <p>Losses</p>
          <strong>{losses}</strong>
        </div>
        <div className="stat-box">
          <p>Win Rate</p>
          <strong>{winRate}%</strong>
        </div>
      </div>

      {/* PLACEHOLDER TABLE */}
      <div className="placeholder">
        <h4>Detailed report coming soon...</h4>
        <p>This will include bet-wise profit/loss once API is ready.</p>
      </div>

      {/* STYLES */}
      <style>{`
        .pl-container {
          padding: 20px;
          color: #111;
        }

        h2 {
          margin-bottom: 20px;
        }

        .cards {
          display: flex;
          gap: 16px;
          margin-bottom: 20px;
        }

        .card {
          flex: 1;
          padding: 18px;
          border-radius: 12px;
          color: white;
          box-shadow: 0 4px 10px rgba(0,0,0,0.08);
          transition: transform 0.2s ease;
        }

        .card:hover {
          transform: translateY(-3px);
        }

        .profit {
          background: #16a34a;
        }

        .loss {
          background: #dc2626;
        }

        .net {
          background: #374151;
        }

        .positive {
          background: #22c55e;
        }

        .negative {
          background: #ef4444;
        }

        .trend {
          font-size: 14px;
          margin-left: 6px;
        }

        .stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          gap: 12px;
          margin-bottom: 20px;
        }

        .stat-box {
          background: #f9fafb;
          padding: 14px;
          border-radius: 10px;
          text-align: center;
        }

        .stat-box p {
          font-size: 12px;
          color: #6b7280;
          margin-bottom: 6px;
        }

        .stat-box strong {
          font-size: 16px;
        }

        .placeholder {
          background: #f3f4f6;
          padding: 20px;
          border-radius: 10px;
          text-align: center;
        }
      `}</style>
    </div>
  );
};

export default ProfitLoss;