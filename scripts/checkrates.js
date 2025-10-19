// ...existing code...
const dotenv = require('dotenv');
dotenv.config();
const ethers = require('ethers');
const { convert, getRates } = require('../services/pricefeed');

const provider = new ethers.JsonRpcProvider(process.env.PRICE_RPC_URL);

(async () => {
  try {
    console.log('ENV:', {
      PRICE_RPC_URL: !!process.env.PRICE_RPC_URL,
      ETH_USD_FEED: process.env.ETH_USD_FEED,
      USDT_USD_FEED: process.env.USDT_USD_FEED,
      NGN_USD_RATE: process.env.NGN_USD_RATE,
    });

    const network = await provider.getNetwork();
    console.log('Provider network:', network);

    for (const name of ['ETH_USD_FEED', 'USDT_USD_FEED']) {
      const addr = process.env[name];
      if (!addr) {
        console.log(`${name} missing`);
        continue;
      }
      const code = await provider.getCode(addr);
      console.log(`${name} (${addr}) code:`, code === '0x' ? '<no contract (0x)>' : `${code.slice(0, 64)}...`);
    }

    console.log('Live rates:', await getRates());
    console.log('10000 NGN -> USD:', await convert('NGN', 'USD', 10000));
    console.log('100 USD -> ETH:', await convert('USD', 'ETH', 100));
  } catch (err) {
    console.error('Error checking rates:', err);
    process.exit(1);
  }
})();
