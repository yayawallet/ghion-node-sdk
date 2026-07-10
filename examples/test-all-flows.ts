/**
 * Comprehensive SDK Test Flow
 * 
 * Unlike the quick-start example which simulates a real-world transaction path,
 * this script acts as a "kitchen sink" test. It forcefully executes every major 
 * SDK method sequentially to verify API connectivity, authentication, and 
 * response parsing across all endpoints.
 */
import * as dotenv from 'dotenv';
import { GhionClient } from '../src';

dotenv.config({ path: require('path').join(__dirname, '.env') });

const client = new GhionClient({
  apiKey: process.env.GHION_API_KEY || 'your-api-key',
  apiSecret: process.env.GHION_API_SECRET || 'your-api-secret',
  passphrase: process.env.GHION_API_PASSPHRASE || 'your-passphrase',
});

async function runPaymentFlow() {
  console.log('--- Starting Ghion SDK Integration Tests ---');
  let paymentId: string;

  try {
    // 1. Initialize
    console.log('\n1. Initializing Payment...');
    const initRes = await client.initializePayment({
      amount: 50,
      currency: 'ETB',
      reference: `test_flow_${Date.now()}`,
      description: 'Comprehensive Test Flow',
    });
    paymentId = initRes.id;
    console.log(`Payment Initialized. ID: ${paymentId}`);
    const channels = initRes.available_channels || initRes.channels || [];
    console.log(`Available channels: ${channels.map((c: any) => c.name).join(', ')}`);

    // 2. Checkout Details
    console.log('\n2. Getting Checkout Details...');
    const checkoutRes = await client.getCheckout(paymentId);
    console.log(`Checkout response status: ${checkoutRes.status}`);
    if (checkoutRes.qr) {
      console.log(`QR info present: ${checkoutRes.qr.qr_image_url}`);
    }

    // 3. Status
    console.log('\n3. Getting Payment Status...');
    const statusRes = await client.getPaymentStatus(paymentId);
    console.log(`Status: ${statusRes.status}`);

    // 4. Generate QR directly
    console.log('\n4. Requesting QR Code explicitly...');
    try {
      const qrRes = await client.payWithQR(paymentId);
      console.log(`QR explicitly generated: ${qrRes.qr_image_url}`);
    } catch (e: any) {
      console.log(`Explicit QR generation failed (expected if channel isn't 'other' by default): ${e.message}`);
    }

    // 5. OTP Send
    console.log('\n5. Sending OTP...');
    try {
      const otpRes = await client.sendOTP(paymentId, '0911234567');
      console.log(`OTP Send response: ${otpRes.status}`);
    } catch (e: any) {
      console.log(`OTP Send failed (expected if not OTP-supported wallet): ${e.message}`);
    }

    console.log('\n--- All SDK Methods Executed Successfully ---');
  } catch (error: any) {
    console.error('\nTest Failed with Error:', error.message);
  }
}

runPaymentFlow();