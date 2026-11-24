require("dotenv").config({
  path: require("path").resolve(__dirname, "../.env"),
});
const mongoose = require("mongoose");
const User = require("../model/User");

const ROLES_DATA = [
  {
    role: "owner",
    username: "owner_test",
    password: "Owner@123",
    phone: "9100000001",
    fullName: "Master Platform Owner",
    email: "owner@eagleexchang.com",
    balance: 10000000,
    canCreateUser: true,
    canBet: false,
  },
  {
    role: "superadmin",
    username: "superadmin_test",
    password: "Super@123",
    phone: "9100000002",
    fullName: "Head Super Admin",
    email: "superadmin@eagleexchang.com",
    balance: 5000000,
    canCreateUser: true,
    canBet: false,
    parentUsername: "owner_test",
  },
  {
    role: "admin",
    username: "admin_test",
    password: "Admin@123",
    phone: "9100000003",
    fullName: "Branch Admin",
    email: "admin@eagleexchang.com",
    balance: 2000000,
    canCreateUser: true,
    canBet: false,
    parentUsername: "superadmin_test",
  },
  {
    role: "subadmin",
    username: "subadmin_test",
    password: "Subadmin@123",
    phone: "9100000004",
    fullName: "Regional Sub Admin",
    email: "subadmin@eagleexchang.com",
    balance: 1000000,
    canCreateUser: true,
    canBet: false,
    parentUsername: "admin_test",
  },
  {
    role: "master",
    username: "master_test",
    password: "Master@123",
    phone: "9100000005",
    fullName: "Senior Master Broker",
    email: "master@eagleexchang.com",
    balance: 500000,
    canCreateUser: true,
    canBet: false,
    parentUsername: "subadmin_test",
  },
  {
    role: "agent",
    username: "agent_test",
    password: "Agent@123",
    phone: "9100000006",
    fullName: "Direct Area Agent",
    email: "agent@eagleexchang.com",
    balance: 200000,
    canCreateUser: true,
    canBet: false,
    parentUsername: "master_test",
  },
  {
    role: "user",
    username: "player_test",
    password: "Player@123",
    phone: "9100000007",
    fullName: "Main Test Bettor",
    email: "player@eagleexchang.com",
    balance: 50000,
    canCreateUser: false,
    canBet: true,
    parentUsername: "agent_test",
  },
];

async function seedAll() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URL);
    console.log("✅ MongoDB Connected successfully!\n");

    const createdUsers = {};

    for (const item of ROLES_DATA) {
      const parentUser = item.parentUsername ? createdUsers[item.parentUsername] : null;
      const parentId = parentUser ? parentUser._id : null;

      let user = await User.findOne({ username: item.username });

      if (user) {
        console.log(`Updating existing user [${item.role}]: ${item.username}...`);
        user.password = item.password; // pre-save hashes this
        user.role = item.role;
        user.phone = item.phone;
        user.fullName = item.fullName;
        user.email = item.email;
        user.status = "active";
        user.siteId = "eagleexchang";
        user.isVerified = true;
        if (item.role !== "user") {
          user.adminStatus = "active";
        }
        user.parentId = parentId;
        user.createdBy = parentId;
        if (item.role === "user") {
          user.assignedAdmin = parentId;
        }

        user.wallet.balance = item.balance;
        user.wallet.availableBalance = item.balance;

        user.permissions = {
          ...user.permissions,
          canLogin: true,
          canBet: item.canBet,
          canWithdraw: true,
          canDeposit: true,
          canCreateUser: item.canCreateUser,
          isBetLocked: false,
          isAccountLocked: false,
        };

        await user.save();
        createdUsers[item.username] = user;
        console.log(`✅ Updated: ${item.username} (${item.role})`);
      } else {
        console.log(`Creating new user [${item.role}]: ${item.username}...`);
        user = new User({
          username: item.username,
          password: item.password,
          phone: item.phone,
          fullName: item.fullName,
          email: item.email,
          role: item.role,
          status: "active",
          adminStatus: item.role !== "user" ? "active" : undefined,
          siteId: "eagleexchang",
          isVerified: true,
          parentId,
          createdBy: parentId,
          assignedAdmin: item.role === "user" ? parentId : undefined,
          wallet: {
            balance: item.balance,
            availableBalance: item.balance,
            exposure: 0,
            casinoExposure: 0,
            totalLiability: 0,
            bonusBalance: 0,
            totalProfit: 0,
            totalLoss: 0,
          },
          creditReference: item.balance,
          permissions: {
            canLogin: true,
            canBet: item.canBet,
            canWithdraw: true,
            canDeposit: true,
            canCreateUser: item.canCreateUser,
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
        });

        await user.save();
        createdUsers[item.username] = user;
        console.log(`✅ Created: ${item.username} (${item.role})`);
      }
    }

    console.log("\n=========================================================================================");
    console.log("🎉 ALL 7 ROLES SEEDED SUCCESSFULLY WITH FULL HIERARCHY CHAIN!");
    console.log("=========================================================================================");
    console.table(
      ROLES_DATA.map((u) => ({
        Role: u.role,
        Username: u.username,
        Password: u.password,
        Portal: u.role === "user" ? "http://localhost:5173/" : "http://localhost:5173/admin/login",
        Balance: `₹${u.balance.toLocaleString("en-IN")}`,
      }))
    );
    console.log("=========================================================================================\n");

    process.exit(0);
  } catch (err) {
    console.error("❌ Error in seedAll:", err);
    process.exit(1);
  }
}

seedAll();

