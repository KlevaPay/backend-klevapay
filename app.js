// ================================================================
// ENVIRONMENT & DEPENDENCIES
// ================================================================

require('dotenv').config();

// Core dependencies
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { StatusCodes } = require('http-status-codes');

// Internal dependencies
const logger = require('./lib/logger');
const { globalErrorHandler, notFoundHandler } = require('./middlewares/errorHandler');

// Swagger setup
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const merchantRoutes = require('./routes/merchantRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const cryptoRoutes = require('./routes/cryptoIntegration');


// ================================================================
// APPLICATION SETUP
// ================================================================

// Create Express application
const app = express();
app.use(express.json());


// Trust proxy for accurate IP addresses in production
app.set('trust proxy', 1);


// ================================================================
// SECURITY MIDDLEWARE
// ================================================================

// Helmet security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));


// ================================================================
// CORS CONFIGURATION
// ================================================================

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, etc.)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'https://klevapay.com',
      'https://www.klevapay.com',
      'https://dashboard.klevapay.com'
    ];
    
    if (allowedOrigins.includes(origin) || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions));


// ================================================================
// RATE LIMITING
// ================================================================

// Rate limiting configuration
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: {
      message: 'Too many requests from this IP, please try again later.',
      statusCode: StatusCodes.TOO_MANY_REQUESTS
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);
app.use('/api/payment-intents', require('./routes/paymentIntentRoute'));
app.use('/api/merchant', merchantRoutes);

app.use('/api/transactions', transactionRoutes);

app.use('/api/pay', require('./routes/paymentintegrationRoute'));
app.use('/api/crypto', cryptoRoutes);

// ================================================================
// LOGGING MIDDLEWARE
// ================================================================

// Request logging middleware with winston
app.use(logger.addRequestId);
app.use(morgan('combined', {
  skip: (req, res) => {
    // Skip logging favicon requests to reduce log noise
    return req.originalUrl.includes('favicon.ico');
  },
  stream: {
    write: (message) => logger.info(message.trim())
  }
}));


// ================================================================
// BODY PARSING MIDDLEWARE
// ================================================================

// JSON and URL-encoded body parsing
app.use(express.json({ 
  limit: '10mb',
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ 
  extended: true, 
  limit: '10mb' 
}));


// ================================================================
// API DOCUMENTATION
// ================================================================

// Comprehensive Swagger configuration
const swaggerOptions = {
  definition: {
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
                  example: 'NGN'
                },
                method: {
                  type: 'string',
                  enum: ['bank_transfer', 'mobile_money', 'crypto'],
                  example: 'bank_transfer'
                }
              }
            },
            kycStatus: {
              type: 'string',
              enum: ['pending', 'approved', 'rejected'],
              example: 'pending'
            },
            country: {
              type: 'string',
              example: 'Nigeria'
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        PaymentIntent: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              example: '64f5e8b2a1b2c3d4e5f6g7h8'
            },
            merchantId: {
              type: 'string',
              example: '64f5e8b2a1b2c3d4e5f6g7h9'
            },
            orderId: {
              type: 'string',
              example: 'ORD-123456'
            },
            amount: {
              type: 'number',
              example: 1000.50
            },
            sourceCurrency: {
              type: 'string',
              example: 'USD'
            },
            targetCurrency: {
              type: 'string',
              example: 'NGN'
            },
            status: {
              type: 'string',
              enum: ['PENDING', 'PAID', 'SETTLED', 'FAILED'],
              example: 'PENDING'
            },
            checkoutLink: {
              type: 'string',
              format: 'uri',
              example: 'https://checkout.klevapay.com/pay/abc123'
            },
            widgetToken: {
              type: 'string',
              example: 'wgt_token_abc123xyz'
            },
            metadata: {
              type: 'object',
              example: { "customerId": "cust_123", "productId": "prod_456" }
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        Transaction: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              example: '64f5e8b2a1b2c3d4e5f6g7h8'
            },
            merchantId: {
              type: 'string',
              example: '64f5e8b2a1b2c3d4e5f6g7h9'
            },
            reference: {
              type: 'string',
              example: 'KP-REF-1697616000123'
            },
            amount: {
              type: 'number',
              example: 5000.00
            },
            currency: {
              type: 'string',
              example: 'NGN'
            },
            method: {
              type: 'string',
              enum: ['CARD', 'BANK', 'WALLET'],
              example: 'CARD'
            },
            status: {
              type: 'string',
              enum: ['PENDING', 'PAID', 'SETTLED', 'FAILED'],
              example: 'PAID'
            },
            providerResponse: {
              type: 'object',
              example: { "gateway": "flutterwave", "id": 285959875 }
            },
            metadata: {
              type: 'object',
              example: { "orderId": "ORD-123", "customerId": "cust_456" }
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        }
      }
    },
    tags: [
      {
        name: 'Health',
        description: 'System health and monitoring endpoints'
      },
      {
        name: 'Merchant',
        description: 'Merchant profile and business management endpoints'
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
        name: 'Transactions',
        description: 'Transaction retrieval and analytics endpoints'
      },
      {
        name: 'Crypto Integration',
        description: 'On-chain liquidity management and settlement endpoints'
      }
    ]
  },
  apis: ['./routes/transactionRoutes.js', './routes/merchantRoutes.js', './routes/paymentIntentRoute.js', './routes/paymentintegrationRoute.js', './routes/cryptoIntegration.js']
};

// Generate swagger specification
const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Debug: Log any schema resolution issues
console.log('📚 Swagger schemas loaded:', Object.keys(swaggerSpec.components?.schemas || {}));

// Swagger documentation setup with enhanced UI options
app.use('/api/docs', swaggerUi.serve);
app.get('/api/docs', swaggerUi.setup(swaggerSpec, {
  explorer: true,
  customSiteTitle: 'KlevaPay API Documentation',
  customfavIcon: '/assets/favicon.ico',
  customCss: `
    .swagger-ui .topbar { display: none }
    .swagger-ui .info .title { color: #3b82f6; }
    .swagger-ui .scheme-container { background: #fafafa; }
  `,
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    docExpansion: 'none',
    filter: true,
    showExtensions: true,
    showCommonExtensions: true
  }
}));

// Swagger JSON endpoint
app.get('/api/docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});


// ================================================================
// FAVICON HANDLERS
// ================================================================

// Favicon endpoints - prevent 404 errors in logs
app.get('/favicon.ico', (req, res) => {
  res.status(204).end();
});

app.get('/assets/favicon.ico', (req, res) => {
  res.status(204).end();
});


// ================================================================
// API ROUTES
// ================================================================

/**
 * @swagger
 * /:
 *   get:
 *     tags: [Health]
 *     summary: API root endpoint
 *     description: Returns basic API information and available endpoints
 *     responses:
 *       200:
 *         description: API information retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "KlevaPay API"
 *                 version:
 *                   type: string
 *                   example: "1.0.0"
 *                 environment:
 *                   type: string
 *                   example: "development"
 *                 endpoints:
 *                   type: array
 *                   items:
/**
 * @swagger
 * /:
 *   get:
 *     tags: [Health]
 *     summary: API root endpoint
 *     description: Returns basic API information, available endpoints, and system status
 *     responses:
 *       200:
 *         description: API information retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "KlevaPay API"
 *                 version:
 *                   type: string
 *                   example: "1.0.0"
 *                 environment:
 *                   type: string
 *                   example: "development"
 *                 endpoints:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: ["/api/auth", "/api/merchant", "/api/health", "/api/docs"]
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 */
app.get('/', (req, res) => {
  res.json({
    message: 'KlevaPay API',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    endpoints: ['/api/auth', '/api/merchant', '/api/health', '/api/docs',  '/api/payment-intents',  '/api/transactions', '/api/pay',  '/api/crypto'],
    timestamp: new Date().toISOString()
  });
});

/**
 * @swagger
 * /api/health:
 *   get:
 *     tags: [Health]
 *     summary: Health check endpoint
 *     description: Returns server health status and uptime information
 *     responses:
 *       200:
 *         description: Server is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "ok"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 uptime:
 *                   type: number
 *                   description: Server uptime in seconds
 *                   example: 3600.5
 *                 environment:
 *                   type: string
 *                   example: "development"
 *                 version:
 *                   type: string
 *                   example: "1.0.0"
 */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0'
  });
});


// ================================================================
// APPLICATION ROUTES
// ================================================================

// Authentication routes
// app.use('/api/auth', require('./routes/authRoutes')); // TODO: Create authRoutes.js
// Merchant routes already defined above


// ================================================================
// ERROR HANDLING MIDDLEWARE
// ================================================================

// 404 handler for undefined routes
app.use(notFoundHandler);

// Global error handling middleware (must be last)
app.use(globalErrorHandler);


// ================================================================
// MODULE EXPORTS
// ================================================================

module.exports = app;
