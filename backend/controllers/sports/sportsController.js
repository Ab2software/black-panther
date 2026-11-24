const { fetchSportsData } = require("../../services/sportsService");
const { fetchMatchDetails } = require("../../services/matchService");
const {
  callSettlementProxy,
  createBetRecord,
  getUserBetsService,
  getOpenBetsService,
} = require("../../services/betservice");
const { processSettlement, rollbackSettlementForEvent, previewRollbackForEvent } = require("../../services/settlementService");
const { getScorecard } = require("../../services/scorecardService.js");
const { recalculateExposure } = require("../../services/exposureService");
const User = require("../../model/User");
const {
  setCachedMatch,
  getCachedMatch,
} = require("../../services/matchCache.js");
const trackerService = require("../../services/trackerService");
const { fetchStreamUrl } = require("../../services/streamingService");
const mongoose = require("mongoose");

// ── GET /api/v1/sports/matches ────────────────────────────────────────────
const getAllMatches = async (req, res) => {
  try {
    const sport = req.query.sport || "cricket";
    let data;
    try {
      data = await fetchSportsData(sport);
    } catch (fetchErr) {
      console.warn("External Sports API unavailable, providing empty/fallback feed:", fetchErr.message);
      return res.status(200).json({
        success: true,
        total: 0,
        data: [],
      });
    }

    const matches = data?.data?.result || [];

    const seen = new Set();
    const filtered = matches.filter((m) => {
      if (m.mtype !== "MATCH_ODDS" || m.op !== "Betfair") return false;
      if (seen.has(m.groupById)) return false;
      seen.add(m.groupById);
      return true;
    });

    const formattedMatches = filtered.map((match) => ({
      marketId: match.id,
      eventId: match.event?.id,
      groupById: match.groupById,
      eventTypeId: match.eventTypeId,
      matchName: match.event?.name,
      competition: match.competition?.name,
      marketName: match.name,
      marketType: match.mtype,
      startTime: match.event?.openDate,
      inPlay: match.inPlay,
      status: match.status,
      provider: match.op,
      runners: match.runners?.map((runner) => ({
        selectionId: runner.id,
        teamName: runner.name,
        back: runner.back || [],
        lay: runner.lay || [],
        lastPriceTraded: runner.lastPriceTraded,
        status: runner.status,
      })),
      scores: match.scores || null,
    }));

    res.status(200).json({
      success: true,
      total: formattedMatches.length,
      data: formattedMatches,
    });
  } catch (error) {
    console.error("Controller Error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── GET /api/v1/sports/match ──────────────────────────────────────────────
const getMatchDetails = async (req, res) => {
  try {
    const { matchId, sport = "cricket" } = req.query;

    if (!matchId) {
      return res.status(400).json({
        success: false,
        message: "matchId is required",
      });
    }

    const raw = await fetchMatchDetails(matchId, sport);

    if (raw?.status === "error") {
      return res.status(404).json({
        success: false,
        message: raw.message || "Match not found",
      });
    }

    const result = raw?.data?.result || [];

    if (!result.length) {
      return res.status(404).json({
        success: false,
        message: "No markets found for this match",
      });
    }

    const matchOddsMarket =
      result.find((m) => m.mtype === "MATCH_ODDS" && m.op === "Betfair") ||
      result.find((m) => m.mtype === "MATCH_ODDS") ||
      result[0];

    const bookmakerMarket =
      result.find(
        (m) =>
          (m.op === "RD_BM" || m.op === "BB_BM") &&
          m.name?.toLowerCase().includes("bookmaker"),
      ) || null;

    const tossMarket =
      result.find((m) => m.name?.toLowerCase().includes("toss")) || null;

    const tiedMatchMarket =
      result.find((m) => m.name?.toLowerCase().includes("tied")) || null;

    const fancyMarkets = result.filter(
      (m) => m.op === "RD_FANCY" || m.op === "BB_FANCY",
    );

    const groupedFancy = {};
    const groupedPremiumFancy = {};

    fancyMarkets.forEach((market) => {
      const tab =
        market.dTabGroupName ||
        market.tabGroupName ||
        market.dTtabGroupName ||
        "Fancy";

      const marketData = {
        id: market.id,
        name: market.name,
        status: market.status,
        inPlay: market.inPlay,
        runners:
          market.runners?.map((r) => ({
            id: r.id,
            name: r.name,
            back: r.back || [],
            lay: r.lay || [],
            line: r.back?.[0]?.line ?? r.lay?.[0]?.line ?? null,
            status: r.status,
          })) || [],
      };

      if (tab.toLowerCase().includes("run bhav")) {
        if (!groupedPremiumFancy[tab]) groupedPremiumFancy[tab] = [];
        groupedPremiumFancy[tab].push(marketData);
      } else {
        if (!groupedFancy[tab]) groupedFancy[tab] = [];
        groupedFancy[tab].push(marketData);
      }
    });

    const runners = (matchOddsMarket?.runners || []).map((r) => ({
      selectionId: r.id,
      teamName: r.name,
      back: r.back || [],
      lay: r.lay || [],
      status: r.status,
      lastPriceTraded: r.lastPriceTraded,
      totalMatched: r.totalMatched,
    }));

    const market = {
      marketId: matchOddsMarket?.id || matchId,
      groupById: matchOddsMarket?.groupById || matchId,
      eventTypeId: matchOddsMarket?.eventTypeId,
      matchName: matchOddsMarket?.event?.name || "",
      competition: matchOddsMarket?.competition?.name || "",
      startTime: matchOddsMarket?.event?.openDate || null,
      inPlay: matchOddsMarket?.inPlay || false,
      status: matchOddsMarket?.status || "",
      marketName: matchOddsMarket?.name || "",
      matched: matchOddsMarket?.matched || 0,
      runners,
      bookmaker: bookmakerMarket
        ? {
            id: bookmakerMarket.id,
            name: bookmakerMarket.name,
            status: bookmakerMarket.status,
            // ✅ The vendor can mark this market non-bettable while every
            // individual runner still reports status: "ACTIVE" — the
            // frontend needs these two fields (not just `status`) to
            // reliably detect and block that window. Previously this
            // REST payload (used for the initial page load, before the
            // socket's odds-update events take over) never forwarded
            // them at all, so the very first render — and any client
            // that only ever hits this REST endpoint — had no way to
            // know the market was blocked until the next socket tick.
            statusLabel: bookmakerMarket.statusLabel,
            isBettable: bookmakerMarket.isBettable,
            inPlay: bookmakerMarket.inPlay,
            runners:
              bookmakerMarket.runners?.map((r) => ({
                id: r.id,
                name: r.name,
                back: r.back || [],
                lay: r.lay || [],
                status: r.status,
              })) || [],
          }
        : null,
      toss: tossMarket
        ? {
            id: tossMarket.id,
            name: tossMarket.name,
            status: tossMarket.status,
            inPlay: tossMarket.inPlay,
            runners:
              tossMarket.runners?.map((r) => ({
                id: r.id,
                name: r.name,
                back: r.back || [],
                lay: r.lay || [],
                status: r.status,
              })) || [],
          }
        : null,
      tiedMatch: tiedMatchMarket
        ? {
            id: tiedMatchMarket.id,
            name: tiedMatchMarket.name,
            status: tiedMatchMarket.status,
            inPlay: tiedMatchMarket.inPlay,
            runners:
              tiedMatchMarket.runners?.map((r) => ({
                id: r.id,
                name: r.name,
                back: r.back || [],
                lay: r.lay || [],
                status: r.status,
              })) || [],
          }
        : null,
      fancy: groupedFancy,
      premiumFancy: groupedPremiumFancy,
    };

    return res.status(200).json({
      success: true,
      data: market,
    });
  } catch (error) {
    console.error("Match Controller Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ── HELPER: Get live odds ──────────────────────────────────────────────────
const getLiveOddsForSelection = async ({
  eventId,
  sport,
  selectionName,
  sectionTeam,
  side,
  submittedPrice,
}) => {
  let result = getCachedMatch(eventId, sport);

  if (!result) {
    try {
      const raw = await fetchMatchDetails(eventId, sport);
      result = raw?.data?.result || [];
      setCachedMatch(eventId, sport, result);
    } catch (err) {
      return null;
    }
  }

  if (!result.length) return null;

  const selLower = selectionName?.toLowerCase();
  const isFancySel = ["fancy", "premium fancy"].includes(selLower);

  if (!isFancySel) {
    let marketCandidates = [];

    if (selLower === "match odds") {
      marketCandidates = result.filter((m) => m.mtype === "MATCH_ODDS");
    } else if (selLower === "bookmaker") {
      marketCandidates = result.filter(
        (m) =>
          (m.op === "RD_BM" || m.op === "BB_BM") &&
          m.name?.toLowerCase().includes("bookmaker"),
      );
    } else if (selLower === "to win the toss") {
      marketCandidates = result.filter((m) =>
        m.name?.toLowerCase().includes("toss"),
      );
    } else if (selLower === "tied match") {
      marketCandidates = result.filter((m) =>
        m.name?.toLowerCase().includes("tied"),
      );
    }

    for (const market of marketCandidates) {
      // ✅ FIX: Check market status
      if (market.status === "SUSPENDED" || market.inPlay === false) {
        continue;
      }

      const runner = market.runners?.find(
        (r) => r.name?.toLowerCase() === sectionTeam?.toLowerCase(),
      );
      if (!runner) continue;

      if (runner.status === "REMOVED" || runner.status === "SUSPENDED") {
        continue;
      }

      const list = side === "back" ? runner.back : runner.lay;

      // ✅ FIX: Better tolerance for odds matching
      const tolerance = 0.01;
      const exactMatch = list?.find(
        (entry) =>
          Math.abs(Number(entry.price) - Number(submittedPrice)) /
            Number(submittedPrice) <
          tolerance,
      );

      if (exactMatch) {
        return { price: Number(exactMatch.price) };
      }

      const bestAvailable = list?.[0]?.price;
      if (bestAvailable !== undefined && bestAvailable !== null) {
        return { price: Number(bestAvailable) };
      }
    }

    return null;
  }

  // ===== FANCY / PREMIUM FANCY =====
  const fancyMarkets = result.filter(
    (m) => m.op === "RD_FANCY" || m.op === "BB_FANCY",
  );

  for (const market of fancyMarkets) {
    if (market.status === "SUSPENDED" || market.inPlay === false) {
      continue;
    }

    const runner = market.runners?.find(
      (r) => r.name?.toLowerCase() === sectionTeam?.toLowerCase(),
    );
    if (!runner) continue;

    if (runner.status === "REMOVED" || runner.status === "SUSPENDED") {
      continue;
    }

    const list = side === "back" ? runner.back : runner.lay;
    const top = list?.[0];

    if (top) {
      // ✅ FIX: Handle fancy odds properly (back/lay pair)
      if (Array.isArray(top.price)) {
        return {
          backRate: Number(top.price[0]),
          layRate: Number(top.price[1]),
          line: top.line !== undefined && top.line !== null ? Number(top.line) : null,
        };
      }

      return {
        fancyRate: Number(top.price),
        line: top.line !== undefined && top.line !== null ? Number(top.line) : null,
      };
    }
  }

  return null;
};

// ── HELPER: Calculate correct liability ────────────────────────────────────
const calculateLiability = (side, stake, price, isFancy = false, fancyRate = null, fancyPrice = null) => {
  if (side === "back") {
    return Number(stake); // Back bet me loss = stake
  }

  // Lay bet
  if (isFancy) {
    // Fancy lay liability calculation
    // Example: 93 @ 110 means lay rate = 110, back rate = 93
    // Liability = stake * (lay_rate / back_rate - 1)
    if (fancyRate && fancyPrice) {
      const layRate = Number(fancyRate);
      const backRate = Number(fancyPrice);
      if (backRate > 0 && layRate > backRate) {
        return Number(stake) * (layRate / backRate - 1);
      }
      // Fallback: treat as normal odds
      return Number(stake) * (layRate - 1);
    }
    return Number(stake);
  }

  // Normal lay bet
  const odds = Number(price);
  return Number(stake) * (odds - 1);
};

// ── HELPER: Check for cross bets (hedging) ────────────────────────────────
const getCrossBetExposure = async (userId, eventId, sectionTeam, side, stake, price, isFancy, fancyRate, fancyPrice) => {
  // Get all open bets for this selection
  const openBets = await getOpenBetsService({
    userId,
    eventId,
    sectionTeam,
    status: { $in: ["Pending", "Open"] },
  });

  let netExposure = 0;
  let oppositeBets = [];

  for (const bet of openBets) {
    // Skip if same side
    if (bet.side === side) continue;

    // This is an opposite bet (cross/hedge)
    const betLiability = calculateLiability(
      bet.side,
      bet.stake,
      bet.price,
      bet.isFancy || false,
      bet.fancyRate,
      bet.fancyPrice
    );

    oppositeBets.push({
      betId: bet.betId,
      liability: betLiability,
      stake: bet.stake,
      side: bet.side,
    });
  }

  // Calculate net exposure after cross bets
  const newLiability = calculateLiability(
    side,
    stake,
    price,
    isFancy,
    fancyRate,
    fancyPrice
  );

  // If there are opposite bets, they reduce the exposure
  // Example: Back bet of ₹550 and Lay bet of ₹550 at odds 41
  // Back liability = ₹550, Lay liability = ₹22,000
  // Net exposure = max(0, 22000 - 550) = ₹21,450
  // But if both settle, net P/L = 0 (they cancel out)

  let totalOppositeLiability = 0;
  for (const opp of oppositeBets) {
    totalOppositeLiability += opp.liability;
  }

  // For cross bets, the net exposure is the difference
  // But we need to handle both scenarios:
  // 1. If new bet is lay, opposite back bets reduce lay liability
  // 2. If new bet is back, opposite lay bets reduce back liability

  if (side === "lay") {
    // Lay liability reduced by back bets
    netExposure = Math.max(0, newLiability - totalOppositeLiability);
  } else {
    // Back liability reduced by lay bets
    netExposure = Math.max(0, newLiability - totalOppositeLiability);
  }

  return {
    netExposure,
    oppositeBets,
    newLiability,
    totalOppositeLiability,
  };
};

// ── POST /api/v1/sports/bet/place ─────────────────────────────────────────
const placeBet = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    const userId = req.user?._id || req.user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const matchName = req.body.matchName || req.body.match_name;
    const marketId = req.body.marketId || req.body.market_id;
    const eventId = req.body.eventId || req.body.event_id || req.body.groupById;
    const sport = req.body.sport || "cricket";
    const selectionName = req.body.selectionName || req.body.selection_name;
    const sectionTeam = req.body.sectionTeam || req.body.section_team;
    const side = req.body.side;
    const price = req.body.price;
    const rate = req.body.rate;
    const fancyPrice = req.body.fancyPrice || req.body.fancy_price;
    const fancyRate = req.body.fancyRate || req.body.fancy_rate;
    const stake = req.body.stake;
    const eventTypeId = req.body.eventTypeId || req.body.event_type_id || "4";

    const missing = [];
    if (!matchName) missing.push("matchName");
    if (!marketId) missing.push("marketId");
    if (!eventId) missing.push("eventId");
    if (!sport) missing.push("sport");
    if (!selectionName) missing.push("selectionName");
    if (!sectionTeam) missing.push("sectionTeam");
    if (!side) missing.push("side");
    if (!stake) missing.push("stake");

    if (missing.length) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
        missing,
      });
    }

    if (!["back", "lay"].includes(side)) {
      return res.status(400).json({
        success: false,
        message: "side must be 'back' or 'lay'",
      });
    }

    const stakeNum = Number(stake);
    if (stakeNum <= 0) {
      return res.status(400).json({
        success: false,
        message: "stake must be greater than 0",
      });
    }

    // Read user for validation
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (user.status !== "active") {
      return res.status(403).json({
        success: false,
        message: "User account is not active",
      });
    }

    if (!user.permissions?.canBet) {
      return res.status(403).json({
        success: false,
        message: "Betting is disabled for this user",
      });
    }

    if (user.permissions?.isBetLocked) {
      return res.status(403).json({
        success: false,
        message: "Betting is locked for this user",
      });
    }

    if (stakeNum < user.bettingLimits.minBet) {
      return res.status(400).json({
        success: false,
        message: `Minimum bet is ${user.bettingLimits.minBet}`,
      });
    }

    if (stakeNum > user.bettingLimits.maxBet) {
      return res.status(400).json({
        success: false,
        message: `Maximum bet is ${user.bettingLimits.maxBet}`,
      });
    }

    const isFancy = ["fancy", "premium fancy"].includes(selectionName?.toLowerCase());

    if (!isFancy) {
      const oddsToCheck = Number(price);
      if (
        Number.isNaN(oddsToCheck) ||
        oddsToCheck < user.bettingLimits.minOdds ||
        oddsToCheck > user.bettingLimits.maxOdds
      ) {
        return res.status(400).json({
          success: false,
          message: `Odds must be between ${user.bettingLimits.minOdds} and ${user.bettingLimits.maxOdds}`,
        });
      }
    } else {
      if (Number.isNaN(Number(fancyRate))) {
        return res.status(400).json({
          success: false,
          message: "Invalid fancy rate",
        });
      }
    }

    // ===== LIVE ODDS VERIFICATION =====
    let liveOdds;
    try {
      liveOdds = await getLiveOddsForSelection({
        eventId,
        sport,
        selectionName,
        sectionTeam,
        side,
        submittedPrice: price,
      });
    } catch (err) {
      console.error("Live odds verification fetch failed:", err.message);
      return res.status(503).json({
        success: false,
        message: "Unable to verify live odds, please try again",
      });
    }

    if (!liveOdds) {
      return res.status(409).json({
        success: false,
        message: "Market suspended. Please wait and try again.",
      });
    }

    if (!isFancy) {
      const submittedPrice = Number(price);
      const currentPrice = liveOdds.price;
      const priceDiff = Math.abs(submittedPrice - currentPrice);

      if (
        currentPrice === undefined ||
        currentPrice === null ||
        Number.isNaN(currentPrice) ||
        priceDiff > 0.01
      ) {
        return res.status(409).json({
          success: false,
          message: `Odds moved from ${submittedPrice} to ${currentPrice}. Bet updated — please confirm and try again.`,
          submittedPrice,
          currentPrice,
        });
      }
    } else {
      const submittedFancyRate = Number(fancyRate);
      const currentFancyRate = liveOdds.fancyRate || liveOdds.layRate;
      const submittedLine =
        fancyPrice !== undefined && fancyPrice !== null && fancyPrice !== ""
          ? Number(fancyPrice)
          : null;
      const currentLine = liveOdds.line;

      const rateChanged =
        currentFancyRate === undefined ||
        currentFancyRate === null ||
        Number.isNaN(currentFancyRate) ||
        Math.abs(submittedFancyRate - currentFancyRate) > 0.01;

      const lineChanged =
        submittedLine !== null && currentLine !== null && submittedLine !== currentLine;

      if (rateChanged || lineChanged) {
        return res.status(409).json({
          success: false,
          message: `Rate moved from ${submittedFancyRate} to ${currentFancyRate}. Bet updated — please confirm and try again.`,
          submittedFancyRate,
          currentFancyRate,
          submittedLine,
          currentLine,
        });
      }
    }

    // ===== CALCULATE CORRECT LIABILITY =====
    const liability = calculateLiability(
      side,
      stakeNum,
      price,
      isFancy,
      fancyRate,
      fancyPrice
    );

    // ===== CHECK CROSS BETS (HEDGING) =====
    const crossBetInfo = await getCrossBetExposure(
      userId,
      eventId,
      sectionTeam,
      side,
      stakeNum,
      price,
      isFancy,
      fancyRate,
      fancyPrice
    );

    // The actual exposure to block is the net exposure after cross bets
    const exposureToBlock = crossBetInfo.netExposure;

    // ===== ATOMIC EXPOSURE RESERVATION =====
    let txResult;

    try {
      await session.withTransaction(async () => {
        // Recalculate total exposure from all open bets
        const simulatedBet = {
          userId,
          eventId,
          marketId,
          selectionName,
          sectionTeam,
          side,
          price: price != null && price !== "" ? Number(price) : null,
          fancyRate: fancyRate != null && fancyRate !== "" ? Number(fancyRate) : null,
          fancyPrice: fancyPrice != null && fancyPrice !== "" ? Number(fancyPrice) : null,
          stake: stakeNum,
          status: "Pending",
          // ✅ Store cross bet info
          isCrossBet: crossBetInfo.oppositeBets.length > 0,
          crossBetDetails: crossBetInfo.oppositeBets,
          // ✅ Store correct liability
          liability: liability,
          netExposure: exposureToBlock,
        };

        // Recalculate exposure from scratch
        const newTotalExposure = await recalculateExposure(
          userId,
          simulatedBet,
          false,
          session
        );

        // Re-read user inside transaction
        const freshUser = await User.findById(userId).session(session);
        const currentExposure = freshUser.wallet.exposure || 0;
        const currentCasinoExposure = freshUser.wallet.casinoExposure || 0;
        const exposureDelta = Math.max(0, newTotalExposure - currentExposure);

        // ✅ FIX: Allow negative balance (credit facility)
        const hasCreditLimit = freshUser.creditLimit && freshUser.creditLimit > 0;
        const currentBalance = freshUser.wallet.balance;
        const availableBalance = currentBalance - currentExposure - currentCasinoExposure;

        // ✅ Check if user has enough balance OR credit
        let canPlaceBet = false;

        if (hasCreditLimit) {
          // Allow if balance + creditLimit >= required exposure
          const totalAvailable = availableBalance + freshUser.creditLimit;
          if (totalAvailable >= exposureDelta) {
            canPlaceBet = true;
          }
        } else {
          // Normal check
          if (availableBalance >= exposureDelta) {
            canPlaceBet = true;
          }
        }

        if (!canPlaceBet) {
          throw Object.assign(new Error("Insufficient balance"), {
            code: "INSUFFICIENT_BALANCE",
            exposureDelta,
            availableBalance,
            creditLimit: freshUser.creditLimit || 0,
          });
        }

        if (newTotalExposure > freshUser.bettingLimits.maxExposure) {
          throw Object.assign(new Error("Max exposure limit exceeded"), {
            code: "MAX_EXPOSURE",
          });
        }

        // ✅ FIX: Atomic update with dynamic exposure check
        const updatedUser = await User.findOneAndUpdate(
          {
            _id: userId,
            $expr: {
              $gte: [
                {
                  $add: [
                    {
                      $subtract: [
                        "$wallet.balance",
                        {
                          $add: [
                            "$wallet.exposure",
                            { $ifNull: ["$wallet.casinoExposure", 0] },
                          ],
                        },
                      ],
                    },
                    { $ifNull: ["$creditLimit", 0] },
                  ],
                },
                {
                  $subtract: [
                    newTotalExposure,
                    "$wallet.exposure"
                  ]
                }
              ],
            },
          },
          {
            $set: {
              "wallet.exposure": newTotalExposure,
              "wallet.availableBalance": Math.max(
                0,
                freshUser.wallet.balance - newTotalExposure - currentCasinoExposure
              ),
            },
            $inc: { "stats.totalBets": 1 },
          },
          { new: true, session }
        );

        if (!updatedUser) {
          throw Object.assign(new Error("Insufficient balance"), {
            code: "INSUFFICIENT_BALANCE",
            exposureDelta,
            availableBalance,
          });
        }

        txResult = {
          updatedUser,
          liability: liability,
          exposureToBlock: exposureToBlock,
          newTotalExposure,
          crossBetInfo,
        };
      });
    } catch (err) {
      if (err.code === "INSUFFICIENT_BALANCE") {
        return res.status(400).json({
          success: false,
          message: err.message || "Insufficient balance",
          requiredExposure: err.exposureDelta || 0,
          availableBalance: err.availableBalance || 0,
          creditLimit: err.creditLimit || 0,
        });
      }
      if (err.code === "MAX_EXPOSURE") {
        return res.status(400).json({
          success: false,
          message: "Max exposure limit exceeded",
        });
      }
      throw err;
    }

    // ===== SLOW PART: Settlement proxy call =====
    const betId = String(Math.floor(10000000 + Math.random() * 90000000));

    const betData = {
      matchName,
      marketId,
      eventId,
      sport,
      eventTypeId,
      selectionName,
      sectionTeam,
      side,
      price: price != null && price !== "" ? Number(price) : null,
      rate: rate != null && rate !== "" ? Number(rate) : null,
      fancyPrice: fancyPrice != null && fancyPrice !== "" ? Number(fancyPrice) : null,
      fancyRate: fancyRate != null && fancyRate !== "" ? Number(fancyRate) : null,
      stake: stakeNum,
      liability: liability,
      blockedExposure: txResult.exposureToBlock,
      exposureCutPercent: 100,
      isCrossBet: txResult.crossBetInfo.oppositeBets.length > 0,
      crossBetDetails: txResult.crossBetInfo.oppositeBets,
    };

    const { settlementResponse } = await callSettlementProxy(betId, betData);

    // ===== SAVE BET RECORD =====
    let bet;
    try {
      bet = await createBetRecord({
        userId,
        siteId: req.user.siteId,
        betId,
        betData,
        settlementResponse,
      });
    } catch (dbErr) {
      // ✅ Rollback: exposure reservation succeeded but bet record failed
      console.error("createBetRecord failed after exposure reserved:", dbErr.message);

      try {
        const correctedExposure = await recalculateExposure(userId, null, false);
        const freshUserForRollback = await User.findById(userId);

        await User.findByIdAndUpdate(
          userId,
          {
            $set: {
              "wallet.exposure": correctedExposure,
              "wallet.availableBalance": Math.max(
                0,
                freshUserForRollback.wallet.balance -
                  correctedExposure -
                  (freshUserForRollback.wallet.casinoExposure || 0)
              ),
            },
            $inc: { "stats.totalBets": -1 },
          },
          { new: true }
        );
      } catch (rollbackErr) {
        console.error("Exposure rollback also failed:", rollbackErr.message);
      }

      return res.status(500).json({
        success: false,
        message: "Failed to save bet, please try again",
      });
    }

    return res.status(201).json({
      success: true,
      message: "Bet placed successfully",
      wallet: {
        balance: txResult.updatedUser.wallet.balance,
        exposure: txResult.newTotalExposure,
        availableBalance: txResult.updatedUser.wallet.availableBalance,
      },
      liability: txResult.liability,
      blockedExposure: txResult.exposureToBlock,
      betId: bet.betId,
      bet,
      settlementResponse,
      crossBet: {
        isCrossBet: txResult.crossBetInfo.oppositeBets.length > 0,
        oppositeBets: txResult.crossBetInfo.oppositeBets,
        netExposure: txResult.crossBetInfo.netExposure,
      },
    });
  } catch (error) {
    console.error("placeBet Controller Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  } finally {
    session.endSession();
  }
};

// ── GET /api/v1/sports/bet/my-bets ───────────────────────────────────────
const getMyBets = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { status, page = 1, limit = 20 } = req.query;

    const result = await getUserBetsService({
      userId,
      status,
      page: Number(page),
      limit: Number(limit),
    });

    return res.status(200).json({
      success: true,
      total: result.total,
      page: result.page,
      limit: result.limit,
      data: result.bets,
    });
  } catch (error) {
    console.error("getMyBets Controller Error:", error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ── GET /api/v1/sports/bet/open-bets ─────────────────────────────────────
const getOpenBets = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const bets = await getOpenBetsService({ userId });

    return res.status(200).json({
      success: true,
      total: bets.length,
      data: bets,
    });
  } catch (error) {
    console.error("getOpenBets Controller Error:", error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ── POST /api/v1/sports/settle/:eventTypeId ───────────────────────────────
const settlementController = async (req, res) => {
  try {
    const { eventTypeId } = req.params;

    if (!eventTypeId) {
      return res.status(400).json({
        success: false,
        message: "eventTypeId required",
      });
    }

    const result = await processSettlement(eventTypeId);

    return res.status(200).json({
      success: true,
      message: "Settlement completed",
      ...result,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// ── GET /api/v1/sports/scorecard ──────────────────────────────────────────
const fetchScorecard = async (req, res) => {
  try {
    const { sport, event_id } = req.query;

    const html = await getScorecard(sport, event_id);

    res.setHeader("Content-Type", "text/html");
    return res.send(html);
  } catch (error) {
    console.error("Scorecard Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ── GET /api/v1/sports/tracker ────────────────────────────────────────────
const getTracker = async (req, res) => {
  try {
    const { event_id, event_type_id } = req.query;

    if (!event_id || !event_type_id) {
      return res.status(400).json({
        success: false,
        message: "event_id and event_type_id are required",
      });
    }

    const tracker = await trackerService.getTracker(
      event_id,
      event_type_id
    );

    return res.json(tracker);
  } catch (error) {
    console.error("Tracker Error:", error.response?.data || error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch tracker",
      error: error.response?.data || error.message,
    });
  }
};

// ── GET /api/v1/sports/match/stream ───────────────────────────────────────
const getStream = async (req, res) => {
  try {
    const { event_type_id, event_id } = req.query;

    if (!event_type_id || !event_id) {
      return res.status(400).json({
        success: false,
        message: "event_type_id and event_id are required",
      });
    }

    const data = await fetchStreamUrl(event_type_id, event_id);

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    if (error.code === "INVALID_INPUT") {
      return res.status(400).json({ success: false, message: error.message });
    }
    if (error.code === "UPSTREAM_ERROR" || error.code === "UPSTREAM_BAD_RESPONSE") {
      console.error("Stream Controller Upstream Error:", error.message, error.cause || "");
      return res.status(502).json({ success: false, message: "Unable to fetch stream, please try again" });
    }
    console.error("Stream Controller Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

const rollbackSettlement = async (req, res) => {
  try {
    const { eventId } = req.body;

    if (!eventId) {
      return res.status(400).json({ success: false, message: "eventId is required" });
    }

    const result = await rollbackSettlementForEvent(eventId);

    return res.status(200).json(result);
  } catch (err) {
    console.error("Rollback Controller Error:", err);
    const status = err.code === "BAD_REQUEST" ? 400 : 500;
    return res.status(status).json({ success: false, message: err.message });
  }
};

const previewRollback = async (req, res) => {
  try {
    const { eventId } = req.query;

    if (!eventId) {
      return res.status(400).json({ success: false, message: "eventId is required" });
    }

    const result = await previewRollbackForEvent(eventId);

    return res.status(200).json(result);
  } catch (err) {
    console.error("Preview Rollback Controller Error:", err);
    const status = err.code === "BAD_REQUEST" ? 400 : 500;
    return res.status(status).json({ success: false, message: err.message });
  }
};

module.exports = {
  getAllMatches,
  getMatchDetails,
  placeBet,
  getMyBets,
  getOpenBets,
  settlementController,
  fetchScorecard,
  getTracker,
  getStream,
  rollbackSettlement,
  previewRollback,
};