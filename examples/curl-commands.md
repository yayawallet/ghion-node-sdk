# cURL Commands for Testing SDK

This document provides cURL commands to test all SDK use cases through the Express server example.

## Prerequisites

1. Start the Express server:
```bash
npx ts-node examples/express-server.ts
```

2. The server will run on `http://localhost:3000`

---

## 1. Initialize Payment

Create a new payment session:

```bash
curl -X POST http://localhost:3000/api/payments/initialize \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 100,
    "currency": "ETB",
    "description": "Test payment"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "id": "019f3c14-8798-7e95-be0d-46e58b8fc4b7",
    "amount": 100,
    "currency": "ETB",
    "reference": "order_1234567890",
    "status": "pending",
    "channels": [...],
    "available_channels": [...]
  }
}
```

**Save the `id` from the response for subsequent commands.**

---

## 2. Submit Payment

Submit a payment with a specific channel:

```bash
curl -X POST http://localhost:3000/api/payments/{PAYMENT_ID}/submit \
  -H "Content-Type: application/json" \
  -d '{
    "channel": "yayawallet",
    "phoneNumber": "+251911234567"
  }'
```

Replace `{PAYMENT_ID}` with the ID from step 1.

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "id": "019f3c14-8798-7e95-be0d-46e58b8fc4b7",
    "status": "processing",
    "transaction_id": "txn_1234567890",
    "message": "Payment submitted successfully"
  }
}
```

**Note:** You may need a valid phone number registered with the payment provider for this to succeed.

---

## 3. Get Checkout Info

Retrieve checkout details, which may include QR codes.

```bash
curl http://localhost:3000/api/payments/{PAYMENT_ID}/checkout
```

---

## 4. Get QR Code Directly

Generate and retrieve a QR code for payment.

```bash
curl -X POST http://localhost:3000/api/payments/{PAYMENT_ID}/qr
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "qr_image_url": "https://...",
    "transaction_id": "txn_1234567890"
  }
}
```

---

## 5. Send OTP

Send an OTP for wallet validation.

```bash
curl -X POST http://localhost:3000/api/payments/{PAYMENT_ID}/otp/send \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+251911234567"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "status": "otp_sent",
    "message": "OTP sent successfully"
  }
}
```

---

## 6. Validate OTP

Validate the OTP to complete the payment.

```bash
curl -X POST http://localhost:3000/api/payments/{PAYMENT_ID}/otp/validate \
  -H "Content-Type: application/json" \
  -d '{
    "otpCode": "123456"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "status": "completed",
    "transaction_id": "txn_1234567890",
    "message": "Payment completed successfully"
  }
}
```

---

## 7. Get Payment Status

Check the status of a payment:

```bash
curl http://localhost:3000/api/payments/{PAYMENT_ID}/status
```

Replace `{PAYMENT_ID}` with the ID from step 1.

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "id": "019f3c14-8798-7e95-be0d-46e58b8fc4b7",
    "amount": 100,
    "currency": "ETB",
    "status": "pending",
    "reference": "order_1234567890",
    "created_at": "2024-01-01T12:00:00.000Z"
  }
}
```

**Possible Status Values:**
- `pending` - Payment initialized, awaiting submission
- `processing` - Payment submitted, being processed
- `completed` - Payment successful
- `failed` - Payment failed
- `cancelled` - Payment cancelled
- `expired` - Payment expired

---

## 8. Test Webhook

Simulate a webhook event (for testing purposes):

```bash
curl -X POST http://localhost:3000/webhook \
  -H "Content-Type: application/json" \
  -H "X-Ghion-Signature: {SIGNATURE}" \
  -d '{
    "event": "transaction.completed",
    "data": {
      "payment_id": "019f3c14-8798-7e95-be0d-46e58b8fc4b7",
      "transaction_id": "txn_1234567890",
      "amount": 100,
      "currency": "ETB",
      "status": "completed"
    }
  }'
```

**Note:** To generate a valid signature, you need to HMAC-SHA256 sign the payload with your API secret. For testing webhook signature verification, you can use the SDK's `verifyWebhook` method.

---

## Complete Test Flow

Here's a complete test flow you can run:

```bash
# 1. Health check
echo "=== Health Check ==="
curl http://localhost:3000/health
echo -e "\n"

# 2. Initialize payment
echo "=== Initialize Payment ==="
INIT_RESPONSE=$(curl -s -X POST http://localhost:3000/api/payments/initialize \
  -H "Content-Type: application/json" \
  -d '{"amount": 100, "currency": "ETB", "description": "Test payment"}')
echo $INIT_RESPONSE | jq
PAYMENT_ID=$(echo $INIT_RESPONSE | jq -r '.data.id')
echo -e "\nPayment ID: $PAYMENT_ID\n"

# 3. Get payment status
echo "=== Get Payment Status ==="
curl http://localhost:3000/api/payments/$PAYMENT_ID/status | jq
echo -e "\n"

# 4. Submit payment (optional - requires valid phone number)
echo "=== Submit Payment ==="
curl -X POST http://localhost:3000/api/payments/$PAYMENT_ID/submit \
  -H "Content-Type: application/json" \
  -d '{"channel": "yayawallet", "phoneNumber": "+251911234567"}' | jq
echo -e "\n"

# 5. Check final status
echo "=== Final Payment Status ==="
curl http://localhost:3000/api/payments/$PAYMENT_ID/status | jq
```

**Note:** This script requires `jq` for JSON formatting. Install it with:
- macOS: `brew install jq`
- Linux: `sudo apt-get install jq`
- Windows: `choco install jq`

---

## Error Handling Examples

### Invalid Amount

```bash
curl -X POST http://localhost:3000/api/payments/initialize \
  -H "Content-Type: application/json" \
  -d '{"amount": -100, "currency": "ETB"}'
```

**Expected Response:** 400/500 error with validation message

### Invalid Payment ID

```bash
curl http://localhost:3000/api/payments/invalid-id/status
```

**Expected Response:** 500 error with "Payment not found" message

### Missing Webhook Signature

```bash
curl -X POST http://localhost:3000/webhook \
  -H "Content-Type: application/json" \
  -d '{"event": "transaction.completed", "data": {}}'
```

**Expected Response:** 400 error with "Missing signature" message

---

## Testing with Different Currencies

```bash
# Ethiopian Birr
curl -X POST http://localhost:3000/api/payments/initialize \
  -H "Content-Type: application/json" \
  -d '{"amount": 100, "currency": "ETB"}'

# US Dollar
curl -X POST http://localhost:3000/api/payments/initialize \
  -H "Content-Type: application/json" \
  -d '{"amount": 10, "currency": "USD"}'
```

---

## Testing with Custom Reference

```bash
curl -X POST http://localhost:3000/api/payments/initialize \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 100,
    "currency": "ETB",
    "description": "Order #12345 - Premium Plan"
  }'
```

---

## PowerShell Commands

If you're using PowerShell on Windows, use these commands instead:

```powershell
# Health check
Invoke-RestMethod -Uri "http://localhost:3000/health" -Method Get

# Initialize payment
$body = @{
    amount = 100
    currency = "ETB"
    description = "Test payment"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:3000/api/payments/initialize" -Method Post -ContentType "application/json" -Body $body
$response

# Get payment status
$paymentId = $response.data.id
Invoke-RestMethod -Uri "http://localhost:3000/api/payments/$paymentId/status" -Method Get

# Submit payment
$submitBody = @{
    channel = "yayawallet"
    phoneNumber = "+251911234567"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/payments/$paymentId/submit" -Method Post -ContentType "application/json" -Body $submitBody
```

---

## Tips for Testing

1. **Use a JSON formatter:** Install `jq` or use a tool like Postman/Insomnia for better readability
2. **Save payment IDs:** Copy the payment ID from initialization responses for subsequent commands
3. **Check logs:** Monitor the server console for detailed error messages
4. **Test edge cases:** Try invalid amounts, missing fields, and invalid payment IDs
5. **Use environment variables:** The server loads credentials from `examples/.env`

---

## Troubleshooting

### Connection Refused
- Ensure the Express server is running
- Check that port 3000 is not blocked by firewall

### Invalid API Key
- Verify your credentials in `examples/.env`
- Ensure you're using the correct credentials

### Payment Submission Fails
- The phone number must be registered with the payment provider
- Check that the channel code is valid for your account

### Webhook Signature Verification Fails
- Ensure the signature is generated using HMAC-SHA256
- The signature must be base64 encoded
- Use your API secret to generate the signature
