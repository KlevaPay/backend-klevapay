// ================================================================
// DEPENDENCIES
// ================================================================

const { StatusCodes } = require('http-status-codes');
const ApiError = require('../lib/ApiError');
const logger = require('../lib/logger');


// ================================================================
// ERROR HANDLING MIDDLEWARE
// ================================================================

/**
 * Global error handling middleware
 * Handles all errors thrown in the application
 * @param {Error} err - Error object
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {Function} next - Next middleware function
 */
const globalErrorHandler = (err, req, res, next) => {
  let error = err;

  // Log the error
  logger.logError(error, req);

  // Convert non-ApiError instances to ApiError
  if (!(error instanceof ApiError)) {
    // Handle MongoDB validation errors
    if (error.name === 'ValidationError') {
      const message = Object.values(error.errors).map(e => e.message).join(', ');
      error = ApiError.validation('Validation Error', { details: message });
    }
    // Handle MongoDB duplicate key errors
    else if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      const value = error.keyValue[field];
      error = ApiError.conflict(`${field} '${value}' already exists`);
    }
    // Handle MongoDB cast errors
    else if (error.name === 'CastError') {
      error = ApiError.badRequest('Invalid ID format');
    }
    // Handle JWT errors
    else if (error.name === 'JsonWebTokenError') {
      error = ApiError.unauthorized('Invalid token');
    }
    else if (error.name === 'TokenExpiredError') {
      error = ApiError.unauthorized('Token expired');
    }
    // Handle Mongoose connection errors
    else if (error.name === 'MongoError' || error.name === 'MongooseError') {
      error = ApiError.internal('Database connection error');
    }
    // Handle multer file upload errors
    else if (error.code === 'LIMIT_FILE_SIZE') {
      error = ApiError.badRequest('File size too large');
    }
    else if (error.code === 'LIMIT_FILE_COUNT') {
      error = ApiError.badRequest('Too many files uploaded');
    }
    else if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      error = ApiError.badRequest('Unexpected file field');
    }
    // Handle syntax errors
    else if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
      error = ApiError.badRequest('Invalid JSON syntax');
    }
    // Default to internal server error
    else {
      error = new ApiError(
        process.env.NODE_ENV === 'production' ? 'Internal Server Error' : err.message,
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }

  // Send error response
  res.status(error.statusCode).json(error.toJSON());
};

/**
 * 404 Not Found middleware
 * Handles requests to non-existent endpoints
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {Function} next - Next middleware function
 */
const notFoundHandler = (req, res, next) => {
  // Ignore favicon requests to reduce log noise
  if (req.originalUrl.includes('favicon.ico')) {
    return res.status(204).end();
  }
  
  const error = ApiError.notFound(`Route ${req.originalUrl} not found`);
  next(error);
};

/**
 * Async error handler wrapper
 * Wraps async route handlers to catch and pass errors to error middleware
 * @param {Function} fn - Async function to wrap
 * @returns {Function} - Wrapped function
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Validation error handler
 * Handles express-validator validation errors
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {Function} next - Next middleware function
 */
const validationErrorHandler = (req, res, next) => {
  const { validationResult } = require('express-validator');
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorDetails = errors.array().map(error => ({
      field: error.param,
      message: error.msg,
      value: error.value
    }));
    
    const error = ApiError.validation('Validation failed', errorDetails);
    return next(error);
  }
  
  next();
};

module.exports = {
  globalErrorHandler,
  notFoundHandler,
  asyncHandler,
  validationErrorHandler
};