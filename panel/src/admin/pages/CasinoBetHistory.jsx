import { useState, useEffect, useCallback, useRef } from "react";
import { fetchCasinoBetHistory } from "../services/adminCasinoHistory";

const RESULT_OPTIONS = ["", "WIN", "LOSS", "PENDING"];

const formatMoney = (n) =>
  Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 });

const formatDate = (d) =>
  d ? new Date(d).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "-";

const RESULT_STYLES = {
  WIN:     { color: "var(--admin-success)", background: "var(--admin-success-bg)", border: "var(--admin-success)" },
  LOSS:    { color: "var(--admin-danger)", background: "var(--admin-danger-bg)", border: "var(--admin-danger)" },
  PENDING: { color: "var(--admin-warning)", background: "var(--admin-warning-bg)", border: "var(--admin-warning)" },
};

const ResultBadge = ({ result }) => {
  const s = RESULT_STYLES[result] || { color: "#7a7870", background: "#f0efea", border: "#e8e6de" };
  return (
    <span
      style={{
        ...styles.badge,
        color: s.color,
        background: s.background,
        border: `1px solid ${s.border}`,
      }}
    >
      {result}
    </span>
  );
};

export default function CasinoBetHistory() {
  const [history, setHistory] = useState([]);
  const [summary, setSummary] = useState({ totalBets: 0, totalWins: 0, totalTransactions: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [page, setPage] = useState(1);
  const [limit] = useState(50);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [filters, setFilters] = useState({
    result: "",
    gameUid: "",
    username: "",
    startDate: "",
    endDate: "",
  });

  const debounceRef = useRef(null);

  const loadHistory = useCallback(async (params) => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchCasinoBetHistory(params);
      setHistory(data.history || []);
      setSummary(data.summary || { totalBets: 0, totalWins: 0, totalTransactions: 0 });
      setTotalPages(data.totalPages || 1);
      setTotal(data.total || 0);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load bet history");
      setHistory([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHistory({ page, limit, ...filters });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPage(1);
      loadHistory({ page: 1, limit, ...filters, [key]: value });
    }, 400);
  };

  const clearFilters = () => {
    const cleared = { result: "", gameUid: "", username: "", startDate: "", endDate: "" };
    setFilters(cleared);
    setPage(1);
    loadHistory({ page: 1, limit, ...cleared });
  };

  const net = (summary.totalWins || 0) - (summary.totalBets || 0);

  return (
    <div style={styles.page}>
      <div style={styles.headerRow}>
        <h1 style={styles.title}>Casino Bet History</h1>
      </div>

      {/* Summary cards */}
      <div style={styles.summaryGrid}>
        <SummaryCard label="Total Transactions" value={summary.totalTransactions?.toLocaleString("en-IN")} />
        <SummaryCard label="Total Bet Amount" value={formatMoney(summary.totalBets)} />
        <SummaryCard label="Total Win Amount" value={formatMoney(summary.totalWins)} />
        <SummaryCard
          label="Net (House P/L)"
          value={formatMoney(net)}
          valueColor={net >= 0 ? "#2d6a4f" : "#c0392b"}
        />
      </div>

      {/* Filters */}
      <div style={styles.filterBar}>
        <FilterField label="Username">
          <input
            type="text"
            placeholder="Search username"
            value={filters.username}
            onChange={(e) => handleFilterChange("username", e.target.value)}
            style={{ ...styles.input, width: "160px" }}
          />
        </FilterField>

        <FilterField label="Result">
          <select
            value={filters.result}
            onChange={(e) => handleFilterChange("result", e.target.value)}
            style={{ ...styles.input, width: "120px" }}
          >
            {RESULT_OPTIONS.map((r) => (
              <option key={r} value={r}>
                {r || "All"}
              </option>
            ))}
          </select>
        </FilterField>

        <FilterField label="Game UID">
          <input
            type="text"
            placeholder="e.g. 737"
            value={filters.gameUid}
            onChange={(e) => handleFilterChange("gameUid", e.target.value)}
            style={{ ...styles.input, width: "100px" }}
          />
        </FilterField>

        <FilterField label="From">
          <input
            type="date"
            value={filters.startDate}
            onChange={(e) => handleFilterChange("startDate", e.target.value)}
            style={styles.input}
          />
        </FilterField>

        <FilterField label="To">
          <input
            type="date"
            value={filters.endDate}
            onChange={(e) => handleFilterChange("endDate", e.target.value)}
            style={styles.input}
          />
        </FilterField>

        <button onClick={clearFilters} style={styles.clearBtn}>
          Clear filters
        </button>
      </div>

      {/* Table */}
      <div style={styles.tableCard}>
        <div style={styles.tableScroll}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={{ ...styles.th, textAlign: "left" }}>User</th>
                <th style={{ ...styles.th, textAlign: "left" }}>Game</th>
                <th style={{ ...styles.th, textAlign: "left" }}>Round</th>
                <th style={{ ...styles.th, textAlign: "right" }}>Bet</th>
                <th style={{ ...styles.th, textAlign: "right" }}>Win</th>
                <th style={{ ...styles.th, textAlign: "right" }}>Balance After</th>
                <th style={{ ...styles.th, textAlign: "center" }}>Result</th>
                <th style={{ ...styles.th, textAlign: "left" }}>Played At</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} style={styles.emptyCell}>Loading...</td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={8} style={{ ...styles.emptyCell, color: "#c0392b" }}>{error}</td>
                </tr>
              ) : history.length === 0 ? (
                <tr>
                  <td colSpan={8} style={styles.emptyCell}>No bet history found</td>
                </tr>
              ) : (
                history.map((tx) => (
                  <tr key={tx._id || tx.id} style={styles.tr}>
                    <td style={styles.td}>
                      <div style={styles.userName}>{tx.userId?.username || "-"}</div>
                      <div style={styles.userRole}>{tx.userId?.role}</div>
                    </td>
                    <td style={styles.td}>{tx.gameName || tx.gameUid}</td>
                    <td style={{ ...styles.td, color: "#7a7870" }}>{tx.gameRound}</td>
                    <td style={{ ...styles.td, textAlign: "right" }}>{formatMoney(tx.betAmount)}</td>
                    <td style={{ ...styles.td, textAlign: "right" }}>{formatMoney(tx.winAmount)}</td>
                    <td style={{ ...styles.td, textAlign: "right" }}>{formatMoney(tx.balanceAfter)}</td>
                    <td style={{ ...styles.td, textAlign: "center" }}>
                      <ResultBadge result={tx.result} />
                    </td>
                    <td style={{ ...styles.td, color: "#7a7870" }}>{formatDate(tx.createdAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div style={styles.pagination}>
          <span style={styles.paginationText}>
            Showing page {page} of {totalPages} ({total.toLocaleString("en-IN")} total)
          </span>
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              style={{ ...styles.pageBtn, ...(page <= 1 ? styles.pageBtnDisabled : {}) }}
            >
              Prev
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              style={{ ...styles.pageBtn, ...(page >= totalPages ? styles.pageBtnDisabled : {}) }}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function FilterField({ label, children }) {
  return (
    <div style={styles.filterField}>
      <label style={styles.filterLabel}>{label}</label>
      {children}
    </div>
  );
}

function SummaryCard({ label, value, valueColor = "#111110" }) {
  return (
    <div style={styles.summaryCard}>
      <div style={styles.summaryLabel}>{label}</div>
      <div style={{ ...styles.summaryValue, color: valueColor }}>{value ?? "-"}</div>
    </div>
  );
}

const styles = {
  page: {
    padding: "24px 28px",
    display: "flex",
    flexDirection: "column",
    gap: "20px",
    fontFamily: "'IBM Plex Sans', sans-serif",
    background: "var(--admin-page-bg)",
    minHeight: "100vh",
    color: "var(--admin-body-text)",
  },
  headerRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    fontSize: "24px",
    fontWeight: 700,
    color: "var(--admin-heading)",
    margin: 0,
    letterSpacing: "-0.02em",
  },

  // Summary cards
  summaryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "14px",
  },
  summaryCard: {
    background: "var(--admin-card-bg)",
    border: "1px solid var(--admin-border)",
    borderRadius: "12px",
    padding: "16px 18px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
  },
  summaryLabel: {
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: "10px",
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    color: "var(--admin-muted-text)",
    marginBottom: "6px",
    fontWeight: 600,
  },
  summaryValue: {
    fontSize: "20px",
    fontWeight: 700,
    color: "var(--admin-heading)",
  },

  // Filters
  filterBar: {
    background: "var(--admin-card-bg)",
    border: "1px solid var(--admin-border)",
    borderRadius: "12px",
    padding: "16px",
    display: "flex",
    flexWrap: "wrap",
    gap: "12px",
    alignItems: "flex-end",
    boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
  },
  filterField: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  filterLabel: {
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: "10px",
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    color: "var(--admin-muted-text)",
    fontWeight: 600,
  },
  input: {
    border: "1px solid var(--admin-input-border)",
    borderRadius: "8px",
    padding: "8px 12px",
    fontSize: "13px",
    fontFamily: "'IBM Plex Sans', sans-serif",
    color: "var(--admin-body-text)",
    outline: "none",
    background: "var(--admin-input-bg)",
  },
  clearBtn: {
    marginLeft: "auto",
    padding: "8px 16px",
    fontSize: "13px",
    borderRadius: "8px",
    border: "1px solid var(--admin-border)",
    background: "var(--admin-secondary-btn)",
    color: "var(--admin-secondary-text)",
    cursor: "pointer",
    fontFamily: "'IBM Plex Sans', sans-serif",
    fontWeight: 600,
  },

  // Table
  tableCard: {
    background: "var(--admin-card-bg)",
    border: "1px solid var(--admin-border)",
    borderRadius: "12px",
    overflow: "hidden",
    boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
  },
  tableScroll: {
    overflowX: "auto",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "13px",
  },
  th: {
    background: "var(--admin-sidebar-bg)",
    color: "var(--admin-muted-text)",
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: "10px",
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    padding: "12px 16px",
    borderBottom: "1px solid var(--admin-border)",
    fontWeight: 600,
  },
  tr: {
    borderBottom: "1px solid var(--admin-border)",
  },
  td: {
    padding: "12px 16px",
    color: "var(--admin-body-text)",
  },
  userName: {
    fontWeight: 600,
    color: "var(--admin-heading)",
  },
  userRole: {
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: "10px",
    color: "var(--admin-muted-text)",
    marginTop: "2px",
  },
  badge: {
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: "10px",
    fontWeight: 600,
    letterSpacing: "0.04em",
    padding: "3px 9px",
    borderRadius: "999px",
    display: "inline-block",
  },
  emptyCell: {
    textAlign: "center",
    padding: "40px 0",
    color: "var(--admin-muted-text)",
    fontSize: "13px",
  },

  // Pagination
  pagination: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "14px 18px",
    borderTop: "1px solid var(--admin-border)",
  },
  paginationText: {
    fontSize: "12px",
    color: "var(--admin-muted-text)",
    fontFamily: "'IBM Plex Mono', monospace",
    fontWeight: 600,
  },
  pageBtn: {
    padding: "7px 16px",
    fontSize: "12px",
    borderRadius: "8px",
    border: "1px solid var(--admin-border)",
    background: "var(--admin-card-bg)",
    color: "var(--admin-body-text)",
    cursor: "pointer",
    fontFamily: "'IBM Plex Sans', sans-serif",
    fontWeight: 600,
  },
  pageBtnDisabled: {
    opacity: 0.4,
    cursor: "not-allowed",
  },
};