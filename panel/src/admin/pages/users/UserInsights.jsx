import React, { useState, useEffect, useCallback } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import {
  searchUsers,
  getUserSummary,
  getUserBetHistory,
  getUserGameHistory,
  getUserFinanceHistory,
} from "../../services/adminUserInsightsService";

// ─── SMALL UI PIECES ─────────────────────────────
const StatCard = ({ label, value, sub, tone }) => (
  <div style={s.statCard}>
    <div style={s.statLabel}>{label}</div>
    <div style={{ ...s.statValue, color: tone || "#111110" }}>{value}</div>
    {sub && <div style={s.statSub}>{sub}</div>}
  </div>
);

const TabButton = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    style={{
      ...s.tabBtn,
      ...(active ? s.tabBtnActive : {}),
    }}
  >
    {children}
  </button>
);

const money = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

// ─── PAGE ─────────────────────────────
const UserInsights = () => {
  const { userId: routeUserId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  const [selectedUser, setSelectedUser] = useState(null);
  const [summary, setSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [activeTab, setActiveTab] = useState("bets"); // bets | games | finance

  // tab-specific state
  const [bets, setBets] = useState([]);
  const [betStatus, setBetStatus] = useState("all");
  const [games, setGames] = useState([]);
  const [gameResult, setGameResult] = useState("all");
  const [finance, setFinance] = useState([]);
  const [financeType, setFinanceType] = useState("all");
  const [tabLoading, setTabLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ pages: 1, total: 0 });

  // ✅ auto-select user if we arrived here via a route param (from Clients page)
  useEffect(() => {
    if (!routeUserId) return;

    if (location.state?.user) {
      setSelectedUser(location.state.user);
      setQuery(location.state.user.username);
      return;
    }

    getUserSummary(routeUserId, {})
      .then((res) => {
        if (res.success) {
          setSelectedUser(res.user);
          setQuery(res.user.username);
          setSummary(res);
        }
      })
      .catch((err) => {
        console.error("Failed to load user from route:", err);
      });
  }, [routeUserId]);

  // ─── SEARCH ─────────────────────────────
  const handleSearch = async (q) => {
    setQuery(q);
    if (!q.trim()) {
      setSearchResults([]);
      return;
    }
    try {
      setSearching(true);
      const res = await searchUsers(q);
      if (res.success) setSearchResults(res.users);
    } catch (err) {
      console.error("Search failed:", err);
    } finally {
      setSearching(false);
    }
  };

  const selectUser = (user) => {
    setSelectedUser(user);
    setSearchResults([]);
    setQuery(user.username);
    setActiveTab("bets");
    setPage(1);
  };

  // ─── SUMMARY FETCH ─────────────────────────────
  const fetchSummary = useCallback(async () => {
    if (!selectedUser) return;
    try {
      setSummaryLoading(true);
      const res = await getUserSummary(selectedUser._id, { dateFrom, dateTo });
      if (res.success) setSummary(res);
    } catch (err) {
      console.error("Summary fetch failed:", err);
    } finally {
      setSummaryLoading(false);
    }
  }, [selectedUser, dateFrom, dateTo]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  // ─── TAB DATA FETCH ─────────────────────────────
  const fetchTabData = useCallback(async () => {
    if (!selectedUser) return;
    try {
      setTabLoading(true);

      if (activeTab === "bets") {
        const res = await getUserBetHistory(selectedUser._id, {
          dateFrom,
          dateTo,
          status: betStatus,
          page,
        });
        if (res.success) {
          setBets(res.bets);
          setPagination(res.pagination);
        }
      } else if (activeTab === "games") {
        const res = await getUserGameHistory(selectedUser._id, {
          dateFrom,
          dateTo,
          result: gameResult,
          page,
        });
        if (res.success) {
          setGames(res.games);
          setPagination(res.pagination);
        }
      } else if (activeTab === "finance") {
        const res = await getUserFinanceHistory(selectedUser._id, {
          dateFrom,
          dateTo,
          type: financeType,
          page,
        });
        if (res.success) {
          setFinance(res.transactions);
          setPagination(res.pagination);
        }
      }
    } catch (err) {
      console.error("Tab data fetch failed:", err);
    } finally {
      setTabLoading(false);
    }
  }, [
    selectedUser,
    activeTab,
    dateFrom,
    dateTo,
    betStatus,
    gameResult,
    financeType,
    page,
  ]);

  useEffect(() => {
    fetchTabData();
  }, [fetchTabData]);

  // reset page when filters/tab change
  useEffect(() => {
    setPage(1);
  }, [activeTab, betStatus, gameResult, financeType, dateFrom, dateTo]);

  const clearDates = () => {
    setDateFrom("");
    setDateTo("");
  };

  // ✅ fallback chains for bet display fields — your Bet schema has
  // matchName/selectionName as the primary fields, with eventId/sectionTeam
  // as secondary. If these all show "—", the bet-placement controller
  // likely isn't saving matchName/selectionName at all.
  const getMatchLabel = (b) => b.matchName || b.eventId || "—";
  const getTeamLabel = (b) => b.sectionTeam || "—";
  const getSelectionLabel = (b) => b.selectionName || "—";

  // ✅ FIX: for fancy bets, `rate`/`price` are always saved as null/0 on
  // the Bet document itself — the real fancy line/odds only exist nested
  // in settlementResponse.sent_payload.fancy_rate / fancy_price, which is
  // captured at placement time (not settlement, despite the field name).
  // TODO: confirm whether fancy_rate ("line", e.g. 100) or fancy_price
  // ("odds", e.g. 47) is the one you want surfaced — showing both for now
  // as "line @ price" so nothing is lost. Trim to one once you confirm.
  // const getOddsLabel = (b) => {
  //   if ((b.rate ?? null) !== null || (b.price ?? null) !== null) {
  //     return b.rate ?? b.price;
  //   }
  //   const sent = b.settlementResponse?.sent_payload;
  //   const fancyRate = sent?.fancy_rate;
  //   const fancyPrice = sent?.fancy_price;
  //   if (fancyRate != null && fancyPrice != null)
  //     return `${fancyRate} @ ${fancyPrice}`;
  //   if (fancyRate != null) return fancyRate;
  //   if (fancyPrice != null) return fancyPrice;
  //   return "—";
  // };

  return (
    <div style={s.page}>
      {/* HEADER */}
      <div style={s.header}>
        <div style={s.breadcrumb}>
          admin / <span style={{ color: "#7a7870" }}>user insights</span>
        </div>
        <h1 style={s.title}>User Insights</h1>
      </div>

      {/* SEARCH */}
      <div style={s.searchWrap}>
        <input
          type="text"
          placeholder="Search by username, name, email, or phone…"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          style={s.searchInput}
        />

        {searching && <div style={s.searchHint}>Searching…</div>}

        {searchResults.length > 0 && (
          <div style={s.searchResults}>
            {searchResults.map((u) => (
              <div
                key={u._id}
                style={s.searchResultRow}
                onClick={() => selectUser(u)}
              >
                <div>
                  <div style={s.user}>{u.username}</div>
                  <div style={s.sub}>{u.email || u.phone || "—"}</div>
                </div>
                <div style={{ ...s.mono, textAlign: "right" }}>
                  {money(u.wallet?.balance)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {!selectedUser ? (
        <div style={s.emptyState}>
          Search and select a user to view their insights
        </div>
      ) : (
        <>
          {/* USER HEADER CARD */}
          <div style={s.userCard}>
            <div>
              <div style={s.userCardName}>{selectedUser.username}</div>
              <div style={s.sub}>
                {selectedUser.email}{" "}
                {selectedUser.phone && `· ${selectedUser.phone}`}
              </div>
            </div>
            <button
              style={s.changeUserBtn}
              onClick={() => {
                setSelectedUser(null);
                setSummary(null);
                setQuery("");
                if (routeUserId) navigate("/admin/users/insights");
              }}
            >
              Change user
            </button>
          </div>

          {/* DATE FILTER */}
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
          </div>

          {/* SUMMARY CARDS */}
          {summaryLoading ? (
            <div style={s.loader}>Loading summary...</div>
          ) : summary ? (
            <>
              <div style={s.statGrid}>
                <StatCard
                  label="Total Deposit"
                  value={money(summary.deposit.total)}
                  sub={`${summary.deposit.count} approved`}
                  tone="#3b6d11"
                />
                <StatCard
                  label="Total Withdrawal"
                  value={money(summary.withdrawal.total)}
                  sub={`${summary.withdrawal.count} approved`}
                  tone="#a93226"
                />
                <StatCard
                  label="Total Bet (all games)"
                  value={money(summary.combined.totalGamePlayBet)}
                  sub={`${summary.combined.totalBetsPlaced} bets placed`}
                />
                <StatCard
                  label="Total Won"
                  value={money(summary.combined.totalWon)}
                  tone="#3b6d11"
                />
              </div>

              <div style={s.statGrid}>
                <StatCard
                  label="Sports · Stake"
                  value={money(summary.sportsBetting.totalStake)}
                  sub={`${summary.sportsBetting.totalBetsPlaced} bets`}
                />
                <StatCard
                  label="Sports · Won"
                  value={money(summary.sportsBetting.wonAmount)}
                  sub={`${summary.sportsBetting.wonCount} won · ${summary.sportsBetting.lostCount} lost`}
                  tone="#3b6d11"
                />
                <StatCard
                  label="Casino · Bet Amount"
                  value={money(summary.casinoGaming.totalBetAmount)}
                  sub={`${summary.casinoGaming.totalBetsPlaced} rounds`}
                />
                <StatCard
                  label="Casino · Won"
                  value={money(summary.casinoGaming.wonAmount)}
                  sub={`${summary.casinoGaming.wonCount} won`}
                  tone="#3b6d11"
                />
              </div>
            </>
          ) : null}

          {/* TABS */}
          <div style={s.tabsBar}>
            <TabButton
              active={activeTab === "bets"}
              onClick={() => setActiveTab("bets")}
            >
              Sports Bets
            </TabButton>
            <TabButton
              active={activeTab === "games"}
              onClick={() => setActiveTab("games")}
            >
              Casino Games
            </TabButton>
            <TabButton
              active={activeTab === "finance"}
              onClick={() => setActiveTab("finance")}
            >
              Deposits & Withdrawals
            </TabButton>
          </div>

          {/* TAB SUB-FILTERS */}
          {activeTab === "bets" && (
            <div style={s.subFilterBar}>
              <select
                value={betStatus}
                onChange={(e) => setBetStatus(e.target.value)}
                style={s.selectInput}
              >
                <option value="all">All statuses</option>
                <option value="Pending">Pending</option>
                <option value="Won">Won</option>
                <option value="Lost">Lost</option>
                <option value="Void">Void</option>
                <option value="Cancelled">Cancelled</option>
                <option value="CashOut">Cash Out</option>
                <option value="LossCut">Loss Cut</option>
              </select>
            </div>
          )}

          {activeTab === "games" && (
            <div style={s.subFilterBar}>
              <select
                value={gameResult}
                onChange={(e) => setGameResult(e.target.value)}
                style={s.selectInput}
              >
                <option value="all">All results</option>
                <option value="WIN">Win</option>
                <option value="LOSS">Loss</option>
                <option value="PENDING">Pending</option>
              </select>
            </div>
          )}

          {activeTab === "finance" && (
            <div style={s.subFilterBar}>
              <select
                value={financeType}
                onChange={(e) => setFinanceType(e.target.value)}
                style={s.selectInput}
              >
                <option value="all">Deposits & Withdrawals</option>
                <option value="deposit">Deposits only</option>
                <option value="withdraw">Withdrawals only</option>
              </select>
            </div>
          )}

          {/* TABLE */}
          <div style={s.tableWrap}>
            {tabLoading ? (
              <div style={s.loader}>Loading...</div>
            ) : activeTab === "bets" ? (
              bets.length === 0 ? (
                <div style={s.loader}>No bets found</div>
              ) : (
                <table style={s.table}>
                  <thead>
                    <tr>
                      <th style={{ ...s.th, color: "#000" }}>Match</th>
                      <th style={{ ...s.th, color: "#000" }}>Team</th>
                      <th style={{ ...s.th, color: "#000" }}>Selection</th>
                      <th style={{ ...s.th, color: "#000" }}>Side</th>
                      <th style={s.th}>Odds</th>
                      <th style={s.th}>Stake</th>
                      <th style={s.th}>P/L</th>
                      <th style={s.th}>Balance After</th>
                      <th style={s.th}>Status</th>
                      <th style={s.th}>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bets.map((b) => (
                      <tr key={b._id}>
                        <td style={s.td}>{getMatchLabel(b)}</td>
                        <td style={s.td}>{getTeamLabel(b)}</td>
                        <td style={s.td}>{getSelectionLabel(b)}</td>
                        <td style={{ ...s.td, textTransform: "capitalize" }}>
                          {b.side}
                        </td>
                        <td style={{ ...s.td, ...s.mono }}>
                          {b.price != null ? (
                            b.price
                          ) : b.fancyPrice != null ? (
                            <>
                              {b.fancyPrice}
                              {b.fancyRate != null && (
                                <div style={{ fontSize: 10, color: "#b0aea6" }}>
                                  @{b.fancyRate}
                                </div>
                              )}
                            </>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td style={{ ...s.td, ...s.mono }}>{money(b.stake)}</td>
                        <td
                          style={{
                            ...s.td,
                            ...s.mono,
                            color: b.profitLoss >= 0 ? "#3b6d11" : "#a93226",
                          }}
                        >
                          {b.profitLoss >= 0 ? "+" : ""}
                          {money(b.profitLoss)}
                        </td>
                        <td style={{ ...s.td, ...s.mono }}>
                          {b.balanceAfter != null ? money(b.balanceAfter) : "—"}
                        </td>
                        <td style={s.td}>{b.status}</td>
                        <td style={{ ...s.td, ...s.mono, fontSize: 11 }}>
                          {new Date(b.createdAt).toLocaleString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )
            ) : activeTab === "games" ? (
              games.length === 0 ? (
                <div style={s.loader}>No game rounds found</div>
              ) : (
                <table style={s.table}>
                  <thead>
                    <tr>
                      <th style={s.th}>Game</th>
                      <th style={s.th}>Bet Amount</th>
                      <th style={s.th}>Win Amount</th>
                      <th style={s.th}>Result</th>
                      <th style={s.th}>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {games.map((g) => (
                      <tr key={g._id}>
                        <td style={s.td}>{g.gameName || g.gameUid || "—"}</td>
                        <td style={{ ...s.td, ...s.mono }}>
                          {money(g.betAmount)}
                        </td>
                        <td
                          style={{
                            ...s.td,
                            ...s.mono,
                            color: g.result === "WIN" ? "#3b6d11" : "#111110",
                          }}
                        >
                          {money(g.winAmount)}
                        </td>
                        <td style={s.td}>{g.result}</td>
                        <td style={{ ...s.td, ...s.mono, fontSize: 11 }}>
                          {new Date(g.createdAt).toLocaleString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )
            ) : finance.length === 0 ? (
              <div style={s.loader}>No transactions found</div>
            ) : (
              <table style={s.table}>
                <thead>
                  <tr>
                    <th style={s.th}>Type</th>
                    <th style={s.th}>Method</th>
                    <th style={s.th}>Amount</th>
                    <th style={s.th}>Status</th>
                    <th style={s.th}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {finance.map((t) => {
                    const isAdminChipTransfer =
                      t.method === "admin_chip_transfer";

                    const method = isAdminChipTransfer
                      ? "Added by Admin"
                      : t.type === "deposit"
                        ? t.method === "bank"
                          ? "Bank"
                          : "UPI"
                        : t.withdrawMethod === "bank"
                          ? "Bank"
                          : "UPI";

                    return (
                      <tr key={t._id}>
                        <td style={{ ...s.td, textTransform: "capitalize" }}>
                          {t.type}
                        </td>
                        <td style={s.td}>
                          <span
                            style={
                              isAdminChipTransfer
                                ? { ...s.methodBadge, ...s.adminMethodBadge }
                                : s.methodBadge
                            }
                          >
                            {method}
                          </span>
                        </td>
                        <td
                          style={{
                            ...s.td,
                            ...s.mono,
                            color: t.type === "deposit" ? "#3b6d11" : "#a93226",
                          }}
                        >
                          {t.type === "deposit" ? "+" : "−"}
                          {money(t.price || t.amount)}
                        </td>
                        <td style={s.td}>
                          {t.status}
                          {t.status === "rejected" && t.rejectReason && (
                            <div
                              style={{
                                fontSize: 10,
                                color: "#a93226",
                                fontStyle: "italic",
                                marginTop: 2,
                              }}
                            >
                              {t.rejectReason}
                            </div>
                          )}
                        </td>
                        <td style={{ ...s.td, ...s.mono, fontSize: 11 }}>
                          {new Date(t.createdAt).toLocaleString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* PAGINATION */}
          {pagination.pages > 1 && (
            <div style={s.paginationBar}>
              <button
                style={s.pageBtn}
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Prev
              </button>
              <span style={s.pageInfo}>
                Page {page} of {pagination.pages} ({pagination.total} total)
              </span>
              <button
                style={s.pageBtn}
                disabled={page >= pagination.pages}
                onClick={() =>
                  setPage((p) => Math.min(pagination.pages, p + 1))
                }
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

// ─── STYLES (same design system as your other admin pages) ─────────────────────────
const s = {
  page: {
    minHeight: "100vh",
    background: "var(--admin-page-bg)",
    fontFamily: "'IBM Plex Sans', sans-serif",
    padding: "24px 28px",
    color: "var(--admin-body-text)",
  },
  header: { marginBottom: 20 },
  breadcrumb: {
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: 11,
    color: "var(--admin-muted-text)",
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: "0.06em",
  },
  title: { fontSize: 26, fontWeight: 700, color: "var(--admin-heading)", letterSpacing: "-0.02em" },

  searchWrap: { position: "relative", marginBottom: 20, maxWidth: 480 },
  searchInput: {
    width: "100%",
    padding: "10px 14px",
    fontSize: 13,
    border: "1px solid var(--admin-input-border)",
    borderRadius: 8,
    background: "var(--admin-input-bg)",
    color: "var(--admin-body-text)",
    outline: "none",
    boxSizing: "border-box",
  },
  searchHint: {
    fontSize: 11,
    color: "var(--admin-muted-text)",
    marginTop: 4,
    fontFamily: "'IBM Plex Mono', monospace",
  },
  searchResults: {
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    background: "var(--admin-card-bg)",
    border: "1px solid var(--admin-border)",
    borderRadius: 10,
    marginTop: 4,
    maxHeight: 280,
    overflowY: "auto",
    zIndex: 20,
    boxShadow: "0 10px 25px rgba(0,0,0,0.25)",
  },
  searchResultRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "11px 14px",
    borderBottom: "1px solid var(--admin-border)",
    cursor: "pointer",
  },

  emptyState: {
    padding: 60,
    textAlign: "center",
    color: "var(--admin-muted-text)",
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: 13,
  },

  userCard: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    background: "var(--admin-card-bg)",
    border: "1px solid var(--admin-border)",
    borderRadius: 12,
    padding: "16px 20px",
    marginBottom: 18,
    boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
  },
  userCardName: { fontSize: 18, fontWeight: 700, color: "var(--admin-heading)" },
  changeUserBtn: {
    background: "var(--admin-secondary-btn)",
    color: "var(--admin-secondary-text)",
    border: "1px solid var(--admin-border)",
    padding: "7px 14px",
    fontSize: 11,
    borderRadius: 8,
    cursor: "pointer",
    fontFamily: "'IBM Plex Mono', monospace",
    fontWeight: 600,
  },

  filterBar: {
    display: "flex",
    alignItems: "flex-end",
    gap: 12,
    marginBottom: 16,
    flexWrap: "wrap",
  },
  filterGroup: { display: "flex", flexDirection: "column", gap: 4 },
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
    padding: "8px 14px",
    fontSize: 11,
    borderRadius: 8,
    cursor: "pointer",
    fontFamily: "'IBM Plex Mono', monospace",
    fontWeight: 600,
  },

  statGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0,1fr))",
    gap: 14,
    marginBottom: 16,
  },
  statCard: {
    background: "var(--admin-card-bg)",
    border: "1px solid var(--admin-border)",
    borderRadius: 12,
    padding: 16,
    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
  },
  statLabel: {
    fontSize: 10,
    fontFamily: "'IBM Plex Mono', monospace",
    color: "var(--admin-muted-text)",
    textTransform: "uppercase",
    marginBottom: 6,
    fontWeight: 600,
  },
  statValue: { fontSize: 20, fontWeight: 700, color: "var(--admin-heading)" },
  statSub: { fontSize: 11, color: "var(--admin-muted-text)", marginTop: 4 },

  tabsBar: { display: "flex", gap: 8, marginTop: 20, marginBottom: 16 },
  tabBtn: {
    background: "var(--admin-card-bg)",
    color: "var(--admin-body-text)",
    border: "1px solid var(--admin-border)",
    padding: "8px 16px",
    fontSize: 12,
    borderRadius: 8,
    cursor: "pointer",
    fontFamily: "'IBM Plex Mono', monospace",
    fontWeight: 600,
  },
  tabBtnActive: {
    background: "var(--admin-primary-btn)",
    color: "var(--admin-btn-text)",
    borderColor: "var(--admin-primary-btn)",
    fontWeight: 700,
  },
  methodBadge: {
    fontSize: 10,
    fontFamily: "'IBM Plex Mono', monospace",
    color: "var(--admin-primary-btn)",
    background: "var(--admin-card-hover)",
    padding: "3px 8px",
    borderRadius: 6,
  },
  adminMethodBadge: {
    color: "var(--admin-warning)",
    background: "var(--admin-warning-bg)",
  },
  subFilterBar: { marginBottom: 12 },
  selectInput: {
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: 12,
    padding: "8px 10px",
    border: "1px solid var(--admin-input-border)",
    borderRadius: 8,
    background: "var(--admin-input-bg)",
    color: "var(--admin-body-text)",
    outline: "none",
  },

  tableWrap: {
    background: "var(--admin-card-bg)",
    border: "1px solid var(--admin-border)",
    borderRadius: 12,
    overflow: "hidden",
    boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
  },
  table: { width: "100%", borderCollapse: "collapse" },
  th: {
    textAlign: "left",
    fontSize: 10,
    fontFamily: "'IBM Plex Mono', monospace",
    color: "var(--admin-muted-text)",
    padding: "12px 14px",
    background: "var(--admin-sidebar-bg)",
    borderBottom: "1px solid var(--admin-border)",
    textTransform: "uppercase",
    fontWeight: 600,
  },
  td: {
    padding: "12px 14px",
    borderBottom: "1px solid var(--admin-border)",
    fontSize: 13,
    color: "var(--admin-body-text)",
  },
  user: { fontWeight: 600, color: "var(--admin-heading)" },
  sub: { fontSize: 11, color: "var(--admin-muted-text)" },
  mono: {
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: 12,
    color: "var(--admin-heading)"
  },
  link: { fontSize: 12, color: "var(--admin-primary-btn)", textDecoration: "none", fontWeight: 600 },

  loader: {
    padding: 40,
    textAlign: "center",
    color: "var(--admin-muted-text)",
    fontFamily: "'IBM Plex Mono', monospace",
  },

  paginationBar: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
    marginTop: 18,
  },
  pageBtn: {
    background: "var(--admin-card-bg)",
    border: "1px solid var(--admin-border)",
    padding: "7px 16px",
    fontSize: 12,
    borderRadius: 8,
    cursor: "pointer",
    color: "var(--admin-body-text)",
    fontWeight: 600,
  },
  pageInfo: {
    fontSize: 12,
    fontFamily: "'IBM Plex Mono', monospace",
    color: "var(--admin-muted-text)",
    fontWeight: 600,
  },
};

export default UserInsights;
