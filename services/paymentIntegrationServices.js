const { convert } = require('./pricefeed');
const { flwClient } = require("../config/flutterwave");
const TransactionService = require('./transactionService');

function sanitizeMetadata(meta = {}) {
  return Object.entries(meta).reduce((acc, [key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      acc[key] = value;
    }
    return acc;
  }, {});
}

class PaymentService {
  static async createPayment({ amount, currency = "NGN", method, customer, tx_ref, merchant = {}, metadata = {} }) {
    if (!amount || !method) throw new Error("amount and method required");

    const reference = tx_ref || `tx-${Date.now()}`;
    let response;
    let gatewayAmount = amount;
    let gatewayCurrency = currency;

    const merchantMeta = sanitizeMetadata({
      merchantId: merchant?.merchantId,
      merchantWalletAddress: merchant?.walletAddress,
      merchantEmail: merchant?.email,
      merchantBusinessName: merchant?.businessName
    });

    const combinedMeta = sanitizeMetadata({
      ...metadata,
      ...merchantMeta
    });

    if (method === "card" && currency.toUpperCase() === 'NGN') {
      gatewayAmount = await convert('NGN', 'USD', amount);
      gatewayCurrency = 'USD';
      const payload = {
        tx_ref: reference,
        amount,
        currency,
        redirect_url: `${process.env.FRONTEND_URL || "http://localhost:5173"}/checkout`,
        customer,
        payment_options: "card",
        customizations: {
          title: "KlevaPay Checkout",
          description: "Card payments",
          logo: "https://logo-url.png",
        },
      };

      if (Object.keys(combinedMeta).length) {
        payload.meta = combinedMeta;
      }

      response = await flwClient.post("/payments", payload);
      return response.data.data;
    }

    let typeParam;
    let chargePayload = {
      tx_ref: reference,
      amount,
      currency,
      email: customer?.email,
      phone_number: customer?.phone,
      fullname: customer?.name,
    };

    if (Object.keys(combinedMeta).length) {
      chargePayload.meta = combinedMeta;
    }

    switch (method) {
      case "opay":
        typeParam = "opay";
        break;
      case "bank_transfer":
        typeParam = "bank_transfer";
        break;
      default:
        throw new Error("Unsupported payment method");
    }

    response = await flwClient.post(`/charges?type=${typeParam}`, chargePayload);
    return response.data;
  }

  static async checkStatus(tx_ref) {
    if (!tx_ref) throw new Error("tx_ref required");
    const r = await flwClient.get(`/transactions/verify_by_reference?tx_ref=${tx_ref}`);
    const data = r.data.data;
    return { status: data.status, amount: data.amount, currency: data.currency };
  }

  static async handleRedirect(query) {
    const { tx_ref } = query;
    console.log('handleRedirect query', tx_ref);
    const verify = await flwClient.get(`/transactions/verify_by_reference?tx_ref=${tx_ref}`);
    return verify.data;
  }

  static async handleWebhook(headers, body) {
    const signature = headers["verif-hash"];
    if (signature !== process.env.WEBHOOK_SECRET) throw new Error("unauthorized");
    console.log("Webhook received:", body);
    const meta = body?.data?.meta || {};

    const merchantOptions = sanitizeMetadata({
      merchantId: meta.merchantId,
      merchantWalletAddress: meta.merchantWalletAddress || meta.merchant_wallet || meta.walletAddress,
    });

    if (!merchantOptions.merchantId && !merchantOptions.merchantWalletAddress) {
      if (console && console.warn) {
        console.warn('Flutterwave webhook missing merchant context; skipping transaction persistence');
      }
      return body;
    }

    try {
      await TransactionService.recordFlutterwaveTransaction(body, {
        merchantId: merchantOptions.merchantId,
        merchantWalletAddress: merchantOptions.merchantWalletAddress,
        metadata: meta
      });
    } catch (err) {
      if (console && console.error) {
        console.error('Failed to persist Flutterwave webhook transaction', err.message);
      }
    }

    return body;
  }
}

module.exports = PaymentService;
