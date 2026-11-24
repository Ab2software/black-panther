const express = require("express");
const router = express.Router();

const verifyAdminToken = require("../../middleWare/adminAuthMiddleware");
const superAdminGuard = require("../../middleWare/superAdminGuard");

const {
  createSubAdmin,
  getAllSubAdmins,
  getSubAdminById,
  activateSubAdmin,
  deactivateSubAdmin,
  deleteSubAdmin,
  reassignUser,
} = require("../../controllers/admin/subAdminController");

// All routes require a valid admin token
router.use(verifyAdminToken);

// ── Read routes — any admin-tier role can view (e.g. to populate "assign to" dropdown) ──
router.get("/", getAllSubAdmins);
router.get("/:id", getSubAdminById);

// ── Sensitive actions — superadmin/owner only ──
router.post("/", superAdminGuard, createSubAdmin);
router.delete("/:id", superAdminGuard, deleteSubAdmin);
router.patch("/:id/activate", superAdminGuard, activateSubAdmin);
router.patch("/:id/deactivate", superAdminGuard, deactivateSubAdmin);
router.patch("/reassign-user", superAdminGuard, reassignUser);

module.exports = router;