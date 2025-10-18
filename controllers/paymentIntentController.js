const { asyncHandler } = require('../middlewares/errorHandler');
const PaymentIntentService = require('../services/PaymentIntentService');
const Merchant = require('../models/Merchant');
const logger = require('../lib/logger');

/**
 * @desc Create a new payment intent (linked by wallet)
 * @route POST /api/payment-intents
 */
exports.createPaymentIntent = asyncHandler(async (req, res) => {
  const { walletAddress, order_id, amount, source_currency, target_currency } = req.body;

  if (!walletAddress) {
    return res.status(400).json({ success: false, message: 'Wallet address is required' });
  }

  // Find merchant by wallet address
  const merchant = await Merchant.findOne({ walletAddress: walletAddress.toLowerCase() });
  if (!merchant) {
    return res.status(404).json({ success: false, message: 'Merchant not found for this wallet' });
  }

  // Create payment intent
  const paymentIntent = await PaymentIntentService.createIntent({
    merchantId: merchant._id,
    orderId: order_id,
    amount,
    sourceCurrency: source_currency,
    targetCurrency: target_currency,
  });

  logger.info('Payment intent created', { id: paymentIntent._id, walletAddress });

  res.status(201).json({
    success: true,
    message: 'Payment intent created successfully',
    data: {
      id: paymentIntent._id,
      checkoutLink: paymentIntent.checkoutLink,
      widgetToken: paymentIntent.widgetToken,
      status: paymentIntent.status,
      createdAt: paymentIntent.createdAt,
    },
  });
});

/**
 * @desc Get payment intent details
 * @route GET /api/payment-intents/:id
 */
exports.getPaymentIntent = asyncHandler(async (req, res) => {
  const intent = await PaymentIntentService.getIntentById(req.params.id);
  res.json({
    success: true,
    message: 'Payment intent fetched successfully',
    data: intent,
  });
});

/**
 * @desc Update payment status
 * @route PATCH /api/payment-intents/:id/status
 */
exports.updatePaymentStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const intent = await PaymentIntentService.updateStatus(req.params.id, status);

  logger.info('Payment status updated', { id: intent._id, status });

  res.json({
    success: true,
    message: `Payment status updated to ${status}`,
    data: intent,
  });
});
