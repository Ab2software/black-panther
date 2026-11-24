const mongoose = require("mongoose");

const chipTransactionSchema = new mongoose.Schema(
  {
    // Who initiated the transfer
    fromUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Who received / lost chips
    toUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // "give" = fromUser sends chips to toUser
    // "take" = fromUser takes chips back from toUser
    type: {
      type: String,
      enum: ["give", "take"],
      required: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 1,
    },

    // Snapshot balances AFTER the transaction (for audit trail)
    fromBalanceAfter: { type: Number, default: 0 },
    toBalanceAfter:   { type: Number, default: 0 },

    remark: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { timestamps: true }
);

chipTransactionSchema.index({ fromUserId: 1, createdAt: -1 });
chipTransactionSchema.index({ toUserId:   1, createdAt: -1 });

module.exports = mongoose.model("ChipTransaction", chipTransactionSchema);