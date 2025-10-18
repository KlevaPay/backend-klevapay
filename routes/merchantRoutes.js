const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const { validationErrorHandler } = require('../middlewares/errorHandler');
const merchantController = require('../controllers/merchantController');

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

// Get business by wallet
router.get(
  '/wallet/:walletAddress',
  [param('walletAddress').isString().withMessage('Invalid wallet address')],
  validationErrorHandler,
  merchantController.getBusinessByWallet
);

// Get all businesses (admin only)
router.get('/', merchantController.getAllBusinesses);

module.exports = router;
