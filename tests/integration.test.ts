/**
 * Integration tests for Ghion Finances SDK
 * These tests make real API calls and require valid credentials
 * 
 * To run these tests:
 * 1. Copy examples/.env.example to examples/.env
 * 2. Add your API credentials to examples/.env
 * 3. Run: npm test -- tests/integration.test.ts
 */

import { GhionClient } from '../src';
import * as crypto from 'crypto';
import * as dotenv from 'dotenv';

// Load environment variables from examples directory
dotenv.config({ path: require('path').join(__dirname, '../examples/.env') });

describe('GhionClient Integration Tests', () => {
  let client: GhionClient;

  beforeAll(() => {
    const apiKey = process.env.GHION_API_KEY;
    const apiSecret = process.env.GHION_API_SECRET;
    const passphrase = process.env.GHION_API_PASSPHRASE;

    if (!apiKey || !apiSecret || !passphrase) {
      throw new Error(
        'Missing API credentials. Please set GHION_API_KEY, GHION_API_SECRET, and GHION_API_PASSPHRASE in examples/.env'
      );
    }

    client = new GhionClient({
      apiKey,
      apiSecret,
      passphrase,
    });
  });

  describe('Payment Initialization', () => {
    it('should initialize a payment successfully', async () => {
      const response = await client.initializePayment({
        amount: 1,
        currency: 'ETB',
        reference: `test_${Date.now()}`,
        description: 'SDK integration test',
      });

      expect(response).toBeDefined();
      expect(response.id).toBeDefined();
      expect(response.amount).toBe(1);
      expect(response.currency).toBe('ETB');
      expect(response.status).toBeDefined();
    }, 10000);

    it('should return available channels', async () => {
      const response = await client.initializePayment({
        amount: 1,
        currency: 'ETB',
        reference: `test_${Date.now()}`,
        description: 'SDK integration test',
      });

      expect(response.available_channels).toBeDefined();
      expect(Array.isArray(response.available_channels)).toBe(true);
    }, 10000);
  });

  describe('Payment Status', () => {
    let paymentId: string;

    beforeAll(async () => {
      const response = await client.initializePayment({
        amount: 1,
        currency: 'ETB',
        reference: `test_${Date.now()}`,
        description: 'SDK integration test',
      });
      paymentId = response.id;
    }, 10000);

    it('should retrieve payment status', async () => {
      const status = await client.getPaymentStatus(paymentId);

      expect(status).toBeDefined();
      expect(status.id).toBe(paymentId);
      expect(status.amount).toBe(1);
      expect(status.currency).toBe('ETB');
      expect(status.status).toBeDefined();
    }, 10000);
  });

  describe('Webhook Signature Verification', () => {
    it('should verify webhook signature with real credentials', () => {
      const payload = JSON.stringify({
        event: 'payment.completed',
        data: { payment_id: 'test-id', amount: 100, currency: 'ETB' },
      });

      const apiSecret = process.env.GHION_API_SECRET!;
      const signature = crypto.createHmac('sha256', apiSecret).update(payload).digest('base64');

      const isValid = client.verifyWebhook(payload, signature);
      expect(isValid).toBe(true);
    });

    it('should reject invalid webhook signature', () => {
      const payload = JSON.stringify({
        event: 'payment.completed',
        data: { payment_id: 'test-id', amount: 100, currency: 'ETB' },
      });

      const isValid = client.verifyWebhook(payload, 'invalid-signature');
      expect(isValid).toBe(false);
    });

    it('should parse webhook with valid signature', () => {
      const payload = JSON.stringify({
        event: 'payment.completed',
        data: { payment_id: 'test-id', amount: 100, currency: 'ETB' },
      });

      const apiSecret = process.env.GHION_API_SECRET!;
      const signature = crypto.createHmac('sha256', apiSecret).update(payload).digest('base64');

      const event = client.parseWebhook(payload, signature);
      expect(event.event).toBe('payment.completed');
      expect(event.data.payment_id).toBe('test-id');
    });
  });
});
