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
  validatePhoneNumber,
  validateOTPCode,
} from '../utils/validator';
import {
  InitializePaymentRequest,
  InitializePaymentResponse,
  SubmitPaymentRequest,
  SubmitPaymentResponse,
  PaymentStatusResponse,
  WebhookEvent,
  CheckoutResponse,
  QRPaymentResponse,
  OTPSendResponse,
  OTPValidateResponse,
} from '../types';

/**
 * Main SDK client for Ghion Finances payment gateway
 */
export class GhionClient {
  private readonly apiKey: string;
  private readonly apiSecret: string;
  private readonly passphrase: string;
  private readonly baseUrl: string;
  private readonly checkoutBaseUrl: string;
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
    this.checkoutBaseUrl = config.checkoutBaseUrl || 'https://app.ghion.financial/api/v1';
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

    const body: Record<string, unknown> = {};
    if (request.phoneNumber) body.phone_number = request.phoneNumber;
    if (request.accountNumber) body.account_number = request.accountNumber;

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
   * Get checkout information
   * @param paymentId - Payment session ID
   * @returns Checkout response with QR, merchant, and provider info
   */
  async getCheckout(paymentId: string): Promise<CheckoutResponse> {
    validatePaymentId(paymentId);
    // Checkout endpoint with verify=1 is publicly accessible
    return this.apiRequest<CheckoutResponse>('GET', `/checkout/${paymentId}?verify=1`, undefined, this.checkoutBaseUrl, true);
  }

  /**
   * Pay with QR code
   * @param paymentId - Payment session ID
   * @returns QR payment response with QR image and payload
   */
  async payWithQR(paymentId: string): Promise<QRPaymentResponse> {
    validatePaymentId(paymentId);
    return this.apiRequest<QRPaymentResponse>('POST', `/checkout/${paymentId}/pay/other`, undefined, this.checkoutBaseUrl);
  }

  /**
   * Send OTP to user's phone for YaYa Wallet payment
   * @param paymentId - Payment session ID
   * @param phoneNumber - User's phone number
   * @returns OTP send response
   */
  async sendOTP(paymentId: string, phoneNumber: string): Promise<OTPSendResponse> {
    validatePaymentId(paymentId);
    validatePhoneNumber(phoneNumber);
    return this.apiRequest<OTPSendResponse>('POST', `/checkout/${paymentId}/pay/yayawallet`, {
      phone_number: phoneNumber,
      payment_method: 'otp'
    }, this.checkoutBaseUrl);
  }

  /**
   * Validate OTP code for payment completion
   * @param paymentId - Payment session ID
   * @param otpCode - OTP code received by user
   * @param phoneNumber - Phone number used to send OTP
   * @returns OTP validation response
   */
  async validateOTP(paymentId: string, otpCode: string | number, phoneNumber: string): Promise<OTPValidateResponse> {
    validatePaymentId(paymentId);
    validateOTPCode(otpCode);
    validatePhoneNumber(phoneNumber);
    return this.apiRequest<OTPValidateResponse>('POST', `/checkout/${paymentId}/otp-validate`, {
      otp_code: otpCode.toString(),
      phone_number: phoneNumber,
    }, this.checkoutBaseUrl);
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
    data?: Record<string, unknown>,
    customBaseUrl?: string,
    skipAuth: boolean = false,
    attempt: number = 1
  ): Promise<T> {
    const body = data ? JSON.stringify(data) : '';
    const baseUrl = customBaseUrl || this.baseUrl;
    const url = `${baseUrl}${path}`;
    const parsedUrl = new URL(url);
    const fullPath = parsedUrl.pathname + parsedUrl.search;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (!skipAuth) {
      const timestamp = getCurrentTimestamp();
      const signature = generateSignature(timestamp, method, fullPath, body, this.apiSecret);
      
      headers['X-Ghion-Key'] = this.apiKey;
      headers['X-Ghion-Timestamp'] = String(timestamp);
      headers['X-Ghion-Signature'] = signature;
      headers['X-Ghion-Passphrase'] = this.passphrase;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      // const url = `${baseUrl}${path}`;
      // console.log(`API Request: ${method} ${url}`);
      // console.log(`Request body: ${body}`);
      // console.log(`Full path for signature: ${fullPath}`);
      
      const response = await fetch(url, {
        method,
        headers,
        body: body || undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const text = await response.text();

      // Handle rate limiting with automatic retry
      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After');
        const waitMs = retryAfter ? parseInt(retryAfter, 10) * 1000 : 1000 * attempt;
        
        if (attempt < 3) {
          await new Promise(resolve => setTimeout(resolve, waitMs));
          return this.apiRequest<T>(method, path, data, customBaseUrl, skipAuth, attempt + 1);
        }
        
        throw new RateLimitError(
          'API rate limit exceeded',
          retryAfter ? parseInt(retryAfter, 10) : undefined
        );
      }

      // Retry transient failures for safe GET methods
      const isSafeGet = method === 'GET' && this.isSafeEndpoint(path);
      if (isSafeGet && (response.status >= 500 || response.status === 0) && attempt < 3) {
        const waitMs = 1000 * 2 ** (attempt - 1); // Exponential backoff: 1s, 2s, 4s
        await new Promise(resolve => setTimeout(resolve, waitMs));
        return this.apiRequest<T>(method, path, data, customBaseUrl, skipAuth, attempt + 1);
      }

      // Try to parse as JSON
      let json: Record<string, unknown>;
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const errorMessage = (json as any).error?.message || `API ${response.status}`;
        throw new ApiError(errorMessage, response.status, this.redactSensitiveData(json));
      }

      return json as T;
    } catch (error) {
      clearTimeout(timeoutId);

      // Retry network errors for safe GET methods
      const isSafeGet = method === 'GET' && this.isSafeEndpoint(path);
      const isRetryableError = error instanceof Error &&
        (error.name === 'AbortError' || error.message.includes('fetch failed') || 'cause' in error);
      
      if (isSafeGet && isRetryableError && attempt < 3) {
        const waitMs = 1000 * 2 ** (attempt - 1); // Exponential backoff: 1s, 2s, 4s
        await new Promise(resolve => setTimeout(resolve, waitMs));
        return this.apiRequest<T>(method, path, data, customBaseUrl, skipAuth, attempt + 1);
      }

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

  /**
   * Check if endpoint is safe for retry (idempotent GET operations)
   * @private
   */
  private isSafeEndpoint(path: string): boolean {
    return path.includes('/checkout/') && !path.includes('/pay/') && !path.includes('/otp-validate');
  }

  /**
   * Redact sensitive data from error responses
   * Performs deep redaction on nested objects and arrays with depth limit protection
   * beyond the maximum depth (20), data is returned unredacted rather than dropped
   * @private
   */
  private redactSensitiveData(data: unknown, depth: number = 0): Record<string, unknown> {
    // Depth limit protection to prevent stack overflow on pathological inputs
    if (depth > 20 || !data || typeof data !== 'object') return data as Record<string, unknown>;
    
    const sensitiveKeys = ['api_key', 'api_secret', 'passphrase', 'signature', 'password', 'otp_code', 'token', 'phone_number', 'account_number'];
    
    // Handle arrays recursively
    if (Array.isArray(data)) {
      return data.map(item => this.redactSensitiveData(item, depth + 1)) as unknown as Record<string, unknown>;
    }
    
    // Handle objects recursively
    const redacted: Record<string, unknown> = {};
    for (const key of Object.keys(data as Record<string, unknown>)) {
      if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk))) {
        redacted[key] = '[REDACTED]';
      } else if (typeof (data as Record<string, unknown>)[key] === 'object' && (data as Record<string, unknown>)[key] !== null) {
        redacted[key] = this.redactSensitiveData((data as Record<string, unknown>)[key], depth + 1);
      } else {
        redacted[key] = (data as Record<string, unknown>)[key];
      }
    }
    
    return redacted;
  }

}
