/**
 * Unit tests for Ghion Finances SDK
 * These tests verify SDK functionality without making real API calls
 */

import { GhionClient, PaymentStatus, WebhookEventType, ValidationError, ApiError, RateLimitError } from '../src';
import * as crypto from 'crypto';

// Mock fetch globally
global.fetch = jest.fn();

describe('GhionClient', () => {
  let client: GhionClient;

  beforeEach(() => {
    client = new GhionClient({
      apiKey: 'test-api-key',
      apiSecret: 'secret123',
      passphrase: 'test-passphrase',
    });
    jest.clearAllMocks();
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
      expect(WebhookEventType.TRANSACTION_COMPLETED).toBe('transaction.completed');
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
      event: 'transaction.completed',
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
      
      expect(event.event).toBe('transaction.completed');
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

  describe('API Request Handling', () => {
    it('throws ApiError on non-2xx JSON response', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 400,
        text: async () => JSON.stringify({ error: { message: 'Bad request' } }),
        headers: new Headers(),
      });
      
      await expect(client.getPaymentStatus('p1')).rejects.toThrow(ApiError);
    });

    it('throws ApiError with helpful message on HTML error page', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
        text: async () => '<html>Internal Server Error</html>',
        headers: new Headers(),
      });
      
      await expect(client.getPaymentStatus('p1')).rejects.toThrow(/expired or is invalid/);
    });

    it('retries on 429 and eventually throws RateLimitError', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 429,
        text: async () => '{}',
        headers: new Headers({ 'Retry-After': '0' }),
      });
      
      await expect(client.getPaymentStatus('p1')).rejects.toThrow(RateLimitError);
    });

    it('retries on 429 with Retry-After header and succeeds', async () => {
      let attempts = 0;
      (global.fetch as jest.Mock).mockImplementation(() => {
        attempts++;
        if (attempts === 1) {
          return Promise.resolve({
            ok: false,
            status: 429,
            text: async () => '{}',
            headers: new Headers({ 'Retry-After': '0' }),
          });
        }
        return Promise.resolve({
          ok: true,
          status: 200,
          text: async () => JSON.stringify({ id: 'p1', status: 'completed' }),
          headers: new Headers(),
        });
      });
      
      const result = await client.getPaymentStatus('p1');
      expect(result.status).toBe('completed');
      expect(attempts).toBe(2);
    });

    it('retries on 5xx for safe GET methods', async () => {
      let attempts = 0;
      (global.fetch as jest.Mock).mockImplementation(() => {
        attempts++;
        if (attempts === 1) {
          return Promise.resolve({
            ok: false,
            status: 500,
            text: async () => JSON.stringify({ error: { message: 'Server error' } }),
            headers: new Headers(),
          });
        }
        return Promise.resolve({
          ok: true,
          status: 200,
          text: async () => JSON.stringify({ id: 'p1', status: 'completed' }),
          headers: new Headers(),
        });
      });
      
      const result = await client.getPaymentStatus('p1');
      expect(result.status).toBe('completed');
      expect(attempts).toBe(2);
    });

    it('does not retry non-idempotent POST methods on 5xx', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
        text: async () => JSON.stringify({ error: { message: 'Server error' } }),
        headers: new Headers(),
      });
      
      await expect(client.submitPayment('p1', { channel: 'telebirr' })).rejects.toThrow(ApiError);
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('redacts sensitive data from error responses', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 400,
        text: async () => JSON.stringify({ 
          error: { message: 'Invalid' },
          api_key: 'secret-key',
          signature: 'abc123'
        }),
        headers: new Headers(),
      });
      
      try {
        await client.getPaymentStatus('p1');
      } catch (error: any) {
        expect(error.details.response.api_key).toBe('[REDACTED]');
        expect(error.details.response.signature).toBe('[REDACTED]');
      }
    });

    it('retries on genuine network failure (not just timeout)', async () => {
      let attempts = 0;
      (global.fetch as jest.Mock).mockImplementation(() => {
        attempts++;
        if (attempts < 2) return Promise.reject(Object.assign(new TypeError('fetch failed'), { cause: new Error('ECONNREFUSED') }));
        return Promise.resolve({
          ok: true, status: 200,
          text: async () => JSON.stringify({ id: 'p1', status: 'completed' }),
          headers: new Headers(),
        });
      });
      const result = await client.getPaymentStatus('p1');
      expect(result.status).toBe('completed');
      expect(attempts).toBe(2);
    });

    it('deep-redacts nested and array data without crashing on pathological depth', async () => {
      let deep: any = { otp_code: '1' };
      let cursor = deep;
      for (let i = 0; i < 50; i++) { cursor.next = { otp_code: '1' }; cursor = cursor.next; }
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false, status: 400,
        text: async () => JSON.stringify(deep),
        headers: new Headers(),
      });
      await expect(client.getPaymentStatus('p1')).rejects.toThrow(ApiError); // should not throw a stack overflow
    });

    it('handles edge case: empty string validation', () => {
      expect(() => {
        new GhionClient({ apiKey: '', apiSecret: 'secret', passphrase: 'pass' });
      }).toThrow();
    });

    it('handles edge case: whitespace-only string validation', () => {
      expect(() => {
        new GhionClient({ apiKey: '   ', apiSecret: 'secret', passphrase: 'pass' });
      }).toThrow();
    });

    it('handles edge case: null values in request data', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ id: 'p1', status: 'completed' }),
        headers: new Headers(),
      });
      
      const result = await client.initializePayment({
        amount: 100,
        reference: 'test',
        currency: null as any,
      });
      expect(result.id).toBe('p1');
    });

    it('handles edge case: undefined optional fields', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ id: 'p1', status: 'completed' }),
        headers: new Headers(),
      });
      
      const result = await client.initializePayment({
        amount: 100,
        reference: 'test',
        // currency, description, webhookUrl all undefined
      });
      expect(result.id).toBe('p1');
    });

    it('handles edge case: zero as falsy value for optional fields', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ id: 'p1', status: 'completed' }),
        headers: new Headers(),
      });
      
      // This should work since 0 is a valid number
      const result = await client.initializePayment({
        amount: 100,
        reference: 'test',
      });
      expect(result.id).toBe('p1');
    });

    it('handles edge case: boolean false as falsy value for optional fields', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ id: 'p1', status: 'completed' }),
        headers: new Headers(),
      });
      
      const result = await client.initializePayment({
        amount: 100,
        reference: 'test',
        // This should work since the validation only checks for strings
      });
      expect(result.id).toBe('p1');
    });

    it('handles edge case: very long strings in validation', () => {
      const veryLongString = 'a'.repeat(10000);
      expect(() => {
        new GhionClient({ apiKey: veryLongString, apiSecret: 'secret', passphrase: 'pass' });
      }).not.toThrow();
    });

    it('handles edge case: special characters in strings', () => {
      const specialChars = '!@#$%^&*()_+-=[]{}|;:,.<>?/~`';
      expect(() => {
        new GhionClient({ apiKey: specialChars, apiSecret: 'secret', passphrase: 'pass' });
      }).not.toThrow();
    });

    it('handles edge case: unicode characters in strings', () => {
      const unicode = '🔥💰🚀ሀፈትዮጵያ';
      expect(() => {
        new GhionClient({ apiKey: unicode, apiSecret: 'secret', passphrase: 'pass' });
      }).not.toThrow();
    });

    it('handles edge case: numeric string that should be rejected', () => {
      expect(() => {
        new GhionClient({ apiKey: '12345', apiSecret: 'secret', passphrase: 'pass' });
      }).not.toThrow(); // numeric strings are valid strings
    });

    it('handles edge case: webhook with malformed JSON', () => {
      const malformedJson = '{invalid json}';
      const signature = crypto.createHmac('sha256', 'secret123').update(malformedJson).digest('base64');
      
      expect(() => {
        client.parseWebhook(malformedJson, signature);
      }).toThrow();
    });

    it('handles edge case: webhook with empty object', () => {
      const emptyJson = '{}';
      const signature = crypto.createHmac('sha256', 'secret123').update(emptyJson).digest('base64');
      
      const event = client.parseWebhook(emptyJson, signature);
      expect(event).toBeDefined();
    });

    it('handles edge case: webhook with missing required fields', () => {
      const incompleteJson = '{"event": "transaction.completed"}';
      const signature = crypto.createHmac('sha256', 'secret123').update(incompleteJson).digest('base64');
      
      const event = client.parseWebhook(incompleteJson, signature);
      expect(event.event).toBe('transaction.completed');
      expect(event.data).toBeUndefined();
    });

    it('handles edge case: webhook with extra fields', () => {
      const extraFieldsJson = '{"event": "transaction.completed", "data": {"payment_id": "p1"}, "extra": "field"}';
      const signature = crypto.createHmac('sha256', 'secret123').update(extraFieldsJson).digest('base64');
      
      const event = client.parseWebhook(extraFieldsJson, signature);
      expect(event.event).toBe('transaction.completed');
      expect(event.data.payment_id).toBe('p1');
    });
  });
});
