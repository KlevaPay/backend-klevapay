const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const { validationErrorHandler } = require('../middlewares/errorHandler');
const merchantController = require('../controllers/merchantController');

/**
 * @swagger
 * /api/merchant:
 *   post:
 *     tags: [Merchant]
 *     summary: Create a new business profile
 *     description: Creates a new merchant business profile after wallet connection - the first interaction in the onboarding process
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - walletAddress
 *               - businessName
 *             properties:
 *               walletAddress:
 *                 type: string
 *                 description: Merchant's crypto wallet address
 *                 example: "0x742E4C8e9b6Ea8B6f7A7C6A1e2D8F3b9C1a4B5E6"
 *               businessName:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *                 description: Unique business name
 *                 example: "Tech Innovations Ltd"
 *               payoutPreferences:
 *                 type: object
 *                 properties:
 *                   currency:
 *                     type: string
 *                     enum: [NGN, USD, EUR, USDT, BTC, ETH]
 *                     default: "NGN"
 *                     example: "NGN"
 *                   method:
 *                     type: string
 *                     enum: [bank_transfer, crypto_wallet, mobile_money]
 *                     default: "bank_transfer"
 *                     example: "bank_transfer"
 *               businessDetails:
 *                 type: object
 *                 properties:
 *                   industry:
 *                     type: string
 *                     example: "E-commerce"
 *                   description:
 *                     type: string
 *                     example: "Online retail technology solutions"
 *                   website:
 *                     type: string
 *                     format: uri
 *                     example: "https://techinnovations.com"
 *     responses:
 *       201:
 *         description: Business profile created successfully
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
 *                   example: "Business profile created successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Merchant'
 *       400:
 *         description: Bad request - Invalid input data or business name already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       409:
 *         description: Conflict - Wallet address or business name already registered
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
// Create a new business (first interaction after wallet connect)
router.post(
  '/',
  [
    body('walletAddress').isString().withMessage('Wallet address is required'),
    body('businessName').isString().isLength({ min: 2 }).withMessage('Business name must be valid'),
  ],
  validationErrorHandler,
  merchantController.createBusiness
);

/**
 * @swagger
 * /api/merchant/wallet/{walletAddress}:
 *   get:
 *     tags: [Merchant]
 *     summary: Get business profile by wallet address
 *     description: Retrieves merchant business profile information using the associated wallet address
 *     parameters:
 *       - in: path
 *         name: walletAddress
 *         required: true
 *         schema:
 *           type: string
 *         description: Crypto wallet address associated with the business
 *         example: "0x742E4C8e9b6Ea8B6f7A7C6A1e2D8F3b9C1a4B5E6"
 *     responses:
 *       200:
 *         description: Business profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Merchant'
 *       404:
 *         description: Business profile not found for the provided wallet address
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       400:
 *         description: Bad request - Invalid wallet address format
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
// Get business by wallet
router.get(
  '/wallet/:walletAddress',
  [param('walletAddress').isString().withMessage('Invalid wallet address')],
  validationErrorHandler,
  merchantController.getBusinessByWallet
);

/**
 * @swagger
 * /api/merchant:
 *   get:
 *     tags: [Merchant]
 *     summary: Get all business profiles (Admin only)
 *     description: Retrieves a list of all registered merchant business profiles - restricted to admin users
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Number of records per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive, pending, suspended]
 *         description: Filter by merchant status
 *       - in: query
 *         name: verified
 *         schema:
 *           type: boolean
 *         description: Filter by verification status
 *     responses:
 *       200:
 *         description: Business profiles retrieved successfully
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
 *                     merchants:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Merchant'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         page:
 *                           type: integer
 *                           example: 1
 *                         limit:
 *                           type: integer
 *                           example: 20
 *                         total:
 *                           type: integer
 *                           example: 150
 *                         pages:
 *                           type: integer
 *                           example: 8
 *       401:
 *         description: Unauthorized - Invalid or missing authentication
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       403:
 *         description: Forbidden - Admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
// Get all businesses (admin only)
router.get('/', merchantController.getAllBusinesses);

module.exports = router;
