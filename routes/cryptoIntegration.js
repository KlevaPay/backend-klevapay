const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authmiddleware');

const {
  creditMerchant,
  getOwner,
  // getTotalLiquidity,
  addLiquidity,
  // payWithToken,
  removeLiquidity
} = require("../controllers/cryptoIntegrationController");

/**
 * @swagger
 * components:
 *   schemas:
 *     LiquidityRequest:
 *       type: object
 *       required:
 *         - amount
 *       properties:
 *         amount:
 *           type: string
 *           description: Amount of USDT to move (string preserves precision before parsing to base units)
 *           example: "2500.50"
 *     CreditMerchantRequest:
 *       type: object
 *       required:
 *         - merchant
 *         - amount
 *         - chargeFee
 *         - txRef
 *       properties:
 *         merchant:
 *           type: string
 *           description: Merchant payout wallet address
 *           example: "0x742E4C8e9b6Ea8B6f7A7C6A1e2D8F3b9C1a4B5E6"
 *         amount:
 *           type: string
 *           description: Amount of USDT to credit (string, converted to 6dp on-chain)
 *           example: "500.00"
 *         chargeFee:
 *           type: number
 *           description: Fee amount (in basis points or flat units depending on contract configuration)
 *           example: 25
 *         txRef:
 *           type: string
 *           description: Reference tying the payout to an upstream transaction
 *           example: "KP-REF-1697616000123"
 */

/**
 * @swagger
 * /api/crypto/owner:
 *   get:
 *     tags: [Crypto Integration]
 *     summary: Get settlement contract owner
 *     description: Returns the wallet address that owns the on-chain settlement contract.
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Contract owner address retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: string
 *                   example: "0x9c1b1e34aF6c52A5E3F3D4B9C1A4B5E6F7A7C6A1"
 *       401:
 *         description: Unauthorized - Bearer token missing or invalid
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.get("/owner", protect, getOwner);

/**
 * @swagger
 * /api/crypto/add-liquidity:
 *   post:
 *     tags: [Crypto Integration]
 *     summary: Add protocol liquidity (USDT)
 *     description: Approves the settlement contract and deposits the supplied USDT amount.
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LiquidityRequest'
 *           examples:
 *             add_liquidity:
 *               summary: Add 1,000 USDT liquidity
 *               value:
 *                 amount: "1000"
 *     responses:
 *       200:
 *         description: Liquidity added successfully (transaction receipt)
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
 *                   description: Ethers.js transaction receipt
 *                   additionalProperties: true
 *       400:
 *         description: Missing amount in request body
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       401:
 *         description: Unauthorized - Bearer token missing or invalid
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       500:
 *         description: Contract interaction failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.post("/add-liquidity", protect, addLiquidity);

/**
 * @swagger
 * /api/crypto/remove-liquidity:
 *   post:
 *     tags: [Crypto Integration]
 *     summary: Remove protocol liquidity
 *     description: Withdraws liquidity from the settlement contract.
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LiquidityRequest'
 *           examples:
 *             remove_liquidity:
 *               summary: Remove 250 USDT liquidity
 *               value:
 *                 amount: "250"
 *     responses:
 *       200:
 *         description: Liquidity removed successfully (transaction receipt)
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
 *                   description: Ethers.js transaction receipt
 *                   additionalProperties: true
 *       400:
 *         description: Missing amount in request body
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       401:
 *         description: Unauthorized - Bearer token missing or invalid
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       500:
 *         description: Contract interaction failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.post("/remove-liquidity", protect, removeLiquidity);

/**
 * @swagger
 * /api/crypto/credit-merchant:
 *   post:
 *     tags: [Crypto Integration]
 *     summary: Credit merchant wallet in USDT
 *     description: Executes the on-chain `creditMerchant` function to settle a merchant in stablecoin.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreditMerchantRequest'
 *           examples:
 *             credit_merchant:
 *               summary: Credit merchant with 500 USDT
 *               value:
 *                 merchant: "0x742E4C8e9b6Ea8B6f7A7C6A1e2D8F3b9C1a4B5E6"
 *                 amount: "500"
 *                 chargeFee: 25
 *                 txRef: "KP-REF-1697616000123"
 *     responses:
 *       200:
 *         description: Merchant credited successfully (transaction receipt)
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
 *                   description: Ethers.js transaction receipt
 *                   additionalProperties: true
 *       400:
 *         description: Validation error (missing fields)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       500:
 *         description: Contract interaction failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.post("/credit-merchant", creditMerchant);

module.exports = router;