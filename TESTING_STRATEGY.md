# FIAT-TO-TOKEN API Testing Strategy

## Prerequisites

1. **Server Running**: Ensure your server is running on http://localhost:4000
2. **Database Connected**: MongoDB should be connected
3. **Environment Variables**: All required environment variables set

## Testing Phases

### Phase 1: Basic Connectivity Tests (No Auth Required)

These tests verify that the server and routing are working correctly:

#### Test 1.1: Health Check
```bash
curl -X GET "http://localhost:4000/api/health"
```
**Expected**: `{"status":"ok","timestamp":"...","uptime":...}`

#### Test 1.2: API Root
```bash
curl -X GET "http://localhost:4000/"
```
**Expected**: `{"message":"KlevaPay API","version":"1.0.0",...}`

#### Test 1.3: Swagger Documentation
```bash
curl -X GET "http://localhost:4000/api/docs.json"
```
**Expected**: JSON with `"openapi":"3.0.0"` and endpoint definitions

### Phase 2: Authentication Tests

#### Test 2.1: Create Payment Without Auth (Should Fail)
```bash
curl -X POST "http://localhost:4000/api/fiat-to-token/create-payment" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 1000,
    "currency": "NGN",
    "customer": {
      "email": "test@klevapay.com",
      "name": "Test User"
    },
    "merchant_wallet": "0x742d35cc6cf41c4532c2c38e6b07f343d2c3c8b3",
    "gateway": "flutterwave"
  }'
```
**Expected**: `401 Unauthorized` - This confirms auth middleware is working

#### Test 2.2: User Transactions Without Auth (Should Fail)
```bash
curl -X GET "http://localhost:4000/api/user/transactions"
```
**Expected**: `401 Unauthorized`

### Phase 3: Get JWT Token for Authenticated Tests

You need a valid JWT token. Options:

#### Option A: Use Existing Merchant Endpoints
```bash
# Register merchant (if needed)
curl -X POST "http://localhost:4000/api/merchant/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@merchant.com",
    "password": "password123",
    "name": "Test Merchant",
    "walletAddress": "0x742d35cc6cf41c4532c2c38e6b07f343d2c3c8b3"
  }'

# Login to get JWT
curl -X POST "http://localhost:4000/api/merchant/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@merchant.com",
    "password": "password123"
  }'
```

#### Option B: Create Test JWT (For Development)
Add this to your auth middleware for testing:
```javascript
// In authmiddleware.js - DEVELOPMENT ONLY
if (token === 'test_token_dev_only') {
  req.user = { id: 'test_user_id', email: 'test@test.com' };
  return next();
}
```

### Phase 4: Authenticated Endpoint Tests

Replace `YOUR_JWT_TOKEN` with the actual token from Phase 3:

#### Test 4.1: Create FIAT-TO-TOKEN Payment
```bash
curl -X POST "http://localhost:4000/api/fiat-to-token/create-payment" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "amount": 1000,
    "currency": "NGN",
    "customer": {
      "email": "test@klevapay.com",
      "name": "Test User"
    },
    "merchant_wallet": "0x742d35cc6cf41c4532c2c38e6b07f343d2c3c8b3",
    "gateway": "flutterwave",
    "metadata": {
      "test": true,
      "order_id": "TEST-001"
    }
  }'
```
**Expected**: Payment creation response with `transaction_id`, `payment_link`, `estimated_usdt`

#### Test 4.2: Check Transaction Status
```bash
# Use transaction_id from Test 4.1 response
curl -X GET "http://localhost:4000/api/fiat-to-token/status/TRANSACTION_ID_FROM_STEP_4.1" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```
**Expected**: Transaction details with status, timeline, etc.

#### Test 4.3: Get User Transaction History
```bash
curl -X GET "http://localhost:4000/api/user/transactions?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```
**Expected**: Paginated transaction list

#### Test 4.4: Test Transaction Filters
```bash
curl -X GET "http://localhost:4000/api/user/transactions?type=fiat_to_token&status=pending_payment" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```
**Expected**: Filtered transaction list

### Phase 5: Webhook Testing

#### Test 5.1: Webhook Simulation
```bash
curl -X POST "http://localhost:4000/api/fiat-to-token/webhook" \
  -H "Content-Type: application/json" \
  -H "verif-hash: test_webhook_signature" \
  -d '{
    "event": "charge.completed",
    "data": {
      "tx_ref": "FIAT-KP-test-123",
      "status": "successful",
      "amount": 1000,
      "currency": "NGN",
      "customer": {
        "email": "test@klevapay.com",
        "name": "Test User"
      }
    }
  }'
```
**Expected**: May return 404 (transaction not found) or 400 (invalid signature) - this is normal for test data

### Phase 6: Receipt Testing

#### Test 6.1: Download Receipt PDF
```bash
# Use receipt_id from transaction creation
curl -X GET "http://localhost:4000/api/receipts/RECEIPT_ID/pdf" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  --output test-receipt.pdf
```
**Expected**: PDF file download or 404 if receipt doesn't exist

#### Test 6.2: Get Receipt JSON
```bash
curl -X GET "http://localhost:4000/api/receipts/RECEIPT_ID/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```
**Expected**: JSON receipt data

## Expected Results Summary

### ✅ Should Work (200 OK)
- Health check
- API root
- Swagger docs
- Authenticated requests with valid JWT

### ❌ Should Fail (Expected Failures)
- `401 Unauthorized` for requests without JWT token
- `404 Not Found` for invalid transaction/receipt IDs
- `400 Bad Request` for malformed webhook signatures

### ⚠️ May Have Issues (Implementation Dependent)
- Payment creation - depends on Flutterwave configuration
- Blockchain operations - depends on Lisk network and contract setup
- Price feed - depends on Chainlink integration

## Debugging Common Issues

### Issue: Server Not Responding
```bash
# Check if server is running
ps aux | grep node | grep server
lsof -i :4000
```

### Issue: Database Connection
Check server logs for MongoDB connection errors

### Issue: Environment Variables
Verify `.env` file has all required variables:
- `FLUTTERWAVE_SECRET_KEY`
- `LISK_RPC_URL`
- `CONTRACT_ADDRESS`
- `PRIVATE_KEY`
- `WEBHOOK_SECRET`

### Issue: JWT Token Problems
- Make sure token is not expired
- Verify token format: `Bearer <token>`
- Check middleware is properly configured

## Testing Checklist

- [ ] Server starts without errors
- [ ] Database connects successfully
- [ ] Health endpoint responds
- [ ] Swagger docs load
- [ ] Auth middleware blocks unauthorized requests
- [ ] JWT token can be obtained
- [ ] Payment creation works with auth
- [ ] Transaction status can be checked
- [ ] User transactions can be retrieved
- [ ] Webhook endpoint exists (even if returns error)
- [ ] Receipt endpoints exist (even if no receipts yet)

## Automated Testing Script

Run the Node.js test script:
```bash
node test-api.js
```

Or use the bash script:
```bash
chmod +x test-endpoints.sh
./test-endpoints.sh
```

## Performance Testing

For load testing (after basic tests pass):
```bash
# Install Apache Bench
brew install apache-bench

# Test health endpoint
ab -n 100 -c 10 http://localhost:4000/api/health

# Test with auth (replace JWT_TOKEN)
ab -n 50 -c 5 -H "Authorization: Bearer JWT_TOKEN" http://localhost:4000/api/user/transactions
```

## Next Steps After Testing

1. **Fix any failing tests** - Address configuration issues
2. **Integrate with Flutterwave sandbox** - Test real payment flow
3. **Set up Lisk testnet** - Test blockchain operations
4. **Configure webhooks** - Test automatic conversion flow
5. **Add monitoring** - Set up logging and metrics
6. **Deploy to staging** - Test in production-like environment

---

**Remember**: Some failures are expected during initial testing. Focus on getting the basic connectivity and authentication working first, then tackle the payment and blockchain integration.