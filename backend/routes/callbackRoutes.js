const express = require("express");
const router = express.Router();
const { handleCallback } = require("../controllers/callbackController");
const demoGuard = require("../middleWare/demoGuard");

// routes/callbackRoutes.js
router.post("/callback", handleCallback);

module.exports = router;