const User = require("../model/User");
const { recalculateExposure } = require("./exposureService");

// ── Per-user settlement lock ────────────────────────────────────────────
// ✅ Ensures settleSingleBet calls for the SAME user are processed
// strictly one at a time, even if the caller invokes several of them
// concurrently (e.g. Promise.all over multiple bets on the same match
// that all resolved together). Without this, recalculateExposure()
// below — which reads whatever's currently Pending via a plain await,
// OUTSIDE the atomic wallet-write pipeline — can run for bet #2 before
// bet #1's own settlement has become visible, so both read the same
// stale exposure and therefore write the same stale availableBalance.
// That produces exactly the symptom of several different bets all
// showing the identical "After Balance" despite different stakes/odds.
//
// This is an in-process lock only (a Map of promise chains) — it does
// NOT protect against races across multiple server processes/PM2
// cluster workers. If this app ever runs settlement across more than
// one process, this needs to become a DB-level or Redis-based lock
// instead.
const userLocks = new Map(); // userId (string) -> tail of that user's settlement chain

function withUserLock(userId, fn) {
  const key = String(userId);
  const prevLock = userLocks.get(key) || Promise.resolve();
  const nextLock = prevLock.then(fn, fn); // run after prior settles, regardless of prior success/failure
  // Store an error-swallowed copy just to track the chain's tail — the
  // real error (if any) still propagates to the caller via nextLock,
  // this just stops one failed settlement from wedging the lock for
  // every future settlement of the same user.
  userLocks.set(key, nextLock.catch(() => {}));
  return nextLock;
}

// ── Detect fancy bet (same logic as auto-settlement, minus the
//    vendor `item` fields which manual settlement doesn't have) ───────────
const isFancyBet = (bet) => {
  return (
    bet.selectionName?.toLowerCase() === "fancy" ||
    bet.selectionName?.toLowerCase() === "premium fancy" ||
    (bet.marketId && bet.marketId.includes(".FY"))
  );
};

const calcMatchOddsPnL = (side, stake, price) => {
  const odds = Number(price);
  return side === "back" ? (odds - 1) * stake : stake;
};

const calcFancyPnL = (side, stake, rate) => {
  const r = Number(rate) / 100;
  return side === "back" ? stake * r : stake;
};

const getFancyRate = (bet) => {
  return (
    Number(bet.fancyRate) ||
    Number(bet.settlementResponse?.sent_payload?.fancy_rate) ||
    0
  );
};

/**
 * Settles a single Pending bet: computes profitLoss, saves the bet,
 * recalculates exposure, and updates the user's wallet.
 * Used by BOTH the vendor auto-settlement loop and the admin manual-settle
 * endpoint, so the two can never disagree on how P&L is calculated.
 *
 * @param {Bet}    bet    - Mongoose Bet doc, must currently be "Pending"
 * @param {String} status - "Won" | "Lost" | "Void" | "Cancelled"
 * @param {Object} [opts]
 * @param {Number} [opts.price]      - odds override (defaults to bet.price)
 * @param {String} [opts.settledBy]  - admin _id, for audit trail
 * @param {Boolean}[opts.manual]     - flags this as a manual settlement
 */
const settleSingleBetInternal = async (bet, status, opts = {}) => {
  if (bet.status !== "Pending") {
    throw new Error(`Bet ${bet._id} is already settled (${bet.status})`);
  }

  const user = await User.findById(bet.userId);
  if (!user) throw new Error(`User ${bet.userId} not found for bet ${bet._id}`);

  const stake     = Number(bet.stake);
  const fancy     = isFancyBet(bet);
  const fancyRate = getFancyRate(bet);
  const price     = opts.price != null ? opts.price : bet.price;

  let profitLoss = 0;

  if (status === "Won") {
    profitLoss = fancy
      ? calcFancyPnL(bet.side, stake, fancyRate)
      : calcMatchOddsPnL(bet.side, stake, price);
  }

  if (status === "Lost") {
    profitLoss = fancy
      ? (bet.side === "back" ? -stake : -(fancyRate / 100) * stake)
      : -(bet.side === "back" ? stake : (Number(price) - 1) * stake);
  }

  // Void / Cancelled → profitLoss stays 0

  // ── Set everything EXCEPT balanceAfter and save. balanceAfter can't be
  // known yet — it depends on the atomic wallet write below, which hasn't
  // happened. Setting it here from a JS-computed snapshot (user.wallet.balance
  // + profitLoss) is exactly what caused the bug: under concurrent
  // settlements on the same user, that snapshot can be stale by the time
  // this write lands, producing balanceAfter values that don't match what
  // actually happened to the wallet (including impossible negative numbers).
  bet.status       = status;
  bet.profitLoss   = profitLoss;
  bet.settledAt    = new Date();
  if (opts.settledBy) bet.settledBy = opts.settledBy;       // needs adding to schema — see note below
  if (opts.manual)    bet.settledManually = true;            // needs adding to schema — see note below
  await bet.save();

  let newExposure = 0;
  try {
    newExposure = await recalculateExposure(bet.userId, null, false);
  } catch (err) {
    console.error(`Exposure recalculation failed for user ${bet.userId}:`, err.message);
  }

  // =========================
  // UPDATE USER WALLET + STATS — atomic pipeline write, mirroring the
  // vendor auto-settlement path so BOTH settlement paths write the wallet
  // the exact same safe way:
  //   1. wallet.balance is incremented by profitLoss IN THE DATABASE at
  //      write time, not computed in JS from a stale read and $set —
  //      closes the lost-update race against a concurrent casino
  //      bet/settlement on the same user.
  //   2. wallet.availableBalance subtracts BOTH exposure buckets
  //      (sports `exposure`, freshly computed above, AND casino's
  //      `casinoExposure`, read live at write time).
  //   3. `{ new: true }` returns the POST-write document, so we can read
  //      back the real, authoritative wallet.balance instead of guessing
  //      it in JS beforehand.
  // =========================
  const updatedUser = await User.findByIdAndUpdate(
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
              status === "Won" ? Math.max(profitLoss, 0) : 0,
            ],
          },
          "wallet.totalLoss": {
            $add: [
              { $ifNull: ["$wallet.totalLoss", 0] },
              status === "Lost" ? Math.abs(Math.min(profitLoss, 0)) : 0,
            ],
          },
          "stats.totalWins": {
            $add: [
              { $ifNull: ["$stats.totalWins", 0] },
              status === "Won" ? 1 : 0,
            ],
          },
          "stats.totalLosses": {
            $add: [
              { $ifNull: ["$stats.totalLosses", 0] },
              status === "Lost" ? 1 : 0,
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
    { updatePipeline: true, new: true }
  );

  // ── balanceAfter now reflects the REAL post-write wallet.availableBalance
  // (spendable funds, after both sports and casino exposure are
  // subtracted) — read back from the atomic update above, not a
  // pre-write JS guess. This is immune to concurrent settlements
  // racing on the same user; whichever write actually landed second
  // will correctly show the cumulative result, not a value computed
  // from a stale read.
  //
  // ✅ Changed from wallet.balance (raw total funds) to
  // wallet.availableBalance — showing raw balance was misleading
  // whenever the user has other Pending bets still holding exposure:
  // it looked like more was available than the user could actually
  // withdraw or place a new bet with.
  bet.balanceAfter = updatedUser.wallet.availableBalance;
  await bet.save();

  return { bet, profitLoss, newBalance: updatedUser.wallet.balance };
};

// ── Public entry point — serializes per-user via withUserLock so
// concurrent settlements for the same user (e.g. several bets on one
// match settled together) can never race on exposure/balance reads.
// See withUserLock's comment above for the full explanation.
//
// 🔧 FIX: bet.userId can arrive two different shapes depending on the
// caller —
//   • vendor auto-settlement fetches plain Bet docs → bet.userId is a
//     raw ObjectId
//   • admin manual settle (settleBetManually) does
//     .populate("userId", "assignedAdmin") → bet.userId is a full User
//     document
// String(<populated User doc>) does NOT give you the hex id — it falls
// through to Object.prototype.toString ("[object Object]"). That meant
// manual settles and auto settles for the SAME real user were locking
// under two DIFFERENT keys, so withUserLock silently failed to
// serialize them against each other — letting their exposure/balance
// reads race exactly like before the lock was introduced, which is
// what produced identical/duplicated `balanceAfter` values across a
// batch of bets settled together. Unwrapping to the real id here fixes
// it for every caller in one place.
const settleSingleBet = (bet, status, opts = {}) => {
  const userId = bet.userId?._id ?? bet.userId;
  return withUserLock(userId, () => settleSingleBetInternal(bet, status, opts));
};

module.exports = { settleSingleBet, isFancyBet, calcMatchOddsPnL, calcFancyPnL, getFancyRate };