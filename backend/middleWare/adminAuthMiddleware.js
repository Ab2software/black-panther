const jwt = require("jsonwebtoken");
const User = require("../model/User");

const verifyAdminToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    console.log("🔐 Incoming Auth Header:", req.headers.authorization);

    if (!token) {
      console.log("❌ No token provided");
      return res.status(401).json({
        success: false,
        message: "No token provided",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    console.log("✅ decoded token:", decoded);

    const admin = await User.findById(decoded.id);

    console.log("👤 DB user found:", {
      id: admin?._id,
      username: admin?.username,
      role: admin?.role,
      status: admin?.status,
      adminStatus: admin?.adminStatus,
    });

    if (!admin) {
      console.log("❌ User not found in DB");
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    // ⚠️ IMPORTANT DEBUG LOG
    console.log("🚦 ROLE CHECK:", {
      role: admin.role,
      allowed: ["admin", "superadmin"].includes(admin.role),
    });

    // Allow both admin and superadmin
    if (!["owner","admin", "superadmin"].includes(admin.role)) {
      console.log("⛔ Access denied due to role");
      return res.status(403).json({
        success: false,
        message: "Access denied.",
        role: admin.role,
      });
    }

    req.user = admin;
    req.admin = admin;

    next();
  } catch (error) {
    console.log("🔥 Auth middleware error:", error.message);

    return res.status(401).json({
      success: false,
      message: "Invalid token",
      error: error.message,
    });
  }
};

module.exports = verifyAdminToken;