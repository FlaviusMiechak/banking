// app/api/webhooks/stripe/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { cardServiceServer } from '@/lib/services/card.service.server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
 // apiVersion: '2025-02-24.acacia',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error(`Webhook signature verification failed:`, err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'issuing_card.created':
      case 'issuing_card.updated': {
        const card = event.data.object as any;
        
        // Find the card in our database
        const dbCard = await cardServiceServer.getCardByStripeCardId(card.id);
        
        if (dbCard) {
          // Update status to match Stripe
          await cardServiceServer.updateCard(dbCard.id, {
            status: card.status,
            updated_at: new Date().toISOString(),
            // Update other fields if needed
            brand: card.brand || dbCard.brand,
            last4: card.last4 || dbCard.last4,
            exp_month: card.exp_month || dbCard.exp_month,
            exp_year: card.exp_year || dbCard.exp_year,
            card_type: card.type || dbCard.card_type,
          });
          
          console.log(`Updated card ${dbCard.id} status to ${card.status}`);
        }
        break;
      }
      
      case 'issuing_cardholder.updated': {
        const cardholder = event.data.object as any;
        
        const dbCard = await cardServiceServer.getCardByStripeCardholderId(cardholder.id);
        
        if (dbCard) {
          await cardServiceServer.updateCard(dbCard.id, {
            verification_status: cardholder.status === 'active' ? 'verified' : 'pending',
            updated_at: new Date().toISOString(),
          });
        }
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}