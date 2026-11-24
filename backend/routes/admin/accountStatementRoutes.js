// routes/accountStatementRoutes.js

const express = require("express");
const router = express.Router();
const { getStatement, getRoundDetails, getMatchBetDetails } = require("../../controllers/admin/accountStatementController");
const verifyAdminToken = require("../../middleWare/adminAuthMiddleware");


router.get("/account-statement", verifyAdminToken, getStatement);
router.get("/account-statement/round/:roundId", verifyAdminToken, getRoundDetails);
router.get("/account-statement/match/:eventId", verifyAdminToken, getMatchBetDetails);

module.exports = router;