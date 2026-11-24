// routes/userRoutes.js
const express = require("express");
const router = express.Router();

const userController = require("../controllers/userController");
const authMiddleware = require("../middleWare/authmiddleWare");
const verifyAdminToken = require("../middleWare/adminAuthMiddleware"); // adjust path to wherever this file actually lives

// PUBLIC — floating icon before login. No auth. Shows whichever admin is active right now.
router.get("/public/whatsapp", userController.getActiveAdminContact);

// LOGGED-IN USER — floating icon after login. Shows their assigned admin.
router.get("/whatsapp/assigned", authMiddleware, userController.getAssignedAdminContact);

// ADMIN ONLY — Settings page, admin sets their own number.
router.patch("/users/:userId/whatsapp", verifyAdminToken, userController.updateUserWhatsapp);

module.exports = router;