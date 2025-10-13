const mongoose = require('mongoose');

const paymentIntentSchema = new mongoose.Schema({
  merchantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  orderId: {
    type: String,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  sourceCurrency: {
    type: String,
    required: true,
  },
  targetCurrency: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['PENDING', 'PAID', 'SETTLED', 'FAILED'],
    default: 'PENDING',
  },
  checkoutLink: {
    type: String,
  },
  widgetToken: {
    type: String,
  },
  metadata: {
    type: Object,
    default: {},
  },
}, { timestamps: true });

module.exports = mongoose.model('PaymentIntent', paymentIntentSchema);
