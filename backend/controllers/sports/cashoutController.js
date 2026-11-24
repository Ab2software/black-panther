const mongoose = require("mongoose");
const Bet = require("../../model/bet");
const User = require("../../model/User");

/**
 * POST /api/bets/cashout
 * Body: { betId, cashOutValue }
 *
 * Flow:
 *  1. Validate bet belongs to user and is cashout-eligible
 *  2. Atomically update Bet (status → CashOut, store cashOutValue)
 *  3. Atomically update User wallet:
 *       - Credit cashOutValue back to balance
 *       - Release exposure that was locked for this bet
 *       - Recalculate availableBalance
 *  4. Return updated bet + wallet snapshot
 */
const cashOut = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const userId = req.user._id; // set by your auth middleware
    const { betId, cashOutValue } = req.body;

    // ── 1. Input validation ──────────────────────────────────────────────
    if (!betId || cashOutValue === undefined || cashOutValue === null) {
      return res.status(400).json({
        success: false,
        message: "betId and cashOutValue are required.",
      });
    }

    const parsedCashOutValue = parseFloat(cashOutValue);
    if (isNaN(parsedCashOutValue) || parsedCashOutValue < 0) {
      return res.status(400).json({
        success: false,
        message: "cashOutValue must be a non-negative number.",
      });
    }

    // ── 2. Fetch & lock the bet ──────────────────────────────────────────
    const bet = await Bet.findOne({ betId, userId }).session(session);

    if (!bet) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: "Bet not found.",
      });
    }

    if (bet.status !== "Pending") {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: `Bet cannot be cashed out. Current status: ${bet.status}`,
      });
    }

    if (!bet.cashOutEnabled) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: "Cash out is not enabled for this bet.",
      });
    }

    // ── 3. Update Bet ────────────────────────────────────────────────────
    bet.status = "CashOut";
    bet.cashOutValue = parsedCashOutValue;
    bet.cashOutAt = new Date();
    // profitLoss = cashOutValue received minus original stake
    bet.profitLoss = parsedCashOutValue - bet.stake;
    await bet.save({ session });

    // ── 4. Update User Wallet ────────────────────────────────────────────
    //
    // When a bet is placed:
    //   - exposure increases by the potential liability
    //   - availableBalance = balance - exposure
    //
    // On cashout we need to:
    //   a) Credit cashOutValue into balance (the return the user gets)
    //   b) Release the exposure that was locked for this bet
    //
    // Exposure locked for a BACK bet = stake (you risk your stake)
    // Exposure locked for a LAY  bet = stake × (price - 1)  — liability
    //
    // availableBalance is auto-recalculated by the User pre-save hook.

    const exposureToRelease = calculateExposure(bet);

    const user = await User.findById(userId).session(session);

    if (!user) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    user.wallet.balance = parseFloat(
      (user.wallet.balance + parsedCashOutValue).toFixed(2)
    );

    user.wallet.exposure = parseFloat(
      Math.max(0, user.wallet.exposure - exposureToRelease).toFixed(2)
    );

    // availableBalance will be recalculated by the pre-save hook
    await user.save({ session });

    // ── 5. Commit ────────────────────────────────────────────────────────
    await session.commitTransaction();

    return res.status(200).json({
      success: true,
      message: "Cash out successful.",
      data: {
        bet: {
          betId: bet.betId,
          status: bet.status,
          cashOutValue: bet.cashOutValue,
          cashOutAt: bet.cashOutAt,
          profitLoss: bet.profitLoss,
          stake: bet.stake,
        },
        wallet: {
          balance: user.wallet.balance,
          exposure: user.wallet.exposure,
          availableBalance: user.wallet.availableBalance,
        },
      },
    });
  } catch (err) {
    await session.abortTransaction();
    console.error("[CashOut Error]", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error during cash out.",
    });
  } finally {
    session.endSession();
  }
};

/**
 * How much exposure was locked when this bet was placed:
 *
 *  BACK bet → user risks their stake        → exposure = stake
 *  LAY  bet → user risks the liability      → exposure = stake × (price - 1)
 */
function calculateExposure(bet) {
  if (bet.side === "back") {
    return bet.stake;
  }
  if (bet.side === "lay") {
    const price = bet.price || bet.rate || 0;
    return parseFloat((bet.stake * (price - 1)).toFixed(2));
  }
  return bet.stake; // fallback
}

module.exports = { cashOut };   