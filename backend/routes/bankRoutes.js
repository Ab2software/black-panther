// routes/bankRoutes.js
const express = require("express");
const router = express.Router();
const verifyAdminToken = require("../middleWare/adminAuthMiddleware");
const authMiddleware = require("../middleWare/authmiddleWare");
const adminBankController = require("../controllers/admin/adminBankController");
const userBankController = require("../controllers/userBankController");

// Admin-tier: set their own bank details
router.put(
  "/admin/bank-details",
  verifyAdminToken,
  adminBankController.updateMyBankDetails
);

// ✅ Admin-tier: get their own bank details (this was missing)
router.get(
  "/admin/bank-details",
  verifyAdminToken,
  adminBankController.getMyBankDetails
);

// Any logged-in user: view their assigned admin's bank details
router.get(
  "/user/assigned-admin/bank-details",
  authMiddleware,
  userBankController.getAssignedAdminBankDetails
);

module.exports = router;