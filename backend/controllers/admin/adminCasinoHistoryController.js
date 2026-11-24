const GameTransaction = require("../../model/GameTransaction");
const User = require("../../model/User");
const { getScopedUserIds } = require("../../utils/hierarchyScope");

const getCasinoBetHistory = async (req, res) => {
  try {
    const actor = req.user; // set by verifyAdminToken

    const {
      page = 1,
      limit = 50,
      result,        // WIN | LOSS | PENDING
      gameUid,
      userId,        // optional: drill into one specific user (must be in scope)
      username,      // optional: search by username
      startDate,
      endDate,
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(200, parseInt(limit, 10) || 50));

    const scopedUserIds = await getScopedUserIds(actor);

    // scopedUserIds === null means "owner, no restriction"
    const query = {};

    if (scopedUserIds !== null) {
      if (scopedUserIds.length === 0) {
        return res.json({
          success: true,
          history: [],
          page: pageNum,
          limit: limitNum,
          total: 0,
          summary: { totalBets: 0, totalWins: 0, totalTransactions: 0 },
        });
      }
      query.userId = { $in: scopedUserIds };
    }

    // Narrow to a single user, but only if they're within the actor's scope
    if (userId) {
      if (scopedUserIds !== null) {
        const allowed = scopedUserIds.some((id) => id.toString() === userId);
        if (!allowed) {
          return res.status(403).json({
            success: false,
            message: "You do not have access to this user's history",
          });
        }
      }
      query.userId = userId;
    }

    if (result) query.result = result;
    if (gameUid) query.gameUid = gameUid;

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    // If searching by username, resolve to userIds first and intersect with scope
    if (username) {
      const matches = await User.find(
        { username: { $regex: username, $options: "i" } },
        { _id: 1 }
      ).lean();
      const matchIds = matches.map((u) => u._id.toString());

      if (query.userId && query.userId.$in) {
        query.userId.$in = query.userId.$in.filter((id) =>
          matchIds.includes(id.toString())
        );
      } else if (!query.userId) {
        query.userId = { $in: matchIds };
      }
      // if query.userId is a single id (drill-down case), username filter is ignored
    }

    let [history, total, summaryAgg] = await Promise.all([
      GameTransaction.find(query)
        .populate("userId", "username fullName role assignedAdmin parentId siteId")
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .lean(),

      GameTransaction.countDocuments(query),

      GameTransaction.aggregate([
        { $match: query },
        {
          $group: {
            _id: null,
            totalBets: { $sum: "$betAmount" },
            totalWins: { $sum: "$winAmount" },
            totalTransactions: { $sum: 1 },
          },
        },
      ]),
    ]);

    // --- Cross-site safety net ---
    // GameTransaction doesn't store siteId itself, so if the actor is tied
    // to a specific site, drop any populated user whose siteId doesn't match.
    // No-op if actor.siteId is unset, or if you run single-site.
    if (actor.siteId) {
      history = history.filter(
        (tx) => !tx.userId || !tx.userId.siteId || tx.userId.siteId === actor.siteId
      );
    }

    return res.json({
      success: true,
      history,
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
      summary: summaryAgg[0] || {
        totalBets: 0,
        totalWins: 0,
        totalTransactions: 0,
      },
    });
  } catch (err) {
    console.error("❌ CASINO BET HISTORY ERROR:", err.message, err.stack);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch casino bet history",
    });
  }
};

module.exports = { getCasinoBetHistory };