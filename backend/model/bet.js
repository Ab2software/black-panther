const mongoose = require("mongoose");

const betSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    betId: {
      type: String,
      required: true,
      unique: true,
    },

    matchName: String,
    marketId: String,
    eventId: String,

    sport: String,
    eventTypeId: String,

    selectionName: String,
    sectionTeam: String,

    side: {
      type: String,
      enum: ["back", "lay"],
      required: true,
    },
    
    siteId: {
      type: String,
      required: true,
      default: "yodha365",
      index: true,
    },
    
    price: Number,
    rate: Number,
    
    // ✅ Fancy bet fields
    fancyRate: {
      type: Number,
      default: null,
    },
    fancyPrice: {
      type: Number,
      default: null,
    },
    
    // ✅ Is this a fancy bet?
    isFancy: {
      type: Boolean,
      default: false,
    },
    
    stake: {
      type: Number,
      required: true,
      min: 0,
    },
    
    // ✅ CORRECT liability (for lay bets: stake * (odds - 1))
    liability: {
      type: Number,
      default: 0,
    },
    
    exposureCutPercent: {
      type: Number,
      default: 100,
    },
    
    // ✅ Actual exposure blocked (after cross bet netting)
    blockedExposure: {
      type: Number,
      default: 0,
    },
    
    // ✅ Net exposure after cross bets
    netExposure: {
      type: Number,
      default: 0,
    },
    
    // ✅ Cross bet tracking
    isCrossBet: {
      type: Boolean,
      default: false,
    },
    crossBetDetails: {
      type: Array,
      default: [],
    },
    
    // ✅ Exposure snapshots
    exposureBefore: {
      type: Number,
      default: null,
    },
    exposureAfter: {
      type: Number,
      default: null,
    },
    
    balanceAfter: {
      type: Number,
      default: null,
    },
    balanceBefore: {
      type: Number,
      default: null,
    },

    website: String,

    status: {
      type: String,
      enum: [
        "Pending",
        "Won",
        "Lost",
        "Void",
        "Cancelled",
        "Invalid",
        "CashOut",
        "LossCut",
      ],
      default: "Pending",
      index: true,
    },

    // ------------------
    // CASH OUT
    // ------------------

    cashOutEnabled: {
      type: Boolean,
      default: true,
    },

    cashOutValue: {
      type: Number,
      default: 0,
    },

    cashOutAt: Date,

    // ------------------
    // LOSS CUT
    // ------------------

    lossCutEnabled: {
      type: Boolean,
      default: false,
    },

    lossCutPercent: {
      type: Number,
      default: 0,
    },

    // ------------------
    // SETTLEMENT
    // ------------------

    settlementResponse: mongoose.Schema.Types.Mixed,

    settledAt: Date,

    profitLoss: {
      type: Number,
      default: 0,
    },
    
    overAtPlacement: { type: String, default: null },
  },
  { timestamps: true },
);

// ================= INDEXES =================
betSchema.index({ userId: 1, status: 1 });
betSchema.index({ eventId: 1 });
betSchema.index({ userId: 1, eventId: 1, sectionTeam: 1 });
betSchema.index({ userId: 1, isCrossBet: 1 });

module.exports = mongoose.model("Bet", betSchema);