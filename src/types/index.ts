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
  metadata?: Record<string, unknown>;
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
  providers?: Record<string, unknown>[];
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
 * Checkout response
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
 */
export interface OTPSendResponse {
  type: string;
  transaction_id: string;
  status: string;
  message: string;
}

/**
 * OTP validation response
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
  TRANSACTION_COMPLETED = 'transaction.completed',
  TRANSACTION_FAILED = 'transaction.failed',
  TRANSACTION_REFUNDED = 'transaction.refunded',
  TRANSACTION_PARTIALLY_REFUNDED = 'transaction.partially_refunded',
  TRANSACTION_EXPIRED = 'transaction.expired',
  TRANSACTION_DISPUTED = 'transaction.disputed',
  TRANSACTION_UPDATED = 'transaction.updated',
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
    details?: Record<string, unknown>;
  };
}

/**
 * HTTP method types
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

/**
 * Bill status enum
 */
export enum BillStatus {
  PENDING = 'pending',
  PAID = 'paid',
  FORWARDED = 'forwarded',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
}

/**
 * Penalty configuration for late payments
 */
export interface Penalty {
  type: 'fixed' | 'percentage';
  fee: number;
  max_amount: number;
  recurring: 'daily' | 'weekly' | 'monthly' | 'once';
}

/**
 * Create a single bill request
 */
export interface CreateBillRequest {
  bill_id?: string; // Optional - if omitted, one will be auto-generated
  amount: number;
  currency?: string;
  due_date: string; // Y-m-d format
  start_date?: string; // Y-m-d format
  expires_date?: string; // Y-m-d format
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  customer_id?: string;
  description?: string;
  bill_code?: string;
  cluster?: string;
  penalty?: Penalty;
  metadata?: Record<string, unknown>;
}

/**
 * Bill response
 */
export interface BillResponse {
  id: string;
  bill_id: string;
  bill_code?: string;
  cluster?: string;
  customer_name?: string;
  customer_phone?: string;
  customer_id?: string;
  amount: number;
  service_charge: number;
  penalty_amount: number;
  total_due: number;
  paid: number;
  balance_due: number;
  currency: string;
  status: BillStatus;
  due_date: string;
  is_overdue: boolean;
  days_overdue: number;
  created_at: string;
  bill_season?: string;
  customer_email?: string;
  description?: string;
  start_date?: string;
  expires_date?: string;
  original_due_date?: string;
  paid_at?: string;
  share_token?: string;
  penalty?: Penalty;
  metadata?: Record<string, unknown>;
  payments?: unknown[];
}

/**
 * Bulk create bills request
 */
export interface BulkCreateBillsRequest {
  bills: Omit<CreateBillRequest, 'currency'>[];
}

/**
 * Bulk create bills response
 */
export interface BulkCreateBillsResponse {
  created_count: number;
  error_count: number;
  created: BillResponse[];
  errors: Array<{
    bill_id: string;
    error: string;
  }>;
}

/**
 * List bills query parameters
 */
export interface ListBillsRequest {
  status?: BillStatus;
  search?: string;
  cluster?: string;
  bill_code?: string;
  from?: string; // Y-m-d format
  to?: string; // Y-m-d format
  page?: number;
  limit?: number;
}

/**
 * List bills response
 */
export interface ListBillsResponse {
  items: BillResponse[];
  total: number;
  page: number;
  limit: number;
}

/**
 * Bill statistics
 */
export interface BillStatistics {
  pending: number;
  paid: number;
  forwarded: number;
  overdue: number;
  total_amount: number;
  total_paid: number;
}

/**
 * Bill dashboard analytics
 */
export interface BillDashboard {
  summary: {
    total_bills: number;
    pending: number;
    paid: number;
    forwarded: number;
    cancelled: number;
    expired: number;
    overdue: number;
    total_amount: number;
    total_paid: number;
    total_outstanding: number;
    avg_bill_amount: number;
    unique_customers: number;
  };
  by_cluster?: Array<{
    cluster: string;
    count: number;
    amount: number;
    paid: number;
  }>;
  by_bill_code?: Array<{
    bill_code: string;
    count: number;
    amount: number;
    paid: number;
  }>;
  trend?: Array<{
    date: string;
    bills_created: number;
    amount_created: number;
    bills_paid: number;
    amount_paid: number;
  }>;
}

/**
 * Payment link response
 */
export interface PaymentLinkResponse {
  checkout_url: string;
}

/**
 * Public bill lookup request
 */
export interface PublicBillLookupRequest {
  biller_code: string;
  bill_id: string;
}

/**
 * Public bill lookup response
 */
export interface PublicBillLookupResponse {
  id: string;
  bill_id: string;
  bill_code?: string;
  bill_season?: string;
  cluster?: string;
  ext_customer_id?: string;
  customer_name?: string;
  description?: string;
  amount: number;
  service_charge: number;
  penalty_amount: number;
  total_due: number;
  amount_due: number;
  paid: number;
  currency: string;
  client?: {
    uniqueName: string;
    name: string;
  };
  start_at?: string;
  due_at?: string;
  start_at_time?: number;
  due_at_time?: number;
  expires_at?: string;
  original_due_at?: string;
  payment_status: string;
  penalty_type?: string;
  penalty_fee?: number;
  max_penalty_amount?: number;
  penalty_recurring?: string;
}

/**
 * Biller settings request
 */
export interface BillerSettingsRequest {
  biller_code?: string;
  biller_name?: string;
  biller_category?: string;
  biller_description?: string;
  icon_url?: string;
  service_charge_rate?: number;
  service_charge_type?: string;
  min_service_charge?: number;
  max_service_charge?: number;
  service_charge_ranges?: Array<{
    min_amount: number;
    max_amount: number;
    rate: number;
  }>;
  clusters?: string[];
  bill_codes?: Array<{
    code: string;
    name: string;
    description?: string;
  }>;
  webhook_url?: string;
  webhook_secret?: string;
  settlement_bank_code?: string;
  settlement_account_number?: string;
  settlement_account_name?: string;
  short_code?: string;
  biller_prefix?: string;
  [key: string]: unknown;
}

/**
 * Biller settings response
 */
export interface BillerSettingsResponse {
  configured: boolean;
  settings?: {
    id: string;
    biller_code: string;
    biller_name: string;
    biller_category?: string;
    biller_description?: string;
    icon_url?: string;
    service_charge_rate: number;
    service_charge_type: string;
    min_service_charge?: number;
    max_service_charge?: number;
    service_charge_ranges?: Array<{
      min_amount: number;
      max_amount: number;
      rate: number;
    }>;
    clusters: string[];
    bill_codes: Array<{
      code: string;
      name: string;
      description?: string;
    }>;
    webhook_url?: string;
    webhook_secret_configured: boolean;
    settlement_bank_code?: string;
    settlement_account_number?: string;
    settlement_account_name?: string;
    settlement_accounts?: Array<unknown>;
    short_code?: string;
    biller_prefix?: string;
    is_active: boolean;
    requires_external_settlement: boolean;
    config?: Record<string, unknown>;
    created_at: string;
    updated_at: string;
  };
}

/**
 * Update bill request (partial update - only provided fields are updated)
 */
export interface UpdateBillRequest {
  amount?: number;
  currency?: string;
  due_date?: string;
  start_date?: string;
  expires_date?: string;
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  customer_id?: string;
  description?: string;
  bill_code?: string;
  cluster?: string;
  penalty?: Penalty;
  metadata?: Record<string, unknown>;
}

/**
 * Delete bill response
 */
export interface DeleteBillResponse {
  message: string;
}

/**
 * Record manual payment request
 */
export interface RecordManualPaymentRequest {
  amount: number;
  source?: string;
  payment_method?: string;
  reference?: string;
  note?: string;
}

/**
 * Record manual payment response
 */
export interface RecordManualPaymentResponse {
  payment_id: string;
  amount: number;
  bill_status: string;
  balance_due: number;
}

/**
 * Send payment reminder request
 */
export interface SendPaymentReminderRequest {
  message?: string;
}

/**
 * Send payment reminder response
 */
export interface SendPaymentReminderResponse {
  sent: boolean;
  reminder_count: number;
  last_reminder_sent_at: string;
}

/**
 * Generate bill ID response
 */
export interface GenerateBillIdResponse {
  bill_id: string;
}

/**
 * Initiate checkout response
 */
export interface InitiateCheckoutResponse {
  payment_link_slug: string;
  balance_due: number;
  currency: string;
  checkout_url: string;
}
