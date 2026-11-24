// scripts/checkAdminSiteId.js
const mongoose = require("mongoose");
const User = require("../model/User");
require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });

(async () => {
  await mongoose.connect(process.env.MONGO_URL);
  const admin = await User.findById("6a4cfd39255a5ced89b50576")
    .select("_id username role siteId")
    .lean();
  console.log(JSON.stringify(admin, null, 2));

  const missingAdmins = await User.find({
    role: { $in: ["owner", "admin", "subadmin", "superadmin", "master", "agent"] },
    siteId: { $exists: false },
  }).select("_id username role").lean();
  console.log(`\nAdmin-side accounts missing siteId: ${missingAdmins.length}`);
  console.log(JSON.stringify(missingAdmins, null, 2));

  await mongoose.disconnect();
})();