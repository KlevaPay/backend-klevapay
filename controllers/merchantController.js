
const Merchant = require('../models/Merchant');
const ApiError = require('../lib/ApiError');
const { asyncHandler } = require('../middlewares/errorHandler');
const logger = require('../lib/logger');


exports.createBusiness = asyncHandler(async (req, res) => {
  const { walletAddress, businessName, payoutPreferences, country } = req.body;

  logger.info('New business creation attempt', { walletAddress, businessName });

  if (!walletAddress) throw ApiError.badRequest('Wallet address is required');
  if (!businessName) throw ApiError.badRequest('Business name is required');

  // Check for existing records
  const existingWallet = await Merchant.findOne({ walletAddress: walletAddress.toLowerCase() });
  if (existingWallet) throw ApiError.conflict('Wallet address already linked to a business');

  const existingBusiness = await Merchant.findOne({ businessName });
  if (existingBusiness) throw ApiError.conflict('Business name already exists');

  // Create merchant
  const merchant = await Merchant.create({
    walletAddress: walletAddress.toLowerCase(),
    businessName,
    payoutPreferences,
    country
  });

  logger.info('Business created successfully', { id: merchant._id, walletAddress });

  res.status(201).json({
    success: true,
    message: 'Business created successfully',
    data: merchant
  });
});

exports.getBusinessByWallet = asyncHandler(async (req, res) => {
  const { walletAddress } = req.params;

  const merchant = await Merchant.findOne({ walletAddress: walletAddress.toLowerCase() });
  if (!merchant) throw ApiError.notFound('Business not found for this wallet');

  res.json({
    success: true,
    data: merchant
  });
});


exports.getAllBusinesses = asyncHandler(async (req, res) => {
  const merchants = await Merchant.find().sort({ createdAt: -1 });
  res.json({
    success: true,
    count: merchants.length,
    data: merchants
  });
});
