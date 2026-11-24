import React, { useEffect, useState } from "react";
import { ArrowUpRight, ArrowDownLeft, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";
import { fetchChipTransactions } from "../../services/Chipservice";

const ChipTransactions = () => {
  const [data, setData]       = useState([]);
  const [total, setTotal]     = useState(0);
  const [page, setPage]       = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const LIMIT = 20;

  const load = async (p = 1) => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchChipTransactions({ page: p, limit: LIMIT });
      setData(res.data);
      setTotal(res.total);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load transactions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(page); }, [page]);

  const totalPages = Math.ceil(total / LIMIT);

  const fmt = (n) =>
    Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const fmtDate = (d) =>
    new Date(d).toLocaleString("en-IN", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });

  return (
    <div style={s.page}>
      {/* Header */}
      <div style={s.header}>
        <div>
          <h1 style={s.pageTitle}>Chip Transactions</h1>
          <p style={s.pageSub}>Full history of chip transfers — sent and received</p>
        </div>
        <button style={s.refreshBtn} onClick={() => load(page)}>
          <RefreshCw size={13} />
          Refresh
        </button>
      </div>

      {/* Summary bar */}
      <div style={s.summaryBar}>
        <span style={s.summaryText}>
          {total} total transaction{total !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Table */}
      <div style={s.card}>
        {/* Table header */}
        <div style={{ ...s.row, ...s.rowHead }}>
          <span>Type</span>
          <span>Direction</span>
          <span>From</span>
          <span>To</span>
          <span>Amount</span>
          <span>Balance After</span>
          <span>Remark</span>
          <span>Date</span>
        </div>

        {loading ? (
          <div style={s.centered}>
            <RefreshCw size={18} style={{ color: "#b0aea6", animation: "spin 1s linear infinite" }} />
            <span style={{ color: "#b0aea6", fontSize: "13px", marginLeft: "8px" }}>Loading...</span>
          </div>
        ) : error ? (
          <div style={s.centered}>
            <span style={{ color: "#c0392b", fontSize: "13px" }}>{error}</span>
          </div>
        ) : data.length === 0 ? (
          <div style={s.centered}>
            <span style={{ color: "#b0aea6", fontSize: "13px" }}>No transactions found</span>
          </div>
        ) : (
          data.map((tx) => (
            <div key={tx.id} style={s.row}>
              {/* Type */}
              <span>
                <span style={{
                  ...s.badge,
                  background: tx.type === "give" ? "#e8f5e9" : "#fdf2f2",
                  color:      tx.type === "give" ? "#2d6a4f" : "#c0392b",
                }}>
                  {tx.type === "give" ? "GIVE" : "TAKE"}
                </span>
              </span>

              {/* Direction */}
              <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                {tx.direction === "sent" ? (
                  <><ArrowUpRight size={13} color="#c0392b" /><span style={{ color: "#c0392b", fontSize: "11px" }}>Sent</span></>
                ) : (
                  <><ArrowDownLeft size={13} color="#2d6a4f" /><span style={{ color: "#2d6a4f", fontSize: "11px" }}>Received</span></>
                )}
              </span>

              {/* From */}
              <span>
                <div style={s.userCell}>
                  <div style={s.userCellAvatar}>
                    {tx.from.username?.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div style={s.userCellName}>{tx.from.username}</div>
                    <div style={s.userCellRole}>{tx.from.role}</div>
                  </div>
                </div>
              </span>

              {/* To */}
              <span>
                <div style={s.userCell}>
                  <div style={s.userCellAvatar}>
                    {tx.to.username?.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div style={s.userCellName}>{tx.to.username}</div>
                    <div style={s.userCellRole}>{tx.to.role}</div>
                  </div>
                </div>
              </span>

              {/* Amount */}
              <span style={{ ...s.mono, fontWeight: 600, color: "#111110" }}>
                ₹ {fmt(tx.amount)}
              </span>

              {/* Balance after */}
              <span style={{ ...s.mono, color: "#2d6a4f" }}>
                ₹ {fmt(tx.myBalanceAfter)}
              </span>

              {/* Remark */}
              <span style={{ fontSize: "11px", color: "#7a7870", fontStyle: tx.remark ? "normal" : "italic" }}>
                {tx.remark || "—"}
              </span>

              {/* Date */}
              <span style={{ ...s.mono, fontSize: "11px", color: "#b0aea6" }}>
                {fmtDate(tx.createdAt)}
              </span>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={s.pagination}>
          <button
            style={{ ...s.pageBtn, ...(page <= 1 ? s.pageBtnDisabled : {}) }}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
          >
            <ChevronLeft size={14} />
            Prev
          </button>

          <span style={s.pageInfo}>
            Page {page} of {totalPages} — {total} records
          </span>

          <button
            style={{ ...s.pageBtn, ...(page >= totalPages ? s.pageBtnDisabled : {}) }}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
          >
            Next
            <ChevronRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
};

const s = {
  page:          { padding: "24px 28px", fontFamily: "'IBM Plex Sans', sans-serif", maxWidth: "1200px", color: "var(--admin-body-text)" },
  header:        { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" },
  pageTitle:     { fontSize: "24px", fontWeight: 700, color: "var(--admin-heading)", margin: 0, letterSpacing: "-0.02em" },
  pageSub:       { fontSize: "12px", color: "var(--admin-muted-text)", marginTop: "4px", fontFamily: "'IBM Plex Mono', monospace" },
  refreshBtn:    { display: "flex", alignItems: "center", gap: "6px", padding: "8px 14px", borderRadius: "8px", border: "1px solid var(--admin-border)", background: "var(--admin-secondary-btn)", fontSize: "12px", cursor: "pointer", color: "var(--admin-secondary-text)", fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: 600 },
  summaryBar:    { marginBottom: "14px" },
  summaryText:   { fontSize: "12px", color: "var(--admin-muted-text)", fontFamily: "'IBM Plex Mono', monospace" },
  card:          { background: "var(--admin-card-bg)", border: "1px solid var(--admin-border)", borderRadius: "12px", overflow: "hidden", boxShadow: "0 2px 10px rgba(0,0,0,0.06)" },
  rowHead:       { background: "var(--admin-sidebar-bg)", fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", color: "var(--admin-muted-text)", letterSpacing: "0.06em", fontWeight: 600, textTransform: "uppercase" },
  row:           { display: "grid", gridTemplateColumns: "80px 90px 160px 160px 120px 130px 1fr 150px", padding: "12px 16px", borderBottom: "1px solid var(--admin-border)", fontSize: "12px", color: "var(--admin-body-text)", alignItems: "center", gap: "8px" },
  mono:          { fontFamily: "'IBM Plex Mono', monospace", fontSize: "12px", color: "var(--admin-heading)" },
  badge:         { padding: "3px 8px", borderRadius: "5px", fontSize: "10px", fontFamily: "'IBM Plex Mono', monospace", fontWeight: 600 },
  userCell:      { display: "flex", alignItems: "center", gap: "8px" },
  userCellAvatar:{ width: "26px", height: "26px", borderRadius: "6px", background: "var(--admin-primary-btn)", color: "var(--admin-btn-text)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'IBM Plex Mono', monospace", fontSize: "9px", fontWeight: 600, flexShrink: 0 },
  userCellName:  { fontSize: "12px", fontWeight: 600, color: "var(--admin-heading)", lineHeight: 1.2 },
  userCellRole:  { fontSize: "9px", color: "var(--admin-muted-text)", fontFamily: "'IBM Plex Mono', monospace" },
  centered:      { display: "flex", alignItems: "center", justifyContent: "center", padding: "48px", gap: "8px" },
  pagination:    { display: "flex", alignItems: "center", justifyContent: "center", gap: "16px", marginTop: "18px" },
  pageBtn:       { display: "flex", alignItems: "center", gap: "5px", padding: "8px 14px", borderRadius: "8px", border: "1px solid var(--admin-border)", background: "var(--admin-card-bg)", fontSize: "12px", cursor: "pointer", color: "var(--admin-body-text)", fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: 600 },
  pageBtnDisabled:{ opacity: 0.4, cursor: "not-allowed" },
  pageInfo:      { fontSize: "12px", color: "var(--admin-muted-text)", fontFamily: "'IBM Plex Mono', monospace", fontWeight: 600 },
};

export default ChipTransactions;