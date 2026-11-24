const express = require("express");
const verifyAdminToken = require("../../middleWare/adminAuthMiddleware");
const {
  searchUsers,
  getUserSummary,
  getUserBetHistory,
  getUserGameHistory,
  getUserFinanceHistory,
} = require("../../controllers/admin/UserInsightsController");

const router = express.Router();

router.get("/users/search", verifyAdminToken, searchUsers);
router.get("/users/:userId/summary", verifyAdminToken, getUserSummary);
router.get("/users/:userId/bets", verifyAdminToken, getUserBetHistory);
router.get("/users/:userId/games", verifyAdminToken, getUserGameHistory);
router.get("/users/:userId/finance", verifyAdminToken, getUserFinanceHistory);

module.exports = router;