## Changelog

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