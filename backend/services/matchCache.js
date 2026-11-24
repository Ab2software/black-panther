  const cache = new Map(); // key: `${matchId}:${sport}` → { data, timestamp }
  const TTL_MS = 800; // slightly longer than your 1s poll interval, to tolerate jitter

  const setCachedMatch = (matchId, sport, data) => {
    cache.set(`${matchId}:${sport}`, { data, timestamp: Date.now() });
  };

  const getCachedMatch = (matchId, sport) => {
    const entry = cache.get(`${matchId}:${sport}`);
    if (!entry) return null;
    if (Date.now() - entry.timestamp > TTL_MS) return null;
    return entry.data;
  };

  module.exports = { setCachedMatch, getCachedMatch };