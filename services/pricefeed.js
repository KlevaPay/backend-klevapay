require("dotenv").config();
const ethers = require("ethers");
const aggregatorV3InterfaceABI = require("../utils/pricefeed");

const provider = new ethers.JsonRpcProvider(process.env.PRICE_RPC_URL);

async function getChainlinkPrice(feedAddress) {
  if (!feedAddress) throw new Error("feedAddress not provided");

  const feed = new ethers.Contract(feedAddress, aggregatorV3InterfaceABI, provider);

  try {
    const decimals = Number(await feed.decimals());
    const roundData = await feed.latestRoundData();

    const answer = roundData?.answer ?? (Array.isArray(roundData) ? roundData[1] : undefined);
    if (answer == null) throw new Error("latestRoundData returned no answer");
    return Number(answer) / (10 ** decimals);
  } catch (err) {
    throw new Error(`Failed to read price feed ${feedAddress}: ${err.message}`);
  }
}

async function getRates() {
  const ETH_USD = await getChainlinkPrice(process.env.ETH_USD_FEED);
  const USDT_USD = 1;
  const NGN_USD = Number(process.env.NGN_USD_RATE);

  return { ETH_USD, USDT_USD, NGN_USD };
}

async function convert(from, to, amount) {
  const { ETH_USD, USDT_USD, NGN_USD } = await getRates();
  const amt = Number(amount);

  switch (`${from}/${to}`.toUpperCase()) {
    case "NGN/USD":
      return amt / NGN_USD;
    case "USD/NGN":
      return amt * NGN_USD;
    case "USD/ETH":
      return amt / ETH_USD;
    case "NGN/ETH":
      return (amt / NGN_USD) / ETH_USD;
    case "NGN/USDT":
      return (amt / NGN_USD) / USDT_USD;
    case "USD/USDT":
      return amt / USDT_USD;
    default:
      throw new Error(`Unsupported pair: ${from}/${to}`);
  }
}

module.exports = { convert, getRates, getChainlinkPrice };