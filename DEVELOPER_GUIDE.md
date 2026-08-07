# Ghion Finances Node SDK - Developer Guide

Welcome to the official developer guide for the `@ghion-finances/node-sdk`. This document provides comprehensive instructions on setting up, implementing, and troubleshooting the SDK in your Node.js applications.

## Table of Contents
1. [Installation & Setup](#installation--setup)
2. [Core Concepts](#core-concepts)
3. [Implementation Guide](#implementation-guide)
   - [Initializing a Payment](#1-initializing-a-payment)
   - [Handling Payment Methods](#2-handling-payment-methods)
     - [OTP Flow (YaYa Wallet)](#otp-flow-yaya-wallet)
     - [USSD Flow](#ussd-flow)
     - [QR Code Flow](#qr-code-flow)
   - [Bill Payment Integration](#4-bill-payment-integration)
     - [Creating Bills](#creating-bills)
     - [Bulk Bill Creation](#bulk-bill-creation)
     - [Listing and Managing Bills](#listing-and-managing-bills)
     - [Bill Analytics](#bill-analytics)
   - [Webhooks Integration](#3-webhooks-integration)
4. [Error Handling](#error-handling)
5. [Best Practices](#best-practices)
6. [Common Issues & Fixes](#common-issues--fixes)

---

## Installation & Setup

### 1. Install the SDK
Install the package via npm or yarn:

```bash
npm install @ghion-finances/node-sdk
# or
yarn add @ghion-finances/node-sdk
```

### 2. Environment Variables
You will need your API credentials from the Ghion Developer Dashboard. Securely store them in your `.env` file:

```env
GHION_API_KEY=your_api_key_here
GHION_API_SECRET=your_api_secret_here
GHION_API_PASSPHRASE=your_passphrase_here
WEBHOOK_URL=https://your-domain.com/webhook
```

### 3. Initialize the Client
Import and initialize the `GhionClient` in your application:

```javascript
const { GhionClient, WebhookEventType } = require('@ghion-finances/node-sdk');

const client = new GhionClient({
  apiKey: process.env.GHION_API_KEY,
  apiSecret: process.env.GHION_API_SECRET,
  passphrase: process.env.GHION_API_PASSPHRASE,
});
```

---

## Core Concepts

The SDK revolves around a few key resources:
- **Payment Session:** Created when a user initiates a checkout. Represents the transaction lifecycle.
- **Channels:** Different payment methods available (e.g., YaYa Wallet, Card, Telebirr).
- **Webhooks:** The primary, asynchronous mechanism for receiving definitive payment statuses (Success, Failure, Expiry).

---

## Implementation Guide

### 1. Initializing a Payment
When a user clicks "Checkout", you must create a payment session. This returns the available channels, provider information, and a unique `paymentId`.

```javascript
app.post('/api/payments/initialize', async (req, res) => {
  try {
    const payment = await client.initializePayment({
      amount: req.body.amount,
      currency: 'ETB', // Default is ETB
      reference: `order_${Date.now()}`, // Your internal unique order ID
      description: 'Purchase of premium coffee',
      webhookUrl: process.env.WEBHOOK_URL,
      returnUrl: 'https://your-domain.com/success',
      cancelUrl: 'https://your-domain.com/cancel',
    });

    // Optionally fetch full checkout details (for QR codes, specific provider rules, etc.)
    const checkoutInfo = await client.getCheckout(payment.id);

    res.json({ success: true, paymentId: payment.id, channels: checkoutInfo.available_channels });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### 2. Handling Payment Methods

#### OTP Flow (YaYa Wallet)
The OTP flow requires sending an OTP to the user's phone, then validating it.

**Step A: Send OTP**
```javascript
const otpResponse = await client.sendOTP(paymentId, phoneNumber);
// Display an input field to the user to enter the 6-digit OTP
```

**Step B: Validate OTP**
```javascript
const validateResponse = await client.validateOTP(paymentId, otpCode, phoneNumber);
if (validateResponse.status === 'completed') {
    // Payment is successful
}
```

#### USSD Flow
For wallets supporting direct push prompts (USSD):

```javascript
const result = await client.submitPayment(paymentId, {
  channel: 'yayawallet', // or 'telebirr', etc.
  phoneNumber: '0912345678',
  customerName: 'Abebe Kebede'
});
// User will receive a prompt on their phone to enter their PIN.
```

#### QR Code Flow
To display a QR code for the user to scan with their banking app:

```javascript
const qrPayment = await client.payWithQR(paymentId);
// qrPayment.qr_image_url contains the URL to the generated QR code image
```

### 4. Bill Payment Integration

The SDK provides complete support for the Bill Payment API, allowing you to create, manage, and analyze bills programmatically. This is useful for utilities, rent collection, tuition fees, memberships, and any recurring billing scenarios.

#### Creating Bills

Create a single bill with customer information, due dates, and optional penalty configuration.

```javascript
const { BillStatus } = require('@ghion-finances/node-sdk');

app.post('/api/bills/create', async (req, res) => {
  try {
    const bill = await client.createBill({
      bill_id: `INV-${Date.now()}`, // Your unique bill identifier (max 100 chars)
      amount: 500.00,
      currency: 'ETB',
      due_date: '2026-09-01', // Due date in Y-m-d format
      start_date: '2026-08-01', // Optional: Start date
      expires_date: '2026-12-31', // Optional: Expiry date
      customer_name: 'Abebe Bekele',
      customer_phone: '+251911234567', // International format required
      customer_email: 'abebe@example.com',
      customer_id: 'ID-12345', // Your internal customer ID
      description: 'Monthly utility bill for August 2026',
      bill_code: 'UTIL', // Category code for filtering/routing
      cluster: 'Addis Ababa', // Geographic/organizational cluster
      penalty: {
        type: 'fixed', // 'fixed' or 'percentage'
        fee: 50.00,
        max_amount: 500.00,
        recurring: 'monthly', // 'daily', 'weekly', 'monthly', or 'once'
      },
      metadata: {
        account_number: 'ACC-999',
        service_period: '2026-08',
      },
    });

    res.json({ success: true, bill });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

**Important Notes:**
- `bill_id` must be unique per merchant (max 100 characters)
- `customer_phone` must be in international format (e.g., +251911234567) for YaYa Wallet mini-app matching
- Dates must be in Y-m-d format (YYYY-MM-DD)
- The response includes a `share_token` for building payment links

#### Bulk Bill Creation

For monthly billing cycles or batch operations, create multiple bills in a single request.

```javascript
app.post('/api/bills/bulk', async (req, res) => {
  try {
    const bulkResult = await client.createBulkBills({
      bills: [
        {
          bill_id: 'INV-2026-001',
          amount: 500.00,
          due_date: '2026-09-01',
          customer_name: 'Abebe Bekele',
          customer_phone: '+251911234567',
          description: 'Utility bill for August 2026',
          bill_code: 'UTIL',
        },
        {
          bill_id: 'INV-2026-002',
          amount: 1200.00,
          due_date: '2026-09-01',
          customer_name: 'Sara Ahmed',
          customer_phone: '+251912345678',
          description: 'Utility bill for August 2026',
          bill_code: 'UTIL',
        },
      ],
    });

    res.json({
      success: true,
      created: bulkResult.created_count,
      errors: bulkResult.error_count,
      bills: bulkResult.created,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

#### Listing and Managing Bills

List bills with filters and pagination to manage your bill portfolio.

```javascript
app.get('/api/bills', async (req, res) => {
  try {
    const { status, search, cluster, bill_code, from, to, page = 1, limit = 10 } = req.query;

    const bills = await client.listBills({
      status: status, // BillStatus enum: 'pending', 'paid', 'forwarded', 'cancelled', 'expired', 'overdue'
      search, // Search by customer name, phone, or bill_id
      cluster, // Filter by cluster
      bill_code, // Filter by bill code
      from, // Start date (Y-m-d format)
      to, // End date (Y-m-d format)
      page: Number(page),
      limit: Number(limit),
    });

    res.json({
      success: true,
      total: bills.total,
      page: bills.page,
      items: bills.items,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

#### Bill Analytics

Get statistics and dashboard analytics to track bill performance.

```javascript
app.get('/api/bills/statistics', async (req, res) => {
  try {
    const stats = await client.getBillStatistics();

    res.json({
      success: true,
      pending: stats.pending,
      paid: stats.paid,
      forwarded: stats.forwarded,
      overdue: stats.overdue,
      total_amount: stats.total_amount,
      total_paid: stats.total_paid,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/bills/dashboard', async (req, res) => {
  try {
    const dashboard = await client.getBillDashboard(
      req.query.from, // Optional: Start date (Y-m-d)
      req.query.to // Optional: End date (Y-m-d)
    );

    res.json({
      success: true,
      summary: dashboard.summary,
      trend: dashboard.trend,
      by_cluster: dashboard.by_cluster,
      by_bill_code: dashboard.by_bill_code,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

#### Bill Detail and Updates

Get detailed bill information and update bill properties.

```javascript
app.get('/api/bills/:id', async (req, res) => {
  try {
    const bill = await client.getBillDetail(req.params.id);

    res.json({ success: true, bill });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/bills/:id', async (req, res) => {
  try {
    const updated = await client.updateBill(req.params.id, {
      amount: req.body.amount,
      due_date: req.body.due_date,
      description: req.body.description,
      customer_name: req.body.customer_name,
      // Only provided fields are updated
    });

    res.json({ success: true, bill: updated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

#### Deleting Bills

Delete bills that have no payments (for cleanup or error correction).

```javascript
app.delete('/api/bills/:id', async (req, res) => {
  try {
    const result = await client.deleteBill(req.params.id);

    res.json({ success: true, message: result.message });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

**Note:** Only bills with no payments can be deleted. If a bill has payments, the API will return an error.

#### Manual Payment Recording

Record manual payments (cash, bank transfer, etc.) for reconciliation purposes. This does not process actual payments - it only updates bill balance and status.

```javascript
app.post('/api/bills/:id/payments/manual', async (req, res) => {
  try {
    const payment = await client.recordManualPayment(req.params.id, {
      amount: req.body.amount,
      source: req.body.source || 'manual', // 'manual', 'bank_transfer', 'cash', 'yaya_wallet', 'checkout'
      payment_method: req.body.payment_method || 'cash',
      reference: req.body.reference, // Receipt number or reference
      note: req.body.note,
    });

    res.json({
      success: true,
      payment_id: payment.payment_id,
      bill_status: payment.bill_status,
      balance_due: payment.balance_due,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

#### Biller Settings

Configure your biller settings including biller code, clusters, bill codes, and webhook configuration.

```javascript
app.get('/api/biller-settings', async (req, res) => {
  try {
    const settings = await client.getBillerSettings();

    res.json({ success: true, settings });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/biller-settings', async (req, res) => {
  try {
    const updated = await client.updateBillerSettings({
      biller_name: req.body.biller_name,
      biller_category: req.body.biller_category,
      biller_description: req.body.biller_description,
      icon_url: req.body.icon_url,
      service_charge_rate: req.body.service_charge_rate,
      service_charge_type: req.body.service_charge_type,
      clusters: req.body.clusters,
      bill_codes: req.body.bill_codes,
      webhook_url: req.body.webhook_url,
      webhook_secret: req.body.webhook_secret,
      settlement_bank_code: req.body.settlement_bank_code,
      settlement_account_number: req.body.settlement_account_number,
      settlement_account_name: req.body.settlement_account_name,
    });

    res.json({ success: true, settings: updated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

**Important:** The `biller_code` from settings is required for public bill lookup functionality.

#### Payment Links

Generate payment links for bills to share with customers via email, SMS, or other channels.

```javascript
app.get('/api/bills/:id/payment-link', async (req, res) => {
  try {
    const link = await client.getBillPaymentLink(req.params.id);

    res.json({
      success: true,
      checkout_url: link.checkout_url,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

#### Public Bill Lookup

Enable bank branches and mobile banking apps to look up bills without authentication (requires configured biller settings).

```javascript
app.get('/api/public/bill/:billerCode/:billId', async (req, res) => {
  try {
    const bill = await client.publicBillLookup({
      biller_code: req.params.billerCode,
      bill_id: req.params.billId,
    });

    res.json({ success: true, bill });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

**Note:** This endpoint does not require authentication and is designed for public integration with third-party banking systems.

### 4. Error Handling

The SDK provides custom error classes for different error scenarios. All errors extend the base `GhionError` class.

#### Error Types

```javascript
const {
  GhionError,
  ConfigurationError,
  AuthenticationError,
  ApiError,
  ValidationError,
  NetworkError,
  PaymentError,
  BillError,
  WebhookError,
  RateLimitError,
} = require('@ghion-finances/node-sdk');
```

#### Error Classes

- **GhionError**: Base error class for all SDK errors
- **ConfigurationError**: Invalid SDK configuration
- **AuthenticationError**: Invalid credentials or signature
- **ApiError**: Failed HTTP request with status code and response
- **ValidationError**: Invalid input parameters with field and value details
- **NetworkError**: Connection or timeout issues
- **PaymentError**: Payment processing failures with payment ID
- **BillError**: Bill processing failures with bill ID
- **WebhookError**: Webhook signature verification or processing failures
- **RateLimitError**: API rate limit exceeded with retry-after seconds

#### Example Error Handling

```javascript
try {
  const payment = await client.initializePayment({
    amount: 100,
    reference: 'order_12345',
  });
} catch (error) {
  if (error instanceof ValidationError) {
    console.error('Validation failed:', error.message);
    console.error('Field:', error.details?.field);
    console.error('Value:', error.details?.value);
  } else if (error instanceof ApiError) {
    console.error('API error:', error.message);
    console.error('Status code:', error.statusCode);
    console.error('Response:', error.response);
  } else if (error instanceof PaymentError) {
    console.error('Payment error:', error.message);
    console.error('Payment ID:', error.paymentId);
  } else if (error instanceof BillError) {
    console.error('Bill error:', error.message);
    console.error('Bill ID:', error.billId);
  } else {
    console.error('Unknown error:', error);
  }
}
```

#### Error Properties

All error classes have the following properties:
- `message`: Error description
- `code`: Error code (e.g., 'VALIDATION_ERROR', 'API_ERROR')
- `details`: Additional error details (optional)
- `name`: Error class name

Additional properties per error type:
- `ApiError`: `statusCode`, `response`
- `PaymentError`: `paymentId`
- `BillError`: `billId`
- `RateLimitError`: `retryAfter`

#### Common Error Scenarios

**Configuration Error:**
```javascript
// Invalid API key format
const client = new GhionClient({
  apiKey: 'invalid-key',
  apiSecret: 'valid-secret',
  passphrase: 'valid-passphrase',
});
// Throws: ConfigurationError
```

**Authentication Error:**
```javascript
// Invalid credentials
const payment = await client.initializePayment({...});
// Throws: AuthenticationError if credentials are invalid
```

**Validation Error:**
```javascript
// Missing required field
const payment = await client.initializePayment({
  amount: 100,
  // Missing reference field
});
// Throws: ValidationError with field='reference'
```

**API Error:**
```javascript
// Server error (500, 502, etc.)
const payment = await client.initializePayment({...});
// Throws: ApiError with statusCode and response
```

**Rate Limit Error:**
```javascript
// Too many requests
const payment = await client.initializePayment({...});
// Throws: RateLimitError with retryAfter seconds
```

### 5. Webhooks Integration
Webhooks are **mandatory** for robust payment verification. Users might close the browser while a payment is processing, so your server must rely on webhooks to fulfill orders.

**Important:** Webhooks must parse the *raw* request body to verify the cryptographic signature.

```javascript
// Note: Use express.raw() to preserve the raw body string for signature verification!
app.post('/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  const signature = req.headers['x-ghion-signature'];
  
  try {
    const event = client.parseWebhook(req.body, signature);
    
    switch (event.event) {
      case WebhookEventType.TRANSACTION_COMPLETED:
        // Fulfill the order! (e.g., mark DB as paid, send email)
        console.log('Payment Success:', event.data.payment_id);
        break;
      case WebhookEventType.TRANSACTION_FAILED:
        // Handle failure
        break;
      // Handle TRANSACTION_CANCELLED, TRANSACTION_EXPIRED...
    }

    res.status(200).send('OK');
  } catch (error) {
    console.error('Invalid signature', error);
    res.status(401).send('Unauthorized');
  }
});
```

---

## Best Practices

1. **Rely on Webhooks, Not Polling:** 
   Always use Webhooks (`/webhook`) or Server-Sent Events (SSE) driven by webhooks to update the frontend. Avoid setting up `setInterval` loops to call `client.getPaymentStatus()`, as excessive polling can trigger rate limits or interfere with active transactions.
2. **Raw Body for Webhooks:** 
   Always parse webhooks using `express.raw({ type: 'application/json' })`. If Express parses the body into a JSON object before the SDK verifies it, the HMAC signature verification will fail.
3. **Idempotency:** 
   Webhook events can theoretically be delivered more than once. Ensure your database fulfillment logic checks if an order is already marked as "paid" before granting the user access to the product again.
4. **Environment Separation:** 
   Keep a strict separation between Test/Sandbox keys and Production keys.

---

## Common Issues & Fixes

### 1. Error: "Transaction is not in a state awaiting OTP validation"
**Symptom:** You call `sendOTP`, wait for the user to input the code, call `validateOTP`, and receive this error.
**Cause:** Calling `client.getPaymentStatus(paymentId)` via a polling interval *while* the OTP is pending. Querying the Ghion API manually during an active OTP session can forcefully reset the transaction state on the gateway's end.
**Fix:** Remove any background status polling (`setInterval`) during the OTP flow. Send the OTP, wait for user input, and immediately validate the OTP. Rely on Webhooks for background state changes.

### 2. Webhook Signature Verification Fails
**Symptom:** `client.parseWebhook()` throws an "Invalid webhook signature" error.
**Cause:** The Express application is using `app.use(express.json())` globally, which transforms the raw incoming string into a JavaScript object. The signature verification requires the exact raw byte string sent by Ghion.
**Fix:** Apply `express.raw()` specifically to the webhook route *before* any global JSON parsers intercept it.
```javascript
// Correct:
app.post('/webhook', express.raw({ type: 'application/json' }), webhookHandler);
```

### 3. "OTP code is required" error during validateOTP
**Symptom:** The SDK throws a validation error or the API rejects the request stating the OTP code is missing, even when provided.
**Cause:** In older versions of the SDK (v1.0.x), there was a payload key mismatch (`otp` instead of `otp_code`).
**Fix:** Update the SDK to the latest version (`npm update @ghion-finances/node-sdk`). The SDK internally maps `otpCode` to the correct `otp_code` payload expected by the API.

### 4. Fetch/Network Errors in Node v16 or older
**Symptom:** `ReferenceError: fetch is not defined`
**Cause:** The SDK utilizes the native `fetch` API, which is fully supported in Node.js v18+.
**Fix:** Upgrade your Node.js environment to v18 LTS or higher. If you must use older Node versions, consider globally polyfilling fetch (e.g., `require('cross-fetch/polyfill')`).
