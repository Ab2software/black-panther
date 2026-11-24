// controllers/adminBankController.js
const User = require("../../model/User");

exports.updateMyBankDetails = async (req, res) => {
  try {
    const adminId = req.user._id; // from auth middleware
    const admin = await User.findById(adminId);

    if (!admin) return res.status(404).json({ message: "Admin not found" });

    const allowedRoles = ["owner", "superadmin", "admin", "subadmin", "master", "agent"];
    if (!allowedRoles.includes(admin.role)) {
      return res.status(403).json({ message: "Only admin-tier roles can set bank details" });
    }

    const { accountHolderName, accountNumber, ifscCode, bankName } = req.body;

    admin.bankDetails = {
      accountHolderName: accountHolderName ?? admin.bankDetails.accountHolderName,
      accountNumber: accountNumber ?? admin.bankDetails.accountNumber,
      ifscCode: ifscCode ?? admin.bankDetails.ifscCode,
      bankName: bankName ?? admin.bankDetails.bankName,
    };

    await admin.save();

    res.json({
      message: "Bank details updated",
      bankDetails: admin.bankDetails,
    });
  } catch (err) {
    console.error("updateMyBankDetails error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getMyBankDetails = async (req, res) => {
  try {
    const adminId = req.user._id;
    const admin = await User.findById(adminId).select("bankDetails");

    if (!admin) return res.status(404).json({ message: "Admin not found" });

    res.json({
      success: true,
      bankDetails: admin.bankDetails || {},
    });
  } catch (err) {
    console.error("getMyBankDetails error:", err);
    res.status(500).json({ message: "Server error" });
  }
};