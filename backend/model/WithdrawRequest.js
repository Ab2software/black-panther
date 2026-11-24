const mongoose = require("mongoose");

const withdrawRequestSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  amount: {
    type: Number,
    required: true,
  },

  withdrawMethod: {
    type: String,
    enum: ["upi", "bank", "qr", "admin_chip_transfer"],
    required: true,
    default: "upi",
  },

  upiId: {
    type: String,
    required: function () {
      return this.withdrawMethod === "upi";
    },
  },

  bankDetails: {
    accountHolderName: {
      type: String,
      required: function () {
        return this.withdrawMethod === "bank";
      },
    },
    accountNumber: {
      type: String,
      required: function () {
        return this.withdrawMethod === "bank";
      },
    },
    ifscCode: {
      type: String,
      required: function () {
        return this.withdrawMethod === "bank";
      },
    },
    bankName: {
      type: String,
      required: function () {
        return this.withdrawMethod === "bank";
      },
    },
  },

  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending",
  },

  qrImage: {
    type: String,
    required: function () {
      return this.withdrawMethod === "qr";
    },
  },

  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },

  remark: {
    type: String,
    default: "",
    trim: true,
  },

  rejectReason: {
    type: String,
    default: "",
    trim: true,
  },
}, { timestamps: true });

module.exports = mongoose.model("WithdrawRequest", withdrawRequestSchema);