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
   - [Webhooks Integration](#3-webhooks-integration)
4. [Best Practices](#best-practices)
5. [Common Issues & Fixes](#common-issues--fixes)

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

### 3. Webhooks Integration
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
