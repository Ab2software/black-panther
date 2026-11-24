const express = require("express");
const router  = express.Router();
const { getAllBets, getAnalytics, settleBetManually } = require("../controllers/admin/betHistoryController");
const verifyAdminToken = require("../middleWare/adminAuthMiddleware");
const superAdminOnly = (req, res, next) => {
  if (req.admin?.role !== "superadmin")
    return res.status(403).json({ success: false, message: "Superadmin only" });
  next();
};

router.get("/bets",      verifyAdminToken,getAllBets);
router.get("/analytics", verifyAdminToken, getAnalytics);
router.patch("/bets/:id/settle", verifyAdminToken, settleBetManually);

module.exports = router;