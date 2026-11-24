const express = require("express");
const {
  getAllTransactions,
  updateTransactionStatus,
  getAllWithdrawRequests,
  updateWithdrawStatus,
  getUserAccountStatement,
} = require("../../controllers/Transaction/TransactionController");

const authMiddleware  = require("../../middleWare/authmiddleWare");
const verifyAdminToken = require("../../middleWare/adminAuthMiddleware");
const demoGuard       = require("../../middleWare/demoGuard");
const upload          = require("../../middleWare/uploadMiddleware"); // ⚠️ update this path to match your actual multer config

const router = express.Router();

// ✅ Admin routes — use verifyAdminToken
router.get("/all",          verifyAdminToken, getAllTransactions);
router.put("/status/:id",   verifyAdminToken, updateTransactionStatus);
router.get("/withdraws",    verifyAdminToken, getAllWithdrawRequests);
router.put(
  "/withdraw/:id",
  verifyAdminToken,
  upload.single("proofImage"), // ✅ handles the approve-with-proof-image case
  updateWithdrawStatus
);

// ✅ User route — keep authMiddleware (regular users)
router.get("/user/account-statement", demoGuard, authMiddleware, getUserAccountStatement);

module.exports = router;