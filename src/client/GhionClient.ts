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

    const body: any = {};
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
    data?: any,
    customBaseUrl?: string,
    skipAuth: boolean = false
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
      const url = `${baseUrl}${path}`;
      console.log(`API Request: ${method} ${url}`);
      console.log(`Request body: ${body}`);
      console.log(`Full path for signature: ${fullPath}`);
      
      const response = await fetch(url, {
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
