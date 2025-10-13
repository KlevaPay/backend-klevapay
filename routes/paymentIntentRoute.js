const express = require('express');
const router = express.Router();
const {
  createPaymentIntent,
  getPaymentIntent,
  updatePaymentStatus,
} = require('../controllers/paymentIntentController');
const { protect } = require('../middlewares/authmiddleware');

// Create payment intent
router.post('/', protect, createPaymentIntent);

// Get payment intent details
router.get('/:id', protect, getPaymentIntent);

// Update payment status
router.patch('/:id/status', protect, updatePaymentStatus);

module.exports = router;
