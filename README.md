# 🏦 KlevaPay Backend API

[![Node.js](https://img.shields.io/badge/Node.js-14%2B-green.svg)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-4.18%2B-lightgrey.svg)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-5.0%2B-green.svg)](https://www.mongodb.com/)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)

A modern, secure merchant payment gateway backend built with Node.js, Express.js, and MongoDB. KlevaPay enables businesses to accept payments through multiple payment gateways with crypto wallet integration.

## 🚀 Key Features

- **🔐 JWT Authentication**: Secure token-based authentication with middleware protection
- **💳 Multi-Gateway Support**: Integrated with Flutterwave and OPay payment gateways
- **🌐 Crypto Wallet Integration**: Wallet-based merchant onboarding and management
- **📊 Payment Intent System**: Advanced payment processing with status tracking
- **🛡️ Enterprise Security**: Rate limiting, CORS, Helmet security headers, bcrypt hashing
- **📝 Comprehensive Logging**: Winston logger with structured logging and file rotation
- **🚦 Advanced Error Handling**: Custom ApiError class with proper HTTP status codes
- **📚 Interactive Documentation**: Swagger/OpenAPI 3.0 documentation with try-it-out functionality
- **⚡ Production Ready**: Environment configuration, graceful shutdown, MongoDB integration

## 📋 API Endpoints

### 🏥 System & Health
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | API welcome message and endpoints |
| GET | `/api/health` | System health check and uptime |
| GET | `/api/docs` | Interactive Swagger documentation |
| GET | `/api/docs.json` | OpenAPI JSON specification |

### 👥 Merchant Management
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/merchant` | Create new business profile | ❌ |
| GET | `/api/merchant/wallet/{address}` | Get business by wallet address | ❌ |
| GET | `/api/merchant` | Get all businesses (Admin) | ✅ |

### 💰 Payment Intents
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/payment-intents` | Create new payment intent | ✅ |
| GET | `/api/payment-intents/{id}` | Get payment intent details | ✅ |
| PATCH | `/api/payment-intents/{id}/status` | Update payment status | ✅ |

### 🔄 Payment Integration
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/pay/create-payment` | Create payment via gateways | ✅ |
| POST | `/api/pay/check-status` | Check payment transaction status | ✅ |
| POST | `/api/pay/handle-redirect` | Handle gateway redirects | ✅ |
| POST | `/api/pay/webhook` | Process gateway webhooks | ✅ |

## 🛠️ Tech Stack

- **Runtime**: Node.js 14+
- **Framework**: Express.js 4.18
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT with custom middleware
- **Payment Gateways**: Flutterwave, OPay
- **Security**: Helmet, CORS, Rate Limiting, bcrypt
- **Logging**: Winston with file rotation
- **Documentation**: Swagger/OpenAPI 3.0
- **Validation**: Express Validator
- **Email**: Nodemailer

## 🚀 Quick Start

### Prerequisites

- Node.js 14.0.0 or higher
- MongoDB database (local or Atlas)
- npm or yarn package manager

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/KlevaPay/backend-klevapay.git
   cd backend-klevapay
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   cp Example.env .env
   ```
   
   Edit `.env` with your configuration:
   ```env
   # Database
   MONGO_URI=mongodb://localhost:27017/klevapay
   
   # JWT Secrets
   JWT_SECRET=your-super-secret-jwt-key
   JWT_REFRESH_SECRET=your-refresh-token-secret
   
   # Email Configuration
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-app-password
   
   # Server
   NODE_ENV=development
   PORT=4000
   BASE_URL=http://localhost:4000
   
   # Payment Gateways (Optional)
   FLUTTERWAVE_PUBLIC_KEY=your-flutterwave-public-key
   FLUTTERWAVE_SECRET_KEY=your-flutterwave-secret-key
   OPAY_PUBLIC_KEY=your-opay-public-key
   OPAY_SECRET_KEY=your-opay-secret-key
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```

5. **Verify installation:**
   - API Root: http://localhost:4000
   - Health Check: http://localhost:4000/api/health
   - Documentation: http://localhost:4000/api/docs

## 📁 Project Structure

```
backend-klevapay/
├── 📄 server.js                    # Server initialization & startup
├── 📄 app.js                       # Express app configuration & middleware
├── 📄 package.json                 # Dependencies & npm scripts
├── 📄 Example.env                  # Environment variables template
├── 📄 insomnia-collection.json     # API testing collection
│
├── 📁 config/
│   ├── connectDb.js               # MongoDB connection setup
│   ├── swagger.js                 # Swagger/OpenAPI configuration
│   ├── flutterwave.js            # Flutterwave gateway config
│   └── opay.js                   # OPay gateway config
│
├── 📁 controllers/
│   ├── merchantController.js      # Merchant business logic
│   ├── paymentIntentController.js # Payment intent management
│   └── paymentIntegrationControllers.js # Gateway integrations
│
├── 📁 middlewares/
│   ├── errorHandler.js           # Global error handling
│   └── authmiddleware.js         # JWT authentication
│
├── 📁 models/
│   ├── Merchant.js               # Merchant/Business model
│   ├── PaymentInent.js           # Payment intent model
│   ├── Transaction.js            # Transaction records model
│   ├── User.js                   # User accounts model
│   └── Migration.js              # Database migrations
│
├── 📁 routes/
│   ├── merchantRoutes.js         # Merchant API routes
│   ├── paymentIntentRoute.js     # Payment intent routes
│   └── paymentintegrationRoute.js # Payment gateway routes
│
├── 📁 services/
│   ├── PaymentIntentService.js   # Payment intent business logic
│   ├── paymentIntegrationServices.js # Gateway service layer
│   └── sendEmail.js              # Email notification service
│
├── 📁 lib/
│   ├── ApiError.js               # Custom error handling class
│   └── logger.js                 # Winston logging configuration
│
├── 📁 utils/
│   ├── jwtUtils.js               # JWT token utilities
│   ├── otpUtils.js               # OTP generation utilities
│   └── Flutter.js               # Flutter/Flutterwave utilities
│
└── 📁 logs/                      # Application logs (auto-created)
    ├── app.log                   # Application logs
    ├── combined.log              # All logs combined
    └── error.log                 # Error logs only
```

## 🔧 Available NPM Scripts

```bash
# Development
npm run dev           # Start development server with auto-reload (nodemon)
npm start            # Start production server
npm run build        # Install dependencies and build

# Testing & Quality (Future Implementation)
npm test             # Run test suite with Jest
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint issues automatically
```

## 💼 Request Examples

### Create Merchant Business
```bash
curl -X POST http://localhost:4000/api/merchant \
  -H "Content-Type: application/json" \
  -d '{
    "walletAddress": "0x742E4C8e9b6Ea8B6f7A7C6A1e2D8F3b9C1a4B5E6",
    "businessName": "Tech Innovations Ltd",
    "payoutPreferences": {
      "currency": "NGN",
      "method": "bank_transfer"
    }
  }'
```

### Create Payment Intent
```bash
curl -X POST http://localhost:4000/api/payment-intents \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-jwt-token" \
  -d '{
    "amount": 1000.50,
    "currency": "NGN",
    "merchantId": "64f5e8b2a1b2c3d4e5f6g7h8",
    "description": "Payment for order #12345"
  }'
```

### Create Payment Transaction
```bash
curl -X POST http://localhost:4000/api/pay/create-payment \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-jwt-token" \
  -d '{
    "amount": 5000.00,
    "currency": "NGN",
    "customer": {
      "email": "customer@example.com",
      "name": "John Doe",
      "phone": "+234812345678"
    },
    "gateway": "flutterwave",
    "redirect_url": "https://yoursite.com/payment/callback"
  }'
```

### Check Payment Status
```bash
curl -X POST http://localhost:4000/api/pay/check-status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-jwt-token" \
  -d '{
    "transaction_id": "tx_64f5e8b2a1b2c3d4e5f6g7h8",
    "gateway": "flutterwave"
  }'
```

## 🛡️ Security Features

- **Rate Limiting**: 100 requests per 15 minutes per IP
- **CORS Protection**: Configurable allowed origins
- **Helmet Security**: Security headers for XSS, CSRF protection
- **JWT Authentication**: Secure token-based authentication
- **Input Validation**: Express Validator for request validation
- **Error Sanitization**: No sensitive data in error responses
- **Request Logging**: Comprehensive request tracking

## 📊 Monitoring & Health

### Health Check Endpoint
```bash
GET /api/health
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-10-18T10:30:00.000Z",
  "uptime": 3600.5,
  "environment": "development",
  "version": "1.0.0"
}
```

### Logging
- **File Logging**: Separate files for different log levels
- **Console Logging**: Development-friendly console output
- **Request Tracking**: Unique request IDs for tracing
- **Error Logging**: Detailed error tracking with stack traces

## 🔗 Payment Gateway Integration

### Supported Gateways
- **Flutterwave**: Card payments, bank transfers, mobile money
- **OPay**: Digital wallet payments, bank transfers

### Gateway Features
- ✅ Payment creation and processing
- ✅ Transaction status verification
- ✅ Webhook handling for real-time updates
- ✅ Redirect handling for payment completion
- ✅ Multi-currency support

## 🎯 Data Models

### Merchant Schema
```javascript
{
  walletAddress: String,      // Crypto wallet address (unique)
  businessName: String,       // Business name (unique)
  payoutPreferences: {
    currency: String,         // NGN, USD, EUR, USDT, BTC, ETH
    method: String,          // bank_transfer, mobile_money, crypto
    accountDetails: Object   // Bank/wallet details
  },
  kycStatus: String,         // pending, approved, rejected
  country: String,           // Default: Nigeria
  timestamps: true
}
```

### Payment Intent Schema
```javascript
{
  merchantId: ObjectId,      // Reference to merchant
  orderId: String,          // Merchant order ID
  amount: Number,           // Payment amount
  sourceCurrency: String,   // Original currency
  targetCurrency: String,   // Target currency
  status: String,           // PENDING, PAID, SETTLED, FAILED
  checkoutLink: String,     // Payment URL
  widgetToken: String,      // Widget integration token
  metadata: Object,         // Additional data
  timestamps: true
}
```

### Transaction Schema
```javascript
{
  merchantId: ObjectId,     // Reference to merchant
  reference: String,        // Transaction reference (indexed)
  amount: Number,          // Transaction amount
  currency: String,        // Default: NGN
  method: String,          // CARD, BANK, WALLET
  status: String,          // PENDING, PAID, SETTLED, FAILED
  opayReference: String,   // Gateway reference
  providerResponse: Object, // Raw gateway response
  metadata: Object,        // Additional data
  timestamps: true
}
```

## 📋 Error Response Format

All API endpoints follow a consistent error response format:

```json
{
  "success": false,
  "error": {
    "name": "ApiError",
    "message": "Descriptive error message",
    "statusCode": 400,
    "details": null
  }
}
```

### Common HTTP Status Codes
- `200 OK` - Request successful
- `201 Created` - Resource created successfully
- `400 Bad Request` - Invalid request data or validation errors
- `401 Unauthorized` - Authentication required or invalid credentials
- `403 Forbidden` - Access denied
- `404 Not Found` - Resource not found
- `409 Conflict` - Resource already exists
- `422 Unprocessable Entity` - Validation failed
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Server error

## 📚 API Documentation

**Interactive Documentation**: http://localhost:4000/api/docs

The Swagger documentation includes:
- ✅ **Interactive API Explorer** with try-it-out functionality
- ✅ **Request/Response Examples** for all endpoints
- ✅ **Model Schemas** and validation rules
- ✅ **Authentication Examples** with JWT tokens
- ✅ **Error Response Documentation**
- ✅ **Gateway Integration Examples**

**Additional Resources**:
- **OpenAPI JSON**: http://localhost:4000/api/docs.json
- **Health Check**: http://localhost:4000/api/health
- **API Root**: http://localhost:4000/

## 🔧 Development

### Prerequisites for Development
```bash
# Install nodemon for development
npm install -g nodemon

# Run in development mode
npm run dev

# Run tests (when implemented)
npm test

# Code linting
npm run lint
npm run lint:fix
```

### Database Setup
1. **Local MongoDB:**
   ```bash
   # Install MongoDB locally
   brew install mongodb/brew/mongodb-community
   
   # Start MongoDB
   brew services start mongodb/brew/mongodb-community
   ```

2. **MongoDB Atlas (Recommended for production):**
   - Create account at [MongoDB Atlas](https://www.mongodb.com/atlas)
   - Create cluster and get connection string
   - Update `MONGO_URI` in `.env`

### Environment Configurations

**Development:**
```env
NODE_ENV=development
PORT=4000
MONGO_URI=mongodb://localhost:27017/klevapay-dev
```

**Production:**
```env
NODE_ENV=production
PORT=8080
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/klevapay
```

## 🚀 Deployment

### Server Requirements
- Node.js 14.0.0+
- MongoDB 5.0+
- PM2 (for production process management)

### Production Deployment
```bash
# Install PM2 globally
npm install -g pm2

# Start with PM2
pm2 start server.js --name "klevapay-backend"

# Configure PM2 startup
pm2 startup
pm2 save
```

### Environment Variables (Production)
Ensure all required environment variables are set in production:
- `MONGO_URI` - MongoDB connection string
- `JWT_SECRET` - Strong JWT secret key
- `JWT_REFRESH_SECRET` - Strong refresh token secret
- `NODE_ENV=production`
- Gateway credentials (Flutterwave, OPay)

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow existing code style and conventions
- Add comprehensive Swagger documentation for new endpoints
- Include error handling and validation
- Update README.md for new features
- Add appropriate logging

## 📄 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

- **Documentation**: http://localhost:4000/api/docs
- **Issues**: [GitHub Issues](https://github.com/KlevaPay/backend-klevapay/issues)
- **Email**: dev@klevapay.com

## 🎯 Roadmap

- [ ] User authentication system (register, login, password reset)
- [ ] Advanced KYC verification system
- [ ] Multi-signature wallet support
- [ ] Advanced analytics and reporting
- [ ] Automated testing suite
- [ ] GraphQL API support
- [ ] Real-time notifications with WebSockets
- [ ] Multi-language support

---

**Built with ❤️ by the KlevaPay Team**