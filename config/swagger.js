const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

// Swagger definition
const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'KlevaPay Backend API',
    version: '1.0.0',
    description: 'Merchant payment gateway backend API for KlevaPay platform',
    contact: {
      name: 'KlevaPay Development Team',
      url: 'https://github.com/KlevaPay/backend-klevapay',
      email: 'dev@klevapay.com'
    },
    license: {
      name: 'ISC',
      url: 'https://opensource.org/licenses/ISC'
    }
  },
  servers: [
    {
      url: process.env.BASE_URL || 'http://localhost:4000',
      description: 'Development server'
    },
    {
      url: 'https://api.klevapay.com',
      description: 'Production server'
    }
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT Authorization header using the Bearer scheme. Example: "Bearer {token}"'
      }
    },
    schemas: {
      // User/Merchant Schema
      User: {
        type: 'object',
        properties: {
          _id: {
            type: 'string',
            description: 'User unique identifier'
          },
          businessName: {
            type: 'string',
            description: 'Unique business name',
            example: 'Tech Innovations Ltd'
          },
          email: {
            type: 'string',
            format: 'email',
            description: 'User email address',
            example: 'merchant@example.com'
          },
          country: {
            type: 'string',
            description: 'Country of operation',
            default: 'Nigeria',
            example: 'Nigeria'
          },
          verified: {
            type: 'boolean',
            description: 'Email verification status',
            example: true
          },
          role: {
            type: 'string',
            enum: ['merchant', 'admin'],
            description: 'User role',
            example: 'merchant'
          },
          kycStatus: {
            type: 'string',
            enum: ['pending', 'approved', 'rejected'],
            description: 'KYC verification status',
            example: 'pending'
          },
          payoutPreferences: {
            type: 'object',
            properties: {
              currency: {
                type: 'string',
                example: 'NGN'
              },
              method: {
                type: 'string',
                example: 'bank_transfer'
              },
              accountDetails: {
                type: 'object',
                example: {
                  bankName: 'First Bank',
                  accountNumber: '1234567890',
                  accountName: 'Tech Innovations Ltd'
                }
              }
            }
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            description: 'Account creation timestamp'
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
            description: 'Last update timestamp'
          }
        }
      },
      
      // Error Schema
      ApiError: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: false
          },
          error: {
            type: 'object',
            properties: {
              name: {
                type: 'string',
                example: 'ApiError'
              },
              message: {
                type: 'string',
                example: 'Validation Error'
              },
              statusCode: {
                type: 'integer',
                example: 400
              },
              details: {
                type: 'object',
                example: null
              }
            }
          }
        }
      },
      
      // Success Response Schema
      SuccessResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: true
          },
          message: {
            type: 'string',
            example: 'Operation completed successfully'
          },
          data: {
            type: 'object',
            description: 'Response data'
          }
        }
      },
      
      // Registration Request Schema
      RegisterRequest: {
        type: 'object',
        required: ['businessName', 'email', 'password'],
        properties: {
          businessName: {
            type: 'string',
            description: 'Unique business name',
            example: 'Tech Innovations Ltd'
          },
          email: {
            type: 'string',
            format: 'email',
            description: 'Valid email address',
            example: 'merchant@example.com'
          },
          country: {
            type: 'string',
            description: 'Country of operation',
            default: 'Nigeria',
            example: 'Nigeria'
          },
          password: {
            type: 'string',
            format: 'password',
            description: 'Strong password (min 8 characters)',
            example: 'StrongPassword123!'
          }
        }
      },
      
      // Login Request Schema
      LoginRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: {
            type: 'string',
            format: 'email',
            description: 'Registered email address',
            example: 'merchant@example.com'
          },
          password: {
            type: 'string',
            format: 'password',
            description: 'Account password',
            example: 'StrongPassword123!'
          }
        }
      },
      
      // OTP Verification Schema
      OTPVerification: {
        type: 'object',
        required: ['email', 'otp'],
        properties: {
          email: {
            type: 'string',
            format: 'email',
            example: 'merchant@example.com'
          },
          otp: {
            type: 'string',
            description: '6-digit OTP code',
            example: '123456'
          }
        }
      },

      // Merchant Schema
      Merchant: {
        type: 'object',
        properties: {
          _id: {
            type: 'string',
            description: 'Merchant unique identifier',
            example: '64f5e8b2a1b2c3d4e5f6g7h8'
          },
          walletAddress: {
            type: 'string',
            description: 'Crypto wallet address',
            example: '0x742E4C8e9b6Ea8B6f7A7C6A1e2D8F3b9C1a4B5E6'
          },
          businessName: {
            type: 'string',
            description: 'Unique business name',
            example: 'Tech Innovations Ltd'
          },
          payoutPreferences: {
            type: 'object',
            properties: {
              currency: {
                type: 'string',
                enum: ['NGN', 'USD', 'EUR', 'USDT', 'BTC', 'ETH'],
                default: 'NGN',
                example: 'NGN'
              },
              method: {
                type: 'string',
                enum: ['bank_transfer', 'mobile_money', 'crypto'],
                default: 'bank_transfer',
                example: 'bank_transfer'
              },
              accountDetails: {
                type: 'object',
                properties: {
                  bankName: {
                    type: 'string',
                    example: 'First Bank'
                  },
                  accountNumber: {
                    type: 'string',
                    example: '1234567890'
                  },
                  accountName: {
                    type: 'string',
                    example: 'Tech Innovations Ltd'
                  },
                  routingNumber: {
                    type: 'string',
                    example: '011000138'
                  }
                }
              }
            }
          },
          kycStatus: {
            type: 'string',
            enum: ['pending', 'approved', 'rejected'],
            default: 'pending',
            example: 'pending'
          },
          country: {
            type: 'string',
            default: 'Nigeria',
            example: 'Nigeria'
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            description: 'Account creation timestamp'
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
            description: 'Last update timestamp'
          }
        }
      },

      // Payment Intent Schema
      PaymentIntent: {
        type: 'object',
        properties: {
          _id: {
            type: 'string',
            description: 'Payment intent unique identifier',
            example: '64f5e8b2a1b2c3d4e5f6g7h8'
          },
          merchantId: {
            type: 'string',
            description: 'Associated merchant ID',
            example: '64f5e8b2a1b2c3d4e5f6g7h9'
          },
          orderId: {
            type: 'string',
            description: 'Merchant order identifier',
            example: 'ORD-123456'
          },
          amount: {
            type: 'number',
            description: 'Payment amount',
            example: 1000.50
          },
          sourceCurrency: {
            type: 'string',
            description: 'Original currency',
            example: 'USD'
          },
          targetCurrency: {
            type: 'string',
            description: 'Target currency for conversion',
            example: 'NGN'
          },
          status: {
            type: 'string',
            enum: ['PENDING', 'PAID', 'SETTLED', 'FAILED'],
            default: 'PENDING',
            example: 'PENDING'
          },
          checkoutLink: {
            type: 'string',
            format: 'uri',
            description: 'Payment checkout URL',
            example: 'https://checkout.klevapay.com/pay/abc123'
          },
          widgetToken: {
            type: 'string',
            description: 'Widget integration token',
            example: 'wgt_token_abc123xyz'
          },
          metadata: {
            type: 'object',
            description: 'Additional payment metadata',
            example: {
              "customerId": "cust_123",
              "productId": "prod_456",
              "description": "Payment for order #12345"
            }
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            description: 'Creation timestamp'
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
            description: 'Last update timestamp'
          }
        }
      },

      // Transaction Schema
      Transaction: {
        type: 'object',
        properties: {
          _id: {
            type: 'string',
            description: 'Transaction unique identifier',
            example: '64f5e8b2a1b2c3d4e5f6g7h8'
          },
          merchantId: {
            type: 'string',
            description: 'Associated merchant ID',
            example: '64f5e8b2a1b2c3d4e5f6g7h9'
          },
          merchantWalletAddress: {
            type: 'string',
            description: 'Merchant wallet address snapshot',
            example: '0x742E4C8e9b6Ea8B6f7A7C6A1e2D8F3b9C1a4B5E6'
          },
          reference: {
            type: 'string',
            description: 'Transaction reference (tx_ref)',
            example: 'KP-REF-1697616000123'
          },
          transactionReference: {
            type: 'string',
            description: 'Alias for transaction reference when sourced externally',
            example: 'KP-REF-1697616000123'
          },
          payer: {
            type: 'string',
            description: 'Payer wallet or identifier',
            example: '0x8B4F1b0f5F760e8CCa415b38987cF941bEF3Eb23'
          },
          fiatOrTokenType: {
            type: 'string',
            enum: ['FIAT', 'CRYPTO'],
            description: 'Classifies the medium of value for the transaction',
            example: 'CRYPTO'
          },
          paymentType: {
            type: 'string',
            description: 'Flow type (e.g. FIAT_TO_CRYPTO, CRYPTO_TO_CRYPTO)',
            example: 'CRYPTO_TO_CRYPTO'
          },
          amount: {
            type: 'number',
            description: 'Transaction amount',
            example: 5000.00
          },
          amountInMinor: {
            type: 'string',
            description: 'Raw base-unit amount emitted by the payment source',
            example: '5000000'
          },
          fiatEquivalent: {
            type: 'number',
            description: 'Converted fiat value when the source is crypto',
            example: 950000.25
          },
          fiatCurrency: {
            type: 'string',
            description: 'Currency used for fiat equivalent values',
            example: 'NGN'
          },
          chargeFee: {
            type: 'number',
            description: 'Platform or gateway fee applied to the transaction',
            example: 25.5
          },
          symbol: {
            type: 'string',
            description: 'Token or fiat symbol',
            example: 'USDT'
          },
          currency: {
            type: 'string',
            default: 'NGN',
            description: 'Transaction currency',
            example: 'NGN'
          },
          method: {
            type: 'string',
            enum: ['CARD', 'BANK', 'WALLET', 'CRYPTO', 'FIAT'],
            description: 'Payment method used',
            example: 'CARD'
          },
          provider: {
            type: 'string',
            enum: ['CONTRACT', 'FLUTTERWAVE', 'OPAY', 'MANUAL'],
            description: 'Originating provider for the transaction',
            example: 'CONTRACT'
          },
          status: {
            type: 'string',
            enum: ['PENDING', 'PAID', 'SETTLED', 'FAILED', 'SUCCESS', 'PROCESSING'],
            default: 'PENDING',
            description: 'Transaction status',
            example: 'PAID'
          },
          eventTimestamp: {
            type: 'string',
            format: 'date-time',
            description: 'Timestamp emitted by the payment source',
            example: '2024-04-12T10:15:30.000Z'
          },
          recordedAt: {
            type: 'string',
            format: 'date-time',
            description: 'Timestamp when the backend persisted the record',
            example: '2024-04-12T10:15:31.000Z'
          },
          blockchain: {
            type: 'object',
            description: 'Blockchain context associated with the transaction',
            properties: {
              transactionHash: {
                type: 'string',
                description: 'Transaction hash on the blockchain',
                example: '0xabc123...'
              },
              blockNumber: {
                type: 'integer',
                description: 'Block height containing the transaction',
                example: 21654123
              },
              network: {
                type: 'string',
                description: 'Network name or chain identifier',
                example: 'lisk-sepolia'
              }
            }
          },
          opayReference: {
            type: 'string',
            description: 'OPay gateway reference',
            example: 'opay_ref_123456'
          },
          providerResponse: {
            type: 'object',
            description: 'Raw payment gateway response',
            example: {
              "gateway": "flutterwave",
              "id": 285959875,
              "flw_ref": "FLW-MOCK-162a1d87d9d86bb1e47e8e4c6b66da80",
              "processor_response": "Approved"
            }
          },
          metadata: {
            type: 'object',
            description: 'Additional transaction metadata',
            default: {},
            example: {
              "orderId": "ORD-123",
              "customerId": "cust_456",
              "flow": "FIAT_TO_CRYPTO"
            }
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            description: 'Creation timestamp'
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
            description: 'Last update timestamp'
          }
        }
      }
    }
  },
  tags: [
    {
      name: 'Authentication',
      description: 'User authentication and account management endpoints'
    },
    {
      name: 'Merchant',
      description: 'Merchant profile and KYC management endpoints'
    },
    {
      name: 'Payment Intents',
      description: 'Payment intent creation and management endpoints'
    },
    {
      name: 'Payment Integration',
      description: 'Payment gateway integration endpoints (Flutterwave, OPay)'
    },
    {
      name: 'Health',
      description: 'System health and monitoring endpoints'
    }
  ]
};

// Options for swagger-jsdoc
const options = {
  definition: swaggerDefinition,
  apis: [
    './routes/*.js',
    './controllers/*.js',
    './server.js',
    './app.js'
  ]
};

// Initialize swagger-jsdoc
const swaggerSpec = swaggerJsdoc(options);

// Swagger UI options
const swaggerUiOptions = {
  explorer: true,
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    docExpansion: 'none',
    filter: true,
    showExtensions: true,
    showCommonExtensions: true,
    defaultModelsExpandDepth: 2,
    defaultModelExpandDepth: 2
  },
  customCss: `
    .swagger-ui .topbar { display: none }
    .swagger-ui .info .title { color: #3b82f6 }
  `,
  customSiteTitle: 'KlevaPay API Documentation',
  customfavIcon: '/assets/favicon.ico'
};

module.exports = {
  swaggerSpec,
  swaggerUi,
  swaggerUiOptions
};