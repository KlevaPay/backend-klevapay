// ...existing code...
const ethers = require("ethers");
const contractABI = require("../utils/abi");

class CryptoIntegrationConfig {
    contractAddress;
    provider;
    contract;

    constructor() {
        const rpcUrl = process.env.RPC_URL || "https://rpc.sepolia-api.lisk.com";
        this.contractAddress = process.env.CONTRACT_ADDRESS || "";

        if (!this.contractAddress) {
            throw new Error("CONTRACT_ADDRESS environment variable is not set");
        }

        const JsonRpcProvider =
            (ethers && ethers.providers && ethers.providers.JsonRpcProvider) ||
            ethers.JsonRpcProvider ||
            null;

        const ContractClass =
            ethers.Contract ||
            (ethers && ethers.contracts && ethers.contracts.Contract) ||
            null;

        if (!JsonRpcProvider) {
            throw new Error(
                "JsonRpcProvider not found on ethers. Run `npm ls ethers` to check installed version. " +
                "If using ethers v6 with CommonJS, prefer `const ethers = require('ethers')` and access JsonRpcProvider via `ethers.JsonRpcProvider` or convert the project to ESM."
            );
        }

        if (!ContractClass) {
            throw new Error(
                "Contract class not found on ethers — check your ethers installation and module system (npm ls ethers)."
            );
        }

        this.provider = new JsonRpcProvider(rpcUrl);
        this.contract = new ContractClass(this.contractAddress, contractABI, this.provider);
    }

    getContractAddress() {
        return this.contractAddress;
    }

    getContract() {
        return {
            contract: this.contract,
            provider: this.provider,
        };
    }
}

module.exports = CryptoIntegrationConfig;
