const { StatusCodes } = require('http-status-codes');

/**
 * Custom API Error class for consistent error handling
 * @class ApiError
 * @extends Error
 */
class ApiError extends Error {
  constructor(message, statusCode = StatusCodes.INTERNAL_SERVER_ERROR, details = null) {
    super(message);
    
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true;
    
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Create a Bad Request error
   * @param {string} message - Error message
   * @param {Object} details - Additional error details
   * @returns {ApiError}
   */
  static badRequest(message = 'Bad Request', details = null) {
    return new ApiError(message, StatusCodes.BAD_REQUEST, details);
  }

  /**
   * Create an Unauthorized error
   * @param {string} message - Error message
   * @param {Object} details - Additional error details
   * @returns {ApiError}
   */
  static unauthorized(message = 'Unauthorized', details = null) {
    return new ApiError(message, StatusCodes.UNAUTHORIZED, details);
  }

  /**
   * Create a Forbidden error
   * @param {string} message - Error message
   * @param {Object} details - Additional error details
   * @returns {ApiError}
   */
  static forbidden(message = 'Forbidden', details = null) {
    return new ApiError(message, StatusCodes.FORBIDDEN, details);
  }

  /**
   * Create a Not Found error
   * @param {string} message - Error message
   * @param {Object} details - Additional error details
   * @returns {ApiError}
   */
  static notFound(message = 'Not Found', details = null) {
    return new ApiError(message, StatusCodes.NOT_FOUND, details);
  }

  /**
   * Create a Conflict error
   * @param {string} message - Error message
   * @param {Object} details - Additional error details
   * @returns {ApiError}
   */
  static conflict(message = 'Conflict', details = null) {
    return new ApiError(message, StatusCodes.CONFLICT, details);
  }

  /**
   * Create a Validation error
   * @param {string} message - Error message
   * @param {Object} details - Additional error details
   * @returns {ApiError}
   */
  static validation(message = 'Validation Error', details = null) {
    return new ApiError(message, StatusCodes.UNPROCESSABLE_ENTITY, details);
  }

  /**
   * Create an Internal Server error
   * @param {string} message - Error message
   * @param {Object} details - Additional error details
   * @returns {ApiError}
   */
  static internal(message = 'Internal Server Error', details = null) {
    return new ApiError(message, StatusCodes.INTERNAL_SERVER_ERROR, details);
  }

  /**
   * Convert error to JSON response format
   * @returns {Object}
   */
  toJSON() {
    return {
      success: false,
      error: {
        name: this.name,
        message: this.message,
        statusCode: this.statusCode,
        details: this.details,
        stack: process.env.NODE_ENV === 'development' ? this.stack : undefined
      }
    };
  }
}

module.exports = ApiError;