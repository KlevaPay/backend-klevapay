// ================================================================
// DEPENDENCIES
// ================================================================

const crypto = require('crypto');
const logger = require('../lib/logger');


// ================================================================
// OTP UTILITIES CLASS
// ================================================================

/**
 * OTP Utilities for generating and validating one-time passwords
 */
class OTPUtils {
  constructor() {
    this.otpLength = 6;
    this.expiryMinutes = 15;
    this.maxAttempts = 3;
  }

  /**
   * Generate a secure 6-digit OTP
   * @returns {string} - 6-digit OTP code
   */
  generateOTP() {
    try {
      // Generate a cryptographically secure random 6-digit number
      const buffer = crypto.randomBytes(4);
      const number = buffer.readUInt32BE(0);
      const otp = (number % 900000 + 100000).toString();
      
      logger.info('OTP generated successfully', {
        length: otp.length,
        timestamp: new Date().toISOString()
      });
      
      return otp;
    } catch (error) {
      logger.error('Error generating OTP:', error);
      // Fallback to Math.random if crypto fails
      return Math.floor(100000 + Math.random() * 900000).toString();
    }
  }

  /**
   * Generate OTP with expiration time
   * @returns {Object} - Object containing OTP code and expiration time
   */
  generateOTPWithExpiry() {
    const code = this.generateOTP();
    const expiresAt = new Date(Date.now() + this.expiryMinutes * 60 * 1000);
    
    return {
      code,
      expiresAt,
      attempts: 0
    };
  }

  /**
   * Validate OTP format
   * @param {string} otp - OTP code to validate
   * @returns {boolean} - True if format is valid
   */
  isValidOTPFormat(otp) {
    if (!otp || typeof otp !== 'string') {
      return false;
    }
    
    // Check if it's exactly 6 digits
    const otpRegex = /^\d{6}$/;
    return otpRegex.test(otp.trim());
  }

  /**
   * Check if OTP is expired
   * @param {Date} expiresAt - Expiration timestamp
   * @returns {boolean} - True if expired
   */
  isOTPExpired(expiresAt) {
    if (!expiresAt) {
      return true;
    }
    
    return new Date() > new Date(expiresAt);
  }

  /**
   * Validate OTP against stored data
   * @param {string} providedOTP - OTP provided by user
   * @param {Object} storedOTP - Stored OTP object from database
   * @returns {Object} - Validation result
   */
  validateOTP(providedOTP, storedOTP) {
    const result = {
      valid: false,
      reason: null,
      shouldClearOTP: false
    };

    // Check if OTP format is valid
    if (!this.isValidOTPFormat(providedOTP)) {
      result.reason = 'Invalid OTP format. Please enter a 6-digit code.';
      return result;
    }

    // Check if stored OTP exists
    if (!storedOTP || !storedOTP.code) {
      result.reason = 'No verification code found. Please request a new code.';
      result.shouldClearOTP = true;
      return result;
    }

    // Check if OTP has expired
    if (this.isOTPExpired(storedOTP.expiresAt)) {
      result.reason = 'Verification code has expired. Please request a new code.';
      result.shouldClearOTP = true;
      return result;
    }

    // Check if too many attempts
    if (storedOTP.attempts >= this.maxAttempts) {
      result.reason = 'Too many failed attempts. Please request a new code.';
      result.shouldClearOTP = true;
      return result;
    }

    // Check if OTP matches
    if (storedOTP.code !== providedOTP.trim()) {
      result.reason = 'Invalid verification code. Please try again.';
      return result;
    }

    // OTP is valid
    result.valid = true;
    result.shouldClearOTP = true;
    
    logger.info('OTP validated successfully', {
      attempts: storedOTP.attempts,
      timestamp: new Date().toISOString()
    });
    
    return result;
  }

  /**
   * Get time remaining for OTP expiry
   * @param {Date} expiresAt - Expiration timestamp
   * @returns {Object} - Time remaining in minutes and seconds
   */
  getTimeRemaining(expiresAt) {
    if (!expiresAt) {
      return { minutes: 0, seconds: 0, expired: true };
    }

    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = expiry - now;

    if (diff <= 0) {
      return { minutes: 0, seconds: 0, expired: true };
    }

    const minutes = Math.floor(diff / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    return { minutes, seconds, expired: false };
  }

  /**
   * Format time remaining for display
   * @param {Date} expiresAt - Expiration timestamp
   * @returns {string} - Formatted time string
   */
  formatTimeRemaining(expiresAt) {
    const { minutes, seconds, expired } = this.getTimeRemaining(expiresAt);
    
    if (expired) {
      return 'Expired';
    }
    
    if (minutes > 0) {
      return `${minutes} minute${minutes !== 1 ? 's' : ''} ${seconds} second${seconds !== 1 ? 's' : ''}`;
    }
    
    return `${seconds} second${seconds !== 1 ? 's' : ''}`;
  }

  /**
   * Generate a secure alphanumeric token (for password reset)
   * @param {number} length - Token length (default: 32)
   * @returns {string} - Secure token
   */
  generateSecureToken(length = 32) {
    try {
      return crypto.randomBytes(Math.ceil(length / 2)).toString('hex').slice(0, length);
    } catch (error) {
      logger.error('Error generating secure token:', error);
      // Fallback method
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      let result = '';
      for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return result;
    }
  }

  /**
   * Hash sensitive data (like OTP for storage)
   * @param {string} data - Data to hash
   * @returns {string} - Hashed data
   */
  hashData(data) {
    try {
      return crypto.createHash('sha256').update(data).digest('hex');
    } catch (error) {
      logger.error('Error hashing data:', error);
      return data; // Return original if hashing fails
    }
  }

  /**
   * Generate OTP resend cooldown period
   * @returns {Date} - Next allowed resend time
   */
  getResendCooldown() {
    // 60 seconds cooldown between OTP requests
    return new Date(Date.now() + 60 * 1000);
  }

  /**
   * Check if resend is allowed
   * @param {Date} lastSentAt - Last OTP send timestamp
   * @returns {Object} - Resend status
   */
  canResendOTP(lastSentAt) {
    if (!lastSentAt) {
      return { canResend: true, waitTime: 0 };
    }

    const now = new Date();
    const cooldownEnd = new Date(lastSentAt.getTime() + 60 * 1000); // 60 seconds
    const diff = cooldownEnd - now;

    if (diff <= 0) {
      return { canResend: true, waitTime: 0 };
    }

    return {
      canResend: false,
      waitTime: Math.ceil(diff / 1000), // seconds to wait
      message: `Please wait ${Math.ceil(diff / 1000)} seconds before requesting a new code.`
    };
  }
}

// Create and export singleton instance
const otpUtils = new OTPUtils();
module.exports = otpUtils;