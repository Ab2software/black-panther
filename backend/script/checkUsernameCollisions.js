// scripts/checkUsernameCollisions.js
const mongoose = require("mongoose");
const User = require("../model/User");
require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });

(async () => {
  await mongoose.connect(process.env.MONGO_URL);
  const matches = await User.find({ username: "test22" }).select(
    "_id username role siteId wallet.balance createdAt parentId assignedAdmin",
  ).lean();
  console.log(JSON.stringify(matches, null, 2));
  await mongoose.disconnect();
})();