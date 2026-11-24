const usermodel = require("../../model/User");
const jwt = require("jsonwebtoken");
const PaymentScanner = require("../../model/PaymentScanner");
const ChipTransaction = require("../../model/Chiptransaction");
const { v4: uuidv4 } = require("uuid");
const {convertToWebp} = require("../../utils/imageConverter");
const ALLOWED_ADMIN_ROLES = [
  "owner",
  "superadmin",
  "admin",
  "subadmin",
  "master",
  "agent",
];

const registerAdminController = async (req, res) => {
  try {
    const {
      username,
      phone,
      password,
      role = "admin",
      fullName,
      email,
    } = req.body ?? {};

    if (!username || !phone || !password) {
      return res.status(400).json({
        success: false,
        message: "username, phone and password are required",
      });
    }

    if (phone.length !== 10) {
      return res.status(400).json({
        success: false,
        message: "Invalid phone number",
      });
    }

    if (!ALLOWED_ADMIN_ROLES.includes(role)) {
      return res.status(400).json({
        success: false,
        message: `Invalid role. Allowed roles: ${ALLOWED_ADMIN_ROLES.join(", ")}`,
      });
    }

    const existingUser = await usermodel.findOne({
      $or: [{ username }, { phone }],
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User with this username or phone already exists",
      });
    }

    const newAdmin = new usermodel({
      username,
      phone,
      password,
      role,
      fullName: fullName || "",
      email: email || "",
      permissions: {
        canLogin: true,
        canCreateUser: true,
      },
    });

    await newAdmin.save();

    return res.status(201).json({
      success: true,
      message: `${role} created successfully`,
      admin: {
        userId: newAdmin._id,
        username: newAdmin.username,
        fullName: newAdmin.fullName,
        phone: newAdmin.phone,
        email: newAdmin.email,
        role: newAdmin.role,
      },
    });
  } catch (error) {
    console.log("Error in register admin controller:", error.message);
    return res.status(500).json({
      success: false,
      message: "Error in register admin controller",
      error: error.message,
    });
  }
};

// login admin
const loginAdminController = async (req, res) => {
  try {
    const { username, phone, password } = req.body ?? {};

    if (!password) {
      return res
        .status(400)
        .json({ success: false, message: "Password is required" });
    }

    if (!username && !phone) {
      return res
        .status(400)
        .json({ success: false, message: "Please provide username or phone" });
    }

    const query = {
      role: {
        $in: ["owner", "admin", "subadmin", "master", "agent", "superadmin"],
      },
    };

    if (username) query.username = username;
    if (phone) query.phone = phone;

    const admin = await usermodel.findOne(query).select("+password");

    if (!admin) {
      return res
        .status(404)
        .json({ success: false, message: "Admin user not found" });
    }

    if (admin.permissions?.canLogin === false) {
      return res
        .status(403)
        .json({ success: false, message: "Login disabled for this user" });
    }

    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid password" });
    }

    // ✅ Generate sessionToken using uuid
    const sessionToken = uuidv4();

    const token = jwt.sign(
      { id: admin._id, role: admin.role, sessionToken },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    await usermodel.findByIdAndUpdate(admin._id, {
      $set: {
        sessionToken,
        "permissions.canLogin": true,
        lastLoginAt: new Date(),
      },
    });

    admin.password = undefined;

    return res.status(200).json({
      success: true,
      message: "Admin login successful",
      token,
      admin: {
        _id: admin._id,
        username: admin.username,
        fullName: admin.fullName,
        role: admin.role,
      },
    });
  } catch (error) {
    console.log("Error in admin login controller:", error.message);
    return res.status(500).json({
      success: false,
      message: "Error in admin login controller",
      error: error.message,
    });
  }
};

// ================= helper: build absolute image url =================
// const buildScannerImageUrl = (req, scannerImage) => {
//   const baseUrl = (
//     process.env.WEBSITE_URL || `${req.protocol}://${req.get("host")}`
//   ).replace(/\/+$/, "");
//   return scannerImage?.startsWith("/")
//     ? `${baseUrl}${scannerImage}`
//     : scannerImage;
// };
const buildScannerImageUrl = (req, scannerImage) => {
  const baseUrl = `${req.protocol}://${req.get("host")}`.replace(/\/+$/, "");
  return scannerImage?.startsWith("/")
    ? `${baseUrl}${scannerImage}`
    : scannerImage;
};
/// admin add scanner controller (now creates a NEW scanner instead of overwriting) ....
const AddSannerController = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized access",
      });
    }

    const admin = await usermodel.findById(userId);

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    console.log("User ID:", admin._id, "Role:", admin.role);

    // ✅ allow subadmin also
    if (!["superadmin", "admin", "subadmin"].includes(admin.role)) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only admin/subadmin can upload scanner.",
      });
    }

    const upiId = req.body?.upiId;
    const label = req.body?.label || "";

    if (!req.file || !upiId) {
      return res.status(400).json({
        success: false,
        message: "Scanner image file and UPI ID are required",
      });
    }

    // ✅ convert whatever format was uploaded (png/jpg/heic/etc.) to webp
    let scannerImageUrl;
    try {
      const webpFilename = await convertToWebp(req.file);
      scannerImageUrl = `/scanners/${webpFilename}`;
    } catch (convErr) {
      console.log("Image conversion failed:", convErr.message);
      return res.status(500).json({
        success: false,
        message: "Failed to process uploaded image",
        error: convErr.message,
      });
    }

    // ✅ how many scanners does this admin already have?
    const existingCount = await PaymentScanner.countDocuments({
      adminId: admin._id,
    });

    // ✅ first scanner ever uploaded for this admin is auto-activated,
    // so the user-facing side is never left without an active scanner.
    const scanner = new PaymentScanner({
      adminId: admin._id,
      scannerImage: scannerImageUrl,
      upiId,
      label,
      isActive: existingCount === 0,
    });

    await scanner.save();

    return res.status(201).json({
      success: true,
      message: "Payment scanner added successfully",
      scanner,
    });
  } catch (error) {
    console.log("Error in AddScannerController:", error.message);

    return res.status(500).json({
      success: false,
      message: "Error in add scanner controller",
      error: error.message,
    });
  }
};  

// ================= GET ALL MY SCANNERS (admin/superadmin/subadmin) =================
// GET /api/admin/scanner/all
const getAllMyScannersController = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized access",
      });
    }

    const admin = await usermodel.findById(userId);

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (!["superadmin", "admin", "subadmin"].includes(admin.role)) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only admin/subadmin can view their scanners.",
      });
    }

    const scanners = await PaymentScanner.find({ adminId: admin._id }).sort({
      createdAt: -1,
    });

    const scannersWithUrl = scanners.map((s) => {
      const obj = s.toObject();
      obj.scannerImageUrl = buildScannerImageUrl(req, s.scannerImage);
      return obj;
    });

    return res.status(200).json({
      success: true,
      scanners: scannersWithUrl,
    });
  } catch (error) {
    console.log("Error in getAllMyScannersController:", error.message);
    return res.status(500).json({
      success: false,
      message: "Error fetching your scanners",
      error: error.message,
    });
  }
};

// ================= SET ACTIVE SCANNER (admin/superadmin/subadmin) =================
// PATCH /api/admin/scanner/:scannerId/activate
const setActiveScannerController = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const { scannerId } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized access",
      });
    }

    const admin = await usermodel.findById(userId);

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (!["superadmin", "admin", "subadmin"].includes(admin.role)) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only admin/subadmin can manage scanners.",
      });
    }

    // ✅ make sure the scanner belongs to THIS admin (no cross-admin activation)
    const targetScanner = await PaymentScanner.findOne({
      _id: scannerId,
      adminId: admin._id,
    });

    if (!targetScanner) {
      return res.status(404).json({
        success: false,
        message: "Scanner not found",
      });
    }

    // ✅ deactivate every other scanner belonging to this admin
    await PaymentScanner.updateMany(
      { adminId: admin._id, _id: { $ne: targetScanner._id } },
      { $set: { isActive: false } },
    );

    targetScanner.isActive = true;
    await targetScanner.save();

    const scannerObj = targetScanner.toObject();
    scannerObj.scannerImageUrl = buildScannerImageUrl(
      req,
      targetScanner.scannerImage,
    );

    return res.status(200).json({
      success: true,
      message: "Scanner activated successfully",
      scanner: scannerObj,
    });
  } catch (error) {
    console.log("Error in setActiveScannerController:", error.message);
    return res.status(500).json({
      success: false,
      message: "Error activating scanner",
      error: error.message,
    });
  }
};

// ================= DELETE SCANNER (admin/superadmin/subadmin) =================
// DELETE /api/admin/scanner/:scannerId
const deleteScannerController = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const { scannerId } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized access",
      });
    }

    const admin = await usermodel.findById(userId);

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (!["superadmin", "admin", "subadmin"].includes(admin.role)) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only admin/subadmin can manage scanners.",
      });
    }

    const scanner = await PaymentScanner.findOne({
      _id: scannerId,
      adminId: admin._id,
    });

    if (!scanner) {
      return res.status(404).json({
        success: false,
        message: "Scanner not found",
      });
    }

    const wasActive = scanner.isActive;
    await scanner.deleteOne();

    // ✅ if we just deleted the active scanner, auto-promote the most recent remaining one
    if (wasActive) {
      const nextScanner = await PaymentScanner.findOne({
        adminId: admin._id,
      }).sort({ createdAt: -1 });

      if (nextScanner) {
        nextScanner.isActive = true;
        await nextScanner.save();
      }
    }

    return res.status(200).json({
      success: true,
      message: "Scanner deleted successfully",
    });
  } catch (error) {
    console.log("Error in deleteScannerController:", error.message);
    return res.status(500).json({
      success: false,
      message: "Error deleting scanner",
      error: error.message,
    });
  }
};

// ================= GET ACTIVE ADMIN SCANNER =================
const getActiveScannerController = async (req, res) => {
  try {
    const userId = req.user?.id;

    const user = await usermodel.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // 🔥 STEP 1: find assigned admin
    let adminId = user.assignedAdmin;

    // 🔥 fallback: if not assigned, use parentId
    if (!adminId) {
      adminId = user.parentId;
    }

    if (!adminId) {
      return res.status(404).json({
        success: false,
        message: "No admin assigned to this user",
      });
    }

    // 🔥 STEP 2: fetch the ACTIVE scanner of THAT admin only
    let scanner = await PaymentScanner.findOne({
      adminId: adminId,
      isActive: true,
    });

    // 🔥 self-heal: handles scanners created before isActive existed, where
    // nothing is marked active yet — auto-promote the most recent one.
    if (!scanner) {
      scanner = await PaymentScanner.findOne({ adminId: adminId }).sort({
        createdAt: -1,
      });

      if (scanner && !scanner.isActive) {
        scanner.isActive = true;
        await scanner.save();
      }
    }

    // 🔥 STEP 3: fallback to superadmin ONLY if admin has no scanner at all
    if (!scanner) {
      const superAdmin = await usermodel.findOne({
        role: "superadmin",
      });

      if (superAdmin) {
        scanner = await PaymentScanner.findOne({
          adminId: superAdmin._id,
          isActive: true,
        });

        if (!scanner) {
          scanner = await PaymentScanner.findOne({
            adminId: superAdmin._id,
          }).sort({ createdAt: -1 });

          if (scanner && !scanner.isActive) {
            scanner.isActive = true;
            await scanner.save();
          }
        }
      }
    }

    if (!scanner) {
      return res.status(404).json({
        success: false,
        message: "No payment scanner found",
      });
    }

    // ✅ Build full image URL
    const scannerObj = scanner.toObject();
    scannerObj.scannerImageUrl = buildScannerImageUrl(req, scanner.scannerImage);

    return res.status(200).json({
      success: true,
      scanner: scannerObj,
    });
  } catch (error) {
    console.log("Scanner error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Error fetching scanner",
      error: error.message,
    });
  }
};

// ================= GET MY OWN SCANNER (admin/superadmin/subadmin) =================
// GET /api/admin/scanner/me
// Kept for backward compatibility with any existing frontend calls —
// now returns the ACTIVE scanner specifically. Use /scanner/all to list everything.
const getMyScannerController = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized access",
      });
    }

    const admin = await usermodel.findById(userId);

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (!["superadmin", "admin", "subadmin"].includes(admin.role)) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only admin/subadmin can view their scanner.",
      });
    }

    let scanner = await PaymentScanner.findOne({
      adminId: admin._id,
      isActive: true,
    });

    if (!scanner) {
      scanner = await PaymentScanner.findOne({ adminId: admin._id }).sort({
        createdAt: -1,
      });

      if (scanner && !scanner.isActive) {
        scanner.isActive = true;
        await scanner.save();
      }
    }

    if (!scanner) {
      // Not an error — just means they haven't uploaded one yet
      return res.status(200).json({
        success: true,
        scanner: null,
      });
    }

    const scannerObj = scanner.toObject();
    scannerObj.scannerImageUrl = buildScannerImageUrl(req, scanner.scannerImage);

    return res.status(200).json({
      success: true,
      scanner: scannerObj,
    });
  } catch (error) {
    console.log("Error in getMyScannerController:", error.message);
    return res.status(500).json({
      success: false,
      message: "Error fetching your scanner",
      error: error.message,
    });
  }
};

const createUserByAdminController = async (req, res) => {
  try {
    const adminId = req.user?.id;
    if (!adminId)
      return res.status(401).json({ success: false, message: "Unauthorized" });

    const admin = await usermodel.findById(adminId);
    if (!admin)
      return res
        .status(404)
        .json({ success: false, message: "Admin not found" });

    const CAN_CREATE_USER_ROLES = ["owner", "superadmin", "admin"];

    if (!CAN_CREATE_USER_ROLES.includes(admin.role)) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to create users",
      });
    }

    const {
      username,
      phone,
      password,
      fullName,
      email,
      balance = 0,
      assignedAdmin,
    } = req.body ?? {};

    // ── Validations ──
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "Username and password are required",
      });
    }
    if (username.length < 3 || username.length > 20) {
      return res
        .status(400)
        .json({ success: false, message: "Username must be 3–20 characters" });
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return res.status(400).json({
        success: false,
        message: "Username can only contain letters, numbers and underscores",
      });
    }
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }
    if (phone && !/^\d{10}$/.test(phone)) {
      return res
        .status(400)
        .json({ success: false, message: "Phone must be 10 digits" });
    }
    if (Number(balance) < 0) {
      return res
        .status(400)
        .json({ success: false, message: "Balance cannot be negative" });
    }
    if (Number(balance) > 0 && admin.wallet.balance < Number(balance)) {
      return res
        .status(400)
        .json({ success: false, message: "Insufficient balance to allocate" });
    }

    // ── Uniqueness ──
    const existingUsername = await usermodel.findOne({
      username: { $regex: new RegExp(`^${username}$`, "i") },
    });
    if (existingUsername) {
      return res
        .status(400)
        .json({ success: false, message: "Username already taken" });
    }
    if (phone) {
      const existingPhone = await usermodel.findOne({ phone });
      if (existingPhone) {
        return res
          .status(400)
          .json({ success: false, message: "Phone number already registered" });
      }
    }

    // ── Resolve assigned admin ──
    let resolvedAssignedAdmin = admin._id; // default = requesting admin

    if (assignedAdmin) {
      const subAdmin = await usermodel.findById(assignedAdmin);
      if (!subAdmin) {
        return res
          .status(404)
          .json({ success: false, message: "Selected sub admin not found" });
      }
      if (!["admin", "subadmin", "master", "agent"].includes(subAdmin.role)) {
        return res.status(400).json({
          success: false,
          message: "Can only assign to subadmin, master or agent",
        });
      }
      // Non-superadmins can only assign to their own downline
      if (
        admin.role !== "superadmin" &&
        String(subAdmin.parentId) !== String(admin._id)
      ) {
        return res.status(403).json({
          success: false,
          message: "You can only assign to your own sub admins",
        });
      }
      resolvedAssignedAdmin = subAdmin._id;
    }

    // ── Create user ──
    const newUser = new usermodel({
      username,
      phone: phone || "",
      password,
      fullName: fullName || "",
      email: email || "",
      role: "user",
      parentId: resolvedAssignedAdmin,
      createdBy: admin._id,
      assignedAdmin: resolvedAssignedAdmin,
      status: "active",
      mustChangePassword: true,
      // FIX: siteId was never set here, so every user created through this
      // controller was born missing it — same gap just found and backfilled
      // on the admin side. Inherit it from the creating admin so new
      // accounts don't reopen the "Client not found" bug for themselves.
      siteId: admin.siteId,
      wallet: {
        balance: Number(balance),
        exposure: 0,
        availableBalance: Number(balance),
      },
      permissions: {
        canLogin: true,
        canBet: true,
        canWithdraw: true,
        canDeposit: true,
      },
    });

    await newUser.save();

    // ── Deduct balance from requesting admin ──
    let adminBalanceAfter = admin.wallet.balance;
    if (Number(balance) > 0) {
      adminBalanceAfter = admin.wallet.balance - Number(balance);
      await usermodel.findByIdAndUpdate(adminId, {
        $inc: {
          "wallet.balance": -Number(balance),
          "wallet.availableBalance": -Number(balance),
          downlineCount: 1,
        },
      });
    } else {
      await usermodel.findByIdAndUpdate(adminId, {
        $inc: { downlineCount: 1 },
      });
    }

    // FIX: initial balance granted at account creation was moving real
    // money (admin.wallet.balance down, newUser.wallet.balance up) with
    // no corresponding ChipTransaction/PaymentRequest record — so it
    // never showed up in the new user's account statement, same class
    // of bug as the unrecorded admin chip-transfer withdraw and the
    // stuck-bet void refund fixed earlier. Recording it as a "give"
    // ChipTransaction reuses the ledger block that already handles
    // admin give/take correctly, with no ledgerService.js changes needed.
    if (Number(balance) > 0) {
      await ChipTransaction.create({
        fromUserId: adminId,
        toUserId: newUser._id,
        type: "give",
        amount: Number(balance),
        fromBalanceAfter: adminBalanceAfter,
        toBalanceAfter: Number(balance),
        remark: "Initial balance on account creation",
      });
    }

    // ── Increment counts on the direct parent (sub admin or self) ──
    if (String(resolvedAssignedAdmin) !== String(admin._id)) {
      await usermodel.findByIdAndUpdate(resolvedAssignedAdmin, {
        $inc: { directUserCount: 1, downlineCount: 1 },
      });
    } else {
      await usermodel.findByIdAndUpdate(adminId, {
        $inc: { directUserCount: 1 },
      });
    }

    return res.status(201).json({
      success: true,
      message: `User "${newUser.username}" created successfully${assignedAdmin ? ` and assigned to sub admin` : ""}`,
      user: {
        _id: newUser._id,
        username: newUser.username,
        fullName: newUser.fullName,
        phone: newUser.phone,
        email: newUser.email,
        role: newUser.role,
        wallet: newUser.wallet,
        assignedAdmin: resolvedAssignedAdmin,
        status: newUser.status,
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
    console.log("Error in createUserByAdminController:", error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const updateUserWhatsapp = async (req, res) => {
  try {
    const { userId } = req.params;
    const { whatsapp } = req.body;

    if (!whatsapp) {
      return res
        .status(400)
        .json({ success: false, message: "Whatsapp number is required" });
    }

    if (!/^\d{10}$/.test(whatsapp)) {
      return res.status(400).json({
        success: false,
        message: "Whatsapp must be a valid 10-digit number",
      });
    }

    const user = await usermodel.findOneAndUpdate(
      { _id: userId },
      { $set: { whatsapp } },
      { new: true, select: "_id username whatsapp role" },
    );

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    return res.status(200).json({
      success: true,
      message: `Whatsapp number updated for ${user.username}`,
      data: user,
    });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "Server error", error: err.message });
  }
};

// ================= CHANGE PASSWORD (self-service) =================
// PUT /api/admin/change-password
// Works for owner / superadmin / admin (and the rest of the admin-side
// hierarchy) changing THEIR OWN password. Does not touch other accounts.
const changePasswordController = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized access",
      });
    }

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
        message: "New password must be at least 6 characters long",
      });
    }

    if (newPassword === oldPassword) {
      return res.status(400).json({
        success: false,
        message: "New password must be different from the old password",
      });
    }

    // password field is select:false on the schema (same as loginAdminController)
    const admin = await usermodel.findById(userId).select("+password");

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (!ALLOWED_ADMIN_ROLES.includes(admin.role)) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    // ✅ reuse the same comparePassword method used at login
    const isMatch = await admin.comparePassword(oldPassword);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Old password is incorrect",
      });
    }

    // ✅ set plain password — pre-save hook rehashes it (same pattern
    // used by registerAdminController / createUserByAdminController)
    admin.password = newPassword;
    await admin.save();

    return res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.log("Error in change password controller:", error.message);
    return res.status(500).json({
      success: false,
      message: "Error changing password",
      error: error.message,
    });
  }
};

module.exports = {
  registerAdminController,
  loginAdminController,
  AddSannerController,
  getActiveScannerController,
  getMyScannerController,
  getAllMyScannersController,
  setActiveScannerController,
  deleteScannerController,
  createUserByAdminController,
  updateUserWhatsapp,
  changePasswordController,
};