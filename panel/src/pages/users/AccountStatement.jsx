import React, { useEffect, useMemo, useState } from "react";
import { getAccountStatement } from "../../services/transaction.js";

const AccountStatement = () => {
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  const [activeType, setActiveType] = useState("all");
  const [activeStatus, setActiveStatus] = useState("all");
  const [search, setSearch] = useState("");

  const fetchStatement = async () => {
    try {
      const res = await getAccountStatement();
      setTransactions(res.transactions || []);
      setFilteredTransactions(res.transactions || []);
    } catch (err) {
      console.error(err);
      alert("Failed to fetch account statement");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatement();
  }, []);

  useEffect(() => {
    let filtered = [...transactions];

    if (activeType !== "all") {
      filtered = filtered.filter((txn) => txn.type === activeType);
    }

    if (activeStatus !== "all") {
      filtered = filtered.filter((txn) => txn.status === activeStatus);
    }

    if (search.trim()) {
      filtered = filtered.filter((txn) => {
        const value = txn.transactionId || txn.upiId || txn.price || txn.amount;
        return String(value).toLowerCase().includes(search.toLowerCase());
      });
    }

    setFilteredTransactions(filtered);
  }, [transactions, activeType, activeStatus, search]);

  const totalDeposit = useMemo(() => {
    return transactions
      .filter((t) => t.type === "deposit" && t.status === "approved")
      .reduce((acc, item) => acc + Number(item.price || 0), 0);
  }, [transactions]);

  const totalWithdraw = useMemo(() => {
    return transactions
      .filter((t) => t.type === "withdraw" && t.status === "approved")
      .reduce((acc, item) => acc + Number(item.amount || 0), 0);
  }, [transactions]);

  return (
    <>
      <div className="statement-page">

        {/* HEADER */}
        <div className="statement-header">
          <h1>Account statement</h1>
          <p>Track all your deposits and withdrawals</p>
        </div>

        {/* SUMMARY */}
        <div className="summary-row">
          <div className="summary-box deposit">
            <span className="summary-label">Deposited</span>
            <h2>₹{totalDeposit.toFixed(2)}</h2>
          </div>
          <div className="summary-box withdraw">
            <span className="summary-label">Withdrawn</span>
            <h2>₹{totalWithdraw.toFixed(2)}</h2>
          </div>
          <div className="summary-box">
            <span className="summary-label">Transactions</span>
            <h2>{transactions.length}</h2>
          </div>
        </div>

        {/* FILTERS */}
        <div className="filters">
          <div className="filter-tabs">
            <button
              className={activeType === "all" ? "active" : ""}
              onClick={() => setActiveType("all")}
            >
              All
            </button>
            <button
              className={activeType === "deposit" ? "active" : ""}
              onClick={() => setActiveType("deposit")}
            >
              Deposit
            </button>
            <button
              className={activeType === "withdraw" ? "active" : ""}
              onClick={() => setActiveType("withdraw")}
            >
              Withdraw
            </button>
          </div>

          <div className="right-filters">
            <select
              value={activeStatus}
              onChange={(e) => setActiveStatus(e.target.value)}
            >
              <option value="all">All status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>

            <input
              type="text"
              placeholder="Search…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* CONTENT */}
        {loading ? (
          <div className="empty-box">Loading transactions…</div>
        ) : filteredTransactions.length === 0 ? (
          <div className="empty-box">No transactions found</div>
        ) : (
          <div className="transactions-list">
            {filteredTransactions.map((txn) => {
  const isAdminCredit = txn.method === "admin_chip_transfer";

  return (
    <div className="txn-item" key={txn._id}>
      <div className="txn-left">
        <div className={`txn-icon ${txn.type === "deposit" ? "deposit" : "withdraw"}`}>
          {txn.type === "deposit" ? "↓" : "↑"}
        </div>
        <div className="txn-details">
          <p className="txn-name">
            {isAdminCredit
              ? "Added by Admin"
              : txn.type === "deposit"
                ? "Deposit"
                : "Withdraw"}
          </p>
          <p className="txn-meta">
            {new Date(txn.createdAt).toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}
            {!isAdminCredit && (txn.transactionId || txn.upiId) && (
              <> · {txn.transactionId || txn.upiId}</>
            )}
          </p>
        </div>
      </div>

      <div className="txn-right">
        <p className={`txn-amount ${txn.type === "deposit" ? "deposit" : "withdraw"}`}>
          {txn.type === "deposit" ? "+" : "−"}₹{txn.price || txn.amount}
        </p>
        <span className={`status-pill ${txn.status}`}>
          {isAdminCredit ? "admin credit" : txn.status}
        </span>
        {/* ✅ only show receipt link for real user-submitted deposits —
            admin credits have no screenshot */}
        {txn.type === "deposit" && !isAdminCredit && txn.paymentScreenshotUrl && (
          <a
            href={txn.paymentScreenshotUrl}
            target="_blank"
            rel="noreferrer"
            className="txn-link"
          >
            View receipt
          </a>
        )}
      </div>
    </div>
  );
})}
          </div>
        )}
      </div>

      <style>{`
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        .statement-page {
          min-height: 100vh;
          background: #f4f4f2;
          padding: 20px 16px;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }

        /* HEADER */
        .statement-header {
          margin-bottom: 20px;
        }

        .statement-header h1 {
          font-size: 18px;
          font-weight: 500;
          color: #111;
          letter-spacing: -0.2px;
        }

        .statement-header p {
          margin-top: 3px;
          font-size: 13px;
          color: #888;
        }

        /* SUMMARY */
        .summary-row {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 8px;
          margin-bottom: 18px;
        }

        .summary-box {
          background: #fff;
          border: 0.5px solid #e0e0dc;
          border-radius: 10px;
          padding: 12px 14px;
        }

        .summary-label {
          font-size: 10px;
          color: #999;
          text-transform: uppercase;
          letter-spacing: 0.6px;
          display: block;
        }

        .summary-box h2 {
          margin-top: 6px;
          font-size: 17px;
          font-weight: 500;
          color: #111;
        }

        .summary-box.deposit h2 {
          color: #1a7a42;
        }

        .summary-box.withdraw h2 {
          color: #b03030;
        }

        /* FILTERS */
        .filters {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          margin-bottom: 14px;
          flex-wrap: wrap;
        }

        .filter-tabs {
          display: flex;
          gap: 2px;
          background: #ebebea;
          border-radius: 8px;
          padding: 3px;
          border: 0.5px solid #e0e0dc;
        }

        .filter-tabs button {
          border: none;
          padding: 5px 14px;
          border-radius: 6px;
          background: transparent;
          cursor: pointer;
          font-size: 12px;
          font-weight: 400;
          color: #666;
          transition: background 0.15s, color 0.15s;
        }

        .filter-tabs button.active {
          background: #fff;
          color: #111;
          font-weight: 500;
          box-shadow: 0 0 0 0.5px #d8d8d4;
        }

        .right-filters {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .right-filters select,
        .right-filters input {
          height: 32px;
          border-radius: 8px;
          border: 0.5px solid #d8d8d4;
          padding: 0 10px;
          background: #fff;
          outline: none;
          font-size: 12px;
          color: #333;
          min-width: 130px;
          appearance: auto;
        }

        .right-filters input::placeholder {
          color: #bbb;
        }

        /* TRANSACTIONS LIST */
        .transactions-list {
          display: flex;
          flex-direction: column;
          gap: 1px;
          background: #e0e0dc;
          border-radius: 12px;
          overflow: hidden;
          border: 0.5px solid #e0e0dc;
        }

        .txn-item {
          background: #fff;
          padding: 13px 14px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          transition: background 0.1s;
        }

        .txn-item:hover {
          background: #fafaf9;
        }

        .txn-left {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .txn-icon {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          flex-shrink: 0;
        }

        .txn-icon.deposit {
          background: #edf7f2;
          color: #1a7a42;
        }

        .txn-icon.withdraw {
          background: #fdf0f0;
          color: #b03030;
        }

        .txn-name {
          font-size: 13px;
          font-weight: 500;
          color: #111;
        }

        .txn-meta {
          font-size: 11px;
          color: #aaa;
          margin-top: 2px;
        }

        .txn-right {
          text-align: right;
          flex-shrink: 0;
        }

        .txn-amount {
          font-size: 14px;
          font-weight: 500;
          color: #111;
        }

        .txn-amount.deposit {
          color: #ffffff;
        }

        .txn-amount.withdraw {
          color: #ffffff;
        }

        /* STATUS PILLS */
        .status-pill {
          display: inline-block;
          margin-top: 4px;
          padding: 2px 8px;
          border-radius: 999px;
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 0.2px;
          text-transform: lowercase;
        }

        .status-pill.pending {
          background: #fef9ec;
          color: #92611a;
          border: 0.5px solid #f4d98a;
        }

        .status-pill.approved {
          background: #edf7f2;
          color: #1a7a42;
          border: 0.5px solid #a8e5bf;
        }

        .status-pill.rejected {
          background: #fdf0f0;
          color: #b03030;
          border: 0.5px solid #f4b8b8;
        }

        /* RECEIPT LINK */
        .txn-link {
          display: block;
          margin-top: 4px;
          font-size: 11px;
          color: #2563eb;
          text-decoration: none;
        }

        .txn-link:hover {
          text-decoration: underline;
        }

        /* EMPTY STATE */
        .empty-box {
          background: #fff;
          border: 0.5px solid #e0e0dc;
          border-radius: 12px;
          padding: 48px 20px;
          text-align: center;
          color: #aaa;
          font-size: 13px;
        }

        /* RESPONSIVE */
        @media (max-width: 600px) {
          .summary-row {
            grid-template-columns: 1fr 1fr;
          }

          .summary-row .summary-box:last-child {
            grid-column: span 2;
          }

          .filters {
            flex-direction: column;
            align-items: flex-start;
          }

          .right-filters {
            width: 100%;
          }

          .right-filters select,
          .right-filters input {
            flex: 1;
            min-width: 0;
          }
        }

        @media (max-width: 400px) {
          .summary-row {
            grid-template-columns: 1fr;
          }

          .summary-row .summary-box:last-child {
            grid-column: span 1;
          }

          .statement-page {
            padding: 14px 12px;
          }
        }
      `}</style>
    </>
  );
};

export default AccountStatement;