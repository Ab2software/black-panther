const express = require("express");
const router = express.Router();
const { launchGame, getGames, getGameHistory } = require("../controllers/gameController");
const demoGuard = require("../middleWare/demoGuard");
router.post("/launch-game", demoGuard, launchGame);
router.get("/games", getGames);
// HISTORY
router.get(
  "/game-history/:userId",
  // demoGuard,
  getGameHistory
);  
module.exports = router;