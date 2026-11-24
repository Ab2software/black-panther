require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../model/User");

const MONGO_URL = process.env.MONGO_URL;

async function run() {
  await mongoose.connect(MONGO_URL);

  const users = await User.find({
    $or: [
      { providerUserId: { $exists: false } },
      { providerUserId: null },
    ],
  });

  console.log("Users to fix:", users.length);

  for (const user of users) {
    user.providerUserId = Number(
      Date.now().toString().slice(-7) +
      Math.floor(Math.random() * 100)
    );

    await user.save();
    console.log("Fixed:", user.username, user.providerUserId);
  }

  console.log("DONE");
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});