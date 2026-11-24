const PaymentRequest = require("../../model/PaymentRequest");
const usermodel = require("../../model/User");
const WithdrawRequest = require("../../model/WithdrawRequest");

// ============================================================
// HELPER: resolve the set of admin IDs this admin can see data for.
// = themself + any sub-admins (role: "admin") they personally created.
// Assumes a max 2-level hierarchy (superadmin -> admin -> user).
// ============================================================
const getScopeIds = async (adminId) => {
  const subAdminIds = await usermodel
    .find({ createdBy: adminId, role: "admin" })
    .distinct("_id");
  return [adminId, ...subAdminIds];
};

const getAllTransactions = async (req, res) => {
  try {
    const adminId = req.user?.id;
    if (!adminId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const admin = await usermodel.findById(adminId);
    if (!admin || (admin.role !== "admin" && admin.role !== "superadmin")) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    // ✅ Scope = this admin + their own sub-admins (works for both
    // plain admins and superadmins with a downline)
    const scopeIds = await getScopeIds(admin._id);

    const userFilter = {
      role: "user",
      deletedAt: null,
      assignedAdmin: { $in: scopeIds },
    };

    const userIds = await usermodel.distinct("_id", userFilter);

    const transactions = await PaymentRequest.find({
      userId: { $in: userIds },
    })
      .sort({ createdAt: -1 })
      .populate("userId", "username fullName email phone");

    const baseUrl =
      process.env.BACKEND_URL || `${req.protocol}://${req.get("host")}`;

    const result = transactions.map((t) => {
      const obj = t.toObject();
      if (obj.paymentScreenshot?.startsWith("/uploads/")) {
        obj.paymentScreenshotUrl = baseUrl + obj.paymentScreenshot;
      }
      return obj;
    });

    return res.status(200).json({
      success: true,
      transactions: result,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

const getUserAccountStatement = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized access",
      });
    }

    // ✅ Deposits
    const deposits = await PaymentRequest.find({
      userId,
    }).sort({ createdAt: -1 });

    // ✅ Withdraws
    const withdraws = await WithdrawRequest.find({
      userId,
    }).sort({ createdAt: -1 });

    const baseUrl = `${req.protocol}://${req.get("host")}`;

    // Format deposits
    const formattedDeposits = deposits.map((txn) => {
      const txnObj = txn.toObject();

      txnObj.type = "deposit";

      if (
        txnObj.paymentScreenshot &&
        txnObj.paymentScreenshot.startsWith("/uploads/")
      ) {
        txnObj.paymentScreenshotUrl = `${baseUrl}${txnObj.paymentScreenshot}`;
      }

      return txnObj;
    });

    // Format withdraws
    const formattedWithdraws = withdraws.map((txn) => {
      const txnObj = txn.toObject();

      txnObj.type = "withdraw";

      // ✅ build full URL for approval proof image, same pattern as deposit screenshot
      if (txnObj.proofImage && txnObj.proofImage.startsWith("/uploads/")) {
        txnObj.proofImageUrl = `${baseUrl}${txnObj.proofImage}`;
      }

      return txnObj;
    });

    // Combine + sort latest first
    const combined = [...formattedDeposits, ...formattedWithdraws].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
    );

    return res.status(200).json({
      success: true,
      transactions: combined,
    });
  } catch (error) {
    console.log("Error in get user account statement:", error.message);

    return res.status(500).json({
      success: false,
      message: "Error fetching account statement",
      error: error.message,
    });
  }
};

/// update transaction status controller (deposits)
const updateTransactionStatus = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized access",
      });
    }

    const admin = await usermodel.findById(userId);

    if (!admin || (admin.role !== "admin" && admin.role !== "superadmin")) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only admin can update transactions.",
      });
    }

    const { id } = req.params;
    const { status, remark } = req.body;

    if (!status || !["approved", "rejected"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status",
      });
    }

    // ✅ Remark required on reject
    if (status === "rejected" && (!remark || !remark.trim())) {
      return res.status(400).json({
        success: false,
        message: "A remark is required when rejecting a deposit request",
      });
    }

    const transactionPreview = await PaymentRequest.findById(id);

    if (!transactionPreview) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found",
      });
    }

    const user = await usermodel.findById(transactionPreview.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // ✅ Ownership check: user must belong to this admin OR one of their
    // sub-admins. Applies to superadmin and admin alike — no role bypass.
    const scopeIds = (await getScopeIds(admin._id)).map(String);
    if (!user.assignedAdmin || !scopeIds.includes(String(user.assignedAdmin))) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized access",
      });
    }

    // =========================
    // 🔒 ATOMIC CLAIM — only one concurrent request can move this
    // transaction out of "pending". Prevents double-approve /
    // double-reject from two racing admin clicks or retried requests.
    // =========================
    const claimUpdate = { status };
    if (status === "rejected") {
      claimUpdate.adminRemark = remark.trim();
    }

    const transaction = await PaymentRequest.findOneAndUpdate(
      { _id: id, status: "pending" },
      { $set: claimUpdate },
      { new: true },
    );

    if (!transaction) {
      return res.status(400).json({
        success: false,
        message: "Transaction already processed",
      });
    }

    // =========================
    // 💰 HANDLE APPROVAL
    // =========================
    if (status === "approved") {
      const responsibleAdminId = user.assignedAdmin || admin._id;
      const responsibleAdmin = await usermodel.findById(responsibleAdminId);

      if (!responsibleAdmin) {
        // Roll back the claim — nothing was moved, so this transaction
        // should go back to pending rather than be stuck "approved"
        // with no money actually transferred.
        await PaymentRequest.updateOne(
          { _id: id },
          { $set: { status: "pending" }, $unset: { adminRemark: "" } },
        );
        return res.status(404).json({
          success: false,
          message: "Responsible admin not found for this user",
        });
      }

      const adminAvailable =
        responsibleAdmin.wallet.balance - responsibleAdmin.wallet.exposure;

      if (adminAvailable < transaction.price) {
        // Same rollback — insufficient admin chips, undo the claim.
        await PaymentRequest.updateOne(
          { _id: id },
          { $set: { status: "pending" } },
        );
        return res.status(400).json({
          success: false,
          message:
            "Admin does not have enough chip balance to approve this deposit",
          available: adminAvailable,
        });
      }

      // Cut chips from the responsible admin
      await usermodel.findByIdAndUpdate(responsibleAdminId, {
        $inc: {
          "wallet.balance": -transaction.price,
          "wallet.availableBalance": -transaction.price,
        },
      });

      // Credit the depositing user
      await usermodel.findByIdAndUpdate(user._id, {
        $inc: {
          "wallet.balance": transaction.price,
          "wallet.availableBalance": transaction.price,
        },
      });
    }

    return res.status(200).json({
      success: true,
      message: `Transaction ${status} successfully`,
      transaction,
    });
  } catch (error) {
    console.log(
      "Error in update transaction status controller:",
      error.message,
    );

    return res.status(500).json({
      success: false,
      message: "Error updating transaction status",
      error: error.message,
    });
  }
};

const getAllWithdrawRequests = async (req, res) => {
  try {
    const adminId = req.user?.id;

    const admin = await usermodel.findById(adminId);

    if (!admin || !["admin", "superadmin"].includes(admin.role)) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    // =========================
    // STEP 1: FILTER USERS
    // ✅ Scope = this admin + their own sub-admins
    // =========================
    const scopeIds = await getScopeIds(admin._id);

    const userFilter = {
      role: "user",
      deletedAt: null,
      assignedAdmin: { $in: scopeIds },
    };

    const userIds = await usermodel.distinct("_id", userFilter);

    // =========================
    // STEP 2: GET WITHDRAWALS
    // =========================
    const withdraws = await WithdrawRequest.find({
      userId: { $in: userIds },
    })
      .sort({ createdAt: -1 })
      .populate("userId", "username fullName phone email wallet")
      .populate("adminId", "username role");

    const baseUrl =
      process.env.BACKEND_URL || `${req.protocol}://${req.get("host")}`;

    const result = withdraws.map((w) => {
      const obj = w.toObject();
      if (obj.proofImage?.startsWith("/uploads/")) {
        obj.proofImageUrl = baseUrl + obj.proofImage;
      }
      if (obj.qrImage?.startsWith("/uploads/")) {
        obj.qrImageUrl = baseUrl + obj.qrImage;
      }
      return obj;
    });

    return res.status(200).json({
      success: true,
      withdraws: result,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const updateWithdrawStatus = async (req, res) => {
  try {
    const adminId = req.user?.id;

    const admin = await usermodel.findById(adminId);

    if (!admin || !["admin", "superadmin"].includes(admin.role)) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const { id } = req.params;
    const { status, reason } = req.body;

    if (!status || !["approved", "rejected"].includes(status)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid status" });
    }

    // ✅ Reject requires a reason (unchanged from before — already enforced)
    if (status === "rejected" && (!reason || !reason.trim())) {
      return res.status(400).json({
        success: false,
        message: "A rejection reason is required",
      });
    }

    // ✅ Approve requires proof image — check up front before claiming,
    // so a failed upload doesn't burn the atomic claim below.
    if (status === "approved" && !req.file) {
      return res.status(400).json({
        success: false,
        message: "Proof of payment image is required to approve",
      });
    }

    const withdrawPreview = await WithdrawRequest.findById(id);

    if (!withdrawPreview) {
      return res.status(404).json({ message: "Not found" });
    }

    const user = await usermodel.findById(withdrawPreview.userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // 🔒 Ownership check: user must belong to this admin OR one of their
    // sub-admins. Applies to superadmin and admin alike — no role bypass.
    const scopeIds = (await getScopeIds(admin._id)).map(String);
    if (!user.assignedAdmin || !scopeIds.includes(String(user.assignedAdmin))) {
      return res.status(403).json({
        message: "Not allowed for this user",
      });
    }

    // =========================
    // 🔒 ATOMIC CLAIM — prevents double-processing the same withdraw
    // (e.g. two admin tabs open, or a retried request).
    // =========================
    const claimUpdate = { status };
    if (status === "rejected") {
      claimUpdate.rejectReason = reason.trim();
    }
    if (status === "approved") {
      claimUpdate.proofImage = `/uploads/${req.file.filename}`;
    }

    const withdraw = await WithdrawRequest.findOneAndUpdate(
      { _id: id, status: "pending" },
      { $set: claimUpdate },
      { new: true },
    );

    if (!withdraw) {
      return res.status(400).json({ message: "Already processed" });
    }

    // =========================
    // ❌ REJECT — refund the held amount back to the user
    // =========================
    if (status === "rejected") {
      await usermodel.findByIdAndUpdate(user._id, {
        $inc: { "wallet.balance": withdraw.amount },
      });

      const refreshedUser = await usermodel.findById(user._id).select("wallet");
      const availableBalance = Math.max(
        0,
        refreshedUser.wallet.balance - refreshedUser.wallet.exposure,
      );
      await usermodel.updateOne(
        { _id: user._id },
        { $set: { "wallet.availableBalance": availableBalance } },
      );
    }

    // =========================
    // ✅ APPROVE — credit the responsible admin's chips back
    // =========================
    if (status === "approved") {
      const responsibleAdminId = user.assignedAdmin || admin._id;

      const updatedAdmin = await usermodel.findByIdAndUpdate(
        responsibleAdminId,
        {
          $inc: {
            "wallet.balance": withdraw.amount,
            "wallet.availableBalance": withdraw.amount,
          },
        },
        { new: true },
      );

      if (!updatedAdmin) {
        // Roll back the claim — admin chip credit failed, don't leave
        // the withdraw stuck "approved" with no compensating credit.
        await WithdrawRequest.updateOne(
          { _id: id },
          {
            $set: { status: "pending" },
            $unset: { proofImage: "" },
          },
        );
        return res.status(404).json({
          success: false,
          message: "Responsible admin not found for this user",
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: "Updated successfully",
      withdraw,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

module.exports = {
  getAllTransactions,
  updateTransactionStatus,
  getAllWithdrawRequests,
  updateWithdrawStatus,
  getUserAccountStatement,
};
