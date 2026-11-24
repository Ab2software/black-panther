// scripts/checkOneUser.js
// Usage: node scripts/checkOneUser.js Deeraj71
const mongoose = require("mongoose");
const User = require("../model/User");
require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });


(async () => {
  await mongoose.connect(process.env.MONGO_URL);
  const user = await User.findOne({ username: process.argv[2] })
    .select("_id username siteId role createdAt assignedAdmin parentId")
    .lean();
  console.log(JSON.stringify(user, null, 2));
  await mongoose.disconnect();
})();