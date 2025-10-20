const CryptoIntegrationService = require("../services/cryptoIntegration");

async function getTotalLiquidity(req, res) {
    try {
        const total = await new CryptoIntegrationService().getTotalLiquidity();
        return res.json({ success: true, data: total.toString() });
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message || String(err) });
    }
}

async function getOwner(req, res) {
    try {
        const owner = await new CryptoIntegrationService().getOwner();
        return res.json({ success: true, data: owner });
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message || String(err) });
    }
}

async function addLiquidity(req, res) {
    try {
        const { amount } = req.body || {};
        if (amount === undefined) {
            return res.status(400).json({ success: false, error: "Missing required field: amount" });
        }
        const receipt = await new CryptoIntegrationService().addLiquidity(amount);
        return res.json({ success: true, data: receipt });
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message || String(err) });
    }
}

async function payWithToken(req, res) {
    try {
        const { tokenIn, amountIn, merchant, tokenSymbol, txRef, value } = req.body || {};
        if (!tokenIn || !amountIn || !merchant || !tokenSymbol || !txRef) {
            return res.status(400).json({ success: false, error: "Missing required fields: tokenIn, amountIn, merchant, tokenSymbol, txRef" });
        }
        const receipt = await new CryptoIntegrationService().payWithToken({
            tokenIn,
            amountIn,
            merchant,
            tokenSymbol,
            txRef,
            value
        });
        return res.json({ success: true, data: receipt });
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message || String(err) });
    }
}

async function removeLiquidity(req, res) {
    try {
        const { amount } = req.body || {};
        if (amount === undefined) {
            return res.status(400).json({ success: false, error: "Missing required field: amount" });
        }
        const receipt = await new CryptoIntegrationService().removeLiquidity(amount);
        return res.json({ success: true, data: receipt });
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message || String(err) });
    }
}

async function creditMerchant(req, res) {
    try {
        const { merchant, amount, chargeFee, txRef } = req.body || {};
        if (!merchant || amount === undefined || chargeFee === undefined || !txRef) {
            return res.status(400).json({ success: false, error: "Missing required fields: merchant, amount, chargeFee, txRef" });
        }
        const receipt = await new CryptoIntegrationService().creditMerchant(merchant, amount, chargeFee, txRef);
        return res.json({ success: true, data: receipt });
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message || String(err) });
    }
}

 module.exports = {
    getTotalLiquidity,
    getOwner,
    addLiquidity,
    payWithToken,
    removeLiquidity,
    creditMerchant
};
