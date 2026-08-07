## Changelog

### 1.4.0 (2026-08-06)

**New Features:**
- Added complete Bill Payment API support for creating and managing bills
- Added `createBill` method to create single bills with customer information, due dates, and penalty configurations
- Added `createBulkBills` method to create multiple bills in a single request for batch billing cycles
- Added `listBills` method to list bills with filters (status, search, cluster, bill_code, date range, pagination)
- Added `getBillStatistics` method to retrieve aggregate counts and amounts for bills
- Added `getBillDashboard` method to get detailed analytics including summary statistics, trends, and breakdowns by cluster/bill code
- Added `getBillDetail` method to retrieve full bill details including penalty configuration, metadata, and payment history
- Added `updateBill` method to update bill properties (partial update - only provided fields are updated)
- Added `deleteBill` method to delete bills (only bills with no payments can be deleted)
- Added `recordManualPayment` method to record manual payments (cash, bank transfer, etc.) for reconciliation purposes
- Added `getBillPaymentLink` method to generate shareable payment links for bills
- Added `getBillerSettings` method to retrieve biller configuration including biller_code, clusters, bill codes, and webhook settings
- Added `updateBillerSettings` method to update biller configuration
- Added `publicBillLookup` method for public bill lookup (no authentication) used by bank branches and mobile banking apps
- Added `BillStatus` enum (pending, paid, forwarded, cancelled, expired, overdue)
- Added `Penalty` interface for late payment penalty configuration
- Added comprehensive bill payment types: CreateBillRequest, BillResponse, BulkCreateBillsRequest, BulkCreateBillsResponse, ListBillsRequest, ListBillsResponse, BillStatistics, BillDashboard, PaymentLinkResponse, PublicBillLookupRequest, PublicBillLookupResponse, BillerSettingsRequest, BillerSettingsResponse, UpdateBillRequest, DeleteBillResponse, RecordManualPaymentRequest, RecordManualPaymentResponse
- Added validators for all bill payment requests with date format validation (Y-m-d), email validation, and penalty configuration validation
- Added `reference` field to `SubmitPaymentRequest` as optional parameter for order ID validation

**Improvements:**
- Enhanced date validation with Y-m-d format support for bill payment dates
- Added email validation for customer email fields
- Added penalty configuration validation (type, fee, max_amount, recurring)
- Updated `BillDashboard` response schema to include `summary` object with detailed statistics, `by_cluster`, `by_bill_code`, and `trend` arrays
- Updated `PublicBillLookupResponse` to flat object structure with `payment_status` (uppercase), `client.uniqueName`/`client.name`, `amount_due`, and other fields
- Added unit tests for all new bill payment methods including validation tests
- Added integration tests for all new bill payment endpoints

### 1.3.0 (2026-07-13)

**BREAKING CHANGES:**
- `WebhookEventType` enum values changed from `payment.*` to `transaction.*` to match the actual Ghion API event naming. This fixes webhook handling issues where the sandbox was sending `transaction.completed` but the SDK expected `payment.completed`. Update any webhook event handling logic that checks specific event type values:
  - `PAYMENT_COMPLETED` → `TRANSACTION_COMPLETED`
  - `PAYMENT_FAILED` → `TRANSACTION_FAILED`
  - `PAYMENT_CANCELLED` → Removed (not used by API)
  - `PAYMENT_EXPIRED` → `TRANSACTION_EXPIRED`
- `ValidationError.details.field` now uses human-readable labels (e.g., 'API key', 'Payment ID') instead of property names (e.g., 'apiKey', 'paymentId'). This improves error message readability but may break code that checks specific field values. Update any error handling logic that depends on exact field name matching.

**Improvements:**
- Enhanced validation error messages with human-readable field labels for better developer experience
- Collapsed validator duplication using helper functions for cleaner codebase
- Added exponential backoff retry logic for API requests on rate limits (429) and transient failures
- Fixed inconsistent field naming in validation errors (now consistently Title Case)
- Enhanced data redaction to perform deep recursive redaction on nested objects and arrays with depth limit protection
- Added comprehensive test coverage for API request handling, retry logic, and data redaction
- Removed shadowed variable declarations for cleaner code

**New Features:**
- Added `TRANSACTION_REFUNDED` event type for refund notifications
- Added `TRANSACTION_PARTIALLY_REFUNDED` event type for partial refund notifications
- Added `TRANSACTION_DISPUTED` event type for dispute notifications
- Added `TRANSACTION_UPDATED` event type for general transaction updates

**Bug Fixes:**
- Fixed webhook event type mismatch between SDK and actual Ghion API
- Webhook handlers now correctly receive and process transaction events from both sandbox and production
- Fixed optional field validation to properly reject non-string falsy values

### 1.1.1 (2026-07-10)

**New Features:**
- Added `payWithQR` method to directly generate QR codes for "Other" channels
- Added `getCheckout` method to retrieve full checkout information, including merchant details and QR
- Added `sendOTP` and `validateOTP` methods for seamless wallet integrations (e.g., YaYa Wallet)
- Added `checkoutBaseUrl` configuration option for checkout-specific endpoints
- Added comprehensive input validation for all API methods
- Added phone number and OTP code validation

**Improvements:**
- Enhanced error handling with detailed validation messages
- Updated documentation and examples to cover QR and OTP flows
- Added test-all-flows example for comprehensive SDK testing
- Improved webhook signature verification documentation

**Bug Fixes:**
- Fixed signature generation for checkout endpoints
- Removed unnecessary fields from submitPayment request
- Fixed OTP payload field names for API compatibility

### 1.0.0 (2026-07-07)

- Initial release
- Full TypeScript support
- HMAC-SHA256 authentication
- Webhook signature verification
- Comprehensive error handling
- Input validation
- Express.js integration examples