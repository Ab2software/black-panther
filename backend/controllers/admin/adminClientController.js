const mongoose = require("mongoose");
const User = require("../../model/User");
const PaymentRequest = require("../../model/PaymentRequest");
const WithdrawRequest = require("../../model/WithdrawRequest");
const Bet = require("../../model/bet");

// ============================================================
// HELPER: resolve the set of admin IDs this admin can see data for.
// = themself + any sub-admins (role: "admin") they personally created.
// Assumes a max 2-level hierarchy (superadmin -> admin -> user).
// If sub-admins can create their own sub-admins, this needs to be
// made recursive.
// ============================================================
const getScopeIds = async (adminId) => {
  const subAdminIds = await User.find({
    createdBy: adminId,
    role: "admin",
  }).distinct("_id");
  return [adminId, ...subAdminIds];
};

// ============================================================
// HELPER: start of "today" in IST, expressed as a correct UTC Date.
// Independent of the server's local TZ setting (works whether the
// VPS/Node process is UTC, IST, or anything else) because it does
// all Y/M/D reads via UTC getters after shifting by the IST offset,
// then converts back to the equivalent UTC instant.
// ============================================================
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

const getStartOfTodayIST = () => {
  const nowUTC = new Date();
  const istNow = new Date(nowUTC.getTime() + IST_OFFSET_MS);

  return new Date(
    Date.UTC(
      istNow.getUTCFullYear(),
      istNow.getUTCMonth(),
      istNow.getUTCDate(),
      0,
      0,
      0,
    ) - IST_OFFSET_MS,
  );
};

// ============================================================
// GET ALL CLIENTS (Users only, paginated + filtered)
// GET /api/admin/clients
// ============================================================
const getAllClients = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 15,
      search,
      status,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const scopeIds = await getScopeIds(req.admin._id);

    const filter = {
      role: "user",
      deletedAt: null,
      assignedAdmin: { $in: scopeIds },
    };

    if (search) {
      filter.$or = [
        { username: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
      ];
    }

    if (status) filter.status = status;

    const sort = { [sortBy]: sortOrder === "asc" ? 1 : -1 };
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [clients, total] = await Promise.all([
      User.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .select("-password"),
      User.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      data: clients,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "Server error.", error: err.message });
  }
};

// ============================================================
// GET SINGLE CLIENT DETAIL
// GET /api/admin/clients/:id
// ============================================================
const getClientById = async (req, res) => {
  try {
    const { id } = req.params;
    const scopeIds = await getScopeIds(req.admin._id);

    const client = await User.findOne({
      _id: id,
      assignedAdmin: { $in: scopeIds },
      deletedAt: null,
    })
      .select("-password")
      .populate("parentId", "username fullName role")
      .populate("createdBy", "username role")
      .lean();

    if (!client) {
      return res.status(404).json({
        success: false,
        message: "Client not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Client fetched successfully",
      data: client,
    });
  } catch (error) {
    console.error("🔥 Error in getClientById:", error.message);
    return res.status(500).json({
      success: false,
      message: "Error fetching client",
      error: error.message,
    });
  }
};

// ============================================================
// UPDATE CLIENT STATUS (active / blocked / suspended)
// PATCH /api/admin/clients/:id/status
// ============================================================
const updateClientStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowed = ["active", "blocked", "suspended"];
    if (!allowed.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Status must be one of: ${allowed.join(", ")}`,
      });
    }

    const scopeIds = await getScopeIds(req.admin._id);

    const client = await User.findOneAndUpdate(
      { _id: id, assignedAdmin: { $in: scopeIds }, deletedAt: null },
      {
        status,
        "permissions.canLogin": status === "active",
        "permissions.isAccountLocked": status !== "active",
      },
      { new: true, select: "username status permissions" },
    );

    if (!client) {
      return res.status(404).json({
        success: false,
        message: "Client not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: `Client ${status} successfully`,
      data: client,
    });
  } catch (error) {
    console.error("🔥 Error in updateClientStatus:", error.message);
    return res.status(500).json({
      success: false,
      message: "Error updating client status",
      error: error.message,
    });
  }
};

// ============================================================
// UPDATE CLIENT PERMISSIONS
// PATCH /api/admin/clients/:id/permissions
// ============================================================
const updateClientPermissions = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      canLogin,
      canBet,
      canWithdraw,
      canDeposit,
      isBetLocked,
      isAccountLocked,
    } = req.body;

    const updateFields = {};
    if (canLogin !== undefined) updateFields["permissions.canLogin"] = canLogin;
    if (canBet !== undefined) updateFields["permissions.canBet"] = canBet;
    if (canWithdraw !== undefined)
      updateFields["permissions.canWithdraw"] = canWithdraw;
    if (canDeposit !== undefined)
      updateFields["permissions.canDeposit"] = canDeposit;
    if (isBetLocked !== undefined)
      updateFields["permissions.isBetLocked"] = isBetLocked;
    if (isAccountLocked !== undefined)
      updateFields["permissions.isAccountLocked"] = isAccountLocked;

    if (Object.keys(updateFields).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid permission fields provided",
      });
    }

    const scopeIds = await getScopeIds(req.admin._id);

    const client = await User.findOneAndUpdate(
      { _id: id, assignedAdmin: { $in: scopeIds }, deletedAt: null },
      { $set: updateFields },
      { new: true, select: "username permissions" },
    );

    if (!client) {
      return res.status(404).json({
        success: false,
        message: "Client not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Permissions updated successfully",
      data: client,
    });
  } catch (error) {
    console.error("🔥 Error in updateClientPermissions:", error.message);
    return res.status(500).json({
      success: false,
      message: "Error updating permissions",
      error: error.message,
    });
  }
};

// ============================================================
// UPDATE BETTING LIMITS
// PATCH /api/admin/clients/:id/betting-limits
// ============================================================
const updateBettingLimits = async (req, res) => {
  try {
    const { id } = req.params;
    const { minBet, maxBet, maxExposure, maxProfit, minOdds, maxOdds } =
      req.body;

    const updateFields = {};
    if (minBet !== undefined) updateFields["bettingLimits.minBet"] = minBet;
    if (maxBet !== undefined) updateFields["bettingLimits.maxBet"] = maxBet;
    if (maxExposure !== undefined)
      updateFields["bettingLimits.maxExposure"] = maxExposure;
    if (maxProfit !== undefined)
      updateFields["bettingLimits.maxProfit"] = maxProfit;
    if (minOdds !== undefined) updateFields["bettingLimits.minOdds"] = minOdds;
    if (maxOdds !== undefined) updateFields["bettingLimits.maxOdds"] = maxOdds;

    if (Object.keys(updateFields).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid betting limit fields provided",
      });
    }

    const scopeIds = await getScopeIds(req.admin._id);

    const client = await User.findOneAndUpdate(
      { _id: id, assignedAdmin: { $in: scopeIds }, deletedAt: null },
      { $set: updateFields },
      { new: true, select: "username bettingLimits" },
    );

    if (!client) {
      return res.status(404).json({
        success: false,
        message: "Client not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Betting limits updated successfully",
      data: client,
    });
  } catch (error) {
    console.error("🔥 Error in updateBettingLimits:", error.message);
    return res.status(500).json({
      success: false,
      message: "Error updating betting limits",
      error: error.message,
    });
  }
};

// ============================================================
// SOFT DELETE CLIENT
// DELETE /api/admin/clients/:id
// ============================================================
const deleteClient = async (req, res) => {
  try {
    const { id } = req.params;
    const scopeIds = await getScopeIds(req.admin._id);

    const client = await User.findOneAndUpdate(
      { _id: id, assignedAdmin: { $in: scopeIds }, deletedAt: null },
      {
        deletedAt: new Date(),
        status: "blocked",
        "permissions.canLogin": false,
        "permissions.isAccountLocked": true,
      },
      { new: true, select: "username deletedAt status" },
    );

    if (!client) {
      return res.status(404).json({
        success: false,
        message: "Client not found or already deleted",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Client deleted successfully",
      data: client,
    });
  } catch (error) {
    console.error("🔥 Error in deleteClient:", error.message);
    return res.status(500).json({
      success: false,
      message: "Error deleting client",
      error: error.message,
    });
  }
};

// ============================================================
// GET CLIENT STATS SUMMARY (for dashboard cards)
// GET /api/admin/clients/stats
// ============================================================

const getClientStats = async (req, res) => {
  try {
    const adminId = req.admin._id;
    const scopeIds = await getScopeIds(adminId);

    const filter = {
      role: "user",
      deletedAt: null,
      assignedAdmin: {
        $in: scopeIds.map((id) => new mongoose.Types.ObjectId(id)),
      },
    };

    const [total, active, blocked, suspended, demo] = await Promise.all([
      User.countDocuments(filter),
      User.countDocuments({ ...filter, status: "active" }),
      User.countDocuments({ ...filter, status: "blocked" }),
      User.countDocuments({ ...filter, status: "suspended" }),
      User.countDocuments({ ...filter, isDemoUser: true }),
    ]);

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const newThisWeek = await User.countDocuments({
      ...filter,
      createdAt: { $gte: sevenDaysAgo },
    });

    // ── IST-safe "start of today" (12:00 AM IST), independent of
    // the server's local timezone setting ──
    const startOfToday = getStartOfTodayIST();

    const newToday = await User.countDocuments({
      ...filter,
      createdAt: { $gte: startOfToday },
    });

    const balanceAgg = await User.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalBalance: { $sum: "$wallet.balance" },
          totalExposure: { $sum: "$wallet.exposure" },
        },
      },
    ]);

    const balanceData = balanceAgg[0] || {
      totalBalance: 0,
      totalExposure: 0,
    };

    const scopedUserIds = await User.find(filter).distinct("_id");

    const todayPnLAgg = await Bet.aggregate([
      {
        $match: {
          userId: { $in: scopedUserIds },
          createdAt: { $gte: startOfToday },
        },
      },
      {
        $group: {
          _id: null,
          totalPnL: { $sum: "$profitLoss" },
        },
      },
    ]);

    const todayClientPnL = todayPnLAgg[0]?.totalPnL ?? 0;

    // ── Deposit / Withdrawal cards: same IST midnight boundary,
    // NOT a rolling 24h window. This is what makes the cards reset
    // at 12:00 AM IST instead of drifting with every page refresh. ──
    const since = startOfToday;

    const [depositAgg, withdrawAgg] = await Promise.all([
      PaymentRequest.aggregate([
        {
          $match: {
            userId: { $in: scopedUserIds },
            createdAt: { $gte: since },
          },
        },
        {
          $group: {
            _id: "$status",
            total: { $sum: "$price" },
            count: { $sum: 1 },
          },
        },
      ]),
      WithdrawRequest.aggregate([
        {
          $match: {
            userId: { $in: scopedUserIds },
            createdAt: { $gte: since },
          },
        },
        {
          $group: {
            _id: "$status",
            total: { $sum: "$amount" },
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    const flatten = (agg) => {
      const byStatus = {
        approved: { total: 0, count: 0 },
        rejected: { total: 0, count: 0 },
        pending: { total: 0, count: 0 },
      };
      agg.forEach((row) => {
        if (byStatus[row._id]) {
          byStatus[row._id] = { total: row.total, count: row.count };
        }
      });
      return byStatus;
    };

    const depositByStatus = flatten(depositAgg);
    const withdrawByStatus = flatten(withdrawAgg);

    const [recentDeposits, recentWithdrawals] = await Promise.all([
      PaymentRequest.find({ userId: { $in: scopedUserIds } })
        .sort({ createdAt: -1 })
        .limit(20)
        .populate("userId", "username email")
        .lean(),
      WithdrawRequest.find({ userId: { $in: scopedUserIds } })
        .sort({ createdAt: -1 })
        .limit(20)
        .populate("userId", "username email")
        .lean(),
    ]);

    const recentActivity = [
      ...recentDeposits.map((t) => ({
        type: "deposit",
        id: t._id,
        amount: t.price,
        status: t.status,
        user: t.userId,
        createdAt: t.createdAt,
      })),
      ...recentWithdrawals.map((w) => ({
        type: "withdrawal",
        id: w._id,
        amount: w.amount,
        status: w.status,
        user: w.userId,
        createdAt: w.createdAt,
      })),
    ]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 20);

    return res.status(200).json({
      success: true,
      message: "Client stats fetched successfully",
      data: {
        total,
        active,
        blocked,
        suspended,
        demo,
        newThisWeek,
        newToday,
        todayClientPnL,
        totalBalance: balanceData.totalBalance,
        totalExposure: balanceData.totalExposure,
        last24h: {
          deposit: depositByStatus,
          withdrawal: withdrawByStatus,
        },
        recentActivity,
      },
    });
  } catch (error) {
    console.error("🔥 Error in getClientStats:", error);

    return res.status(500).json({
      success: false,
      message: "Error fetching client stats",
      error: error.message,
    });
  }
};

const changeUserPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.trim().length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const adminId = req.admin?._id?.toString() || req.admin?.id;
    const scopeIds = (await getScopeIds(req.admin._id)).map(String);

    if (!user.assignedAdmin || !scopeIds.includes(user.assignedAdmin.toString())) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to modify this user",
      });
    }

    user.password = newPassword;
    await user.save();

    return res.status(200).json({
      success: true,
      message: `Password updated for ${user.username}`,
    });
  } catch (err) {
    console.error("changeUserPassword error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

module.exports = {
  getAllClients,
  getClientById,
  updateClientStatus,
  updateClientPermissions,
  updateBettingLimits,
  deleteClient,
  getClientStats,
  changeUserPassword,
};