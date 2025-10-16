const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authmiddleware');

const {
  createPayment,
  checkStatus,
  handleRedirect,
  handleWebhook,
} = require("../controllers/paymentIntegrationControllers");

router.post("/create-payment", protect, createPayment);
router.post("/check-status", protect, checkStatus);
router.post("/handle-redirect", protect, handleRedirect);
router.post("/webhook", protect, handleWebhook);

module.exports = router;