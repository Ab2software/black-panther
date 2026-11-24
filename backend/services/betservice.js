const axios = require("axios");
const Bet = require("../model/bet");

const SPORT_EVENT_TYPE = {
  cricket: "4",
  football: "1",
  tennis: "2",
  basketball: "3",
  volleyball: "5",
  handball: "6",
  "ice hockey": "8",
  "table tennis": "9",
};

const PLACEBET_PROXY = "https://redtechapi.xyz/placebet.php";
const WEBSITE_URL = process.env.WEBSITE_URL || "https://black-panther-backend.onrender.com";

const generateBetId = () => {
  return String(Math.floor(10000000 + Math.random() * 90000000));
};

// ✅ NEW — pure external call, no DB, no transaction. Never throws;
// failures are captured in the returned object so the bet still gets
// saved as Pending, matching existing behavior.
const callSettlementProxy = async (betId, betData) => {
  const {
    matchName, marketId, eventId, sport, selectionName, sectionTeam,
    side, price, rate, fancyPrice, fancyRate, stake,
  } = betData;

  const sportKey = (sport || "cricket").toLowerCase();
  const eventTypeId = SPORT_EVENT_TYPE[sportKey] || "4";
  const isFancy = selectionName?.toLowerCase() === "fancy";

  const payload = new URLSearchParams();
  payload.append("eventTypeId", eventTypeId);
  payload.append("match_name", matchName);
  payload.append("market_id", marketId);
  payload.append("bet_id", betId);
  payload.append("selection_name", selectionName);
  payload.append("side", side);
  payload.append("stake", String(stake));
  payload.append("website", WEBSITE_URL);
  payload.append("event_id", eventId);
  payload.append("section_team", sectionTeam);

  if (isFancy) {
    payload.append("fancy_rate", fancyRate ?? 0);
    payload.append("fancy_price", fancyPrice ?? 0);
  } else {
    payload.append("rate", rate ?? 0);
    payload.append("price", price ?? 0);
    payload.append("fancy_rate", "0");
    payload.append("fancy_price", "0");
  }

  try {
    const { data } = await axios.post(PLACEBET_PROXY, payload, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      timeout: 15000,
    });
    return { settlementResponse: data, proxySuccess: data?.success === true };
  } catch (err) {
    console.error("========== SETTLEMENT PROXY ERROR ==========");
    console.error("MESSAGE:", err.message);
    if (err.response) {
      console.error("STATUS:", err.response.status);
      console.error("DATA:", err.response.data);
    }
    const settlementResponse = err.response?.data || { error: err.message };
    return { settlementResponse, proxySuccess: false };
  }
};

// ✅ NEW — pure DB write, called AFTER the proxy call, outside any
// wallet-reservation transaction.
const createBetRecord = async ({
  userId, siteId, betId, betData, settlementResponse,
}) => {
  const {
    matchName, marketId, eventId, sport, eventTypeId, selectionName,
    sectionTeam, side, price, rate, fancyPrice, fancyRate, stake,
    liability, exposureCutPercent, blockedExposure,
  } = betData;

  const sportKey = (sport || "cricket").toLowerCase();
  const isFancy = selectionName?.toLowerCase() === "fancy";

  return Bet.create({
    userId,
    siteId,
    betId,
    matchName,
    marketId,
    eventId,
    sport: sportKey,
    eventTypeId: eventTypeId || SPORT_EVENT_TYPE[sportKey] || "4",
    selectionName,
    sectionTeam,
    side,
    price: isFancy ? null : (price ?? null),
    rate: isFancy ? null : (rate ?? null),
    fancyPrice: isFancy ? (fancyPrice ?? null) : null,
    fancyRate: isFancy ? (fancyRate ?? null) : null,
    stake,
    website: WEBSITE_URL,
    status: "Pending",
    settlementResponse,
    liability: liability ?? 0,
    exposureCutPercent: exposureCutPercent ?? 100,
    blockedExposure: blockedExposure ?? 0,
  });
};

// Kept for any other caller still using the combined flow —
// now just composes the two new pieces in sequence.
const placeBetService = async ({ userId, siteId, betData }) => {
  const betId = generateBetId();
  const { settlementResponse, proxySuccess } = await callSettlementProxy(betId, betData);
  const bet = await createBetRecord({ userId, siteId, betId, betData, settlementResponse });
  return { success: true, proxySuccess, bet, settlementResponse };
};

const getUserBetsService = async ({ userId, status, page = 1, limit = 20 }) => {
  const filter = { userId };
  if (status) filter.status = status;
  const skip = (page - 1) * limit;
  const total = await Bet.countDocuments(filter);
  const bets = await Bet.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit);
  return { bets, total, page, limit };
};

const getOpenBetsService = async ({ userId }) => {
  return Bet.find({ userId, status: "Pending" }).sort({ createdAt: -1 });
};

module.exports = {
  placeBetService,
  callSettlementProxy,
  createBetRecord,
  getUserBetsService,
  getOpenBetsService,
};