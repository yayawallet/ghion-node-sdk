import { ValidationError } from '../errors';
import { InitializePaymentRequest, SubmitPaymentRequest } from '../types';

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
