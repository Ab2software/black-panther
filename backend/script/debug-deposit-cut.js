// debug-deposit-cut.js
// Run: node debug-deposit-cut.js <ADMIN_ID> <USER_ID>
// Watches admin wallet.balance, submits a test deposit request as the given user,
// then checks admin wallet.balance again — with zero other logic in between.

const mongoose = require("mongoose");
const usermodel = require("../model/User");
const PaymentRequest = require("../model/PaymentRequest");
const path = require("path");

require("dotenv").config({
  path: path.resolve(__dirname, "../.env"),
});
const MONGO_URI = process.env.MONGO_URL;

async function run() {
  const [adminId, userId] = process.argv.slice(2);

  if (!adminId || !userId) {
    console.log("Usage: node debug-deposit-cut.js <ADMIN_ID> <USER_ID>");
    process.exit(1);
  }

  await mongoose.connect(MONGO_URI);
  console.log("Connected to DB\n");

  const before = await usermodel.findById(adminId).select("wallet username");
  console.log("── ADMIN WALLET BEFORE ──");
  console.log(JSON.stringify(before.wallet, null, 2));

  console.log("\nSubmitting a test deposit request as user:", userId);

  const testTxnId = "DEBUG-" + Date.now();

  const newPayment = new PaymentRequest({
    userId,
    price: 1, // small test amount
    transactionId: testTxnId,
    paymentScreenshot: "/uploads/debug-test.png",
  });

  await newPayment.save();
  console.log("Deposit request created:", newPayment._id, "status:", newPayment.status);

  const after = await usermodel.findById(adminId).select("wallet username");
  console.log("\n── ADMIN WALLET AFTER ──");
  console.log(JSON.stringify(after.wallet, null, 2));

  console.log("\n── RESULT ──");
  if (before.wallet.balance === after.wallet.balance) {
    console.log("✅ Admin wallet.balance UNCHANGED — deduction is NOT happening in the DB on request creation.");
    console.log("   → The 'instant cut' you're seeing is almost certainly a frontend display issue.");
  } else {
    console.log("🚨 Admin wallet.balance CHANGED just from creating a PaymentRequest!");
    console.log(`   Before: ${before.wallet.balance} → After: ${after.wallet.balance}`);
    console.log("   → There IS a hidden write path we haven't found yet.");
  }

  // cleanup test doc so it doesn't clutter your pending requests
  await PaymentRequest.deleteOne({ _id: newPayment._id });
  console.log("\n(test deposit request cleaned up)");

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});