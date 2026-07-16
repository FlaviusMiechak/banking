// lib/services/card.service.ts
import { createClient } from '@/lib/supabase/client';
import { Stripe } from 'stripe';
export const dynamic = 'force-dynamic'
export interface CardData {
  id?: string;
  user_id: string;
  stripe_cardholder_id: string;
  stripe_card_id: string;
  card_last4: string;
  card_brand: string;
  card_exp_month: number;
  card_exp_year: number;
  cardholder_name: string;
  is_active?: boolean;
  is_physical?: boolean;
  status?: string;
  verification_status?: string;
  billing_address?: any;
}

export interface CardVerificationData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dob: {
    day: number;
    month: number;
    year: number;
  };
  idNumber: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export class CardService {
  // Get all cards for a user
  async getUserCards(userId: string) {
    const { data, error } = await createClient()
      .from('cards')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user cards:', error);
      throw new Error('Failed to fetch cards');
    }

    return data;
  }

  // Get a single card by ID
  async getCardById(cardId: string) {
    const { data, error } = await createClient()
      .from('cards')
      .select('*')
      .eq('id', cardId)
      .single();

    if (error) {
      console.error('Error fetching card:', error);
      throw new Error('Failed to fetch card');
    }

    return data;
  }

  // Get card by Stripe cardholder ID
  async getCardByStripeCardholderId(stripeCardholderId: string) {
    const { data, error } = await createClient()
      .from('cards')
      .select('*')
      .eq('stripe_cardholder_id', stripeCardholderId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error fetching card:', error);
      throw new Error('Failed to fetch card');
    }

    return data;
  }

  // Create a new card record
  async createCard(cardData: CardData) {
    const { data, error } = await createClient()
      .from('cards')
      .insert([{
        user_id: cardData.user_id,
        stripe_cardholder_id: cardData.stripe_cardholder_id,
        stripe_card_id: cardData.stripe_card_id,
        card_last4: cardData.card_last4,
        card_brand: cardData.card_brand,
        card_exp_month: cardData.card_exp_month,
        card_exp_year: cardData.card_exp_year,
        cardholder_name: cardData.cardholder_name,
        is_active: cardData.is_active || true,
        is_physical: cardData.is_physical || false,
        status: cardData.status || 'inactive',
        verification_status: cardData.verification_status || 'pending',
        billing_address: cardData.billing_address || null
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating card:', error);
      throw new Error('Failed to create card');
    }

    return data;
  }

  // Update card details
  async updateCard(cardId: string, updates: Partial<CardData>) {
    const { data, error } = await createClient()
      .from('cards')
      .update(updates)
      .eq('id', cardId)
      .select()
      .single();

    if (error) {
      console.error('Error updating card:', error);
      throw new Error('Failed to update card');
    }

    return data;
  }

  // Update card by Stripe cardholder ID
  async updateCardByStripeId(stripeCardholderId: string, updates: Partial<CardData>) {
    const { data, error } = await createClient()
      .from('cards')
      .update(updates)
      .eq('stripe_cardholder_id', stripeCardholderId)
      .select()
      .single();

    if (error) {
      console.error('Error updating card:', error);
      throw new Error('Failed to update card');
    }

    return data;
  }

  // Activate card
  async activateCard(cardId: string) {
    const { data, error } = await createClient()
      .from('cards')
      .update({
        status: 'active',
        verification_status: 'verified',
        activated_at: new Date().toISOString(),
        is_active: true
      })
      .eq('id', cardId)
      .select()
      .single();

    if (error) {
      console.error('Error activating card:', error);
      throw new Error('Failed to activate card');
    }

    return data;
  }

  // Deactivate card
  async deactivateCard(cardId: string) {
    const { data, error } = await createClient()
      .from('cards')
      .update({
        status: 'inactive',
        is_active: false
      })
      .eq('id', cardId)
      .select()
      .single();

    if (error) {
      console.error('Error deactivating card:', error);
      throw new Error('Failed to deactivate card');
    }

    return data;
  }

  // Save verification attempt
  async saveVerificationAttempt(cardId: string, userId: string, isSuccessful: boolean, errorMessage?: string) {
    const { data, error } = await createClient()
      .from('card_verification_attempts')
      .insert([{
        card_id: cardId,
        user_id: userId,
        is_successful: isSuccessful,
        error_message: errorMessage || null
      }])
      .select()
      .single();

    if (error) {
      console.error('Error saving verification attempt:', error);
      // Don't throw - this is non-critical
    }

    return data;
  }

  // Get verification attempts for a card
  async getVerificationAttempts(cardId: string) {
    const { data, error } = await createClient()
      .from('card_verification_attempts')
      .select('*')
      .eq('card_id', cardId)
      .order('last_attempt_at', { ascending: false });

    if (error) {
      console.error('Error fetching verification attempts:', error);
      throw new Error('Failed to fetch verification attempts');
    }

    return data;
  }

  // Update last used timestamp
  async updateLastUsed(cardId: string) {
    const { error } = await createClient()
      .from('cards')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', cardId);

    if (error) {
      console.error('Error updating last used:', error);
      // Non-critical error
    }
  }

  // Get active cards count for user
  async getActiveCardsCount(userId: string) {
    const { count, error } = await createClient()
      .from('cards')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_active', true);

    if (error) {
      console.error('Error counting active cards:', error);
      throw new Error('Failed to count active cards');
    }

    return count || 0;
  }

  // Delete card (soft delete - deactivate)
  async deleteCard(cardId: string) {
    return this.deactivateCard(cardId);
  }

  // Hard delete card (admin only)
  async hardDeleteCard(cardId: string) {
    const { error } = await createClient()
      .from('cards')
      .delete()
      .eq('id', cardId);

    if (error) {
      console.error('Error deleting card:', error);
      throw new Error('Failed to delete card');
    }

    return true;
  }
}

export const cardService = new CardService();