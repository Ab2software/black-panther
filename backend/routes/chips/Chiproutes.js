const express = require("express");
const router  = express.Router();

const {
  transferChips,
  getChipDashboard,
  getChipTransactions,
} = require("../../controllers/chips/Chipcontroller");

const authMiddleware = require("../../middleWare/authmiddleWare");
const verifyAdminToken = require("../../middleWare/adminAuthMiddleware");
// Adjust path to match your project structure

// ── Chip transfer (give / take) ───────────────────────────────────────────
// POST /api/v1/chips/transfer
// Body: { toUserId, type: "give"|"take", amount, remark? }
router.post("/transfer", verifyAdminToken, transferChips);

// ── Dashboard: my wallet, upline, downline, clients P&L ──────────────────
// GET /api/v1/chips/dashboard
router.get("/dashboard", verifyAdminToken, getChipDashboard);

// ── Chip transaction history ──────────────────────────────────────────────
// GET /api/v1/chips/transactions?page=1&limit=20
router.get("/transactions", verifyAdminToken, getChipTransactions);

module.exports = router;