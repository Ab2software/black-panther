const User = require("../../model/User");
const Bet = require("../../model/bet");
const ChipTransaction = require("../../model/Chiptransaction");
const PaymentRequest = require("../../model/PaymentRequest");
const WithdrawRequest = require("../../model/WithdrawRequest");

// ── helpers ───────────────────────────────────────────────────────────────

const canManage = (role, targetRole) => {
  if (
    role === "owner" &&
    ["superadmin", "admin", "subadmin", "user"].includes(targetRole)
  )
    return true;
  if (
    role === "superadmin" &&
    ["admin", "subadmin", "user"].includes(targetRole)
  )
    return true;
  if (role === "admin" && ["subadmin", "user"].includes(targetRole))
    return true;
  if (role === "subadmin" && targetRole === "user") return true;
  return false;
};

// Resolve the set of admin IDs a superadmin can see/manage.
// = themself + any sub-admins (role: "admin") they personally created.
// Assumes a max 2-level hierarchy (superadmin -> admin -> user).
const getScopeIds = async (adminId) => {
  const subAdminIds = await User.find({
    createdBy: adminId,
    role: "admin",
  }).distinct("_id");
  return [adminId, ...subAdminIds];
};

// ── POST /api/v1/chips/transfer ───────────────────────────────────────────
const transferChips = async (req, res) => {
  try {
    const requesterId = req.user?._id || req.user?.id;
    const { toUserId, type, amount, remark = "" } = req.body;

    if (!toUserId || !type || !amount) {
      return res.status(400).json({
        success: false,
        message: "toUserId, type and amount are required",
      });
    }

    if (!["give", "take"].includes(type)) {
      return res.status(400).json({
        success: false,
        message: "type must be 'give' or 'take'",
      });
    }

    const parsedAmount = Number(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "amount must be a positive number",
      });
    }

    const [requester, target] = await Promise.all([
      User.findById(requesterId),
      User.findById(toUserId),
    ]);

    if (!requester) {
      return res
        .status(404)
        .json({ success: false, message: "Requester not found" });
    }

    if (!target) {
      return res
        .status(404)
        .json({ success: false, message: "Target user not found" });
    }

    // ── Hierarchy check ───────────────────────────────────────────────────
    if (!canManage(requester.role, target.role)) {
      return res.status(403).json({
        success: false,
        message: `A ${requester.role} cannot manage a ${target.role}`,
      });
    }

    // ── Ownership check ───────────────────────────────────────────────────
    if (requester.role === "superadmin") {
      // ✅ Superadmin can only transfer to admins THEY created — not any
      // admin in the system (previously unscoped, allowing chip transfers
      // across unrelated superadmins' hierarchies).
      if (target.role !== "admin") {
        return res.status(403).json({
          success: false,
          message: "Superadmin can only transfer chips to admins",
        });
      }
      if (String(target.createdBy) !== String(requesterId)) {
        return res.status(403).json({
          success: false,
          message: "You can only transfer chips to admins you created",
        });
      }
    } else if (requester.role === "admin" || requester.role === "subadmin") {
      // Admin/Subadmin can only transfer to their direct users.
      // Checks both parentId and assignedAdmin since some users only have
      // one of the two fields set historically.
      const isOwned =
        String(target.parentId) === String(requesterId) ||
        String(target.assignedAdmin) === String(requesterId);

      if (!isOwned) {
        return res.status(403).json({
          success: false,
          message: "You can only transfer chips to your direct users",
        });
      }
    }

    // ── Balance checks ────────────────────────────────────────────────────
    if (type === "give") {
      const requesterAvailable =
        requester.wallet.balance - requester.wallet.exposure;
      if (requesterAvailable < parsedAmount) {
        return res.status(400).json({
          success: false,
          message: "Insufficient chips to give",
          available: requesterAvailable,
        });
      }
    }

    if (type === "take") {
      const targetAvailable = target.wallet.balance - target.wallet.exposure;
      if (targetAvailable < parsedAmount) {
        return res.status(400).json({
          success: false,
          message: "Target user does not have enough available chips to take",
          available: targetAvailable,
        });
      }
    }

    // ── Apply transfer ────────────────────────────────────────────────────
    let requesterBalanceAfter, targetBalanceAfter;

    if (type === "give") {
      const updatedRequester = await User.findByIdAndUpdate(
        requesterId,
        {
          $inc: {
            "wallet.balance": -parsedAmount,
            "wallet.availableBalance": -parsedAmount,
          },
        },
        { new: true },
      );
      const updatedTarget = await User.findByIdAndUpdate(
        toUserId,
        {
          $inc: {
            "wallet.balance": parsedAmount,
            "wallet.availableBalance": parsedAmount,
          },
        },
        { new: true },
      );
      requesterBalanceAfter = updatedRequester.wallet.balance;
      targetBalanceAfter = updatedTarget.wallet.balance;
    } else {
      const updatedRequester = await User.findByIdAndUpdate(
        requesterId,
        {
          $inc: {
            "wallet.balance": parsedAmount,
            "wallet.availableBalance": parsedAmount,
          },
        },
        { new: true },
      );
      const updatedTarget = await User.findByIdAndUpdate(
        toUserId,
        {
          $inc: {
            "wallet.balance": -parsedAmount,
            "wallet.availableBalance": -parsedAmount,
          },
        },
        { new: true },
      );
      requesterBalanceAfter = updatedRequester.wallet.balance;
      targetBalanceAfter = updatedTarget.wallet.balance;
    }

    // ── Log the transaction ───────────────────────────────────────────────
    const tx = await ChipTransaction.create({
      fromUserId: requesterId,
      toUserId,
      type,
      amount: parsedAmount,
      fromBalanceAfter: requesterBalanceAfter,
      toBalanceAfter: targetBalanceAfter,
      remark,
    });

    // ✅ When an admin gives chips directly to a user, also record it as an
    // approved deposit — this is what makes it show up in both the admin's
    // transaction list (getAllTransactions) and the user's own account
    // statement (getUserAccountStatement), since both already read from
    // PaymentRequest and need no further changes.
    if (type === "give" && target.role === "user") {
      await PaymentRequest.create({
        userId: toUserId,
        price: parsedAmount,
        transactionId: `ADMIN-CHIP-${tx._id}`,
        method: "admin_chip_transfer",
        source: "admin_chip_transfer",
        status: "approved",
        adminRemark: remark,
      });
    }

     if (type === "take" && target.role === "user") {
      await WithdrawRequest.create({
        userId: toUserId,
        amount: parsedAmount,
        withdrawMethod: "admin_chip_transfer",
        status: "approved",
        adminId: requesterId,
        remark,
      });
    }

    return res.status(200).json({
      success: true,
      message:
        type === "give"
          ? `₹${parsedAmount} chips given successfully`
          : `₹${parsedAmount} chips taken successfully`,
      transaction: {
        id: tx._id,
        type: tx.type,
        amount: tx.amount,
        remark: tx.remark,
        myBalanceAfter: requesterBalanceAfter,
        theirBalanceAfter: targetBalanceAfter,
        createdAt: tx.createdAt,
      },
    });
  } catch (error) {
    console.error("transferChips Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ── GET /api/v1/chips/dashboard ───────────────────────────────────────────
const getChipDashboard = async (req, res) => {
  try {
    const requesterId = req.user?._id || req.user?.id;
    const requester = await User.findById(requesterId);

    if (!requester) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // ── My wallet ─────────────────────────────────────────────────────────
    const myWallet = {
      balance: requester.wallet.balance,
      exposure: requester.wallet.exposure,
      availableBalance: requester.wallet.balance - requester.wallet.exposure,
    };

    // ── Upline balance ────────────────────────────────────────────────────
    let upline = null;
    if (requester.parentId) {
      const uplineUser = await User.findById(requester.parentId).select(
        "username role wallet",
      );
      if (uplineUser) {
        upline = {
          userId: uplineUser._id,
          username: uplineUser.username,
          role: uplineUser.role,
          balance: uplineUser.wallet.balance,
        };
      }
    }

    // ── Direct downline list ──────────────────────────────────────────────
    let downlineUsers = [];

    if (requester.role === "owner") {
      // Owner can see every SuperAdmin (owner is top of the tree — this
      // one is intentionally global)
      downlineUsers = await User.find({
        role: "superadmin",
      }).select("username role wallet status createdAt parentId assignedAdmin");
    } else if (requester.role === "superadmin") {
      // ✅ SuperAdmin can only see admins THEY created — not every admin
      // in the system (previously unscoped, this is the exact bug that
      // let "super" see Eagle@44's data).
      downlineUsers = await User.find({
        role: "admin",
        createdBy: requesterId,
      }).select("username role wallet status createdAt parentId assignedAdmin");
    } else if (requester.role === "admin" || requester.role === "subadmin") {
      // Admin/Subadmin can only see their own users.
      // Matches on parentId OR assignedAdmin since some users only have
      // one of the two fields set (see registerController fix + backfill
      // migration — this $or is a safety net in case the two ever
      // diverge again for any other creation path).
      downlineUsers = await User.find({
        role: "user",
        $or: [{ parentId: requesterId }, { assignedAdmin: requesterId }],
      }).select("username role wallet status createdAt parentId assignedAdmin");
    }

    const downline = downlineUsers.map((u) => ({
      userId: u._id,
      username: u.username,
      role: u.role,
      status: u.status,
      balance: u.wallet.balance,
      exposure: u.wallet.exposure,
      availableBalance: u.wallet.balance - u.wallet.exposure,
      createdAt: u.createdAt,
    }));

    let clientUserIds = [];

    if (requester.role === "owner") {
      // Owner intentionally sees every client across the whole platform
      const allUsers = await User.find({
        role: "user",
      }).select("_id");

      clientUserIds = allUsers.map((u) => u._id);
    } else if (requester.role === "superadmin") {
      // ✅ Scope = this superadmin + the admins they created (downlineUsers,
      // already scoped above), NOT every user in the entire database.
      const scopeIds = await getScopeIds(requesterId);
      const scopedUsers = await User.find({
        role: "user",
        assignedAdmin: { $in: scopeIds },
      }).select("_id");

      clientUserIds = scopedUsers.map((u) => u._id);
    } else if (requester.role === "admin" || requester.role === "subadmin") {
      clientUserIds = downlineUsers
        .filter((u) => u.role === "user")
        .map((u) => u._id);
    }

    // ── Total P&L ─────────────────────────────────────────────────────────
    const plResult = await Bet.aggregate([
      {
        $match: {
          userId: { $in: clientUserIds },
          status: { $in: ["Won", "Lost"] },
        },
      },
      {
        $group: {
          _id: null,
          totalPL: { $sum: "$profitLoss" },
          totalBets: { $sum: 1 },
          totalWon: { $sum: { $cond: [{ $eq: ["$status", "Won"] }, 1, 0] } },
          totalLost: { $sum: { $cond: [{ $eq: ["$status", "Lost"] }, 1, 0] } },
          totalStake: { $sum: "$stake" },
        },
      },
    ]);

    const clientsPL = plResult[0] || {
      totalPL: 0,
      totalBets: 0,
      totalWon: 0,
      totalLost: 0,
      totalStake: 0,
    };

    // ── Per-user P&L breakdown ────────────────────────────────────────────
    let downlinePL = [];

    if (clientUserIds.length > 0) {
      const perUserPL = await Bet.aggregate([
        {
          $match: {
            userId: { $in: clientUserIds },
            status: { $in: ["Won", "Lost"] },
          },
        },
        {
          $group: {
            _id: "$userId",
            totalPL: { $sum: "$profitLoss" },
            totalBets: { $sum: 1 },
            totalStake: { $sum: "$stake" },
          },
        },
      ]);

      // Fetch usernames separately since for superadmin,
      // downlineUsers = admins, not the actual betting users
      const userDocs = await User.find({ _id: { $in: clientUserIds } }).select(
        "username",
      );
      const userMap = {};
      userDocs.forEach((u) => {
        userMap[String(u._id)] = u.username;
      });

      downlinePL = perUserPL.map((entry) => ({
        userId: entry._id,
        username: userMap[String(entry._id)] || "Unknown",
        totalPL: entry.totalPL,
        totalBets: entry.totalBets,
        totalStake: entry.totalStake,
      }));
    }

    return res.status(200).json({
      success: true,
      data: {
        me: {
          userId: requester._id,
          username: requester.username,
          role: requester.role,
          wallet: myWallet,
        },
        upline,
        downline,
        clientsPL: {
          ...clientsPL,
          netPL: -clientsPL.totalPL,
        },
        downlinePL,
      },
    });
  } catch (error) {
    console.error("getChipDashboard Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ── GET /api/v1/chips/transactions ────────────────────────────────────────
// Unchanged — already correctly scoped to transactions where the
// requester is either the sender or receiver, which is always safe
// regardless of role or hierarchy.
const getChipTransactions = async (req, res) => {
  try {
    const requesterId = req.user?._id || req.user?.id;
    const { page = 1, limit = 20 } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    const [txs, total] = await Promise.all([
      ChipTransaction.find({
        $or: [{ fromUserId: requesterId }, { toUserId: requesterId }],
      })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate("fromUserId", "username role")
        .populate("toUserId", "username role"),

      ChipTransaction.countDocuments({
        $or: [{ fromUserId: requesterId }, { toUserId: requesterId }],
      }),
    ]);

    const formatted = txs.map((tx) => {
      const isSender = String(tx.fromUserId._id) === String(requesterId);
      return {
        id: tx._id,
        type: tx.type,
        direction: isSender ? "sent" : "received",
        amount: tx.amount,
        remark: tx.remark,
        from: {
          userId: tx.fromUserId._id,
          username: tx.fromUserId.username,
          role: tx.fromUserId.role,
        },
        to: {
          userId: tx.toUserId._id,
          username: tx.toUserId.username,
          role: tx.toUserId.role,
        },
        myBalanceAfter: isSender ? tx.fromBalanceAfter : tx.toBalanceAfter,
        createdAt: tx.createdAt,
      };
    });

    return res.status(200).json({
      success: true,
      total,
      page: Number(page),
      limit: Number(limit),
      data: formatted,
    });
  } catch (error) {
    console.error("getChipTransactions Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  transferChips,
  getChipDashboard,
  getChipTransactions,
};
