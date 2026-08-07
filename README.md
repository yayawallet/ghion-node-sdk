# @ghion-finances/node-sdk

A type-safe Node.js SDK for the Ghion Finances payment gateway. Built with security, maintainability, and scalability in mind for developers maintaining or contributing to this repository.

## Features

- **Type-Safe**: Full TypeScript support with comprehensive type definitions
- **Secure**: HMAC-SHA256 authentication with timing-safe signature verification
- **Robust**: Comprehensive error handling with custom error classes
- **Validated**: Built-in input validation for all API requests
- **Express-Ready**: Seamless integration with Express.js middleware
- **Retry Logic**: Automatic retry for transient failures and rate limits
- **Modern**: Built with modern Node.js (18+) and TypeScript best practices
- **Multi-Channel**: Support for USSD, QR, OTP, and card payment methods
- **Real-time**: Built-in support for real-time payment status monitoring
- **Bill Payment**: Complete bill management API for creating, listing, and analyzing bills

## Repository Structure

```text
express-sdk/
├── src/
│   ├── client/           # HTTP client and API methods
│   ├── types/            # TypeScript type definitions
│   ├── errors/           # Custom error classes
│   ├── utils/            # Utility functions (crypto, validation)
│   └── middleware/       # Express.js middleware for webhooks
├── examples/             # Usage examples (Express server, quick start)
├── tests/                # Test files (unit and integration)
├── docs/                 # Additional documentation
└── dist/                 # Compiled JavaScript output
```

## Setup for Development

### 1. Prerequisites
- Node.js >= 18.0.0
- TypeScript >= 4.0.0
- Git
- npm or yarn

### 2. Clone the Repository
```bash
git clone https://github.com/yayawallet/ghion-node-sdk.git
cd ghion-node-sdk
```

### 3. Install Dependencies
```bash
npm install
```

## Adding New Features

### 1. Adding a New API Endpoint
1. **Define the types** in `src/types/index.ts` (Requests, Responses, Enums).
2. **Add validation** in `src/utils/validator.ts` if necessary.
3. **Implement the method** in `src/client/GhionClient.ts` using the generic `apiRequest` method.
4. **Export the types/methods** in `src/index.ts`.
5. **Add unit tests** in `tests/unit.test.ts`.
6. **Add integration tests** in `tests/integration.test.ts` (if applicable).

### 2. Adding a New Error Type
1. **Define the error class** in `src/errors/index.ts`.
2. **Export the error** in `src/index.ts`.
3. **Add tests** in `tests/unit.test.ts`.

## Testing the SDK

### Running All Tests
Run all tests across the SDK (unit tests only):
```bash
npm test
```

### Running Package-Specific Tests
Run tests for specific packages:
```bash
# Unit tests
npm test tests/unit.test.ts

# Integration tests (requires credentials)
npm test tests/integration.test.ts
```

### Test Coverage
Generate coverage report:
```bash
npm run test:coverage
```

**Current Coverage:**
- Unit tests cover client configuration, validation, crypto functions, and error handling
- Integration tests verify real API calls for payment and bill operations

### Unit Tests (No Credentials Required)
Unit tests verify SDK logic without making API calls:
- Client configuration and instantiation
- Input validation functions
- Cryptographic signature generation
- Webhook signature verification
- Error type constructors
- Helper functions

Run unit tests:
```bash
npm test tests/unit.test.ts
```

### Integration Tests (Credentials Required)
Integration tests make real API calls to verify SDK functionality with the Ghion API.

**Setup:**
1. Create a `.env` file in the project root:
```env
GHION_API_KEY=your_api_key
GHION_API_SECRET=your_api_secret
GHION_API_PASSPHRASE=your_passphrase
TEST_PHONE_NUMBER=+251911234567
TEST_OTP_CODE=123456  # For OTP validation test
```

2. Run integration tests:
```bash
npm test tests/integration.test.ts
```

**Integration Test Coverage:**
- **Initialize Payment**: Tests payment initialization and channel availability
- **QR Payment**: Tests QR code generation and checkout retrieval
- **OTP Payment**: Tests OTP sending and validation (requires phone number)
- **Payment Status**: Tests payment status retrieval
- **Bill Payment**: Tests bill creation, listing, and management

**Test Organization:**
- Unit tests are located in `tests/unit.test.ts`
- Integration tests are located in `tests/integration.test.ts`
- Tests use Jest as the test runner

### Running Examples
See the `examples/` directory for complete working scripts:

```bash
# Quick start example
npx ts-node examples/quick-start.ts

# Express server example
npx ts-node examples/express-server.ts
```

### CI/CD Testing
For continuous integration, run:
```bash
# Run all tests with coverage
npm run test:coverage
```

## Code Quality & Guidelines

- **Style**: Use Prettier to format code before committing (`npm run format`).
- **Linting**: Use ESLint to ensure code quality (`npm run lint`).
- **TypeScript**: All code must be written in TypeScript with proper type definitions.
- **Documentation**: All exported functions, types, and constants must have proper JSDoc comments.
- **Error Handling**: Use the custom error types in `src/errors` instead of generic errors. Never expose sensitive information in error messages. Redact sensitive data from logs.

## Security Considerations

- **HMAC-SHA256 Authentication**: All API requests are signed using HMAC-SHA256.
- **Timing-Safe Comparison**: Webhook signatures use timing-safe comparison to prevent timing attacks.
- **Input Validation**: All inputs are validated before being sent over the network.
- **Sensitive Data Redaction**: Error responses automatically redact sensitive information (API keys, passphrases, signatures).

## Contributing

Contributions are welcome! Please ensure:
1. Code adheres to existing style (ESLint + Prettier).
2. All tests pass (`npm test`).
3. TypeScript types are properly defined.
4. Documentation is updated.
5. Changes are backwards compatible when possible.

Please open an issue to discuss proposed changes before creating a pull request.

For release guidelines, see [RELEASE.md](RELEASE.md).

For developer usage guide, see [DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md).

## License

See [LICENSE](LICENSE) file for details.