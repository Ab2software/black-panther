require("dotenv").config({
  path: require("path").resolve(__dirname, "../.env"),
});
const mongoose = require("mongoose");
const User = require("../model/User");

const seedUser = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    console.log("MongoDB Connected");

    const testUserData = {
      username: "testuser",
      phone: "9876543210",
      password: "User@12345",
      role: "user",
      fullName: "Test Player",
      email: "testuser@example.com",
      siteId: "eagleexchang",
      status: "active",
      isVerified: true,
      wallet: {
        balance: 50000,
        exposure: 0,
        casinoExposure: 0,
        totalLiability: 0,
        availableBalance: 50000,
        bonusBalance: 0,
        totalProfit: 0,
        totalLoss: 0,
      },
      permissions: {
        canLogin: true,
        canBet: true,
        canWithdraw: true,
        canDeposit: true,
        canCreateUser: false,
        isBetLocked: false,
        isAccountLocked: false,
      },
      bettingLimits: {
        minBet: 100,
        maxBet: 200000,
        maxExposure: 500000,
        maxProfit: 500000,
        minOdds: 1.01,
        maxOdds: 100,
        exposureCuttingPercent: 100,
      },
    };

    let user = await User.findOne({ username: testUserData.username });

    if (user) {
      console.log(`⚠️ User "${testUserData.username}" already exists, updating password and wallet...`);
      user.password = testUserData.password; // pre-save hook will hash it
      user.role = "user";
      user.status = "active";
      user.wallet.balance = 50000;
      user.wallet.availableBalance = 50000;
      user.permissions = {
        ...user.permissions,
        canLogin: true,
        canBet: true,
      };
      await user.save();
      console.log(`✅ User "${testUserData.username}" updated successfully!`);
    } else {
      user = new User(testUserData);
      await user.save();
      console.log(`✅ User "${testUserData.username}" created successfully!`);
    }

    console.log("\n==========================================");
    console.log("🎮 Player Login Details:");
    console.log("Website URL : http://localhost:5173/");
    console.log("Username    : " + testUserData.username);
    console.log("Password    : " + testUserData.password);
    console.log("Balance     : ₹50,000");
    console.log("==========================================\n");

    process.exit(0);
  } catch (error) {
    console.error("❌ Seed Error:", error);
    process.exit(1);
  }
};

seedUser();

