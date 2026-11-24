// scripts/reconcileClientLedger.js
// Usage: node scripts/reconcileClientLedger.js <userId>

const mongoose = require("mongoose");
const User = require("../model/User");
const Bet = require("../model/bet");
const GameTransaction = require("../model/GameTransaction");
const ChipTransaction = require("../model/Chiptransaction");
const PaymentRequest = require("../model/PaymentRequest");
const WithdrawRequest = require("../model/WithdrawRequest");
require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
async function reconcile(userId) {
  await mongoose.connect(process.env.MONGO_URL);

  const user = await User.findById(userId).lean();
  console.log(`\nUser: ${user.username}`);
  console.log(`Real wallet.balance: ${user.wallet.balance}`);

  // ── Everything the statement WOULD count ──────────────────────────────
  const settledBets = await Bet.find({ userId, status: { $ne: "Pending" } }).lean();
  const betsSum = settledBets.reduce((s, b) => s + (b.profitLoss || 0), 0);

  const rounds = await GameTransaction.find({ userId }).lean();
  const roundsSum = rounds.reduce(
    (s, g) => s + ((g.winAmount || 0) - (g.betAmount || 0)),
    0,
  );

  const chipsOut = await ChipTransaction.find({ fromUserId: userId }).lean();
  const chipsIn = await ChipTransaction.find({ toUserId: userId }).lean();
  const chipSum =
    chipsOut.reduce((s, c) => s + (c.type === "give" ? -c.amount : c.amount), 0) +
    chipsIn.reduce((s, c) => s + (c.type === "give" ? c.amount : -c.amount), 0);

  const deposits = await PaymentRequest.find({
    userId, status: "approved", source: "user_deposit",
  }).lean();
  const depositSum = deposits.reduce((s, d) => s + (d.price || 0), 0);

  const withdrawals = await WithdrawRequest.find({
    userId, status: "approved", withdrawMethod: { $ne: "admin_chip_transfer" },
  }).lean();
  const withdrawSum = withdrawals.reduce((s, w) => s + (w.amount || 0), 0);

  const statementTotal =
    betsSum + roundsSum + chipSum + depositSum - withdrawSum;

  console.log(`Statement-derived total: ${statementTotal}`);
  console.log(`Gap (wallet - statement): ${user.wallet.balance - statementTotal}`);

  // ── Everything that TOUCHES this user but the statement filters OUT ───
  console.log(`\n--- PaymentRequest rows NOT counted (status != approved OR source != user_deposit) ---`);
  const allPayments = await PaymentRequest.find({ userId }).lean();
  allPayments
    .filter((d) => d.status !== "approved" || d.source !== "user_deposit")
    .forEach((d) =>
      console.log(`  ${d._id}  price=${d.price}  status=${d.status}  source=${d.source}  method=${d.method}  created=${d.createdAt}`),
    );

  console.log(`\n--- WithdrawRequest rows NOT counted (status != approved OR method == admin_chip_transfer) ---`);
  const allWithdrawals = await WithdrawRequest.find({ userId }).lean();
  allWithdrawals
    .filter((w) => w.status !== "approved" || w.withdrawMethod === "admin_chip_transfer")
    .forEach((w) =>
      console.log(`  ${w._id}  amount=${w.amount}  status=${w.status}  method=${w.withdrawMethod}  created=${w.createdAt}`),
    );

  console.log(`\n--- GameTransaction rows with an unexpected 'result' value (not WIN/LOSS) ---`);
  rounds
    .filter((g) => g.result !== "WIN" && g.result !== "LOSS")
    .forEach((g) =>
      console.log(`  ${g._id}  gameRound=${g.gameRound}  result=${g.result}  bet=${g.betAmount}  win=${g.winAmount}  created=${g.createdAt}`),
    );

  console.log(`\n--- Bet rows still Pending (not counted, but may already be reflected in wallet.exposure) ---`);
  const pendingBets = await Bet.find({ userId, status: "Pending" }).lean();
  console.log(`  count: ${pendingBets.length}, total stake: ${pendingBets.reduce((s, b) => s + (b.stake || 0), 0)}`);

  await mongoose.disconnect();
}

reconcile(process.argv[2]).catch((err) => {
  console.error(err);
  process.exit(1);
});