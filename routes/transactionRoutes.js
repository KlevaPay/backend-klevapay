const express = require('express');
const router = express.Router();
const { param, query } = require('express-validator');
const { validationErrorHandler } = require('../middlewares/errorHandler');
const {
  getTransactionsByWallet,
  getTransactionStatsByWallet,
  getRecentTransactionsByWallet
} = require('../controllers/transactionController');

/**
 * @swagger
 * components:
 *   schemas:
 *     TransactionResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: "Transactions retrieved successfully"
 *         data:
 *           type: object
 *           properties:
 *             merchant:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   example: "64f5e8b2a1b2c3d4e5f6g7h8"
 *                 businessName:
 *                   type: string
 *                   example: "Tech Innovations Ltd"
 *                 walletAddress:
 *                   type: string
 *                   example: "0x742E4C8e9b6Ea8B6f7A7C6A1e2D8F3b9C1a4B5E6"
 *             transactions:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Transaction'
 *             pagination:
 *               type: object
 *               properties:
 *                 page:
 *                   type: integer
 *                   example: 1
 *                 limit:
 *                   type: integer
 *                   example: 20
 *                 total:
 *                   type: integer
 *                   example: 150
 *                 pages:
 *                   type: integer
 *                   example: 8
 *                 hasNext:
 *                   type: boolean
 *                   example: true
 *                 hasPrev:
 *                   type: boolean
 *                   example: false
 *     TransactionStatsResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: "Transaction statistics retrieved successfully"
 *         data:
 *           type: object
 *           properties:
 *             merchant:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   example: "64f5e8b2a1b2c3d4e5f6g7h8"
 *                 businessName:
 *                   type: string
 *                   example: "Tech Innovations Ltd"
 *                 walletAddress:
 *                   type: string
 *                   example: "0x742E4C8e9b6Ea8B6f7A7C6A1e2D8F3b9C1a4B5E6"
 *             analytics:
 *               type: object
 *               properties:
 *                 totalTransactions:
 *                   type: integer
 *                   example: 150
 *                 totalVolume:
 *                   type: number
 *                   example: 750000.50
 *                 successfulTransactions:
 *                   type: integer
 *                   example: 142
 *                 pendingTransactions:
 *                   type: integer
 *                   example: 5
 *                 failedTransactions:
 *                   type: integer
 *                   example: 3
 *                 averageTransactionAmount:
 *                   type: number
 *                   example: 5000.00
 *                 successRate:
 *                   type: number
 *                   example: 94.67
 *                 period:
 *                   type: string
 *                   example: "30d"
 */

/**
 * @swagger
 * /api/transactions/wallet/{walletAddress}:
 *   get:
 *     tags: [Transactions]
 *     summary: Get all transactions for a specific wallet address
 *     description: Retrieve paginated transactions for a merchant's wallet address with optional filtering
 *     parameters:
 *       - in: path
 *         name: walletAddress
 *         required: true
 *         schema:
 *           type: string
 *           minLength: 10
 *         description: Merchant's wallet address
 *         example: '0x742E4C8e9b6Ea8B6f7A7C6A1e2D8F3b9C1a4B5E6'
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *         example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Number of transactions per page
 *         example: 20
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, PAID, SETTLED, FAILED, SUCCESS, PROCESSING]
 *         description: Filter by transaction status (case insensitive, converted to uppercase)
 *         example: 'paid'
 *       - in: query
 *         name: method
 *         schema:
 *           type: string
 *           enum: [CARD, BANK, WALLET, CRYPTO, FIAT]
 *         description: Filter by payment method (case insensitive, converted to uppercase)
 *         example: 'card'
 *       - in: query
 *         name: currency
 *         schema:
 *           type: string
 *           enum: [NGN, USD, EUR, USDT, BTC, ETH]
 *         description: Filter by currency (case insensitive, converted to uppercase)
 *         example: 'ngn'
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter transactions from this date (YYYY-MM-DD)
 *         example: '2023-01-01'
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter transactions until this date (YYYY-MM-DD)
 *         example: '2023-12-31'
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           default: createdAt
 *         description: Field to sort by
 *         example: 'createdAt'
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *         example: 'desc'
 *     responses:
 *       200:
 *         description: Transactions retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TransactionResponse'
 *       400:
 *         description: Invalid wallet address or query parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       404:
 *         description: Merchant not found for the provided wallet address
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
router.get(
  '/wallet/:walletAddress',
  [
    param('walletAddress')
      .isString()
      .isLength({ min: 10 })
      .withMessage('Invalid wallet address format'),
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    query('status')
      .optional()
      .isIn(['PENDING', 'PAID', 'SETTLED', 'FAILED', 'SUCCESS', 'PROCESSING'])
      .withMessage('Invalid status value'),
    query('method')
      .optional()
      .isIn(['CARD', 'BANK', 'WALLET', 'CRYPTO', 'FIAT'])
      .withMessage('Invalid payment method'),
    query('currency')
      .optional()
      .isIn(['NGN', 'USD', 'EUR', 'USDT', 'BTC', 'ETH'])
      .withMessage('Invalid currency')
  ],
  validationErrorHandler,
  getTransactionsByWallet
);

/**
 * @swagger
 * /api/transactions/wallet/{walletAddress}/stats:
 *   get:
 *     tags: [Transactions]
 *     summary: Get transaction statistics for a specific wallet address
 *     description: Retrieve comprehensive transaction analytics and statistics for a merchant's wallet
 *     parameters:
 *       - in: path
 *         name: walletAddress
 *         required: true
 *         schema:
 *           type: string
 *           minLength: 10
 *         description: Merchant's wallet address
 *         example: '0x742E4C8e9b6Ea8B6f7A7C6A1e2D8F3b9C1a4B5E6'
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [7d, 30d, 90d, 1y]
 *           default: '30d'
 *         description: Time period for statistics
 *         example: '30d'
 *     responses:
 *       200:
 *         description: Transaction statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TransactionStatsResponse'
 *       400:
 *         description: Invalid wallet address or period parameter
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       404:
 *         description: Merchant not found for the provided wallet address
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
router.get(
  '/wallet/:walletAddress/stats',
  [
    param('walletAddress')
      .isString()
      .isLength({ min: 10 })
      .withMessage('Invalid wallet address format'),
    query('period')
      .optional()
      .isIn(['7d', '30d', '90d', '1y'])
      .withMessage('Invalid period value')
  ],
  validationErrorHandler,
  getTransactionStatsByWallet
);

/**
 * @swagger
 * /api/transactions/wallet/{walletAddress}/recent:
 *   get:
 *     tags: [Transactions]
 *     summary: Get recent transactions for a specific wallet address
 *     description: Retrieve the most recent transactions for a merchant's wallet with optional limit
 *     parameters:
 *       - in: path
 *         name: walletAddress
 *         required: true
 *         schema:
 *           type: string
 *           minLength: 10
 *         description: Merchant's wallet address
 *         example: '0x742E4C8e9b6Ea8B6f7A7C6A1e2D8F3b9C1a4B5E6'
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 10
 *         description: Number of recent transactions to retrieve
 *         example: 10
 *     responses:
 *       200:
 *         description: Recent transactions retrieved successfully
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
 *                   example: "Recent transactions retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     merchant:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           example: "64f5e8b2a1b2c3d4e5f6g7h8"
 *                         businessName:
 *                           type: string
 *                           example: "Tech Innovations Ltd"
 *                         walletAddress:
 *                           type: string
 *                           example: "0x742E4C8e9b6Ea8B6f7A7C6A1e2D8F3b9C1a4B5E6"
 *                     transactions:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Transaction'
 *                     count:
 *                       type: integer
 *                       example: 10
 *       400:
 *         description: Invalid wallet address or limit parameter
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       404:
 *         description: Merchant not found for the provided wallet address
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
router.get(
  '/wallet/:walletAddress/recent',
  [
    param('walletAddress')
      .isString()
      .isLength({ min: 10 })
      .withMessage('Invalid wallet address format'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage('Limit must be between 1 and 50')
  ],
  validationErrorHandler,
  getRecentTransactionsByWallet
);

module.exports = router;