require("dotenv").config({
  path: require("path").resolve(__dirname, "../.env"),
});
const mongoose = require("mongoose");
const User = require("../model/User");

const seedAdmins = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL);

    console.log("MongoDB Connected");

    const admins = [
      {
        username: "yodhasuperadmin",
        phone: "9999999998",
        password: "yodhasuperpass@365",
        role: "superadmin",
        fullName: "Super Admin",
        email: "superadmin@test.com",
        siteId: "eagleexchang",
        status: "active",
        adminStatus: "active",
        isVerified: true,
        permissions: {
          canLogin: true,
          canCreateUser: true,
        },
      },
    ];

    for (const admin of admins) {
      let user = await User.findOne({ username: admin.username });

      if (user) {
        console.log(`${admin.username} already exists, updating password and permissions...`);
        user.password = admin.password;
        user.role = admin.role;
        user.permissions = {
          ...user.permissions,
          canLogin: true,
          canCreateUser: true,
        };
        user.status = "active";
        user.adminStatus = "active";
        await user.save();
        console.log(`✅ ${admin.username} updated successfully`);
        continue;
      }

      user = new User(admin);
      await user.save(); // password will be hashed by pre-save hook

      console.log(`✅ ${admin.username} created successfully`);
    }

    console.log("Seeding completed successfully");
    process.exit(0);
  } catch (error) {
    console.error("Seed Error:", error);
    process.exit(1);
  }
};

seedAdmins();
