import * as crypto from 'crypto';

/**
 * Generate HMAC-SHA256 signature for API authentication
 * @param timestamp - Unix timestamp in seconds
 * @param method - HTTP method (GET, POST, etc.)
 * @param path - API path including /api/v1 prefix
 * @param body - Request body as string
 * @param secret - API secret key
 * @returns Base64-encoded signature
 */
export function generateSignature(
  timestamp: number,
  method: string,
  path: string,
  body: string,
  secret: string
): string {
  const message = `${timestamp}${method}${path}${body}`;
  return crypto.createHmac('sha256', secret).update(message).digest('base64');
}

/**
 * Verify webhook signature
 * @param rawBody - Raw request body (Buffer or string)
 * @param signature - Signature from X-Ghion-Signature header
 * @param secret - API secret key
 * @returns True if signature is valid
 */
export function verifyWebhookSignature(
  rawBody: string | Buffer,
  signature: string,
  secret: string
): boolean {
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('base64');
  
  // Use timing-safe comparison to prevent timing attacks
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false;
  }
}

/**
 * Get current Unix timestamp in seconds
 * @returns Current timestamp
 */
export function getCurrentTimestamp(): number {
  return Math.floor(Date.now() / 1000);
}
