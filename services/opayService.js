// services/opayService.js
const { opayClient, encryptCardData } = require('../config/opay');

class OPayService {
  // Card payment (server-side encrypted card data). Opay may expect encrypted card payload.
  static async createCardPayment({ amount, currency = 'NGN', reference, customer = {}, card, return3dsUrl }) {
    const encryptedCard = encryptCardData({
      pan: card.number,
      cvv: card.cvv,
      expiryMonth: card.expiryMonth,
      expiryYear: card.expiryYear,
    });
    console.log('Encrypted card data:', encryptedCard);

    const payload = {
      amount,
      currency,
      reference,
      country: 'NG',
      payMethod: 'card',
      customer,
      card: { encrypted: encryptedCard },
      return3dsUrl: return3dsUrl || process.env.FRONTEND_URL,
    };

    const res = await opayClient.post('/card/pay', payload);
    return res.data;
  }

  // Wallet payment (Opay wallet)
  static async createWalletPayment({ amount, currency = 'NGN', reference, customer = {}, returnUrl }) {
    const payload = {
      amount, currency, reference, customer, returnUrl: returnUrl || process.env.FRONTEND_URL
    };
    const res = await opayClient.post('/wallet/pay', payload);
    return res.data;
  }

  // Bank transfer / bank pay (adjust path per actual Opay docs)
  static async createBankPayment({ amount, currency = 'NGN', reference, customer = {} }) {
    const payload = { amount, currency, reference, customer };
    const res = await opayClient.post('/bank/pay', payload);
    return res.data;
  }

  // Query transaction status
  static async queryTransaction(reference) {
    const payload = { reference };
    const res = await opayClient.post('/transaction/status', payload);
    return res.data;
  }

  // Payouts (to bank)
  static async payoutToBank({ amount, currency = 'NGN', beneficiary }) {
    const payload = { amount, currency, beneficiary };
    const res = await opayClient.post('/transfer/toBank', payload);
    return res.data;
  }

  // Payouts to wallet
  static async payoutToWallet({ amount, currency = 'NGN', walletId }) {
    const payload = { amount, currency, walletId };
    const res = await opayClient.post('/transfer/toWallet', payload);
    return res.data;
  }
}

module.exports = OPayService;
