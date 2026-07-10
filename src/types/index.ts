/**
 * Configuration options for the Ghion Finances SDK client
 */
export interface GhionConfig {
  apiKey: string;
  apiSecret: string;
  passphrase: string;
  baseUrl?: string;
  checkoutBaseUrl?: string;
  timeout?: number;
}

/**
 * Payment initialization request parameters
 */
export interface InitializePaymentRequest {
  amount: number;
  currency?: string;
  reference: string;
  description?: string;
  webhookUrl?: string;
  returnUrl?: string;
  cancelUrl?: string;
  metadata?: Record<string, any>;
}

/**
 * Payment initialization response
 */
export interface InitializePaymentResponse {
  id: string;
  amount: number;
  currency: string;
  reference: string;
  description: string;
  status: string;
  channels: PaymentChannel[];
  available_channels?: PaymentChannel[];
  expires_at: string;
  created_at: string;
  providers?: any[];
  card_enabled?: boolean;
  other_enabled?: boolean;
  qr?: QRInfo;
  yaya_unique_reference?: string;
  checkout_url?: string;
  allow_amount_edit?: boolean;
  callback_url?: string;
  return_url?: string;
  cancel_url?: string;
}

/**
 * Checkout response (from checkout endpoint)
 */
export interface CheckoutResponse {
  id: string;
  reference: string;
  amount: number;
  currency: string;
  status: string;
  mode?: string;
  description: string;
  channel?: string;
  is_expired: boolean;
  expires_at: string;
  providers?: Provider[];
  card_enabled?: boolean;
  other_enabled?: boolean;
  available_channels?: PaymentChannel[];
  created_at: string;
  callback_url?: string;
  return_url?: string;
  cancel_url?: string;
  yaya_unique_reference?: string;
  qr?: QRInfo;
  merchant?: Merchant;
  collect_phone?: boolean;
  collect_email?: boolean;
  allow_amount_edit?: boolean;
  payer_phone?: string;
  fee_on_merchant?: boolean;
  gateway_fee?: number;
  total_amount?: number;
  stripe_publishable_key?: string;
  checkout_url?: string;
}

/**
 * QR payment response
 */
export interface QRPaymentResponse {
  type: string;
  transaction_id: string;
  status: string;
  qr_image_url: string;
  qr_payload: string;
}

/**
 * OTP send response
 * Note: The API returns type: "ussd" for YaYa Wallet payments even when using OTP validation
 * This indicates the underlying payment method type (USSD-based) rather than the validation method
 */
export interface OTPSendResponse {
  type: string;
  transaction_id: string;
  status: string;
  message: string;
}

/**
 * OTP validation response
 * Note: After successful OTP validation, the payment status becomes "completed"
 * and you should call getCheckout() to get the full payment details
 */
export interface OTPValidateResponse {
  status: string;
  transaction_id: string;
}

/**
 * Provider information
 */
export interface Provider {
  code: string;
  name: string;
  logo?: string;
  methods: string[];
}

/**
 * QR information
 */
export interface QRInfo {
  qr_image_url: string;
  qr_payload: string;
}

/**
 * Merchant information
 */
export interface Merchant {
  name: string;
  slug: string;
  business_name: string;
  logo_url?: string;
}

/**
 * Available payment channel
 */
export interface PaymentChannel {
  id?: string;
  code?: string;
  name: string;
  icon?: string;
  requires_phone?: boolean;
  requires_account?: boolean;
  type?: string;
  logo?: string;
  supports_otp?: boolean;
}

/**
 * Payment submission request parameters
 */
export interface SubmitPaymentRequest {
  channel: string;
  phoneNumber?: string;
  accountNumber?: string;
  paymentMethod?: string; // 'ussd', 'otp', or 'qr'
}

/**
 * Payment submission response
 */
export interface SubmitPaymentResponse {
  id: string;
  status: string;
  transaction_id?: string;
  message: string;
  redirect_url?: string;
}

/**
 * Payment status response
 */
export interface PaymentStatusResponse {
  id: string;
  amount: number;
  currency: string;
  reference: string;
  description: string;
  status: PaymentStatus;
  channel?: string;
  transaction_id?: string;
  customer?: {
    phone_number?: string;
    account_number?: string;
    name?: string;
    email?: string;
  };
  created_at: string;
  updated_at: string;
  completed_at?: string;
  failed_at?: string;
  failure_reason?: string;
}

/**
 * Payment status enum
 */
export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
}

/**
 * Webhook event types
 */
export enum WebhookEventType {
  PAYMENT_COMPLETED = 'payment.completed',
  PAYMENT_FAILED = 'payment.failed',
  PAYMENT_CANCELLED = 'payment.cancelled',
  PAYMENT_EXPIRED = 'payment.expired',
}

/**
 * Webhook event payload
 */
export interface WebhookEvent {
  event: WebhookEventType;
  data: {
    payment_id: string;
    transaction_id?: string;
    amount: number;
    currency: string;
    reference: string;
    status: PaymentStatus;
    timestamp: string;
  };
  signature: string;
}

/**
 * API error response
 */
export interface ApiError {
  error: {
    message: string;
    code?: string;
    details?: any;
  };
}

/**
 * HTTP method types
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
