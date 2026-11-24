const jwt = require("jsonwebtoken");
const usermodel = require("../model/User");

module.exports = function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized access",
        error: "No token provided",
      });
    }

    let token = authHeader.trim().replace(/^"+|"+$/g, "");
    while (/^Bearer\s+/i.test(token)) {
      token = token.replace(/^Bearer\s+/i, "").trim();
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized access",
        error: "jwt must be provided",
      });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error("JWT_SECRET .env me set nahi hai");
      return res
        .status(500)
        .json({ success: false, message: "Server misconfiguration" });
    }

    jwt.verify(token, secret, async (err, decoded) => {
      if (err) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized access",
          err,
          hint: "Send only JWT token in Swagger Authorize (without Bearer prefix), or header as Authorization: Bearer <token>",
        });
      }

      try {
        const user = await usermodel
          .findById(decoded.id)
          .select(
            "permissions.canLogin isDemoUser sessionToken mustChangePassword",
          ); // add mustChangePassword

        if (!user) {
          return res.status(401).json({
            success: false,
            message: "User not found. Please login again.",
          });
        }

        if (user.permissions?.canLogin === false) {
          return res.status(401).json({
            success: false,
            message: "Session expired. Please login again.",
          });
        }

        // ✅ Single-device check
        if (user.sessionToken !== decoded.sessionToken) {
          return res.status(401).json({
            success: false,
            message: "Logged in from another device. Please login again.",
          });
        }

        // ✅ Force password change before allowing any other action
        if (user.mustChangePassword) {
          const allowedPaths = [
            "/api/v1/auth/password-reset",
            "/api/v1/auth/logout",
            "/api/v1/auth/get_user",
          ];
          const isAllowed = allowedPaths.some((p) =>
            req.originalUrl.startsWith(p),
          );

          if (!isAllowed) {
            return res.status(403).json({
              success: false,
              code: "PASSWORD_CHANGE_REQUIRED",
              message: "You must change your password before continuing",
            });
          }
        }

        req.user = decoded;
        req.token = token;
        next();
      } catch (dbError) {
        return res.status(500).json({
          success: false,
          message: "Database error in auth",
          error: dbError.message,
        });
      }
    });
  } catch (error) {
    console.log(error);
    return res.status(401).json({
      success: false,
      message: "Unauthorized access",
      error: error.message,
    });
  }
};

// ── Role guards ──

module.exports.isOwner = (req, res, next) => {
  if (req.user?.role !== "owner") {
    return res
      .status(403)
      .json({ success: false, message: "Access denied. Owner only." });
  }
  next();
};

module.exports.isSuperAdmin = (req, res, next) => {
  if (!["owner", "superadmin"].includes(req.user?.role)) {
    return res
      .status(403)
      .json({ success: false, message: "Access denied. Superadmin only." });
  }
  next();
};

module.exports.isAdmin = (req, res, next) => {
  if (!["owner", "superadmin", "admin"].includes(req.user?.role)) {
    return res
      .status(403)
      .json({ success: false, message: "Access denied. Admin only." });
  }
  next();
};
