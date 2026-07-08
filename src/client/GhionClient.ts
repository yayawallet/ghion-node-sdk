import { GhionConfig, HttpMethod } from '../types';
import {
  AuthenticationError,
  ApiError,
  NetworkError,
  RateLimitError,
} from '../errors';
import {
  generateSignature,
  getCurrentTimestamp,
  verifyWebhookSignature,
} from '../utils/crypto';
import {
  validateApiKey,
  validateApiSecret,
  validatePassphrase,
  validateInitializePaymentRequest,
  validateSubmitPaymentRequest,
  validatePaymentId,
} from '../utils/validator';
import {
  InitializePaymentRequest,
  InitializePaymentResponse,
  SubmitPaymentRequest,
  SubmitPaymentResponse,
  PaymentStatusResponse,
  WebhookEvent,
} from '../types';

/**
 * Main SDK client for Ghion Finances payment gateway
 */
export class GhionClient {
  private readonly apiKey: string;
  private readonly apiSecret: string;
  private readonly passphrase: string;
  private readonly baseUrl: string;
  private readonly timeout: number;

  constructor(config: GhionConfig) {
    // Validate configuration
    validateApiKey(config.apiKey);
    validateApiSecret(config.apiSecret);
    validatePassphrase(config.passphrase);

    this.apiKey = config.apiKey;
    this.apiSecret = config.apiSecret;
    this.passphrase = config.passphrase;
    this.baseUrl = config.baseUrl || 'https://ghion.financial/api/v1';
    this.timeout = config.timeout || 30000;
  }

  /**
   * Initialize a new payment session
   * @param request - Payment initialization parameters
   * @returns Payment initialization response with available channels
   */
  async initializePayment(
    request: InitializePaymentRequest
  ): Promise<InitializePaymentResponse> {
    validateInitializePaymentRequest(request);

    const body = {
      amount: request.amount,
      currency: request.currency || 'ETB',
      reference: request.reference,
      description: request.description || 'Payment',
      webhook_url: request.webhookUrl,
      return_url: request.returnUrl,
      cancel_url: request.cancelUrl,
      metadata: request.metadata,
    };

    return this.apiRequest<InitializePaymentResponse>('POST', '/checkout/initialize', body);
  }

  /**
   * Submit payment with chosen channel
   * @param paymentId - Payment session ID
   * @param request - Payment submission parameters
   * @returns Payment submission response
   */
  async submitPayment(
    paymentId: string,
    request: SubmitPaymentRequest
  ): Promise<SubmitPaymentResponse> {
    validatePaymentId(paymentId);
    validateSubmitPaymentRequest(request);

    const body: any = {};
    if (request.phoneNumber) body.phone_number = request.phoneNumber;
    if (request.accountNumber) body.account_number = request.accountNumber;
    if (request.customerName) body.customer_name = request.customerName;
    if (request.customerEmail) body.customer_email = request.customerEmail;

    return this.apiRequest<SubmitPaymentResponse>(
      'POST',
      `/checkout/${paymentId}/pay/${request.channel}`,
      body
    );
  }

  /**
   * Get payment status
   * @param paymentId - Payment session ID
   * @returns Payment status response
   */
  async getPaymentStatus(paymentId: string): Promise<PaymentStatusResponse> {
    validatePaymentId(paymentId);
    return this.apiRequest<PaymentStatusResponse>('GET', `/checkout/${paymentId}`);
  }

  /**
   * Verify webhook signature
   * @param rawBody - Raw request body from webhook
   * @param signature - Signature from X-Ghion-Signature header
   * @returns True if signature is valid
   */
  verifyWebhook(rawBody: string | Buffer, signature: string): boolean {
    return verifyWebhookSignature(rawBody, signature, this.apiSecret);
  }

  /**
   * Parse and verify webhook event
   * @param rawBody - Raw request body from webhook
   * @param signature - Signature from X-Ghion-Signature header
   * @returns Parsed webhook event
   */
  parseWebhook(rawBody: string | Buffer, signature: string): WebhookEvent {
    if (!this.verifyWebhook(rawBody, signature)) {
      throw new AuthenticationError('Invalid webhook signature');
    }

    const bodyString = typeof rawBody === 'string' ? rawBody : rawBody.toString();
    return JSON.parse(bodyString) as WebhookEvent;
  }

  /**
   * Make authenticated API request
   * @private
   */
  private async apiRequest<T>(
    method: HttpMethod,
    path: string,
    data?: any
  ): Promise<T> {
    const body = data ? JSON.stringify(data) : '';
    const fullPath = `/api/v1${path}`;
    const timestamp = getCurrentTimestamp();
    const signature = generateSignature(timestamp, method, fullPath, body, this.apiSecret);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Ghion-Key': this.apiKey,
      'X-Ghion-Timestamp': String(timestamp),
      'X-Ghion-Signature': signature,
      'X-Ghion-Passphrase': this.passphrase,
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(`${this.baseUrl}${path}`, {
        method,
        headers,
        body: body || undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const text = await response.text();

      // Handle rate limiting
      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After');
        throw new RateLimitError(
          'API rate limit exceeded',
          retryAfter ? parseInt(retryAfter, 10) : undefined
        );
      }

      // Try to parse as JSON
      let json: any;
      try {
        json = JSON.parse(text);
      } catch {
        // If it's HTML, it's likely an error page
        if (text.includes('<')) {
          throw new ApiError(
            `API returned HTML error page (status ${response.status}). This usually means the payment session has expired or is invalid.`,
            response.status
          );
        }
        throw new ApiError(`Invalid response from API: ${text.substring(0, 100)}`, response.status);
      }

      // Handle API errors
      if (!response.ok) {
        const errorMessage = json.error?.message || `API ${response.status}`;
        throw new ApiError(errorMessage, response.status, json);
      }

      return json as T;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof ApiError || error instanceof RateLimitError) {
        throw error;
      }

      if (error instanceof Error && error.name === 'AbortError') {
        throw new NetworkError(`Request timeout after ${this.timeout}ms`);
      }

      if (error instanceof Error) {
        throw new NetworkError(`Network error: ${error.message}`);
      }

      throw new NetworkError('Unknown network error occurred');
    }
  }

}
