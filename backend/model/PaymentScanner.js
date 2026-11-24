const mongoose = require('mongoose');

const paymentScannerSchema = new mongoose.Schema({
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  scannerImage: {
    type: String,
    required: true
  },
  upiId: {
    type: String,
    required: true
  },
  label: {
    type: String,
    default: ''
  },
  isActive: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

// Speeds up the two hot queries: "all scanners for admin" and "active scanner for admin"
paymentScannerSchema.index({ adminId: 1, isActive: 1 });

module.exports = mongoose.model('PaymentScanner', paymentScannerSchema);