// routes/adminUserRoutes.js
const express = require("express");
const router = express.Router();

const userController = require("../../controllers/userController");
const verifyAdmin = require("../../middleWare/adminAuthMiddleware");

router.patch(
  "/users/:userId/whatsapp",
  verifyAdmin,
  userController.updateUserWhatsapp,
);

module.exports = router;