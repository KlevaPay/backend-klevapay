// config/flutterwave.js
const axios = require("axios");


const FLW_BASE = "https://api.flutterwave.com/v3";
const FLW_SECRET = process.env.FLUTTERWAVE_CLIENT_SECRET;
console.log('FLW_SECRET', FLW_SECRET);


const flwClient = axios.create({
  baseURL: FLW_BASE,
  headers: {
    Authorization: `Bearer ${FLW_SECRET}`,
    "Content-Type": "application/json",
  },
});

module.exports = { flwClient, FLW_BASE, FLW_SECRET };
