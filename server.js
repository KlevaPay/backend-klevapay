// ================================================================
// DEPENDENCIES
// ================================================================

const http = require('http');
const { StatusCodes } = require('http-status-codes');

const app = require('./app');
const ApiError = require('./lib/ApiError');
const logger = require('./lib/logger');
const connectDB = require('./config/connectDb');


// ================================================================
// SERVER CONFIGURATION
// ================================================================

// Set port from environment variable or default to 4000
const PORT = process.env.PORT || 4000;

// Create HTTP server instance
const server = http.createServer(app);


// ================================================================
// ERROR HANDLERS
// ================================================================

/**
 * Handle server startup errors
 * @param {NodeJS.ErrnoException} err - Error object
 */
function serverError(err) {
  if (err.syscall !== 'listen') {
    logger.error('Unexpected error during server startup', err);
    throw err;
  }

  const bind = typeof PORT === 'string' ? 'Pipe ' + PORT : 'Port ' + PORT;

  // Handle specific listen errors with friendly messages
  switch (err.code) {
    case 'EACCES':
      logger.error(`${bind} requires elevated privileges`);
      process.exit(1);
      break;
    case 'EADDRINUSE':
      logger.error(`${bind} is already in use`);
      process.exit(1);
      break;
    default:
      throw new ApiError('Server startup error', StatusCodes.INTERNAL_SERVER_ERROR);
  }
}

/**
 * Handle server listening event
 */
function serverListening() {
  const addressInfo = server.address();
  const bind = typeof addressInfo === 'string' 
    ? 'pipe ' + addressInfo 
    : 'http://localhost:' + addressInfo.port;
    
  logger.info(`🚀 KlevaPay server listening on ${bind}`);
  logger.info(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`📝 API Documentation available at ${bind}/api/docs`);
}


// ================================================================
// SERVER INITIALIZATION
// ================================================================

/**
 * Initialize and start the server
 */
(async () => {
  try {
    // Connect to database first
    logger.info('🔌 Connecting to MongoDB...');
    await connectDB();
    logger.info('✅ Database connected successfully');

    // Set port for the express app
    app.set('port', PORT);

    // Configure server event listeners
    server.on('error', serverError);
    server.on('listening', serverListening);

    // Start the server
    server.listen(PORT);
    
    // Log successful startup
    logger.info(`🎯 KlevaPay Backend API v1.0.0 started successfully`);
    
  } catch (err) {
    // Log startup errors
    if (err instanceof Error) {
      logger.error('❌ Server startup failed:', {
        name: err.name,
        message: err.message,
        stack: err.stack
      });
    } else {
      logger.error('❌ Unknown server startup error:', err);
    }
    
    // Exit process on startup failure
    process.exit(1);
  }
})();


// ================================================================
// PROCESS EVENT HANDLERS
// ================================================================

/**
 * Handle uncaught promise rejections
 */
process.on('unhandledRejection', (reason, promise) => {
  logger.error('🚨 Unhandled Promise Rejection detected:', {
    reason: reason instanceof Error ? reason.message : reason,
    stack: reason instanceof Error ? reason.stack : null,
    promise: promise.toString()
  });
  
  // Close server gracefully
  server.close(() => {
    logger.info('💀 Server closed due to unhandled promise rejection');
    process.exit(1);
  });
});

/**
 * Handle uncaught exceptions
 */
process.on('uncaughtException', (err) => {
  logger.error('🚨 Uncaught Exception detected:', {
    name: err.name,
    message: err.message,
    stack: err.stack
  });
  
  // Close server gracefully
  server.close(() => {
    logger.info('💀 Server closed due to uncaught exception');
    process.exit(1);
  });
});

/**
 * Handle SIGTERM signal (graceful shutdown)
 */
process.on('SIGTERM', () => {
  logger.info('📞 SIGTERM signal received: closing HTTP server');
  server.close(() => {
    logger.info('🛑 HTTP server closed');
    process.exit(0);
  });
});

/**
 * Handle SIGINT signal (Ctrl+C)
 */
process.on('SIGINT', () => {
  logger.info('📞 SIGINT signal received: closing HTTP server');
  server.close(() => {
    logger.info('🛑 HTTP server closed');
    process.exit(0);
  });
});


// ================================================================
// MODULE EXPORTS
// ================================================================

/**
 * Export server for testing
 */
module.exports = server;