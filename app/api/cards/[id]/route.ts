// app/api/cards/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { cardServiceServer } from '@/lib/services/card.service.server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-05-27.dahlia', // Uncommented this
});

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> } // Made params a Promise
) {
  try {
    // Await the params
    const { id: cardId } = await params;
    
    // Get card from database
    const card = await cardServiceServer.getCardById(cardId);
    
    if (!card) {
      return NextResponse.json(
        { error: 'Card not found' },
        { status: 404 }
      );
    }

    // Get updated card info from Stripe
    const stripeCard = await stripe.issuing.cards.retrieve(card.stripe_card_id);
    
    console.log('Stripe card response:', {
      id: stripeCard.id,
      last4: stripeCard.last4,
      brand: stripeCard.brand,
      status: stripeCard.status,
      hasNumber: !!stripeCard.number,
      hasCvc: !!stripeCard.cvc,
    });

    // Check if status needs to be synced
    const dbStatus = card.status;
    const stripeStatus = stripeCard.status;
    
    if (dbStatus !== stripeStatus) {
      console.log(`Syncing card status: DB=${dbStatus}, Stripe=${stripeStatus}`);
      
      // Update database to match Stripe
      await cardServiceServer.updateCard(cardId, {
        status: stripeStatus,
        updated_at: new Date().toISOString()
      });
      
      // Update the card object with new status
      card.status = stripeStatus;
    }

    // Check if card is fully provisioned
    const isFullyProvisioned = !!stripeCard.number && !!stripeCard.cvc;
    
    // If card is active but not fully provisioned, it might be in a transitional state
    if (stripeStatus === 'active' && !isFullyProvisioned) {
      console.log('Card is active but not fully provisioned yet (no number/CVC)');
    }

    // Return combined card data
    return NextResponse.json({
      ...card,
      stripe_details: {
        status: stripeCard.status,
        hasNumber: !!stripeCard.number,
        hasCvc: !!stripeCard.cvc,
        brand: stripeCard.brand,
        last4: stripeCard.last4,
        exp_month: stripeCard.exp_month,
        exp_year: stripeCard.exp_year,
        card_type: stripeCard.type,
      }
    });
    
  } catch (error) {
    console.error('Error fetching card:', error);
    
    // More specific error handling
    if (error instanceof Stripe.errors.StripeError) {
      return NextResponse.json(
        { error: `Stripe error: ${error.message}` },
        { status: error.statusCode || 500 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch card details' },
      { status: 500 }
    );
  }
}