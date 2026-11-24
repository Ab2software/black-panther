require("dotenv").config({
  path: require("path").resolve(__dirname, "../.env"),
});
const mongoose = require("mongoose");

const User = require("../model/User"); // adjust path

const MONGO_URI = process.env.MONGO_URL;

async function seedOwner() {
  try {
    await mongoose.connect(MONGO_URI);

    console.log("✅ MongoDB Connected");

    // Check if owner already exists
    let existingOwner = await User.findOne({ username: "yodha365" });

    if (existingOwner) {
      console.log("⚠️ Owner yodha365 already exists, updating password and permissions...");
      existingOwner.password = "Yodha@2026@#";
      existingOwner.role = "owner";
      existingOwner.status = "active";
      existingOwner.adminStatus = "active";
      existingOwner.permissions = {
        ...existingOwner.permissions,
        canLogin: true,
      };
      await existingOwner.save();
      console.log("✅ Owner yodha365 updated successfully");
      process.exit(0);
    }

    const owner = new User({
      username: "yodha365",
      password: "Yodha@2026@#", // will be hashed automatically

      fullName: "Platform Owner",
      email: "yodha365@example.com",
      phone: "9999999999",

      role: "owner",

      status: "active",
      adminStatus: "active",
      isVerified: true,

      wallet: {
        balance: 10000000,
        exposure: 0,
        totalLiability: 0,
        availableBalance: 10000000,
        bonusBalance: 0,
        totalProfit: 0,
        totalLoss: 0,
      },

      creditReference: 10000000,

      permissions: {
        canLogin: true,
        canBet: false,
        canWithdraw: true,
        canDeposit: true,
        canCreateUser: true,
        isBetLocked: false,
        isAccountLocked: false,
      },

      bettingLimits: {
        minBet: 100,
        maxBet: 100000,
        maxExposure: 500000,
        maxProfit: 500000,
        minOdds: 1.01,
        maxOdds: 100,
        exposureCuttingPercent: 100,
      },

      commission: 0,
      partnership: 100,

      downlineCount: 0,
      directUserCount: 0,
      directAgentCount: 0,
    });

    await owner.save();

    console.log("🎉 Owner created successfully");
    console.log("Username:", owner.username);
    console.log("Password:", owner.password);

    process.exit(0);
  } catch (error) {
    console.error("❌ Seed Error:", error);
    process.exit(1);
  }
}

seedOwner();