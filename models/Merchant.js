
const mongoose = require('mongoose');

const merchantSchema = new mongoose.Schema({
  walletAddress: {
    type: String,
    required: [true, 'Wallet address is required'],
    unique: true,
    index: true,
    lowercase: true,
    trim: true
  },

  businessName: {
    type: String,
    required: [true, 'Business name is required'],
    unique: true,
    trim: true,
    minlength: [2, 'Business name must be at least 2 characters'],
    maxlength: [100, 'Business name must not exceed 100 characters']
  },

  payoutPreferences: {
    currency: {
      type: String,
      default: 'NGN',
      enum: ['NGN', 'USD', 'EUR', 'USDT', 'BTC', 'ETH'],
    },
    method: {
      type: String,
      default: 'bank_transfer',
      enum: ['bank_transfer', 'mobile_money', 'crypto']
    },
    accountDetails: {
      bankName: String,
      accountNumber: String,
      accountName: String,
      routingNumber: String
    }
  },

  kycStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },

  country: {
    type: String,
    default: 'Nigeria',
    trim: true
  }
}, {
  timestamps: true,
  toJSON: {
    transform: (doc, ret) => {
      delete ret.__v;
      return ret;
    }
  }
});


const Merchant = mongoose.model('Merchant', merchantSchema);
module.exports = Merchant;
