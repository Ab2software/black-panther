const mongoose = require('mongoose');

const paymentRequestSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  transactionId: {
    type: String,
    required: true,
    unique: true
  },
  paymentScreenshot: {
    type: String,
    // ✅ only required for real user-submitted deposits — an admin chip
    // transfer has no screenshot to attach
    required: function () {
      return this.source !== 'admin_chip_transfer';
    }
  },
  method: {
    type: String,
    enum: ['upi', 'bank', 'admin_chip_transfer'],
    default: 'upi'
  },
  // ✅ distinguishes a real deposit request from an admin giving chips
  // directly — lets the UI label/filter them differently
  source: {
    type: String,
    enum: ['user_deposit', 'admin_chip_transfer'],
    default: 'user_deposit'
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  adminRemark: {
    type: String,
    default: ''
  }
}, { timestamps: true });

module.exports = mongoose.model('PaymentRequest', paymentRequestSchema);