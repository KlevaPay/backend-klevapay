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