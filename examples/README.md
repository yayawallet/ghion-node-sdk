# Examples Directory

This directory contains integration examples demonstrating how to use the Ghion Finances SDK with different frameworks.

## Quick Start

1. **Copy environment variables:**
   ```bash
   cp .env.example .env
   ```

2. **Edit `.env` with your credentials:**
   - Get your API credentials from [https://ghion.financial](https://ghion.financial)
   - Replace the placeholder values with your actual credentials

## Available Examples

### 1. Quick Start (`quick-start.ts`)
**Purpose:** Basic SDK usage without Express.js

**What it demonstrates:**
- Initializing the SDK client
- Creating a payment session
- Submitting a payment
- Checking payment status
- Handling different payment statuses

**How to run:**
```bash
npx ts-node examples/quick-start.ts
```

**Best for:** Understanding the basic SDK workflow before integrating with a web framework

---

### 2. Express Server (`express-server.ts`)
**Purpose:** Complete Express.js integration with webhook handling

**What it demonstrates:**
- Setting up an Express.js server
- Creating API endpoints for payment operations
- Handling webhook events with signature verification
- Complete payment flow from initialization to completion

**How to run:**
```bash
npx ts-node examples/express-server.ts
```

**Available endpoints:**
- `POST /api/payments/initialize` - Initialize payment
- `POST /api/payments/:paymentId/submit` - Submit payment
- `GET /api/payments/:paymentId/status` - Get payment status
- `POST /webhook` - Webhook handler
- `GET /test/webhook-signature` - Generates test webhook signature

---

## Running Examples

### Quick Start Example
```bash
npx ts-node examples/quick-start.ts
```

### Express Server
```bash
npx ts-node examples/express-server.ts
```

Then test the endpoints using curl or Postman:

```bash
# Initialize payment
curl -X POST http://localhost:3000/api/payments/initialize \
  -H "Content-Type: application/json" \
  -d '{"amount": 100, "currency": "ETB"}'

# Check payment status
curl http://localhost:3000/api/payments/{paymentId}/status
```

## Testing with cURL

For comprehensive cURL commands to test all SDK use cases, see [curl-commands.md](curl-commands.md). This guide includes:

- Payment initialization
- Payment submission
- Payment status checking
- Webhook testing
- Complete test flow scripts
- PowerShell equivalents
- Error handling examples

## Environment Variables

All examples use the following environment variables (defined in `.env`):

```env
GHION_API_KEY=your_api_key_here
GHION_API_SECRET=your_api_secret_here
GHION_API_PASSPHRASE=your_passphrase_here
PORT=3000
```

## Testing

For testing the SDK, please refer to the main README or run the Jest tests:

```bash
# Run unit tests (no credentials needed)
npm test

# Run integration tests (credentials required in examples/.env)
npm test -- tests/integration.test.ts
```

## Troubleshooting

### Example won't run
- Ensure you've built the SDK: `npm run build`
- Check that the `dist/` directory exists
- Verify TypeScript is installed: `npm install -g ts-node`

### Express server won't start
- Ensure port 3000 is not already in use
- Check that all dependencies are installed: `npm install`

## Next Steps

After running the examples:

1. Review the code to understand the implementation
2. Integrate the SDK into your own project
3. Customize the Express server example for your needs
4. Set up your webhook endpoint to receive payment notifications
