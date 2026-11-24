// controllers/userBankController.js
const User = require("../model/User");

exports.getAssignedAdminBankDetails = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("assignedAdmin parentId"); // ✅ .id not ._id

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const adminRefId = user.assignedAdmin || user.parentId;
    if (!adminRefId) {
      return res.status(404).json({ message: "No admin assigned to this account" });
    }

    const admin = await User.findById(adminRefId)
      .select("username fullName bankDetails adminStatus");

    if (!admin || admin.adminStatus !== "active") {
      return res.status(404).json({ message: "Assigned admin unavailable" });
    }

    res.json({
      success: true, // ✅ added, so frontend's `res.success` check works consistently
      adminUsername: admin.username,
      adminName: admin.fullName,
      bankDetails: admin.bankDetails,
    });
  } catch (err) {
    console.error("getAssignedAdminBankDetails error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getAssignedAdminBankDetails = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("assignedAdmin parentId"); // ✅ .id not ._id

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const adminRefId = user.assignedAdmin || user.parentId;
    if (!adminRefId) {
      return res.status(404).json({ message: "No admin assigned to this account" });
    }

    const admin = await User.findById(adminRefId)
      .select("username fullName bankDetails adminStatus");

    if (!admin || admin.adminStatus !== "active") {
      return res.status(404).json({ message: "Assigned admin unavailable" });
    }

    res.json({
      success: true, // ✅ added, so frontend's `res.success` check works consistently
      adminUsername: admin.username,
      adminName: admin.fullName,
      bankDetails: admin.bankDetails,
    });
  } catch (err) {
    console.error("getAssignedAdminBankDetails error:", err);
    res.status(500).json({ message: "Server error" });
  }
};