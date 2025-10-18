const express = require('express');
const router = express.Router();
const {
  createPaymentIntent,
  getPaymentIntent,
  updatePaymentStatus,
} = require('../controllers/paymentIntentController');

/**
 * @swagger
 * components:
 *   schemas:
 *     PaymentIntentRequest:
 *       type: object
 *       required:
 *         - walletAddress
 *         - amount
 *         - source_currency
 *         - target_currency
 *       properties:
 *         walletAddress:
 *           type: string
 *           description: Merchant's wallet address (used to find merchant)
 *           example: '0x742E4C8e9b6Ea8B6f7A7C6A1e2D8F3b9C1a4B5E6'
 *         order_id:
 *           type: string
 *           description: Optional order identifier
 *           example: 'ORD-123456'
 *         amount:
 *           type: number
 *           minimum: 0.01
 *           description: Payment amount
 *           example: 1000.50
 *         source_currency:
 *           type: string
 *           description: Currency to pay with
 *           example: 'USD'
 *         target_currency:
 *           type: string
 *           description: Currency to receive
 *           example: 'NGN'
 *     PaymentIntentResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: 'Payment intent created successfully'
 *         data:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *               example: '64f5e8b2a1b2c3d4e5f6g7h8'
 *             checkoutLink:
 *               type: string
 *               format: uri
 *               example: 'https://checkout.klevapay.com/pay/abc123'
 *             widgetToken:
 *               type: string
 *               example: 'wgt_token_abc123xyz'
 *             status:
 *               type: string
 *               example: 'PENDING'
 *             createdAt:
 *               type: string
 *               format: date-time
 *     PaymentStatusUpdate:
 *       type: object
 *       required:
 *         - status
 *       properties:
 *         status:
 *           type: string
 *           description: New payment status
 *           example: 'PAID'
 */

/**
 * @swagger
 * /api/payment-intents:
 *   post:
 *     tags: [Payment Intents]
 *     summary: Create a new payment intent
 *     description: Create a payment intent using merchant's wallet address to identify the merchant
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PaymentIntentRequest'
 *           examples:
 *             basic_payment:
 *               summary: Basic payment intent
 *               value:
 *                 walletAddress: "0x742E4C8e9b6Ea8B6f7A7C6A1e2D8F3b9C1a4B5E6"
 *                 amount: 1000.50
 *                 source_currency: "USD"
 *                 target_currency: "NGN"
 *             with_order_id:
 *               summary: Payment intent with order ID
 *               value:
 *                 walletAddress: "0x742E4C8e9b6Ea8B6f7A7C6A1e2D8F3b9C1a4B5E6"
 *                 order_id: "ORD-2023-001"
 *                 amount: 29.99
 *                 source_currency: "USD"
 *                 target_currency: "NGN"
 *     responses:
 *       201:
 *         description: Payment intent created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaymentIntentResponse'
 *       400:
 *         description: Invalid request data or missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Wallet address is required"
 *       404:
 *         description: Merchant not found for the provided wallet address
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Merchant not found for this wallet"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.post('/', createPaymentIntent);

/**
 * @swagger
 * /api/payment-intents/{id}:
 *   get:
 *     tags: [Payment Intents]
 *     summary: Get payment intent details
 *     description: Retrieve detailed information about a specific payment intent by its ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Payment intent unique identifier
 *         example: '64f5e8b2a1b2c3d4e5f6g7h8'
 *     responses:
 *       200:
 *         description: Payment intent retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: 'Payment intent retrieved successfully'
 *                 data:
 *                   $ref: '#/components/schemas/PaymentIntent'
 *       404:
 *         description: Payment intent not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.get('/:id', getPaymentIntent);

/**
 * @swagger
 * /api/payment-intents/{id}/status:
 *   patch:
 *     tags: [Payment Intents]
 *     summary: Update payment intent status
 *     description: Update the status of a payment intent (typically called by payment providers or webhooks)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Payment intent unique identifier
 *         example: '64f5e8b2a1b2c3d4e5f6g7h8'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PaymentStatusUpdate'
 *           examples:
 *             payment_success:
 *               summary: Mark payment as paid
 *               value:
 *                 status: "PAID"
 *             payment_failure:
 *               summary: Mark payment as failed
 *               value:
 *                 status: "FAILED"
 *     responses:
 *       200:
 *         description: Payment status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: 'Payment status updated to PAID'
 *                 data:
 *                   $ref: '#/components/schemas/PaymentIntent'
 *       400:
 *         description: Invalid status or request data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       404:
 *         description: Payment intent not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.patch('/:id/status', updatePaymentStatus);

module.exports = router;
