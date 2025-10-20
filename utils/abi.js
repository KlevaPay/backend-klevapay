module.exports = [
    {
        "inputs": [
            { "internalType": "address", "name": "_router", "type": "address" },
            { "internalType": "address", "name": "_USDT", "type": "address" },
            { "internalType": "address", "name": "_WETH", "type": "address" }
        ],
        "stateMutability": "nonpayable",
        "type": "constructor"
    },
    { "inputs": [], "name": "InsufficientLiquidity", "type": "error" },
    { "inputs": [], "name": "InvalidAddress", "type": "error" },
    { "inputs": [{ "internalType": "uint256", "name": "amount", "type": "uint256" }], "name": "InvalidAmount", "type": "error" },
    { "inputs": [{ "internalType": "uint256", "name": "amount", "type": "uint256" }], "name": "InvalidAmount", "type": "error" },
    { "inputs": [{ "internalType": "address", "name": "merchant", "type": "address" }], "name": "InvalidMerchant", "type": "error" },
    { "inputs": [{ "internalType": "address", "name": "token", "type": "address" }], "name": "InvalidToken", "type": "error" },
    { "inputs": [{ "internalType": "address", "name": "owner", "type": "address" }], "name": "OwnableInvalidOwner", "type": "error" },
    { "inputs": [{ "internalType": "address", "name": "account", "type": "address" }], "name": "OwnableUnauthorizedAccount", "type": "error" },
    { "inputs": [], "name": "ReentrancyGuardReentrantCall", "type": "error" },
    { "inputs": [{ "internalType": "address", "name": "token", "type": "address" }], "name": "TokenMustBeZero", "type": "error" },
    { "inputs": [], "name": "TransferFailed", "type": "error" },
    {
        "anonymous": false,
        "inputs": [
            { "indexed": true, "internalType": "address", "name": "admin", "type": "address" },
            { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" },
            { "indexed": false, "internalType": "uint256", "name": "newTotal", "type": "uint256" }
        ],
        "name": "LiquidityAdded",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            { "indexed": true, "internalType": "address", "name": "admin", "type": "address" },
            { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" },
            { "indexed": false, "internalType": "uint256", "name": "newTotal", "type": "uint256" }
        ],
        "name": "LiquidityRemoved",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            { "indexed": true, "internalType": "address", "name": "previousOwner", "type": "address" },
            { "indexed": true, "internalType": "address", "name": "newOwner", "type": "address" }
        ],
        "name": "OwnershipTransferred",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            { "indexed": true, "internalType": "address", "name": "payer", "type": "address" },
            { "indexed": true, "internalType": "address", "name": "merchant", "type": "address" },
            { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" },
            { "indexed": false, "internalType": "string", "name": "tokenSymbol", "type": "string" },
            { "indexed": false, "internalType": "uint256", "name": "fiatEquivalent", "type": "uint256" },
            { "indexed": false, "internalType": "string", "name": "txRef", "type": "string" },
            { "indexed": false, "internalType": "uint256", "name": "timestamp", "type": "uint256" },
            { "indexed": false, "internalType": "string", "name": "paymentType", "type": "string" },
            { "indexed": false, "internalType": "string", "name": "status", "type": "string" },
            { "indexed": false, "internalType": "uint256", "name": "chargeFee", "type": "uint256" }
        ],
        "name": "PaymentRecorded",
        "type": "event"
    },
    {
        "inputs": [],
        "name": "USDT",
        "outputs": [{ "internalType": "address", "name": "", "type": "address" }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "WETH",
        "outputs": [{ "internalType": "address", "name": "", "type": "address" }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{ "internalType": "uint256", "name": "amount", "type": "uint256" }],
        "name": "addLiquidity",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            { "internalType": "address", "name": "merchant", "type": "address" },
            { "internalType": "uint256", "name": "amount", "type": "uint256" },
            { "internalType": "uint256", "name": "chargeFee", "type": "uint256" },
            { "internalType": "string", "name": "txRef", "type": "string" }
        ],
        "name": "creditMerchant",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "owner",
        "outputs": [{ "internalType": "address", "name": "", "type": "address" }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            { "internalType": "address", "name": "tokenIn", "type": "address" },
            { "internalType": "uint256", "name": "amountIn", "type": "uint256" },
            { "internalType": "address", "name": "merchant", "type": "address" },
            { "internalType": "string", "name": "tokenSymbol", "type": "string" },
            { "internalType": "string", "name": "txRef", "type": "string" }
        ],
        "name": "payWithToken",
        "outputs": [],
        "stateMutability": "payable",
        "type": "function"
    },
    {
        "inputs": [{ "internalType": "uint256", "name": "amount", "type": "uint256" }],
        "name": "removeLiquidity",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "renounceOwnership",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "router",
        "outputs": [{ "internalType": "contract IUniswapV2Router", "name": "", "type": "address" }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "totalLiquidity",
        "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{ "internalType": "address", "name": "newOwner", "type": "address" }],
        "name": "transferOwnership",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    { "stateMutability": "payable", "type": "receive" }
];
