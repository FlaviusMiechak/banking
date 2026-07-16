// app/api/verify-cardholder/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { cardServiceServer } from '@/lib/services/card.service.server';
import { syncCardStatus } from '@/lib/utils/sync-card-status';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  //apiVersion: '2025-02-24.acacia',
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { cardholderId, userId } = body;

    if (!cardholderId || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get the card from the database
    const card = await cardServiceServer.getCardByStripeCardholderId(cardholderId);

    if (!card) {
      return NextResponse.json(
        { error: 'Card not found' },
        { status: 404 }
      );
    }

    // Verify the cardholder with Stripe
    const cardholder = await stripe.issuing.cardholders.retrieve(cardholderId);
    
    if (!cardholder) {
      return NextResponse.json(
        { error: 'Cardholder not found in Stripe' },
        { status: 404 }
      );
    }

    // Sync card status with Stripe
    const syncResult = await syncCardStatus(card.id);

    // Update card status based on cardholder status
    if (cardholder.status === 'active' && card.status !== 'active') {
      await cardServiceServer.activateCard(card.id);
    }

    return NextResponse.json({
      success: true,
      card,
      cardholder,
      syncResult,
    });
  } catch (error) {
    console.error('Error verifying cardholder:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}