const { ethers } = require("ethers");
const CryptoIntegrationConfig = require("../config/crypto-integration");
const usdtABI = require("../utils/usdt");

class CryptoIntegrationService {
  contract;
  provider;
  secretKey;
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
}

module.exports = CryptoIntegrationService;
