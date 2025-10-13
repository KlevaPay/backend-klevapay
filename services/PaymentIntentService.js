const PaymentIntent = require('../models/PaymentInent');
const ApiError = require('../lib/ApiError');
const crypto = require('crypto');

class PaymentIntentService {
  /**
   * Create a new payment intent
   */
  static async createIntent({ merchantId, orderId, amount, sourceCurrency, targetCurrency }) {
    const checkoutId = crypto.randomBytes(8).toString('hex');
    const widgetToken = crypto.randomBytes(16).toString('hex');

    const checkoutLink = `${process.env.FRONTEND_URL || 'https://klevapay.com'}/checkout/${checkoutId}`;

    const paymentIntent = await PaymentIntent.create({
      merchantId,
      orderId,
      amount,
      sourceCurrency,
      targetCurrency,
      checkoutLink,
      widgetToken,
      status: 'PENDING',
      metadata: {
        createdVia: 'API',
        reference: checkoutId,
      },
    });

    return paymentIntent;
  }

  /**
   * Get payment intent by ID
   */
  static async getIntentById(intentId) {
    const intent = await PaymentIntent.findById(intentId);
    if (!intent) throw ApiError.notFound('Payment intent not found');
    return intent;
  }

  /**
   * Update payment status
   */
  static async updateStatus(intentId, newStatus) {
    const validStatuses = ['PENDING', 'PAID', 'SETTLED', 'FAILED'];
    if (!validStatuses.includes(newStatus)) {
      throw ApiError.badRequest('Invalid payment status');
    }

    const intent = await PaymentIntent.findById(intentId);
    if (!intent) throw ApiError.notFound('Payment intent not found');

    intent.status = newStatus;
    await intent.save();

    return intent;
  }
}

module.exports = PaymentIntentService;
