// scripts/inspectPendingCasino.js
//
// Lists all PENDING GameTransaction records for one user, so you can see
// how old they are and whether they look like genuinely abandoned rounds
// or a sign the settlement callback isn't matching them correctly.
//
// Usage: node scripts/inspectPendingCasino.js

const path = require("path");
require("dotenv").config({
  path: path.resolve(__dirname, "../.env"),
});
const mongoose = require("mongoose");
const User = require("../model/User");
const GameTransaction = require("../model/GameTransaction");

const TARGET_USERNAME = "eagled";

(async () => {
  await mongoose.connect(process.env.MONGO_URL);
  console.log("✅ Connected to MongoDB");

  const user = await User.findOne({ username: TARGET_USERNAME }).lean();
  if (!user) {
    console.log(`❌ No user found with username "${TARGET_USERNAME}"`);
    process.exit(0);
  }

  const pending = await GameTransaction.find({
    userId: user._id,
    result: "PENDING",
  })
    .sort({ createdAt: 1 })
    .lean();

  console.log(`\nUser: ${user.username} (${user._id})`);
  console.log(`Pending GameTransaction count: ${pending.length}`);
  console.log(`Sum of betAmount: ${pending.reduce((s, t) => s + (Number(t.betAmount) || 0), 0)}\n`);

  const now = Date.now();
  pending.forEach((t) => {
    const ageMinutes = ((now - new Date(t.createdAt).getTime()) / 60000).toFixed(1);
    console.log(
      `  id=${t._id}  gameUid=${t.gameUid}  gameRound=${t.gameRound}  ` +
        `serialNumber=${t.serialNumber}  betAmount=${t.betAmount}  ` +
        `createdAt=${t.createdAt.toISOString()}  age=${ageMinutes}min`
    );
  });

  console.log(
    "\nIf these are all from long ago (hours/days) with no matching WIN/LOSS " +
      "record, they're almost certainly abandoned rounds — the bet-event " +
      "callback fired but the result-event callback for the same " +
      "gameRound/serialNumber never arrived or never matched."
  );

  await mongoose.disconnect();
  process.exit(0);
})();