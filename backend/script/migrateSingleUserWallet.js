// scripts/migrateSingleUserWallet.js
//
// Same logic as migrateWalletExposure.js, but scoped to ONE user by
// username. Use this to test the migration safely before running it
// against the whole collection.
//
// Usage:
//   node scripts/migrateSingleUserWallet.js            (dry run — logs only)
//   node scripts/migrateSingleUserWallet.js --apply     (writes the change)
const path = require("path");
require("dotenv").config({
  path: path.resolve(__dirname, "../.env"),
});
const mongoose = require("mongoose");
const User = require("../model/User");
const GameTransaction = require("../model/GameTransaction");
const { recalculateExposure } = require("../services/exposureService");

const APPLY = process.argv.includes("--apply");
const TARGET_USERNAME = "eagled";

const connect = async () => {
  await mongoose.connect(process.env.MONGO_URL);
  console.log("✅ Connected to MongoDB");
};

const migrateOne = async () => {
  const user = await User.findOne({ username: TARGET_USERNAME }).lean();

  if (!user) {
    console.log(`❌ No user found with username "${TARGET_USERNAME}"`);
    return;
  }

  const wallet = user.wallet || {};
  const oldExposure = wallet.exposure;
  const oldAvailableBalance = wallet.availableBalance;
  const balance = Number(wallet.balance) || 0;

  console.log(`\nFound user: ${user.username} (${user._id})`);
  console.log("Current wallet:", wallet);

  // ── TRUE sports exposure from actual pending Bet records ──
  let sportsExposure = 0;
  try {
    sportsExposure = await recalculateExposure(user._id, null, false);
  } catch (err) {
    console.error("  ⚠️  recalculateExposure failed:", err.message);
  }

  // ── TRUE casino exposure from actual pending GameTransactions ──
  const pendingCasinoTxns = await GameTransaction.find({
    userId: user._id,
    result: "PENDING",
  }).lean();
  const casinoExposure = pendingCasinoTxns.reduce(
    (sum, txn) => sum + (Number(txn.betAmount) || 0),
    0
  );

  const computedTotal = sportsExposure + casinoExposure;
  const discrepancy = Math.abs((oldExposure || 0) - computedTotal);
  const availableBalance = Math.max(0, balance - casinoExposure - sportsExposure);

  console.log("\n── Computed values ──");
  console.log("  old wallet.exposure         :", oldExposure ?? "n/a");
  console.log("  old wallet.availableBalance  :", oldAvailableBalance ?? "n/a");
  console.log("  computed sportsExposure      :", sportsExposure);
  console.log("  computed casinoExposure      :", casinoExposure);
  console.log("  computed total exposure      :", computedTotal);
  console.log("  discrepancy vs old exposure   :", discrepancy);
  console.log("  new availableBalance (derived):", availableBalance);

  if (discrepancy > 0.01) {
    console.log(
      "\n⚠️  Old combined exposure doesn't match recomputed exposure — review before applying."
    );
  } else {
    console.log("\n✅ Old exposure matches recomputed exposure — safe to apply.");
  }

  if (APPLY) {
    await User.updateOne(
      { _id: user._id },
      {
        $set: {
          "wallet.casinoExposure": casinoExposure,
          "wallet.sportsExposure": sportsExposure,
        },
        $unset: {
          "wallet.exposure": "",
          "wallet.availableBalance": "",
        },
      }
    );
    console.log(`\n✅ Applied migration to "${TARGET_USERNAME}".`);

    const after = await User.findOne({ username: TARGET_USERNAME }).lean();
    console.log("Wallet after migration:", after.wallet);
  } else {
    console.log("\nThis was a DRY RUN. Re-run with --apply to write the change.");
  }
};

(async () => {
  try {
    await connect();
    await migrateOne();
  } catch (err) {
    console.error("❌ Migration failed:", err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
})();