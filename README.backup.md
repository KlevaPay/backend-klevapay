# Kl## Features

- JWT Authentication with refresh tokens
- Email verification with OTP
- Password reset flow
- Merchant registration
- Security (rate limiting,## Environment Variables

```env
NODE_ENV=development
PORT=4000
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/klevapay
JWT_SECRET=your-jwt-secret-key
JWT_REFRESH_SECRET=your-refresh-secret-key
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

## Request Examples

### Register Merchant
```bash
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe", 
    "email": "test@example.com",
    "businessName": "Test Business",
    "businessType": "retail",
    "password": "Password123!",
    "confirmPassword": "Password123!"
  }'
```

### Verify Email
```bash
curl -X POST http://localhost:4000/api/auth/verify-email \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "otp": "123456"
  }'
```

### Login
```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Password123!"
  }'
```RS, bcrypt)
- Winston logging
- Swagger documentationend API

A merchant payment gateway backend built with Node.js, Express.js, and MongoDB.

## 🚀 Key Features

- **🔐 JWT Authentication**: Secure token-based authentication with access & refresh tokens
- **📧 Email Verification**: OTP-based email verification with HTML templates  
- **� Password Management**: Complete forgot/reset password flow with OTP security
- **👥 Merchant Onboarding**: Business registration with KYC support
- **🛡️ Enterprise Security**: Rate limiting, CORS, Helmet security headers, bcrypt hashing
- **� Comprehensive Logging**: Winston logger with file rotation and structured logging
- **🚦 Advanced Error Handling**: Custom ApiError class with proper HTTP status codes
- **📚 Interactive Documentation**: Swagger/OpenAPI 3.0 documentation
- **⚡ Production Ready**: MongoDB Atlas integration, environment configuration, graceful shutdown

## API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new merchant |
| POST | `/api/auth/verify-email` | Verify email with OTP |
| POST | `/api/auth/resend-otp` | Resend verification OTP |
| POST | `/api/auth/login` | Login merchant |
| POST | `/api/auth/forgot-password` | Send password reset OTP |
| POST | `/api/auth/reset-password` | Reset password with OTP |

### System

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/docs` | API documentation |

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Setup environment:**
   ```bash
   cp Example.env .env
   # Edit .env with your configuration
   ```

3. **Start server:**
   ```bash
   npm start
   ```

4. **View documentation:**
   ```
   http://localhost:4000/api/docs
   ```

### 🏥 System Endpoints

#### **GET** `/api/health`
System health check and status information.

**Response (200):**
```json
{
  "status": "ok",
  "timestamp": "2025-10-13T17:24:26.337Z",
  "uptime": 19.668312292,
  "environment": "development",
  "version": "1.0.0"
}
```

---

#### **GET** `/api/docs`
Interactive Swagger/OpenAPI documentation interface.
- **URL**: `http://localhost:4000/api/docs`
- **Content**: Interactive API documentation with request/response examples
- **Features**: Try-it-out functionality, model schemas, authentication examples

---

#### **GET** `/`
API welcome message and available endpoints.

**Response (200):**
```json
{
  "message": "🏦 KlevaPay Backend API v1.0.0",
  "status": "operational",
  "timestamp": "2025-10-13T17:24:26.337Z",
  "documentation": "http://localhost:4000/api/docs",
  "endpoints": [
    "/api/auth",
    "/api/merchant", 
    "/api/health",
    "/api/docs"
  ]
}
```

## � Error Response Format

All API endpoints follow a consistent error response format:

**Error Response Structure:**
```json
{
  "success": false,
  "error": {
    "name": "ApiError",
    "message": "Descriptive error message",
    "statusCode": 400,
    "details": null,
    "stack": "Error stack trace (development only)"
  }
}
```

**Common HTTP Status Codes:**
- `400 Bad Request` - Invalid request data or validation errors
- `401 Unauthorized` - Authentication required or invalid credentials
- `404 Not Found` - Resource not found
- `409 Conflict` - Resource already exists (e.g., email already registered)
- `422 Unprocessable Entity` - Validation failed
- `423 Locked` - Account locked due to failed attempts
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Server error

---

## 🔒 Authentication & Security

### JWT Token Usage
After successful login or email verification, use the `accessToken` in API requests:

**Authorization Header:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Security Features
- **Password Requirements**: Minimum 8 characters with uppercase, lowercase, numbers, and special characters
- **OTP Security**: 6-digit codes with 15-minute expiration and 3-attempt limit
- **Account Locking**: Automatic account lock after failed attempts
- **Rate Limiting**: IP-based request rate limiting
- **CORS Protection**: Configurable cross-origin resource sharing
- **Input Validation**: Comprehensive request validation with sanitization

---

## �🛠️ Installation & Setup

### Prerequisites
- **Node.js** v16+ (recommended: v18 LTS)
- **MongoDB** (Atlas cloud or local instance)
- **npm** or **yarn** package manager
- **Gmail Account** (for SMTP email service)

### Installation Steps

1. **Clone the Repository**
   ```bash
   git clone https://github.com/KlevaPay/backend-klevapay.git
   cd backend-klevapay
   ```

2. **Install Dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Environment Configuration**
   Create a `.env` file in the root directory:
   ```env
   # Server Configuration
   NODE_ENV=development
   PORT=4000
   
   # Database Configuration
   MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/klevapay
   
   # JWT Configuration  
   JWT_SECRET=your-super-secret-jwt-key-min-32-chars
   JWT_REFRESH_SECRET=your-refresh-token-secret-key
   JWT_EXPIRE=7d
   JWT_REFRESH_EXPIRE=30d
   
   # Email Configuration (Gmail SMTP)
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=your-gmail@gmail.com
   SMTP_PASS=your-gmail-app-password
   
   # Security Configuration
   BCRYPT_SALT_ROUNDS=12
   OTP_EXPIRY_MINUTES=15
   MAX_LOGIN_ATTEMPTS=5
   ACCOUNT_LOCK_TIME=30
   ```

4. **Gmail App Password Setup**
   - Enable 2-Factor Authentication on your Gmail account
   - Generate an App Password for the application
   - Use the App Password in `SMTP_PASS` (not your regular password)

5. **Start the Server**
   ```bash
   # Development mode (with auto-restart)
   npm run dev
   
   # Production mode
   npm start
   
   # Build for production
   npm run build
   ```

6. **Verify Installation**
   ```bash
   # Health check
   curl http://localhost:4000/api/health
   
   # API documentation
   open http://localhost:4000/api/docs
   ```

## 🏗️ Project Architecture

```
backend-klevapay/
├── 📄 server.js                 # Server initialization & startup
├── 📄 app.js                    # Express app configuration & middleware
├── 📄 package.json              # Dependencies & npm scripts
├── 📄 .env                      # Environment variables (create from example)
├── 📄 Example.env               # Environment variables template
├── 📄 Project.md                # Project documentation
├── 
├── 📁 config/
│   └── connectDb.js             # MongoDB Atlas connection
├── 
├── 📁 controllers/
│   ├── onboarding.js            # Legacy onboarding logic
│   └── authController.js        # Authentication business logic
├── 
├── 📁 middlewares/
│   ├── errorHandler.js          # Global error handling middleware
│   └── authmiddleware.js        # JWT authentication middleware
├── 
├── 📁 models/
│   └── User.js                  # MongoDB User/Merchant model
├── 
├── 📁 routes/
│   └── authRoutes.js           # Authentication API routes
├── 
├── 📁 services/
│   └── sendEmail.js            # Nodemailer email service
├── 
├── 📁 lib/
│   ├── ApiError.js             # Custom error handling class
│   └── logger.js               # Winston logging configuration
├── 
├── 📁 utils/
│   ├── jwtUtils.js             # JWT token utilities
│   ├── otpUtils.js             # OTP generation utilities
│   └── Flutter.js              # Legacy Flutter utilities
├── 
└── 📁 logs/                    # Application logs (auto-created)
    ├── app.log                 # Application logs
    ├── combined.log            # All logs combined
    ├── error.log               # Error logs only
    ├── exceptions.log          # Uncaught exceptions
    └── rejections.log          # Unhandled promise rejections
```

## � Available NPM Scripts

```bash
# Development
npm run dev           # Start development server with auto-reload
npm start            # Start production server
npm run build        # Install dependencies and build

# Testing (Future Implementation)
npm test             # Run test suite
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Run tests with coverage report

# Code Quality (Future Implementation)  
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint issues automatically
```

## � API Documentation

**Interactive Documentation**: `http://localhost:4000/api/docs`
- ✅ **Swagger UI** with try-it-out functionality
- ✅ **Request/Response examples** for all endpoints
- ✅ **Model schemas** and validation rules
- ✅ **Authentication examples** with JWT tokens
- ✅ **Error response documentation**

**Additional Resources**:
- **Health Check**: `http://localhost:4000/api/health`
- **API Root**: `http://localhost:4000/`

## 📊 Logging & Monitoring

### Winston Logging System
**Development Mode:**
- Console output with color coding
- Detailed error stack traces
- Request/response logging

**Production Mode:**
- File-based logging with rotation
- Structured JSON logs
- Error aggregation and monitoring

### Log Files Structure
```
logs/
├── app.log              # Application-specific logs
├── combined.log         # All logs combined (info, warn, error)
├── error.log           # Error logs only
├── exceptions.log      # Uncaught exceptions
└── rejections.log      # Unhandled promise rejections
```

### Log Levels
- **error**: Error conditions
- **warn**: Warning conditions  
- **info**: Informational messages
- **debug**: Debug-level messages (development only)

## 🔐 Security Implementation

### Authentication Security
- **JWT Tokens**: RS256 algorithm with configurable expiration
- **Refresh Tokens**: Secure token rotation mechanism
- **Password Hashing**: bcrypt with 12 salt rounds
- **OTP Security**: 6-digit codes with 15-minute expiration

### API Security
- **Rate Limiting**: Prevents brute force attacks
- **CORS**: Configurable cross-origin resource sharing
- **Helmet**: Security headers (XSS, HSTS, etc.)
- **Input Validation**: Express-validator with sanitization
- **Error Handling**: No sensitive data in error responses

### Database Security
- **MongoDB Atlas**: Enterprise-grade cloud database
- **Connection Encryption**: TLS/SSL encrypted connections
- **Input Sanitization**: Prevents NoSQL injection attacks
- **Index Optimization**: Efficient queries and performance

## 🧪 Testing Examples

### Registration Flow Test
```bash
# 1. Register new merchant
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "email": "test@example.com",
    "businessName": "Test Business",
    "businessType": "retail",
    "password": "TestPassword123!",
    "confirmPassword": "TestPassword123!"
  }'

# 2. Verify email (check your email for OTP)
curl -X POST http://localhost:4000/api/auth/verify-email \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "otp": "123456"
  }'

# 3. Login with credentials
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPassword123!"
  }'
```

### Password Reset Test
```bash
# 1. Request password reset
curl -X POST http://localhost:4000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'

# 2. Reset password (use OTP from email)
curl -X POST http://localhost:4000/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "otp": "654321",
    "newPassword": "NewPassword456!",
    "confirmPassword": "NewPassword456!"
  }'
```

## 🚀 Production Deployment

### Environment Configuration
**Required Production Variables:**
```env
NODE_ENV=production
PORT=4000
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/klevapay
JWT_SECRET=your-production-jwt-secret-min-32-chars
JWT_REFRESH_SECRET=your-production-refresh-secret
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=production-email@company.com
SMTP_PASS=production-app-password
BCRYPT_SALT_ROUNDS=12
```

### Deployment Steps
```bash
# 1. Clone repository
git clone https://github.com/KlevaPay/backend-klevapay.git
cd backend-klevapay

# 2. Install dependencies
npm ci --only=production

# 3. Set environment variables
cp .env.example .env
# Edit .env with production values

# 4. Start production server
npm start

# 5. Health check
curl http://your-domain.com/api/health
```

### Docker Deployment (Optional)
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 4000
CMD ["npm", "start"]
```

## 🐛 Troubleshooting

### Common Issues

**1. MongoDB Connection Failed**
```bash
# Check connection string format
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/database

# Verify IP whitelist in MongoDB Atlas
# Ensure password doesn't contain special characters
```

**2. Email Service Not Working**
```bash
# Verify Gmail App Password (not regular password)
# Enable 2-Factor Authentication first
# Check SMTP configuration in .env
```

**3. JWT Token Errors**
```bash
# Ensure JWT_SECRET is at least 32 characters
# Check token expiration settings
# Verify authorization header format: "Bearer <token>"
```

**4. Port Already in Use**
```bash
# Find process using port 4000
lsof -ti:4000

# Kill process
kill -9 <process_id>

# Or use different port
PORT=5000 npm start
```

## 📈 Performance Optimization

### Database Optimization
- **Indexes**: Email field indexed for fast lookups
- **Connection Pooling**: MongoDB connection pool configured
- **Query Optimization**: Selective field queries with `.select()`

### Security Optimization  
- **Rate Limiting**: Prevents abuse and DDoS attacks
- **Password Hashing**: Async bcrypt with optimal salt rounds
- **JWT Optimization**: Compact payloads with essential claims

### Logging Optimization
- **File Rotation**: Prevents log files from growing too large
- **Structured Logging**: JSON format for better parsing
- **Log Levels**: Configurable verbosity based on environment

## 🤝 Contributing

### Development Setup
```bash
# Fork and clone
git clone https://github.com/yourusername/backend-klevapay.git
cd backend-klevapay

# Install dev dependencies
npm install

# Start development server
npm run dev

# Make changes and test
npm test

# Create pull request
git checkout -b feature/your-feature
git commit -m "Add your feature"
git push origin feature/your-feature
```

### Code Style Guidelines
- **ESLint**: Follow configured linting rules
- **Prettier**: Use for consistent code formatting
- **Naming**: Use camelCase for variables, PascalCase for classes
- **Comments**: Document complex business logic
- **Error Handling**: Use ApiError class consistently

## 📞 Support & Contact

- **🐛 Issues**: [GitHub Issues](https://github.com/KlevaPay/backend-klevapay/issues)
- **📚 Documentation**: [API Docs](http://localhost:4000/api/docs)  
- **💬 Discussions**: [GitHub Discussions](https://github.com/KlevaPay/backend-klevapay/discussions)
- **📧 Email**: developers@klevapay.com
- **🌐 Website**: [klevapay.com](https://klevapay.com)

## 📜 License

This project is licensed under the **ISC License** - see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**🏦 KlevaPay Backend API v1.0.0**

*Built with ❤️ by the KlevaPay Development Team*

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green.svg)](https://www.mongodb.com/cloud/atlas)
[![Express.js](https://img.shields.io/badge/Express.js-4.18+-blue.svg)](https://expressjs.com/)
[![JWT](https://img.shields.io/badge/JWT-Secure-orange.svg)](https://jwt.io/)

</div>