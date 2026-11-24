function captureIp(req, res, next) {
  const ip =
    (req.headers["x-forwarded-for"] || "").split(",")[0].trim() ||
    req.socket?.remoteAddress ||
    req.ip ||
    "unknown";
  req.clientIp = ip;
  next();
}

module.exports = captureIp;