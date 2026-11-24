const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const convertToWebp = async (file) => {
  const uploadDir = path.dirname(file.path);
  const webpFilename = `${path.parse(file.filename).name}.webp`;
  const webpPath = path.join(uploadDir, webpFilename);

  await sharp(file.path)
    .webp({ quality: 80 })
    .toFile(webpPath);

  fs.unlink(file.path, (err) => {
    if (err) console.log("Failed to remove original upload:", err.message);
  });

  return webpFilename;
};

module.exports = { convertToWebp };