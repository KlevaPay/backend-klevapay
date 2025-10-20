const asyncHandler = require('express-async-handler');
const Transaction = require('../models/Transaction');
const Merchant = require('../models/Merchant');
const ApiError = require('../lib/ApiError');
const logger = require('../lib/logger');

/**
 * @desc Get all transactions for a merchant by wallet address
 * @route GET /api/transactions/wallet/:walletAddress
 * @access Public (but should be protected in production)
 */
exports.getTransactionsByWallet = asyncHandler(async (req, res) => {
  const { walletAddress } = req.params;
  
  // Query parameters for filtering and pagination
  const {
    page = 1,
    limit = 20,
    status,
    method,
    currency,
    startDate,
    endDate,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = req.query;

  // Validate wallet address format (basic validation)
  if (!walletAddress || walletAddress.length < 10) {
    throw ApiError.badRequest('Invalid wallet address format');
  }

  // Find merchant by wallet address
  const merchant = await Merchant.findOne({ 
    walletAddress: walletAddress.toLowerCase() 
  });

  if (!merchant) {
    throw ApiError.notFound('No merchant found with this wallet address');
  }

  // Build query filter
  const filter = { merchantId: merchant._id };

  // Add optional filters
  if (status) {
    filter.status = status.toUpperCase();
  }

  if (method) {
    filter.method = method.toUpperCase();
  }

  if (currency) {
    filter.currency = currency.toUpperCase();
  }

  // Date range filtering
  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) {
      filter.createdAt.$gte = new Date(startDate);
    }
    if (endDate) {
      filter.createdAt.$lte = new Date(endDate);
    }
  }

  // Calculate pagination
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;

  // Build sort object
  const sort = {};
  sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

  try {
    // Get transactions with pagination
    const [transactions, totalCount] = await Promise.all([
      Transaction.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .populate('merchantId', 'businessName walletAddress')
        .lean(),
      Transaction.countDocuments(filter)
    ]);

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / limitNum);
    const hasNextPage = pageNum < totalPages;
    const hasPrevPage = pageNum > 1;

    // Calculate transaction summary
    const summary = await Transaction.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$amount' },
          totalTransactions: { $sum: 1 },
          successfulTransactions: {
            $sum: { $cond: [{ $eq: ['$status', 'PAID'] }, 1, 0] }
          },
          pendingTransactions: {
            $sum: { $cond: [{ $eq: ['$status', 'PENDING'] }, 1, 0] }
          },
          failedTransactions: {
            $sum: { $cond: [{ $eq: ['$status', 'FAILED'] }, 1, 0] }
          },
          totalSuccessfulAmount: {
            $sum: { $cond: [{ $eq: ['$status', 'PAID'] }, '$amount', 0] }
          }
        }
      }
    ]);

    const transactionSummary = summary[0] || {
      totalAmount: 0,
      totalTransactions: 0,
      successfulTransactions: 0,
      pendingTransactions: 0,
      failedTransactions: 0,
      totalSuccessfulAmount: 0
    };

    logger.info('Transactions retrieved for wallet', {
      walletAddress,
      merchantId: merchant._id,
      totalTransactions: totalCount,
      page: pageNum,
      limit: limitNum
    });

    res.json({
      success: true,
      message: 'Transactions retrieved successfully',
      data: {
        merchant: {
          id: merchant._id,
          businessName: merchant.businessName,
          walletAddress: merchant.walletAddress,
          kycStatus: merchant.kycStatus
        },
        transactions,
        pagination: {
          currentPage: pageNum,
          totalPages,
          totalCount,
          limit: limitNum,
          hasNextPage,
          hasPrevPage
        },
        summary: transactionSummary,
        filters: {
          status,
          method,
          currency,
          startDate,
          endDate,
          sortBy,
          sortOrder
        }
      }
    });

  } catch (error) {
    logger.error('Error retrieving transactions by wallet', {
      walletAddress,
      error: error.message
    });
    throw ApiError.internalServerError('Failed to retrieve transactions');
  }
});

/**
 * @desc Get transaction statistics for a merchant by wallet address
 * @route GET /api/transactions/wallet/:walletAddress/stats
 * @access Public (but should be protected in production)
 */
exports.getTransactionStatsByWallet = asyncHandler(async (req, res) => {
  const { walletAddress } = req.params;
  const { period = '30d' } = req.query; // 7d, 30d, 90d, 1y

  // Find merchant by wallet address
  const merchant = await Merchant.findOne({ 
    walletAddress: walletAddress.toLowerCase() 
  });

  if (!merchant) {
    throw ApiError.notFound('No merchant found with this wallet address');
  }

  // Calculate date range based on period
  const now = new Date();
  let startDate;

  switch (period) {
    case '7d':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case '30d':
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case '90d':
      startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      break;
    case '1y':
      startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      break;
    default:
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }

  try {
    const stats = await Transaction.aggregate([
      {
        $match: {
          merchantId: merchant._id,
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: null,
          totalTransactions: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
          successfulTransactions: {
            $sum: { $cond: [{ $eq: ['$status', 'PAID'] }, 1, 0] }
          },
          pendingTransactions: {
            $sum: { $cond: [{ $eq: ['$status', 'PENDING'] }, 1, 0] }
          },
          failedTransactions: {
            $sum: { $cond: [{ $eq: ['$status', 'FAILED'] }, 1, 0] }
          },
          successfulAmount: {
            $sum: { $cond: [{ $eq: ['$status', 'PAID'] }, '$amount', 0] }
          },
          averageTransactionAmount: { $avg: '$amount' },
          paymentMethods: {
            $push: '$method'
          },
          currencies: {
            $push: '$currency'
          }
        }
      }
    ]);

    const result = stats[0] || {
      totalTransactions: 0,
      totalAmount: 0,
      successfulTransactions: 0,
      pendingTransactions: 0,
      failedTransactions: 0,
      successfulAmount: 0,
      averageTransactionAmount: 0,
      paymentMethods: [],
      currencies: []
    };

    // Calculate success rate
    const successRate = result.totalTransactions > 0 
      ? (result.successfulTransactions / result.totalTransactions * 100).toFixed(2)
      : 0;

    // Get unique payment methods and currencies
    const uniquePaymentMethods = [...new Set(result.paymentMethods)];
    const uniqueCurrencies = [...new Set(result.currencies)];

    res.json({
      success: true,
      message: 'Transaction statistics retrieved successfully',
      data: {
        period,
        merchant: {
          id: merchant._id,
          businessName: merchant.businessName,
          walletAddress: merchant.walletAddress
        },
        statistics: {
          ...result,
          successRate: parseFloat(successRate),
          uniquePaymentMethods,
          uniqueCurrencies,
          periodStart: startDate,
          periodEnd: now
        }
      }
    });

  } catch (error) {
    logger.error('Error retrieving transaction stats by wallet', {
      walletAddress,
      error: error.message
    });
    throw ApiError.internalServerError('Failed to retrieve transaction statistics');
  }
});

/**
 * @desc Get recent transactions for a merchant by wallet address
 * @route GET /api/transactions/wallet/:walletAddress/recent
 * @access Public (but should be protected in production)
 */
exports.getRecentTransactionsByWallet = asyncHandler(async (req, res) => {
  const { walletAddress } = req.params;
  const { limit = 10 } = req.query;

  // Find merchant by wallet address
  const merchant = await Merchant.findOne({ 
    walletAddress: walletAddress.toLowerCase() 
  });

  if (!merchant) {
    throw ApiError.notFound('No merchant found with this wallet address');
  }

  try {
    const recentTransactions = await Transaction.find({ 
      merchantId: merchant._id 
    })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .populate('merchantId', 'businessName walletAddress')
      .lean();

    res.json({
      success: true,
      message: 'Recent transactions retrieved successfully',
      data: {
        merchant: {
          id: merchant._id,
          businessName: merchant.businessName,
          walletAddress: merchant.walletAddress
        },
        transactions: recentTransactions,
        count: recentTransactions.length
      }
    });

  } catch (error) {
    logger.error('Error retrieving recent transactions by wallet', {
      walletAddress,
      error: error.message
    });
    throw ApiError.internalServerError('Failed to retrieve recent transactions');
  }
});