        // script/fixIndexes.js
const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

async function run() {
  await mongoose.connect(process.env.MONGO_URL);
  
  const db = mongoose.connection.db;
  const collection = db.collection("gametransactions");
  
  try {
    await collection.dropIndex("gameRound_1");
    console.log("Dropped gameRound index");
  } catch (err) {
    console.log("Index not found or already dropped:", err.message);
  }

  await collection.deleteMany({});
  console.log("Cleared all transactions");

  mongoose.disconnect();
}

run();