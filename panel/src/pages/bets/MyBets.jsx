import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getMyBets } from "../../services/sportsService";

const MyBets = () => {
  const navigate = useNavigate();

  const [bets, setBets] = useState([]);
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const [selectedBet, setSelectedBet] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const fetchBets = async () => {
      try {
        const data = await getMyBets();
// console.log("Fetched bets:", data.data[1]); // check first bet's fields
        if (data?.data) {
         const formatted = data.data.map((bet) => {
  const isFancy = ["fancy", "premium fancy"].includes(
    bet.selectionName?.toLowerCase()
  );
  const sentPayload = bet.settlementResponse?.sent_payload;

  return {
    id: bet._id,
    team: bet.sectionTeam,
    match: bet.matchName,
    selectionName: bet.selectionName,
    type: bet.side,
    price: isFancy
      ? `${sentPayload?.fancy_price ?? "--"} / ${sentPayload?.fancy_rate ?? "--"}`
      : bet.price ?? "--",
    stake: bet.stake,
    pnl: bet.profitLoss ?? "--",
    status: bet.status,
    date: new Date(bet.createdAt).toLocaleString(),
  };
});

          setBets(formatted);
        }
      } catch (err) {
        console.error("Failed to load bets", err);
        setBets([]);
      }
    };

    fetchBets();
  }, []);

  const filteredBets = bets.filter((bet) => {
    const matchesFilter = filter === "all" || bet.type === filter;

    const matchesSearch =
      bet.team?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bet.match?.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  return (
    <div className="page">
      <div className="container">

        {/* HEADER */}
        <div className="header">
          <button className="backBtn" onClick={() => navigate(-1)}>
            ←
          </button>

          <h2>My Bets</h2>

          <input
            className="search"
            placeholder="Search match / team..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* FILTERS */}
        <div className="filters">
          <button
            className={filter === "all" ? "active" : ""}
            onClick={() => setFilter("all")}
          >
            All ({bets.length})
          </button>

          <button
            className={filter === "back" ? "active" : ""}
            onClick={() => setFilter("back")}
          >
            Back
          </button>

          <button
            className={filter === "lay" ? "active" : ""}
            onClick={() => setFilter("lay")}
          >
            Lay
          </button>
        </div>

        {/* TABLE */}
        <div className="tableWrap">
          <table>
            <thead>
              <tr>
                <th>Match</th>
                <th>Type</th>
                <th>Odds</th>
                <th>Stake</th>
                <th>P&L</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>

            <tbody>
              {filteredBets.length > 0 ? (
                filteredBets.map((bet) => (
                  <tr
                    key={bet.id}
                    onClick={() => {
                      setSelectedBet(bet);
                      setShowModal(true);
                    }}
                  >
                    <td>
                      <div className="match">{bet.match}</div>
                      <div className="team">{bet.team}</div>
                    </td>

                    <td>
                      <span className={`badge ${bet.type}`}>
                        {bet.type.toUpperCase()}
                      </span>
                    </td>

                    <td>{bet.price}</td>
                    <td>{bet.stake}</td>

                    <td
                      className={
                        bet.pnl !== "--" && Number(bet.pnl) >= 0
                          ? "profit"
                          : "loss"
                      }
                    >
                      {bet.pnl !== "--"
                        ? Number(bet.pnl) >= 0
                          ? `+${bet.pnl.toFixed(2)}`
                          : bet.pnl.toFixed(2)  
                        : "--"}
                    </td>

                    <td>{bet.status}</td>
                    <td>{bet.date}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="empty">
                    No bets found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL */}
      {showModal && selectedBet && (
        <div className="modalOverlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Bet Details</h3>

            <div className="modalGrid">
              <div><b>Match:</b> {selectedBet.match}</div>
              <div><b>Selection:</b> {selectedBet.team}</div>
              <div><b>Type:</b> {selectedBet.type}</div>
              <div><b>Odds:</b> {selectedBet.price}</div>
              <div><b>Stake:</b> {selectedBet.stake}</div>
              <div><b>Status:</b> {selectedBet.status}</div>
              <div><b>Date:</b> {selectedBet.date}</div>
            </div>

            <button className="closeBtn" onClick={() => setShowModal(false)}>
              Close
            </button>
          </div>
        </div>
      )}

      {/* STYLES */}
      <style>{`
        .page {
          min-height: 100vh;
          background: #eef2f5;
          padding: 20px;
          font-family: Arial;
        }

        .container {
          max-width: 1100px;
          margin: auto;
          background: #fff;
          border-radius: 10px;
          overflow: hidden;
          box-shadow: 0 5px 20px rgba(0,0,0,0.08);
        }

        /* HEADER */
        .header {
          display: flex;
          gap: 10px;
          align-items: center;
          justify-content: space-between;
          padding: 15px;
          background: #1f3b4d;
          color: white;
        }

        .backBtn {
          background: transparent;
          border: 1px solid rgba(255,255,255,0.3);
          color: white;
          padding: 5px 10px;
          border-radius: 6px;
          cursor: pointer;
        }

        .search {
          padding: 8px 12px;
          border-radius: 6px;
          border: none;
          width: 220px;
        }

        /* FILTERS */
        .filters {
          display: flex;
          gap: 10px;
          padding: 12px;
          border-bottom: 1px solid #eee;
        }

        .filters button {
          padding: 6px 14px;
          border-radius: 20px;
          border: 1px solid #ddd;
          background: #fff;
          cursor: pointer;
        }

        .filters button.active {
          background: #1f3b4d;
          color: white;
          border-color: #1f3b4d;
        }

        /* TABLE */
        .tableWrap {
          overflow-x: auto;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          min-width: 900px;
        }

        th {
          text-align: left;
          background: #f4f6f8;
          padding: 12px;
          font-size: 12px;
          color: #555;
        }

        td {
          padding: 12px;
          border-bottom: 1px solid #eee;
          font-size: 13px;
        }

        tr:hover {
          background: #f9fbff;
          cursor: pointer;
        }

        .match {
          font-size: 12px;
          color: #777;
        }

        .team {
          font-weight: bold;
        }

        .badge {
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 11px;
          color: white;
        }

        .badge.back { background: #2196f3; }
        .badge.lay { background: #f44336; }

        .profit { color: green; font-weight: bold; }
        .loss { color: red; font-weight: bold; }

        .empty {
          text-align: center;
          padding: 30px;
          color: #999;
        }

        /* MODAL */
        .modalOverlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .modal {
          background: white;
          padding: 20px;
          width: 360px;
          border-radius: 10px;
        }

        .modalGrid {
          display: grid;
          gap: 8px;
          margin: 15px 0;
          font-size: 13px;
        }

        .closeBtn {
          width: 100%;
          padding: 8px;
          background: #1f3b4d;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
};

export default MyBets;