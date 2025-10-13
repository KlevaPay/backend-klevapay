// ================================================================
// DEPENDENCIES
// ================================================================

const User = require('../models/User');
const emailService = require('../services/sendEmail');
const jwtUtils = require('../utils/jwtUtils');
const otpUtils = require('../utils/otpUtils');
const ApiError = require('../lib/ApiError');
const logger = require('../lib/logger');
const { asyncHandler } = require('../middlewares/errorHandler');


// ================================================================
// AUTHENTICATION CONTROLLERS
// ================================================================

/**
 * Register a new merchant
 * @route POST /api/auth/register
 */
const registerMerchant = asyncHandler(async (req, res) => {
  const { businessName, email, password, country } = req.body;

  logger.info('Merchant registration attempt', {
    email: email,
    businessName: businessName,
    ip: req.ip
  });

  // Check if user already exists
  const existingCheck = await User.checkExistence(email, businessName);
  
  if (existingCheck.emailExists) {
    throw ApiError.conflict('Email address is already registered');
  }
  
  if (existingCheck.businessExists) {
    throw ApiError.conflict('Business name is already in use');
  }

  // Create new user
  const user = new User({
    businessName: businessName.trim(),
    email: email.toLowerCase().trim(),
    password: password,
    country: country || 'Nigeria'
  });

  // Generate OTP for email verification
  const otpCode = user.generateOTP();

  // Save user to database
  await user.save();

  // Send verification email
  const emailResult = await emailService.sendOTPVerification(
    user.email,
    otpCode,
    user.businessName
  );

  if (!emailResult.success) {
    logger.error('Failed to send verification email', {
      userId: user._id,
      email: user.email,
      error: emailResult.error
    });
    
    // Don't fail registration if email fails, user can request resend
    logger.warn('Registration completed but verification email failed to send');
  }

  logger.info('Merchant registered successfully', {
    userId: user._id,
    email: user.email,
    businessName: user.businessName,
    emailSent: emailResult.success
  });

  res.status(201).json({
    success: true,
    message: 'Merchant registered successfully. Please check your email for verification code.',
    data: {
      user: {
        id: user._id,
        businessName: user.businessName,
        email: user.email,
        country: user.country,
        verified: user.verified,
        createdAt: user.createdAt
      },
      emailSent: emailResult.success,
      verificationRequired: true
    }
  });
});


// ================================================================
// EMAIL VERIFICATION
// ================================================================

/**
 * Verify email with OTP
 * @route POST /api/auth/verify-email
 */
const verifyEmail = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  logger.info('Email verification attempt', {
    email: email,
    ip: req.ip
  });

  // Find user by email
  const user = await User.findByEmail(email).select('+otp.code +otp.expiresAt +otp.attempts');
  
  if (!user) {
    throw ApiError.notFound('User not found');
  }

  if (user.verified) {
    throw ApiError.badRequest('Email is already verified');
  }

  // Verify OTP
  const otpResult = user.verifyOTP(otp);
  
  if (!otpResult.valid) {
    logger.warn('Invalid OTP attempt', {
      userId: user._id,
      email: user.email,
      reason: otpResult.reason,
      attempts: user.otp ? user.otp.attempts + 1 : 1
    });
    
    // Save failed attempt
    if (user.otp && !otpResult.reason.includes('expired') && !otpResult.reason.includes('No OTP found')) {
      await user.save();
    }
    
    throw ApiError.badRequest(otpResult.reason);
  }

  // Save user with verified status
  await user.save();

  // Send welcome email
  const welcomeEmailResult = await emailService.sendWelcomeEmail(
    user.email,
    user.businessName
  );

  if (!welcomeEmailResult.success) {
    logger.warn('Failed to send welcome email', {
      userId: user._id,
      email: user.email
    });
  }

  // Generate JWT tokens
  const tokens = jwtUtils.generateTokenPair(user);

  logger.info('Email verified successfully', {
    userId: user._id,
    email: user.email,
    businessName: user.businessName
  });

  res.json({
    success: true,
    message: 'Email verified successfully. Welcome to KlevaPay!',
    data: {
      user: {
        id: user._id,
        businessName: user.businessName,
        email: user.email,
        country: user.country,
        verified: user.verified,
        role: user.role,
        kycStatus: user.kycStatus,
        profileComplete: user.profileComplete,
        createdAt: user.createdAt
      },
      tokens: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: tokens.expiresIn
      }
    }
  });
});


// ================================================================
// OTP MANAGEMENT
// ================================================================

/**
 * Resend verification OTP
 * @route POST /api/auth/resend-otp
 */
const resendOTP = asyncHandler(async (req, res) => {
  const { email } = req.body;

  logger.info('OTP resend request', {
    email: email,
    ip: req.ip
  });

  // Find user by email
  const user = await User.findByEmail(email).select('+otp.code +otp.expiresAt +otp.attempts');
  
  if (!user) {
    throw ApiError.notFound('User not found');
  }

  if (user.verified) {
    throw ApiError.badRequest('Email is already verified');
  }

  // Check resend cooldown
  const lastSentAt = user.otp ? new Date(user.otp.expiresAt.getTime() - 15 * 60 * 1000) : null;
  const resendCheck = otpUtils.canResendOTP(lastSentAt);
  
  if (!resendCheck.canResend) {
    throw ApiError.badRequest(resendCheck.message);
  }

  // Generate new OTP
  const otpCode = user.generateOTP();

  // Save user with new OTP
  await user.save();

  // Send verification email
  const emailResult = await emailService.sendOTPVerification(
    user.email,
    otpCode,
    user.businessName
  );

  if (!emailResult.success) {
    logger.error('Failed to resend verification email', {
      userId: user._id,
      email: user.email,
      error: emailResult.error
    });
    
    throw ApiError.internal('Failed to send verification email. Please try again.');
  }

  logger.info('OTP resent successfully', {
    userId: user._id,
    email: user.email
  });

  res.json({
    success: true,
    message: 'Verification code sent successfully. Please check your email.',
    data: {
      email: user.email,
      emailSent: true,
      expiresIn: '15 minutes'
    }
  });
});


// ================================================================
// MERCHANT LOGIN
// ================================================================

/**
 * Login merchant
 * @route POST /api/auth/login
 */
const loginMerchant = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  logger.info('Login attempt', {
    email: email,
    ip: req.ip
  });

  // Find user by email
  const user = await User.findByEmail(email);
  
  if (!user) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  // Check if account is locked
  if (user.isLocked) {
    const lockTime = Math.ceil((user.lockUntil - Date.now()) / (1000 * 60));
    throw ApiError.unauthorized(`Account is locked. Try again in ${lockTime} minutes.`);
  }

  // Check password
  const isPasswordValid = await user.comparePassword(password);
  
  if (!isPasswordValid) {
    logger.warn('Invalid login attempt - wrong password', {
      userId: user._id,
      email: user.email,
      attempts: user.loginAttempts + 1
    });
    
    await user.incLoginAttempts();
    throw ApiError.unauthorized('Invalid email or password');
  }

  // Check if email is verified
  if (!user.verified) {
    throw ApiError.unauthorized('Please verify your email address before logging in');
  }

  // Reset login attempts on successful login
  await user.resetLoginAttempts();

  // Generate JWT tokens
  const tokens = jwtUtils.generateTokenPair(user);

  logger.info('Login successful', {
    userId: user._id,
    email: user.email,
    businessName: user.businessName
  });

  res.json({
    success: true,
    message: 'Login successful',
    data: {
      user: {
        id: user._id,
        businessName: user.businessName,
        email: user.email,
        country: user.country,
        verified: user.verified,
        role: user.role,
        kycStatus: user.kycStatus,
        profileComplete: user.profileComplete,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt
      },
      tokens: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: tokens.expiresIn
      }
    }
  });
});


// ================================================================
// PASSWORD RESET
// ================================================================

/**
 * Forgot password - send reset OTP
 * @route POST /api/auth/forgot-password
 */
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  logger.info('Password reset request', {
    email: email,
    ip: req.ip
  });

  // Find user by email
  const user = await User.findByEmail(email);
  
  if (!user) {
    // Don't reveal if email exists for security
    logger.warn('Password reset requested for non-existent email', { email });
    
    return res.json({
      success: true,
      message: 'If an account with this email exists, you will receive a password reset code.',
      data: { email }
    });
  }

  if (!user.verified) {
    throw ApiError.badRequest('Please verify your email address first');
  }

  // Generate OTP for password reset
  const otpCode = user.generateOTP();

  // Save user with OTP
  await user.save();

  // Send password reset email
  const emailResult = await emailService.sendPasswordResetEmail(
    user.email,
    otpCode,
    user.businessName
  );

  if (!emailResult.success) {
    logger.error('Failed to send password reset email', {
      userId: user._id,
      email: user.email,
      error: emailResult.error
    });
    
    throw ApiError.internal('Failed to send password reset email. Please try again.');
  }

  logger.info('Password reset OTP sent', {
    userId: user._id,
    email: user.email
  });

  res.json({
    success: true,
    message: 'Password reset code sent to your email address.',
    data: {
      email: user.email,
      emailSent: true,
      expiresIn: '15 minutes'
    }
  });
});

/**
 * Reset password with OTP
 * @route POST /api/auth/reset-password
 */
const resetPassword = asyncHandler(async (req, res) => {
  const { email, otp, newPassword } = req.body;

  logger.info('Password reset attempt', {
    email: email,
    ip: req.ip
  });

  // Find user by email
  const user = await User.findByEmail(email).select('+otp.code +otp.expiresAt +otp.attempts');
  
  if (!user) {
    throw ApiError.notFound('User not found');
  }

  // Verify OTP
  const otpResult = user.verifyOTP(otp);
  
  if (!otpResult.valid) {
    logger.warn('Invalid password reset OTP', {
      userId: user._id,
      email: user.email,
      reason: otpResult.reason
    });
    
    throw ApiError.badRequest(otpResult.reason);
  }

  // Update password
  user.password = newPassword;
  user.otp = undefined; // Clear OTP
  
  // Save user with new password
  await user.save();

  logger.info('Password reset successful', {
    userId: user._id,
    email: user.email
  });

  res.json({
    success: true,
    message: 'Password reset successfully. You can now login with your new password.',
    data: {
      email: user.email,
      passwordReset: true
    }
  });
});


// ================================================================
// MODULE EXPORTS
// ================================================================

module.exports = {
  registerMerchant,
  verifyEmail,
  resendOTP,
  loginMerchant,
  forgotPassword,
  resetPassword
};