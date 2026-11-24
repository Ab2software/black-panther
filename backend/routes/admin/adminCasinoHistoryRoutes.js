const express = require("express");
const router = express.Router();
const verifyAdminToken = require("../../middleWare/adminAuthMiddleware");
const { getCasinoBetHistory } = require("../../controllers/admin/adminCasinoHistoryController");

router.get("/admin/casino-bet-history", verifyAdminToken, getCasinoBetHistory);

module.exports = router;