// ================================================================
// DEPENDENCIES
// ================================================================

const nodemailer = require('nodemailer');
const logger = require('../lib/logger');


// ================================================================
// EMAIL SERVICE CLASS
// ================================================================

/**
 * Email Service for sending OTP and other notifications
 */
class EmailService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  /**
   * Initialize nodemailer transporter with Gmail SMTP
   */
  initializeTransporter() {
    try {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT),
        secure: process.env.SMTP_SECURE === 'true', // false for TLS, true for SSL
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        },
        tls: {
          rejectUnauthorized: false
        }
      });

      // Verify the transporter configuration
      this.transporter.verify((error, success) => {
        if (error) {
          logger.error('Email transporter verification failed:', error);
        } else {
          logger.info('✅ Email service initialized successfully');
        }
      });

    } catch (error) {
      logger.error('Failed to initialize email transporter:', error);
    }
  }

  /**
   * Send OTP verification email
   * @param {string} email - Recipient email address
   * @param {string} otp - 6-digit OTP code
   * @param {string} businessName - Business name for personalization
   * @returns {Promise<boolean>} - Success status
   */
  async sendOTPVerification(email, otp, businessName) {
    try {
      const mailOptions = {
        from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
        to: email,
        subject: '🔐 KlevaPay - Email Verification Code',
        html: this.getOTPTemplate(otp, businessName)
      };

      const result = await this.transporter.sendMail(mailOptions);
      
      logger.info('OTP email sent successfully', {
        to: email,
        messageId: result.messageId,
        businessName
      });

      return { success: true, messageId: result.messageId };
    } catch (error) {
      logger.error('Failed to send OTP email', {
        to: email,
        error: error.message,
        businessName
      });
      return { success: false, error: error.message };
    }
  }

  /**
   * Send welcome email after successful verification
   * @param {string} email - Recipient email address
   * @param {string} businessName - Business name
   * @returns {Promise<boolean>} - Success status
   */
  async sendWelcomeEmail(email, businessName) {
    try {
      const mailOptions = {
        from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
        to: email,
        subject: '🎉 Welcome to KlevaPay - Account Verified Successfully!',
        html: this.getWelcomeTemplate(businessName)
      };

      const result = await this.transporter.sendMail(mailOptions);
      
      logger.info('Welcome email sent successfully', {
        to: email,
        messageId: result.messageId,
        businessName
      });

      return { success: true, messageId: result.messageId };
    } catch (error) {
      logger.error('Failed to send welcome email', {
        to: email,
        error: error.message,
        businessName
      });
      return { success: false, error: error.message };
    }
  }

  /**
   * Send password reset email
   * @param {string} email - Recipient email address
   * @param {string} otp - 6-digit reset code
   * @param {string} businessName - Business name
   * @returns {Promise<boolean>} - Success status
   */
  async sendPasswordResetEmail(email, otp, businessName) {
    try {
      const mailOptions = {
        from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
        to: email,
        subject: '🔑 KlevaPay - Password Reset Code',
        html: this.getPasswordResetTemplate(otp, businessName)
      };

      const result = await this.transporter.sendMail(mailOptions);
      
      logger.info('Password reset email sent successfully', {
        to: email,
        messageId: result.messageId,
        businessName
      });

      return { success: true, messageId: result.messageId };
    } catch (error) {
      logger.error('Failed to send password reset email', {
        to: email,
        error: error.message,
        businessName
      });
      return { success: false, error: error.message };
    }
  }

  /**
   * Get HTML template for OTP verification email
   * @param {string} otp - 6-digit OTP code
   * @param {string} businessName - Business name
   * @returns {string} - HTML template
   */
  getOTPTemplate(otp, businessName) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>KlevaPay Email Verification</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-align: center; padding: 30px; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .otp-box { background: #fff; border: 2px dashed #667eea; border-radius: 10px; padding: 20px; text-align: center; margin: 20px 0; }
            .otp-code { font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 8px; font-family: monospace; }
            .warning { background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 5px; padding: 15px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🔐 Email Verification</h1>
                <p>Welcome to KlevaPay!</p>
            </div>
            <div class="content">
                <h2>Hello ${businessName},</h2>
                <p>Thank you for registering with KlevaPay! To complete your account setup, please verify your email address using the code below:</p>
                
                <div class="otp-box">
                    <p><strong>Your Verification Code:</strong></p>
                    <div class="otp-code">${otp}</div>
                    <p style="margin-top: 15px; color: #666; font-size: 14px;">This code will expire in 15 minutes</p>
                </div>

                <div class="warning">
                    <h4>⚠️ Important Security Information:</h4>
                    <ul>
                        <li>Never share this code with anyone</li>
                        <li>KlevaPay will never ask for your verification code via phone or email</li>
                        <li>If you didn't request this code, please ignore this email</li>
                    </ul>
                </div>

                <p>If you're having trouble with the verification process, please contact our support team.</p>
                
                <p>Best regards,<br>The KlevaPay Team</p>
            </div>
            <div class="footer">
                <p>&copy; 2025 KlevaPay. All rights reserved.</p>
                <p>This is an automated email, please do not reply.</p>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  /**
   * Get HTML template for welcome email
   * @param {string} businessName - Business name
   * @returns {string} - HTML template
   */
  getWelcomeTemplate(businessName) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to KlevaPay</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-align: center; padding: 30px; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .success-box { background: #d4edda; border: 1px solid #c3e6cb; border-radius: 5px; padding: 20px; margin: 20px 0; text-align: center; }
            .next-steps { background: #fff; border-radius: 5px; padding: 20px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🎉 Welcome to KlevaPay!</h1>
                <p>Your account is now verified</p>
            </div>
            <div class="content">
                <div class="success-box">
                    <h2>✅ Account Successfully Verified!</h2>
                    <p>Congratulations ${businessName}, your KlevaPay merchant account is now active.</p>
                </div>

                <h3>What's Next?</h3>
                <div class="next-steps">
                    <ol>
                        <li><strong>Complete your KYC:</strong> Submit your business documents for verification</li>
                        <li><strong>Set up payments:</strong> Configure your payout preferences</li>
                        <li><strong>Start accepting payments:</strong> Integrate KlevaPay into your business</li>
                        <li><strong>Access dashboard:</strong> Monitor your transactions and analytics</li>
                    </ol>
                </div>

                <p>If you have any questions or need assistance, our support team is here to help!</p>
                
                <p>Best regards,<br>The KlevaPay Team</p>
            </div>
            <div class="footer">
                <p>&copy; 2025 KlevaPay. All rights reserved.</p>
                <p>This is an automated email, please do not reply.</p>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  /**
   * Get HTML template for password reset email
   * @param {string} otp - 6-digit reset code
   * @param {string} businessName - Business name
   * @returns {string} - HTML template
   */
  getPasswordResetTemplate(otp, businessName) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>KlevaPay Password Reset</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-align: center; padding: 30px; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .otp-box { background: #fff; border: 2px dashed #dc3545; border-radius: 10px; padding: 20px; text-align: center; margin: 20px 0; }
            .otp-code { font-size: 32px; font-weight: bold; color: #dc3545; letter-spacing: 8px; font-family: monospace; }
            .warning { background: #f8d7da; border: 1px solid #f5c6cb; border-radius: 5px; padding: 15px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🔑 Password Reset</h1>
                <p>KlevaPay Account Security</p>
            </div>
            <div class="content">
                <h2>Hello ${businessName},</h2>
                <p>We received a request to reset your KlevaPay account password. Use the verification code below to proceed:</p>
                
                <div class="otp-box">
                    <p><strong>Your Password Reset Code:</strong></p>
                    <div class="otp-code">${otp}</div>
                    <p style="margin-top: 15px; color: #666; font-size: 14px;">This code will expire in 15 minutes</p>
                </div>

                <div class="warning">
                    <h4>🛡️ Security Notice:</h4>
                    <ul>
                        <li>If you didn't request this password reset, please ignore this email</li>
                        <li>Never share this code with anyone</li>
                        <li>Contact support immediately if you suspect unauthorized access</li>
                    </ul>
                </div>

                <p>For your security, this code can only be used once and will expire in 15 minutes.</p>
                
                <p>Best regards,<br>The KlevaPay Security Team</p>
            </div>
            <div class="footer">
                <p>&copy; 2025 KlevaPay. All rights reserved.</p>
                <p>This is an automated email, please do not reply.</p>
            </div>
        </div>
    </body>
    </html>
    `;
  }
}

// Create and export singleton instance
const emailService = new EmailService();
module.exports = emailService;
