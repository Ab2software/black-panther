const Bet = require("../../model/bet");
const User = require("../../model/User");
const { settleSingleBet } = require("../../services/settlementCore");
// ============================================================
// HELPER: resolve the set of admin IDs this admin can see data for.
// = themself + any sub-admins (role: "admin") they personally created.
// Assumes a max 2-level hierarchy (superadmin -> admin -> user).
// ============================================================
const getScopeIds = async (adminId) => {
  const subAdminIds = await User.find({
    createdBy: adminId,
    role: "admin",
  }).distinct("_id");
  return [adminId, ...subAdminIds];
};

// ── GET /api/v1/admin/bets ────────────────────────────────────────────────
const getAllBets = async (req, res) => {
  try {
    const { status, sport, search, siteId, page = 1, limit = 20 } = req.query;

    // 🔒 Scope to users belonging to this admin or their sub-admins
    const scopeIds = await getScopeIds(req.admin._id);
    const scopedUserIds = await User.find({
      assignedAdmin: { $in: scopeIds },
    }).distinct("_id");

    const filter = { userId: { $in: scopedUserIds } };
    if (status) filter.status = status;
    if (sport)  filter.sport  = sport;
    if (siteId) filter.siteId = siteId;

    const bets = await Bet.find(filter)
      .populate("userId", "username email phone")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const filtered = search
      ? bets.filter((b) => {
          const u = b.userId;
          return (
            u?.username?.toLowerCase().includes(search.toLowerCase()) ||
            u?.email?.toLowerCase().includes(search.toLowerCase())
          );
        })
      : bets;

    const total = await Bet.countDocuments(filter);

    return res.status(200).json({
      success: true,
      total,
      page: Number(page),
      data: filtered,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/v1/admin/analytics ───────────────────────────────────────────
// NOTE: this currently reports across ALL sites/admins by design
// (siteBreakdown intentionally shows every site side by side). If you
// want this scoped per-admin too, apply the same scopedUserIds filter
// inside every $match stage below — flag it and I'll wire it up.
const getAnalytics = async (req, res) => {
  try {
    const { siteId } = req.query;

    // Base match stage — applied to every aggregation pipeline
    const matchStage = siteId ? { $match: { siteId } } : { $match: {} };

    // 1. Status breakdown
    const statusBreakdown = await Bet.aggregate([
      matchStage,
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalStake: { $sum: "$stake" },
        },
      },
    ]);

    // 2. Back vs Lay ratio
    const sideRatio = await Bet.aggregate([
      matchStage,
      {
        $group: {
          _id: "$side",
          count: { $sum: 1 },
          totalStake: { $sum: "$stake" },
        },
      },
    ]);

    // 3. Top matches by volume
    const topMatches = await Bet.aggregate([
      matchStage,
      {
        $group: {
          _id: "$matchName",
          totalBets: { $sum: 1 },
          totalStake: { $sum: "$stake" },
        },
      },
      { $sort: { totalStake: -1 } },
      { $limit: 10 },
    ]);

    // 4. Sport-wise stats
    const sportStats = await Bet.aggregate([
      matchStage,
      {
        $group: {
          _id: "$sport",
          totalBets: { $sum: 1 },
          totalStake: { $sum: "$stake" },
        },
      },
      { $sort: { totalBets: -1 } },
    ]);

    // 5. Top users by stake
    const topUsers = await Bet.aggregate([
      matchStage,
      {
        $group: {
          _id: "$userId",
          totalStake: { $sum: "$stake" },
          totalBets: { $sum: 1 },
        },
      },
      { $sort: { totalStake: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },
      {
        $project: {
          totalStake: 1,
          totalBets: 1,
          "user.username": 1,
          "user.fullName": 1,
          "user.email": 1,
          "user.phone": 1,
        },
      },
    ]);

    // 6. Overall summary
    const summary = await Bet.aggregate([
      matchStage,
      {
        $group: {
          _id: null,
          totalBets: { $sum: 1 },
          totalStake: { $sum: "$stake" },
          totalPnL: { $sum: "$profitLoss" },
          pendingBets: {
            $sum: { $cond: [{ $eq: ["$status", "Pending"] }, 1, 0] },
          },
        },
      },
    ]);

    // 7. Per-site breakdown (always returned regardless of filter)
    const siteBreakdown = await Bet.aggregate([
      {
        $group: {
          _id: "$siteId",
          totalBets: { $sum: 1 },
          totalStake: { $sum: "$stake" },
          totalPnL: { $sum: "$profitLoss" },
          pendingBets: {
            $sum: { $cond: [{ $eq: ["$status", "Pending"] }, 1, 0] },
          },
        },
      },
      { $sort: { totalBets: -1 } },
    ]);

    return res.status(200).json({
      success: true,
      data: {
        summary:        summary[0] || {},
        siteBreakdown,  // ← always shows all sites side by side
        statusBreakdown,
        sideRatio,
        topMatches,
        sportStats,
        topUsers,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ── PATCH /api/v1/admin/bets/:id/settle ────────────────────────────────────
const settleBetManually = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, price } = req.body;

    const allowedStatuses = ["Won", "Lost", "Void", "Cancelled"];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status" });
    }

    const bet = await Bet.findById(id).populate("userId", "assignedAdmin");
    if (!bet) {
      return res.status(404).json({ success: false, message: "Bet not found" });
    }
    if (bet.status !== "Pending") {
      return res.status(400).json({ success: false, message: `Bet already settled as ${bet.status}` });
    }

    // 🔒 scope check — same hierarchy rule as getAllBets
    const scopeIds = await getScopeIds(req.admin._id);
    const ownerAdminId = bet.userId?.assignedAdmin?.toString();
    if (!scopeIds.map(String).includes(ownerAdminId)) {
      return res.status(403).json({ success: false, message: "Not authorized to settle this bet" });
    }

    const result = await settleSingleBet(bet, status, {
      price,
      settledBy: req.admin._id,
      manual: true,
    });

    return res.status(200).json({
      success: true,
      data: {
        _id: bet._id,
        status: bet.status,
        profitLoss: result.profitLoss,
        balanceAfter: bet.balanceAfter,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getAllBets, getAnalytics, settleBetManually };