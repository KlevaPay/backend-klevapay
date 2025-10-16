// controllers/opayController.js
const OPayService = require('../services/opayService');
const Transaction = require('../models/Transaction');
const Merchant = require('../models/Migration');
const mongoose = require('mongoose');
const { verifyWebhookSignature } = require('../config/opay');

/**
 * POST /api/payments/create
 * body: { merchantId, amount, currency, method: 'CARD'|'WALLET'|'BANK', reference, customer, card? }
 */
exports.createPayment = async (req, res) => {
  try {
    const { merchantId, amount, currency = 'NGN', method, reference, customer = {}, card } = req.body;
    if (!amount || !method) return res.status(400).json({ error: 'amount and method required' });
    
    if (!merchantId) return res.status(400).json({ error: 'merchantId required' });

    let merchantObjectId;
    if (mongoose.isValidObjectId(merchantId)) {
      merchantObjectId = merchantId;
    } else {
      // Try to find merchant by common public fields (walletId, email, businessName)
      const merchant = await Merchant.findOne({ walletId: merchantId })
        || await Merchant.findOne({ email: merchantId })
        || await Merchant.findOne({ businessName: merchantId });

      if (!merchant) return res.status(400).json({ error: 'merchant not found' });
      merchantObjectId = merchant._id;
    }

    // create local transaction (PENDING)
    const txRef = reference || `tx-${Date.now()}`;
    const tx = await Transaction.create({
      merchantId: merchantObjectId,
      reference: txRef,
      amount,
      currency,
      method,
      status: 'PENDING',
      metadata: { createdBy: 'api' },
    });

    let providerRes;
    if (method === 'CARD') {
      if (!card) return res.status(400).json({ error: 'card details required for CARD payments' });

      providerRes = await OPayService.createCardPayment({
        amount,
        currency,
        reference: txRef,
        customer,
        card,
        return3dsUrl: `${process.env.FRONTEND_URL}/checkout/${txRef}`,
      });
    } else if (method === 'WALLET') {
      providerRes = await OPayService.createWalletPayment({ amount, currency, reference: txRef, customer });
    } else if (method === 'BANK') {
      providerRes = await OPayService.createBankPayment({ amount, currency, reference: txRef, customer });
    } else {
      return res.status(400).json({ error: 'unsupported method' });
    }

    tx.providerResponse = providerRes;
    await tx.save();

    // providerRes may include authUrl for 3DS
    return res.status(201).json({ success: true, transactionId: tx._id, reference: tx.reference, providerRes });
  } catch (err) {
    console.error('createPayment error', err?.response?.data || err.message);
    return res.status(500).json({ error: err.message, details: err?.response?.data });
  }
};

/**
 * POST /api/payments/status
 * body: { reference }
 */
exports.checkStatus = async (req, res) => {
  try {
    const { reference } = req.body;
    if (!reference) return res.status(400).json({ error: 'reference required' });

    const providerRes = await OPayService.queryTransaction(reference);

    // update local tx if exists
    const tx = await Transaction.findOne({ reference });
    if (tx) {
      const opayStatus = providerRes?.data?.status || providerRes?.status;
      if (opayStatus === 'SUCCESS' || opayStatus === 'COMPLETED') tx.status = 'PAID';
      else if (opayStatus === 'FAILED') tx.status = 'FAILED';
      tx.opayReference = providerRes?.data?.reference || tx.opayReference;
      tx.providerResponse = providerRes;
      await tx.save();
    }

    return res.json({ success: true, providerRes });
  } catch (err) {
    console.error('checkStatus error', err?.response?.data || err.message);
    return res.status(500).json({ error: 'status check failed' });
  }
};

/**
 * POST /api/webhooks/opay
 * This endpoint must be configured as webhook URL in Opay dashboard.
 * We expect raw body signature verification.
 */
exports.webhook = async (req, res) => {
  try {
    // raw body is required to verify signature; see app.js for rawBody capture
    const rawBody = req.rawBody || JSON.stringify(req.body);
    const valid = verifyWebhookSignature(req.headers, rawBody);
    if (!valid) return res.status(401).send('invalid signature');

    const body = req.body;
    const reference = body?.data?.reference || body?.reference || body?.data?.transactionRef;
    const status = body?.data?.status || body?.status;

    if (!reference) {
      console.warn('opay webhook with no reference', body);
      return res.sendStatus(400);
    }

    const tx = await Transaction.findOne({ reference });
    if (!tx) {
      console.warn('transaction not found for reference', reference);
      // Optionally create transaction record here
    } else {
      if (status === 'SUCCESS' || status === 'COMPLETED') tx.status = 'PAID';
      else if (status === 'FAILED') tx.status = 'FAILED';
      tx.providerResponse = body;
      await tx.save();
    }

    // respond 200 quickly
    return res.json({ success: true });
  } catch (err) {
    console.error('webhook handler error', err.message);
    return res.status(500).json({ error: 'webhook handling failed' });
  }
};
