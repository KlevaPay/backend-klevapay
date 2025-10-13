# KlevaPay Backend API

A merchant payment gateway backend built with Node.js, Express.js, and MongoDB.

## Features

- JWT Authentication with refresh tokens
- Email verification with OTP
- Password reset flow
- Merchant registration
- Security (rate limiting, CORS, bcrypt)
- Winston logging
- Swagger documentation

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

## Environment Variables

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
```

## Project Structure

```
backend-klevapay/
├── server.js              # Server initialization
├── app.js                 # Express app setup
├── config/
│   └── connectDb.js       # MongoDB connection
├── controllers/
│   └── authController.js  # Authentication logic
├── models/
│   └── User.js           # User model
├── routes/
│   └── authRoutes.js     # API routes
├── services/
│   └── sendEmail.js      # Email service
├── middlewares/
│   └── errorHandler.js   # Error handling
└── utils/
    ├── jwtUtils.js       # JWT utilities
    └── otpUtils.js       # OTP utilities
```

## Error Responses

All errors follow this format:
```json
{
  "success": false,
  "error": {
    "message": "Error description",
    "statusCode": 400
  }
}
```

## License

ISC License

---

**KlevaPay Backend API v1.0.0**