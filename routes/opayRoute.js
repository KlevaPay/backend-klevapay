const express = require('express');
const router = express.Router();
const opayController = require('../controllers/opayControllers');
const { protect } = require('../middlewares/authmiddleware');

router.post('/payments/create', opayController.createPayment);
router.post('/payments/status', protect, opayController.checkStatus);
router.post('/webhooks/opay', protect, opayController.webhook);

module.exports = router;
