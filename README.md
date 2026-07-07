# @ghion-finances/node-sdk

A type-safe Node.js SDK for Ghion Finances payment gateway. Built with TypeScript for maximum reliability and developer experience.

## Features

- **Type-Safe**: Full TypeScript support with comprehensive type definitions
- **Secure**: HMAC-SHA256 authentication with timing-safe signature verification
- **Robust**: Comprehensive error handling with custom error classes
- **Validated**: Built-in input validation for all API requests
- **Express-Ready**: Seamless integration with Express.js middleware
- **Webhook Support**: Secure webhook signature verification and parsing
- **Modern**: Built with modern Node.js (18+) and TypeScript best practices

## Installation

```bash
npm install @ghion-finances/node-sdk
```

## Quick Start

```typescript
import { GhionClient } from '@ghion-finances/node-sdk';

const client = new GhionClient({
  apiKey: process.env.GHION_API_KEY,
  apiSecret: process.env.GHION_API_SECRET,
  passphrase: process.env.GHION_API_PASSPHRASE,
  mode: 'test', // Use 'live' for production
});

// Initialize a payment
const payment = await client.initializePayment({
  amount: 100,
  currency: 'ETB',
  reference: 'order_12345',
  description: 'Test payment',
  webhookUrl: 'https://your-domain.com/webhook',
});

console.log('Payment initialized:', payment.id);
```

## Configuration

### Environment Variables

Create a `.env` file in your project root:

```env
GHION_API_KEY=your_api_key_here
GHION_API_SECRET=your_api_secret_here
GHION_API_PASSPHRASE=your_passphrase_here
```

### Client Configuration

```typescript
const client = new GhionClient({
  apiKey: 'your-api-key',
  apiSecret: 'your-api-secret',
  passphrase: 'your-passphrase',
  baseUrl: 'https://ghion.financial/api/v1', // Optional, defaults to production
  timeout: 30000, // Optional, request timeout in ms
  mode: 'test', // 'test' or 'live'
});
```

## API Reference

### Initialize Payment

Create a new payment session and get available payment channels.

```typescript
const payment = await client.initializePayment({
  amount: 100, // Required: Payment amount
  currency: 'ETB', // Optional: Currency code (default: ETB)
  reference: 'order_12345', // Required: Your unique reference
  description: 'Payment description', // Optional: Payment description
  webhookUrl: 'https://your-domain.com/webhook', // Optional: Webhook URL
  returnUrl: 'https://your-domain.com/success', // Optional: Return URL
  cancelUrl: 'https://your-domain.com/cancel', // Optional: Cancel URL
  metadata: { // Optional: Additional metadata
    orderId: '12345',
    customerId: '67890',
  },
});
```

**Response:**
```typescript
{
  id: string;
  amount: number;
  currency: string;
  reference: string;
  description: string;
  status: string;
  channels: PaymentChannel[];
  expires_at: string;
  created_at: string;
}
```

### Submit Payment

Submit a payment with the chosen channel and customer details.

```typescript
const result = await client.submitPayment(paymentId, {
  channel: 'telebirr', // Required: Channel ID from initialize response
  phoneNumber: '+251911234567', // Optional: Customer phone number
  accountNumber: '1234567890', // Optional: Customer account number
  customerName: 'John Doe', // Optional: Customer name
  customerEmail: 'john@example.com', // Optional: Customer email
});
```

**Response:**
```typescript
{
  id: string;
  status: string;
  transaction_id?: string;
  message: string;
  redirect_url?: string;
}
```

### Get Payment Status

Check the current status of a payment.

```typescript
const status = await client.getPaymentStatus(paymentId);
```

**Response:**
```typescript
{
  id: string;
  amount: number;
  currency: string;
  reference: string;
  description: string;
  status: PaymentStatus;
  channel?: string;
  transaction_id?: string;
  customer?: {
    phone_number?: string;
    account_number?: string;
    name?: string;
    email?: string;
  };
  created_at: string;
  updated_at: string;
  completed_at?: string;
  failed_at?: string;
  failure_reason?: string;
}
```

### Payment Status Enum

```typescript
enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
}
```

## Webhook Handling

### Verify Webhook Signature

```typescript
import express from 'express';

app.post('/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  const signature = req.headers['x-ghion-signature'] as string;
  
  if (!signature) {
    return res.status(400).json({ error: 'Missing signature' });
  }

  // Verify signature
  const isValid = client.verifyWebhook(req.body, signature);
  
  if (!isValid) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  // Process webhook...
  res.json({ received: true });
});
```

### Parse Webhook Event

```typescript
app.post('/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  const signature = req.headers['x-ghion-signature'] as string;

  try {
    const event = client.parseWebhook(req.body, signature);
    
    console.log('Webhook event:', event.event);
    console.log('Payment ID:', event.data.payment_id);
    console.log('Status:', event.data.status);
    
    // Handle different event types
    switch (event.event) {
      case WebhookEventType.PAYMENT_COMPLETED:
        // Payment completed successfully
        break;
      case WebhookEventType.PAYMENT_FAILED:
        // Payment failed
        break;
      // ... handle other events
    }
    
    res.json({ received: true });
  } catch (error) {
    res.status(401).json({ error: 'Invalid signature' });
  }
});
```

### Webhook Event Types

```typescript
enum WebhookEventType {
  PAYMENT_COMPLETED = 'payment.completed',
  PAYMENT_FAILED = 'payment.failed',
  PAYMENT_CANCELLED = 'payment.cancelled',
  PAYMENT_EXPIRED = 'payment.expired',
}
```

## Express.js Integration

Complete example with Express.js:

```typescript
import express, { Request, Response } from 'express';
import { GhionClient, WebhookEventType } from '@ghion-finances/node-sdk';

const client = new GhionClient({
  apiKey: process.env.GHION_API_KEY,
  apiSecret: process.env.GHION_API_SECRET,
  passphrase: process.env.GHION_API_PASSPHRASE,
  mode: 'test',
});

const app = express();
app.use(express.json());

// Initialize payment
app.post('/api/payments/initialize', async (req: Request, res: Response) => {
  try {
    const payment = await client.initializePayment({
      amount: req.body.amount,
      currency: req.body.currency || 'ETB',
      reference: `order_${Date.now()}`,
      webhookUrl: `${req.protocol}://${req.get('host')}/webhook`,
    });
    res.json({ success: true, data: payment });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Webhook handler
app.post('/webhook', express.raw({ type: 'application/json' }), (req: Request, res: Response) => {
  const signature = req.headers['x-ghion-signature'] as string;
  
  try {
    const event = client.parseWebhook(req.body, signature);
    console.log('Webhook received:', event.event);
    res.json({ received: true });
  } catch (error) {
    res.status(401).json({ error: 'Invalid signature' });
  }
});

app.listen(3000);
```

## Error Handling

The SDK provides custom error classes for different error scenarios:

```typescript
import {
  GhionError,
  AuthenticationError,
  ApiError,
  ValidationError,
  NetworkError,
  PaymentError,
  WebhookError,
  RateLimitError,
} from '@ghion-finances/node-sdk';

try {
  await client.initializePayment({ amount: 100, reference: 'test' });
} catch (error) {
  if (error instanceof ValidationError) {
    console.error('Validation error:', error.message);
  } else if (error instanceof AuthenticationError) {
    console.error('Authentication failed:', error.message);
  } else if (error instanceof ApiError) {
    console.error('API error:', error.message, error.statusCode);
  } else if (error instanceof NetworkError) {
    console.error('Network error:', error.message);
  } else if (error instanceof RateLimitError) {
    console.error('Rate limit exceeded, retry after:', error.retryAfter);
  } else {
    console.error('Unknown error:', error);
  }
}
```

## Testing the SDK

### Unit Tests (No Credentials Required)

Run the unit tests to verify the SDK builds correctly:

```bash
npm test
```

These tests verify:
- SDK imports and exports
- Client instantiation and configuration
- Webhook signature generation and verification
- Input validation

### Integration Tests (Credentials Required)

Test with real API calls using your credentials:

```bash
# 1. Copy environment variables template
cp examples/.env.example examples/.env

# 2. Edit examples/.env with your credentials from https://ghion.financial

# 3. Run the integration tests
npm test -- tests/integration.test.ts
```

These tests verify:
- Payment initialization with real API
- Payment status retrieval
- Webhook signature verification with real credentials

### Examples

See the `examples/` directory for complete working examples:

- `quick-start.ts` - Basic SDK usage without Express
- `express-server.ts` - Complete Express.js integration with webhooks

For detailed information about each example, see [examples/README.md](examples/README.md)

Run examples:

```bash
# Quick start example
npx ts-node examples/quick-start.ts

# Express server example
npx ts-node examples/express-server.ts
```

## Development

### Build

```bash
npm run build
```

### Watch Mode

```bash
npm run dev
```

### Lint

```bash
npm run lint
npm run lint:fix
```

### Format

```bash
npm run format
```

### Test

```bash
npm test
npm run test:watch
```

## Security

- **HMAC-SHA256 Authentication**: All API requests are signed using HMAC-SHA256
- **Timing-Safe Comparison**: Webhook signatures use timing-safe comparison to prevent timing attacks
- **Input Validation**: All inputs are validated before sending to the API
- **Secure Defaults**: Timeout protection and secure defaults out of the box

## Authentication

The SDK uses HMAC-SHA256 request signing for authentication:

```
signature = base64( hmac_sha256( timestamp + METHOD + path + body, api_secret ) )
```

Headers sent with every API request:

| Header | Value |
|--------|-------|
| `X-Ghion-Key` | Your API key |
| `X-Ghion-Timestamp` | Unix timestamp (seconds) |
| `X-Ghion-Signature` | HMAC-SHA256 signature |
| `X-Ghion-Passphrase` | Your API passphrase |

**Important**: The timestamp must be within **30 seconds** of the server time. Ensure your system clock is synchronized via NTP.

## Requirements

- Node.js >= 18.0.0
- TypeScript >= 4.0.0 (for development)

## License

MIT License - see LICENSE file for details

## Support

For issues, questions, or contributions, please visit the [Ghion Finances](https://ghion.financial) website or contact support.

## Contributing

Contributions are welcome! Please ensure:

1. Code adheres to existing style (ESLint + Prettier)
2. All tests pass
3. TypeScript types are properly defined
4. Documentation is updated

## Changelog

### 1.0.0 (2026-07-07)

- Initial release
- Full TypeScript support
- HMAC-SHA256 authentication
- Webhook signature verification
- Comprehensive error handling
- Input validation
- Express.js integration examples
