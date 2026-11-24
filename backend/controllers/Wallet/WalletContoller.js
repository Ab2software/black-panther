const usermodel = require("../../model/User");
const PaymentScanner = require("../../model/PaymentScanner");
const PaymentRequest = require("../../model/PaymentRequest");
const WithdrawRequest = require("../../model/WithdrawRequest");
const { convertToWebp } = require("../../utils/imageConverter");
const walletController = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized access",
      });
    }

    const {
      balance = 0,
      exposure = 0,
      bonusBalance = 0,
      totalProfit = 0,
      totalLoss = 0,
    } = req.body ?? {};

    const walletData = {
      balance: Number(balance) || 0,
      exposure: Number(exposure) || 0,
      bonusBalance: Number(bonusBalance) || 0,
      totalProfit: Number(totalProfit) || 0,
      totalLoss: Number(totalLoss) || 0,
    };

    if (Object.values(walletData).some((value) => value < 0)) {
      return res.status(400).json({
        success: false,
        message: "Wallet values cannot be negative",
      });
    }

    walletData.availableBalance = walletData.balance - walletData.exposure;

    const updatedUser = await usermodel
      .findByIdAndUpdate(
        userId,
        { $set: { wallet: walletData } },
        { new: true, runValidators: true },
      )
      .select("username role wallet");

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Wallet updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.log("Error in wallet controller:", error.message);
    return res.status(500).json({
      success: false,
      message: "Error in wallet controller",
      error: error.message,
    });
  }
};

const getWalletController = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized access",
      });
    }

    const user = await usermodel
      .findById(userId)
      .select("username role wallet");
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Wallet fetched successfully",
      user,
    });
  } catch (error) {
    console.log("Error in get wallet controller:", error.message);
    return res.status(500).json({
      success: false,
      message: "Error in get wallet controller",
      error: error.message,
    });
  }
};
//// get scanner controller..
const getScannerController = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized access",
      });
    }

    // 1️⃣ Get user with assigned admin
    const user = await usermodel.findById(userId).select("assignedAdmin");

    if (!user || !user.assignedAdmin) {
      return res.status(404).json({
        success: false,
        message: "No admin assigned to this user",
      });
    }

    // 2️⃣ Find the ACTIVE scanner of assigned admin ONLY
    let scanner = await PaymentScanner.findOne({
      adminId: user.assignedAdmin,
      isActive: true,
    });

    // self-heal: nothing marked active yet — promote the most recent one
    if (!scanner) {
      scanner = await PaymentScanner.findOne({
        adminId: user.assignedAdmin,
      }).sort({ createdAt: -1 });

      if (scanner && !scanner.isActive) {
        scanner.isActive = true;
        await scanner.save();
      }
    }

    if (!scanner) {
      return res.status(404).json({
        success: false,
        message: "No scanner found for assigned admin",
      });
    }

    const baseUrl =
      process.env.BASE_URL || `${req.protocol}://${req.get("host")}`;

    const scannerObj = scanner.toObject();
    scannerObj.scannerImageUrl = scanner.scannerImage?.startsWith("/scanners/")
      ? `${baseUrl}${scanner.scannerImage}`
      : scanner.scannerImage;

    return res.status(200).json({
      success: true,
      scanner: scannerObj,
    });
  } catch (error) {
    console.log("Error in getScannerController:", error.message);
    return res.status(500).json({
      success: false,
      message: "Error in get scanner controller",
      error: error.message,
    });
  }
};
// controllers/user/walletController.js (or wherever this lives)
const userUpladPaymentController = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res
        .status(401)
        .json({ success: false, message: "Unauthorized access" });
    }

    const { price, transactionId, method } = req.body ?? {}; // ✅ added method

    if (!price || !transactionId || !req.file) {
      return res.status(400).json({
        success: false,
        message: "Price, transaction ID, and payment screenshot are required",
      });
    }

    // ✅ convert whatever format was uploaded (png/jpg/heic/etc.) to webp
    let screenshotUrl;
    try {
      const webpFilename = await convertToWebp(req.file);
      screenshotUrl = `/uploads/${webpFilename}`;
    } catch (convErr) {
      console.log("Image conversion failed:", convErr.message);
      return res.status(500).json({
        success: false,
        message: "Failed to process uploaded payment screenshot",
        error: convErr.message,
      });
    }

    const newPayment = new PaymentRequest({
      userId,
      price: Number(price),
      transactionId,
      paymentScreenshot: screenshotUrl,
      method: method === "bank" ? "bank" : "upi", // ✅ default-safe
    });

    await newPayment.save();

    const baseUrl =
      process.env.BASE_URL || `${req.protocol}://${req.get("host")}`;
    const paymentObj = newPayment.toObject();
    paymentObj.paymentScreenshotUrl = `${baseUrl}${paymentObj.paymentScreenshot}`;

    return res.status(201).json({
      success: true,
      message: "Payment details uploaded successfully. Status is pending.",
      payment: paymentObj,
    });
  } catch (error) {
    console.log("Error in user upload payment controller:", error.message);
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Transaction ID already exists",
      });
    }
    return res.status(500).json({
      success: false,
      message: "Error in user upload payment controller",
      error: error.message,
    });
  }
};

const userWithdrawController = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized access",
      });
    }

    const { amount, withdrawMethod, upiId, bankDetails } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "A valid amount is required",
      });
    }

    if (!withdrawMethod || !["upi", "bank"].includes(withdrawMethod)) {
      return res.status(400).json({
        success: false,
        message: "Withdraw method must be 'upi' or 'bank'",
      });
    }

    // ✅ Method-specific validation
    if (withdrawMethod === "upi") {
      if (!upiId) {
        return res.status(400).json({
          success: false,
          message: "UPI ID is required",
        });
      }
    }

    if (withdrawMethod === "bank") {
      const { accountHolderName, accountNumber, ifscCode, bankName } =
        bankDetails ?? {};
      if (!accountHolderName || !accountNumber || !ifscCode || !bankName) {
        return res.status(400).json({
          success: false,
          message:
            "Account holder name, account number, IFSC code, and bank name are required",
        });
      }
    }

    const user = await usermodel.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // ✅ Check balance
    if (user.wallet.availableBalance < amount) {
      return res.status(400).json({
        success: false,
        message: "Insufficient balance",
      });
    }

    // ✅ Deduct balance immediately
    user.wallet.balance -= amount;
    user.wallet.availableBalance = user.wallet.balance - user.wallet.exposure;

    await user.save();

    // ✅ Create withdraw request
    const withdrawData = {
      userId,
      amount: Number(amount),
      withdrawMethod,
    };

    if (withdrawMethod === "upi") {
      withdrawData.upiId = upiId;
    } else {
      withdrawData.bankDetails = {
        accountHolderName: bankDetails.accountHolderName,
        accountNumber: bankDetails.accountNumber,
        ifscCode: bankDetails.ifscCode,
        bankName: bankDetails.bankName,
      };
    }

    const withdraw = new WithdrawRequest(withdrawData);
    await withdraw.save();

    return res.status(201).json({
      success: true,
      message: "Withdraw request submitted successfully",
      withdraw,
    });
  } catch (error) {
    console.log("Withdraw Error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Error in withdraw controller",
      error: error.message,
    });
  }
};

const userWithdrawQrController = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res
        .status(401)
        .json({ success: false, message: "Unauthorized access" });
    }

    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res
        .status(400)
        .json({ success: false, message: "A valid amount is required" });
    }

    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "QR code image is required" });
    }

    const user = await usermodel.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    if (user.wallet.availableBalance < amount) {
      return res
        .status(400)
        .json({ success: false, message: "Insufficient balance" });
    }

    let qrImageUrl;
    try {
      const webpFilename = await convertToWebp(req.file);
      qrImageUrl = `/uploads/${webpFilename}`;
    } catch (convErr) {
      console.log("QR image conversion failed:", convErr.message);
      return res.status(500).json({
        success: false,
        message: "Failed to process uploaded QR code image",
        error: convErr.message,
      });
    }

    user.wallet.balance -= amount;
    user.wallet.availableBalance = user.wallet.balance - user.wallet.exposure;
    await user.save();

    const withdraw = new WithdrawRequest({
      userId,
      amount: Number(amount),
      withdrawMethod: "qr",
      qrImage: qrImageUrl,
    });
    await withdraw.save();

    const baseUrl =
      process.env.BASE_URL || `${req.protocol}://${req.get("host")}`;
    const withdrawObj = withdraw.toObject();
    withdrawObj.qrImageUrl = `${baseUrl}${withdrawObj.qrImage}`;

    return res.status(201).json({
      success: true,
      message: "Withdraw request submitted successfully",
      withdraw: withdrawObj,
    });
  } catch (error) {
    console.log("QR Withdraw Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Error in QR withdraw controller",
      error: error.message,
    });
  }
};

module.exports = {
  walletController,
  getWalletController,
  getScannerController,
  userWithdrawController,
  userUpladPaymentController,
  userWithdrawQrController,
};
