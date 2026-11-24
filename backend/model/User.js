const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// ================= SUB SCHEMAS =================

// Wallet
const walletSchema = new mongoose.Schema({
  balance: { type: Number, default: 0 },
  exposure: { type: Number, default: 0 },          // sports
  casinoExposure: { type: Number, default: 0 },     // casino
  totalLiability: { type: Number, default: 0 },
  availableBalance: { type: Number, default: 0 },
  bonusBalance: { type: Number, default: 0 },
  totalProfit: { type: Number, default: 0 },
  totalLoss: { type: Number, default: 0 },
}, { _id: false });

// Betting Limits
const bettingLimitsSchema = new mongoose.Schema({
  minBet: { type: Number, default: 100 },
  maxBet: { type: Number, default: 200000 },
  maxExposure: { type: Number, default: 500000 },
  maxProfit: { type: Number, default: 500000 },
  minOdds: { type: Number, default: 1.01 },
  maxOdds: { type: Number, default: 100 },
  // ✅ ADD: Fancy specific limits
  minFancyRate: { type: Number, default: 1 },
  maxFancyRate: { type: Number, default: 1000 },
  // % of real liability actually blocked in wallet.exposure.
  exposureCuttingPercent: { type: Number, default: 100, min: 0, max: 100 },
}, { _id: false });

// Permissions
const permissionsSchema = new mongoose.Schema({
  canLogin: { type: Boolean, default: true },
  canBet: { type: Boolean, default: true },
  canWithdraw: { type: Boolean, default: true },
  canDeposit: { type: Boolean, default: true },
  canCreateUser: { type: Boolean, default: false },
  isBetLocked: { type: Boolean, default: false },
  isAccountLocked: { type: Boolean, default: false },
}, { _id: false });

// Bank
const bankSchema = new mongoose.Schema({
  accountHolderName: String,
  accountNumber: String,
  ifscCode: String,
  bankName: String,
}, { _id: false });

// UPI
const upiSchema = new mongoose.Schema({
  upiId: String,
}, { _id: false });

// ================= MAIN USER SCHEMA =================

const userSchema = new mongoose.Schema({

  // ===== BASIC INFO =====
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true
  },

  fullName: { type: String, default: "" },
  email: { type: String, default: "", lowercase: true },
  phone: { type: String, default: "" },

  // ===== AUTH =====
  password: {
    type: String,
    required: function () {
      return !this.isDemoUser;
    },
    select: false
  },

  // ===== ROLE SYSTEM =====
  role: {
    type: String,
    enum: ["owner", "superadmin", "admin", "subadmin", "master", "agent", "user"],
    default: "user",
    index: true
  },

  // ===== HIERARCHY (IMPORTANT) =====
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
    index: true
  },

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null
  },

  // Direct counts (fast queries)
  downlineCount: { type: Number, default: 0 },
  directUserCount: { type: Number, default: 0 },
  directAgentCount: { type: Number, default: 0 },

  // ===== DEMO USER =====
  isDemoUser: {
    type: Boolean,
    default: false,
    index: true
  },

  demoExpiresAt: {
    type: Date,
    default: null
  },

  // ===== WALLET =====
  wallet: {
    type: walletSchema,
    default: () => ({})
  },

  // ✅ ADD: Credit Limit for negative balance
  creditLimit: {
    type: Number,
    default: 0, // 0 = no credit facility
    min: 0,
  },

  creditReference: {
    type: Number,
    default: 0
  },

  // ===== BETTING CONTROL =====
  bettingLimits: {
    type: bettingLimitsSchema,
    default: () => ({})
  },

  permissions: {
    type: permissionsSchema,
    default: () => ({})
  },

  // ===== COMMISSION / SHARE =====
  commission: {
    type: Number,
    default: 0
  },

  partnership: {
    type: Number,
    default: 0
  },

  // ===== PAYMENT =====
  bankDetails: {
    type: bankSchema,
    default: () => ({})
  },

  upiDetails: {
    type: upiSchema,
    default: () => ({})
  },

  loginIp: { type: String, default: "" },
  lastLoginAt: { type: Date, default: null },

  // ===== STATUS =====
  status: {
    type: String,
    enum: ["active", "blocked", "suspended"],
    default: "active",
    index: true
  },

  isVerified: {
    type: Boolean,
    default: false
  },

  // ===== STATS =====
  stats: {
    totalBets: { type: Number, default: 0 },
    totalWins: { type: Number, default: 0 },
    totalLosses: { type: Number, default: 0 },
  },
  
  providerUserId: {
    type: Number,
    unique: true,
    index: true,
    sparse: true,
  },
  
  assignedAdmin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
    index: true
  },

  adminStatus: {
    type: String,
    enum: ["active", "inactive"],
    default: "inactive",
    index: true
  },
  
  sessionToken: {
    type: String,
    default: null,
  },
  
  mustChangePassword: {
    type: Boolean,
    default: false,
  },
  
  whatsapp: { type: String, default: "" },
  
  siteId: {
    type: String,
    required: false,
    enum: ['blackpanther', 'eagleexchang'],
    default: 'blackpanther',
    index: true
  },
  
  // ===== FLAGS =====
  deletedAt: { type: Date, default: null },

}, { timestamps: true });

// ================= MIDDLEWARE =================

// Hash password + wallet calc
userSchema.pre("save", async function () {
  try {
    if (this.isNew && !this.providerUserId) {
      this.providerUserId = parseInt(Date.now().toString().slice(-7) + Math.floor(Math.random() * 100));
    }

    if (this.isModified("password") && !this.isDemoUser) {
      this.password = await bcrypt.hash(this.password, 10);
    }

    // Round amounts to 2 decimals for consistency with backend
    const roundAmount = (amount) => {
      if (amount === null || amount === undefined) return 0;
      return Math.round(Number(amount) * 100) / 100;
    };
    
    // Calculate and round availableBalance
    this.wallet.availableBalance = roundAmount(
      Math.max(
        0,
        (this.wallet.balance || 0) - (this.wallet.exposure || 0) - (this.wallet.casinoExposure || 0)
      )
    );
  } catch (err) {
    console.error("Error in pre-save:", err);
  }
});

// ================= METHODS =================

// Compare password
userSchema.methods.comparePassword = async function (password) {
  if (this.isDemoUser) return false;
  return bcrypt.compare(password, this.password);
};

// ================= EXPORT =================
module.exports = mongoose.model("User", userSchema);