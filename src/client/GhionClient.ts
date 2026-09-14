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
  validateCreateBillRequest,
  validateBulkCreateBillsRequest,
  validateListBillsRequest,
  validatePublicBillLookupRequest,
  validateBillId,
  validateRecordManualPaymentRequest,
  validateBillerSettingsRequest,
  validateBillDashboardRequest,
  validateSendPaymentReminderRequest,
  validateEscrowId,
  validateListEscrowsRequest,
  validateUpdateDirectPaySettingsRequest,
  validateTestDirectPaySettingsRequest,
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
  CreateBillRequest,
  BillResponse,
  BulkCreateBillsRequest,
  BulkCreateBillsResponse,
  ListBillsRequest,
  ListBillsResponse,
  BillStatistics,
  BillDashboard,
  PaymentLinkResponse,
  PublicBillLookupRequest,
  PublicBillLookupResponse,
  BillerSettingsRequest,
  BillerSettingsResponse,
  UpdateBillRequest,
  DeleteBillResponse,
  RecordManualPaymentRequest,
  RecordManualPaymentResponse,
  SendPaymentReminderRequest,
  SendPaymentReminderResponse,
  GenerateBillIdResponse,
  InitiateCheckoutResponse,
  Escrow,
  ListEscrowsRequest,
  ListEscrowsResponse,
  PullEscrowFundsResponse,
  GetDirectPaySettingsResponse,
  UpdateDirectPaySettingsRequest,
  TestDirectPaySettingsRequest,
  TestDirectPaySettingsResponse,
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
   * Create a single bill
   * @param request - Bill creation parameters
   * @returns Created bill response
   */
  async createBill(request: CreateBillRequest): Promise<BillResponse> {
    validateCreateBillRequest(request);

    const body = {
      bill_id: request.bill_id,
      amount: request.amount,
      currency: request.currency || 'ETB',
      due_date: request.due_date,
      start_date: request.start_date,
      expires_date: request.expires_date,
      customer_name: request.customer_name,
      customer_phone: request.customer_phone,
      customer_email: request.customer_email,
      customer_id: request.customer_id,
      description: request.description,
      bill_code: request.bill_code,
      cluster: request.cluster,
      penalty: request.penalty,
      metadata: request.metadata,
    };

    return this.apiRequest<BillResponse>('POST', '/dashboard/bills', body);
  }

  /**
   * Create multiple bills in a single request
   * @param request - Bulk bill creation parameters
   * @returns Bulk creation response with created bills and errors
   */
  async createBulkBills(request: BulkCreateBillsRequest): Promise<BulkCreateBillsResponse> {
    validateBulkCreateBillsRequest(request);

    const body = {
      bills: request.bills,
    };

    return this.apiRequest<BulkCreateBillsResponse>('POST', '/dashboard/bills/bulk', body);
  }

  /**
   * List bills with optional filters
   * @param request - List bills query parameters
   * @returns Paginated list of bills
   */
  async listBills(request?: ListBillsRequest): Promise<ListBillsResponse> {
    if (request) {
      validateListBillsRequest(request);
    }

    // Build query parameters with sorted keys for consistent signature
    const params: Record<string, string> = {};
    if (request?.status) params.status = request.status;
    if (request?.search) params.search = request.search;
    if (request?.cluster) params.cluster = request.cluster;
    if (request?.bill_code) params.bill_code = request.bill_code;
    if (request?.from) params.from = request.from;
    if (request?.to) params.to = request.to;
    if (request?.page) params.page = String(request.page);
    if (request?.limit) params.limit = String(request.limit);

    // Sort keys alphabetically for consistent signature
    const sortedKeys = Object.keys(params).sort();
    const queryString = sortedKeys.map(key => `${key}=${encodeURIComponent(params[key])}`).join('&');
    const path = queryString ? `/dashboard/bills?${queryString}` : '/dashboard/bills';

    return this.apiRequest<ListBillsResponse>('GET', path);
  }

  /**
   * Get bill statistics
   * @returns Aggregate counts and amounts for bills
   */
  async getBillStatistics(): Promise<BillStatistics> {
    return this.apiRequest<BillStatistics>('GET', '/dashboard/bills/statistics');
  }

  /**
   * Get bill dashboard analytics
   * @param from - Start date (Y-m-d format)
   * @param to - End date (Y-m-d format)
   * @returns Detailed analytics including trends and breakdowns
   */
  async getBillDashboard(from?: string, to?: string): Promise<BillDashboard> {
    validateBillDashboardRequest(from, to);
    const params = new URLSearchParams();
    if (from) params.append('from', from);
    if (to) params.append('to', to);

    const queryString = params.toString();
    const path = queryString ? `/dashboard/bills/dashboard?${queryString}` : '/dashboard/bills/dashboard';

    return this.apiRequest<BillDashboard>('GET', path);
  }

  /**
   * Get payment link for a bill
   * @param billId - Bill ID
   * @returns Payment link URL
   */
  async getBillPaymentLink(billId: string): Promise<PaymentLinkResponse> {
    validatePaymentId(billId);
    return this.apiRequest<PaymentLinkResponse>('GET', `/dashboard/bills/${billId}/checkout-url`);
  }

  /**
   * Public bill lookup (no authentication required)
   * Used by bank branches and mobile banking apps
   * @param request - Public lookup parameters
   * @returns Bill information
   */
  async publicBillLookup(request: PublicBillLookupRequest): Promise<PublicBillLookupResponse> {
    validatePublicBillLookupRequest(request);

    const body = {
      biller_code: request.biller_code,
      bill_id: request.bill_id,
    };

    // Public endpoint uses different base URL and no authentication
    return this.apiRequest<PublicBillLookupResponse>('POST', '/public/bill/find', body, this.baseUrl, true);
  }

  /**
   * Get biller settings
   * @returns Biller settings including biller_code needed for public lookup
   */
  async getBillerSettings(): Promise<BillerSettingsResponse> {
    return this.apiRequest<BillerSettingsResponse>('GET', '/dashboard/biller-settings');
  }

  /**
   * Update biller settings
   * @param request - Biller settings to update
   * @returns Updated biller settings
   */
  async updateBillerSettings(request: BillerSettingsRequest): Promise<BillerSettingsResponse> {
    validateBillerSettingsRequest(request);
    return this.apiRequest<BillerSettingsResponse>('PUT', '/dashboard/biller-settings', request);
  }

  /**
   * Get bill detail by ID
   * @param id - Bill ID
   * @returns Bill detail with full information
   */
  async getBillDetail(id: string): Promise<BillResponse> {
    validateBillId(id);
    return this.apiRequest<BillResponse>('GET', `/dashboard/bills/${id}`);
  }

  /**
   * Update a bill (partial update - only provided fields are updated)
   * @param id - Bill ID
   * @param request - Fields to update
   * @returns Updated bill detail
   */
  async updateBill(id: string, request: UpdateBillRequest): Promise<BillResponse> {
    validateBillId(id);
    const body: Record<string, unknown> = {};
    if (request.amount !== undefined) body.amount = request.amount;
    if (request.currency !== undefined) body.currency = request.currency;
    if (request.due_date !== undefined) body.due_date = request.due_date;
    if (request.start_date !== undefined) body.start_date = request.start_date;
    if (request.expires_date !== undefined) body.expires_date = request.expires_date;
    if (request.customer_name !== undefined) body.customer_name = request.customer_name;
    if (request.customer_phone !== undefined) body.customer_phone = request.customer_phone;
    if (request.customer_email !== undefined) body.customer_email = request.customer_email;
    if (request.customer_id !== undefined) body.customer_id = request.customer_id;
    if (request.description !== undefined) body.description = request.description;
    if (request.bill_code !== undefined) body.bill_code = request.bill_code;
    if (request.cluster !== undefined) body.cluster = request.cluster;
    if (request.penalty !== undefined) body.penalty = request.penalty;
    if (request.metadata !== undefined) body.metadata = request.metadata;

    return this.apiRequest<BillResponse>('PUT', `/dashboard/bills/${id}`, body);
  }

  /**
   * Delete a bill (only bills with no payments can be deleted)
   * @param id - Bill ID
   * @returns Deletion confirmation message
   */
  async deleteBill(id: string): Promise<DeleteBillResponse> {
    validateBillId(id);
    return this.apiRequest<DeleteBillResponse>('DELETE', `/dashboard/bills/${id}`);
  }

  /**
   * Record a manual payment against a bill (e.g., cash, bank transfer)
   * This does not process an actual payment — it only updates the bill's balance and status for reconciliation purposes
   * @param id - Bill ID
   * @param request - Manual payment details
   * @returns Payment record with updated bill status
   */
  async recordManualPayment(id: string, request: RecordManualPaymentRequest): Promise<RecordManualPaymentResponse> {
    validateBillId(id);
    validateRecordManualPaymentRequest(request);
    const body = {
      amount: request.amount,
      source: request.source || 'manual',
      payment_method: request.payment_method || 'cash',
      reference: request.reference,
      note: request.note,
    };
    return this.apiRequest<RecordManualPaymentResponse>('POST', `/dashboard/bills/${id}/payments`, body);
  }

  /**
   * Send a payment reminder to the customer via email and SMS
   * @param id - Bill ID
   * @param request - Optional custom message
   * @returns Reminder confirmation with count and timestamp
   */
  async sendPaymentReminder(id: string, request?: SendPaymentReminderRequest): Promise<SendPaymentReminderResponse> {
    validateBillId(id);
    if (request) {
      validateSendPaymentReminderRequest(request);
    }
    const body = request ? { message: request.message } : {};
    return this.apiRequest<SendPaymentReminderResponse>('POST', `/dashboard/bills/${id}/send-reminder`, body);
  }

  /**
   * Generate a bill ID
   * @returns Suggested auto-generated bill ID
   */
  async generateBillId(): Promise<GenerateBillIdResponse> {
    return this.apiRequest<GenerateBillIdResponse>('GET', '/dashboard/bills/generate-id');
  }

  /**
   * Initiate checkout for a bill
   * Ensures a PaymentLink exists for the bill (creates if needed)
   * @param id - Bill ID
   * @returns Checkout information with payment link
   */
  async initiateCheckout(id: string): Promise<InitiateCheckoutResponse> {
    validateBillId(id);
    return this.apiRequest<InitiateCheckoutResponse>('POST', `/dashboard/bills/${id}/initiate-checkout`);
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
      // For GET requests, use only pathname for signature (exclude query string)
      const signaturePath = method === 'GET' ? parsedUrl.pathname : fullPath;
      const signature = generateSignature(timestamp, method, signaturePath, body, this.apiSecret);
      
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

  /**
   * Hold Payment (Escrow) Methods
   */

  /**
   * List all held payments (escrows) for your account
   * @param request - Optional filter by status
   * @returns List of escrows
   */
  async listEscrows(request?: ListEscrowsRequest): Promise<ListEscrowsResponse> {
    if (request) {
      validateListEscrowsRequest(request);
    }
    const queryParams = request?.status ? `?status=${request.status}` : '';
    return this.apiRequest<ListEscrowsResponse>('GET', `/dashboard/escrows${queryParams}`);
  }

  /**
   * Get a single escrow/holding by its ID
   * @param id - The escrow ID
   * @returns Escrow details
   */
  async getEscrow(id: string): Promise<Escrow> {
    validateEscrowId(id);
    return this.apiRequest<Escrow>('GET', `/dashboard/escrows/${id}`);
  }

  /**
   * Pull funds from a funded escrow to your balance
   * @param id - The escrow ID
   * @returns Pull response with updated status
   */
  async pullEscrowFunds(id: string): Promise<PullEscrowFundsResponse> {
    validateEscrowId(id);
    return this.apiRequest<PullEscrowFundsResponse>('POST', `/dashboard/escrows/${id}/pull`);
  }

  /**
   * Pay Merchant (Direct Pay) Methods
   */

  /**
   * Get current Pay Merchant settings
   * @returns Direct Pay settings
   */
  async getDirectPaySettings(): Promise<GetDirectPaySettingsResponse> {
    return this.apiRequest<GetDirectPaySettingsResponse>('GET', '/dashboard/direct-pay/settings');
  }

  /**
   * Update Pay Merchant settings
   * @param request - Settings to update
   * @returns Updated settings
   */
  async updateDirectPaySettings(request: UpdateDirectPaySettingsRequest): Promise<GetDirectPaySettingsResponse> {
    validateUpdateDirectPaySettingsRequest(request);
    return this.apiRequest<GetDirectPaySettingsResponse>('PUT', '/dashboard/direct-pay/settings', request);
  }

  /**
   * Test Pay Merchant validation configuration
   * @param request - Test customer ID and optional reference
   * @returns Validation test result
   */
  async testDirectPaySettings(request: TestDirectPaySettingsRequest): Promise<TestDirectPaySettingsResponse> {
    validateTestDirectPaySettingsRequest(request);
    return this.apiRequest<TestDirectPaySettingsResponse>('POST', '/dashboard/direct-pay/settings/test', request);
  }

}
