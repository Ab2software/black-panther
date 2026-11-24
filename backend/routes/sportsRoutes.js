const express = require("express");
const router = express.Router();

const {
  getAllMatches,
  getMatchDetails,
  placeBet,
  getMyBets,
  getOpenBets,
  fetchScorecard,
  getTracker,
  getStream,
  rollbackSettlement,
  previewRollback,
} = require("../controllers/sports/sportsController");
const authMiddleware = require("../middleWare/authmiddleWare");
const verifyAdmin = require("../middleWare/adminAuthMiddleware");

router.get("/matches", getAllMatches);
router.get("/match/details", getMatchDetails);
router.get("/match/scorecard", fetchScorecard);
router.get("/match/tracker", getTracker);
router.post("/bet/place", authMiddleware, placeBet);
router.get("/bet/my-bets", authMiddleware, getMyBets);
router.get("/bet/open-bets", authMiddleware, getOpenBets);
router.get("/match/stream", authMiddleware, getStream);
router.get(
  "/settle/rollback/preview",
  authMiddleware,
  verifyAdmin,
  previewRollback,
);
router.post(
  "/settle/rollback",
  authMiddleware,
  verifyAdmin,
  rollbackSettlement,
);
module.exports = router;
