const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authmiddleware');

const {
  createPayment,
  checkStatus,
  handleRedirect,
  handleWebhook,
} = require("../controllers/paymentIntegrationControllers");

/**
 * @swagger
 * /api/pay/create-payment:
 *   post:
 *     tags: [Payment Integration]
 *     summary: Create a new payment transaction
 *     description: Initiates a new payment transaction through integrated payment gateways (Flutterwave, OPay)
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
 *               - customer
 *               - gateway
 *             properties:
 *               amount:
 *                 type: number
 *                 description: Payment amount
 *                 example: 5000.00
 *               currency:
 *                 type: string
 *                 enum: [NGN, USD, EUR]
 *                 description: Payment currency
 *                 example: "NGN"
 *               customer:
 *                 type: object
 *                 required:
 *                   - email
 *                   - name
 *                 properties:
 *                   email:
 *                     type: string
 *                     format: email
 *                     example: "customer@example.com"
 *                   name:
 *                     type: string
 *                     example: "John Doe"
 *                   phone:
 *                     type: string
 *                     example: "+234812345678"
 *               gateway:
 *                 type: string
 *                 enum: [flutterwave, opay]
 *                 description: Payment gateway to use
 *                 example: "flutterwave"
 *               redirect_url:
 *                 type: string
 *                 format: uri
 *                 description: URL to redirect after payment
 *                 example: "https://yoursite.com/payment/callback"
 *               metadata:
 *                 type: object
 *                 description: Additional transaction metadata
 *                 example: {"orderId": "ORD-123", "customField": "value"}
 *     responses:
 *       200:
 *         description: Payment transaction created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     payment_link:
 *                       type: string
 *                       format: uri
 *                       example: "https://checkout.flutterwave.com/v3/hosted/pay/abc123"
 *                     transaction_id:
 *                       type: string
 *                       example: "tx_64f5e8b2a1b2c3d4e5f6g7h8"
 *                     reference:
 *                       type: string
 *                       example: "KP-REF-1697616000123"
 *       400:
 *         description: Bad request - Invalid payment data
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
router.post("/create-payment", createPayment);

/**
 * @swagger
 * /api/pay/check-status:
 *   post:
 *     tags: [Payment Integration]
 *     summary: Check payment transaction status
 *     description: Verifies the current status of a payment transaction from the payment gateway
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - transaction_id
 *               - gateway
 *             properties:
 *               transaction_id:
 *                 type: string
 *                 description: Transaction identifier
 *                 example: "tx_64f5e8b2a1b2c3d4e5f6g7h8"
 *               gateway:
 *                 type: string
 *                 enum: [flutterwave, opay]
 *                 description: Payment gateway used
 *                 example: "flutterwave"
 *               reference:
 *                 type: string
 *                 description: Payment reference (alternative to transaction_id)
 *                 example: "KP-REF-1697616000123"
 *     responses:
 *       200:
 *         description: Payment status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     status:
 *                       type: string
 *                       enum: [pending, successful, failed, cancelled]
 *                       example: "successful"
 *                     amount:
 *                       type: number
 *                       example: 5000.00
 *                     currency:
 *                       type: string
 *                       example: "NGN"
 *                     customer:
 *                       type: object
 *                       example: {"name": "John Doe", "email": "customer@example.com"}
 *                     gateway_response:
 *                       type: object
 *                       description: Raw gateway response
 *       400:
 *         description: Bad request - Missing transaction ID or gateway
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       404:
 *         description: Transaction not found
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
router.post("/check-status", checkStatus);

/**
 * @swagger
 * /api/pay/handle-redirect:
 *   post:
 *     tags: [Payment Integration]
 *     summary: Handle payment redirect
 *     description: Processes payment gateway redirects after customer completes payment
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - transaction_id
 *               - gateway
 *             properties:
 *               transaction_id:
 *                 type: string
 *                 description: Transaction identifier
 *                 example: "tx_64f5e8b2a1b2c3d4e5f6g7h8"
 *               gateway:
 *                 type: string
 *                 enum: [flutterwave, opay]
 *                 description: Payment gateway
 *                 example: "flutterwave"
 *               status:
 *                 type: string
 *                 enum: [successful, failed, cancelled]
 *                 description: Payment status from gateway
 *                 example: "successful"
 *               gateway_data:
 *                 type: object
 *                 description: Additional data from payment gateway
 *                 example: {"tx_ref": "KP-REF-123", "flw_ref": "FLW-MOCK-123"}
 *     responses:
 *       200:
 *         description: Redirect handled successfully
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
 *                   example: "Payment redirect processed successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     final_status:
 *                       type: string
 *                       example: "completed"
 *                     redirect_url:
 *                       type: string
 *                       format: uri
 *                       example: "https://yoursite.com/payment/success"
 *       400:
 *         description: Bad request - Invalid redirect data
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
router.post("/handle-redirect", protect, handleRedirect);

/**
 * @swagger
 * /api/pay/webhook:
 *   post:
 *     tags: [Payment Integration]
 *     summary: Handle payment gateway webhooks
 *     description: Receives and processes webhook notifications from payment gateways for transaction updates
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               event:
 *                 type: string
 *                 description: Webhook event type
 *                 example: "charge.completed"
 *               data:
 *                 type: object
 *                 description: Event data from payment gateway
 *                 example: {
 *                   "id": 285959875,
 *                   "tx_ref": "KP-REF-1697616000123",
 *                   "flw_ref": "FLW-MOCK-162a1d87d9d86bb1e47e8e4c6b66da80",
 *                   "device_fingerprint": "69e6b7f0sb72037aa8428b70fbe03986c",
 *                   "amount": 5000,
 *                   "currency": "NGN",
 *                   "charged_amount": 5000,
 *                   "app_fee": 140,
 *                   "merchant_fee": 0,
 *                   "processor_response": "Approved",
 *                   "auth_model": "PIN",
 *                   "ip": "197.149.95.62",
 *                   "narration": "CARD Transaction",
 *                   "status": "successful",
 *                   "payment_type": "card",
 *                   "created_at": "2023-10-18T10:30:00.000Z",
 *                   "account_id": 17321
 *                 }
 *               created_at:
 *                 type: string
 *                 format: date-time
 *                 description: Webhook timestamp
 *                 example: "2023-10-18T10:30:00.000Z"
 *     responses:
 *       200:
 *         description: Webhook processed successfully
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
 *                   example: "Webhook processed successfully"
 *       400:
 *         description: Bad request - Invalid webhook data or signature
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       401:
 *         description: Unauthorized - Invalid webhook signature
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.post("/webhook", handleWebhook);

module.exports = router;