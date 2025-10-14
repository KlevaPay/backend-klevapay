const axios = require('axios');
const crypto = require('crypto');

const OPAY_BASE = process.env.OPAY_BASE;
const OPAY_SECRET_KEY = process.env.OPAY_SECRET_KEY;
const OPAY_APP_ID = process.env.OPAY_APP_ID;
const OPAY_PUBLIC_KEY_PEM = process.env.OPAY_HASH_SECRET; // For card encryption only
const OPAY_PUBLIC_KEY = process.env.OPAY_PUBLIC_KEY; // For API header
const OPAY_MERCHANT_ID = process.env.OPAY_MERCHANT_ID;
const OPAY_WEBHOOK_SECRET = process.env.OPAY_WEBHOOK_SECRET;


// Axios client for payment creation (public key auth)
const opayClient = axios.create({
  baseURL: OPAY_BASE,
  headers: {
    'Content-Type': 'application/json',
    ...(OPAY_APP_ID ? { 'X-APP-ID': OPAY_APP_ID } : {}),
    'Authorization': `Bearer ${OPAY_PUBLIC_KEY}`,
    'MerchantId': OPAY_MERCHANT_ID,
  },
});

// Helper to generate HMAC-SHA512 signature for status/refund APIs
function generateOpaySignature(payload) {
  if (!OPAY_SECRET_KEY) throw new Error('OPAY_SECRET_KEY is not set');
  return crypto.createHmac('sha512', OPAY_SECRET_KEY).update(payload).digest('hex');
}

// Axios client for status/refund APIs (signature auth)
function getOpayStatusClient(payload) {
  const signature = generateOpaySignature(payload);
  return axios.create({
    baseURL: OPAY_BASE,
    headers: {
      'Content-Type': 'application/json',
      ...(OPAY_APP_ID ? { 'X-APP-ID': OPAY_APP_ID } : {}),
      'Authorization': `Bearer ${signature}`,
      'MerchantId': OPAY_MERCHANT_ID,
    },
  });
}

/**
 * Encrypt card data with Opay RSA public key (PEM)
 * Expects `card` object { number, expiryMonth, expiryYear, cvv }
 * Returns base64-encoded ciphertext
 */
function encryptCardData(cardObj) {
  if (!OPAY_PUBLIC_KEY_PEM) throw new Error('OPAY_PUBLIC_KEY_PEM is not set. Set this to the RSA public key (PEM) provided by Opay, e.g. -----BEGIN PUBLIC KEY-----...');
  // Quick validation: crypto.publicEncrypt expects a PEM or DER formatted RSA key.
  // Many Opay dashboard values (like OPAYPUB... identifiers) are NOT RSA PEM blocks.
  const looksLikePem = typeof OPAY_PUBLIC_KEY_PEM === 'string' && OPAY_PUBLIC_KEY_PEM.includes('-----BEGIN');
  if (!looksLikePem) {
    // Provide a helpful error to avoid OpenSSL DECODER unsupported errors later
    throw new Error('OPAY_PUBLIC_KEY_PEM does not look like a PEM-formatted RSA public key. It appears to be a short identifier (e.g. OPAYPUB...). For card encryption you must use the PEM public key from Opay (starts with -----BEGIN PUBLIC KEY-----). If you only have a public key id, fetch the PEM key from your Opay dashboard or contact Opay support.');
  }
  const text = JSON.stringify(cardObj);
  const buffer = Buffer.from(text, 'utf8');
  const encrypted = crypto.publicEncrypt(
    {
      key: OPAY_PUBLIC_KEY_PEM,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: 'sha256',
    },
    buffer
  );
  return encrypted.toString('base64');
}

/**
 * Compute HMAC-SHA256 webhook signature using OPAY_WEBHOOK_SECRET
 * (some Opay integrations use HMAC; adapt if they use RSA signature)
 */
function computeWebhookSignature(rawBody) {
  const secret = OPAY_WEBHOOK_SECRET || OPAY_SECRET_KEY;
  return crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
}

/**
 * Verify incoming webhook signature header.
 * Expects header name 'x-opay-signature' (adjust to Opay header)
 */
function verifyWebhookSignature(headers, rawBody) {
  const headerName = 'x-opay-signature';
  const received = headers[headerName] || headers[headerName.toUpperCase()];
  if (!received) return false;
  const expected = computeWebhookSignature(rawBody);
  return received === expected;
}

module.exports = {
  opayClient, // for payment creation
  getOpayStatusClient, // for status/refund APIs
  encryptCardData,
  computeWebhookSignature,
  verifyWebhookSignature,
  generateOpaySignature,
};
