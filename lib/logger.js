const winston = require('winston');
const path = require('path');

// Define custom log format
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.prettyPrint()
);

// Define console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({
    format: 'HH:mm:ss'
  }),
  winston.format.printf(({ timestamp, level, message, stack }) => {
    return `${timestamp} [${level}]: ${stack || message}`;
  })
);

// Create logs directory if it doesn't exist
const logsDir = path.join(process.cwd(), 'logs');

// Configure transports
const transports = [];

// Console transport for development
if (process.env.NODE_ENV !== 'production') {
  transports.push(
    new winston.transports.Console({
      level: 'debug',
      format: consoleFormat
    })
  );
}

// File transports
transports.push(
  // Error log file
  new winston.transports.File({
    filename: path.join(logsDir, 'error.log'),
    level: 'error',
    format: logFormat,
    maxsize: 5242880, // 5MB
    maxFiles: 5,
  }),
  
  // Combined log file
  new winston.transports.File({
    filename: path.join(logsDir, 'combined.log'),
    format: logFormat,
    maxsize: 5242880, // 5MB
    maxFiles: 5,
  }),
  
  // Application log file
  new winston.transports.File({
    filename: path.join(logsDir, 'app.log'),
    level: 'info',
    format: logFormat,
    maxsize: 5242880, // 5MB
    maxFiles: 5,
  })
);

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  format: logFormat,
  defaultMeta: { 
    service: 'klevapay-backend',
    environment: process.env.NODE_ENV || 'development'
  },
  transports,
  exitOnError: false
});

// Handle uncaught exceptions and unhandled rejections
logger.exceptions.handle(
  new winston.transports.File({ 
    filename: path.join(logsDir, 'exceptions.log'),
    format: logFormat
  })
);

logger.rejections.handle(
  new winston.transports.File({ 
    filename: path.join(logsDir, 'rejections.log'),
    format: logFormat
  })
);

// Add request ID to logs if available
logger.addRequestId = (req, res, next) => {
  req.requestId = Math.random().toString(36).substr(2, 9);
  logger.defaultMeta.requestId = req.requestId;
  next();
};

// Utility methods for structured logging
logger.logRequest = (req, res, responseTime) => {
  logger.info('HTTP Request', {
    method: req.method,
    url: req.url,
    statusCode: res.statusCode,
    responseTime: `${responseTime}ms`,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    requestId: req.requestId
  });
};

logger.logError = (error, req = null) => {
  const errorLog = {
    name: error.name,
    message: error.message,
    stack: error.stack,
    statusCode: error.statusCode || 500
  };

  if (req) {
    errorLog.requestId = req.requestId;
    errorLog.method = req.method;
    errorLog.url = req.url;
    errorLog.userAgent = req.get('User-Agent');
    errorLog.ip = req.ip;
  }

  logger.error('Application Error', errorLog);
};

logger.logAuth = (action, userId, email, success = true, details = null) => {
  logger.info('Authentication Event', {
    action,
    userId,
    email,
    success,
    details,
    timestamp: new Date().toISOString()
  });
};

logger.logDatabase = (operation, collection, duration, success = true, error = null) => {
  const logData = {
    operation,
    collection,
    duration: `${duration}ms`,
    success
  };

  if (error) {
    logData.error = error.message;
  }

  logger.info('Database Operation', logData);
};

// Create logs directory
const fs = require('fs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

module.exports = logger;