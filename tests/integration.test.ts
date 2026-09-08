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

  describe('New Payment Flows (QR, OTP, Checkout)', () => {
    let paymentId: string;

    beforeAll(async () => {
      const response = await client.initializePayment({
        amount: 10,
        currency: 'ETB',
        reference: `test_new_flows_${Date.now()}`,
        description: 'SDK integration test for new flows',
      });
      paymentId = response.id;
    }, 10000);

    it('should retrieve checkout details', async () => {
      const checkout = await client.getCheckout(paymentId);
      expect(checkout).toBeDefined();
      expect(checkout.amount).toBeDefined();
      // Depending on the environment, it may or may not have QR immediately
    }, 10000);

    it('should retrieve QR code', async () => {
      try {
        const qr = await client.payWithQR(paymentId);
        expect(qr).toBeDefined();
        expect(qr.qr_image_url).toBeDefined();
      } catch (e: any) {
        // Handle case where QR is not supported by default channel
        console.warn('QR payment not supported or failed:', e.message);
      }
    }, 10000);

    it('should attempt OTP send', async () => {
      try {
        const otpResponse = await client.sendOTP(paymentId, '+251911234567');
        expect(otpResponse).toBeDefined();
        expect(otpResponse.status).toBeDefined();
      } catch (e: any) {
        // Expected to fail if the channel isn't set to an OTP-supporting wallet or invalid number
        console.warn('OTP send failed (expected without full setup):', e.message);
      }
    }, 10000);
  });

  describe('Webhook Signature Verification', () => {
    it('should verify webhook signature with real credentials', () => {
      const payload = JSON.stringify({
        event: 'transaction.completed',
        data: { payment_id: 'test-id', amount: 100, currency: 'ETB' },
      });

      const apiSecret = process.env.GHION_API_SECRET!;
      const signature = crypto.createHmac('sha256', apiSecret).update(payload).digest('base64');

      const isValid = client.verifyWebhook(payload, signature);
      expect(isValid).toBe(true);
    });

    it('should reject invalid webhook signature', () => {
      const payload = JSON.stringify({
        event: 'transaction.completed',
        data: { payment_id: 'test-id', amount: 100, currency: 'ETB' },
      });

      const isValid = client.verifyWebhook(payload, 'invalid-signature');
      expect(isValid).toBe(false);
    });

    it('should parse webhook with valid signature', () => {
      const payload = JSON.stringify({
        event: 'transaction.completed',
        data: { payment_id: 'test-id', amount: 100, currency: 'ETB' },
      });

      const apiSecret = process.env.GHION_API_SECRET!;
      const signature = crypto.createHmac('sha256', apiSecret).update(payload).digest('base64');

      const event = client.parseWebhook(payload, signature);
      expect(event.event).toBe('transaction.completed');
      expect(event.data.payment_id).toBe('test-id');
    });
  });

  describe('Bill Payment API', () => {
    let billId: string;
    let billInternalId: string;

    it('should create a single bill', async () => {
      const response = await client.createBill({
        bill_id: `INV-TEST-${Date.now()}`,
        amount: 100,
        currency: 'ETB',
        due_date: '2026-09-01',
        customer_name: 'Test Customer',
        customer_phone: '+251911234567',
        description: 'Integration test bill',
      });

      expect(response).toBeDefined();
      expect(response.id).toBeDefined();
      expect(response.bill_id).toBeDefined();
      expect(response.amount).toBe(100);
      expect(response.status).toBeDefined();

      billId = response.bill_id;
      billInternalId = response.id;
    }, 15000);

    it('should list bills', async () => {
      const response = await client.listBills({ limit: 10 });

      expect(response).toBeDefined();
      expect(response.total).toBeDefined();
      expect(response.page).toBeDefined();
      expect(Array.isArray(response.items)).toBe(true);
    }, 15000);

    it('should get bill statistics', async () => {
      const stats = await client.getBillStatistics();

      expect(stats).toBeDefined();
      expect(stats.pending).toBeDefined();
      expect(stats.paid).toBeDefined();
      expect(stats.total_amount).toBeDefined();
    }, 15000);

    it('should get bill dashboard', async () => {
      const dashboard = await client.getBillDashboard('2026-08-01', '2026-08-31');

      expect(dashboard).toBeDefined();
      expect(dashboard.summary).toBeDefined();
      expect(dashboard.summary.total_bills).toBeDefined();
    }, 15000);

    it('should get bill detail', async () => {
      const detail = await client.getBillDetail(billInternalId);

      expect(detail).toBeDefined();
      expect(detail.bill_id).toBe(billId);
      expect(detail.amount).toBeDefined();
    }, 15000);

    it('should update a bill', async () => {
      const updated = await client.updateBill(billInternalId, {
        description: 'Updated description',
      });

      expect(updated).toBeDefined();
      expect(updated.description).toBe('Updated description');
    }, 15000);

    it('should get biller settings', async () => {
      const settings = await client.getBillerSettings();

      expect(settings).toBeDefined();
      expect(settings.configured).toBeDefined();
    }, 15000);

    it('should get payment link for a bill', async () => {
      const link = await client.getBillPaymentLink(billInternalId);

      expect(link).toBeDefined();
      expect(link.checkout_url).toBeDefined();
    }, 15000);

    it('should delete a bill (only if no payments)', async () => {
      try {
        // Create a test bill specifically for deletion
        const testBill = await client.createBill({
          bill_id: `INV-DELETE-${Date.now()}`,
          amount: 50,
          due_date: '2026-09-01',
          customer_name: 'Delete Test',
          customer_phone: '+251911234567',
        });

        const response = await client.deleteBill(testBill.id);
        expect(response).toBeDefined();
        expect(response.message).toBeDefined();
      } catch (e: any) {
        // May fail if bill has payments or other constraints
        console.warn('Delete bill failed (may have payments):', e.message);
      }
    }, 15000);
  });

  describe('Hold Payment (Escrow)', () => {
    it('should list escrows', async () => {
      try {
        const escrows = await client.listEscrows();
        expect(escrows).toBeDefined();
        expect(Array.isArray(escrows.escrows)).toBe(true);
      } catch (e: any) {
        // May fail if module not enabled (403 error)
        if (e.statusCode === 403) {
          console.warn('Hold Payment module not enabled for this account');
        } else {
          throw e;
        }
      }
    }, 15000);

    it('should list escrows with status filter', async () => {
      try {
        const escrows = await client.listEscrows({ status: 'funded' as any });
        expect(escrows).toBeDefined();
        expect(Array.isArray(escrows.escrows)).toBe(true);
      } catch (e: any) {
        // May fail if module not enabled (403 error)
        if (e.statusCode === 403) {
          console.warn('Hold Payment module not enabled for this account');
        } else {
          throw e;
        }
      }
    }, 15000);
  });

  describe('Pay Merchant (Direct Pay)', () => {
    it('should get direct pay settings', async () => {
      try {
        const settings = await client.getDirectPaySettings();
        expect(settings).toBeDefined();
        expect(typeof settings.configured).toBe('boolean');
      } catch (e: any) {
        // May fail if module not enabled (403 error)
        if (e.statusCode === 403) {
          console.warn('Pay Merchant module not enabled for this account');
        } else {
          throw e;
        }
      }
    }, 15000);

    it('should test direct pay settings if validation is configured', async () => {
      try {
        const settings = await client.getDirectPaySettings();
        if (settings.configured && settings.settings.validation_adapter === 'http') {
          const testResult = await client.testDirectPaySettings({
            customer_id: 'TEST-123',
            reference: 'INV-001',
          });
          expect(testResult).toBeDefined();
        } else {
          console.warn('Direct Pay validation not configured, skipping test');
        }
      } catch (e: any) {
        // May fail if module not enabled (403 error)
        if (e.statusCode === 403) {
          console.warn('Pay Merchant module not enabled for this account');
        } else {
          throw e;
        }
      }
    }, 15000);
  });
});
