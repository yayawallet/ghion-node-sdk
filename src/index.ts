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
  CheckoutResponse,
  QRPaymentResponse,
  OTPSendResponse,
  OTPValidateResponse,
  Provider,
  QRInfo,
  Merchant,
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
  Penalty,
  Escrow,
  ListEscrowsRequest,
  ListEscrowsResponse,
  PullEscrowFundsResponse,
  DirectPaySettings,
  GetDirectPaySettingsResponse,
  UpdateDirectPaySettingsRequest,
  TestDirectPaySettingsRequest,
  TestDirectPaySettingsResponse,
} from './types';

// Enums
export { PaymentStatus, WebhookEventType, BillStatus, EscrowStatus } from './types';

// Errors
export {
  GhionError,
  ConfigurationError,
  AuthenticationError,
  ApiError,
  ValidationError,
  NetworkError,
  PaymentError,
  BillError,
  WebhookError,
  RateLimitError,
} from './errors';
