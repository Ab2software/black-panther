import api from "../utils/api";

const FALLBACK_FIXTURES = [
  {
    marketId: "1.238491823",
    eventId: "3318921",
    sport: "cricket",
    matchName: "India vs Australia",
    competition: "ICC Champions Trophy 2026",
    status: "LIVE IN-PLAY",
    inPlay: true,
    scores: "IND 242/4 (41.2 ov) • RR: 5.85",
    runners: [
      { selectionId: 101, teamName: "India", back: [{ price: 1.62, size: 45000 }], lay: [{ price: 1.64, size: 38000 }] },
      { selectionId: 102, teamName: "Australia", back: [{ price: 2.58, size: 28000 }], lay: [{ price: 2.62, size: 24000 }] },
    ],
  },
  {
    marketId: "1.238491824",
    eventId: "3318922",
    sport: "cricket",
    matchName: "England vs South Africa",
    competition: "T20 International Series",
    status: "LIVE IN-PLAY",
    inPlay: true,
    scores: "ENG 178/6 (19.0 ov) • Target: 184",
    runners: [
      { selectionId: 103, teamName: "England", back: [{ price: 1.85, size: 22000 }], lay: [{ price: 1.88, size: 19000 }] },
      { selectionId: 104, teamName: "South Africa", back: [{ price: 2.12, size: 31000 }], lay: [{ price: 2.16, size: 27000 }] },
    ],
  },
  {
    marketId: "1.238491825",
    eventId: "3318923",
    sport: "cricket",
    matchName: "Chennai Super Kings vs Mumbai Indians",
    competition: "Indian Premier League 2026",
    status: "TODAY 19:30 IST",
    inPlay: false,
    scores: "Starts in 2h 15m",
    runners: [
      { selectionId: 105, teamName: "Chennai Super Kings", back: [{ price: 1.91, size: 85000 }], lay: [{ price: 1.93, size: 72000 }] },
      { selectionId: 106, teamName: "Mumbai Indians", back: [{ price: 1.95, size: 82000 }], lay: [{ price: 1.98, size: 69000 }] },
    ],
  },
  {
    marketId: "1.238491826",
    eventId: "3318924",
    sport: "football",
    matchName: "Real Madrid vs Barcelona",
    competition: "La Liga Santander",
    status: "LIVE 68'",
    inPlay: true,
    scores: "2 - 1 • 2nd Half",
    runners: [
      { selectionId: 107, teamName: "Real Madrid", back: [{ price: 1.44, size: 120000 }], lay: [{ price: 1.46, size: 95000 }] },
      { selectionId: 108, teamName: "The Draw", back: [{ price: 4.80, size: 32000 }], lay: [{ price: 5.10, size: 28000 }] },
      { selectionId: 109, teamName: "Barcelona", back: [{ price: 7.20, size: 45000 }], lay: [{ price: 7.60, size: 39000 }] },
    ],
  },
  {
    marketId: "1.238491827",
    eventId: "3318925",
    sport: "football",
    matchName: "Manchester City vs Arsenal",
    competition: "Premier League",
    status: "TODAY 21:00 IST",
    inPlay: false,
    scores: "Upcoming",
    runners: [
      { selectionId: 110, teamName: "Manchester City", back: [{ price: 1.75, size: 92000 }], lay: [{ price: 1.78, size: 78000 }] },
      { selectionId: 111, teamName: "The Draw", back: [{ price: 3.90, size: 29000 }], lay: [{ price: 4.10, size: 24000 }] },
      { selectionId: 112, teamName: "Arsenal", back: [{ price: 4.50, size: 37000 }], lay: [{ price: 4.70, size: 31000 }] },
    ],
  },
  {
    marketId: "1.238491828",
    eventId: "3318926",
    sport: "tennis",
    matchName: "Carlos Alcaraz vs Jannik Sinner",
    competition: "ATP Masters Final",
    status: "LIVE Set 3",
    inPlay: true,
    scores: "6-4, 4-6, 3-2",
    runners: [
      { selectionId: 113, teamName: "Carlos Alcaraz", back: [{ price: 1.91, size: 41000 }], lay: [{ price: 1.94, size: 38000 }] },
      { selectionId: 114, teamName: "Jannik Sinner", back: [{ price: 1.96, size: 39000 }], lay: [{ price: 2.00, size: 35000 }] },
    ],
  },
];

// ✅ Get sports matches
export const getSports = async (sport) => {
  try {
    const response = await api.get(`/sports/matches?sport=${sport}`);
    return response.data;
  } catch (error) {
    console.error("Sports API Error:", error.response?.data || error.message);
    return { data: FALLBACK_FIXTURES.filter((f) => f.sport === sport) };
  }
};

export const fetchLiveMatches = async (sport = "cricket") => {
  try {
    const res = await api.get(`/sports/matches?sport=${sport}`);
    const list = res.data?.data || res.data?.matches;
    if (Array.isArray(list) && list.length > 0) {
      return list;
    }
  } catch (err) {}
  return FALLBACK_FIXTURES;
};

// ✅ Get match details (live odds)
export const getMatchDetails = async (matchId, sport = "cricket") => {
  try {
    const response = await api.get(`/sports/match/details?matchId=${matchId}&sport=${sport}`);
    return response.data;
  } catch (error) {
    console.error("Match Details Error:", error.response?.data || error.message);
    throw error;
  }
};

export const fetchTracker = async (eventId, eventTypeId) => {
  try {
    const response = await api.get("/sports/match/tracker", {
      params: { event_id: eventId, event_type_id: eventTypeId },
    });
    return response.data;
  } catch (error) {
    console.error("Fetch Tracker Error:", error.response?.data || error.message);
    throw error;
  }
};

// ✅ Place a bet
export const placeBet = async (betData) => {
  try {
    const response = await api.post("/sports/bet/place", betData);
    return response.data;
  } catch (error) {
    console.error("Place Bet Error:", error.response?.data || error.message);
    throw error;
  }
};

// ✅ Get open (pending) bets for logged-in user
export const getOpenBets = async () => {
  try {
    const response = await api.get("/sports/bet/open-bets");
    return response.data;
  } catch (error) {
    console.error("Open Bets Error:", error.response?.data || error.message);
    return [];
  }
};

// Fetch user open and settled bets - ALWAYS returns an Array!
export const fetchUserBets = async () => {
  try {
    const res = await api.get("/sports/bet/my-bets");
    if (Array.isArray(res.data?.data)) return res.data.data;
    if (Array.isArray(res.data?.bets)) return res.data.bets;
    if (Array.isArray(res.data)) return res.data;
  } catch (err) {}

  try {
    const saved = localStorage.getItem("player_local_bets");
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {}

  return [];
};

export const getMyBets = async (params = {}) => {
  try {
    const query = new URLSearchParams(params).toString();
    const response = await api.get(`/sports/bet/my-bets${query ? `?${query}` : ""}`);
    return response.data;
  } catch (error) {
    console.error("My Bets Error:", error.response?.data || error.message);
    return { bets: [] };
  }
};

export const recordLocalBet = (bet) => {
  try {
    const existing = JSON.parse(localStorage.getItem("player_local_bets") || "[]");
    const updated = [bet, ...existing];
    localStorage.setItem("player_local_bets", JSON.stringify(updated.slice(0, 50)));
    return updated;
  } catch (e) {
    return [];
  }
};

export const fetchScorecard = async (sport, eventId) => {
  try {
    const response = await api.get("/sports/match/scorecard", {
      params: { sport, event_id: eventId },
      responseType: "text",
    });
    return response.data;
  } catch (error) {
    console.error("Fetch Scorecard Error:", error);
    throw error;
  }
};

export const fetchStream = async (eventId, eventTypeId) => {
  try {
    const response = await api.get("/sports/match/stream", {
      params: { event_id: eventId, event_type_id: eventTypeId },
    });
    return response.data;
  } catch (error) {
    console.error("Fetch Stream Error:", error.response?.data || error.message);
    throw error;
  }
};
