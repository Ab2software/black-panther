  const express = require('express');
  const { registerController, loginController, logOutController, getUserController, updateProfileController, demoLoginController , passwordResetController } = require('../controllers/authController');
  const authMiddleware = require('../middleWare/authmiddleWare');

  const router = express.Router();

  /**
   * @swagger
   * tags:
   *   name: user -Auth
   *   description: Authentication APIs
   */

  /**
   * @swagger
   * /api/v1/auth/register:
   *   post:
   *     summary: Register a new user
   *     tags: [user -Auth]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [username, phone, password]
   *             properties:
   *               username:
   *                 type: string
   *                 example: babu123
   *               phone:
   *                 type: string
   *                 example: "9876543210"
   *               password:
   *                 type: string
   *                 example: "123456"
   *     responses:
   *       200:
   *         description: User registered successfully
   *       400:
   *         description: Validation failed or user already exists
   */
  // router
  // user registeration
  router.post('/register', registerController);

  /**
   * @swagger
   * /api/v1/auth/login:
   *   post:
   *     summary: Login user by phone and password
   *     tags: [user -Auth]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [phone, password]
   *             properties:
   *               phone:
   *                 type: string
   *                 example: "9876543210"
   *               password:
   *                 type: string
   *                 example: "123456"
   *     responses:
   *       200:
   *         description: Login successful
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 message:
   *                   type: string
   *                   example: Login successful
   *                 token:
   *                   type: string
   *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   */
  router.post('/login', loginController);

  /**
   * @swagger
   * /api/v1/auth/logout:
   *   post:
   *     summary: Logout user
   *     tags: [user -Auth]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Logout successful
   */
  router.post('/logout', authMiddleware, logOutController);
  /**
   * @swagger
   * /api/v1/auth/get_user:
   *   get:
   *     summary: Get logged-in user details
   *     tags: [user -Auth]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: User fetched successfully
   *       401:
   *         description: Unauthorized (token missing or invalid)
   */

  router.get('/get_user', authMiddleware, getUserController);

  router.put('/update-profile', authMiddleware, updateProfileController);

  /**
   * @swagger
   * /api/v1/auth/password-reset:
   *   post:
   *     summary: Reset logged-in user password
   *     tags: [user -Auth]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [oldPassword, newPassword]
   *             properties:
   *               oldPassword:
   *                 type: string
   *                 example: "123456"
   *               newPassword:
   *                 type: string
   *                 example: "newpass123"
   *     responses:
   *       200:
   *         description: Password reset successfully
   *       400:
   *         description: Validation failed or old password is incorrect
   *       401:
   *         description: Unauthorized (token missing or invalid)
   */
  router.post('/password-reset', authMiddleware, passwordResetController);

  /**
   * @swagger
   * /api/v1/auth/user/profile:
   *   put:
   *     summary: Update logged-in user profile
   *     tags: [user -Auth]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               fullName:
   *                 type: string
   *                 example: "Babu Saheb"
   *               email:
   *                 type: string
   *                 example: "babu@example.com"
   *               phone:
   *                 type: string
   *                 example: "9876543210"
   *               bankDetails:
   *                 type: object
   *                 properties:
   *                   accountHolderName:
   *                     type: string
   *                     example: "Babu Saheb"
   *                   accountNumber:
   *                     type: string
   *                     example: "1234567890"
   *                   ifscCode:
   *                     type: string
   *                     example: "SBIN0001234"
   *                   bankName:
   *                     type: string
   *                     example: "State Bank of India"
   *               upiDetails:
   *                 type: object
   *                 properties:
   *                   upiId:
   *                     type: string
   *                     example: "babu@upi"
   *     responses:
   *       200:
   *         description: Profile updated successfully
   *       400:
   *         description: Invalid data or duplicate phone number
   *       401:
   *         description: Unauthorized (token missing or invalid)
   *       404:
   *         description: User not found
   */
  router.put('/user/profile', authMiddleware, updateProfileController);
/**
 * @swagger
 * /api/v1/auth/demo-login:
 *   post:
 *     summary: Login as demo user (no credentials required)
 *     tags: [user -Auth]
 *     responses:
 *       200:
 *         description: Demo login successful
 */
router.post('/demo-login', demoLoginController);

  // export router

    module.exports=router;  
