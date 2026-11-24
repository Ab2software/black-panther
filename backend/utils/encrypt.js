const crypto = require("crypto");

function encryptPayloadECB(data, key) {
  const json = JSON.stringify(data);

  const cipher = crypto.createCipheriv(
    "aes-256-ecb",
    Buffer.from(key, "utf8"),
    null
  );

  let encrypted = cipher.update(json, "utf8", "base64");
  encrypted += cipher.final("base64");

  return encrypted;
}

module.exports = { encryptPayloadECB };