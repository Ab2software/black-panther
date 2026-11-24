const User = require("../../model/User");
const jwt  = require("jsonwebtoken");
const PaymentRequest = require("../../model/PaymentRequest");
const WithdrawRequest = require("../../model/WithdrawRequest");
// ─────────────────────────────────────────────
// LOGIN owner
// POST /api/v1/owner/login
// ─────────────────────────────────────────────
const loginOwnerController = async (req, res) => {
  try {
    const { username, password } = req.body ?? {};

    if (!username || !password) {
      return res.status(400).json({ success: false, message: "Username and password are required" });
    }

    const owner = await User.findOne({ username, role: "owner" }).select("+password");

    if (!owner) {
      return res.status(404).json({ success: false, message: "Owner not found" });
    }

    if (owner.permissions?.canLogin === false) {
      return res.status(403).json({ success: false, message: "Login disabled for this account" });
    }

    const isMatch = await owner.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: "Invalid password" });
    }

    const token = jwt.sign(
      { id: owner._id, role: owner.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    await User.findByIdAndUpdate(owner._id, {
      $set: { lastLoginAt: new Date() },
    });

    return res.status(200).json({
      success: true,
      message: "Owner login successful",
      token,
      admin: {
        _id:      owner._id,
        username: owner.username,
        fullName: owner.fullName,
        role:     owner.role,
      },
    });
  } catch (error) {
    console.error("Error in loginOwnerController:", error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────
// CREATE superadmin / admin / user
// POST /api/v1/owner/create
// Body: { username, password, role, fullName, email, phone, balance }
// ─────────────────────────────────────────────
const createAccountController = async (req, res) => {
  try {
    const ownerId = req.user?.id;
    const owner   = await User.findById(ownerId);

    if (!owner || owner.role !== "owner") {
      return res.status(403).json({ success: false, message: "Access denied. Owner only." });
    }

    const {
      username,
      password,
      role = "superadmin",
      fullName,
      email,
      phone,
      balance = 0,
    } = req.body ?? {};

    // ── Validations ──
    const allowedRoles = ["superadmin", "admin", "user"];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: `Owner can only create: ${allowedRoles.join(", ")}`,
      });
    }

    if (!username || !password) {
      return res.status(400).json({ success: false, message: "Username and password are required" });
    }
    if (username.length < 3 || username.length > 20) {
      return res.status(400).json({ success: false, message: "Username must be 3–20 characters" });
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return res.status(400).json({ success: false, message: "Username can only contain letters, numbers and underscores" });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: "Password must be at least 6 characters" });
    }
    if (phone && !/^\d{10}$/.test(phone)) {
      return res.status(400).json({ success: false, message: "Phone must be 10 digits" });
    }
    if (Number(balance) < 0) {
      return res.status(400).json({ success: false, message: "Balance cannot be negative" });
    }
    if (Number(balance) > 0 && owner.wallet.balance < Number(balance)) {
      return res.status(400).json({ success: false, message: "Insufficient balance to allocate" });
    }

    // ── Uniqueness ──
    const existingUsername = await User.findOne({
      username: { $regex: new RegExp(`^${username}$`, "i") },
    });
    if (existingUsername) {
      return res.status(400).json({ success: false, message: "Username already taken" });
    }
    if (phone) {
      const existingPhone = await User.findOne({ phone });
      if (existingPhone) {
        return res.status(400).json({ success: false, message: "Phone number already registered" });
      }
    }

    // ── Create account ──
    const newAccount = new User({
      username,
      password,
      fullName:  fullName || "",
      email:     email   || "",
      phone:     phone   || "",
      role,
      parentId:  ownerId,
      createdBy: ownerId,
      status:    "active",
      adminStatus: role !== "user" ? "active" : undefined,
      wallet: {
        balance:          Number(balance),
        exposure:         0,
        availableBalance: Number(balance),
      },
      permissions: {
        canLogin:      true,
        canBet:        role === "user",
        canWithdraw:   role === "user",
        canDeposit:    role === "user",
        canCreateUser: role !== "user",
      },
    });

    await newAccount.save();

    // ── Deduct balance from owner ──
    if (Number(balance) > 0) {
      await User.findByIdAndUpdate(ownerId, {
        $inc: {
          "wallet.balance":          -Number(balance),
          "wallet.availableBalance": -Number(balance),
          downlineCount: 1,
        },
      });
    } else {
      await User.findByIdAndUpdate(ownerId, {
        $inc: { downlineCount: 1 },
      });
    }

    return res.status(201).json({
      success: true,
      message: `${role} "${newAccount.username}" created successfully`,
      data: {
        _id:      newAccount._id,
        username: newAccount.username,
        fullName: newAccount.fullName,
        email:    newAccount.email,
        phone:    newAccount.phone,
        role:     newAccount.role,
        wallet:   newAccount.wallet,
        status:   newAccount.status,
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({ success: false, message: `This ${field} is already registered` });
    }
    console.error("Error in createAccountController:", error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────
// GET all superadmins
// GET /api/v1/owner/superadmins
// ─────────────────────────────────────────────
const getAllSuperAdminsController = async (req, res) => {
  try {
    const superAdmins = await User.find({ role: "superadmin" })
      .select("username fullName email phone status adminStatus wallet createdAt createdBy")
      .populate("createdBy", "username role")
      .sort({ createdAt: -1 });

    const withCounts = await Promise.all(
      superAdmins.map(async (sa) => {
        const [adminCount, userCount] = await Promise.all([
          User.countDocuments({ role: "admin", parentId: sa._id }),
          User.countDocuments({ role: "user",  parentId: sa._id }),
        ]);
        return { ...sa.toObject(), adminCount, userCount };
      })
    );

    return res.status(200).json({ success: true, data: withCounts });
  } catch (error) {
    console.error("Error in getAllSuperAdminsController:", error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────
// GET platform-wide stats
// GET /api/v1/owner/stats
// ─────────────────────────────────────────────
const getOwnerStatsController = async (req, res) => {
  try {
    const [
      totalSuperAdmins,
      totalAdmins,
      totalUsers,
      activeUsers,
      blockedUsers,
    ] = await Promise.all([
      User.countDocuments({ role: "superadmin" }),
      User.countDocuments({ role: "admin" }),
      User.countDocuments({ role: "user" }),
      User.countDocuments({ role: "user", status: "active" }),
      User.countDocuments({ role: "user", status: "blocked" }),
    ]);

    // Total balance across all users
    const balanceAgg = await User.aggregate([
      { $match: { role: { $in: ["superadmin", "admin", "user"] } } },
      {
        $group: {
          _id: null,
          totalBalance: { $sum: "$wallet.balance" },
          totalExposure: { $sum: "$wallet.exposure" },
        },
      },
    ]);

    const { totalBalance = 0, totalExposure = 0 } = balanceAgg[0] || {};

    // Owner's own wallet
    const ownerId = req.user?.id;
    const owner = await User.findById(ownerId).select("wallet");

    // ── Rolling 24-hour window ──
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // ── Deposit + withdrawal totals, split by status, last 24h ──
    const [depositAgg, withdrawAgg] = await Promise.all([
      PaymentRequest.aggregate([
        { $match: { createdAt: { $gte: since } } },
        {
          $group: {
            _id: "$status",
            total: { $sum: "$price" },
            count: { $sum: 1 },
          },
        },
      ]),
      WithdrawRequest.aggregate([
        { $match: { createdAt: { $gte: since } } },
        {
          $group: {
            _id: "$status",
            total: { $sum: "$amount" },
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    // Flatten [{ _id: "approved", total, count }, ...] into a fixed shape
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

    // ── Combined recent activity (manage history) ──
    const [recentDeposits, recentWithdrawals] = await Promise.all([
      PaymentRequest.find({})
        .sort({ createdAt: -1 })
        .limit(20)
        .populate("userId", "username email")
        .lean(),
      WithdrawRequest.find({})
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
      data: {
        ownerWallet: {
          balance: owner?.wallet?.balance ?? 0,
          exposure: owner?.wallet?.exposure ?? 0,
          availableBalance:
            (owner?.wallet?.balance ?? 0) - (owner?.wallet?.exposure ?? 0),
        },
        platform: {
          totalSuperAdmins,
          totalAdmins,
          totalUsers,
          activeUsers,
          blockedUsers,
          totalBalance,
          totalExposure,
        },
        last24h: {
          deposit: depositByStatus,
          withdrawal: withdrawByStatus,
        },
        recentActivity,
      },
    });
  } catch (error) {
    console.error("Error in getOwnerStatsController:", error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};
  

// ─────────────────────────────────────────────
// UPDATE superadmin status (activate / block / suspend)
// PATCH /api/v1/owner/superadmins/:id/status
// Body: { status: "active" | "blocked" | "suspended" }
// ─────────────────────────────────────────────
const updateSuperAdminStatusController = async (req, res) => {
  try {
    const { id }     = req.params;
    const { status } = req.body;

    if (!["active", "blocked", "suspended"].includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status" });
    }

    const superAdmin = await User.findOne({ _id: id, role: "superadmin" });
    if (!superAdmin) {
      return res.status(404).json({ success: false, message: "Superadmin not found" });
    }

    superAdmin.status = status;
    // Also toggle login permission
    superAdmin.permissions.canLogin = status === "active";
    await superAdmin.save();

    return res.status(200).json({
      success: true,
      message: `Superadmin "${superAdmin.username}" status set to ${status}`,
      data: { _id: superAdmin._id, status },
    });
  } catch (error) {
    console.error("Error in updateSuperAdminStatusController:", error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────
// DELETE superadmin (soft delete)
// DELETE /api/v1/owner/superadmins/:id
// ─────────────────────────────────────────────
const deleteSuperAdminController = async (req, res) => {
  try {
    const superAdmin = await User.findOne({ _id: req.params.id, role: "superadmin" });
    if (!superAdmin) {
      return res.status(404).json({ success: false, message: "Superadmin not found" });
    }

    // Unassign all admins under this superadmin
    await User.updateMany(
      { parentId: superAdmin._id, role: "admin" },
      { $set: { parentId: null } }
    );

    await User.deleteOne({ _id: superAdmin._id });

    return res.status(200).json({
      success: true,
      message: `Superadmin "${superAdmin.username}" deleted. Their admins have been unassigned.`,
    });
  } catch (error) {
    console.error("Error in deleteSuperAdminController:", error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────
// TRANSFER chips to anyone
// POST /api/v1/owner/chips/transfer
// Body: { toUserId, type, amount, remark }
// ─────────────────────────────────────────────
const ownerTransferChipsController = async (req, res) => {
  try {
    const ownerId = req.user?.id;
    const { toUserId, type, amount, remark = "" } = req.body ?? {};

    if (!toUserId || !type || !amount) {
      return res.status(400).json({ success: false, message: "toUserId, type and amount are required" });
    }
    if (!["give", "take"].includes(type)) {
      return res.status(400).json({ success: false, message: "type must be 'give' or 'take'" });
    }

    const parsedAmount = Number(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ success: false, message: "amount must be a positive number" });
    }

    const [owner, target] = await Promise.all([
      User.findById(ownerId),
      User.findById(toUserId),
    ]);

    if (!owner || owner.role !== "owner") {
      return res.status(403).json({ success: false, message: "Access denied. Owner only." });
    }
    if (!target) {
      return res.status(404).json({ success: false, message: "Target user not found" });
    }

    // ── Balance checks ──
    if (type === "give") {
      const ownerAvailable = owner.wallet.balance - owner.wallet.exposure;
      if (ownerAvailable < parsedAmount) {
        return res.status(400).json({
          success: false,
          message: "Insufficient chips to give",
          available: ownerAvailable,
        });
      }
    }

    if (type === "take") {
      const targetAvailable = target.wallet.balance - target.wallet.exposure;
      if (targetAvailable < parsedAmount) {
        return res.status(400).json({
          success: false,
          message: "Target user does not have enough available chips",
          available: targetAvailable,
        });
      }
    }

    // ── Apply transfer ──
    let ownerBalanceAfter, targetBalanceAfter;

    if (type === "give") {
      const [updatedOwner, updatedTarget] = await Promise.all([
        User.findByIdAndUpdate(ownerId,   { $inc: { "wallet.balance": -parsedAmount } }, { new: true }),
        User.findByIdAndUpdate(toUserId,  { $inc: { "wallet.balance":  parsedAmount } }, { new: true }),
      ]);
      ownerBalanceAfter  = updatedOwner.wallet.balance;
      targetBalanceAfter = updatedTarget.wallet.balance;
    } else {
      const [updatedOwner, updatedTarget] = await Promise.all([
        User.findByIdAndUpdate(ownerId,   { $inc: { "wallet.balance":  parsedAmount } }, { new: true }),
        User.findByIdAndUpdate(toUserId,  { $inc: { "wallet.balance": -parsedAmount } }, { new: true }),
      ]);
      ownerBalanceAfter  = updatedOwner.wallet.balance;
      targetBalanceAfter = updatedTarget.wallet.balance;
    }

    return res.status(200).json({
      success: true,
      message: type === "give"
        ? `₹${parsedAmount} given to ${target.username} successfully`
        : `₹${parsedAmount} taken from ${target.username} successfully`,
      data: {
        type,
        amount:            parsedAmount,
        remark,
        to:                { userId: target._id, username: target.username, role: target.role },
        ownerBalanceAfter,
        targetBalanceAfter,
      },
    });
  } catch (error) {
    console.error("Error in ownerTransferChipsController:", error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  loginOwnerController,
  createAccountController,
  getAllSuperAdminsController,
  getOwnerStatsController,
  updateSuperAdminStatusController,
  deleteSuperAdminController,
  ownerTransferChipsController,
};