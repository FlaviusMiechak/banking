// lib/utils/sync-card-status.ts
import { cardServiceServer } from '@/lib/services/card.service.server';
import Stripe from 'stripe';
export const dynamic = 'force-dynamic'
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  //apiVersion: '2025-02-24.acacia',
});

export async function syncCardStatus(cardId: string) {
  try {
    // Get card from database
    const dbCard = await cardServiceServer.getCardById(cardId);
    
    if (!dbCard) {
      throw new Error('Card not found');
    }

    // Get card from Stripe
    const stripeCard = await stripe.issuing.cards.retrieve(dbCard.stripe_card_id);
    
    // Check if status needs updating
    if (dbCard.status !== stripeCard.status) {
      console.log(`Syncing card ${cardId}: ${dbCard.status} -> ${stripeCard.status}`);
      
      await cardServiceServer.updateCard(cardId, {
        status: stripeCard.status,
        updated_at: new Date().toISOString(),
      });
      
      return {
        synced: true,
        oldStatus: dbCard.status,
        newStatus: stripeCard.status,
      };
    }
    
    return {
      synced: false,
      status: dbCard.status,
      message: 'Status already in sync',
    };
  } catch (error) {
    console.error('Error syncing card status:', error);
    throw error;
  }
}