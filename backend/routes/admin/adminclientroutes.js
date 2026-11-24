const express = require("express");
const router = express.Router();

const {
  getAllClients,
  getClientById,
  updateClientStatus,
  updateClientPermissions,
  updateBettingLimits,
  deleteClient,
  getClientStats,
  changeUserPassword,
} = require("../../controllers/admin/adminClientController");

const verifyAdminToken = require("../../middleWare/adminAuthMiddleware");

// All routes protected by admin auth
router.use(verifyAdminToken);

// ─── Stats (must be before /:id to avoid route conflict) ───
router.get("/stats", getClientStats);

// ─── List & Detail ───
router.get("/", getAllClients);
router.get("/:id", getClientById);

// ─── Update ───
router.patch("/:id/status", updateClientStatus);
router.patch("/:id/permissions", updateClientPermissions);
router.patch("/:id/betting-limits", updateBettingLimits);
router.patch("/:id/password", verifyAdminToken, changeUserPassword);
// ─── Delete (soft) ───
router.delete("/:id", deleteClient);

module.exports = router;