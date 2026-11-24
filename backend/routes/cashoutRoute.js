const express = require("express");
const router = express.Router();
const { cashOut } = require("../controllers/sports/cashoutController");
const authMiddleware = require("../middleWare/authmiddleWare"); // your actual middleware

// POST /api/bets/cashout
router.post("/cashout", authMiddleware, cashOut);

module.exports = router;