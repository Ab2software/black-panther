// scripts/backfillAdminSiteId.js
const mongoose = require("mongoose");
const User = require("../model/User");
require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });

(async () => {
  await mongoose.connect(process.env.MONGO_URL);

  const result = await User.updateMany(
    {
      role: { $in: ["owner", "admin", "subadmin", "superadmin", "master", "agent"] },
      siteId: { $exists: false },
    },
    { $set: { siteId: "eagleexchang" } },
  );

  console.log(`Matched: ${result.matchedCount}, Modified: ${result.modifiedCount}`);

  await mongoose.disconnect();
})();