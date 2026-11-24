// services/ledgerService.js

const Bet = require("../model/bet");
const GameTransaction = require("../model/GameTransaction");
const ChipTransaction = require("../model/Chiptransaction");
const PaymentRequest = require("../model/PaymentRequest");
const WithdrawRequest = require("../model/WithdrawRequest");

function truncateToMinute(date) {
  const d = new Date(date);
  d.setSeconds(0, 0);
  return d;
}

async function getAccountStatement({ userId, siteId, from, to, gameName, accountType }) {
  const dateFilter = {};
  if (from) dateFilter.$gte = new Date(from);
  if (to) {
    const toDate = new Date(to);
    toDate.setHours(23, 59, 59, 999);
    dateFilter.$lte = toDate;
  }
  const hasDateFilter = Object.keys(dateFilter).length > 0;

  const events = [];

  // ---- Sports bets (settled only) — grouped by match/event AND settlement minute ----
  if (!accountType || accountType === "sports") {
    const betQuery = {
      userId,
      status: { $ne: "Pending" },
      ...(siteId ? { siteId } : {}),
      ...(hasDateFilter ? { settledAt: dateFilter } : {}),
    };
    const bets = await Bet.find(betQuery).lean();

    const groups = new Map();
    for (const b of bets) {
      const settleDate = b.settledAt || b.updatedAt;
      const minuteBucket = truncateToMinute(settleDate);
      const eventKey = b.eventId || b.matchName || b.betId;
      const key = `${eventKey}__${minuteBucket.getTime()}`;

      if (!groups.has(key)) {
        groups.set(key, {
          pl: 0,
          count: 0,
          latestDate: settleDate,
          sport: b.sport,
          matchName: b.matchName,
          eventId: b.eventId,
          settledMinute: minuteBucket.toISOString(),
        });
      }
      const g = groups.get(key);
      g.pl += b.profitLoss || 0;
      g.count += 1;
      if (new Date(settleDate) > new Date(g.latestDate)) g.latestDate = settleDate;
    }

    for (const g of groups.values()) {
      events.push({
        date: g.latestDate,
        credit: g.pl > 0 ? g.pl : 0,
        debit: g.pl < 0 ? Math.abs(g.pl) : 0,
        description: `${g.sport || "SPORTS"} / ${g.matchName || ""}${g.count > 1 ? ` (${g.count} bets)` : ""}`,
        source: "sports",
        refId: g.eventId,
        settledMinute: g.settledMinute,
      });
    }
  }

  // ---- Casino / provider game rounds ----
  if (!accountType || accountType === "casino") {
    const gtQuery = {
      userId,
      ...(gameName && gameName !== "All" ? { gameName } : {}),
      ...(hasDateFilter ? { createdAt: dateFilter } : {}),
    };
    const rounds = await GameTransaction.find(gtQuery).lean();
    for (const g of rounds) {
      // FIX: previously credited the full winAmount on a WIN and ignored
      // betAmount, over-crediting every winning round by its stake and
      // inflating the statement's balance above the real wallet.balance.
      // Match the net-P/L convention used everywhere else (see
      // getRoundDetails: win = winAmount - betAmount) instead of treating
      // result === "WIN"/"LOSS" as separate gross fields.
      const netPL = (g.winAmount || 0) - (g.betAmount || 0);
      events.push({
        date: g.createdAt,
        credit: netPL > 0 ? netPL : 0,
        debit: netPL < 0 ? Math.abs(netPL) : 0,
        description: `${g.gameName || ""} / R.No : ${g.gameRound} / ${g.nation || g.gameName || ""}`,
        source: "casino",
        refId: g.gameRound,
      });
    }
  }

  // ---- Chip transfers (admin give/take) ----
  if (!accountType || accountType === "chip") {
    const chipQuery = {
      $or: [{ fromUserId: userId }, { toUserId: userId }],
      ...(hasDateFilter ? { createdAt: dateFilter } : {}),
    };
    const chips = await ChipTransaction.find(chipQuery).lean();
    for (const c of chips) {
      const isRecipientGive = String(c.toUserId) === String(userId) && c.type === "give";
      const isRecipientTake = String(c.toUserId) === String(userId) && c.type === "take";
      const isSenderGive = String(c.fromUserId) === String(userId) && c.type === "give";
      const isSenderTake = String(c.fromUserId) === String(userId) && c.type === "take";

      let credit = 0, debit = 0;
      if (isRecipientGive) credit = c.amount;
      if (isRecipientTake) debit = c.amount;
      if (isSenderGive) debit = c.amount;
      if (isSenderTake) credit = c.amount;

      events.push({
        date: c.createdAt,
        credit,
        debit,
        description: `CHIP ${c.type.toUpperCase()}${c.remark ? " / " + c.remark : ""}`,
        source: "chip",
        refId: c._id,
      });
    }
  }

  // ---- Deposits ----
  if (!accountType || accountType === "deposit") {
    const depQuery = {
      userId,
      status: "approved",
      source: "user_deposit",
      ...(hasDateFilter ? { createdAt: dateFilter } : {}),
    };
    const deposits = await PaymentRequest.find(depQuery).lean();
    for (const d of deposits) {
      events.push({
        date: d.updatedAt,
        credit: d.price,
        debit: 0,
        description: `DEPOSIT / ${d.method?.toUpperCase() || ""} / ${d.transactionId}`,
        source: "deposit",
        refId: d.transactionId,
      });
    }
  }

  // ---- Withdrawals ----
  if (!accountType || accountType === "withdraw") {
    const wdQuery = {
      userId,
      status: "approved",
      withdrawMethod: { $ne: "admin_chip_transfer" },
      ...(hasDateFilter ? { updatedAt: dateFilter } : {}),
    };
    const withdrawals = await WithdrawRequest.find(wdQuery).lean();
    for (const w of withdrawals) {
      events.push({
        date: w.updatedAt,
        credit: 0,
        debit: w.amount,
        description: `WITHDRAW / ${w.withdrawMethod?.toUpperCase() || ""}`,
        source: "withdraw",
        refId: w._id,
      });
    }
  }

  // ---- Sort chronologically and compute running closing balance ----
  events.sort((a, b) => new Date(a.date) - new Date(b.date));

  const openingBalance = await computeOpeningBalance(userId, from);
  let running = openingBalance;

  const rows = [
    {
      date: from || (events[0]?.date ?? new Date()),
      credit: null,
      debit: null,
      closing: roundAmt(openingBalance),
      description: "OPENING PTS",
      source: "opening",
    },
  ];

  for (const e of events) {
    running += (e.credit || 0) - (e.debit || 0);
    rows.push({
      ...e,
      credit: e.credit || null,
      debit: e.debit ? -Math.abs(e.debit) : null,
      closing: roundAmt(running),
    });
  }

  return rows;
}

async function computeOpeningBalance(userId, from) {
  if (!from) return 0;
  const cutoff = new Date(from);

  const [bets, rounds, chipsOut, chipsIn, deposits, withdrawals] = await Promise.all([
    Bet.aggregate([
      { $match: { userId, status: { $ne: "Pending" }, settledAt: { $lt: cutoff } } },
      { $group: { _id: null, total: { $sum: "$profitLoss" } } },
    ]),
    // FIX: same net-P/L correction as the main casino block above — sum
    // (winAmount - betAmount) on a WIN, not the gross winAmount alone.
    GameTransaction.aggregate([
      { $match: { userId, createdAt: { $lt: cutoff } } },
      {
        $group: {
          _id: null,
          total: {
            $sum: {
              $cond: [
                { $eq: ["$result", "WIN"] },
                { $subtract: ["$winAmount", "$betAmount"] },
                { $cond: [{ $eq: ["$result", "LOSS"] }, { $multiply: ["$betAmount", -1] }, 0] },
              ],
            },
          },
        },
      },
    ]),
    ChipTransaction.aggregate([
      { $match: { fromUserId: userId, createdAt: { $lt: cutoff } } },
      { $group: { _id: "$type", total: { $sum: "$amount" } } },
    ]),
    ChipTransaction.aggregate([
      { $match: { toUserId: userId, createdAt: { $lt: cutoff } } },
      { $group: { _id: "$type", total: { $sum: "$amount" } } },
    ]),
    PaymentRequest.aggregate([
      { $match: { userId, status: "approved", source: "user_deposit", createdAt: { $lt: cutoff } } },
      { $group: { _id: null, total: { $sum: "$price" } } },
    ]),
    WithdrawRequest.aggregate([
      {
        $match: {
          userId,
          status: "approved",
          withdrawMethod: { $ne: "admin_chip_transfer" },
          createdAt: { $lt: cutoff },
        },
      },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
  ]);

  let total = 0;
  total += bets[0]?.total || 0;
  total += rounds[0]?.total || 0;
  for (const c of chipsOut) total += c._id === "give" ? -c.total : c.total;
  for (const c of chipsIn) total += c._id === "give" ? c.total : -c.total;
  total += deposits[0]?.total || 0;
  total -= withdrawals[0]?.total || 0;

  return total;
}

function roundAmt(n) {
  return Math.round((n || 0) * 100) / 100;
}

module.exports = { getAccountStatement };