/**
 * Checkout and QR Payment Example
 * 
 * This example demonstrates how to:
 * - Initialize a payment with checkout URL
 * - Get checkout information with QR, merchant, and provider details
 * - Pay using QR code
 * - Handle different payment methods (USSD, OTP, QR)
 */

import * as dotenv from 'dotenv';
import { GhionClient } from '../src';

// Load environment variables from examples directory
dotenv.config({ path: require('path').join(__dirname, '.env') });

// Initialize the client with your credentials
const client = new GhionClient({
  apiKey: process.env.GHION_API_KEY || 'your-api-key',
  apiSecret: process.env.GHION_API_SECRET || 'your-api-secret',
  passphrase: process.env.GHION_API_PASSPHRASE || 'your-passphrase',
});

async function checkoutAndQRPaymentFlow() {
  try {
    console.log('=== Checkout and QR Payment Example ===\n');

    // Step 1: Initialize payment with checkout URLs
    console.log('Step 1: Initializing payment with checkout URLs...');
    const initResponse = await client.initializePayment({
      amount: 150,
      currency: 'ETB',
      reference: `order_${Date.now()}`,
      description: 'Purchase of Cappuccino',
      returnUrl: 'http://localhost:3000/success',
      cancelUrl: 'http://localhost:3000/cancel',
    });

    console.log('Payment initialized:', {
      id: initResponse.id,
      amount: initResponse.amount,
      currency: initResponse.currency,
      status: initResponse.status,
      checkout_url: initResponse.checkout_url,
    });
    console.log('');

    // Step 2: Get checkout information
    console.log('Step 2: Getting checkout information...');
    const checkoutInfo = await client.getCheckout(initResponse.id);

    console.log('Checkout information:', {
      id: checkoutInfo.id,
      reference: checkoutInfo.reference,
      amount: checkoutInfo.amount,
      total_amount: checkoutInfo.total_amount,
      gateway_fee: checkoutInfo.gateway_fee,
      status: checkoutInfo.status,
      is_expired: checkoutInfo.is_expired,
      expires_at: checkoutInfo.expires_at,
      checkout_url: checkoutInfo.checkout_url,
    });

    // Display merchant information
    if (checkoutInfo.merchant) {
      console.log('\nMerchant:', {
        name: checkoutInfo.merchant.name,
        business_name: checkoutInfo.merchant.business_name,
        slug: checkoutInfo.merchant.slug,
      });
    }

    // Display available channels
    if (checkoutInfo.available_channels) {
      console.log('\nAvailable channels:');
      checkoutInfo.available_channels.forEach((channel) => {
        console.log(`  - ${channel.name} (${channel.code})`);
        console.log(`    Type: ${channel.type}`);
        console.log(`    Supports OTP: ${channel.supports_otp}`);
      });
    }

    // Display providers
    if (checkoutInfo.providers) {
      console.log('\nProviders:');
      checkoutInfo.providers.forEach((provider) => {
        console.log(`  - ${provider.name} (${provider.code})`);
        console.log(`    Methods: ${provider.methods.join(', ')}`);
      });
    }

    // Display QR information if available
    if (checkoutInfo.qr) {
      console.log('\nQR Code Information:');
      console.log(`  QR Image URL: ${checkoutInfo.qr.qr_image_url}`);
      console.log(`  QR Payload: ${checkoutInfo.qr.qr_payload.substring(0, 50)}...`);
    }

    console.log('');

    // Step 3: Pay with QR code
    console.log('Step 3: Initiating QR payment...');
    const qrPayment = await client.payWithQR(initResponse.id);

    console.log('QR payment initiated:', {
      type: qrPayment.type,
      transaction_id: qrPayment.transaction_id,
      status: qrPayment.status,
      qr_image_url: qrPayment.qr_image_url,
    });

    console.log('\nQR Code for scanning:');
    console.log(qrPayment.qr_image_url);
    console.log('');

    console.log('=== Example completed successfully ===');
    console.log('\nNext steps:');
    console.log('1. Display the QR code to the customer');
    console.log('2. Customer scans QR code with their payment app');
    console.log('3. Monitor payment status using getPaymentStatus()');
    console.log('4. Handle webhook events for payment completion');

  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the example
checkoutAndQRPaymentFlow();
