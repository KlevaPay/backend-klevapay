// ================================================================
// DEPENDENCIES
// ================================================================

const jwt = require('jsonwebtoken');
const logger = require('../lib/logger');
const ApiError = require('../lib/ApiError');


// ================================================================
// JWT UTILITIES CLASS
// ================================================================

/**
 * JWT Utilities for token generation and validation
 */
class JWTUtils {
  constructor() {
    this.accessTokenSecret = process.env.JWT_SECRET;
    this.refreshTokenSecret = process.env.JWT_REFRESH_SECRET;
    this.accessTokenExpiry = process.env.JWT_EXPIRE || '7d';
    this.refreshTokenExpiry = process.env.JWT_REFRESH_EXPIRE || '30d';
    
    if (!this.accessTokenSecret || !this.refreshTokenSecret) {
      throw new Error('JWT secrets are not configured');
    }
  }

  /**
   * Generate access token
   * @param {Object} payload - User data to include in token
   * @returns {string} - JWT access token
   */
  generateAccessToken(payload) {
    try {
      const tokenPayload = {
        userId: payload.userId,
        email: payload.email,
        businessName: payload.businessName,
        role: payload.role,
        verified: payload.verified,
        type: 'access'
      };

      return jwt.sign(tokenPayload, this.accessTokenSecret, {
        expiresIn: this.accessTokenExpiry,
        issuer: 'klevapay-api',
        audience: 'klevapay-clients'
      });
    } catch (error) {
      logger.error('Error generating access token:', error);
      throw new ApiError('Failed to generate access token', 500);
    }
  }

  /**
   * Generate refresh token
   * @param {Object} payload - User data to include in token
   * @returns {string} - JWT refresh token
   */
  generateRefreshToken(payload) {
    try {
      const tokenPayload = {
        userId: payload.userId,
        email: payload.email,
        type: 'refresh'
      };

      return jwt.sign(tokenPayload, this.refreshTokenSecret, {
        expiresIn: this.refreshTokenExpiry,
        issuer: 'klevapay-api',
        audience: 'klevapay-clients'
      });
    } catch (error) {
      logger.error('Error generating refresh token:', error);
      throw new ApiError('Failed to generate refresh token', 500);
    }
  }

  /**
   * Generate both access and refresh tokens
   * @param {Object} user - User object from database
   * @returns {Object} - Object containing both tokens
   */
  generateTokenPair(user) {
    const payload = {
      userId: user._id.toString(),
      email: user.email,
      businessName: user.businessName,
      role: user.role,
      verified: user.verified
    };

    const accessToken = this.generateAccessToken(payload);
    const refreshToken = this.generateRefreshToken(payload);

    logger.info('Token pair generated', {
      userId: payload.userId,
      email: payload.email
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: this.accessTokenExpiry
    };
  }

  /**
   * Verify access token
   * @param {string} token - JWT access token
   * @returns {Object} - Decoded token payload
   */
  verifyAccessToken(token) {
    try {
      const decoded = jwt.verify(token, this.accessTokenSecret, {
        issuer: 'klevapay-api',
        audience: 'klevapay-clients'
      });

      if (decoded.type !== 'access') {
        throw new ApiError('Invalid token type', 401);
      }

      return decoded;
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new ApiError('Invalid access token', 401);
      }
      if (error instanceof jwt.TokenExpiredError) {
        throw new ApiError('Access token has expired', 401);
      }
      if (error instanceof jwt.NotBeforeError) {
        throw new ApiError('Access token not active yet', 401);
      }
      
      logger.error('Error verifying access token:', error);
      throw new ApiError('Token verification failed', 401);
    }
  }

  /**
   * Verify refresh token
   * @param {string} token - JWT refresh token
   * @returns {Object} - Decoded token payload
   */
  verifyRefreshToken(token) {
    try {
      const decoded = jwt.verify(token, this.refreshTokenSecret, {
        issuer: 'klevapay-api',
        audience: 'klevapay-clients'
      });

      if (decoded.type !== 'refresh') {
        throw new ApiError('Invalid token type', 401);
      }

      return decoded;
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new ApiError('Invalid refresh token', 401);
      }
      if (error instanceof jwt.TokenExpiredError) {
        throw new ApiError('Refresh token has expired', 401);
      }
      if (error instanceof jwt.NotBeforeError) {
        throw new ApiError('Refresh token not active yet', 401);
      }
      
      logger.error('Error verifying refresh token:', error);
      throw new ApiError('Token verification failed', 401);
    }
  }

  /**
   * Extract token from Authorization header
   * @param {string} authHeader - Authorization header value
   * @returns {string|null} - Extracted token or null
   */
  extractTokenFromHeader(authHeader) {
    if (!authHeader) {
      return null;
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return null;
    }

    return parts[1];
  }

  /**
   * Decode token without verification (for debugging)
   * @param {string} token - JWT token
   * @returns {Object} - Decoded token payload
   */
  decodeToken(token) {
    try {
      return jwt.decode(token, { complete: true });
    } catch (error) {
      logger.error('Error decoding token:', error);
      return null;
    }
  }

  /**
   * Get token expiration time
   * @param {string} token - JWT token
   * @returns {Date|null} - Expiration date or null
   */
  getTokenExpiration(token) {
    try {
      const decoded = jwt.decode(token);
      if (decoded && decoded.exp) {
        return new Date(decoded.exp * 1000);
      }
      return null;
    } catch (error) {
      logger.error('Error getting token expiration:', error);
      return null;
    }
  }

  /**
   * Check if token is expired
   * @param {string} token - JWT token
   * @returns {boolean} - True if expired
   */
  isTokenExpired(token) {
    const expiration = this.getTokenExpiration(token);
    if (!expiration) {
      return true;
    }
    return new Date() >= expiration;
  }

  /**
   * Refresh access token using refresh token
   * @param {string} refreshToken - Valid refresh token
   * @param {Object} user - Updated user object from database
   * @returns {Object} - New token pair
   */
  refreshAccessToken(refreshToken, user) {
    try {
      // Verify the refresh token
      const decoded = this.verifyRefreshToken(refreshToken);
      
      // Ensure the token belongs to the same user
      if (decoded.userId !== user._id.toString()) {
        throw new ApiError('Token user mismatch', 401);
      }

      // Generate new token pair
      return this.generateTokenPair(user);
    } catch (error) {
      logger.error('Error refreshing access token:', error);
      throw error;
    }
  }

  /**
   * Generate a secure random token (for password reset, etc.)
   * @param {number} length - Token length (default: 32)
   * @returns {string} - Random token
   */
  generateSecureToken(length = 32) {
    const crypto = require('crypto');
    return crypto.randomBytes(length).toString('hex');
  }
}

// Create and export singleton instance
const jwtUtils = new JWTUtils();
module.exports = jwtUtils;