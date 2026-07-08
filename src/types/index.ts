/**
 * Configuration options for the Ghion Finances SDK client
 */
export interface GhionConfig {
  apiKey: string;
  apiSecret: string;
  passphrase: string;
  baseUrl?: string;
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
  yaya_unique_reference?: string;
  checkout_url?: string;
  allow_amount_edit?: boolean;
  callback_url?: string;
  return_url?: string;
  cancel_url?: string;
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
  customerName?: string;
  customerEmail?: string;
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
