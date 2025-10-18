const express = require('express');
const router = express.Router();
const {
  createPaymentIntent,
  getPaymentIntent,
  updatePaymentStatus,
} = require('../controllers/paymentIntentController');

/**
 * @swagger
 * /api/payment-intents:
 *   post:
 *     tags: [Payment Intents]
 *     summary: Create a new payment intent
 *     description: Creates a new payment intent for processing a payment transaction
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *               - currency
 *               - merchantId
 *             properties:
 *               amount:
 *                 type: number
 *                 description: Payment amount
 *                 example: 1000.50
 *               currency:
 *                 type: string
 *                 enum: [NGN, USD, EUR, USDT, BTC, ETH]
 *                 description: Payment currency
 *                 example: "NGN"
 *               merchantId:
 *                 type: string
 *                 description: Merchant identifier
 *                 example: "64f5e8b2a1b2c3d4e5f6g7h8"
 *               description:
 *                 type: string
 *                 description: Payment description
 *                 example: "Payment for order #12345"
 *               metadata:
 *                 type: object
 *                 description: Additional payment metadata
 *                 example: {"orderId": "12345", "customerId": "cust_123"}
 *     responses:
 *       201:
 *         description: Payment intent created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Bad request - Invalid input data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       401:
 *         description: Unauthorized - Invalid or missing authentication
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
 *     summary: Get payment intent by ID
 *     description: Retrieves a specific payment intent by its unique identifier
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Payment intent unique identifier
 *         example: "64f5e8b2a1b2c3d4e5f6g7h8"
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
 *                 data:
 *                   $ref: '#/components/schemas/PaymentIntent'
 *       404:
 *         description: Payment intent not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       401:
 *         description: Unauthorized - Invalid or missing authentication
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
 *     description: Updates the status of a specific payment intent
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Payment intent unique identifier
 *         example: "64f5e8b2a1b2c3d4e5f6g7h8"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, processing, succeeded, failed, cancelled]
 *                 description: New payment status
 *                 example: "succeeded"
 *               failureReason:
 *                 type: string
 *                 description: Reason for failure (required when status is 'failed')
 *                 example: "Insufficient funds"
 *     responses:
 *       200:
 *         description: Payment intent status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Bad request - Invalid status or missing required fields
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
 *       401:
 *         description: Unauthorized - Invalid or missing authentication
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.patch('/:id/status', updatePaymentStatus);

module.exports = router;
