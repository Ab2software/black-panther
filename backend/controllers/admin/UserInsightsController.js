const mongoose = require("mongoose");
const usermodel = require("../../model/User");
const PaymentRequest = require("../../model/PaymentRequest");
const WithdrawRequest = require("../../model/WithdrawRequest");
const Bet = require("../../model/bet");
const GameTransaction = require("../../model/GameTransaction");

// ─── HELPERS ─────────────────────────────
const buildDateMatch = (dateFrom, dateTo) => {
  const match = {};
  if (dateFrom || dateTo) {
    match.createdAt = {};
    if (dateFrom) {
      const from = new Date(dateFrom);
      from.setHours(0, 0, 0, 0);
      match.createdAt.$gte = from;
    }
    if (dateTo) {
      const to = new Date(dateTo);
      to.setHours(23, 59, 59, 999);
      match.createdAt.$lte = to;
    }
  }
  return match;
};

const getAdminOrReject = async (req, res) => {
  const adminId = req.user?.id;
  if (!adminId) {
    res.status(401).json({ success: false, message: "Unauthorized" });
    return null;
  }
  const admin = await usermodel.findById(adminId);
  if (!admin || !["admin", "superadmin", "owner"].includes(admin.role)) {
    res.status(403).json({ success: false, message: "Forbidden" });
    return null;
  }
  return admin;
};

const canAccessUser = (admin, targetUser) => {
  if (["superadmin", "owner"].includes(admin.role)) return true;
  return (
    targetUser.assignedAdmin &&
    String(targetUser.assignedAdmin) === String(admin._id)
  );
};

// ─── SEARCH USERS (for admin to pick a user) ─────────────────────────────
const searchUsers = async (req, res) => {
  try {
    const admin = await getAdminOrReject(req, res);
    if (!admin) return;

    const { q = "" } = req.query;

    let filter = {
      role: "user",
      deletedAt: null,
    };

    if (admin.role !== "superadmin" && admin.role !== "owner") {
      filter.assignedAdmin = admin._id;
    }

    if (q.trim()) {
      const regex = new RegExp(q.trim(), "i");
      filter.$or = [
        { username: regex },
        { fullName: regex },
        { email: regex },
        { phone: regex },
      ];
    }

    const users = await usermodel
      .find(filter)
      .select("username fullName email phone wallet.balance status siteId createdAt")
      .limit(25)
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, users });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─── SUMMARY STATS FOR A SINGLE USER ─────────────────────────────
const getUserSummary = async (req, res) => {
  try {
    const admin = await getAdminOrReject(req, res);
    if (!admin) return;

    const { userId } = req.params;
    const { dateFrom, dateTo } = req.query;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ success: false, message: "Invalid user id" });
    }

    const targetUser = await usermodel
      .findById(userId)
      .select("username fullName email phone wallet role status createdAt assignedAdmin siteId");

    if (!targetUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (!canAccessUser(admin, targetUser)) {
      return res.status(403).json({ success: false, message: "Not allowed to view this user" });
    }

    const dateMatch = buildDateMatch(dateFrom, dateTo);
    const userObjectId = new mongoose.Types.ObjectId(userId);

    const [depositAgg, withdrawAgg, betAgg, gameAgg] = await Promise.all([
      PaymentRequest.aggregate([
        { $match: { userId: userObjectId, status: "approved", ...dateMatch } },
        { $group: { _id: null, total: { $sum: "$price" }, count: { $sum: 1 } } },
      ]),
      WithdrawRequest.aggregate([
        { $match: { userId: userObjectId, status: "approved", ...dateMatch } },
        { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } },
      ]),
      Bet.aggregate([
        { $match: { userId: userObjectId, ...dateMatch } },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
            totalStake: { $sum: "$stake" },
            totalProfitLoss: { $sum: "$profitLoss" },
          },
        },
      ]),
      GameTransaction.aggregate([
        { $match: { userId: userObjectId, ...dateMatch } },
        {
          $group: {
            _id: "$result",
            count: { $sum: 1 },
            totalBetAmount: { $sum: "$betAmount" },
            totalWinAmount: { $sum: "$winAmount" },
          },
        },
      ]),
    ]);

    // ── shape sports betting stats ──
    const sportsStats = {
      totalBetsPlaced: 0,
      totalStake: 0,
      wonCount: 0,
      wonAmount: 0,
      lostCount: 0,
      lostAmount: 0,
      pendingCount: 0,
      voidCount: 0,
    };

    betAgg.forEach((row) => {
      sportsStats.totalBetsPlaced += row.count;
      sportsStats.totalStake += row.totalStake || 0;

      if (row._id === "Won") {
        sportsStats.wonCount = row.count;
        sportsStats.wonAmount = row.totalProfitLoss || 0;
      } else if (row._id === "Lost") {
        sportsStats.lostCount = row.count;
        sportsStats.lostAmount = Math.abs(row.totalProfitLoss || 0);
      } else if (row._id === "Pending") {
        sportsStats.pendingCount = row.count;
      } else if (["Void", "Cancelled", "Invalid", "CashOut", "LossCut"].includes(row._id)) {
        sportsStats.voidCount += row.count;
      }
    });

    // ── shape casino/slot game stats ──
    const casinoStats = {
      totalBetsPlaced: 0,
      totalBetAmount: 0,
      wonCount: 0,
      wonAmount: 0,
      lossCount: 0,
      pendingCount: 0,
    };

    gameAgg.forEach((row) => {
      casinoStats.totalBetsPlaced += row.count;
      casinoStats.totalBetAmount += row.totalBetAmount || 0;

      if (row._id === "WIN") {
        casinoStats.wonCount = row.count;
        casinoStats.wonAmount = row.totalWinAmount || 0;
      } else if (row._id === "LOSS") {
        casinoStats.lossCount = row.count;
      } else if (row._id === "PENDING") {
        casinoStats.pendingCount = row.count;
      }
    });

    const combined = {
      totalGamePlayBet: sportsStats.totalStake + casinoStats.totalBetAmount,
      totalWon: sportsStats.wonAmount + casinoStats.wonAmount,
      totalBetsPlaced: sportsStats.totalBetsPlaced + casinoStats.totalBetsPlaced,
    };

    return res.status(200).json({
      success: true,
      user: targetUser,
      deposit: {
        total: depositAgg[0]?.total || 0,
        count: depositAgg[0]?.count || 0,
      },
      withdrawal: {
        total: withdrawAgg[0]?.total || 0,
        count: withdrawAgg[0]?.count || 0,
      },
      sportsBetting: sportsStats,
      casinoGaming: casinoStats,
      combined,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─── PAGINATED BET (SPORTS) HISTORY ─────────────────────────────
const getUserBetHistory = async (req, res) => {
  try {
    const admin = await getAdminOrReject(req, res);
    if (!admin) return;

    const { userId } = req.params;
    const { dateFrom, dateTo, status, page = 1, limit = 20 } = req.query;

    const targetUser = await usermodel.findById(userId).select("assignedAdmin");
    if (!targetUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    if (!canAccessUser(admin, targetUser)) {
      return res.status(403).json({ success: false, message: "Not allowed to view this user" });
    }

    const filter = {
      userId,
      ...buildDateMatch(dateFrom, dateTo),
    };
    if (status && status !== "all") {
      filter.status = status;
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [bets, total] = await Promise.all([
      Bet.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      Bet.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      bets,
      pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─── PAGINATED CASINO/GAME HISTORY ─────────────────────────────
const getUserGameHistory = async (req, res) => {
  try {
    const admin = await getAdminOrReject(req, res);
    if (!admin) return;

    const { userId } = req.params;
    const { dateFrom, dateTo, result, page = 1, limit = 20 } = req.query;

    const targetUser = await usermodel.findById(userId).select("assignedAdmin");
    if (!targetUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    if (!canAccessUser(admin, targetUser)) {
      return res.status(403).json({ success: false, message: "Not allowed to view this user" });
    }

    const filter = {
      userId,
      ...buildDateMatch(dateFrom, dateTo),
    };
    if (result && result !== "all") {
      filter.result = result;
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [games, total] = await Promise.all([
      GameTransaction.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      GameTransaction.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      games,
      pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─── PAGINATED FINANCE (DEPOSIT + WITHDRAW) HISTORY ─────────────────────────────
const getUserFinanceHistory = async (req, res) => {
  try {
    const admin = await getAdminOrReject(req, res);
    if (!admin) return;

    const { userId } = req.params;
    const { dateFrom, dateTo, type = "all", page = 1, limit = 20 } = req.query;

    const targetUser = await usermodel.findById(userId).select("assignedAdmin");
    if (!targetUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    if (!canAccessUser(admin, targetUser)) {
      return res.status(403).json({ success: false, message: "Not allowed to view this user" });
    }

    const dateMatch = buildDateMatch(dateFrom, dateTo);
    const baseUrl = process.env.BACKEND_URL || `${req.protocol}://${req.get("host")}`;

    let deposits = [];
    let withdraws = [];

    if (type === "all" || type === "deposit") {
      deposits = await PaymentRequest.find({ userId, ...dateMatch }).sort({ createdAt: -1 });
      deposits = deposits.map((d) => {
        const obj = d.toObject();
        obj.type = "deposit";
        if (obj.paymentScreenshot?.startsWith("/uploads/")) {
          obj.paymentScreenshotUrl = baseUrl + obj.paymentScreenshot;
        }
        return obj;
      });
    }

    if (type === "all" || type === "withdraw") {
      withdraws = await WithdrawRequest.find({ userId, ...dateMatch }).sort({ createdAt: -1 });
      withdraws = withdraws.map((w) => {
        const obj = w.toObject();
        obj.type = "withdraw";
        if (obj.proofImage?.startsWith("/uploads/")) {
          obj.proofImageUrl = baseUrl + obj.proofImage;
        }
        return obj;
      });
    }

    const combined = [...deposits, ...withdraws].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    // simple in-memory pagination since it's a merged two-collection result
    const skip = (Number(page) - 1) * Number(limit);
    const paged = combined.slice(skip, skip + Number(limit));

    return res.status(200).json({
      success: true,
      transactions: paged,
      pagination: {
        total: combined.length,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(combined.length / limit),
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  searchUsers,
  getUserSummary,
  getUserBetHistory,
  getUserGameHistory,
  getUserFinanceHistory,
};