// scripts/checkChipTx.js
const mongoose = require("mongoose");
const ChipTransaction = require("../model/Chiptransaction");
require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });

(async () => {
  await mongoose.connect(process.env.MONGO_URL);
  const txs = await ChipTransaction.find({
    $or: [
      { toUserId: "6aaa62dcb2bd61f4996dcec7" },
      { fromUserId: "6aaa62dcb2bd61f4996dcec7" },
    ],
  }).lean();
  console.log(JSON.stringify(txs, null, 2));
  await mongoose.disconnect();
})();