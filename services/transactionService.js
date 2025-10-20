const { ethers } = require('ethers');
const mongoose = require('mongoose');
const Transaction = require('../models/Transaction');
const Merchant = require('../models/Merchant');
const logger = require('../lib/logger');
const SettlementService = require('./SettlementService');

const DEFAULT_CRYPTO_DECIMALS = 6;
const DEFAULT_FIAT_DECIMALS = 2;

function normalizeAddress(address) {
  if (!address || typeof address !== 'string') return undefined;
  return address.toLowerCase();
}

function normalizeUnits(value, decimals) {
  if (value === undefined || value === null) return undefined;

  try {
    return Number(ethers.formatUnits(value, decimals));
  } catch (err) {
    // Fallback for plain numbers or unexpected formats
    const numeric = typeof value === 'bigint' ? Number(value) : Number(value);
    if (Number.isNaN(numeric)) {
      logger.warn('Unable to normalize units', { value, decimals, error: err.message });
      return undefined;
    }
    return numeric;
  }
}

function isPlainEmptyObject(value) {
  return (
    value &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    !(value instanceof Date) &&
    !(value instanceof Buffer) &&
    Object.keys(value).length === 0
  );
}

function cleanObject(obj) {
  return Object.entries(obj)
    .filter(([, value]) => value !== undefined && value !== null && !isPlainEmptyObject(value))
    .reduce((acc, [key, value]) => {
      acc[key] = value;
      return acc;
    }, {});
}

function determineFiatOrTokenType(paymentType, tokenSymbol) {
  const paymentTypeUpper = paymentType ? paymentType.toUpperCase() : '';

  if (paymentTypeUpper.includes('FIAT')) return 'FIAT';
  if (paymentTypeUpper.includes('CRYPTO')) return 'CRYPTO';

  if (tokenSymbol) {
    const symbolUpper = tokenSymbol.toUpperCase();
    if (['USDT', 'USDC', 'BTC', 'ETH', 'WETH', 'WBTC'].includes(symbolUpper)) {
      return 'CRYPTO';
    }
  }

  return 'FIAT';
}

async function resolveMerchant({ merchantId, merchantWalletAddress }) {
  if (merchantId) {
    if (!mongoose.Types.ObjectId.isValid(merchantId)) {
      throw new Error('Invalid merchantId provided');
    }

    const merchant = await Merchant.findById(merchantId).lean();
    if (!merchant && !merchantWalletAddress) {
      throw new Error('Merchant not found for provided merchantId');
    }

    return {
      merchantId: merchantId,
      merchantWalletAddress: normalizeAddress(merchantWalletAddress || merchant?.walletAddress)
    };
  }

  if (!merchantWalletAddress) {
    throw new Error('merchantId or merchantWalletAddress is required');
  }

  const normalizedWallet = normalizeAddress(merchantWalletAddress);
  const merchant = await Merchant.findOne({ walletAddress: normalizedWallet }).lean();

  if (!merchant) {
    throw new Error('Merchant not found for wallet address');
  }

  return {
    merchantId: merchant._id,
    merchantWalletAddress: normalizedWallet
  };
}

class TransactionService {
  static async recordBlockchainTransaction(eventPayload, options = {}) {
    const {
      merchantId,
      merchantWalletAddress,
      decimals = DEFAULT_CRYPTO_DECIMALS,
      fiatDecimals = DEFAULT_FIAT_DECIMALS,
      network,
      transactionHash,
      blockNumber,
      metadata: extraMetadata = {},
      providerResponse
    } = options;

    if (!eventPayload || !eventPayload.txRef) {
      throw new Error('Missing txRef in PaymentRecorded event payload');
    }

    const merchantContext = await resolveMerchant({
      merchantId,
      merchantWalletAddress: merchantWalletAddress || eventPayload.merchant
    });

    const fiatOrTokenType = determineFiatOrTokenType(eventPayload.paymentType, eventPayload.tokenSymbol);
    const normalizedStatus = (eventPayload.status || 'PENDING').toString().toUpperCase();
    const normalizedMethod = 'CRYPTO';
    const normalizedCurrency = (eventPayload.tokenSymbol || eventPayload.paymentType || 'USDT').toString().toUpperCase();

    const update = cleanObject({
      merchantId: merchantContext.merchantId,
      merchantWalletAddress: merchantContext.merchantWalletAddress,
      reference: eventPayload.txRef,
      transactionReference: eventPayload.txRef,
      payer: normalizeAddress(eventPayload.payer),
      fiatOrTokenType,
      paymentType: eventPayload.paymentType,
      amount: normalizeUnits(eventPayload.amount, decimals),
      amountInMinor: eventPayload.amount !== undefined ? eventPayload.amount.toString() : undefined,
      fiatEquivalent: normalizeUnits(eventPayload.fiatEquivalent, fiatDecimals),
      fiatCurrency: eventPayload.fiatCurrency ? eventPayload.fiatCurrency.toUpperCase() : 'NGN',
      chargeFee: normalizeUnits(eventPayload.chargeFee, decimals) || 0,
      symbol: normalizedCurrency,
      currency: normalizedCurrency,
      method: normalizedMethod,
      provider: 'CONTRACT',
      status: normalizedStatus,
      eventTimestamp: eventPayload.timestamp ? new Date(Number(eventPayload.timestamp) * 1000) : new Date(),
      recordedAt: new Date(),
      blockchain: cleanObject({
        transactionHash,
        blockNumber,
        network
      }),
      metadata: {
        source: 'CONTRACT_EVENT',
        paymentTypeRaw: eventPayload.paymentType,
        statusRaw: eventPayload.status,
        ...extraMetadata
      },
      providerResponse: providerResponse || eventPayload
    });

    try {
      const transaction = await Transaction.findOneAndUpdate(
        { merchantId: merchantContext.merchantId, reference: eventPayload.txRef },
        { $set: update },
        { new: true, upsert: true, setDefaultsOnInsert: true }
      ).lean();

      logger.info('Blockchain transaction recorded', {
        merchantId: merchantContext.merchantId,
        reference: eventPayload.txRef,
        transactionHash
      });

      if (transaction?._id) {
        SettlementService.process(transaction._id).catch((err) => {
          logger.error('Failed to trigger settlement for blockchain transaction', {
            transactionId: transaction._id,
            reference: eventPayload.txRef,
            error: err.message
          });
        });
      }

      return transaction;
    } catch (error) {
      logger.error('Failed to record blockchain transaction', {
        reference: eventPayload.txRef,
        merchantId: merchantContext.merchantId,
        error: error.message
      });
      throw error;
    }
  }

  static async recordFlutterwaveTransaction(payload, options = {}) {
    if (!payload) {
      throw new Error('Flutterwave payload is required');
    }

    const data = payload.data || payload;
    const txRef = data.tx_ref || data.txRef || data.reference || payload.tx_ref;

    if (!txRef) {
      throw new Error('Unable to resolve tx_ref from Flutterwave payload');
    }

    const merchantContext = await resolveMerchant({
      merchantId: options.merchantId,
      merchantWalletAddress: options.merchantWalletAddress
    });

    const currency = (data.currency || payload.currency || 'NGN').toString().toUpperCase();
    const status = (data.status || payload.status || 'PENDING').toString().toUpperCase();
    const paymentType = data.payment_type || data.paymentType || options.paymentType || 'FIAT_TO_FIAT';
    const method = (data.payment_type || data.payment_method || options.method || 'FIAT').toString().toUpperCase();
    const chargedAmount = data.charged_amount !== undefined ? Number(data.charged_amount) : undefined;
    const amount = data.amount !== undefined ? Number(data.amount) : chargedAmount;
    const fee = data.app_fee ?? data.fee ?? options.chargeFee;

    const update = cleanObject({
      merchantId: merchantContext.merchantId,
      merchantWalletAddress: merchantContext.merchantWalletAddress,
      reference: txRef,
      transactionReference: txRef,
      payer: data.customer?.email || data.customer?.name || options.payer,
      fiatOrTokenType: 'FIAT',
      paymentType,
      amount,
      amountInMinor: amount !== undefined ? Math.round(amount * Math.pow(10, options.fiatDecimals || DEFAULT_FIAT_DECIMALS)).toString() : undefined,
      fiatEquivalent: chargedAmount !== undefined ? chargedAmount : amount,
      fiatCurrency: currency,
      chargeFee: fee !== undefined ? Number(fee) : undefined,
      symbol: currency,
      currency,
      method,
      provider: 'FLUTTERWAVE',
      status,
      eventTimestamp: data.created_at ? new Date(data.created_at) : new Date(),
      recordedAt: new Date(),
      metadata: {
        source: 'FLUTTERWAVE',
        narration: data.narration,
        flwId: data.id,
        processorResponse: data.processor_response,
        customer: data.customer,
        ...options.metadata
      },
      providerResponse: payload
    });

    try {
      const transaction = await Transaction.findOneAndUpdate(
        { merchantId: merchantContext.merchantId, reference: txRef },
        { $set: update },
        { new: true, upsert: true, setDefaultsOnInsert: true }
      ).lean();

   logger.info('Flutterwave transaction recorded', {
        merchantId: merchantContext.merchantId,
        reference: txRef,
        status
      });

      if (transaction?._id) {
        SettlementService.process(transaction._id).catch((err) => {
          logger.error('Failed to trigger settlement for Flutterwave transaction', {
            transactionId: transaction._id,
            reference: txRef,
            error: err.message
          });
        });
      }

      return transaction;
    } catch (error) {
      logger.error('Failed to record Flutterwave transaction', {
        reference: txRef,
        merchantId: merchantContext.merchantId,
        error: error.message
      });
      throw error;
    }
  }
}

module.exports = TransactionService;
