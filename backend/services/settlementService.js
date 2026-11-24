const axios = require("axios");
const Bet = require("../model/bet");
const User = require("../model/User");
const { recalculateExposure } = require("./exposureService");

const BASE_URL = process.env.SETTLEMENT_BASE_URL;
const SETTLEMENT_ID = process.env.SETTLEMENT_ID;

// ── Fetch settlement data from provider API ───────────────────────────────
const fetchSettlementData = async (eventTypeId) => {
  const url = `${BASE_URL}?settlementId=${SETTLEMENT_ID}&eventTypeId=${eventTypeId}`;

  const res = await axios.get(url, { timeout: 30000 });

  if (!res.data?.success) {
    return [];
  }

  const data = res.data?.data;

  if (!Array.isArray(data)) {
    return [];
  }

  return data;
};

// ── Detect fancy bet ──────────────────────────────────────────────────────
const isFancyBet = (bet, item) => {
  return (
    item.selection_name?.toLowerCase() === "fancy" ||
    bet.selectionName?.toLowerCase() === "fancy" ||
    bet.selectionName?.toLowerCase() === "premium fancy" ||
    (item.market_id && item.market_id.includes(".FY"))
  );
};

// ── P&L helpers ───────────────────────────────────────────────────────────
const calcMatchOddsPnL = (side, stake, price) => {
  const odds = Number(price);
  if (side === "back") {
    return (odds - 1) * stake;
  } else {
    return stake;
  }
};

const calcFancyPnL = (side, stake, rate) => {
  const r = Number(rate) / 100;
  if (side === "back") {
    return stake * r;
  } else {
    return stake;
  }
};

// ── Get fancyRate from bet or fallback to sent_payload ────────────────────
const getFancyRate = (bet) => {
  return (
    Number(bet.fancyRate) ||
    Number(bet.settlementResponse?.sent_payload?.fancy_rate) ||
    0
  );
};

// ── Per-user settlement lock ────────────────────────────────────────────
// ✅ The eventType lock below (withEventTypeLock) only prevents two
// settlement runs for the SAME MATCH from overlapping — it does
// nothing to stop two DIFFERENT matches' settlement runs, for the
// SAME USER, from racing each other. If two matches finish around the
// same time and both get processed (even by separate calls to this
// function), a user with pending bets on both could have their wallet
// hit by two concurrent recalculateExposure()+write sequences — each
// reading exposure via a plain await OUTSIDE the atomic pipeline,
// before the other's write is visible. That produces the exact
// symptom of several different bets, across different matches,
// showing the identical "After Balance" despite different stakes/PL.
const userLocks = new Map(); // userId (string) -> tail of that user's settlement chain

function withUserLock(userId, fn) {
  const key = String(userId);
  const prevLock = userLocks.get(key) || Promise.resolve();
  const nextLock = prevLock.then(fn, fn); // run after prior settles, regardless of prior success/failure
  userLocks.set(key, nextLock.catch(() => {})); // error-swallowed tail tracker only — real errors still propagate via nextLock
  return nextLock;
}

// ── Main settlement processor ─────────────────────────────────────────────
const processSettlement = async (eventTypeId) => {
  const data = await fetchSettlementData(eventTypeId);

  let processed = 0;
  let skipped = 0;

  for (const item of data) {
    // Skip bets the provider hasn't settled yet
    if (item.status === "Pending") {
      skipped++;
      continue;
    }

    // Find the bet in DB
    const bet = await Bet.findOne({ betId: item.bet_id });

    if (!bet) {
      skipped++;
      continue;
    }

    // Already settled — skip
    if (bet.status !== "Pending") {
      skipped++;
      continue;
    }

    // Find the user
    const user = await User.findById(bet.userId);

    if (!user) {
      skipped++;
      continue;
    }

    const stake     = Number(bet.stake);
    const fancy     = isFancyBet(bet, item);
    const fancyRate = getFancyRate(bet);

    // =========================
    // P&L CALCULATION
    // =========================
    let profitLoss = 0;

    if (item.status === "Won") {
      profitLoss = fancy
        ? calcFancyPnL(bet.side, stake, fancyRate)
        : calcMatchOddsPnL(bet.side, stake, item.price);
    }

    if (item.status === "Lost") {
      if (fancy) {
        profitLoss = bet.side === "back"
          ? -stake
          : -(fancyRate / 100) * stake;
      } else {
        profitLoss = -(bet.side === "back"
          ? stake
          : (Number(item.price) - 1) * stake);
      }
    }

    // Void / Invalid → profitLoss stays 0

    // ✅ Serialized per user — see withUserLock's comment above. This
    // wraps EVERYTHING that reads/writes this user's wallet for this
    // bet, so a concurrent settlement run for a DIFFERENT match, same
    // user, can't interleave with it.
    await withUserLock(bet.userId, async () => {
      bet.status     = item.status;
      bet.profitLoss = profitLoss;
      bet.settledAt  = new Date();
      await bet.save();

      let newExposure = 0;
      try {
        newExposure = await recalculateExposure(bet.userId, null, false);
      } catch (err) {
        console.error(`Exposure recalculation failed for user ${bet.userId}:`, err.message);
        newExposure = 0;
      }

      const preWriteUser = await User.findById(bet.userId).select("wallet.availableBalance");
      const balanceBeforeSnapshot = preWriteUser?.wallet?.availableBalance ?? null;

      await User.findByIdAndUpdate(
        bet.userId,
        [
          {
            $set: {
              "wallet.balance": {
                $add: [{ $ifNull: ["$wallet.balance", 0] }, profitLoss],
              },
              "wallet.exposure": newExposure,
              "wallet.totalLiability": 0,
              "wallet.totalProfit": {
                $add: [
                  { $ifNull: ["$wallet.totalProfit", 0] },
                  item.status === "Won" ? Math.max(profitLoss, 0) : 0,
                ],
              },
              "wallet.totalLoss": {
                $add: [
                  { $ifNull: ["$wallet.totalLoss", 0] },
                  item.status === "Lost" ? Math.abs(Math.min(profitLoss, 0)) : 0,
                ],
              },
              "stats.totalWins": {
                $add: [
                  { $ifNull: ["$stats.totalWins", 0] },
                  item.status === "Won" ? 1 : 0,
                ],
              },
              "stats.totalLosses": {
                $add: [
                  { $ifNull: ["$stats.totalLosses", 0] },
                  item.status === "Lost" ? 1 : 0,
                ],
              },
            },
          },
          {
            $set: {
              "wallet.availableBalance": {
                $max: [
                  0,
                  {
                    $subtract: [
                      "$wallet.balance",
                      {
                        $add: [
                          "$wallet.exposure",
                          { $ifNull: ["$wallet.casinoExposure", 0] },
                        ],
                      },
                    ],
                  },
                ],
              },
            },
          },
        ],
        { updatePipeline: true }
      );

      const postWriteUser = await User.findById(bet.userId).select("wallet.availableBalance");
      bet.balanceBefore = balanceBeforeSnapshot;
      bet.balanceAfter  = postWriteUser?.wallet?.availableBalance ?? null;
      await bet.save();
    });

    processed++;
  }

  return { success: true, processed, skipped, total: data.length };
};

// ════════════════════════════════════════════════════════════════════════
// ROLLBACK SUPPORT
// ════════════════════════════════════════════════════════════════════════

// ── Per-eventTypeId lock, shared between cron settlement and rollback ─────
// Prevents the cron loop and a manual rollback from processing the same
// eventTypeId's bets concurrently (which could double-credit a wallet).
const lockedEventTypes = new Set();

const withEventTypeLock = async (eventTypeId, fn) => {
  const key = String(eventTypeId);
  if (lockedEventTypes.has(key)) {
    return { locked: true, skipped: true };
  }
  lockedEventTypes.add(key);
  try {
    const result = await fn();
    return { locked: false, ...result };
  } finally {
    lockedEventTypes.delete(key);
  }
};

// Wrap processSettlement so every caller (cron + rollback) goes through the lock.
const processSettlementLocked = async (eventTypeId) => {
  const outcome = await withEventTypeLock(eventTypeId, () => processSettlement(eventTypeId));
  if (outcome.skipped) {
    return { success: true, processed: 0, skipped: 0, total: 0, note: "eventTypeId locked, try again shortly" };
  }
  return outcome;
};

// ── Revert one already-settled bet's wallet effect and put it back to Pending
const revertBet = async (bet) =>
  withUserLock(bet.userId, async () => {
    const userId = bet.userId;
    const reversalAmount = -Number(bet.profitLoss || 0); // undo old P&L exactly

    await User.findByIdAndUpdate(
      userId,
      [
        {
          $set: {
            "wallet.balance": {
              $add: [{ $ifNull: ["$wallet.balance", 0] }, reversalAmount],
            },
            "wallet.totalProfit": {
              $subtract: [
                { $ifNull: ["$wallet.totalProfit", 0] },
                bet.status === "Won" ? Math.max(bet.profitLoss, 0) : 0,
              ],
            },
            "wallet.totalLoss": {
              $subtract: [
                { $ifNull: ["$wallet.totalLoss", 0] },
                bet.status === "Lost" ? Math.abs(Math.min(bet.profitLoss, 0)) : 0,
              ],
            },
            "stats.totalWins": {
              $add: [{ $ifNull: ["$stats.totalWins", 0] }, bet.status === "Won" ? -1 : 0],
            },
            "stats.totalLosses": {
              $add: [{ $ifNull: ["$stats.totalLosses", 0] }, bet.status === "Lost" ? -1 : 0],
            },
          },
        },
      ],
      { updatePipeline: true }
    );

    bet.status = "Pending";
    bet.profitLoss = 0;
    bet.settledAt = undefined;
    bet.balanceBefore = undefined;
    bet.balanceAfter = undefined;
    await bet.save();

    // Resync exposure + availableBalance now that this bet counts as open again
    let newExposure = 0;
    try {
      newExposure = await recalculateExposure(userId, null, false);
    } catch (err) {
      console.error(`Exposure recalc failed during rollback for user ${userId}:`, err.message);
    }

    const freshUser = await User.findById(userId);
    if (freshUser) {
      const availableBalance = Math.max(
        0,
        freshUser.wallet.balance - newExposure - (freshUser.wallet.casinoExposure || 0)
      );
      await User.findByIdAndUpdate(userId, {
        $set: { "wallet.exposure": newExposure, "wallet.availableBalance": availableBalance },
      });
    }
  });

// ── DRY RUN: preview what a rollback would do, without writing anything ───
const previewRollbackForEvent = async (eventId) => {
  if (!eventId) {
    throw Object.assign(new Error("eventId is required"), { code: "BAD_REQUEST" });
  }

  const settledBets = await Bet.find({
    eventId: String(eventId),
    status: { $in: ["Won", "Lost", "Void", "Invalid"] },
  }).populate("userId", "username wallet.balance");

  if (!settledBets.length) {
    return { success: true, message: "No settled bets found for this eventId", preview: [] };
  }

  const preview = settledBets.map((bet) => ({
    betId: bet.betId,
    userId: bet.userId?._id || bet.userId,
    username: bet.userId?.username,
    currentStatus: bet.status,
    currentProfitLoss: bet.profitLoss,
    walletBalanceReversal: -Number(bet.profitLoss || 0),
    currentUserBalance: bet.userId?.wallet?.balance ?? null,
    balanceAfterRevertOnly: bet.userId?.wallet?.balance != null
      ? bet.userId.wallet.balance + (-Number(bet.profitLoss || 0))
      : null,
    note: "Actual re-settled result depends on the provider's corrected data — this only shows the revert step.",
  }));

  return {
    success: true,
    eventId,
    eventTypeId: settledBets[0].eventTypeId,
    betsAffected: settledBets.length,
    preview,
  };
};

// ── Main rollback entrypoint: eventId in → revert + re-settle out ─────────
const rollbackSettlementForEvent = async (eventId) => {
  if (!eventId) {
    throw Object.assign(new Error("eventId is required"), { code: "BAD_REQUEST" });
  }

  const settledBets = await Bet.find({
    eventId: String(eventId),
    status: { $in: ["Won", "Lost", "Void", "Invalid"] },
  });

  if (!settledBets.length) {
    return { success: true, message: "No settled bets found for this eventId", reverted: 0 };
  }

  const eventTypeId = settledBets[0].eventTypeId;

  let reverted = 0;
  const failures = [];
  for (const bet of settledBets) {
    try {
      await revertBet(bet);
      reverted++;
    } catch (err) {
      console.error(`Rollback failed for bet ${bet.betId}:`, err.message);
      failures.push({ betId: bet.betId, error: err.message });
    }
  }

  // Re-fetch provider data and re-settle — now that the bets are Pending again,
  // processSettlement will pick them up with the corrected result.
  let resettleResult = { processed: 0, skipped: 0, total: 0 };
  if (eventTypeId) {
    resettleResult = await processSettlementLocked(eventTypeId);
  }

  return {
    success: true,
    eventId,
    eventTypeId,
    reverted,
    failures,
    resettle: resettleResult,
  };
};

module.exports = {
  processSettlement,
  processSettlementLocked,
  rollbackSettlementForEvent,
  previewRollbackForEvent,
};