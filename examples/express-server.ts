/**
 * Express.js integration example for @ghion-finances/node-sdk
 * 
 * This example demonstrates how to integrate the SDK with Express.js
 * to create a complete payment flow with webhook handling.
 * 
 * Run with: npx ts-node examples/express-integration.ts
 */

import * as dotenv from 'dotenv';
import * as crypto from 'crypto';
import express, { Request, Response } from 'express';
import { GhionClient, WebhookEventType } from '../src';

// Load environment variables from examples directory
dotenv.config({ path: require('path').join(__dirname, '.env') });

// Initialize the SDK client
const client = new GhionClient({
  apiKey: process.env.GHION_API_KEY || 'your-api-key',
  apiSecret: process.env.GHION_API_SECRET || 'your-api-secret',
  passphrase: process.env.GHION_API_PASSPHRASE || 'your-passphrase',
});

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware - JSON parsing for specific routes only
app.use('/api', express.json());

// Test webhook signature generator (for testing purposes)
app.get('/test/webhook-signature', (_req: Request, res: Response) => {
  const testBody = '{"event":"payment.completed","data":{"payment_id":"019f3c14-8798-7e95-be0d-46e58b8fc4b7","transaction_id":"txn_1234567890","amount":100,"currency":"ETB","status":"completed"}}';
  const secret = process.env.GHION_API_SECRET || 'your-api-secret';
  const signature = crypto.createHmac('sha256', secret).update(testBody).digest('base64');
  
  res.json({
    signature,
    body: testBody,
    powershellCommand: `Invoke-WebRequest -Uri "http://localhost:${PORT}/webhook" -Method POST -Headers @{ "Content-Type" = "application/json"; "X-Ghion-Signature" = "${signature}" } -Body '${testBody}' | Select-Object -ExpandProperty Content | ConvertFrom-Json | ConvertTo-Json -Depth 10`
  });
});

// Initialize payment
app.post('/api/payments/initialize', async (req: Request, res: Response) => {
  try {
    const { amount, currency, description } = req.body;

    const payment = await client.initializePayment({
      amount: amount || 100,
      currency: currency || 'ETB',
      reference: `order_${Date.now()}`,
      description: description || 'Payment',
      webhookUrl: `${req.protocol}://${req.get('host')}/webhook`,
    });

    res.json({
      success: true,
      data: payment,
    });
  } catch (error: any) {
    console.error('Initialize payment error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to initialize payment',
    });
  }
});

// Submit payment
app.post('/api/payments/:paymentId/submit', async (req: Request, res: Response) => {
  try {
    const { paymentId } = req.params;
    const { channel, phoneNumber, accountNumber } = req.body;

    const result = await client.submitPayment(Array.isArray(paymentId) ? paymentId[0] : paymentId, {
      channel,
      phoneNumber,
      accountNumber,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('Submit payment error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to submit payment',
    });
  }
});

// Get payment status
app.get('/api/payments/:paymentId/status', async (req: Request, res: Response) => {
  try {
    const { paymentId } = req.params;
    const status = await client.getPaymentStatus(Array.isArray(paymentId) ? paymentId[0] : paymentId);

    res.json({
      success: true,
      data: status,
    });
  } catch (error: any) {
    console.error('Get payment status error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get payment status',
    });
  }
});

// Webhook handler - IMPORTANT: Use raw body for signature verification
app.post('/webhook', express.raw({ type: 'application/json' }), (req: Request, res: Response): void => {
  const signature = req.headers['x-ghion-signature'] as string;

  if (!signature) {
    console.error('Webhook error: Missing signature');
    res.status(400).json({ error: 'Missing signature' });
    return;
  }

  try {
    // Verify signature and parse webhook
    const event = client.parseWebhook(req.body, signature);

    console.log('Webhook received:', {
      event: event.event,
      paymentId: event.data.payment_id,
      transactionId: event.data.transaction_id,
      amount: event.data.amount,
      currency: event.data.currency,
      status: event.data.status,
    });

    // Handle different webhook events
    switch (event.event) {
      case WebhookEventType.PAYMENT_COMPLETED:
        console.log('Payment completed!');
        // Update your database, send confirmation email, etc.
        break;

      case WebhookEventType.PAYMENT_FAILED:
        console.log('Payment failed');
        // Handle failed payment
        break;

      case WebhookEventType.PAYMENT_CANCELLED:
        console.log('Payment cancelled');
        // Handle cancelled payment
        break;

      case WebhookEventType.PAYMENT_EXPIRED:
        console.log('Payment expired');
        // Handle expired payment
        break;

      default:
        console.log('Unknown webhook event:', event.event);
    }

    // Always return 200 to acknowledge receipt
    res.json({ received: true });
  } catch (error: any) {
    console.error('Webhook processing error:', error);
    res.status(401).json({ error: 'Invalid signature or processing error' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Express server running at http://localhost:${PORT}`);
  console.log(`Webhook endpoint: http://localhost:${PORT}/webhook`);
  console.log('\nAvailable endpoints:');
  console.log(`  GET  /test/webhook-signature (generates test webhook signature)`);
  console.log(`  POST /api/payments/initialize`);
  console.log(`  POST /api/payments/:paymentId/submit`);
  console.log(`  GET  /api/payments/:paymentId/status`);
  console.log(`  POST /webhook`);
});
