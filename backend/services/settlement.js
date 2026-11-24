const axios = require("axios");
const Bet = require("../model/bet");
const { settleSingleBet } = require("./settlementCore");

const BASE_URL = process.env.SETTLEMENT_BASE_URL;
const SETTLEMENT_ID = process.env.SETTLEMENT_ID;

// Grace period before a locally-Pending bet absent from the vendor's feed
// is treated as genuinely not-found on their side. Without this, a bet
// placed 2 seconds ago (not yet indexed by the vendor) would get wrongly
// marked Invalid by a poll that fires before their system catches up.
const NOT_FOUND_GRACE_MS = 2 * 60 * 1000; // 5 minutes

const fetchSettlementData = async (eventTypeId) => {
  const url = `${BASE_URL}?settlementId=${SETTLEMENT_ID}&eventTypeId=${eventTypeId}`;
  const res = await axios.get(url, { timeout: 30000 });
  if (!res.data?.success) return [];
  const data = res.data?.data;
  return Array.isArray(data) ? data : [];
};

const processSettlement = async (eventTypeId) => {
  const data = await fetchSettlementData(eventTypeId);

  let processed = 0;
  let skipped = 0;
  let notFound = 0;

  const vendorBetIds = new Set();

  for (const item of data) {
    vendorBetIds.add(String(item.bet_id));

    if (item.status === "Pending") { skipped++; continue; }

    const bet = await Bet.findOne({ betId: item.bet_id });
    if (!bet || bet.status !== "Pending") { skipped++; continue; }

    try {
      await settleSingleBet(bet, item.status, { price: item.price });
      processed++;
    } catch (err) {
      console.error(`Auto-settlement failed for bet ${bet._id}:`, err.message);
      skipped++;
    }
  }

  // ── Reconcile local bets the vendor's feed never mentioned at all ──
  try {
    const cutoff = new Date(Date.now() - NOT_FOUND_GRACE_MS);
    const staleBets = await Bet.find({
      eventTypeId: String(eventTypeId),
      status: "Pending",
      createdAt: { $lte: cutoff },
    });

    for (const bet of staleBets) {
      if (vendorBetIds.has(String(bet.betId))) continue; // vendor has it, just still pending

      try {
        await settleSingleBet(bet, "Invalid", { price: bet.price });
        notFound++;
        console.warn(`Bet ${bet.betId} not found on vendor after ${NOT_FOUND_GRACE_MS / 60000}min — marked Invalid, exposure released.`);
      } catch (err) {
        console.error(`Not-found reconciliation failed for bet ${bet._id}:`, err.message);
      }
    }
  } catch (err) {
    console.error(`Not-found reconciliation query failed for eventType ${eventTypeId}:`, err.message);
  }

  return { success: true, processed, skipped, notFound, total: data.length };
};

module.exports = { processSettlement };