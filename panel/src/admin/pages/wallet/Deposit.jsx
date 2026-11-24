import React, { useEffect, useState, useMemo } from "react";
  import {
    getAllTransactions,
    updateTransactionStatus,
  } from "../../services/adminTransactionService";

  // ─── STATUS UI ─────────────────────────────
  const statusColors = {
    pending: { bg: "var(--admin-warning-bg)", color: "var(--admin-warning)", dot: "var(--admin-warning)" },
    approved: { bg: "var(--admin-success-bg)", color: "var(--admin-success)", dot: "var(--admin-success)" },
    rejected: { bg: "var(--admin-danger-bg)", color: "var(--admin-danger)", dot: "var(--admin-danger)" },
  };

  const StatusBadge = ({ status }) => {
    const s = statusColors[status] || statusColors.pending;

    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          background: s.bg,
          color: s.color,
          fontSize: 11,
          fontFamily: "'IBM Plex Mono', monospace",
          padding: "3px 8px",
          borderRadius: 6,
          textTransform: "capitalize",
        }}
      >
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: s.dot,
          }}
        />
        {status}
      </span>
    );
  };

  // ─── SUMMARY STAT CARD ─────────────────────────────
  const SummaryCard = ({ label, total, count, accent }) => (
    <div style={s.summaryCard}>
      <div style={{ ...s.summaryAccent, background: accent }} />
      <div>
        <div style={s.summaryLabel}>{label}</div>
        <div style={s.summaryValue}>₹{total.toLocaleString()}</div>
        <div style={s.summarySub}>
          {count} txn{count === 1 ? "" : "s"}
        </div>
      </div>
    </div>
  );

  // ─── REJECT PANEL (remark textarea) ─────────────────────────────
  const RejectPanel = ({ onCancel, onConfirm, busy }) => {
    const [remark, setRemark] = useState("");
    const [error, setError] = useState("");

    const handleSubmit = () => {
      if (!remark.trim()) {
        setError("A remark is required to reject");
        return;
      }
      setError("");
      onConfirm(remark.trim());
    };

    return (
      <div style={s.actionPanel}>
        <div style={s.actionPanelLabel}>Reason for rejection</div>
        <textarea
          value={remark}
          onChange={(e) => {
            setRemark(e.target.value);
            if (error) setError("");
          }}
          placeholder="e.g. Screenshot doesn't match amount"
          style={s.reasonInput}
          rows={3}
        />
        {error && <div style={s.errorNote}>{error}</div>}
        <div style={s.actionPanelBtns}>
          <button style={s.confirmRejectBtn} disabled={busy} onClick={handleSubmit}>
            {busy ? "Submitting..." : "Confirm Reject"}
          </button>
          <button style={s.cancelBtn} disabled={busy} onClick={onCancel}>
            Cancel
          </button>
        </div>
      </div>
    );
  };

  // ─── PAGE ─────────────────────────────
  const Deposit = () => {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [updatingId, setUpdatingId] = useState(null);
    const [previewImg, setPreviewImg] = useState(null);

    // which row has an open reject panel
    const [activePanel, setActivePanel] = useState({ id: null, type: null });

    // ─── DATE FILTER STATE ─────────────
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");

    // ─── PAGINATION STATE ─────────────
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // ─── FETCH ALL DEPOSITS ─────────────
    const fetchTransactions = async () => {
      try {
        setLoading(true);
        const res = await getAllTransactions();
        if (res.success) {
          setTransactions(res.transactions);
        }
      } catch (err) {
        console.error("Failed to fetch transactions:", err);
      } finally {
        setLoading(false);
      }
    };

    useEffect(() => {
      fetchTransactions();
    }, []);

    useEffect(() => {
      setCurrentPage(1);
      setActivePanel({ id: null, type: null });
    }, [dateFrom, dateTo]);

    const openPanel = (id, type) => setActivePanel({ id, type });
    const closePanel = () => setActivePanel({ id: null, type: null });

    // ─── UPDATE STATUS (remark required for reject) ───────────────────
    const handleStatus = async (id, status, remark) => {
      try {
        setUpdatingId(id);

        await updateTransactionStatus(id, status, remark);

        setTransactions((prev) =>
          prev.map((t) =>
            t._id === id ? { ...t, status, adminRemark: remark ?? t.adminRemark } : t
          ),
        );
        closePanel();
      } catch (err) {
        console.error("Status update failed:", err);
      } finally {
        setUpdatingId(null);
      }
    };

    // ─── SUMMARY CARDS: this-month / today, approved / rejected ─────
    // Computed client-side from the full `transactions` list (independent
    // of the From/To table filter below, so the cards always reflect
    // "this month" / "today" regardless of what's currently filtered).
    const summary = useMemo(() => {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfToday = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
      );

      const buckets = {
        monthApproved: { total: 0, count: 0 },
        monthRejected: { total: 0, count: 0 },
        todayApproved: { total: 0, count: 0 },
        todayRejected: { total: 0, count: 0 },
      };

      transactions.forEach((t) => {
        const created = new Date(t.createdAt);
        const amount = Number(t.price) || 0;

        if (created >= startOfMonth) {
          if (t.status === "approved") {
            buckets.monthApproved.total += amount;
            buckets.monthApproved.count += 1;
          } else if (t.status === "rejected") {
            buckets.monthRejected.total += amount;
            buckets.monthRejected.count += 1;
          }
        }

        if (created >= startOfToday) {
          if (t.status === "approved") {
            buckets.todayApproved.total += amount;
            buckets.todayApproved.count += 1;
          } else if (t.status === "rejected") {
            buckets.todayRejected.total += amount;
            buckets.todayRejected.count += 1;
          }
        }
      });

      return buckets;
    }, [transactions]);

    // ─── FILTER + SORT (pending always on top) ─────
    const visibleTransactions = useMemo(() => {
      let list = [...transactions];

      // date filter (inclusive), assumes tx.createdAt exists
      if (dateFrom) {
        const from = new Date(dateFrom);
        from.setHours(0, 0, 0, 0);
        list = list.filter((t) => new Date(t.createdAt) >= from);
      }
      if (dateTo) {
        const to = new Date(dateTo);
        to.setHours(23, 59, 59, 999);
        list = list.filter((t) => new Date(t.createdAt) <= to);
      }

      // sort: pending first, then newest first within each group
      list.sort((a, b) => {
        const aPending = a.status === "pending" ? 0 : 1;
        const bPending = b.status === "pending" ? 0 : 1;
        if (aPending !== bPending) return aPending - bPending;
        return new Date(b.createdAt) - new Date(a.createdAt);
      });

      return list;
    }, [transactions, dateFrom, dateTo]);

    // ─── PAGINATED TRANSACTIONS ─────────────
    const totalPages = Math.max(
      1,
      Math.ceil(visibleTransactions.length / itemsPerPage)
    );

    const paginatedTransactions = useMemo(() => {
      const startIndex = (currentPage - 1) * itemsPerPage;
      return visibleTransactions.slice(startIndex, startIndex + itemsPerPage);
    }, [visibleTransactions, currentPage]);

    // Keep current page valid when filtering/removing transactions.
    useEffect(() => {
      if (currentPage > totalPages) {
        setCurrentPage(totalPages);
      }
    }, [currentPage, totalPages]);

    const handlePageChange = (page) => {
      if (page < 1 || page > totalPages) return;
      setCurrentPage(page);
      setActivePanel({ id: null, type: null });
    };

    const clearDates = () => {
      setDateFrom("");
      setDateTo("");
      setCurrentPage(1);
    };

    return (
      <div style={s.page}>
        {/* HEADER */}
        <div style={s.header}>
          <div style={s.breadcrumb}>
            admin / <span style={{ color: "#7a7870" }}>deposits</span>
          </div>
          <h1 style={s.title}>Deposit Requests</h1>
        </div>

        {/* SUMMARY CARDS */}
        <div style={s.summaryGrid}>
          <SummaryCard
            label="This Month Deposit (Approved)"
            total={loading ? 0 : summary.monthApproved.total}
            count={loading ? 0 : summary.monthApproved.count}
            accent="#639922"
          />
          <SummaryCard
            label="This Month Deposit (Rejected)"
            total={loading ? 0 : summary.monthRejected.total}
            count={loading ? 0 : summary.monthRejected.count}
            accent="#c0392b"
          />
          <SummaryCard
            label="Today's Deposit (Approved)"
            total={loading ? 0 : summary.todayApproved.total}
            count={loading ? 0 : summary.todayApproved.count}
            accent="#185fa5"
          />
          <SummaryCard
            label="Today's Deposit (Rejected)"
            total={loading ? 0 : summary.todayRejected.total}
            count={loading ? 0 : summary.todayRejected.count}
            accent="#a93226"
          />
        </div>

        {/* DATE FILTER BAR */}
        <div style={s.filterBar}>
          <div style={s.filterGroup}>
            <label style={s.filterLabel}>From</label>
            <input
              type="date"
              value={dateFrom}
              max={dateTo || undefined}
              onChange={(e) => setDateFrom(e.target.value)}
              style={s.dateInput}
            />
          </div>

          <div style={s.filterGroup}>
            <label style={s.filterLabel}>To</label>
            <input
              type="date"
              value={dateTo}
              min={dateFrom || undefined}
              onChange={(e) => setDateTo(e.target.value)}
              style={s.dateInput}
            />
          </div>

          {(dateFrom || dateTo) && (
            <button onClick={clearDates} style={s.clearBtn}>
              Clear
            </button>
          )}

          <div style={s.filterCount}>
            {visibleTransactions.length === 0
              ? "0 of 0"
              : `${(currentPage - 1) * itemsPerPage + 1}-${Math.min(
                  currentPage * itemsPerPage,
                  visibleTransactions.length
                )} of ${visibleTransactions.length}`}
          </div>
        </div>

        {/* TABLE */}
        <div style={s.tableWrap}>
          {loading ? (
            <div style={s.loader}>Loading...</div>
          ) : visibleTransactions.length === 0 ? (
            <div style={s.loader}>No transactions found</div>
          ) : (
            <table style={s.table}>
              <thead>
                <tr>
                  <th style={s.th}>User</th>
                  <th style={s.th}>Amount</th>
                  <th style={s.th}>Txn ID</th>
                  <th style={s.th}>Screenshot</th>
                  <th style={s.th}>Status</th>
                  <th style={s.th}>Action</th>
                </tr>
              </thead>

              <tbody>
                {paginatedTransactions.map((tx) => {
                  const panelOpenForThisRow = activePanel.id === tx._id;

                  return (
                    <tr key={tx._id}>
                      <td style={s.td}>
                        <div style={s.user}>{tx.userId?.username}</div>
                        <div style={s.sub}>{tx.userId?.email}</div>
                      </td>

                      <td style={{ ...s.td, ...s.mono }}>₹{tx.price}</td>

                      <td style={{ ...s.td, ...s.mono }}>{tx.transactionId}</td>

                      <td style={s.td}>
                        <span
                          onClick={() => setPreviewImg(tx.paymentScreenshotUrl)}
                          style={{ ...s.link, cursor: "pointer" }}
                        >
                          View
                        </span>
                      </td>

                      <td style={s.td}>
                        <StatusBadge status={tx.status} />
                        {tx.status === "rejected" && tx.adminRemark && (
                          <div style={s.reasonNote}>{tx.adminRemark}</div>
                        )}
                      </td>

                      <td style={{ ...s.td, minWidth: panelOpenForThisRow ? 220 : "auto" }}>
                        {tx.status === "pending" ? (
                          panelOpenForThisRow && activePanel.type === "reject" ? (
                            <RejectPanel
                              busy={updatingId === tx._id}
                              onCancel={closePanel}
                              onConfirm={(remark) =>
                                handleStatus(tx._id, "rejected", remark)
                              }
                            />
                          ) : (
                            <div style={s.actions}>
                              <button
                                style={s.approveBtn}
                                disabled={updatingId === tx._id}
                                onClick={() => handleStatus(tx._id, "approved")}
                              >
                                {updatingId === tx._id ? "Approving..." : "Approve"}
                              </button>

                              <button
                                style={s.rejectBtn}
                                disabled={updatingId === tx._id}
                                onClick={() => openPanel(tx._id, "reject")}
                              >
                                Reject
                              </button>
                            </div>
                          )
                        ) : (
                          <span style={s.done}>Completed</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* PAGINATION */}
        {!loading && visibleTransactions.length > 0 && totalPages > 1 && (
          <div style={s.pagination}>
            <button
              type="button"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              style={{
                ...s.pageBtn,
                ...(currentPage === 1 ? s.pageBtnDisabled : {}),
              }}
            >
              Previous
            </button>

            <div style={s.pageNumbers}>
              {Array.from({ length: totalPages }, (_, index) => index + 1).map(
                (page) => (
                  <button
                    type="button"
                    key={page}
                    onClick={() => handlePageChange(page)}
                    style={{
                      ...s.pageNumberBtn,
                      ...(currentPage === page ? s.pageNumberActive : {}),
                    }}
                  >
                    {page}
                  </button>
                )
              )}
            </div>

            <button
              type="button"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              style={{
                ...s.pageBtn,
                ...(currentPage === totalPages ? s.pageBtnDisabled : {}),
              }}
            >
              Next
            </button>
          </div>
        )}

        {previewImg && (
          <div style={s.modalOverlay} onClick={() => setPreviewImg(null)}>
            <div style={s.modal} onClick={(e) => e.stopPropagation()}>
              <img
                src={
                  previewImg?.startsWith("http")
                    ? previewImg
                    : `${import.meta.env.VITE_API_URL}${previewImg}`
                }
                alt="Screenshot"
                style={s.modalImg}
              />

              <button onClick={() => setPreviewImg(null)} style={s.closeBtn}>
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  // ─── STYLES (same design system) ─────────────────────────
  const s = {
    page: {
      minHeight: "100%",
      background: "var(--admin-page-bg)",
      color: "var(--admin-body-text)",
      fontFamily: "'IBM Plex Sans', sans-serif",
      padding: "24px 32px 48px",
    },

    header: {
      marginBottom: 24,
    },

    breadcrumb: {
      fontFamily: "'IBM Plex Mono', monospace",
      fontSize: 11,
      color: "var(--admin-muted-text)",
      letterSpacing: "0.08em",
      textTransform: "uppercase",
      marginBottom: 4,
    },

    title: {
      fontSize: 24,
      fontWeight: 700,
      color: "var(--admin-heading)",
      letterSpacing: "-0.03em",
      margin: 0,
    },

    summaryGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
      gap: 14,
      marginBottom: 24,
    },

    summaryCard: {
      background: "var(--admin-card-bg)",
      border: "1px solid var(--admin-border)",
      borderRadius: 12,
      padding: "16px 20px",
      display: "flex",
      gap: 14,
      alignItems: "flex-start",
      boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
      transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
    },

    summaryAccent: {
      width: 4,
      height: 28,
      borderRadius: 2,
      flexShrink: 0,
      boxShadow: "0 0 10px rgba(0,0,0,0.15)",
    },

    summaryLabel: {
      fontFamily: "'IBM Plex Mono', monospace",
      fontSize: 10,
      color: "var(--admin-muted-text)",
      letterSpacing: "0.08em",
      textTransform: "uppercase",
      marginBottom: 6,
      fontWeight: 500,
    },

    summaryValue: {
      fontSize: 22,
      fontWeight: 700,
      color: "var(--admin-heading)",
      letterSpacing: "-0.02em",
      lineHeight: 1,
    },

    summarySub: {
      fontFamily: "'IBM Plex Mono', monospace",
      fontSize: 10,
      color: "var(--admin-muted-text)",
      marginTop: 6,
    },

    filterBar: {
      display: "flex",
      alignItems: "flex-end",
      gap: 12,
      marginBottom: 20,
      flexWrap: "wrap",
      padding: "14px 18px",
      borderRadius: 12,
      background: "var(--admin-card-bg)",
      border: "1px solid var(--admin-border)",
    },

    filterGroup: {
      display: "flex",
      flexDirection: "column",
      gap: 5,
    },

    filterLabel: {
      fontSize: 10,
      fontFamily: "'IBM Plex Mono', monospace",
      color: "var(--admin-muted-text)",
      textTransform: "uppercase",
      letterSpacing: "0.08em",
      fontWeight: 500,
    },

    dateInput: {
      fontFamily: "'IBM Plex Mono', monospace",
      fontSize: 12,
      padding: "8px 12px",
      border: "1px solid var(--admin-input-border)",
      borderRadius: 8,
      color: "var(--admin-body-text)",
      background: "var(--admin-input-bg)",
      outline: "none",
    },

    clearBtn: {
      background: "var(--admin-secondary-btn)",
      color: "var(--admin-secondary-text)",
      border: "1px solid var(--admin-border)",
      padding: "8px 14px",
      fontSize: 11,
      borderRadius: 8,
      cursor: "pointer",
      fontFamily: "'IBM Plex Mono', monospace",
      fontWeight: 500,
    },

    filterCount: {
      marginLeft: "auto",
      fontSize: 11,
      fontFamily: "'IBM Plex Mono', monospace",
      color: "var(--admin-muted-text)",
      padding: "4px 10px",
      borderRadius: 12,
      background: "var(--admin-secondary-btn)",
      border: "1px solid var(--admin-border)",
    },

    tableWrap: {
      background: "var(--admin-card-bg)",
      border: "1px solid var(--admin-border)",
      borderRadius: 14,
      overflow: "hidden",
      boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
    },

    table: {
      width: "100%",
      borderCollapse: "collapse",
    },

    th: {
      textAlign: "left",
      fontSize: 10,
      letterSpacing: "0.08em",
      textTransform: "uppercase",
      fontFamily: "'IBM Plex Mono', monospace",
      color: "var(--admin-muted-text)",
      padding: "12px 16px",
      background: "var(--admin-secondary-btn)",
      borderBottom: "1px solid var(--admin-border)",
      fontWeight: 600,
    },

    td: {
      padding: "12px 16px",
      borderBottom: "1px solid var(--admin-border)",
      fontSize: 13,
      verticalAlign: "middle",
      color: "var(--admin-body-text)",
      transition: "background 0.12s",
    },

    user: {
      fontWeight: 600,
      color: "var(--admin-heading)",
      fontSize: 13,
    },

    sub: {
      fontSize: 11,
      color: "var(--admin-muted-text)",
      fontFamily: "'IBM Plex Mono', monospace",
      marginTop: 2,
    },

    mono: {
      fontFamily: "'IBM Plex Mono', monospace",
      fontSize: 13,
      fontWeight: 600,
      color: "var(--admin-heading)",
    },

    link: {
      fontSize: 12,
      color: "var(--admin-info)",
      textDecoration: "none",
      fontWeight: 500,
    },

    actions: {
      display: "flex",
      gap: 8,
      alignItems: "center",
    },

    approveBtn: {
      background: "var(--admin-success)",
      color: "#ffffff",
      border: "none",
      padding: "6px 14px",
      fontSize: 11,
      fontWeight: 600,
      borderRadius: 6,
      cursor: "pointer",
      boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
    },

    rejectBtn: {
      background: "var(--admin-danger)",
      color: "#ffffff",
      border: "none",
      padding: "6px 14px",
      fontSize: 11,
      fontWeight: 600,
      borderRadius: 6,
      cursor: "pointer",
      boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
    },

    done: {
      fontSize: 11,
      fontFamily: "'IBM Plex Mono', monospace",
      color: "var(--admin-muted-text)",
    },

    loader: {
      padding: 48,
      textAlign: "center",
      color: "var(--admin-muted-text)",
      fontFamily: "'IBM Plex Mono', monospace",
    },

    reasonNote: {
      marginTop: 4,
      fontSize: 11,
      color: "var(--admin-danger)",
      fontStyle: "italic",
      maxWidth: 220,
    },

    actionPanel: {
      display: "flex",
      flexDirection: "column",
      gap: 8,
      background: "var(--admin-card-bg)",
      border: "1px solid var(--admin-border)",
      borderRadius: 10,
      padding: 12,
      minWidth: 220,
      boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
    },

    actionPanelLabel: {
      fontSize: 10,
      fontFamily: "'IBM Plex Mono', monospace",
      color: "var(--admin-muted-text)",
      textTransform: "uppercase",
      letterSpacing: "0.08em",
      fontWeight: 600,
    },

    reasonInput: {
      fontFamily: "'IBM Plex Sans', sans-serif",
      fontSize: 12,
      padding: 8,
      border: "1px solid var(--admin-input-border)",
      borderRadius: 6,
      resize: "vertical",
      color: "var(--admin-body-text)",
      background: "var(--admin-input-bg)",
    },

    errorNote: {
      fontSize: 11,
      color: "var(--admin-danger)",
    },

    actionPanelBtns: {
      display: "flex",
      gap: 6,
    },

    confirmRejectBtn: {
      background: "var(--admin-danger)",
      color: "#fff",
      border: "none",
      padding: "6px 12px",
      fontSize: 11,
      fontWeight: 600,
      borderRadius: 6,
      cursor: "pointer",
    },

    cancelBtn: {
      background: "var(--admin-secondary-btn)",
      color: "var(--admin-secondary-text)",
      border: "1px solid var(--admin-border)",
      padding: "6px 12px",
      fontSize: 11,
      borderRadius: 6,
      cursor: "pointer",
    },

    pagination: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      padding: "16px 0",
      flexWrap: "wrap",
    },

    pageNumbers: {
      display: "flex",
      alignItems: "center",
      gap: 5,
      flexWrap: "wrap",
      justifyContent: "center",
    },

    pageBtn: {
      background: "var(--admin-secondary-btn)",
      color: "var(--admin-secondary-text)",
      border: "1px solid var(--admin-border)",
      padding: "7px 14px",
      fontSize: 11,
      borderRadius: 6,
      cursor: "pointer",
      fontFamily: "'IBM Plex Mono', monospace",
      fontWeight: 500,
    },

    pageBtnDisabled: {
      opacity: 0.4,
      cursor: "not-allowed",
    },

    pageNumberBtn: {
      width: 30,
      height: 30,
      background: "var(--admin-secondary-btn)",
      color: "var(--admin-secondary-text)",
      border: "1px solid var(--admin-border)",
      borderRadius: 6,
      cursor: "pointer",
      fontSize: 11,
      fontFamily: "'IBM Plex Mono', monospace",
    },

    pageNumberActive: {
      background: "var(--admin-primary-btn)",
      color: "var(--admin-btn-text)",
      borderColor: "var(--admin-primary-btn)",
      fontWeight: 700,
    },

    modalOverlay: {
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.65)",
      backdropFilter: "blur(6px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 9999,
    },

    modal: {
      background: "var(--admin-card-bg)",
      border: "1px solid var(--admin-border)",
      padding: 20,
      borderRadius: 14,
      maxWidth: "90%",
      maxHeight: "90%",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      boxShadow: "0 20px 50px rgba(0,0,0,0.4)",
    },

    modalImg: {
      maxWidth: "100%",
      maxHeight: "70vh",
      borderRadius: 8,
      border: "1px solid var(--admin-border)",
    },

    closeBtn: {
      marginTop: 14,
      background: "var(--admin-primary-btn)",
      color: "var(--admin-btn-text)",
      border: "none",
      padding: "8px 18px",
      borderRadius: 8,
      cursor: "pointer",
      fontSize: 12,
      fontWeight: 600,
      boxShadow: "0 2px 10px rgba(0,0,0,0.15)",
    },
  };

  export default Deposit;
