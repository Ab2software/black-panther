import React, { useEffect, useState } from "react";
import {
  fetchAdminBets,
  fetchAdminAnalytics,
  settleBet,
  previewRollback,
  rollbackEvent,
} from "../services/adminBetHistory";

const STATUS_COLORS = {
  Pending: { bg: "var(--admin-warning-bg)", color: "var(--admin-warning)" },
  Won: { bg: "var(--admin-success-bg)", color: "var(--admin-success)" },
  Lost: { bg: "var(--admin-danger-bg)", color: "var(--admin-danger)" },
  Void: { bg: "var(--admin-sidebar-bg)", color: "var(--admin-muted-text)" },
  Cancelled: { bg: "var(--admin-sidebar-bg)", color: "var(--admin-muted-text)" },
};

const LIMIT = 20;

export default function BetHistory() {
  const [tab, setTab] = useState("bets");
  const [bets, setBets] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [sport, setSport] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [settlingId, setSettlingId] = useState(null);
  const [confirmBet, setConfirmBet] = useState(null);

  // ── Rollback state ──────────────────────────────────────────────────────
  const [rollbackOpen, setRollbackOpen] = useState(false);
  const [rollbackEventId, setRollbackEventId] = useState("");
  const [rollbackPreview, setRollbackPreview] = useState(null);
  const [rollbackLoading, setRollbackLoading] = useState(false);
  const [rollbackSubmitting, setRollbackSubmitting] = useState(false);
  const [rollbackError, setRollbackError] = useState("");
  const [rollbackResult, setRollbackResult] = useState(null);

  useEffect(() => {
    if (tab === "bets") loadBets();
  }, [tab, status, sport, search, page]);

  useEffect(() => {
    if (tab === "analytics") loadAnalytics();
  }, [tab]);

  const loadBets = async () => {
    setLoading(true);
    try {
      const res = await fetchAdminBets({
        status,
        sport,
        search,
        page,
        limit: LIMIT,
      });
      setBets(res.data || []);
      setTotal(res.total || 0);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSettle = async (bet, status) => {
    setConfirmBet(null);
    setSettlingId(bet._id);
    try {
      await settleBet(bet._id, status);
      await loadBets(); // refetch so profitLoss/balanceAfter reflect server calc
    } catch (e) {
      alert(e.response?.data?.message || "Failed to settle bet");
    } finally {
      setSettlingId(null);
    }
  };

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const res = await fetchAdminAnalytics();
      setAnalytics(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // ── Rollback handlers ────────────────────────────────────────────────────
  // Called from the header button (no eventId — admin types it), or from a
  // row's "⟲ Rollback" action (eventId pre-filled from that bet, auto-preview).
  const openRollback = (prefilledEventId) => {
    setRollbackOpen(true);
    setRollbackError("");
    setRollbackResult(null);
    setRollbackPreview(null);

    if (prefilledEventId) {
      setRollbackEventId(prefilledEventId);
      runPreview(prefilledEventId);
    } else {
      setRollbackEventId("");
    }
  };

  const closeRollback = () => {
    if (rollbackSubmitting) return; // don't let them close mid-write
    setRollbackOpen(false);
    setRollbackEventId("");
    setRollbackPreview(null);
    setRollbackError("");
    setRollbackResult(null);
  };

  const runPreview = async (eventIdToUse) => {
    const id = (eventIdToUse ?? rollbackEventId).trim();
    if (!id) {
      setRollbackError("Enter an eventId first");
      return;
    }
    setRollbackLoading(true);
    setRollbackError("");
    setRollbackPreview(null);
    setRollbackResult(null);
    try {
      const res = await previewRollback(id);
      if (!res.preview || res.preview.length === 0) {
        setRollbackError(res.message || "No settled bets found for this eventId");
      } else {
        setRollbackPreview(res);
      }
    } catch (e) {
      setRollbackError(e.response?.data?.message || "Failed to preview rollback");
    } finally {
      setRollbackLoading(false);
    }
  };

  const handlePreviewRollback = () => runPreview();

  const handleConfirmRollback = async () => {
    setRollbackSubmitting(true);
    setRollbackError("");
    try {
      const res = await rollbackEvent(rollbackEventId.trim());
      setRollbackResult(res);
      setRollbackPreview(null);
      await loadBets(); // refresh table so corrected statuses show up
    } catch (e) {
      setRollbackError(e.response?.data?.message || "Rollback failed");
    } finally {
      setRollbackSubmitting(false);
    }
  };

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div style={s.page}>
      {/* ── PAGE HEADER ── */}
      <div style={s.pageHeader}>
        <div>
          <h1 style={s.pageTitle}>Bets</h1>
          <p style={s.pageSubtitle}>
            Monitor all placed bets and market analytics
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button style={s.rollbackTriggerBtn} onClick={() => openRollback()}>
            ⟲ Rollback Event
          </button>
          <div style={s.tabGroup}>
            {["bets", "analytics"].map((t) => (
              <button
                key={t}
                style={tab === t ? { ...s.tabBtn, ...s.tabBtnActive } : s.tabBtn}
                onClick={() => {
                  setTab(t);
                  setPage(1);
                }}
              >
                {t === "bets" ? "All Bets" : "Analytics"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ══════════ BETS TAB ══════════ */}
      {tab === "bets" && (
        <div style={s.card}>
          {/* Filters */}
          <div style={s.filterRow}>
            <input
              style={s.input}
              placeholder="Search by user name or email…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
            <select
              style={s.input}
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Statuses</option>
              {["Pending", "Won", "Lost", "Void", "Cancelled"].map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
            <select
              style={s.input}
              value={sport}
              onChange={(e) => {
                setSport(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Sports</option>
              {["cricket", "football", "tennis"].map((v) => (
                <option key={v} value={v}>
                  {v[0].toUpperCase() + v.slice(1)}
                </option>
              ))}
            </select>
            <button style={s.refreshBtn} onClick={loadBets}>
              ↻ Refresh
            </button>
          </div>

          {/* Table */}
          {loading ? (
            <div style={s.center}>Loading bets…</div>
          ) : (
            <div style={s.tableWrap}>
              <table style={s.table}>
                <thead>
                  <tr>
                    {[
                      "User",
                      "Match",
                      "Market",
                      "Team",
                      "Side",
                      "Odds",
                      "Stake",
                      "P&L",
                      "After Balance",
                      "Status",
                      "Date",
                      "Action",
                    ].map((h) => (
                      <th key={h} style={s.th}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {bets.length === 0 ? (
                    <tr>
                      <td colSpan={11} style={s.empty}>
                        No bets found
                      </td>
                    </tr>
                  ) : (
                    bets.map((bet, i) => (
                      <tr
                        key={bet._id}
                        style={{
                          ...s.tr,
                          background: i % 2 === 0 ? "#fff" : "#fafaf9",
                        }}
                      >
                        <td style={s.td}>
                          <div style={s.userName}>
                            {bet.userId?.username || "—"}
                          </div>
                          <div style={s.userEmail}>
                            {bet.userId?.email || ""}
                          </div>
                        </td>
                        <td style={{ ...s.td, maxWidth: 160 }}>
                          <div style={s.matchName}>{bet.matchName || "—"}</div>
                          {bet.eventId && (
                            <div style={s.eventIdTag} title="eventId">
                              {bet.eventId}
                            </div>
                          )}
                        </td>
                        <td style={s.td}>{bet.selectionName || "—"}</td>
                        <td style={s.td}>{bet.sectionTeam || "—"}</td>
                        <td style={s.td}>
                          <span style={bet.side === "back" ? s.back : s.lay}>
                            {bet.side?.toUpperCase()}
                          </span>
                        </td>
                        <td
                          style={{
                            ...s.td,
                            fontFamily: "'IBM Plex Mono', monospace",
                            fontSize: 12,
                          }}
                        >
                          {bet.price != null ? (
                            bet.price
                          ) : bet.fancyPrice != null ? (
                            <>
                              {bet.fancyPrice}
                              {bet.fancyRate != null && (
                                <div style={{ fontSize: 10, color: "#b0aea6" }}>
                                  @{bet.fancyRate}
                                </div>
                              )}
                            </>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td
                          style={{
                            ...s.td,
                            fontFamily: "'IBM Plex Mono', monospace",
                            fontSize: 12,
                          }}
                        >
                          ₹{bet.stake?.toLocaleString()}
                        </td>
                        <td style={s.td}>
                          <span
                            style={{
                              fontFamily: "'IBM Plex Mono', monospace",
                              fontSize: 12,
                              fontWeight: 600,
                              color:
                                bet.profitLoss == null
                                  ? "#b0aea6"
                                  : bet.profitLoss >= 0
                                    ? "#15803d"
                                    : "#b91c1c",
                            }}
                          >
                            {bet.profitLoss != null
                              ? `${bet.profitLoss >= 0 ? "+" : "-"}₹${Math.abs(bet.profitLoss).toLocaleString()}`
                              : "—"}
                          </span>
                        </td>
                        <td
                          style={{
                            ...s.td,
                            fontFamily: "'IBM Plex Mono', monospace",
                            fontSize: 12,
                            color: "#57534e",
                          }}
                        >
                          {bet.balanceAfter != null
                            ? `₹${bet.balanceAfter.toLocaleString()}`
                            : "—"}
                        </td>
                        <td style={s.td}>
                          <span
                            style={{
                              ...s.statusBadge,
                              background:
                                STATUS_COLORS[bet.status]?.bg || "#f5f5f4",
                              color:
                                STATUS_COLORS[bet.status]?.color || "#78716c",
                            }}
                          >
                            {bet.status}
                          </span>
                        </td>
                        <td
                          style={{
                            ...s.td,
                            fontFamily: "'IBM Plex Mono', monospace",
                            fontSize: 11,
                            color: "#b0aea6",
                          }}
                        >
                          <div>
                            {new Date(bet.createdAt).toLocaleDateString(
                              "en-IN",
                              {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              },
                            )}
                          </div>
                          <div style={{ fontSize: 10 }}>
                            {new Date(bet.createdAt).toLocaleTimeString(
                              "en-IN",
                              {
                                hour: "2-digit",
                                minute: "2-digit",
                              },
                            )}
                          </div>
                        </td>
                        <td style={s.td}>
                          {bet.status === "Pending" ? (
                            settlingId === bet._id ? (
                              <span style={s.settlingText}>Settling…</span>
                            ) : (
                              <select
                                style={s.settleSelect}
                                value=""
                                onChange={(e) => {
                                  if (!e.target.value) return;
                                  setConfirmBet({ bet, status: e.target.value });
                                }}
                              >
                                <option value="">Settle…</option>
                                <option value="Won">Won</option>
                                <option value="Lost">Lost</option>
                                <option value="Void">Void</option>
                                <option value="Cancelled">Cancelled</option>
                              </select>
                            )
                          ) : bet.eventId ? (
                            <button
                              style={s.rowRollbackBtn}
                              onClick={() => openRollback(bet.eventId)}
                              title={`Rollback event ${bet.eventId}`}
                            >
                              ⟲ Rollback
                            </button>
                          ) : (
                            <span style={s.settledText}>—</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* ── SETTLE CONFIRMATION MODAL ── */}
          {confirmBet && (
            <div style={s.modalOverlay} onClick={() => setConfirmBet(null)}>
              <div style={s.modalCard} onClick={(e) => e.stopPropagation()}>
                <div style={s.modalTitle}>Confirm Settlement</div>
                <p style={s.modalBody}>
                  Mark this bet as{" "}
                  <strong>{confirmBet.status}</strong> for{" "}
                  <strong>{confirmBet.bet.userId?.username || "user"}</strong>?
                  <br />
                  Stake: ₹{confirmBet.bet.stake?.toLocaleString()} on{" "}
                  {confirmBet.bet.matchName || "—"}.
                  <br />
                  This will update the user's wallet balance immediately and
                  cannot be undone.
                </p>
                <div style={s.modalActions}>
                  <button
                    style={s.modalCancelBtn}
                    onClick={() => setConfirmBet(null)}
                  >
                    Cancel
                  </button>
                  <button
                    style={s.modalConfirmBtn}
                    onClick={() => handleSettle(confirmBet.bet, confirmBet.status)}
                  >
                    Confirm {confirmBet.status}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Pagination */}
          {!loading && bets.length > 0 && (
            <div style={s.pagination}>
              <span style={s.pageInfo}>
                Showing {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, total)}{" "}
                of {total} bets
              </span>
              <div style={s.pageButtons}>
                <button
                  style={s.pageBtn}
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  ← Prev
                </button>
                <span style={s.pageNum}>
                  {page} / {totalPages || 1}
                </span>
                <button
                  style={s.pageBtn}
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══════════ ANALYTICS TAB ══════════ */}
      {tab === "analytics" &&
        (loading ? (
          <div style={s.center}>Loading analytics…</div>
        ) : (
          analytics && (
            <div style={s.analyticsWrap}>
              {/* Summary cards */}
              <div style={s.cardRow}>
                {[
                  {
                    label: "Total Bets",
                    value: analytics.summary.totalBets ?? 0,
                    mono: false,
                  },
                  {
                    label: "Total Stake",
                    value: `₹${(analytics.summary.totalStake ?? 0).toLocaleString()}`,
                    mono: true,
                  },
                  {
                    label: "Pending",
                    value: analytics.summary.pendingBets ?? 0,
                    mono: false,
                    accent: "#b45309",
                  },
                  {
                    label: "Total P&L",
                    value: `${(analytics.summary.totalPnL ?? 0) >= 0 ? "+" : "-"}₹${Math.abs(analytics.summary.totalPnL ?? 0).toLocaleString()}`,
                    mono: true,
                    accent:
                      (analytics.summary.totalPnL ?? 0) >= 0
                        ? "#15803d"
                        : "#b91c1c",
                  },
                ].map((c) => (
                  <div key={c.label} style={s.summaryCard}>
                    <div style={s.summaryLabel}>{c.label}</div>
                    <div
                      style={{
                        ...s.summaryValue,
                        color: c.accent || "#111110",
                        fontFamily: c.mono
                          ? "'IBM Plex Mono', monospace"
                          : "inherit",
                      }}
                    >
                      {c.value}
                    </div>
                  </div>
                ))}
              </div>

              {/* Status breakdown + Back/Lay */}
              <div style={s.twoCol}>
                <div style={s.card}>
                  <div style={s.sectionTitle}>Status Breakdown</div>
                  {analytics.statusBreakdown.map((r) => {
                    const pct = (
                      (r.count / (analytics.summary.totalBets || 1)) *
                      100
                    ).toFixed(1);
                    const c = STATUS_COLORS[r._id] || {
                      bg: "#f5f5f4",
                      color: "#78716c",
                    };
                    return (
                      <div key={r._id} style={s.barRow}>
                        <span
                          style={{
                            ...s.statusBadge,
                            background: c.bg,
                            color: c.color,
                            minWidth: 72,
                          }}
                        >
                          {r._id}
                        </span>
                        <div style={s.barBg}>
                          <div
                            style={{
                              ...s.barFill,
                              width: `${pct}%`,
                              background: c.color,
                            }}
                          />
                        </div>
                        <span style={s.barMeta}>
                          {r.count} · ₹{r.totalStake?.toLocaleString()}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div style={s.card}>
                  <div style={s.sectionTitle}>Back vs Lay</div>
                  {analytics.sideRatio.map((r) => {
                    const pct = (
                      (r.count / (analytics.summary.totalBets || 1)) *
                      100
                    ).toFixed(1);
                    const isBack = r._id === "back";
                    return (
                      <div key={r._id} style={s.barRow}>
                        <span
                          style={{
                            ...s.statusBadge,
                            background: isBack ? "#eff6ff" : "#fef2f2",
                            color: isBack ? "#1d4ed8" : "#b91c1c",
                            minWidth: 48,
                          }}
                        >
                          {r._id?.toUpperCase()}
                        </span>
                        <div style={s.barBg}>
                          <div
                            style={{
                              ...s.barFill,
                              width: `${pct}%`,
                              background: isBack ? "#3b82f6" : "#ef4444",
                            }}
                          />
                        </div>
                        <span style={s.barMeta}>
                          {r.count} ({pct}%) · ₹{r.totalStake?.toLocaleString()}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Top matches + Top users */}
              <div style={s.twoCol}>
                <div style={s.card}>
                  <div style={s.sectionTitle}>Top Matches by Volume</div>
                  {analytics.topMatches.map((m, i) => (
                    <div key={i} style={s.listRow}>
                      <span style={s.rank}>#{i + 1}</span>
                      <span style={s.listName}>{m._id || "Unknown Match"}</span>
                      <span style={s.listMeta}>
                        ₹{m.totalStake?.toLocaleString()} · {m.totalBets} bets
                      </span>
                    </div>
                  ))}
                </div>

                <div style={s.card}>
                  <div style={s.sectionTitle}>Top Users by Stake</div>
                  {analytics.topUsers.map((u, i) => (
                    <div key={i} style={s.listRow}>
                      <span style={s.rank}>#{i + 1}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={s.userName}>
                          {u.user?.username || u.user?.email || "—"}
                        </div>
                        <div style={s.userEmail}>
                          {u.user?.phone || u.user?.email || ""}
                        </div>
                      </div>
                      <span style={s.listMeta}>
                        ₹{u.totalStake?.toLocaleString()} · {u.totalBets} bets
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sport stats */}
              <div style={s.card}>
                <div style={s.sectionTitle}>Sport-wise Stats</div>
                <div style={s.sportRow}>
                  {analytics.sportStats.map((sp) => (
                    <div key={sp._id} style={s.sportCard}>
                      <div style={s.sportName}>{sp._id || "Unknown"}</div>
                      <div style={s.sportBets}>{sp.totalBets} bets</div>
                      <div style={s.sportStake}>
                        ₹{sp.totalStake?.toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )
        ))}

      {/* ══════════ ROLLBACK MODAL ══════════ */}
      {rollbackOpen && (
        <div style={s.modalOverlay} onClick={closeRollback}>
          <div
            style={{ ...s.modalCard, width: 480 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={s.modalTitle}>Rollback Event Settlement</div>
            <p style={{ ...s.modalBody, marginBottom: 14 }}>
              This reverts every settled bet under this event back to
              Pending and re-fetches the corrected result from the provider.
            </p>

            {!rollbackResult && (
              <>
                <input
                  style={{ ...s.input, width: "100%", marginBottom: 10 }}
                  placeholder="Event ID"
                  value={rollbackEventId}
                  onChange={(e) => setRollbackEventId(e.target.value)}
                  disabled={rollbackSubmitting}
                />

                {rollbackLoading && (
                  <div style={s.rollbackCheckingText}>Checking event…</div>
                )}

                {rollbackError && (
                  <div style={s.rollbackErrorBox}>{rollbackError}</div>
                )}

                {!rollbackPreview && !rollbackLoading && (
                  <div style={s.modalActions}>
                    <button style={s.modalCancelBtn} onClick={closeRollback}>
                      Cancel
                    </button>
                    <button
                      style={s.modalConfirmBtn}
                      onClick={handlePreviewRollback}
                    >
                      Preview
                    </button>
                  </div>
                )}

                {rollbackPreview && (
                  <>
                    <div style={s.rollbackPreviewBox}>
                      <div style={s.rollbackPreviewHeader}>
                        {rollbackPreview.betsAffected} bet
                        {rollbackPreview.betsAffected === 1 ? "" : "s"} will be
                        reverted to Pending, then re-settled from the
                        provider's corrected result.
                      </div>
                      {rollbackPreview.preview.map((p) => (
                        <div key={p.betId} style={s.rollbackPreviewRow}>
                          <div style={s.rollbackPreviewUser}>
                            {p.username || "—"} · bet {p.betId}
                          </div>
                          <div style={s.rollbackPreviewLine}>
                            Currently{" "}
                            <span
                              style={{
                                ...s.statusBadge,
                                background:
                                  STATUS_COLORS[p.currentStatus]?.bg,
                                color: STATUS_COLORS[p.currentStatus]?.color,
                              }}
                            >
                              {p.currentStatus}
                            </span>{" "}
                            (₹{p.currentProfitLoss}) → wallet reversal of{" "}
                            <strong>
                              {p.walletBalanceReversal >= 0 ? "+" : "-"}₹
                              {Math.abs(p.walletBalanceReversal).toLocaleString()}
                            </strong>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div style={s.modalActions}>
                      <button
                        style={s.modalCancelBtn}
                        onClick={() => setRollbackPreview(null)}
                        disabled={rollbackSubmitting}
                      >
                        Back
                      </button>
                      <button
                        style={{ ...s.modalConfirmBtn, background: "#b91c1c" }}
                        onClick={handleConfirmRollback}
                        disabled={rollbackSubmitting}
                      >
                        {rollbackSubmitting
                          ? "Rolling back…"
                          : "Confirm Rollback"}
                      </button>
                    </div>
                  </>
                )}
              </>
            )}

            {rollbackResult && (
              <>
                <div style={s.rollbackResultBox}>
                  <div style={{ fontWeight: 600, marginBottom: 6 }}>
                    Reverted {rollbackResult.reverted} bet
                    {rollbackResult.reverted === 1 ? "" : "s"}.
                  </div>
                  <div style={{ color: "#57534e" }}>
                    Re-settlement: {rollbackResult.resettle?.processed ?? 0}{" "}
                    processed, {rollbackResult.resettle?.skipped ?? 0}{" "}
                    skipped
                    {rollbackResult.resettle?.note
                      ? ` (${rollbackResult.resettle.note})`
                      : ""}
                    .
                  </div>
                  {rollbackResult.failures?.length > 0 && (
                    <div style={{ color: "#b91c1c", marginTop: 6 }}>
                      {rollbackResult.failures.length} bet(s) failed to
                      revert — check server logs.
                    </div>
                  )}
                </div>
                <div style={s.modalActions}>
                  <button style={s.modalConfirmBtn} onClick={closeRollback}>
                    Done
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── STYLES (matches your IBM Plex / neutral admin palette) ────────────────
const s = {
  eventIdTag: {
    fontSize: 10,
    color: "#b0aea6",
    fontFamily: "'IBM Plex Mono', monospace",
    marginTop: 2,
  },
  rowRollbackBtn: {
    padding: "4px 10px",
    borderRadius: 6,
    border: "1px solid #f0d0d0",
    background: "#fef2f2",
    color: "#b91c1c",
    fontSize: 11,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "'IBM Plex Sans', sans-serif",
    whiteSpace: "nowrap",
  },
  rollbackCheckingText: {
    fontSize: 12,
    color: "#7a7870",
    marginBottom: 12,
  },
  rollbackTriggerBtn: {
    padding: "7px 16px",
    borderRadius: 7,
    border: "1px solid #f0d0d0",
    background: "#fef2f2",
    color: "#b91c1c",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "'IBM Plex Sans', sans-serif",
  },
  rollbackErrorBox: {
    background: "#fef2f2",
    color: "#b91c1c",
    fontSize: 12,
    padding: "8px 12px",
    borderRadius: 6,
    marginBottom: 12,
  },
  rollbackPreviewBox: {
    maxHeight: 260,
    overflowY: "auto",
    border: "1px solid #e8e6de",
    borderRadius: 8,
    padding: "10px 12px",
    marginBottom: 16,
    background: "#fafaf9",
  },
  rollbackPreviewHeader: {
    fontSize: 12,
    color: "#57534e",
    marginBottom: 10,
    paddingBottom: 8,
    borderBottom: "1px solid #e8e6de",
  },
  rollbackPreviewRow: {
    marginBottom: 10,
  },
  rollbackPreviewUser: {
    fontSize: 12,
    fontWeight: 600,
    color: "#111110",
    marginBottom: 2,
  },
  rollbackPreviewLine: {
    fontSize: 12,
    color: "#57534e",
    lineHeight: 1.6,
  },
  rollbackResultBox: {
    background: "#f0fdf4",
    border: "1px solid #bbf7d0",
    borderRadius: 8,
    padding: "12px 14px",
    fontSize: 13,
    marginBottom: 16,
  },

  settleSelect: {
    padding: "5px 8px",
    borderRadius: 6,
    border: "1px solid #e8e6de",
    fontSize: 12,
    background: "#fafaf9",
    color: "#1c1b19",
    fontFamily: "'IBM Plex Sans', sans-serif",
    cursor: "pointer",
  },
  settlingText: {
    fontSize: 11,
    color: "#b0aea6",
    fontFamily: "'IBM Plex Mono', monospace",
  },
  settledText: { fontSize: 12, color: "#d6d3ca" },

  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(17,17,16,0.4)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 100,
  },
  modalCard: {
    background: "#fff",
    borderRadius: 12,
    padding: "24px 26px",
    width: 380,
    maxWidth: "90vw",
    boxShadow: "0 12px 32px rgba(0,0,0,0.18)",
  },
  modalTitle: { fontSize: 16, fontWeight: 600, color: "#111110", marginBottom: 10 },
  modalBody: { fontSize: 13, color: "#57534e", lineHeight: 1.6, marginBottom: 20 },
  modalActions: { display: "flex", justifyContent: "flex-end", gap: 10 },
  modalCancelBtn: {
    padding: "8px 16px",
    borderRadius: 7,
    border: "1px solid #e8e6de",
    background: "#fafaf9",
    color: "#57534e",
    fontSize: 13,
    cursor: "pointer",
  },
  modalConfirmBtn: {
    padding: "8px 16px",
    borderRadius: 7,
    border: "none",
    background: "#111110",
    color: "#fff",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
  },
  page: {
    padding: "24px 28px",
    background: "var(--admin-page-bg)",
    minHeight: "100vh",
    fontFamily: "'IBM Plex Sans', sans-serif",
    color: "var(--admin-body-text)",
  },
  pageHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 24,
    flexWrap: "wrap",
    gap: 12,
  },
  pageTitle: { margin: 0, fontSize: 24, fontWeight: 700, color: "var(--admin-heading)", letterSpacing: "-0.02em" },
  pageSubtitle: { margin: "4px 0 0", fontSize: 12, color: "var(--admin-muted-text)", fontFamily: "'IBM Plex Mono', monospace" },
  tabGroup: {
    display: "flex",
    background: "var(--admin-sidebar-bg)",
    border: "1px solid var(--admin-border)",
    borderRadius: 8,
    padding: 3,
    gap: 2,
  },
  tabBtn: {
    background: "none",
    border: "none",
    padding: "7px 18px",
    borderRadius: 6,
    fontSize: 13,
    cursor: "pointer",
    color: "var(--admin-muted-text)",
    fontFamily: "'IBM Plex Sans', sans-serif",
    fontWeight: 500,
  },
  tabBtnActive: {
    background: "var(--admin-primary-btn)",
    color: "var(--admin-btn-text)",
    fontWeight: 600,
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
  },

  card: {
    background: "var(--admin-card-bg)",
    borderRadius: 12,
    border: "1px solid var(--admin-border)",
    padding: "20px 24px",
    marginBottom: 16,
    boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
  },
  filterRow: {
    display: "flex",
    gap: 10,
    marginBottom: 18,
    flexWrap: "wrap",
    alignItems: "center",
  },
  input: {
    padding: "8px 12px",
    borderRadius: 8,
    border: "1px solid var(--admin-input-border)",
    color: "var(--admin-body-text)",
    fontSize: 13,
    background: "var(--admin-input-bg)",
    fontFamily: "'IBM Plex Sans', sans-serif",
    outline: "none",
    minWidth: 160,
  },
  refreshBtn: {
    padding: "8px 16px",
    borderRadius: 8,
    border: "1px solid var(--admin-border)",
    background: "var(--admin-secondary-btn)",
    fontSize: 13,
    cursor: "pointer",
    color: "var(--admin-secondary-text)",
    fontFamily: "'IBM Plex Sans', sans-serif",
    fontWeight: 600,
  },

  tableWrap: {
    overflowX: "auto",
    borderRadius: 10,
    border: "1px solid var(--admin-border)",
  },
  table: { width: "100%", borderCollapse: "collapse" },
  th: {
    padding: "12px 14px",
    background: "var(--admin-sidebar-bg)",
    fontSize: 11,
    fontWeight: 600,
    color: "var(--admin-muted-text)",
    textAlign: "left",
    whiteSpace: "nowrap",
    borderBottom: "1px solid var(--admin-border)",
    fontFamily: "'IBM Plex Mono', monospace",
    letterSpacing: "0.06em",
    textTransform: "uppercase",
  },
  tr: { borderBottom: "1px solid var(--admin-border)" },
  td: {
    padding: "12px 14px",
    fontSize: 13,
    verticalAlign: "middle",
    color: "var(--admin-body-text)",
  },
  empty: { padding: 48, textAlign: "center", color: "var(--admin-muted-text)", fontSize: 14 },
  center: { padding: 64, textAlign: "center", color: "var(--admin-muted-text)", fontSize: 14 },

  userName: { fontWeight: 600, fontSize: 13, color: "var(--admin-heading)" },
  userEmail: { fontSize: 11, color: "var(--admin-muted-text)", marginTop: 1 },
  matchName: { fontSize: 12, color: "var(--admin-body-text)", lineHeight: 1.4 },

  back: {
    background: "var(--admin-info-bg)",
    color: "var(--admin-info)",
    padding: "2px 8px",
    borderRadius: 4,
    fontWeight: 600,
    fontSize: 11,
    fontFamily: "'IBM Plex Mono', monospace",
  },
  lay: {
    background: "var(--admin-danger-bg)",
    color: "var(--admin-danger)",
    padding: "2px 8px",
    borderRadius: 4,
    fontWeight: 600,
    fontSize: 11,
    fontFamily: "'IBM Plex Mono', monospace",
  },
  statusBadge: {
    padding: "3px 8px",
    borderRadius: 5,
    fontSize: 11,
    fontWeight: 600,
    display: "inline-block",
    whiteSpace: "nowrap",
  },

  pagination: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 18,
    flexWrap: "wrap",
    gap: 8,
  },
  pageInfo: {
    fontSize: 12,
    color: "var(--admin-muted-text)",
    fontFamily: "'IBM Plex Mono', monospace",
    fontWeight: 600,
  },
  pageButtons: { display: "flex", alignItems: "center", gap: 8 },
  pageBtn: {
    padding: "7px 14px",
    borderRadius: 8,
    border: "1px solid var(--admin-border)",
    background: "var(--admin-card-bg)",
    cursor: "pointer",
    fontSize: 13,
    color: "var(--admin-body-text)",
    fontFamily: "'IBM Plex Sans', sans-serif",
    fontWeight: 600,
  },
  pageNum: {
    fontSize: 12,
    color: "var(--admin-muted-text)",
    minWidth: 50,
    textAlign: "center",
    fontFamily: "'IBM Plex Mono', monospace",
  },

  analyticsWrap: { display: "flex", flexDirection: "column", gap: 0 },
  cardRow: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: 14,
    marginBottom: 16,
  },
  summaryCard: {
    background: "var(--admin-card-bg)",
    borderRadius: 12,
    border: "1px solid var(--admin-border)",
    padding: "18px 20px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
  },
  summaryLabel: {
    fontSize: 11,
    color: "var(--admin-muted-text)",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    fontFamily: "'IBM Plex Mono', monospace",
    fontWeight: 600,
  },
  summaryValue: { fontSize: 24, fontWeight: 700, color: "var(--admin-heading)" },
  twoCol: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 600,
    color: "var(--admin-heading)",
    marginBottom: 16,
    paddingBottom: 10,
    borderBottom: "1px solid var(--admin-border)",
  },

  barRow: { display: "flex", alignItems: "center", gap: 10, marginBottom: 12 },
  barBg: {
    flex: 1,
    height: 6,
    background: "var(--admin-border)",
    borderRadius: 3,
    overflow: "hidden",
  },
  barFill: { height: "100%", borderRadius: 3, transition: "width 0.4s ease" },
  barMeta: {
    fontSize: 11,
    color: "var(--admin-muted-text)",
    whiteSpace: "nowrap",
    minWidth: 130,
    fontFamily: "'IBM Plex Mono', monospace",
  },

  listRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "10px 0",
    borderBottom: "1px solid var(--admin-border)",
    fontSize: 13,
  },
  rank: {
    fontWeight: 700,
    color: "var(--admin-muted-text)",
    minWidth: 28,
    fontSize: 11,
    fontFamily: "'IBM Plex Mono', monospace",
  },
  listName: {
    flex: 1,
    fontWeight: 600,
    color: "var(--admin-heading)",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  listMeta: {
    fontSize: 11,
    color: "var(--admin-muted-text)",
    whiteSpace: "nowrap",
    fontFamily: "'IBM Plex Mono', monospace",
  },

  sportRow: { display: "flex", gap: 12, flexWrap: "wrap" },
  sportCard: {
    background: "var(--admin-card-bg)",
    borderRadius: 10,
    border: "1px solid var(--admin-border)",
    padding: "14px 18px",
    minWidth: 130,
    textAlign: "center",
  },
  sportName: {
    fontWeight: 600,
    color: "var(--admin-heading)",
    textTransform: "capitalize",
    marginBottom: 6,
    fontSize: 13,
  },
  sportBets: { fontSize: 12, color: "var(--admin-muted-text)", marginBottom: 2 },
  sportStake: {
    fontSize: 12,
    color: "var(--admin-body-text)",
    fontFamily: "'IBM Plex Mono', monospace",
  },
};