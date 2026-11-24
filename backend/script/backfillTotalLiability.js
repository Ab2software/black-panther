// scripts/backfillTotalLiability.js
//
// One-time migration: for every user with open ("Pending") bets placed
// BEFORE exposure cutting was introduced, recompute their real liability
// from those bets and set wallet.totalLiability accordingly.
//
// Safe to run multiple times (idempotent) — it always recalculates from
// scratch rather than incrementing.

require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
const mongoose = require("mongoose");
const User = require("../model/User");
const Bet = require("../model/bet");

const MONGO_URI = process.env.MONGO_URL;

const calcLiabilityForBet = (bet) => {
  // If this bet already has liability stored (placed after the migration
  // point / after this deploy), trust it.
  if (bet.liability !== undefined && bet.liability !== null && bet.liability > 0) {
    return bet.liability;
  }

  const stake = Number(bet.stake) || 0;
  const isFancy = ["fancy", "premium fancy"].includes(
    (bet.selectionName || "").toLowerCase()
  );

  if (isFancy) {
    return stake;
  }

  if (bet.side === "back") {
    return stake;
  }

  // lay
  const price = Number(bet.price) || 0;
  return Math.max(0, (price - 1) * stake);
};

const run = async () => {
  await mongoose.connect(MONGO_URI);
  console.log("Connected to MongoDB");

  const users = await User.find({});
  console.log(`Found ${users.length} users`);

  let updated = 0;
  let skipped = 0;

  for (const user of users) {
    const openBets = await Bet.find({ userId: user._id, status: "Pending" });

    if (openBets.length === 0) {
      // No open bets — totalLiability should be 0
      if ((user.wallet.totalLiability || 0) !== 0) {
        user.wallet.totalLiability = 0;
        await user.save();
        updated++;
      } else {
        skipped++;
      }
      continue;
    }

    const totalLiability = openBets.reduce(
      (sum, bet) => sum + calcLiabilityForBet(bet),
      0
    );

    const before = user.wallet.totalLiability || 0;
    user.wallet.totalLiability = totalLiability;
    await user.save();

    console.log(
      `User ${user.username} (${user._id}): totalLiability ${before} → ${totalLiability} (${openBets.length} open bets)`
    );
    updated++;
  }

  console.log(`\nDone. Updated: ${updated}, Skipped (no change): ${skipped}`);
  await mongoose.disconnect();
};

run().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});