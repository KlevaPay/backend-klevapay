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
const { swaggerSpec, swaggerUi, swaggerUiOptions } = require('./config/swagger');

const merchantRoutes = require('./routes/merchantRoutes');

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



app.use('/api/pay', require('./routes/paymentintegrationRoute'));

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

// Swagger documentation setup
app.use('/api/docs', swaggerUi.serve);
app.get('/api/docs', swaggerUi.setup(swaggerSpec, swaggerUiOptions));

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
    endpoints: ['/api/auth', '/api/merchant', '/api/health', '/api/docs'],
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
app.use('/api/auth', require('./routes/authRoutes'));
// TODO: Merchant routes (to be implemented)
// app.use('/api/merchant', require('./routes/merchantRoutes'));


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
