const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config();

const GameTransaction = require("../model/GameTransaction");

async function run() {
  await mongoose.connect(process.env.MONGO_URL);
  const result = await GameTransaction.deleteMany({});
  console.log(`Deleted ${result.deletedCount} transactions`);
  mongoose.disconnect();
}

run();