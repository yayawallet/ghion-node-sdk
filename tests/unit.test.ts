/**
 * Unit tests for Ghion Finances SDK
 * These tests verify SDK functionality without making real API calls
 */

import { GhionClient, PaymentStatus, WebhookEventType, ValidationError } from '../src';
import * as crypto from 'crypto';

describe('GhionClient', () => {
  let client: GhionClient;

  beforeEach(() => {
    client = new GhionClient({
      apiKey: 'test-api-key',
      apiSecret: 'secret123',
      passphrase: 'test-passphrase',
    });
  });

  describe('Imports', () => {
    it('should export GhionClient as a class', () => {
      expect(typeof GhionClient).toBe('function');
    });

    it('should export PaymentStatus enum', () => {
      expect(PaymentStatus).toBeDefined();
      expect(PaymentStatus.COMPLETED).toBe('completed');
    });

    it('should export WebhookEventType enum', () => {
      expect(WebhookEventType).toBeDefined();
      expect(WebhookEventType.PAYMENT_COMPLETED).toBe('payment.completed');
    });
  });

  describe('Instantiation', () => {
    it('should create a client instance', () => {
      expect(client).toBeInstanceOf(GhionClient);
    });

    it('should throw error for empty apiKey', () => {
      expect(() => {
        new GhionClient({ apiKey: '', apiSecret: 'secret', passphrase: 'pass' });
      }).toThrow();
    });

    it('should throw error for empty apiSecret', () => {
      expect(() => {
        new GhionClient({ apiKey: 'key', apiSecret: '', passphrase: 'pass' });
      }).toThrow();
    });

    it('should throw error for empty passphrase', () => {
      expect(() => {
        new GhionClient({ apiKey: 'key', apiSecret: 'secret', passphrase: '' });
      }).toThrow();
    });
  });

  describe('Webhook Signature Verification', () => {
    const payload = JSON.stringify({
      event: 'payment.completed',
      data: { payment_id: 'p1', amount: 100, currency: 'ETB' },
    });

    it('should verify valid webhook signature', () => {
      const sig = crypto.createHmac('sha256', 'secret123').update(payload).digest('base64');
      expect(client.verifyWebhook(payload, sig)).toBe(true);
    });

    it('should reject invalid webhook signature', () => {
      expect(client.verifyWebhook(payload, 'invalid-signature')).toBe(false);
    });

    it('should parse webhook with valid signature', () => {
      const sig = crypto.createHmac('sha256', 'secret123').update(payload).digest('base64');
      const event = client.parseWebhook(payload, sig);
      
      expect(event.event).toBe('payment.completed');
      expect(event.data.payment_id).toBe('p1');
    });

    it('should throw error when parsing webhook with invalid signature', () => {
      expect(() => {
        client.parseWebhook(payload, 'bad-signature');
      }).toThrow();
    });
  });

  describe('Input Validation', () => {
    it('should throw ValidationError for negative amount', async () => {
      await expect(
        client.initializePayment({ amount: -5, reference: 'test-ref' })
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for zero amount', async () => {
      await expect(
        client.initializePayment({ amount: 0, reference: 'test-ref' })
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for empty reference', async () => {
      await expect(
        client.initializePayment({ amount: 100, reference: '' })
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for empty paymentId in submitPayment', async () => {
      await expect(
        client.submitPayment('', { channel: 'telebirr' })
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for empty paymentId in getPaymentStatus', async () => {
      await expect(
        client.getPaymentStatus('')
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for empty paymentId in getCheckout', async () => {
      await expect(
        client.getCheckout('')
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for empty paymentId in payWithQR', async () => {
      await expect(
        client.payWithQR('')
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for empty phone in sendOTP', async () => {
      await expect(
        client.sendOTP('p1', '')
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for empty otp in validateOTP', async () => {
      await expect(
        client.validateOTP('p1', '', '0924357096')
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for empty phone in validateOTP', async () => {
      await expect(
        client.validateOTP('p1', '123456', '')
      ).rejects.toThrow(ValidationError);
    });
  });
});
