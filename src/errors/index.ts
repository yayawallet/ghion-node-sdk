/**
 * Base error class for all SDK errors
 */
export class GhionError extends Error {
  public readonly code: string;
  public readonly details?: Record<string, unknown>;

  constructor(message: string, code: string = 'GHION_ERROR', details?: Record<string, unknown>) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Configuration error - invalid SDK configuration
 */
export class ConfigurationError extends GhionError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'CONFIGURATION_ERROR', details);
  }
}

/**
 * Authentication error - invalid credentials or signature
 */
export class AuthenticationError extends GhionError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'AUTHENTICATION_ERROR', details);
  }
}

/**
 * API request error - failed HTTP request
 */
export class ApiError extends GhionError {
  public readonly statusCode?: number;
  public readonly response?: Record<string, unknown>;

  constructor(message: string, statusCode?: number, response?: Record<string, unknown>) {
    super(message, 'API_ERROR', { statusCode, response });
    this.statusCode = statusCode;
    this.response = response;
  }
}

/**
 * Validation error - invalid input parameters
 */
export class ValidationError extends GhionError {
  constructor(message: string, field?: string, value?: unknown) {
    super(message, 'VALIDATION_ERROR', { field, value });
  }
}

/**
 * Network error - connection or timeout issues
 */
export class NetworkError extends GhionError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'NETWORK_ERROR', details);
  }
}

/**
 * Payment error - payment processing failures
 */
export class PaymentError extends GhionError {
  public readonly paymentId?: string;

  constructor(message: string, paymentId?: string, details?: Record<string, unknown>) {
    super(message, 'PAYMENT_ERROR', { paymentId, ...details });
    this.paymentId = paymentId;
  }
}

/**
 * Webhook error - webhook signature verification or processing failures
 */
export class WebhookError extends GhionError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'WEBHOOK_ERROR', details);
  }
}

/**
 * Rate limit error - API rate limit exceeded
 */
export class RateLimitError extends GhionError {
  public readonly retryAfter?: number;

  constructor(message: string, retryAfter?: number) {
    super(message, 'RATE_LIMIT_ERROR', { retryAfter });
    this.retryAfter = retryAfter;
  }
}
