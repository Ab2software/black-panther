const { fetchMatchDetails } = require('../services/matchService');
const { getScorecard } = require('../services/scorecardService');
const { setCachedMatch } = require('../services/matchCache'); // ✅ new
const activeMatches = new Map();

function buildKey(matchId, sport) {
  return `${matchId}::${sport}`;
}

async function pollAndBroadcast(io, matchId, sport) {
  try {
    const raw = await fetchMatchDetails(matchId, sport);
    const results = raw?.data?.result || [];
setCachedMatch(matchId, sport, results); // ✅ new — feeds the odds-verification cache

    // ── Match Odds ─────────────────────────────────────────────────────
    const matchOddsMarket = results.find(r => r.mtype === 'MATCH_ODDS' && r.name === 'Match Odds');

    // ── Bookmaker ──────────────────────────────────────────────────────
    // ✅ Matches the op-code list already proven correct in
    // sportsController.js's getMatchDetails (RD_BM and BB_BM are both
    // real bookmaker provider codes) — name-substring match kept as a
    // fallback for any other provider not covered by these two.
    const bookmakerMarket = results.find(r =>
      r.op === 'RD_BM' || r.op === 'BB_BM' || (r.mtype === 'MATCH_ODDS_SB' && r.name?.toLowerCase().includes('bookmaker'))
    );

    // ── Toss ───────────────────────────────────────────────────────────
    const tossMarket = results.find(r => r.name?.toLowerCase().includes('toss'));

    // ── Tied Match ─────────────────────────────────────────────────────
    const tiedMarket = results.find(r => r.mtype === 'TIED_MATCH');

    // ── Fancy (INNINGS_RUNS) ───────────────────────────────────────────
    const fancyMarkets = results.filter(r => r.mtype === 'INNINGS_RUNS');
    const fancy = {};
    fancyMarkets.forEach(market => {
      const tabName = 'Fancy';
      if (!fancy[tabName]) fancy[tabName] = [];
      fancy[tabName].push({
        name: market.name,
        runners: (market.runners || []).map(runner => ({
          id: runner.id || runner.selectionId,
          name: runner.name || runner.runnerName,
          status: runner.status,
          back: runner.ex?.availableToBack || runner.back || [],
          lay: runner.ex?.availableToLay || runner.lay || [],
        })),
      });
    });

    // ── Premium Fancy (MATCH_ODDS_SB excluding bookmaker) ─────────────
    const premiumMarkets = results.filter(r =>
      r.mtype === 'MATCH_ODDS_SB' &&
      !r.name?.toLowerCase().includes('bookmaker')
    );
    const premiumFancy = {};
    premiumMarkets.forEach(market => {
      const tabName = 'Premium Fancy';
      if (!premiumFancy[tabName]) premiumFancy[tabName] = [];
      premiumFancy[tabName].push({
        name: market.name,
        runners: (market.runners || []).map(runner => ({
          id: runner.id || runner.selectionId,
          name: runner.name || runner.runnerName,
          status: runner.status,
          back: runner.ex?.availableToBack || runner.back || [],
          lay: runner.ex?.availableToLay || runner.lay || [],
        })),
      });
    });

    // ── Helper to normalize runners ────────────────────────────────────
    const normalizeRunners = (market) => {
      if (!market) return [];
      return (market.runners || []).map(runner => ({
        selectionId: runner.selectionId || runner.id,
        teamName: runner.runnerName || runner.name,
        status: runner.status,
        back: runner.ex?.availableToBack || runner.back || [],
        lay: runner.ex?.availableToLay || runner.lay || [],
      }));
    };

    const matchPayload = {
      matchName: matchOddsMarket?.event?.name || results[0]?.event?.name || '',
      groupById: String(matchId),
      marketId: matchOddsMarket?.id,

      // Match Odds runners
      runners: normalizeRunners(matchOddsMarket),

      // Bookmaker
      // ✅ statusLabel + isBettable now forwarded — the vendor can mark
      // the whole market non-bettable (e.g. during "Ball Running")
      // while every individual runner still reports status: "ACTIVE",
      // so the frontend needs isBettable to correctly block clicks in
      // that window instead of relying on runner status alone.
      bookmaker: bookmakerMarket ? {
        runners: normalizeRunners(bookmakerMarket).map(r => ({
          ...r,
          id: r.selectionId,
          name: r.teamName,
        })),
        status: bookmakerMarket.status,
        statusLabel: bookmakerMarket.statusLabel,
        isBettable: bookmakerMarket.isBettable,
      } : null,

      // Toss
      toss: tossMarket ? {
        runners: normalizeRunners(tossMarket).map(r => ({
          ...r,
          id: r.selectionId,
          name: r.teamName,
        })),
        status: tossMarket.status,
      } : null,

      // Tied Match
      tiedMatch: tiedMarket ? {
        runners: normalizeRunners(tiedMarket).map(r => ({
          ...r,
          id: r.selectionId,
          name: r.teamName,
        })),
        status: tiedMarket.status,
      } : null,

      fancy,
      premiumFancy,
    };

    io.to(`match-${matchId}`).emit('odds-update', {
      success: true,
      data: matchPayload,
    });

  } catch (err) {
    console.error(`[socket-poll] odds error for ${matchId}:`, err.message);
  }

  // ── Scorecard ────────────────────────────────────────────────────────
  try {
    const html = await getScorecard(sport, matchId);
    io.to(`match-${matchId}`).emit('scorecard-update', html);
  } catch (err) {
    console.error(`[socket-poll] scorecard error for ${matchId}:`, err.message);
  }
}

module.exports = function (io) {
  setInterval(() => {
    activeMatches.forEach((count, key) => {
      if (count <= 0) return;
      const [matchId, sport] = key.split('::');
      pollAndBroadcast(io, matchId, sport);
    });
  }, 1000);

  io.on('connection', (socket) => {
    socket.on('subscribe-match', ({ matchId, sport }) => {
      if (!matchId) return;
      const key = buildKey(matchId, sport);
      socket.join(`match-${matchId}`);
      socket.data.subscribedKey = key;
      activeMatches.set(key, (activeMatches.get(key) || 0) + 1);
      pollAndBroadcast(io, matchId, sport);
    });

    socket.on('unsubscribe-match', ({ matchId, sport }) => {
      if (!matchId) return;
      const key = buildKey(matchId, sport);
      socket.leave(`match-${matchId}`);
      cleanup(key);
    });

    socket.on('disconnect', () => {
      const key = socket.data.subscribedKey;
      if (key) cleanup(key);
    });

    function cleanup(key) {
      const current = activeMatches.get(key) || 0;
      if (current <= 1) {
        activeMatches.delete(key);
      } else {
        activeMatches.set(key, current - 1);
      }
    }
  });
};