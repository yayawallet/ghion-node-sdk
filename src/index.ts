/**
 * @ghion-finances/node-sdk
 * 
 * Node.js SDK for Ghion Finances payment gateway
 * 
 * @example
 * ```typescript
 * import { GhionClient } from '@ghion-finances/node-sdk';
 * 
 * const client = new GhionClient({
 *   apiKey: 'your-api-key',
 *   apiSecret: 'your-api-secret',
 *   passphrase: 'your-passphrase',
 * });
 * ```
 */

// Main client
export { GhionClient } from './client/GhionClient';

// Types
export type {
  GhionConfig,
  InitializePaymentRequest,
  InitializePaymentResponse,
  PaymentChannel,
  SubmitPaymentRequest,
  SubmitPaymentResponse,
  PaymentStatusResponse,
  WebhookEvent,
  ApiError as ApiErrorResponse,
  HttpMethod,
} from './types';

// Enums
export { PaymentStatus, WebhookEventType } from './types';

// Errors
export {
  GhionError,
  ConfigurationError,
  AuthenticationError,
  ApiError,
  ValidationError,
  NetworkError,
  PaymentError,
  WebhookError,
  RateLimitError,
} from './errors';
