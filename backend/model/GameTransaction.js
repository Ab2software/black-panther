// model/GameTransaction.js

const mongoose = require("mongoose");

const gameTransactionSchema = new mongoose.Schema(
  {
    gameRound: {
      type: String,
      required: true,
    },

    serialNumber: {
      type: String,
      unique: true,
      required: true,
    },

    gameUid: String,

    gameName: String,

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    providerUserId: Number,

    betAmount: {
      type: Number,
      default: 0,
    },

    winAmount: {
      type: Number,
      default: 0,
    },

    balanceBefore: Number,

    balanceAfter: Number,

    result: {
      type: String,
      enum: ["WIN", "LOSS", "DRAW", "PENDING", "VOID"],
      default: "PENDING",
    },

    // ✅ NEW — free-text note on why a transaction was manually resolved,
    // for audit trail on any VOID (or other manual) resolution
    resolutionNote: {
      type: String,
      default: null,
    },

    nation: {
      type: String,
      default: null, // e.g. "3 Card Total-90", "Mogambo-Main"
    },
    rate: {
      type: Number,
      default: null, // odds/rate for this selection
    },
    ip: {
      type: String,
      default: null,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },

    roundTime: String,
  },
  {
    timestamps: true,
  },
);
gameTransactionSchema.index({ userId: 1, createdAt: -1 });
module.exports = mongoose.model("GameTransaction", gameTransactionSchema);
