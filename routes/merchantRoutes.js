const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const { validationErrorHandler } = require('../middlewares/errorHandler');
const merchantController = require('../controllers/merchantController');

/**
 * @swagger
 * components:
 *   schemas:
 *     CreateBusinessRequest:
 *       type: object
 *       required:
 *         - walletAddress
 *         - businessName
 *       properties:
 *         walletAddress:
 *           type: string
 *           description: Merchant's unique wallet address
 *           example: '0x742E4C8e9b6Ea8B6f7A7C6A1e2D8F3b9C1a4B5E6'
 *         businessName:
 *           type: string
 *           minLength: 2
 *           description: Unique business name
 *           example: 'Tech Innovations Ltd'
 *         payoutPreferences:
 *           type: object
 *           description: Optional payout preferences
 *           properties:
 *             currency:
 *               type: string
 *               example: 'NGN'
 *             method:
 *               type: string
 *               example: 'bank_transfer'
  *             accountDetails:
  *               type: object
  *               properties:
  *                 bankName:
  *                   type: string
  *                   example: 'Access Bank'
  *                 accountNumber:
  *                   type: string
  *                   example: '0123456789'
  *                 accountName:
  *                   type: string
  *                   example: 'Tech Innovations Ltd'
  *                 routingNumber:
  *                   type: string
  *                   example: '044'
 *         country:
 *           type: string
 *           description: Business country
 *           example: 'Nigeria'
 *     BusinessResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: 'Business created successfully'
 *         data:
 *           $ref: '#/components/schemas/Merchant'
 *     BusinessListResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         count:
 *           type: integer
 *           example: 25
 *         data:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Merchant'
 */

/**
 * @swagger
 * /api/merchant:
 *   post:
 *     tags: [Merchant]
 *     summary: Create a new business profile
 *     description: Create a new merchant business profile after wallet connection (onboarding step)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateBusinessRequest'
 *           examples:
 *             basic_business:
 *               summary: Minimal required fields
 *               value:
 *                 walletAddress: '0x742E4C8e9b6Ea8B6f7A7C6A1e2D8F3b9C1a4B5E6'
 *                 businessName: 'Tech Innovations Ltd'
 *             complete_business:
 *               summary: Complete business profile
 *               value:
  *                 walletAddress: '0x742E4C8e9b6Ea8B6f7A7C6A1e2D8F3b9C1a4B5E6'
  *                 businessName: 'Tech Innovations Ltd'
 *                 country: 'Nigeria'
 *                 payoutPreferences:
 *                   currency: 'NGN'
 *                   method: 'bank_transfer'
  *                   accountDetails:
  *                     bankName: 'Access Bank'
  *                     accountNumber: '0123456789'
  *                     accountName: 'Tech Innovations Ltd'
 *     responses:
 *       201:
 *         description: Business created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BusinessResponse'
 *       400:
 *         description: Invalid input data (missing wallet address or business name)
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
 *       409:
 *         description: Wallet address already linked or business name already exists
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
 *                   example: "Wallet address already linked to a business"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */ 

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
 *     description: Retrieve merchant business profile using their wallet address
 *     parameters:
 *       - in: path
 *         name: walletAddress
 *         required: true
 *         schema:
 *           type: string
 *         description: Merchant's wallet address
 *         example: '0x742E4C8e9b6Ea8B6f7A7C6A1e2D8F3b9C1a4B5E6'
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
 *       400:
 *         description: Invalid wallet address format
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       404:
 *         description: Business not found for this wallet address
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
 *                   example: "Business not found for this wallet"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
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
 *     summary: Get all businesses (Admin endpoint)
 *     description: Retrieve list of all merchant businesses - typically for admin dashboard. No input parameters required.
 *     responses:
 *       200:
 *         description: Businesses retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BusinessListResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.get('/', merchantController.getAllBusinesses);

module.exports = router;
