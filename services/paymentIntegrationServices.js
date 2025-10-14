// services/paymentService.js
const { flwClient } = require("../config/flutterwave");

class PaymentService {
  static async createPayment({ amount, currency = "NGN", method, customer, tx_ref }) {
    if (!amount || !method) throw new Error("amount and method required");

    const reference = tx_ref || `tx-${Date.now()}`;
    let response;

    if (method === "card") {
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
    return body;
  }
}

module.exports = PaymentService;
