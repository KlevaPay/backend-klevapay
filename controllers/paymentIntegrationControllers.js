const PaymentService = require("../services/paymentIntegrationServices");

exports.createPayment = async (req, res) => {
  try {
    const data = await PaymentService.createPayment(req.body);
    res.json({ success: true, data });
  } catch (err) {
    console.error("Create Payment Error:", err);
    res.status(500).json({ error: err });
  }
};

exports.checkStatus = async (req, res) => {
  try {
    const { tx_ref } = req.body;
    const data = await PaymentService.checkStatus(tx_ref);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.handleRedirect = async (req, res) => {
  try {
    console.log('request', req);
    
    const verified = await PaymentService.handleRedirect(req.body);
    res.json({ success: true, verified });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.handleWebhook = async (req, res) => {
  try {
    await PaymentService.handleWebhook(req.headers, req.body);
    res.sendStatus(200);
  } catch (err) {
    res.status(401).json({ error: err.message });
  }
};
