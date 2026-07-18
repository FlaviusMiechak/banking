// app/api/payments/create-payment-intent/route.ts
import { NextRequest, NextResponse } from 'next/server';

// ✅ Mark route as dynamic (prevents static generation)
export const dynamic = 'force-dynamic';

// ✅ Lazy initialization - only created when needed
function getStripeClient() {
  const apiKey = process.env.STRIPE_SECRET_KEY;
  
  if (!apiKey) {
    throw new Error('STRIPE_SECRET_KEY environment variable is not set');
  }
  
  // Use dynamic import to avoid top-level issues
  const Stripe = require('stripe');
  return new Stripe(apiKey, {
    // ✅ Use a valid API version
    apiVersion: '2025-02-24.acacia', // Latest stable version as of 2025
  });
}

export async function POST(req: Request) {
  try {
    const { amount } = await req.json();

    // Validate amount
    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount' },
        { status: 400 }
      );
    }

    // ✅ Get Stripe client lazily
    const stripe = getStripeClient();

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // ✅ Convert to cents
      currency: 'usd',
      automatic_payment_methods: {
        enabled: true,
      },
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error: any) {
    console.error('Stripe error:', error);

    return NextResponse.json(
      {
        error: error.message || 'Payment intent failed',
      },
      { status: 500 }
    );
  }
}