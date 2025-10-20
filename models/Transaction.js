// models/Transaction.js
const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  merchantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Merchant', required: true },
  merchantWalletAddress: { type: String, index: true },

  reference: { type: String, required: true, index: true }, // legacy tx_ref
  transactionReference: {
    type: String,
    index: true,
    default: function transactionReferenceDefault() {
      return this.reference;
    }
  },

  payer: { type: String, index: true },
  fiatOrTokenType: {
    type: String,
    enum: ['FIAT', 'CRYPTO'],
    required: true,
    uppercase: true
  },
  paymentType: { type: String },

  amount: { type: Number, required: true },
  amountInMinor: { type: String },
  fiatEquivalent: { type: Number },
  fiatCurrency: { type: String, default: 'NGN' },
  chargeFee: { type: Number, default: 0 },
  symbol: { type: String },
  currency: { type: String, default: 'NGN' },

  method: {
    type: String,
    enum: ['CARD', 'BANK', 'WALLET', 'CRYPTO', 'FIAT'],
    required: true,
    uppercase: true
  },
  provider: {
    type: String,
    enum: ['CONTRACT', 'FLUTTERWAVE', 'OPAY', 'MANUAL'],
    default: 'CONTRACT',
    uppercase: true
  },
  status: {
    type: String,
    enum: ['PENDING', 'PAID', 'SETTLED', 'FAILED', 'SUCCESS', 'PROCESSING'],
    default: 'PENDING',
    uppercase: true
  },

  eventTimestamp: { type: Date },
  recordedAt: { type: Date },

  blockchain: {
    transactionHash: { type: String, index: true },
    blockNumber: { type: Number },
    network: { type: String }
  },

  opayReference: { type: String },
  providerResponse: { type: Object },
  metadata: { type: Object, default: {} }
}, { timestamps: true });

transactionSchema.index({ merchantId: 1, reference: 1 });
transactionSchema.index({ merchantWalletAddress: 1, eventTimestamp: -1 });
transactionSchema.index({ payer: 1, eventTimestamp: -1 });

module.exports = mongoose.model('Transaction', transactionSchema);
