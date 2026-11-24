import React, { useEffect, useState, useMemo, useRef } from "react";
import {
  getAllWithdraws,
  updateWithdrawStatus,
} from "../../services/adminTransactionService";
import { toast } from "../../../utils/toast";

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

// ─── METHOD BADGE ─────────────────────────────
// ─── METHOD BADGE ─────────────────────────────
const methodLabels = { bank: "Bank", upi: "UPI", qr: "QR", admin_chip_transfer: "Admin Deduction" };
const methodColors = {
  bank: { color: "#1d4e89", bg: "#eaf1fb" },
  upi: { color: "#6d3f9e", bg: "#f3ecfa" },
  qr: { color: "#0f7a5c", bg: "#e6f6ef" },
  admin_chip_transfer: { color: "#a93226", bg: "#fdf2f2" },
};

const MethodBadge = ({ method }) => {
  const c = methodColors[method] || methodColors.upi;
  return (
    <span
      style={{
        fontSize: 10,
        fontFamily: "'IBM Plex Mono', monospace",
        color: c.color,
        background: c.bg,
        padding: "3px 8px",
        borderRadius: 6,
        textTransform: "uppercase",
      }}
    >
      {methodLabels[method] || method}
    </span>
  );
};

// ─── COPY BUTTON ─────────────────────────────
const CopyButton = ({ text, label }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e) => {
    e.stopPropagation();
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch (err) {
      console.error("Copy failed:", err);
    }
  };

  return (
    <button onClick={handleCopy} style={s.copyBtn} title={label ? `Copy ${label}` : "Copy"}>
      {copied ? "✓" : "Copy"}
    </button>
  );
};

// ─── DETAILS CELL (UPI, BANK, or QR) ─────────────────────────────
// ─── DETAILS CELL (UPI, BANK, QR, or Admin Deduction) ─────────────────────────────
const DetailsCell = ({ withdraw, onPreviewImage }) => {
  const { withdrawMethod, upiId, bankDetails, qrImageUrl, remark, adminId } = withdraw;

  if (withdrawMethod === "admin_chip_transfer") {
    return (
      <div style={s.bankDetailsBlock}>
        <div style={s.detailRow}>
          <span style={s.detailLabel}>By</span>
          <span style={s.mono}>{adminId?.username || "—"}</span>
        </div>
        {remark && (
          <div style={s.detailRow}>
            <span style={s.detailLabel}>Note</span>
            <span style={{ ...s.mono, fontStyle: "italic" }}>{remark}</span>
          </div>
        )}
      </div>
    );
  }

  if (withdrawMethod === "bank" && bankDetails) {
    const fullSummary = `${bankDetails.accountHolderName} | ${bankDetails.accountNumber} | ${bankDetails.ifscCode} | ${bankDetails.bankName}`;

    return (
      <div style={s.bankDetailsBlock}>
        <div style={s.detailRow}>
          <span style={s.detailLabel}>Name</span>
          <span style={s.mono}>{bankDetails.accountHolderName}</span>
          <CopyButton text={bankDetails.accountHolderName} label="name" />
        </div>
        <div style={s.detailRow}>
          <span style={s.detailLabel}>A/C</span>
          <span style={s.mono}>{bankDetails.accountNumber}</span>
          <CopyButton text={bankDetails.accountNumber} label="account number" />
        </div>
        <div style={s.detailRow}>
          <span style={s.detailLabel}>IFSC</span>
          <span style={s.mono}>{bankDetails.ifscCode}</span>
          <CopyButton text={bankDetails.ifscCode} label="IFSC" />
        </div>
        <div style={s.detailRow}>
          <span style={s.detailLabel}>Bank</span>
          <span style={s.mono}>{bankDetails.bankName}</span>
          <CopyButton text={bankDetails.bankName} label="bank name" />
        </div>
        <div style={{ ...s.detailRow, borderTop: "1px dashed #e8e6de", paddingTop: 4 }}>
          <span style={s.detailLabel}>All</span>
          <CopyButton text={fullSummary} label="all details" />
        </div>
      </div>
    );
  }

  if (withdrawMethod === "qr") {
    return qrImageUrl ? (
      <img
        src={qrImageUrl}
        alt="User's QR code"
        onClick={() => onPreviewImage(qrImageUrl)}
        style={{
          width: 44,
          height: 44,
          objectFit: "cover",
          borderRadius: 6,
          border: "1px solid #e8e6de",
          cursor: "pointer",
        }}
      />
    ) : (
      <span style={s.sub}>No QR uploaded</span>
    );
  }

  // UPI fallback
  return (
    <div style={s.detailRow}>
      <span style={s.mono}>{upiId}</span>
      <CopyButton text={upiId} label="UPI ID" />
    </div>
  );
};

// ─── TIME HELPERS ─────────────────────────────
const getTimeAgo = (createdAt) => {
  const diffMs = Date.now() - new Date(createdAt).getTime();
  const mins = Math.floor(diffMs / 60000);

  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;

  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ${mins % 60}m ago`;

  const days = Math.floor(hrs / 24);
  return `${days}d ${hrs % 24}h ago`;
};

const getPendingUrgency = (createdAt) => {
  const mins = (Date.now() - new Date(createdAt).getTime()) / 60000;
  if (mins >= 30) return { color: "#c0392b", fontWeight: 600 };
  if (mins >= 15) return { color: "#ba7517", fontWeight: 600 };
  return { color: "#8a8880", fontWeight: 400 };
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

// ─── APPROVE PANEL (proof image upload) ─────────────────────────────
const ApprovePanel = ({ onCancel, onConfirm, busy }) => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const handleSubmit = () => {
    if (!file) {
      toast.error("Please attach a proof of payment image");
      return;
    }
    onConfirm(file);
  };

  return (
    <div style={s.actionPanel}>
      <div style={s.actionPanelLabel}>Upload proof of payment</div>

      {preview ? (
        <div style={s.previewWrap}>
          <img src={preview} alt="proof preview" style={s.previewImg} />
          <button
            type="button"
            style={s.changeFileBtn}
            onClick={() => fileInputRef.current?.click()}
          >
            Change
          </button>
        </div>
      ) : (
        <button
          type="button"
          style={s.fileSelectBtn}
          onClick={() => fileInputRef.current?.click()}
        >
          Choose image
        </button>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        style={{ display: "none" }}
      />

      <div style={s.actionPanelBtns}>
        <button style={s.confirmApproveBtn} disabled={busy} onClick={handleSubmit}>
          {busy ? "Uploading..." : "Confirm Approve"}
        </button>
        <button style={s.cancelBtn} disabled={busy} onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  );
};

// ─── REJECT PANEL (reason textarea) ─────────────────────────────
const RejectPanel = ({ onCancel, onConfirm, busy }) => {
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = () => {
    if (!reason.trim()) {
      setError("A reason is required to reject");
      return;
    }
    setError("");
    onConfirm(reason.trim());
  };

  return (
    <div style={s.actionPanel}>
      <div style={s.actionPanelLabel}>Reason for rejection</div>
      <textarea
        value={reason}
        onChange={(e) => {
          setReason(e.target.value);
          if (error) setError("");
        }}
        placeholder="e.g. Bank details incorrect, please resubmit"
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
const Withdraw = () => {
  const [withdraws, setWithdraws] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [previewImg, setPreviewImg] = useState(null);

  // which row has an open reject/approve panel
  const [activePanel, setActivePanel] = useState({ id: null, type: null });

  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // ─── PAGINATION ─────────────────────────────
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [, forceTick] = useState(0);

  // ─── FETCH ALL WITHDRAWS (single fetch, no polling) ─────
  const fetchWithdraws = async () => {
    try {
      setLoading(true);
      const res = await getAllWithdraws();

      if (res.success) {
        setWithdraws(res.withdraws);
      }
    } catch (err) {
      console.error("Failed to fetch withdraws:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWithdraws();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
    setActivePanel({ id: null, type: null });
  }, [dateFrom, dateTo]);

  // keep "waiting" timers ticking without refetching data
  useEffect(() => {
    const tickInterval = setInterval(() => forceTick((t) => t + 1), 60000);
    return () => clearInterval(tickInterval);
  }, []);

  const openPanel = (id, type) => setActivePanel({ id, type });
  const closePanel = () => setActivePanel({ id: null, type: null });

  // ─── APPROVE (requires proof of payment image) ─────
  const handleApprove = async (id, file) => {
    try {
      setUpdatingId(id);
      const res = await updateWithdrawStatus(id, "approved", { proofImage: file });

      if (res.success) {
        setWithdraws((prev) =>
          prev.map((w) =>
            w._id === id
              ? {
                  ...w,
                  status: "approved",
                  proofImage: res.withdraw?.proofImage,
                  proofImageUrl: res.withdraw?.proofImageUrl,
                }
              : w
          )
        );
        toast.success("Withdrawal approved");
        closePanel();
      } else {
        toast.error(res.message || "Failed to approve");
      }
    } catch (err) {
      console.error("Approve failed:", err);
      toast.error(err?.response?.data?.message || "Approve failed");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleReject = async (id, reason) => {
    try {
      setUpdatingId(id);
      const res = await updateWithdrawStatus(id, "rejected", { reason });

      if (res.success) {
        setWithdraws((prev) =>
          prev.map((w) =>
            w._id === id ? { ...w, status: "rejected", rejectReason: reason } : w
          )
        );
        toast.success("Withdrawal rejected");
        closePanel();
      } else {
        toast.error(res.message || "Failed to reject");
      }
    } catch (err) {
      console.error("Reject failed:", err);
      toast.error(err?.response?.data?.message || "Reject failed");
    } finally {
      setUpdatingId(null);
    }
  };

  // ─── SUMMARY CARDS: this-month / today, approved / rejected ─────
  // Computed client-side from the full `withdraws` list (independent of the
  // From/To table filter below, so the cards always reflect "this month" /
  // "today" regardless of what's currently filtered in the table).
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

    withdraws.forEach((w) => {
      const created = new Date(w.createdAt);
      const amount = Number(w.amount) || 0;

      if (created >= startOfMonth) {
        if (w.status === "approved") {
          buckets.monthApproved.total += amount;
          buckets.monthApproved.count += 1;
        } else if (w.status === "rejected") {
          buckets.monthRejected.total += amount;
          buckets.monthRejected.count += 1;
        }
      }

      if (created >= startOfToday) {
        if (w.status === "approved") {
          buckets.todayApproved.total += amount;
          buckets.todayApproved.count += 1;
        } else if (w.status === "rejected") {
          buckets.todayRejected.total += amount;
          buckets.todayRejected.count += 1;
        }
      }
    });

    return buckets;
  }, [withdraws]);

  // ─── FILTER + SORT (pending always on top, like Deposit page) ─────
  const visibleWithdraws = useMemo(() => {
    let list = [...withdraws];

    if (dateFrom) {
      const from = new Date(dateFrom);
      from.setHours(0, 0, 0, 0);
      list = list.filter((w) => new Date(w.createdAt) >= from);
    }
    if (dateTo) {
      const to = new Date(dateTo);
      to.setHours(23, 59, 59, 999);
      list = list.filter((w) => new Date(w.createdAt) <= to);
    }

    // sort: pending first, then newest first within each group
    list.sort((a, b) => {
      const aPending = a.status === "pending" ? 0 : 1;
      const bPending = b.status === "pending" ? 0 : 1;
      if (aPending !== bPending) return aPending - bPending;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    return list;
  }, [withdraws, dateFrom, dateTo]);

  // ─── PAGINATED WITHDRAWS ─────────────────────────────
  const totalPages = Math.max(
    1,
    Math.ceil(visibleWithdraws.length / itemsPerPage)
  );

  const paginatedWithdraws = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return visibleWithdraws.slice(startIndex, startIndex + itemsPerPage);
  }, [visibleWithdraws, currentPage]);

  // Keep current page valid if filtering/status changes reduce the list.
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
          admin / <span style={{ color: "#7a7870" }}>withdraw</span>
        </div>
        <h1 style={s.title}>Withdraw Requests</h1>
      </div>

      {/* SUMMARY CARDS */}
      <div style={s.summaryGrid}>
        <SummaryCard
          label="This Month Withdrawal (Approved)"
          total={loading ? 0 : summary.monthApproved.total}
          count={loading ? 0 : summary.monthApproved.count}
          accent={statusColors.approved.dot}
        />
        <SummaryCard
          label="This Month Withdrawal (Rejected)"
          total={loading ? 0 : summary.monthRejected.total}
          count={loading ? 0 : summary.monthRejected.count}
          accent={statusColors.rejected.dot}
        />
        <SummaryCard
          label="Today's Withdrawal (Approved)"
          total={loading ? 0 : summary.todayApproved.total}
          count={loading ? 0 : summary.todayApproved.count}
          accent="#185fa5"
        />
        <SummaryCard
          label="Today's Withdrawal (Rejected)"
          total={loading ? 0 : summary.todayRejected.total}
          count={loading ? 0 : summary.todayRejected.count}
          accent={statusColors.rejected.dot}
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
          {visibleWithdraws.length === 0
            ? "0 of 0"
            : `${(currentPage - 1) * itemsPerPage + 1}-${Math.min(
                currentPage * itemsPerPage,
                visibleWithdraws.length
              )} of ${visibleWithdraws.length}`}
        </div>
      </div>

      {/* TABLE — single table, pending sorted to top */}
      <div style={s.tableWrap}>
        {loading ? (
          <div style={s.loader}>Loading...</div>
        ) : visibleWithdraws.length === 0 ? (
          <div style={s.loader}>No withdrawals found</div>
        ) : (
          <table style={s.table}>
            <thead>
              <tr>
                <th style={s.th}>User</th>
                <th style={s.th}>Amount</th>
                <th style={s.th}>Method</th>
                <th style={s.th}>Details</th>
                <th style={s.th}>Status</th>
                <th style={s.th}>Waiting</th>
                <th style={s.th}>Action</th>
              </tr>
            </thead>

            <tbody>
              {paginatedWithdraws.map((w) => {
                const panelOpenForThisRow = activePanel.id === w._id;

                return (
                  <tr key={w._id}>
                    <td style={s.td}>
                      <div style={s.user}>{w.userId?.username}</div>
                      <div style={s.sub}>{w.userId?.email}</div>
                    </td>

                    <td style={{ ...s.td, ...s.mono }}>₹{w.amount}</td>

                    <td style={s.td}>
                      <MethodBadge method={w.withdrawMethod} />
                    </td>

                    <td style={s.td}>
                      <DetailsCell withdraw={w} onPreviewImage={setPreviewImg} />
                    </td>

                    <td style={s.td}>
                      <StatusBadge status={w.status} />
                      {w.status === "rejected" && w.rejectReason && (
                        <div style={s.reasonNote}>{w.rejectReason}</div>
                      )}
                      {w.status === "approved" && w.proofImageUrl && (
                        <div
                          onClick={() => setPreviewImg(w.proofImageUrl)}
                          style={{ ...s.link, cursor: "pointer", marginTop: 4 }}
                        >
                          View proof
                        </div>
                      )}
                    </td>

                    <td style={s.td}>
                      <span
                        style={{
                          ...s.mono,
                          fontSize: 11,
                          ...(w.status === "pending"
                            ? getPendingUrgency(w.createdAt)
                            : { color: "#8a8880" }),
                        }}
                      >
                        {getTimeAgo(w.createdAt)}
                      </span>
                    </td>

                    <td style={{ ...s.td, minWidth: panelOpenForThisRow ? 220 : "auto" }}>
                      {w.status === "pending" ? (
                        panelOpenForThisRow && activePanel.type === "approve" ? (
                          <ApprovePanel
                            busy={updatingId === w._id}
                            onCancel={closePanel}
                            onConfirm={(file) => handleApprove(w._id, file)}
                          />
                        ) : panelOpenForThisRow && activePanel.type === "reject" ? (
                          <RejectPanel
                            busy={updatingId === w._id}
                            onCancel={closePanel}
                            onConfirm={(reason) => handleReject(w._id, reason)}
                          />
                        ) : (
                          <div style={s.actions}>
                            <button
                              style={s.approveBtn}
                              disabled={updatingId === w._id}
                              onClick={() => openPanel(w._id, "approve")}
                            >
                              Approve
                            </button>

                            <button
                              style={s.rejectBtn}
                              disabled={updatingId === w._id}
                              onClick={() => openPanel(w._id, "reject")}
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
      {!loading && visibleWithdraws.length > 0 && totalPages > 1 && (
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

      {/* PROOF OF PAYMENT / QR PREVIEW MODAL */}
      {previewImg && (
        <div style={s.modalOverlay} onClick={() => setPreviewImg(null)}>
          <div style={s.modal} onClick={(e) => e.stopPropagation()}>
            <img
              src={
                previewImg?.startsWith("http")
                  ? previewImg
                  : `${import.meta.env.VITE_API_URL}${previewImg}`
              }
              alt="Preview"
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

// ─── STYLES ─────────────────────────────
const s = {
  page: {
    minHeight: "100vh",
    background: "var(--admin-page-bg)",
    fontFamily: "'IBM Plex Sans', -apple-system, BlinkMacSystemFont, sans-serif",
    padding: "24px 28px",
    color: "var(--admin-body-text)",
  },

  header: { marginBottom: 20 },

  breadcrumb: {
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: 11,
    letterSpacing: "0.08em",
    color: "var(--admin-muted-text)",
    marginBottom: 6,
    textTransform: "uppercase",
  },

  title: {
    fontSize: 26,
    fontWeight: 600,
    color: "var(--admin-heading)",
    letterSpacing: "-0.02em",
  },

  summaryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 14,
    marginBottom: 20,
  },

  summaryCard: {
    background: "var(--admin-card-bg)",
    border: "1px solid var(--admin-border)",
    borderRadius: 12,
    padding: "16px 18px",
    display: "flex",
    gap: 14,
    alignItems: "flex-start",
    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
  },

  summaryAccent: {
    width: 4,
    height: 32,
    borderRadius: 3,
    flexShrink: 0,
  },

  summaryLabel: {
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: 10,
    color: "var(--admin-muted-text)",
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    marginBottom: 6,
    fontWeight: 600,
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
    marginBottom: 16,
    flexWrap: "wrap",
    background: "var(--admin-card-bg)",
    border: "1px solid var(--admin-border)",
    padding: "12px 16px",
    borderRadius: 10,
  },

  filterGroup: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },

  filterLabel: {
    fontSize: 10,
    fontFamily: "'IBM Plex Mono', monospace",
    color: "var(--admin-muted-text)",
    textTransform: "uppercase",
    fontWeight: 600,
  },

  dateInput: {
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: 12,
    padding: "8px 10px",
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
    padding: "8px 12px",
    fontSize: 11,
    borderRadius: 8,
    cursor: "pointer",
    fontFamily: "'IBM Plex Mono', monospace",
    fontWeight: 600,
  },

  filterCount: {
    marginLeft: "auto",
    fontSize: 11,
    fontFamily: "'IBM Plex Mono', monospace",
    color: "var(--admin-muted-text)",
  },

  tableWrap: {
    background: "var(--admin-card-bg)",
    border: "1px solid var(--admin-border)",
    borderRadius: 12,
    overflow: "hidden",
    boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
  },

  table: {
    width: "100%",
    borderCollapse: "collapse",
  },

  th: {
    textAlign: "left",
    fontSize: 10,
    fontFamily: "'IBM Plex Mono', monospace",
    color: "var(--admin-muted-text)",
    padding: "12px 14px",
    background: "var(--admin-sidebar-bg)",
    borderBottom: "1px solid var(--admin-border)",
    letterSpacing: "0.06em",
    fontWeight: 600,
  },

  td: {
    padding: "12px 14px",
    borderBottom: "1px solid var(--admin-border)",
    fontSize: 13,
    verticalAlign: "top",
    color: "var(--admin-body-text)",
  },

  user: { fontWeight: 600, color: "var(--admin-heading)" },

  sub: { fontSize: 11, color: "var(--admin-muted-text)" },

  mono: {
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: 12,
    color: "var(--admin-heading)",
  },

  link: {
    fontSize: 11,
    color: "var(--admin-primary-btn)",
    textDecoration: "none",
    fontFamily: "'IBM Plex Mono', monospace",
    fontWeight: 600,
  },

  bankDetailsBlock: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
    minWidth: 220,
  },

  detailRow: {
    display: "flex",
    alignItems: "center",
    gap: 6,
  },

  detailLabel: {
    fontSize: 10,
    fontFamily: "'IBM Plex Mono', monospace",
    color: "var(--admin-muted-text)",
    width: 32,
    flexShrink: 0,
  },

  copyBtn: {
    marginLeft: "auto",
    background: "var(--admin-secondary-btn)",
    color: "var(--admin-secondary-text)",
    border: "1px solid var(--admin-border)",
    padding: "3px 8px",
    fontSize: 10,
    borderRadius: 6,
    cursor: "pointer",
    fontFamily: "'IBM Plex Mono', monospace",
    fontWeight: 600,
    flexShrink: 0,
  },

  actions: {
    display: "flex",
    gap: 6,
  },

  approveBtn: {
    background: "var(--admin-success)",
    color: "#fff",
    border: "none",
    padding: "6px 12px",
    fontSize: 11,
    borderRadius: 6,
    cursor: "pointer",
    fontWeight: 600,
  },

  rejectBtn: {
    background: "var(--admin-danger)",
    color: "#fff",
    border: "none",
    padding: "6px 12px",
    fontSize: 11,
    borderRadius: 6,
    cursor: "pointer",
    fontWeight: 600,
  },

  done: {
    fontSize: 11,
    fontFamily: "'IBM Plex Mono', monospace",
    color: "var(--admin-muted-text)",
  },

  loader: {
    padding: 40,
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
    background: "var(--admin-card-hover)",
    border: "1px solid var(--admin-border)",
    borderRadius: 8,
    padding: 12,
    minWidth: 220,
  },

  actionPanelLabel: {
    fontSize: 10,
    fontFamily: "'IBM Plex Mono', monospace",
    color: "var(--admin-muted-text)",
    textTransform: "uppercase",
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
    outline: "none",
  },

  errorNote: {
    fontSize: 11,
    color: "var(--admin-danger)",
  },

  fileSelectBtn: {
    background: "var(--admin-card-bg)",
    border: "1px dashed var(--admin-border)",
    borderRadius: 6,
    padding: "8px 10px",
    fontSize: 11,
    color: "var(--admin-body-text)",
    cursor: "pointer",
    fontFamily: "'IBM Plex Mono', monospace",
  },

  previewWrap: {
    display: "flex",
    alignItems: "center",
    gap: 8,
  },

  previewImg: {
    width: 44,
    height: 44,
    objectFit: "cover",
    borderRadius: 6,
    border: "1px solid var(--admin-border)",
  },

  changeFileBtn: {
    background: "var(--admin-secondary-btn)",
    border: "1px solid var(--admin-border)",
    borderRadius: 5,
    padding: "4px 8px",
    fontSize: 10,
    color: "var(--admin-secondary-text)",
    cursor: "pointer",
    fontFamily: "'IBM Plex Mono', monospace",
  },

  actionPanelBtns: {
    display: "flex",
    gap: 6,
  },

  confirmApproveBtn: {
    background: "var(--admin-success)",
    color: "#fff",
    border: "none",
    padding: "6px 12px",
    fontSize: 11,
    borderRadius: 6,
    cursor: "pointer",
    fontWeight: 600,
  },

  confirmRejectBtn: {
    background: "var(--admin-danger)",
    color: "#fff",
    border: "none",
    padding: "6px 12px",
    fontSize: 11,
    borderRadius: 6,
    cursor: "pointer",
    fontWeight: 600,
  },

  cancelBtn: {
    background: "var(--admin-secondary-btn)",
    color: "var(--admin-secondary-text)",
    border: "1px solid var(--admin-border)",
    padding: "6px 10px",
    fontSize: 11,
    borderRadius: 6,
    cursor: "pointer",
    fontWeight: 500,
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
    background: "var(--admin-card-bg)",
    color: "var(--admin-body-text)",
    border: "1px solid var(--admin-border)",
    padding: "7px 14px",
    fontSize: 11,
    borderRadius: 8,
    cursor: "pointer",
    fontFamily: "'IBM Plex Mono', monospace",
    fontWeight: 600,
  },

  pageBtnDisabled: {
    opacity: 0.4,
    cursor: "not-allowed",
  },

  pageNumberBtn: {
    width: 32,
    height: 32,
    background: "var(--admin-card-bg)",
    color: "var(--admin-body-text)",
    border: "1px solid var(--admin-border)",
    borderRadius: 8,
    cursor: "pointer",
    fontSize: 11,
    fontFamily: "'IBM Plex Mono', monospace",
    fontWeight: 600,
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
    background: "rgba(0,0,0,0.75)",
    backdropFilter: "blur(4px)",
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
    boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
  },

  modalImg: {
    maxWidth: "100%",
    maxHeight: "70vh",
    borderRadius: 8,
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
  },
};

export default Withdraw;