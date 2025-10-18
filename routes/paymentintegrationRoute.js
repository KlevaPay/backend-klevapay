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
 * components:
 *   schemas:
 *     CreatePaymentRequest:
 *       type: object
 *       required:
 *         - amount
 *         - method
 *       properties:
 *         amount:
 *           type: number
 *           minimum: 0.01
 *           description: Payment amount
 *           example: 1000.50
 *         currency:
 *           type: string
 *           default: "NGN"
 *           description: Payment currency
 *           example: 'NGN'
 *         method:
 *           type: string
 *           enum: [card, opay, bank_transfer]
 *           description: Payment method
 *           example: 'card'
 *         customer:
 *           type: object
 *           description: Customer information
 *           properties:
 *             email:
 *               type: string
 *               format: email
 *               example: 'customer@example.com'
 *             phone:
 *               type: string
 *               example: '+2348123456789'
 *             name:
 *               type: string
 *               example: 'John Doe'
 *         tx_ref:
 *           type: string
 *           description: Optional transaction reference (auto-generated if not provided)
 *           example: 'KP-REF-1697616000123'
 *     PaymentResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         data:
 *           type: object
 *           description: Response data from payment provider
 *     StatusCheckRequest:
 *       type: object
 *       required:
 *         - tx_ref
 *       properties:
 *         tx_ref:
 *           type: string
 *           description: Transaction reference to check
 *           example: 'KP-REF-1697616000123'
 *     StatusCheckResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         data:
 *           type: object
 *           properties:
 *             status:
 *               type: string
 *               example: 'successful'
 *             amount:
 *               type: number
 *               example: 1000.50
 *             currency:
 *               type: string
 *               example: 'NGN'
 *     RedirectRequest:
 *       type: object
 *       description: Redirect data from payment provider
 *       properties:
 *         tx_ref:
 *           type: string
 *           description: Transaction reference
 *           example: 'KP-REF-1697616000123'
 *     WebhookRequest:
 *       type: object
 *       description: Webhook payload from payment provider
 */

/**
 * @swagger
 * /api/payment-integration/create-payment:
 *   post:
 *     tags: [Payment Integration]
 *     summary: Create a payment with Flutterwave
 *     description: Initiate a payment through Flutterwave payment gateway using various methods
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreatePaymentRequest'
 *           examples:
 *             card_payment:
 *               summary: Card payment example
 *               value:
 *                 amount: 5000.00
 *                 currency: 'NGN'
 *                 method: 'card'
 *                 customer:
 *                   email: 'john.doe@example.com'
 *                   name: 'John Doe'
 *                   phone: '+2348123456789'
 *                 tx_ref: 'KP-REF-1697616000123'
 *             opay_payment:
 *               summary: OPay payment example
 *               value:
 *                 amount: 2500.00
 *                 method: 'opay'
 *                 customer:
 *                   email: 'jane.smith@example.com'
 *                   phone: '+2348123456789'
 *                   name: 'Jane Smith'
 *             bank_transfer:
 *               summary: Bank transfer payment
 *               value:
 *                 amount: 10000.00
 *                 method: 'bank_transfer'
 *                 customer:
 *                   email: 'user@example.com'
 *                   phone: '+2348123456789'
 *                   name: 'Test User'
 *     responses:
 *       200:
 *         description: Payment initiated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaymentResponse'
 *       500:
 *         description: Payment creation error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: object
 *                   description: Error details
 */
router.post("/create-payment", protect, createPayment);

/**
 * @swagger
 * /api/payment-integration/check-status:
 *   post:
 *     tags: [Payment Integration]
 *     summary: Check payment status by transaction reference
 *     description: Verify the current status of a payment using transaction reference
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/StatusCheckRequest'
 *           examples:
 *             check_status:
 *               summary: Check payment status
 *               value:
 *                 tx_ref: 'KP-REF-1697616000123'
 *     responses:
 *       200:
 *         description: Payment status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StatusCheckResponse'
 *       500:
 *         description: Error checking payment status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "tx_ref required"
 */
router.post("/check-status", protect, checkStatus);

/**
 * @swagger
 * /api/payment-integration/handle-redirect:
 *   post:
 *     tags: [Payment Integration]
 *     summary: Handle payment redirect callback
 *     description: Process payment completion redirects from payment providers
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RedirectRequest'
 *           examples:
 *             redirect_data:
 *               summary: Payment redirect data
 *               value:
 *                 tx_ref: 'KP-REF-1697616000123'
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
 *                 verified:
 *                   type: object
 *                   description: Verification data from provider
 *       500:
 *         description: Error handling redirect
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */
router.post("/handle-redirect", protect, handleRedirect);

/**
 * @swagger
 * /api/payment-integration/webhook:
 *   post:
 *     tags: [Payment Integration]
 *     summary: Handle payment webhooks
 *     description: Process webhook notifications from payment providers (requires verif-hash header)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: header
 *         name: verif-hash
 *         required: true
 *         schema:
 *           type: string
 *         description: Webhook verification hash from payment provider
 *         example: 'your-webhook-secret'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/WebhookRequest'
 *           examples:
 *             webhook_data:
 *               summary: Webhook notification
 *               value:
 *                 event: 'charge.completed'
 *                 data:
 *                   tx_ref: 'KP-REF-1697616000123'
 *                   status: 'successful'
 *                   amount: 5000
 *     responses:
 *       200:
 *         description: Webhook processed successfully
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: 'OK'
 *       401:
 *         description: Unauthorized - Invalid webhook signature
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "unauthorized"
 */
router.post("/webhook", protect, handleWebhook);

module.exports = router;