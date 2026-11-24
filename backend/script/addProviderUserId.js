// scripts/addProviderUserId.js
const mongoose = require("mongoose");
const User = require("../model/User");
require("dotenv").config();

async function run() {
    console.log("Connecting to MongoDB...");
    console.log("MONGO_URL:", process.env.MONGO_URL);
    await mongoose.connect(process.env.MONGO_URL);
    console.log("Connected to MongoDB");

  const users = await User.find({ providerUserId: { $exists: false } });

  for (const user of users) {
    user.providerUserId = parseInt(
      Date.now().toString().slice(-7) + Math.floor(Math.random() * 100),
    );
    await user.save();
    await new Promise((r) => setTimeout(r, 5)); // small delay to avoid timestamp collisions
  }

  console.log(`Updated ${users.length} users`);
  mongoose.disconnect();
}

run();
