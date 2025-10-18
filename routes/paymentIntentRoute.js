const express = require('express');
const router = express.Router();
const {
  createPaymentIntent,
  getPaymentIntent,
  updatePaymentStatus,
} = require('../controllers/paymentIntentController');


router.post('/', createPaymentIntent);


router.get('/:id', getPaymentIntent);


router.patch('/:id/status', updatePaymentStatus);

module.exports = router;
