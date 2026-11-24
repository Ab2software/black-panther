const Bet = require("../model/bet");

// ── FIXED: was double-decrementing "__other__" on every back bet after the
// first, inflating match odds exposure whenever a user placed 2+ back bets
// in the same market. Lay bets were never affected — only this branch was
// asymmetric. Rewritten so every runner (including __other__) is updated
// exactly once per bet, with no special-casing.
const getMatchOddsExposure = (betlist) => {
  const pl = { __other__: 0 };

  for (const bet of betlist) {
    const stake = Number(bet.stake);
    const price = Number(bet.price);
    const team = bet.sectionTeam;

    if (pl[team] === undefined) {
      pl[team] = pl["__other__"];
    }

    if (bet.side === "back") {
      pl[team] += (price - 1) * stake;
    } else {
      pl[team] -= (price - 1) * stake;
    }

    for (const runner of Object.keys(pl)) {
      if (runner !== team) {
        pl[runner] += bet.side === "back" ? -stake : stake;
      }
    }
  }

  return pl;
};

/**
 * Groups bets by marketId, computes worst-case P&L per market via
 * getMatchOddsExposure, and sums the total exposure across all markets.
 * `realRunnerThreshold` is how many distinct real outcomes this market
 * type has (2 for Match Odds, 3 for Tied Match) — once that many named
 * runners appear, __other__ is a mathematically impossible remaining
 * outcome and gets excluded from the worst-case selection. Below that
 * threshold, __other__ still represents real, un-enumerated risk (the
 * outcome(s) nobody has bet on yet) and must stay in the calculation.
 */
const calcWorstCaseTotal = (bets, realRunnerThreshold) => {
  const byMarket = {};
  for (const bet of bets) {
    const key = bet.marketId;
    if (!byMarket[key]) byMarket[key] = [];
    byMarket[key].push(bet);
  }

  let total = 0;
  for (const marketBets of Object.values(byMarket)) {
    const pl = getMatchOddsExposure(marketBets);
    const realRunnerKeys = Object.keys(pl).filter((k) => k !== "__other__");

    const values =
      realRunnerKeys.length >= realRunnerThreshold
        ? realRunnerKeys.map((k) => pl[k])
        : Object.values(pl);

    const worstCase = Math.min(...values);
    if (worstCase < 0) total += Math.abs(worstCase);
  }

  return total;
};

/**
 * Decide whether a given fancy bet WINS if the eventual actual value equals `actualValue`.
 *
 * ASSUMPTION (please confirm against your settlement code, flip if wrong):
 *   - side === "back" wins when actualValue >= bet.fancyPrice
 *   - side === "lay"  wins when actualValue <  bet.fancyPrice
 *
 * If your platform's real convention is the opposite, just swap the
 * comparison operators below - nothing else in this file needs to change.
 */
const outcomeWins = (bet, actualValue) => {
  const line = Number(bet.fancyPrice);
  if (bet.side === "back") {
    return actualValue >= line;
  }
  return actualValue < line;
};

/**
 * P&L for a single fancy bet given a hypothetical actual outcome value.
 * Win  -> +(fancyRate / 100) * stake
 * Lose -> -stake
 */
const fancyBetPL = (bet, actualValue) => {
  const stake = Number(bet.stake);
  const fancyRate = Number(bet.fancyRate) || 0;
  return outcomeWins(bet, actualValue) ? (fancyRate / 100) * stake : -stake;
};

/**
 * Computes true worst-case exposure for a group of fancy bets that all
 * belong to the SAME fancy market (same eventId + sectionTeam).
 *
 * Because each bet's win/loss flips at its own `fancyPrice` line, and
 * different bets in the same market can sit at different lines (the line
 * moves live), you can't net bets by simply subtracting stakes. Instead we
 * scan every candidate actual outcome (each distinct line value, and one
 * step below it to capture both sides of that breakpoint), sum the P&L of
 * every bet in the market at that hypothetical outcome, and take the worst
 * (most negative) total across all candidates. That worst-case total is
 * where genuine back/lay hedges correctly cancel out, and where one-sided
 * positions correctly show full risk.
 */
const worstCaseForMarket = (marketBets) => {
  const candidateValues = new Set();
  for (const bet of marketBets) {
    const line = Number(bet.fancyPrice);
    candidateValues.add(line);
    candidateValues.add(line - 1); // other side of the same breakpoint
  }

  let worst = 0;
  for (const candidate of candidateValues) {
    let total = 0;
    for (const bet of marketBets) {
      total += fancyBetPL(bet, candidate);
    }
    if (total < worst) worst = total;
  }

  return worst; // <= 0
};

/**
 * Groups fancy bets by market (sectionTeam) and returns worst-case P&L per
 * market. Different sectionTeams are independent markets and must never
 * net against each other (matches getMatchOddsExposure's per-runner shape,
 * so recalculateExposure's Object.values(...) summing logic still works).
 */
const getFancyExposure = (betlist) => {
  const byMarket = {};
  for (const bet of betlist) {
    const key = bet.sectionTeam;
    if (!byMarket[key]) byMarket[key] = [];
    byMarket[key].push(bet);
  }

  const pl = {};
  for (const [market, marketBets] of Object.entries(byMarket)) {
    pl[market] = worstCaseForMarket(marketBets);
  }

  return pl;
};

/**
 * Recalculates total exposure for a user from scratch across all pending bets.
 * IMPORTANT: pass `session` whenever this runs as part of a placeBet transaction,
 * so the pending-bet scan sees a consistent snapshot and doesn't race with
 * concurrent bet placements.
 */
const recalculateExposure = async (
  userId,
  currentBet = null,
  save = false,
  session = null,
) => {
  const query = Bet.find({ userId, status: "Pending" });
  if (session) query.session(session);
  const pendingBets = await query.lean();

  const allBets = currentBet ? [...pendingBets, currentBet] : pendingBets;

  if (!allBets.length) return 0;

  const byEvent = {};
  for (const bet of allBets) {
    const key = bet.eventId;
    if (!byEvent[key]) byEvent[key] = [];
    byEvent[key].push(bet);
  }

  let totalMatchOddsExposure = 0;
  let totalFancyExposure = 0;

  for (const eventId of Object.keys(byEvent)) {
    const eventBets = byEvent[eventId];

    const isTiedMatch = (b) => b.selectionName?.toLowerCase() === "tied match";
    const isFancy = (b) =>
      b.selectionName?.toLowerCase() === "fancy" ||
      b.selectionName?.toLowerCase() === "premium fancy";

    // ── Match Odds (2-way: Team A / Team B) ──
    const matchOddsBets = eventBets.filter((b) => !isFancy(b) && !isTiedMatch(b));
    totalMatchOddsExposure += calcWorstCaseTotal(matchOddsBets, 2);

    // ── Tied Match (3-way: Team A / Team B / Tie) — separated out so it
    // never gets grouped with regular Match Odds bets even if they
    // happen to share a marketId, and uses a 3-outcome threshold for
    // when __other__ can be safely excluded. ──
    const tiedMatchBets = eventBets.filter(isTiedMatch);
    totalMatchOddsExposure += calcWorstCaseTotal(tiedMatchBets, 3);

    // ── Fancy — unchanged ──
    const fancyBets = eventBets.filter(isFancy);
    if (fancyBets.length) {
      const fancyPl = getFancyExposure(fancyBets);
      for (const val of Object.values(fancyPl)) {
        if (val < 0) totalFancyExposure += Math.abs(val);
      }
    }
  }

  const totalExposure = totalMatchOddsExposure + totalFancyExposure;

  if (save) {
    const User = require("../model/User");
    const opts = session ? { session } : {};
    await User.findByIdAndUpdate(
      userId,
      { $set: { "wallet.exposure": totalExposure } },
      opts,
    );
  }

  return totalExposure;
};

module.exports = {
  recalculateExposure,
  getMatchOddsExposure,
  getFancyExposure,
  getFancyExposureInternals: { outcomeWins, fancyBetPL, worstCaseForMarket },
};