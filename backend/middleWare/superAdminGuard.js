const User = require("../model/User");

module.exports = async function superAdminGuard(req, res, next) {
  try {
    // req.admin is already set by verifyAdminToken, no need to re-query
    const admin = req.admin;

    if (!admin) {
      return res.status(401).json({ success: false, message: "Admin not found." });
    }

    if (!["owner", "superadmin"].includes(admin.role)) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Super admin only.",
      });
    }

    next();
  } catch (err) {
    return res.status(500).json({ success: false, message: "Auth error.", error: err.message });
  }
};