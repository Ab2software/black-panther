// scripts/voidStuckCasinoBets.js
//
// Voids specific stuck PENDING GameTransaction records and refunds the
// stake back to wallet.balance. Deliberately does NOT touch
// wallet.exposure/casinoExposure — that field is already known to be
// unreliable for this user (see migrateSingleUserWallet.js dry-run output),
// and will be correctly recomputed from scratch by the migration script
// AFTER these are voided (at that point there will be 0 pending casino
// transactions for this user, so casinoExposure will correctly compute to 0).
//
// Usage:
//   node scripts/voidStuckCasinoBets.js            (dry run — logs only)
//   node scripts/voidStuckCasinoBets.js --apply     (writes the change)

const path = require("path");
require("dotenv").config({
  path: path.resolve(__dirname, "../.env"),
});
const mongoose = require("mongoose");
const User = require("../model/User");
const GameTransaction = require("../model/GameTransaction");

const APPLY = process.argv.includes("--apply");

// The exact 4 stuck transaction IDs identified via inspectPendingCasino.js
const TARGET_TRANSACTION_IDS = [
  "6a547c033cf2929a3131e9eb",
  "6a547c083cf2929a3131e9ec",
  "6a547c403cf2929a3131e9ed",
  "6a547c903cf2929a3131e9f0",
];

const RESOLUTION_NOTE =
  "Manually voided — stuck PENDING since 2026-07-13, no settlement callback " +
  "ever received (likely server-side incident). Stake refunded to balance.";

const connect = async () => {
  await mongoose.connect(process.env.MONGO_URL);
  console.log("✅ Connected to MongoDB");
};

const voidAndRefund = async () => {
  const txns = await GameTransaction.find({
    _id: { $in: TARGET_TRANSACTION_IDS },
    result: "PENDING", // safety: only touch ones still actually pending
  });

  if (!txns.length) {
    console.log("❌ No matching PENDING transactions found. Nothing to do.");
    return;
  }

  console.log(`Found ${txns.length} matching PENDING transaction(s):\n`);

  for (const txn of txns) {
    console.log(
      `  id=${txn._id}  userId=${txn.userId}  betAmount=${txn.betAmount}  ` +
        `gameRound=${txn.gameRound}  serialNumber=${txn.serialNumber}`
    );
  }

  const totalRefund = txns.reduce((sum, t) => sum + (Number(t.betAmount) || 0), 0);
  console.log(`\nTotal to refund: ₹${totalRefund}`);

  if (!APPLY) {
    console.log("\nThis was a DRY RUN. Re-run with --apply to write changes.");
    return;
  }

  for (const txn of txns) {
    // 1. Refund the stake to balance — atomic $inc, safe under concurrency.
    const updatedUser = await User.findByIdAndUpdate(
      txn.userId,
      { $inc: { "wallet.balance": txn.betAmount } },
      { new: true }
    );

    if (!updatedUser) {
      console.error(`  ⚠️  User ${txn.userId} not found — skipped refund for txn ${txn._id}`);
      continue;
    }

    // 2. Mark the transaction VOID with an audit note.
    txn.result = "VOID";
    txn.resolutionNote = RESOLUTION_NOTE;
    txn.balanceAfter = updatedUser.wallet.balance;
    await txn.save();

    console.log(
      `  ✅ Voided txn ${txn._id} — refunded ₹${txn.betAmount} — new balance: ₹${updatedUser.wallet.balance}`
    );
  }

  console.log(`\n✅ Done. Refunded ₹${totalRefund} total across ${txns.length} transaction(s).`);
  console.log(
    "\nNext step: run migrateSingleUserWallet.js (dry run, then --apply) — " +
      "casinoExposure should now correctly compute to 0 for this user."
  );
};

(async () => {
  try {
    await connect();
    await voidAndRefund();
  } catch (err) {
    console.error("❌ Script failed:", err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
})();