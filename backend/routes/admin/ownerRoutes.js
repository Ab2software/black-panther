const express    = require("express");
const router     = express.Router();
const protect          = require("../../middleWare/authmiddleWare");
const { isOwner, isSuperAdmin, isAdmin } = require("../../middleWare/authmiddleWare");
const {
  loginOwnerController,
  createAccountController,
  getAllSuperAdminsController,
  getOwnerStatsController,
  updateSuperAdminStatusController,
  deleteSuperAdminController,
  ownerTransferChipsController,
} = require("../../controllers/admin/ownerController");

// Public
router.post("/login", loginOwnerController);

// Protected — owner only
router.use(protect, isOwner);

router.post  ("/create",                        createAccountController);
router.get   ("/superadmins",                   getAllSuperAdminsController);
router.get   ("/stats",                         getOwnerStatsController);
router.patch ("/superadmins/:id/status",        updateSuperAdminStatusController);
router.delete("/superadmins/:id",               deleteSuperAdminController);
router.post  ("/chips/transfer",                ownerTransferChipsController);

module.exports = router;