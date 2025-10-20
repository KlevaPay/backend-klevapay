#!/bin/bash

# FIAT-TO-TOKEN Endpoint Testing Script
# This script tests all the new FIAT-TO-TOKEN endpoints

echo "🧪 FIAT-TO-TOKEN API Testing Script"
echo "===================================="
echo ""

# Configuration
BASE_URL="http://localhost:4000"
TEST_JWT="test_jwt_token_here"  # You'll need to replace this with a real JWT token

# Test 1: Health Check
echo "📊 Test 1: Health Check"
echo "GET $BASE_URL/api/health"
curl -X GET "$BASE_URL/api/health" \
  -H "Content-Type: application/json" \
  -w "\nStatus Code: %{http_code}\n" \
  -s
echo ""
echo "----------------------------------------"

# Test 2: API Root
echo "📊 Test 2: API Root"
echo "GET $BASE_URL/"
curl -X GET "$BASE_URL/" \
  -H "Content-Type: application/json" \
  -w "\nStatus Code: %{http_code}\n" \
  -s
echo ""
echo "----------------------------------------"

# Test 3: Swagger Documentation (just check if accessible)
echo "📊 Test 3: Swagger Documentation Access"
echo "GET $BASE_URL/api/docs.json"
curl -X GET "$BASE_URL/api/docs.json" \
  -H "Content-Type: application/json" \
  -w "\nStatus Code: %{http_code}\n" \
  -s -o /dev/null
echo ""
echo "----------------------------------------"

# Test 4: Create FIAT-TO-TOKEN Payment (without JWT first to test auth)
echo "📊 Test 4: Create FIAT-TO-TOKEN Payment (No Auth - Should Fail)"
echo "POST $BASE_URL/api/fiat-to-token/create-payment"
curl -X POST "$BASE_URL/api/fiat-to-token/create-payment" \
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
  }' \
  -w "\nStatus Code: %{http_code}\n" \
  -s
echo ""
echo "----------------------------------------"

# Test 5: Create FIAT-TO-TOKEN Payment (with JWT)
echo "📊 Test 5: Create FIAT-TO-TOKEN Payment (With Auth)"
echo "POST $BASE_URL/api/fiat-to-token/create-payment"
echo "Note: You need to replace TEST_JWT with a real JWT token"
curl -X POST "$BASE_URL/api/fiat-to-token/create-payment" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TEST_JWT" \
  -d '{
    "amount": 1000,
    "currency": "NGN",
    "customer": {
      "email": "test@klevapay.com",
      "name": "Test User"
    },
    "merchant_wallet": "0x742d35cc6cf41c4532c2c38e6b07f343d2c3c8b3",
    "gateway": "flutterwave"
  }' \
  -w "\nStatus Code: %{http_code}\n" \
  -s
echo ""
echo "----------------------------------------"

# Test 6: Check Transaction Status (without ID)
echo "📊 Test 6: Check Transaction Status (Invalid ID)"
echo "GET $BASE_URL/api/fiat-to-token/status/invalid_id"
curl -X GET "$BASE_URL/api/fiat-to-token/status/invalid_id" \
  -H "Authorization: Bearer $TEST_JWT" \
  -w "\nStatus Code: %{http_code}\n" \
  -s
echo ""
echo "----------------------------------------"

# Test 7: Get User Transactions (without auth)
echo "📊 Test 7: Get User Transactions (No Auth - Should Fail)"
echo "GET $BASE_URL/api/user/transactions"
curl -X GET "$BASE_URL/api/user/transactions" \
  -H "Content-Type: application/json" \
  -w "\nStatus Code: %{http_code}\n" \
  -s
echo ""
echo "----------------------------------------"

# Test 8: Get User Transactions (with auth)
echo "📊 Test 8: Get User Transactions (With Auth)"
echo "GET $BASE_URL/api/user/transactions"
curl -X GET "$BASE_URL/api/user/transactions" \
  -H "Authorization: Bearer $TEST_JWT" \
  -w "\nStatus Code: %{http_code}\n" \
  -s
echo ""
echo "----------------------------------------"

echo "✅ Testing Complete!"
echo ""
echo "📝 Next Steps:"
echo "1. Replace TEST_JWT with a real JWT token"
echo "2. Test with valid merchant authentication"
echo "3. Test the complete payment flow with Flutterwave sandbox"
echo "4. Test webhook simulation"
echo ""