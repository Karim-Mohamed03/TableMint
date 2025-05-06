// api/create-payment.ts (or .js if not using TypeScript)
import { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';
import * as dotenv from 'dotenv';
dotenv.config();


// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-04-30.basil',
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { paymentMethodId, amount } = req.body;

    // Create a PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      payment_method: paymentMethodId,
      amount: amount, // Amount in smallest currency unit (e.g., cents)
      currency: 'egp', // Egyptian Pound
      confirmation_method: 'manual',
      confirm: true,
      return_url: `${process.env.DOMAIN_URL || 'https://yourdomain.com'}/payment-success`,
      metadata: {
        tableNumber: '15', // You can add any metadata you need
      },
    });

    // Return the client secret to the client
    res.status(200).json({
      clientSecret: paymentIntent.client_secret,
      status: paymentIntent.status,
    });
  } catch (error) {
    console.error('Error processing payment:', error);
    res.status(500).json({ 
      error: 'Payment processing failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}