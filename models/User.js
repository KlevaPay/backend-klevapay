// ================================================================
// DEPENDENCIES
// ================================================================

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');


// ================================================================
// USER SCHEMA DEFINITION
// ================================================================

const userSchema = new mongoose.Schema({

  // ============================================================
  // BUSINESS INFORMATION
  // ============================================================
  businessName: {
    type: String,
    required: [true, 'Business name is required'],
    unique: true,
    trim: true,
    minlength: [2, 'Business name must be at least 2 characters'],
    maxlength: [100, 'Business name must not exceed 100 characters'],
    index: true
  },

  
  // ============================================================
  // AUTHENTICATION INFORMATION
  // ============================================================
  
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email'],
    index: true
  },
  
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters']
  },


  // ============================================================
  // USER STATUS & PROFILE
  // ============================================================
  
  country: {
    type: String,
    default: 'Nigeria',
    trim: true,
    maxlength: [50, 'Country name must not exceed 50 characters']
  },
  
  verified: {
    type: Boolean,
    default: false
  },
  
  role: {
    type: String,
    enum: ['merchant', 'admin'],
    default: 'merchant'
  },
  
  kycStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },


  // ============================================================
  // BUSINESS & PAYOUT SETTINGS
  // ============================================================
  
  payoutPreferences: {
    currency: {
      type: String,
      default: 'NGN',
      enum: ['NGN', 'USD', 'EUR', 'GBP']
    },
    method: {
      type: String,
      default: 'bank_transfer',
      enum: ['bank_transfer', 'mobile_money', 'crypto']
    },
    accountDetails: {
      bankName: String,
      accountNumber: String,
      accountName: String,
      routingNumber: String
    }
  },


  // ============================================================
  // OTP & SECURITY FIELDS
  // ============================================================
  
  // OTP fields for email verification
  otp: {
    code: {
      type: String,
      select: false // Don't include in queries by default for security
    },
    expiresAt: {
      type: Date,
      select: false
    },
    attempts: {
      type: Number,
      default: 0,
      select: false
    }
  },
  // Password reset fields
  passwordReset: {
    token: {
      type: String,
      select: false
    },
    expiresAt: {
      type: Date,
      select: false
    }
  },
  // Account activity tracking
  lastLogin: {
    type: Date
  },
  loginAttempts: {
    type: Number,
    default: 0
  },
  accountLocked: {
    type: Boolean,
    default: false
  },
  lockUntil: {
    type: Date
  },
  // Profile completion tracking
  profileComplete: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      delete ret.password;
      delete ret.otp;
      delete ret.passwordReset;
      delete ret.__v;
      return ret;
    }
  }
});

// Indexes for better performance
userSchema.index({ email: 1, verified: 1 });
userSchema.index({ businessName: 1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ 'otp.expiresAt': 1 }, { expireAfterSeconds: 0 });
userSchema.index({ 'passwordReset.expiresAt': 1 }, { expireAfterSeconds: 0 });

// Virtual for account lock status
userSchema.virtual('isLocked').get(function() {
  return !!(this.accountLocked && this.lockUntil && this.lockUntil > Date.now());
});


// ================================================================
// MONGOOSE MIDDLEWARE
// ================================================================

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return next();
  
  try {
    // Hash password with bcrypt
    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12;
    this.password = await bcrypt.hash(this.password, saltRounds);
    next();
  } catch (error) {
    next(error);
  }
});


// ================================================================
// INSTANCE METHODS
// ================================================================

// Method to check if provided password matches hashed password
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw error;
  }
};


// Method to generate OTP
userSchema.methods.generateOTP = function() {
  const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes from now
  
  this.otp = {
    code: otp,
    expiresAt: expiresAt,
    attempts: 0
  };
  
  return otp;
};

// Method to verify OTP
userSchema.methods.verifyOTP = function(providedOTP) {
  if (!this.otp.code || !this.otp.expiresAt) {
    return { valid: false, reason: 'No OTP found' };
  }
  
  if (this.otp.expiresAt < new Date()) {
    return { valid: false, reason: 'OTP has expired' };
  }
  
  if (this.otp.attempts >= 3) {
    return { valid: false, reason: 'Too many failed attempts' };
  }
  
  if (this.otp.code !== providedOTP) {
    this.otp.attempts += 1;
    return { valid: false, reason: 'Invalid OTP' };
  }
  
  // OTP is valid
  this.verified = true;
  this.otp = undefined; // Clear OTP after successful verification
  return { valid: true };
};

// Method to clear expired OTP
userSchema.methods.clearExpiredOTP = function() {
  if (this.otp && this.otp.expiresAt && this.otp.expiresAt < new Date()) {
    this.otp = undefined;
  }
};

// Method to increment login attempts
userSchema.methods.incLoginAttempts = function() {
  // If we have a previous lock that has expired, restart at 1
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $unset: { lockUntil: 1 },
      $set: { accountLocked: false, loginAttempts: 1 }
    });
  }
  
  const updates = { $inc: { loginAttempts: 1 } };
  
  // Lock account after 5 failed attempts for 2 hours
  if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
    updates.$set = {
      accountLocked: true,
      lockUntil: Date.now() + 2 * 60 * 60 * 1000 // 2 hours
    };
  }
  
  return this.updateOne(updates);
};

// Method to reset login attempts
userSchema.methods.resetLoginAttempts = function() {
  return this.updateOne({
    $unset: { loginAttempts: 1, lockUntil: 1 },
    $set: { accountLocked: false, lastLogin: new Date() }
  });
};


// ================================================================
// STATIC METHODS
// ================================================================

// Static method to find by email
userSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase() });
};

// Static method to find by business name
userSchema.statics.findByBusinessName = function(businessName) {
  return this.findOne({ businessName: { $regex: new RegExp(`^${businessName}$`, 'i') } });
};

// Static method to check if email or business name exists
userSchema.statics.checkExistence = async function(email, businessName) {
  const [emailExists, businessExists] = await Promise.all([
    this.findByEmail(email),
    this.findByBusinessName(businessName)
  ]);
  
  return {
    emailExists: !!emailExists,
    businessExists: !!businessExists
  };
};


// ================================================================
// MODEL CREATION & EXPORT
// ================================================================

const User = mongoose.model('User', userSchema);

module.exports = User;
