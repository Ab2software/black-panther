const express = require("express");
const User = require("../../model/User"); // ✅ add this

const {
  registerAdminController,
  loginAdminController,
  AddSannerController,
  getActiveScannerController,
  createUserByAdminController,
  updateUserWhatsapp,
  getMyScannerController,
  getAllMyScannersController,
  setActiveScannerController,
  deleteScannerController,
  changePasswordController,
} = require("../../controllers/admin/adminAuthController");

const authMiddleware = require("../../middleWare/authmiddleWare");
const verifyAdminToken = require("../../middleWare/adminAuthMiddleware");
const upload = require("../../middleWare/uploadMiddleware");
const uploadScanner = require("../../middleWare/scannerUploadMiddleware");

const router = express.Router();

router.post("/register", registerAdminController);
router.post("/login", loginAdminController);

router.post(
  "/add-scanner",
  authMiddleware,
  uploadScanner.single("scannerImage"),
  AddSannerController,
);
router.get("/active-scanner", getActiveScannerController);
router.get("/my-scanner", verifyAdminToken, getMyScannerController);

// ✅ new: multi-scanner management (list / activate / delete)
router.get("/all-scanners", verifyAdminToken, getAllMyScannersController);
router.patch(
  "/activate-scanner/:scannerId",
  verifyAdminToken,
  setActiveScannerController,
);

router.delete(
  "/delete-scanner/:scannerId",
  verifyAdminToken,
  deleteScannerController,
);

router.post("/create-user", authMiddleware, createUserByAdminController);

// ✅ self-service change password (owner / superadmin / admin)
router.put("/change-password", verifyAdminToken, changePasswordController);

// ✅ public/whatsapp MUST come before /:userId/whatsapp
router.get("/public/whatsapp", async (req, res) => {
  try {
    const admin = await User.findOne({
      role: { $in: ["superadmin", "admin"] },
      whatsapp: { $exists: true, $ne: "" },
    }).select("whatsapp");

    if (!admin?.whatsapp) {
      return res
        .status(404)
        .json({ success: false, message: "No WhatsApp configured" });
    }

    return res.status(200).json({ success: true, whatsapp: admin.whatsapp });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

// ✅ /:userId/whatsapp AFTER the specific routes
router.patch("/users/:userId/whatsapp", verifyAdminToken, updateUserWhatsapp);

module.exports = router;