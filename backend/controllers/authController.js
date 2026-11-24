const usermodel = require("../model/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");

const SITE_ID = process.env.SITE_ID || "blackpanther";

const registerController = async (req, res) => {
  try {
    const { username, phone, password } = req.body ?? {};

    if (!username || !phone || !password) {
      const missing = [];
      if (!username) missing.push("username");
      if (!phone) missing.push("phone");
      if (!password) missing.push("password");
      return res.status(400).json({
        success: false,
        message: `${missing.join(", ")} ${missing.length > 1 ? "are" : "is"} required`,
      });
    }

    if (username.length < 3 || username.length > 20) {
      return res.status(400).json({
        success: false,
        message: "Username must be between 3 and 20 characters",
      });
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return res.status(400).json({
        success: false,
        message: "Username can only contain letters, numbers and underscores",
      });
    }

    if (phone.length !== 10 || !/^\d{10}$/.test(phone)) {
      return res.status(400).json({
        success: false,
        message: "Phone number must be exactly 10 digits",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    const existingUsername = await usermodel.findOne({
      username: { $regex: new RegExp(`^${username}$`, "i") },
    });
    if (existingUsername) {
      return res.status(400).json({
        success: false,
        message: "This username is already taken",
      });
    }

    const existingPhone = await usermodel.findOne({ phone });
    if (existingPhone) {
      return res.status(400).json({
        success: false,
        message: "An account with this phone number already exists",
      });
    }

    // ── Pick an active admin to assign this user to ───────────────────────
    // Reverted siteId scoping — existing admin docs don't reliably have
    // siteId set, so that filter was matching zero admins. Back to the
    // original selection logic (first active admin found) until siteId
    // is backfilled on admin records and this can be safely re-scoped.
    const activeAdmin = await usermodel.findOne({
      role: "admin",
      adminStatus: "active",
    });

    const assignedAdminId = activeAdmin ? activeAdmin._id : null;

    const newUser = new usermodel({
      username,
      phone,
      password,
      // parentId and assignedAdmin must both be set to the same value.
      // Previously only assignedAdmin was set here, which left parentId
      // null for every self-registered user and broke any query
      // (e.g. getChipDashboard) that filters downline by parentId.
      parentId: assignedAdminId,
      assignedAdmin: assignedAdminId,
      siteId: SITE_ID,
    });

    await newUser.save();

    if (activeAdmin) {
      await usermodel.findByIdAndUpdate(activeAdmin._id, {
        $inc: { directUserCount: 1, downlineCount: 1 },
      });
    }

    return res.status(200).json({
      success: true,
      message: "Account created successfully! Please login.",
      user: {
        userId: newUser._id,
        username: newUser.username,
        fullName: newUser.fullName,
        phone: newUser.phone,
        role: newUser.role,
        parentId: newUser.parentId,
        assignedAdmin: newUser.assignedAdmin,
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        success: false,
        message: `This ${field} is already registered`,
      });
    }
    console.log("error in register controller:", error.message);
    return res.status(500).json({
      success: false,
      message: "Registration failed. Please try again.",
    });
  }
};

const loginController = async (req, res) => {
  try {
    console.log("Request body:", req.body);
    const { username, password } = req.body ?? {};

    if (!username || !password) {
      return res.status(400).send({
        success: false,
        message: "Username and password are required",
      });
    }

    const user = await usermodel.findOne({ username }).select("+password");

    if (!user) {
      return res.status(404).send({
        success: false,
        message: "User not found with this username",
      });
    }

    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(400).send({
        success: false,
        message: "Invalid password",
      });
    }

    const sessionToken = uuidv4();
    const token = jwt.sign(
      { id: user._id, sessionToken, siteId: SITE_ID },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    await usermodel.findByIdAndUpdate(user._id, {
      $set: {
        sessionToken,
        "permissions.canLogin": true,
        lastLoginAt: new Date(),
      },
    });

    user.password = undefined;

    res.status(200).send({
      success: true,
      message: "Login successful",
      token,
      user,
    });
  } catch (error) {
    console.log("🔥 Error in login controller:", error.message);
    res.status(500).json({
      success: false,
      message: "error in login controller",
      error,
    });
  }
};

const getUserController = async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized access",
      });
    }

    const userId = req.user.id;
    const user = await usermodel.findById(userId).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "User fetched successfully",
      user,
    });
  } catch (error) {
    console.log("🔥 Error in get user controller:", error.message);
    return res.status(500).send({
      success: false,
      message: "error in get user controller",
      error: error.message,
    });
  }
};

const updateProfileController = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized access",
      });
    }

    const { fullName, email, phone, bankDetails, upiDetails } = req.body ?? {};
    const updateData = {};

    if (typeof fullName === "string") updateData.fullName = fullName.trim();
    if (typeof email === "string") updateData.email = email.trim().toLowerCase();
    if (typeof phone === "string") updateData.phone = phone.trim();
    if (bankDetails && typeof bankDetails === "object") updateData.bankDetails = bankDetails;
    if (upiDetails && typeof upiDetails === "object") updateData.upiDetails = upiDetails;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid profile fields provided for update",
      });
    }

    if (updateData.phone && updateData.phone.length !== 10) {
      return res.status(400).json({
        success: false,
        message: "Invalid phone number",
      });
    }

    if (updateData.phone) {
      const existingPhone = await usermodel.findOne({
        phone: updateData.phone,
        _id: { $ne: userId },
      });

      if (existingPhone) {
        return res.status(400).json({
          success: false,
          message: "Phone number already in use",
        });
      }
    }

    const updatedUser = await usermodel
      .findByIdAndUpdate(userId, { $set: updateData }, { new: true, runValidators: true })
      .select("-password");

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.log("🔥 Error in update profile controller:", error.message);
    return res.status(500).send({
      success: false,
      message: "error in update profile controller",
      error: error.message,
    });
  }
};

const passwordResetController = async (req, res) => {
  try {
    const userId = req.user.id;
    const { oldPassword, newPassword } = req.body ?? {};

    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Old password and new password are required",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 6 characters",
      });
    }

    const user = await usermodel.findById(userId).select("+password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.isDemoUser) {
      return res.status(403).json({
        success: false,
        message: "Demo user cannot change password",
      });
    }

    const isMatch = await user.comparePassword(oldPassword);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Old password is incorrect",
      });
    }

    user.password = newPassword;
    user.mustChangePassword = false;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (error) {
    console.log("🔥 Error in password reset:", error.message);
    return res.status(500).json({
      success: false,
      message: "Error in password reset",
      error: error.message,
    });
  }
};

const demoLoginController = async (req, res) => {
  try {
    let demoUser = await usermodel.findOne({
      isDemoUser: true,
      deletedAt: null,
      demoExpiresAt: { $gt: new Date() },
    });

    if (!demoUser) {
      const demoUsername = `demo_${Date.now()}`;

      demoUser = new usermodel({
        username: demoUsername,
        fullName: "Demo User",
        phone: `00000${Date.now().toString().slice(-5)}`,
        isDemoUser: true,
        demoExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        role: "user",
        status: "active",
        wallet: {
          balance: 10000,
          exposure: 0,
          availableBalance: 10000,
          bonusBalance: 0,
          totalProfit: 0,
          totalLoss: 0,
        },
        permissions: {
          canLogin: true,
          canBet: false,
          canWithdraw: false,
          canDeposit: false,
          canCreateUser: false,
          isBetLocked: true,
          isAccountLocked: false,
        },
      });

      await demoUser.save();
    }

    const sessionToken = uuidv4();
    const token = jwt.sign(
      { id: demoUser._id, isDemo: true, sessionToken, siteId: SITE_ID },
      process.env.JWT_SECRET,
      { expiresIn: "24h" },
    );

    await usermodel.findByIdAndUpdate(demoUser._id, {
      $set: {
        sessionToken,
        lastLoginAt: new Date(),
        "permissions.canLogin": true,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Demo login successful",
      token,
      user: {
        userId: demoUser._id,
        username: demoUser.username,
        fullName: demoUser.fullName,
        role: demoUser.role,
        isDemoUser: true,
        wallet: demoUser.wallet,
        permissions: demoUser.permissions,
        demoExpiresAt: demoUser.demoExpiresAt,
      },
    });
  } catch (error) {
    console.log("🔥 Error in demo login:", error.message);
    return res.status(500).json({
      success: false,
      message: "Error in demo login",
      error: error.message,
    });
  }
};

const logOutController = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized access",
      });
    }

    await usermodel.findByIdAndUpdate(userId, {
      $set: {
        sessionToken: null,
        "permissions.canLogin": false,
      },
    });

    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      expires: new Date(0),
      maxAge: 0,
    });

    return res.status(200).send({
      success: true,
      message: "Logout successful",
    });
  } catch (error) {
    console.log("🔥 Error in logout controller:", error.message);
    return res.status(500).send({
      success: false,
      message: "error in logout controller",
      error,
    });
  }
};

module.exports = {
  registerController,
  loginController,
  getUserController,
  updateProfileController,
  passwordResetController,
  demoLoginController,
  logOutController,
};