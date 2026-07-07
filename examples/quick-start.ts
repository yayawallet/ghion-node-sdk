/**
 * Basic usage example for @ghion-finances/node-sdk
 * 
 * This example demonstrates how to:
 * - Initialize the SDK client
 * - Create a payment session
 * - Submit a payment
 * - Check payment status
 * - Handle webhooks
 */

import * as dotenv from 'dotenv';
import { GhionClient, PaymentStatus } from '../src';

// Load environment variables from examples directory
dotenv.config({ path: require('path').join(__dirname, '.env') });

// Initialize the client with your credentials
const client = new GhionClient({
  apiKey: process.env.GHION_API_KEY || 'your-api-key',
  apiSecret: process.env.GHION_API_SECRET || 'your-api-secret',
  passphrase: process.env.GHION_API_PASSPHRASE || 'your-passphrase',
  mode: 'test', // Use 'live' for production
});

async function basicPaymentFlow() {
  try {
    console.log('=== Basic Payment Flow Example ===\n');

    // Step 1: Initialize a payment session
    console.log('Step 1: Initializing payment...');
    const initResponse = await client.initializePayment({
      amount: 100,
      currency: 'ETB',
      reference: `order_${Date.now()}`,
      description: 'Test payment',
      webhookUrl: 'https://your-domain.com/webhook',
    });

    console.log('Payment initialized:', {
      id: initResponse.id,
      amount: initResponse.amount,
      currency: initResponse.currency,
      status: initResponse.status,
      channels: initResponse.available_channels?.map((c) => c.name) || initResponse.channels?.map((c) => c.name),
    });
    console.log('');

    // Step 2: Submit payment with a chosen channel
    console.log('Step 2: Submitting payment...');
    const channels = initResponse.available_channels || initResponse.channels;
    const channelId = channels[0].code || channels[0].id || channels[0].name;
    const submitResponse = await client.submitPayment(initResponse.id, {
      channel: channelId,
      phoneNumber: '+251911234567',
    });

    console.log('Payment submitted:', {
      id: submitResponse.id,
      status: submitResponse.status,
      transactionId: submitResponse.transaction_id,
      message: submitResponse.message,
    });
    console.log('');

    // Step 3: Check payment status
    console.log('Step 3: Checking payment status...');
    const statusResponse = await client.getPaymentStatus(initResponse.id);

    console.log('Payment status:', {
      id: statusResponse.id,
      status: statusResponse.status,
      amount: statusResponse.amount,
      currency: statusResponse.currency,
      reference: statusResponse.reference,
    });
    console.log('');

    // Handle different payment statuses
    switch (statusResponse.status) {
      case PaymentStatus.COMPLETED:
        console.log('Payment completed successfully!');
        break;
      case PaymentStatus.FAILED:
        console.log('Payment failed:', statusResponse.failure_reason);
        break;
      case PaymentStatus.PENDING:
        console.log('Payment is pending...');
        break;
      default:
        console.log('Payment status:', statusResponse.status);
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the example
basicPaymentFlow();
