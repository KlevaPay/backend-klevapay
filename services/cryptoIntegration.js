const { ethers } = require("ethers");
const CryptoIntegrationConfig = require("../config/crypto-integration");
const usdtABI = require("../utils/usdt");
const TransactionService = require("./transactionService");
const logger = require("../lib/logger");

const DEFAULT_TOKEN_DECIMALS = 6;
const DEFAULT_FIAT_DECIMALS = 2;

class CryptoIntegrationService {
  contract;
  provider;
  secretKey;
  _paymentRecordedUnsubscribe;
  _networkName;
//   contractAddress = new CryptoIntegrationConfig().getContractAddress();

  constructor() {
    const { contract, provider } = new CryptoIntegrationConfig().getContract();

    if (!contract) throw new Error("Contract not initialized in config");
    if (!provider) throw new Error("Provider not initialized in config");

    this.contract = contract;
    this.provider = provider;
    this.secretKey = process.env.ADMIN_SECRET;

    if (!this.secretKey)
      throw new Error("Missing ADMIN_SECRET in environment variables");
  }

  _getSignerContract() {
    if (!this.secretKey)
      throw new Error(
        "Private key required to send transaction (set ADMIN_SECRET in .env)"
      );

    const wallet = new ethers.Wallet(this.secretKey, this.provider);
    return this.contract.connect(wallet);
  }

  async getTotalLiquidity() {
    try {
      return await this.contract.totalLiquidity();
    } catch (err) {
      throw new Error(`getTotalLiquidity failed: ${err.message || err}`);
    }
  }

  async getOwner() {
    try {
      return await this.contract.owner();
    } catch (err) {
      throw new Error(`getOwner failed: ${err.message || err}`);
    }
  }

  async addLiquidity(amount) {
  try {
    const wallet = new ethers.Wallet(this.secretKey, this.provider);

    const usdt = new ethers.Contract(process.env.USDT_ADDRESS, usdtABI, wallet);

    const approveTx = await usdt.approve(
      this.contract.target,
      ethers.parseUnits(`${amount}`, 6)
    );
    await approveTx.wait();
    const signerContract = this.contract.connect(wallet);

    const tx = await signerContract.addLiquidity(ethers.parseUnits(`${amount}`, 6));
    const receipt = await tx.wait();
    console.log("Liquidity added:", receipt.transactionHash);
    return receipt;

  } catch (err) {
    throw new Error(`addLiquidity failed: ${err.message || err}`);
  }
}

  async removeLiquidity(amount) {
    const signerContract = this._getSignerContract();
    try {
      const wallet = new ethers.Wallet(this.secretKey, this.provider);

      const usdt = new ethers.Contract(process.env.USDT_ADDRESS, usdtABI, wallet);

      // const approveTx = await usdt.approve(
      //   this.contract.target,
      //   ethers.parseUnits(`${amount}`, 6)
      // );
      // await approveTx.wait();
      
      const signerContract = this.contract.connect(wallet);
      const tx = await signerContract.removeLiquidity(amount);
      const receipt = await tx.wait();
      console.log("Liquidity removed:", receipt.transactionHash);
      return receipt;
    } catch (err) {
      throw new Error(`removeLiquidity failed: ${err.message || err}`);
    }
  }

  async creditMerchant(merchant, amount, chargeFee, txRef) {
    try {
      const signerContract = this._getSignerContract();
      const wallet = new ethers.Wallet(this.secretKey, this.provider);
  
      const usdt = new ethers.Contract(process.env.USDT_ADDRESS, usdtABI, wallet);
  
      const balance = await usdt.balanceOf(wallet.address);
      // console.log("USDT Balance:", ethers.formatUnits(balance, 6));
  
      const approveTx = await usdt.approve(
        this.contract.target,
        ethers.parseUnits(`${amount}`, 6)
      );
      await approveTx.wait();
      // const signerContract = this.contract.connect(wallet);
      const tx = await signerContract.creditMerchant(
        merchant,
        ethers.parseUnits(`${amount}`, 6),
        chargeFee,
        txRef
      );
      const receipt = await tx.wait();
      console.log("✅ Merchant credited:", receipt.transactionHash);
      return receipt;
    } catch (err) {
      throw new Error(`creditMerchant failed: ${err.message || err}`);
    }
  }

  async payWithToken({ tokenIn, amountIn, merchant, tokenSymbol, txRef, value, amountDecimals = DEFAULT_TOKEN_DECIMALS }) {
    if (!tokenIn || !amountIn || !merchant || !tokenSymbol || !txRef) {
      throw new Error("Missing required fields: tokenIn, amountIn, merchant, tokenSymbol, txRef");
    }

    const signerContract = this._getSignerContract();

    const parsedAmount = typeof amountIn === "bigint"
      ? amountIn
      : ethers.parseUnits(`${amountIn}`, amountDecimals);

    const txOptions = {};
    if (value !== undefined && value !== null) {
      txOptions.value = typeof value === "bigint" ? value : ethers.parseUnits(`${value}`, 18);
    }

    try {
      const tx = await signerContract.payWithToken(
        tokenIn,
        parsedAmount,
        merchant,
        tokenSymbol,
        txRef,
        txOptions
      );

      const receipt = await tx.wait();
      logger.info("🔁 payWithToken transaction completed", {
        hash: receipt.transactionHash,
        merchant,
        tokenSymbol,
        txRef
      });

      return receipt;
    } catch (err) {
      throw new Error(`payWithToken failed: ${err.message || err}`);
    }
  }

  async _getNetworkName() {
    if (this._networkName) return this._networkName;

    try {
      const network = await this.provider.getNetwork();
      this._networkName = network?.name || `chain-${network?.chainId || 'unknown'}`;
    } catch (err) {
      logger.warn("Unable to resolve provider network", err.message);
      this._networkName = undefined;
    }

    return this._networkName;
  }

  watchPaymentRecorded(callback) {
    if (typeof callback !== "function") {
      throw new Error("callback is required to watch PaymentRecorded events");
    }

    const handler = async (
      payer,
      merchant,
      amount,
      tokenSymbol,
      fiatEquivalent,
      txRef,
      timestamp,
      paymentType,
      status,
      chargeFee,
      event
    ) => {
      const payload = {
        payer,
        merchant,
        amount,
        tokenSymbol,
        fiatEquivalent,
        txRef,
        timestamp,
        paymentType,
        status,
        chargeFee
      };

      const networkName = await this._getNetworkName();

      const context = {
        transactionHash: event?.log?.transactionHash || event?.transactionHash,
        blockNumber: event?.log?.blockNumber || event?.blockNumber,
        network: networkName,
        providerResponse: event
      };

      try {
        await callback(payload, context);
      } catch (err) {
        logger.error("PaymentRecorded handler failed", {
          reference: txRef,
          error: err.message
        });
      }
    };

    this.contract.on("PaymentRecorded", handler);

    return () => {
      this.contract.off("PaymentRecorded", handler);
    };
  }

  startPaymentRecordedPersistence(options = {}) {
    if (this._paymentRecordedUnsubscribe) {
      return this._paymentRecordedUnsubscribe;
    }

    const decimals = options.decimals ?? DEFAULT_TOKEN_DECIMALS;
    const fiatDecimals = options.fiatDecimals ?? DEFAULT_FIAT_DECIMALS;

    this._paymentRecordedUnsubscribe = this.watchPaymentRecorded(async (payload, context) => {
      try {
        await TransactionService.recordBlockchainTransaction(payload, {
          merchantWalletAddress: payload.merchant,
          decimals,
          fiatDecimals,
          transactionHash: context.transactionHash,
          blockNumber: context.blockNumber,
          network: context.network,
          metadata: options.metadata,
          providerResponse: context.providerResponse
        });
      } catch (err) {
        logger.error("Failed to persist PaymentRecorded transaction", {
          reference: payload.txRef,
          error: err.message
        });
      }
    });

    logger.info("🛰️ PaymentRecorded listener initialized");
    return this._paymentRecordedUnsubscribe;
  }

  stopPaymentRecordedPersistence() {
    if (this._paymentRecordedUnsubscribe) {
      this._paymentRecordedUnsubscribe();
      this._paymentRecordedUnsubscribe = undefined;
      logger.info("🛑 PaymentRecorded listener stopped");
    }
  }
}

module.exports = CryptoIntegrationService;
