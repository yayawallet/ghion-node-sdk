import { ValidationError } from '../errors';
import { InitializePaymentRequest, SubmitPaymentRequest, CreateBillRequest, BulkCreateBillsRequest, ListBillsRequest, PublicBillLookupRequest, RecordManualPaymentRequest, BillerSettingsRequest } from '../types';

/**
 * Helper function to validate non-empty strings
 */
function requireNonEmptyString(value: unknown, field: string): asserts value is string {
  if (!value || typeof value !== 'string' || value.trim().length === 0) {
    throw new ValidationError(`${field} is required and must be a non-empty string`, field, value);
  }
}

/**
 * Helper function to validate optional string fields
 */
function requireStringIfPresent(value: unknown, field: string): asserts value is string | undefined {
  if (value !== undefined && value !== null && typeof value !== 'string') {
    throw new ValidationError(`${field} must be a string if provided`, field, value);
  }
}

/**
 * Validate API key format
 */
export function validateApiKey(apiKey: string): void {
  requireNonEmptyString(apiKey, 'API key');
}

/**
 * Validate API secret format
 */
export function validateApiSecret(apiSecret: string): void {
  requireNonEmptyString(apiSecret, 'API secret');
}

/**
 * Validate passphrase format
 */
export function validatePassphrase(passphrase: string): void {
  requireNonEmptyString(passphrase, 'Passphrase');
}

/**
 * Validate payment initialization request
 */
export function validateInitializePaymentRequest(data: InitializePaymentRequest): void {
  if (!data.amount || typeof data.amount !== 'number' || data.amount <= 0) {
    throw new ValidationError('Amount must be a positive number', 'amount', data.amount);
  }

  requireNonEmptyString(data.reference, 'Reference');
  requireStringIfPresent(data.currency, 'Currency');

  if (data.webhookUrl && !isValidUrl(data.webhookUrl)) {
    throw new ValidationError('Webhook URL must be a valid URL', 'webhookUrl', data.webhookUrl);
  }

  if (data.returnUrl && !isValidUrl(data.returnUrl)) {
    throw new ValidationError('Return URL must be a valid URL', 'returnUrl', data.returnUrl);
  }

  if (data.cancelUrl && !isValidUrl(data.cancelUrl)) {
    throw new ValidationError('Cancel URL must be a valid URL', 'cancelUrl', data.cancelUrl);
  }
}

/**
 * Validate payment submission request
 */
export function validateSubmitPaymentRequest(data: SubmitPaymentRequest): void {
  requireNonEmptyString(data.channel, 'Channel');
  requireStringIfPresent(data.phoneNumber, 'Phone number');
  requireStringIfPresent(data.accountNumber, 'Account number');
}

/**
 * Validate payment ID
 */
export function validatePaymentId(paymentId: string): void {
  requireNonEmptyString(paymentId, 'Payment ID');
}

/**
 * Validate phone number for OTP
 */
export function validatePhoneNumber(phoneNumber: string): void {
  requireNonEmptyString(phoneNumber, 'Phone number');
}

/**
 * Validate OTP code
 */
export function validateOTPCode(otpCode: string | number): void {
  if (!otpCode || otpCode.toString().trim().length === 0) {
    throw new ValidationError('OTP code is required and must be a non-empty string or number', 'OTP code');
  }
}

/**
 * Check if string is a valid URL
 */
function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate date format (Y-m-d)
 */
function isValidDate(dateString: string): boolean {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateString)) return false;
  
  const date = new Date(dateString);
  return !isNaN(date.getTime());
}

/**
 * Validate create bill request
 */
export function validateCreateBillRequest(data: CreateBillRequest): void {
  requireNonEmptyString(data.bill_id, 'Bill ID');
  
  if (!data.amount || typeof data.amount !== 'number' || data.amount <= 0) {
    throw new ValidationError('Amount must be a positive number', 'amount', data.amount);
  }
  
  requireNonEmptyString(data.due_date, 'Due date');
  if (!isValidDate(data.due_date)) {
    throw new ValidationError('Due date must be in Y-m-d format', 'due_date', data.due_date);
  }
  
  requireStringIfPresent(data.currency, 'Currency');
  requireStringIfPresent(data.start_date, 'Start date');
  requireStringIfPresent(data.expires_date, 'Expires date');
  requireStringIfPresent(data.customer_name, 'Customer name');
  requireStringIfPresent(data.customer_phone, 'Customer phone');
  requireStringIfPresent(data.customer_email, 'Customer email');
  requireStringIfPresent(data.customer_id, 'Customer ID');
  requireStringIfPresent(data.description, 'Description');
  requireStringIfPresent(data.bill_code, 'Bill code');
  requireStringIfPresent(data.cluster, 'Cluster');
  
  if (data.start_date && !isValidDate(data.start_date)) {
    throw new ValidationError('Start date must be in Y-m-d format', 'start_date', data.start_date);
  }
  
  if (data.expires_date && !isValidDate(data.expires_date)) {
    throw new ValidationError('Expires date must be in Y-m-d format', 'expires_date', data.expires_date);
  }
  
  if (data.customer_email && !isValidEmail(data.customer_email)) {
    throw new ValidationError('Customer email must be a valid email address', 'customer_email', data.customer_email);
  }
  
  if (data.penalty) {
    if (!['fixed', 'percentage'].includes(data.penalty.type)) {
      throw new ValidationError('Penalty type must be either "fixed" or "percentage"', 'penalty.type', data.penalty.type);
    }
    if (typeof data.penalty.fee !== 'number' || data.penalty.fee < 0) {
      throw new ValidationError('Penalty fee must be a non-negative number', 'penalty.fee', data.penalty.fee);
    }
    if (typeof data.penalty.max_amount !== 'number' || data.penalty.max_amount < 0) {
      throw new ValidationError('Penalty max amount must be a non-negative number', 'penalty.max_amount', data.penalty.max_amount);
    }
    if (!['daily', 'weekly', 'monthly', 'once'].includes(data.penalty.recurring)) {
      throw new ValidationError('Penalty recurring must be one of: daily, weekly, monthly, once', 'penalty.recurring', data.penalty.recurring);
    }
  }
}

/**
 * Validate bulk create bills request
 */
export function validateBulkCreateBillsRequest(data: BulkCreateBillsRequest): void {
  if (!Array.isArray(data.bills) || data.bills.length === 0) {
    throw new ValidationError('Bills must be a non-empty array', 'bills', data.bills);
  }
  
  data.bills.forEach((bill, index) => {
    try {
      validateCreateBillRequest(bill);
    } catch (error) {
      throw new ValidationError(`Bill at index ${index} is invalid: ${(error as Error).message}`, `bills[${index}]`, bill);
    }
  });
}

/**
 * Validate list bills request
 */
export function validateListBillsRequest(data: ListBillsRequest): void {
  requireStringIfPresent(data.search, 'Search');
  requireStringIfPresent(data.cluster, 'Cluster');
  requireStringIfPresent(data.bill_code, 'Bill code');
  requireStringIfPresent(data.from, 'From date');
  requireStringIfPresent(data.to, 'To date');
  
  if (data.from && !isValidDate(data.from)) {
    throw new ValidationError('From date must be in Y-m-d format', 'from', data.from);
  }
  
  if (data.to && !isValidDate(data.to)) {
    throw new ValidationError('To date must be in Y-m-d format', 'to', data.to);
  }
  
  if (data.page !== undefined && (typeof data.page !== 'number' || data.page < 1)) {
    throw new ValidationError('Page must be a positive number', 'page', data.page);
  }
  
  if (data.limit !== undefined && (typeof data.limit !== 'number' || data.limit < 1 || data.limit > 100)) {
    throw new ValidationError('Limit must be a number between 1 and 100', 'limit', data.limit);
  }
}

/**
 * Validate public bill lookup request
 */
export function validatePublicBillLookupRequest(data: PublicBillLookupRequest): void {
  requireNonEmptyString(data.biller_code, 'Biller code');
  requireNonEmptyString(data.bill_id, 'Bill ID');
}

/**
 * Validate bill ID
 */
export function validateBillId(id: string): void {
  requireNonEmptyString(id, 'Bill ID');
}

/**
 * Validate record manual payment request
 */
export function validateRecordManualPaymentRequest(data: RecordManualPaymentRequest): void {
  if (typeof data.amount !== 'number' || data.amount <= 0) {
    throw new ValidationError('Amount must be a positive number', 'amount', data.amount);
  }
}

/**
 * Validate biller settings request
 */
export function validateBillerSettingsRequest(data: BillerSettingsRequest): void {
  requireStringIfPresent(data.biller_name, 'Biller name');
  requireStringIfPresent(data.biller_category, 'Biller category');
  requireStringIfPresent(data.biller_description, 'Biller description');
  requireStringIfPresent(data.icon_url, 'Icon URL');
  requireStringIfPresent(data.webhook_url, 'Webhook URL');
  requireStringIfPresent(data.webhook_secret, 'Webhook secret');
  requireStringIfPresent(data.settlement_bank_code, 'Settlement bank code');
  requireStringIfPresent(data.settlement_account_number, 'Settlement account number');
  requireStringIfPresent(data.settlement_account_name, 'Settlement account name');

  if (data.service_charge_rate !== undefined && (typeof data.service_charge_rate !== 'number' || data.service_charge_rate < 0)) {
    throw new ValidationError('Service charge rate must be a non-negative number', 'service_charge_rate', data.service_charge_rate);
  }

  if (data.clusters !== undefined && !Array.isArray(data.clusters)) {
    throw new ValidationError('Clusters must be an array', 'clusters', data.clusters);
  }

  if (data.bill_codes !== undefined && !Array.isArray(data.bill_codes)) {
    throw new ValidationError('Bill codes must be an array', 'bill_codes', data.bill_codes);
  }
}

/**
 * Validate bill dashboard date parameters
 */
export function validateBillDashboardRequest(from?: string, to?: string): void {
  requireStringIfPresent(from, 'From date');
  requireStringIfPresent(to, 'To date');

  if (from && !isValidDate(from)) {
    throw new ValidationError('From date must be in Y-m-d format', 'from', from);
  }

  if (to && !isValidDate(to)) {
    throw new ValidationError('To date must be in Y-m-d format', 'to', to);
  }
}

/**
 * Check if string is a valid email
 */
function isValidEmail(email: string): boolean {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}
