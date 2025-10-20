const { ethers } = require('ethers');
const Transaction = require('../models/Transaction');
const Merchant = require('../models/Merchant');
const { flwClient } = require('../config/flutterwave');
const { convert } = require('./pricefeed');
const CryptoIntegrationService = require('./cryptoIntegration');
const logger = require('../lib/logger');

function resolvePayoutMethod(merchant) {
  const method = merchant?.payoutPreferences?.method;
  if (!method) return 'bank_transfer';
  return method.toLowerCase();
}

function resolvePayoutCurrency(merchant, transaction) {
  const preference = merchant?.payoutPreferences?.currency;
  if (preference) return preference.toUpperCase();
  if (transaction?.fiatCurrency) return transaction.fiatCurrency.toUpperCase();
  if (transaction?.currency) return transaction.currency.toUpperCase();
  return 'NGN';
}

function extractAccountDetails(merchant) {
  const details = merchant?.payoutPreferences?.accountDetails || {};
  return {
    bankName: details.bankName,
    accountNumber: details.accountNumber,
    accountName: details.accountName,
    routingNumber: details.routingNumber,
    bankCode: details.bankCode || details.routingNumber
  };
}

function toFixedDecimals(value, decimals = 2) {
  if (value === undefined || value === null) return undefined;
  return Number(value).toFixed(decimals);
}

class SettlementService {
  constructor() {
    this.cryptoService = null;
  }

  /**
   * Process settlement for a given transaction
   * @param {string|object} transactionOrId Transaction document or ObjectId string
   * @returns {Promise<object>} Settlement metadata persisted on the transaction
   */
  async process(transactionOrId) {
    const transactionId = typeof transactionOrId === 'object' ? transactionOrId._id : transactionOrId;

    const transaction = await Transaction.findById(transactionId);
    if (!transaction) {
      logger.warn('Settlement skipped: transaction not found', { transactionId });
      return null;
    }

    if (transaction.status === 'SETTLED') {
      logger.info('Settlement skipped: transaction already settled', {
        transactionId: transaction._id,
        reference: transaction.reference
      });
      return transaction.metadata?.settlement || null;
    }

    const merchant = await Merchant.findById(transaction.merchantId);
    if (!merchant) {
      logger.error('Settlement failed: merchant not found', {
        transactionId: transaction._id,
        merchantId: transaction.merchantId
      });
      throw new Error('Merchant not found for settlement');
    }

    const method = resolvePayoutMethod(merchant);
    const currency = resolvePayoutCurrency(merchant, transaction);

    await Transaction.updateOne(
      { _id: transaction._id, status: { $ne: 'SETTLED' } },
      { $set: { status: 'PROCESSING' } }
    );

    const settlementMetadata = transaction.metadata?.settlement || {};

    try {
      let result;
      if (method === 'crypto') {
        result = await this.settleWithCrypto(transaction, merchant);
      } else {
        result = await this.settleWithFiat(transaction, merchant, currency);
      }

      const metadataUpdate = {
        ...settlementMetadata,
        lastRunAt: new Date(),
        method: method === 'crypto' ? 'CRYPTO' : 'FIAT',
        provider: result.provider,
        reference: result.reference,
        status: 'SUCCESS',
        details: result.details || null
      };

      await Transaction.findByIdAndUpdate(transaction._id, {
        $set: {
          status: 'SETTLED',
          'metadata.settlement': metadataUpdate
        }
      }, { new: true });

      logger.info('Settlement completed', {
        transactionId: transaction._id,
        reference: transaction.reference,
        settlementReference: result.reference,
        provider: result.provider
      });

      return metadataUpdate;
    } catch (error) {
      const metadataUpdate = {
        ...settlementMetadata,
        lastRunAt: new Date(),
        method: method === 'crypto' ? 'CRYPTO' : 'FIAT',
        status: 'FAILED',
        error: error.message
      };

      await Transaction.findByIdAndUpdate(transaction._id, {
        $set: {
          status: 'FAILED',
          'metadata.settlement': metadataUpdate
        }
      });

      logger.error('Settlement failed', {
        transactionId: transaction._id,
        reference: transaction.reference,
        error: error.message
      });

      throw error;
    }
  }

  async settleWithFiat(transaction, merchant, targetCurrency) {
    const account = extractAccountDetails(merchant);
    if (!account.accountNumber) {
      throw new Error('Merchant is missing payout account number');
    }

    if (!account.bankCode) {
      throw new Error('Merchant is missing bank code/routing number required for payout');
    }

    const preferredCurrency = (targetCurrency || 'NGN').toUpperCase();
    const txnCurrency = (transaction.fiatCurrency || transaction.currency || 'NGN').toUpperCase();
    const baseAmount = Number(transaction.fiatEquivalent || transaction.amount);

    if (!baseAmount || Number.isNaN(baseAmount) || baseAmount <= 0) {
      throw new Error('Unable to resolve fiat amount for settlement');
    }

    let payoutAmount = baseAmount;
    let payoutCurrency = txnCurrency;

    if (preferredCurrency !== txnCurrency) {
      try {
        payoutAmount = await convert(txnCurrency, preferredCurrency, baseAmount);
        payoutCurrency = preferredCurrency;
      } catch (err) {
        logger.warn('Currency conversion failed, falling back to transaction currency', {
          from: txnCurrency,
          to: preferredCurrency,
          amount: baseAmount,
          error: err.message
        });
        payoutCurrency = txnCurrency;
      }
    }

    // Flutterwave transfers currently operate in NGN; convert if required
    if (payoutCurrency !== 'NGN') {
      try {
        payoutAmount = await convert(payoutCurrency, 'NGN', payoutAmount);
        payoutCurrency = 'NGN';
      } catch (err) {
        logger.warn('NGN conversion failed for Flutterwave transfer', {
          from: payoutCurrency,
          amount: payoutAmount,
          error: err.message
        });
      }
    }

    const reference = `PAYOUT-${transaction.reference}-${Date.now()}`;

    const transferPayload = {
      account_bank: account.bankCode,
      account_number: account.accountNumber,
      amount: Number(Number(payoutAmount).toFixed(2)),
      currency: payoutCurrency,
      narration: `Settlement for ${merchant.businessName || 'merchant'} (${transaction.reference})`,
      reference,
      debit_currency: payoutCurrency
    };

    if (account.accountName) {
      transferPayload.beneficiary_name = account.accountName;
    }

    let responseData;
    try {
      const response = await flwClient.post('/transfers', transferPayload);
      responseData = response.data;
    } catch (error) {
      if (error.response?.data) {
        throw new Error(`Flutterwave transfer failed: ${error.response.data.message || 'Unknown error'}`);
      }
      throw new Error(`Flutterwave transfer failed: ${error.message}`);
    }

    return {
      provider: 'FLUTTERWAVE',
      reference,
      details: {
        request: transferPayload,
        response: responseData
      }
    };
  }

  async settleWithCrypto(transaction, merchant) {
    if (!merchant.walletAddress) {
      throw new Error('Merchant wallet address is required for crypto settlement');
    }

    const baseCurrency = (transaction.fiatCurrency || transaction.currency || 'NGN').toUpperCase();
    const baseAmount = Number(transaction.fiatEquivalent || transaction.amount);

    if (!baseAmount || Number.isNaN(baseAmount) || baseAmount <= 0) {
      throw new Error('Unable to resolve settlement amount for crypto payout');
    }

    let usdtAmount;

    if (baseCurrency === 'USDT') {
      usdtAmount = baseAmount;
    } else {
      usdtAmount = await convert(baseCurrency, 'USDT', baseAmount);
    }

    if (!usdtAmount || Number.isNaN(usdtAmount) || usdtAmount <= 0) {
      throw new Error('Invalid USDT conversion result for settlement');
    }

    const amountFormatted = Number(usdtAmount).toFixed(6);
    const chargeFee = Number(transaction.chargeFee || 0);
    const chargeFeeUnits = ethers.parseUnits(chargeFee.toFixed(6), 6);

    const cryptoService = this.#getCryptoService();
    const receipt = await cryptoService.creditMerchant(
      merchant.walletAddress,
      amountFormatted,
      chargeFeeUnits,
      transaction.reference
    );

    const transactionHash = receipt?.transactionHash || receipt?.hash;

    return {
      provider: 'CONTRACT',
      reference: transaction.reference,
      details: {
        merchant: merchant.walletAddress,
        amount: amountFormatted,
        chargeFee: toFixedDecimals(chargeFee, 6),
        transactionHash,
        receipt
      }
    };
  }

  #getCryptoService() {
    if (!this.cryptoService) {
      this.cryptoService = new CryptoIntegrationService();
    }
    return this.cryptoService;
  }
}

module.exports = new SettlementService();
