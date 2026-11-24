import React, { useState, useEffect, useRef } from "react";
import {
  fetchAccountStatement,
  fetchRoundDetails,
  fetchMatchBetDetails,
} from "../../services/accountStatementService";
import { searchUsers } from "../../services/adminUserInsightsService";

const AccountStatement = () => {
  const [filters, setFilters] = useState({
    accountType: "All",
    gameName: "All",
    clientName: "",
    from: "",
    to: "",
  });

  const [modalType, setModalType] = useState(null); // "casino" | "sports"
  const [matchData, setMatchData] = useState(null);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const [modalOpen, setModalOpen] = useState(false);
  const [roundData, setRoundData] = useState(null);
  const [roundLoading, setRoundLoading] = useState(false);
  const [betFilter, setBetFilter] = useState("All");

  // ── Username suggestions for the "Search By Client Name" field ────────
  const [clientSuggestions, setClientSuggestions] = useState([]);
  const [searchingClients, setSearchingClients] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionsDebounceRef = useRef(null);

  useEffect(() => {
    const q = filters.clientName.trim();
    clearTimeout(suggestionsDebounceRef.current);

    if (!q) {
      setClientSuggestions([]);
      setSearchingClients(false);
      return;
    }

    setSearchingClients(true);
    suggestionsDebounceRef.current = setTimeout(async () => {
      try {
        const res = await searchUsers(q);
        if (res.success) setClientSuggestions(res.users || []);
      } catch (err) {
        console.error("Username search failed:", err);
      } finally {
        setSearchingClients(false);
      }
    }, 300);

    return () => clearTimeout(suggestionsDebounceRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.clientName]);

  const selectClientSuggestion = (username) => {
    setFilters((f) => ({ ...f, clientName: username }));
    setClientSuggestions([]);
    setShowSuggestions(false);
  };

  const handleChange = (key) => (e) =>
    setFilters((f) => ({ ...f, [key]: e.target.value }));

  const handleLoad = async () => {
    if (!filters.clientName.trim()) {
      setError("Client name is required");
      return;
    }
    setError("");
    setLoading(true);
    setPage(1);
    try {
      const res = await fetchAccountStatement({
        clientName: filters.clientName.trim(),
        from: filters.from || undefined,
        to: filters.to || undefined,
        gameName: filters.gameName !== "All" ? filters.gameName : undefined,
        accountType:
          filters.accountType !== "All" ? filters.accountType : undefined,
      });
      setRows(res.data?.data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load statement");
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  const openRoundDetails = async (refId) => {
    if (!refId) return;
    setModalOpen(true);
    setModalType("casino");
    setRoundLoading(true);
    setBetFilter("All");
    try {
      const res = await fetchRoundDetails(refId, filters.clientName.trim());
      setRoundData(res.data?.data || null);
    } catch {
      setRoundData(null);
    } finally {
      setRoundLoading(false);
    }
  };

  // ── Now also takes the row's settledMinute so the modal only shows the
  // bets that this specific same-minute settlement group summarizes,
  // instead of every bet ever settled on the match. ─────────────────────
  const openMatchDetails = async (eventId, settledMinute) => {
    if (!eventId) return;
    setModalOpen(true);
    setModalType("sports");
    setRoundLoading(true);
    try {
      const res = await fetchMatchBetDetails(
        eventId,
        filters.clientName.trim(),
        settledMinute,
      );
      setMatchData(res.data?.data || null);
    } catch {
      setMatchData(null);
    } finally {
      setRoundLoading(false);
    }
  };

  const filteredRows = rows.filter((r) =>
    !search.trim()
      ? true
      : (r.description || "")
          .toLowerCase()
          .includes(search.trim().toLowerCase()),
  );

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const pagedRows = filteredRows.slice((page - 1) * pageSize, page * pageSize);

  const exportExcel = () => {
    const header = ["Date", "Credit", "Debit", "Closing", "Description"];
    const lines = [header.join(",")];
    filteredRows.forEach((r) => {
      lines.push(
        [
          new Date(r.date).toLocaleString(),
          r.credit ?? "",
          r.debit ?? "",
          r.closing ?? "",
          `"${(r.description || "").replace(/"/g, '""')}"`,
        ].join(","),
      );
    });
    const blob = new Blob([lines.join("\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filters.clientName || "statement"}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPdf = () => window.print();

  const filteredBets =
    roundData?.bets?.filter((b) => {
      if (betFilter === "All") return !b.isDeleted;
      if (betFilter === "Deleted") return b.isDeleted;
      return !b.isDeleted && b.side?.toLowerCase() === betFilter.toLowerCase();
    }) || [];

  return (
    <div style={styles.page}>
      <h2 style={styles.heading}>Account Statement</h2>

      <div style={styles.filtersCard}>
        <div style={styles.filterRow}>
          <Field label="Account Type">
            <select
              style={styles.input}
              value={filters.accountType}
              onChange={handleChange("accountType")}
            >
              <option>All</option>
              <option value="sports">Sports</option>
              <option value="casino">Casino</option>
              <option value="chip">Chip Transfer</option>
              <option value="deposit">Deposit</option>
              <option value="withdraw">Withdraw</option>
            </select>
          </Field>

          <Field label="Game Name">
            <input
              style={styles.input}
              placeholder="All"
              value={filters.gameName === "All" ? "" : filters.gameName}
              onChange={(e) =>
                setFilters((f) => ({ ...f, gameName: e.target.value || "All" }))
              }
            />
          </Field>

          <Field label="Search By Client Name">
            <div style={styles.clientSearchWrap}>
              <input
                style={styles.input}
                value={filters.clientName}
                onChange={handleChange("clientName")}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setShowSuggestions(false)}
                placeholder="Enter username"
                autoComplete="off"
              />
              {showSuggestions && searchingClients && (
                <div style={styles.clientSearchHint}>Searching…</div>
              )}
              {showSuggestions && clientSuggestions.length > 0 && (
                <div style={styles.clientSearchResults}>
                  {clientSuggestions.map((u) => (
                    <div
                      key={u._id}
                      style={styles.clientSearchResultRow}
                      // onMouseDown (not onClick) — fires before the
                      // input's onBlur, so the click actually registers
                      // instead of the dropdown closing first.
                      onMouseDown={() => selectClientSuggestion(u.username)}
                    >
                      <div style={styles.clientSearchUsername}>
                        {u.username}
                      </div>
                      <div style={styles.clientSearchSub}>
                        {u.email || u.phone || "—"}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Field>
        </div>

        <div style={styles.filterRow}>
          <Field label="From">
            <input
              type="date"
              style={styles.input}
              value={filters.from}
              onChange={handleChange("from")}
            />
          </Field>
          <Field label="To">
            <input
              type="date"
              style={styles.input}
              value={filters.to}
              onChange={handleChange("to")}
            />
          </Field>
        </div>

        {error && <p style={styles.errorText}>{error}</p>}

        <button style={styles.loadBtn} onClick={handleLoad} disabled={loading}>
          {loading ? "Loading..." : "Load"}
        </button>
      </div>

      {rows.length > 0 && (
        <div style={styles.tableCard}>
          <div style={styles.tableToolbar}>
            <div style={{ display: "flex", gap: "8px" }}>
              <button style={styles.pdfBtn} onClick={exportPdf}>
                PDF
              </button>
              <button style={styles.excelBtn} onClick={exportExcel}>
                Excel
              </button>
            </div>
            <input
              style={styles.searchInput}
              placeholder="Search..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={styles.table}>
              <thead>
                <tr>
                  {["Date", "Credit", "Debit", "Closing", "Description"].map(
                    (h) => (
                      <th key={h} style={styles.th}>
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {pagedRows.map((r, i) => (
                  <tr key={i} style={i % 2 ? styles.rowAlt : undefined}>
                    <td style={styles.td}>
                      {new Date(r.date).toLocaleString()}
                    </td>
                    <td style={{ ...styles.td, color: "#2d6a4f" }}>
                      {r.credit ? r.credit.toLocaleString() : ""}
                    </td>
                    <td style={{ ...styles.td, color: "#c0392b" }}>
                      {r.debit ? r.debit.toLocaleString() : ""}
                    </td>
                    <td style={styles.td}>{r.closing?.toLocaleString()}</td>
                    <td style={styles.td}>
                      {r.source === "casino" ? (
                        <button
                          style={styles.descBtn}
                          onClick={() => openRoundDetails(r.refId)}
                        >
                          {r.description}
                        </button>
                      ) : r.source === "sports" ? (
                        <button
                          style={styles.descBtn}
                          onClick={() =>
                            openMatchDetails(r.refId, r.settledMinute)
                          }
                        >
                          {r.description}
                        </button>
                      ) : (
                        <span style={styles.descTag}>{r.description}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={styles.pagination}>
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                style={page === i + 1 ? styles.pageBtnActive : styles.pageBtn}
                onClick={() => setPage(i + 1)}
              >
                {i + 1}
              </button>
            ))}
          </div>
        </div>
      )}

      {modalOpen && (
        <div style={styles.modalOverlay} onClick={() => setModalOpen(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={{ margin: 0, fontSize: "15px" }}>Details</h3>
              <button
                style={styles.closeBtn}
                onClick={() => setModalOpen(false)}
              >
                ✕
              </button>
            </div>

            {roundLoading ? (
              <p style={{ padding: "20px" }}>Loading...</p>
            ) : modalType === "casino" ? (
              !roundData ? (
                <p style={{ padding: "20px" }}>No data found.</p>
              ) : (
                <>
                  <div style={styles.modalMeta}>
                    <span>Round-ID: {roundData.roundId}</span>
                    <span>
                      Match Time:{" "}
                      {new Date(roundData.matchTime).toLocaleString()}
                    </span>
                  </div>
                  <div style={styles.modalSummary}>
                    <span>Total Bets: {roundData.totalBets}</span>
                    <span>
                      Total Win: {roundData.totalWin?.toLocaleString()}
                    </span>
                  </div>
                  <div style={styles.filterTabs}>
                    {["All", "Back", "Lay", "Deleted"].map((f) => (
                      <button
                        key={f}
                        style={betFilter === f ? styles.tabActive : styles.tab}
                        onClick={() => setBetFilter(f)}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                  <div style={{ overflowX: "auto" }}>
                    <table style={styles.table}>
                      <thead>
                        <tr>
                          {[
                            "Username",
                            "Nation",
                            "Rate",
                            "Amount",
                            "Win",
                            "Date",
                            "IP",
                          ].map((h) => (
                            <th key={h} style={styles.th}>
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filteredBets.map((b, i) => (
                          <tr key={i}>
                            <td style={styles.td}>{b.username}</td>
                            <td style={styles.td}>{b.nation}</td>
                            <td style={styles.td}>{b.rate}</td>
                            <td style={styles.td}>
                              {b.amount?.toLocaleString()}
                            </td>
                            <td
                              style={{
                                ...styles.td,
                                color: b.win >= 0 ? "#2d6a4f" : "#c0392b",
                              }}
                            >
                              {b.win?.toLocaleString()}
                            </td>
                            <td style={styles.td}>
                              {new Date(b.date).toLocaleString()}
                            </td>
                            <td style={styles.td}>{b.ip}</td>
                            <td style={styles.td}>
                              {b.overAtPlacement ? (
                                <span style={styles.lineBadge}>
                                  {b.overAtPlacement}
                                </span>
                              ) : (
                                "-"
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )
            ) : !matchData ? (
              <p style={{ padding: "20px" }}>No data found.</p>
            ) : (
              <>
                <div style={styles.modalMeta}>
                  <span>
                    {matchData.sport} / {matchData.matchName}
                  </span>
                  <span>Event ID: {matchData.eventId}</span>
                </div>
                <div style={styles.modalSummary}>
                  <span>Total Bets: {matchData.totalBets}</span>
                  <span>
                    Total Stake: {matchData.totalStake?.toLocaleString()}
                  </span>
                  <span>
                    Net P/L: {matchData.totalProfitLoss?.toLocaleString()}
                  </span>
                </div>
                <div style={{ overflowX: "auto" }}>
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        {[
                          "Selection",
                          "Side",
                          "Rate",
                          "Line",
                          "Stake",
                          "Liability",
                          "Status",
                          "P/L",
                          "Settled At",
                        ].map((h) => (
                          <th key={h} style={styles.th}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {matchData.bets.map((b, i) => (
                        <tr key={i}>
                          <td style={styles.td}>{b.selectionName}</td>
                          <td
                            style={{
                              ...styles.td,
                              textTransform: "capitalize",
                            }}
                          >
                            {b.side}
                          </td>
                          <td style={styles.td}>{b.rate}</td>
                          <td style={styles.td}>{b.line ?? "-"}</td>
                          <td style={styles.td}>{b.stake?.toLocaleString()}</td>
                          <td style={styles.td}>
                            {b.liability?.toLocaleString()}
                          </td>
                          <td style={styles.td}>{b.status}</td>
                          <td
                            style={{
                              ...styles.td,
                              color: b.profitLoss >= 0 ? "#2d6a4f" : "#c0392b",
                            }}
                          >
                            {b.profitLoss?.toLocaleString()}
                          </td>
                          <td style={styles.td}>
                            {new Date(b.settledAt).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const Field = ({ label, children }) => (
  <div
    style={{ display: "flex", flexDirection: "column", gap: "4px", flex: 1 }}
  >
    <label style={styles.label}>{label}</label>
    {children}
  </div>
);

const styles = {
  page: {
    padding: "24px 28px",
    fontFamily: "'IBM Plex Sans', sans-serif",
    color: "var(--admin-body-text)",
    background: "var(--admin-page-bg)",
    minHeight: "100vh",
  },
  heading: { fontSize: "24px", fontWeight: 700, marginBottom: "20px", color: "var(--admin-heading)", letterSpacing: "-0.02em" },
  filtersCard: {
    background: "var(--admin-card-bg)",
    border: "1px solid var(--admin-border)",
    borderRadius: "12px",
    padding: "20px",
    marginBottom: "20px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
  },
  filterRow: { display: "flex", gap: "16px", marginBottom: "12px" },
  label: {
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: "10px",
    letterSpacing: "0.06em",
    color: "var(--admin-muted-text)",
    textTransform: "uppercase",
    fontWeight: 600,
  },
  input: {
    padding: "9px 12px",
    borderRadius: "8px",
    border: "1px solid var(--admin-input-border)",
    fontSize: "13px",
    fontFamily: "'IBM Plex Sans', sans-serif",
    background: "var(--admin-input-bg)",
    color: "var(--admin-body-text)",
    outline: "none",
  },
  errorText: { color: "var(--admin-danger)", fontSize: "12px", marginBottom: "8px" },
  loadBtn: {
    background: "var(--admin-primary-btn)",
    color: "var(--admin-btn-text)",
    border: "none",
    borderRadius: "8px",
    padding: "10px 22px",
    fontSize: "13px",
    fontWeight: 600,
    cursor: "pointer",
  },
  tableCard: {
    background: "var(--admin-card-bg)",
    border: "1px solid var(--admin-border)",
    borderRadius: "12px",
    padding: "20px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
  },
  tableToolbar: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "14px",
  },
  pdfBtn: {
    background: "var(--admin-danger)",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    padding: "7px 16px",
    fontSize: "12px",
    cursor: "pointer",
    fontWeight: 600,
  },
  excelBtn: {
    background: "var(--admin-success)",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    padding: "7px 16px",
    fontSize: "12px",
    cursor: "pointer",
    fontWeight: 600,
  },
  searchInput: {
    padding: "8px 12px",
    borderRadius: "8px",
    border: "1px solid var(--admin-input-border)",
    fontSize: "12px",
    background: "var(--admin-input-bg)",
    color: "var(--admin-body-text)",
    outline: "none",
  },
  // ── Username suggestions dropdown (Search By Client Name) ────────────
  clientSearchWrap: { position: "relative" },
  clientSearchHint: {
    fontSize: 11,
    color: "var(--admin-muted-text)",
    marginTop: 4,
    fontFamily: "'IBM Plex Mono', monospace",
  },
  clientSearchResults: {
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    background: "var(--admin-card-bg)",
    border: "1px solid var(--admin-border)",
    borderRadius: 8,
    marginTop: 4,
    maxHeight: 240,
    overflowY: "auto",
    zIndex: 20,
    boxShadow: "0 8px 20px rgba(0,0,0,0.25)",
  },
  clientSearchResultRow: {
    padding: "10px 14px",
    borderBottom: "1px solid var(--admin-border)",
    cursor: "pointer",
  },
  clientSearchUsername: { fontWeight: 600, color: "var(--admin-heading)", fontSize: 13 },
  clientSearchSub: { fontSize: 11, color: "var(--admin-muted-text)", marginTop: 2 },
  table: { width: "100%", borderCollapse: "collapse", fontSize: "12.5px" },
  th: {
    textAlign: "left",
    padding: "12px 14px",
    borderBottom: "1px solid var(--admin-border)",
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: "10px",
    letterSpacing: "0.06em",
    color: "var(--admin-muted-text)",
    textTransform: "uppercase",
    background: "var(--admin-sidebar-bg)",
    fontWeight: 600,
  },
  td: { padding: "12px 14px", borderBottom: "1px solid var(--admin-border)", color: "var(--admin-body-text)" },
  rowAlt: { background: "var(--admin-card-hover)" },
  descBtn: {
    background: "var(--admin-secondary-btn)",
    color: "var(--admin-secondary-text)",
    border: "1px solid var(--admin-border)",
    borderRadius: "6px",
    padding: "5px 10px",
    fontSize: "11.5px",
    cursor: "pointer",
    textAlign: "left",
    fontWeight: 600,
  },
  descTag: { fontSize: "12px" },
  pagination: {
    display: "flex",
    gap: "6px",
    marginTop: "16px",
    justifyContent: "flex-end",
  },
  pageBtn: {
    border: "1px solid var(--admin-border)",
    background: "var(--admin-card-bg)",
    color: "var(--admin-body-text)",
    borderRadius: "6px",
    padding: "6px 12px",
    fontSize: "12px",
    cursor: "pointer",
    fontWeight: 600,
  },
  pageBtnActive: {
    border: "1px solid var(--admin-primary-btn)",
    background: "var(--admin-primary-btn)",
    color: "var(--admin-btn-text)",
    borderRadius: "6px",
    padding: "6px 12px",
    fontSize: "12px",
    cursor: "pointer",
    fontWeight: 700,
  },
  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.7)",
    backdropFilter: "blur(4px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
  modal: {
    background: "var(--admin-card-bg)",
    border: "1px solid var(--admin-border)",
    color: "var(--admin-body-text)",
    borderRadius: "14px",
    width: "800px",
    maxWidth: "95vw",
    maxHeight: "85vh",
    overflowY: "auto",
    padding: "24px",
    boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "14px",
  },
  closeBtn: {
    border: "none",
    background: "transparent",
    cursor: "pointer",
    fontSize: "14px",
    color: "var(--admin-muted-text)",
  },
  modalMeta: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "12.5px",
    marginBottom: "12px",
    color: "var(--admin-muted-text)",
  },
  modalSummary: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "12.5px",
    marginBottom: "12px",
    fontWeight: 600,
    color: "var(--admin-heading)",
  },
  filterTabs: { display: "flex", gap: "8px", marginBottom: "12px" },
  tab: {
    border: "1px solid var(--admin-border)",
    background: "var(--admin-card-bg)",
    color: "var(--admin-body-text)",
    borderRadius: "6px",
    padding: "5px 14px",
    fontSize: "12px",
    cursor: "pointer",
    fontWeight: 600,
  },
  tabActive: {
    border: "1px solid var(--admin-primary-btn)",
    background: "var(--admin-primary-btn)",
    color: "var(--admin-btn-text)",
    borderRadius: "6px",
    padding: "5px 14px",
    fontSize: "12px",
    cursor: "pointer",
    fontWeight: 700,
  },

  lineBadge: {
    display: "inline-block",
    background: "var(--admin-primary-btn)",
    color: "var(--admin-btn-text)",
    borderRadius: "6px",
    padding: "3px 8px",
    fontSize: "11.5px",
    fontFamily: "'IBM Plex Mono', monospace",
    fontWeight: 600,
  },
};

export default AccountStatement;