// models/Merchant.js
const mongoose = require('mongoose');

const merchantSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String },
  businessName: { type: String },
  bankAccount: {
    bankCode: String,
    accountNumber: String,
    beneficiaryName: String,
  },
  walletId: { type: String },
  metadata: { type: Object, default: {} },
}, { timestamps: true });

module.exports = mongoose.model('Merchant', merchantSchema);
