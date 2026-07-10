import { ValidationError } from '../errors';
import { InitializePaymentRequest, SubmitPaymentRequest } from '../types';

/**
 * Validate API key format
 */
export function validateApiKey(apiKey: string): void {
  if (!apiKey || typeof apiKey !== 'string' || apiKey.trim().length === 0) {
    throw new ValidationError('API key is required and must be a non-empty string', 'apiKey');
  }
}

/**
 * Validate API secret format
 */
export function validateApiSecret(apiSecret: string): void {
  if (!apiSecret || typeof apiSecret !== 'string' || apiSecret.trim().length === 0) {
    throw new ValidationError('API secret is required and must be a non-empty string', 'apiSecret');
  }
}

/**
 * Validate passphrase format
 */
export function validatePassphrase(passphrase: string): void {
  if (!passphrase || typeof passphrase !== 'string' || passphrase.trim().length === 0) {
    throw new ValidationError('Passphrase is required and must be a non-empty string', 'passphrase');
  }
}

/**
 * Validate payment initialization request
 */
export function validateInitializePaymentRequest(data: InitializePaymentRequest): void {
  if (!data.amount || typeof data.amount !== 'number' || data.amount <= 0) {
    throw new ValidationError('Amount must be a positive number', 'amount', data.amount);
  }

  if (!data.reference || typeof data.reference !== 'string' || data.reference.trim().length === 0) {
    throw new ValidationError('Reference is required and must be a non-empty string', 'reference', data.reference);
  }

  if (data.currency && typeof data.currency !== 'string') {
    throw new ValidationError('Currency must be a string', 'currency', data.currency);
  }

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
  if (!data.channel || typeof data.channel !== 'string' || data.channel.trim().length === 0) {
    throw new ValidationError('Channel is required and must be a non-empty string', 'channel', data.channel);
  }

  if (data.phoneNumber && typeof data.phoneNumber !== 'string') {
    throw new ValidationError('Phone number must be a string', 'phoneNumber', data.phoneNumber);
  }

  if (data.accountNumber && typeof data.accountNumber !== 'string') {
    throw new ValidationError('Account number must be a string', 'accountNumber', data.accountNumber);
  }

}

/**
 * Validate payment ID
 */
export function validatePaymentId(paymentId: string): void {
  if (!paymentId || typeof paymentId !== 'string' || paymentId.trim().length === 0) {
    throw new ValidationError('Payment ID is required and must be a non-empty string', 'paymentId');
  }
}

/**
 * Validate phone number for OTP
 */
export function validatePhoneNumber(phoneNumber: string): void {
  if (!phoneNumber || typeof phoneNumber !== 'string' || phoneNumber.trim().length === 0) {
    throw new ValidationError('Phone number is required and must be a non-empty string', 'phoneNumber');
  }
}

/**
 * Validate OTP code
 */
export function validateOTPCode(otpCode: string | number): void {
  if (!otpCode || otpCode.toString().trim().length === 0) {
    throw new ValidationError('OTP code is required and must be a non-empty string or number', 'otpCode');
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
