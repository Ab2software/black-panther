// controllers/accountStatementController.js

const { getAccountStatement } = require("../../services/ledgerService");
const Bet = require("../../model/bet");
const User = require("../../model/User");
const GameTransaction = require("../../model/GameTransaction");

exports.getStatement = async (req, res) => {
  try {
    const { clientName, from, to, gameName, accountType } = req.query;
    const siteId = req.admin.siteId; // set by verifyAdminToken — adjust field name to match your middleware

    if (!clientName) {
      return res
        .status(400)
        .json({ success: false, message: "clientName is required" });
    }

    const user = await User.findOne({ username: clientName, siteId }).lean();
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "Client not found" });
    }

    const rows = await getAccountStatement({
      userId: user._id,
      siteId,
      from,
      to,
      gameName,
      accountType,
    });
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error("getStatement error:", err);
    res
      .status(500)
      .json({ success: false, message: "Failed to load account statement" });
  }
};

exports.getRoundDetails = async (req, res) => {
  try {
    const { roundId } = req.params;
    const { clientName } = req.query;

    if (!clientName) {
      return res
        .status(400)
        .json({ success: false, message: "clientName is required" });
    }

    const user = await User.findOne({ username: clientName }).lean();
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "Client not found" });
    }

    const bets = await GameTransaction.find({
      gameRound: roundId,
      userId: user._id,
    })
      .populate("userId", "username")
      .lean();

    if (!bets.length) {
      return res
        .status(404)
        .json({ success: false, message: "Round not found" });
    }

    const totalWin = bets.reduce(
      (sum, b) => sum + ((b.winAmount || 0) - (b.betAmount || 0)),
      0,
    );

    res.json({
      success: true,
      data: {
        roundId,
        matchTime: bets[0].roundTime || bets[0].createdAt,
        gameName: bets[0].gameName,
        totalBets: bets.length,
        totalWin,
        bets: bets.map((b) => ({
          username: b.userId?.username,
          nation: b.nation || "-",
          rate: b.rate ?? "-",
          amount: b.betAmount,
          win: (b.winAmount || 0) - (b.betAmount || 0),
          date: b.createdAt,
          ip: b.ip || "-",
          isDeleted: b.isDeleted || false,
          overAtPlacement: b.overAtPlacement ?? null,
        })),
      },
    });
  } catch (err) {
    console.error("getRoundDetails error:", err);
    res
      .status(500)
      .json({ success: false, message: "Failed to load round details" });
  }
};

exports.getMatchBetDetails = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { clientName, settledMinute } = req.query;

    if (!clientName) {
      return res.status(400).json({ success: false, message: "clientName is required" });
    }

    const user = await User.findOne({ username: clientName }).lean();
    if (!user) {
      return res.status(404).json({ success: false, message: "Client not found" });
    }

    const query = {
      eventId,
      userId: user._id,
      status: { $ne: "Pending" },
    };

    // FIX: when the row being opened represents one same-minute settlement
    // group, narrow to just that minute's bets. Without this, the modal
    // would show every bet ever settled on this match, not just the ones
    // the clicked row's total actually summarizes.
    if (settledMinute) {
      const minuteStart = new Date(settledMinute);
      const minuteEnd = new Date(minuteStart.getTime() + 60000);
      query.settledAt = { $gte: minuteStart, $lt: minuteEnd };
    }

    const bets = await Bet.find(query).lean();

    if (!bets.length) {
      return res.status(404).json({ success: false, message: "No bets found for this match" });
    }

    const totalStake = bets.reduce((s, b) => s + (b.stake || 0), 0);
    const totalProfitLoss = bets.reduce((s, b) => s + (b.profitLoss || 0), 0);

    const isFancySelection = (name = "") => {
      const n = name.toLowerCase();
      return n === "fancy" || n === "premium fancy" || n.startsWith("data ");
    };

    res.json({
      success: true,
      data: {
        eventId,
        matchName: bets[0].matchName,
        sport: bets[0].sport,
        totalBets: bets.length,
        totalStake,
        totalProfitLoss,
        bets: bets.map((b) => {
          const isFancy = isFancySelection(b.selectionName);
          const rate = isFancy ? (b.fancyRate ?? b.rate) : (b.rate ?? b.fancyRate);
          const line = isFancy ? (b.fancyPrice ?? null) : null;

          return {
            betId: b.betId,
            selectionName: b.selectionName,
            side: b.side,
            rate: rate ?? "-",
            line,
            stake: b.stake,
            liability: b.liability,
            status: b.status,
            profitLoss: b.profitLoss,
            settledAt: b.settledAt,
          };
        }),
      },
    });
  } catch (err) {
    console.error("getMatchBetDetails error:", err);
    res.status(500).json({ success: false, message: "Failed to load match bet details" });
  }
};