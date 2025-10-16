// models/Transaction.js
const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  merchantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Merchant', required: true },
  reference: { type: String, required: true, index: true }, // tx_ref
  amount: { type: Number, required: true },
  currency: { type: String, default: 'NGN' },
  method: { type: String, enum: ['CARD', 'BANK', 'WALLET'], required: true },
  status: { type: String, enum: ['PENDING', 'PAID', 'SETTLED', 'FAILED'], default: 'PENDING' },
  opayReference: { type: String },
  providerResponse: { type: Object },
  metadata: { type: Object, default: {} },
}, { timestamps: true });

module.exports = mongoose.model('Transaction', transactionSchema);
