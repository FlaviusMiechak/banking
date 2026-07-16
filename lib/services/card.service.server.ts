// lib/services/card.service.server.ts
import { createClient as createServerClient } from '@/lib/supabase/server';

export interface CardData {
  id?: string;
  bank_id: string;
  user_id: string;
  stripe_card_id: string;
  stripe_cardholder_id: string;
  stripe_customer_id?: string;
  brand?: string;
  last4?: string;
  exp_month?: number;
  exp_year?: number;
  card_type?: string;
  funding?: string;
  currency?: string;
  status?: string;
  spending_limit?: number;
  billing_address?: any;
  address_state?: string;
  address_country?: string;
  address_city?: string;
  address_line1?: string;
  address_postal?: string;
  cardholder_name?: string;
  verification_status?: string;
  activated_at?: string;
  created_at?: string;
  updated_at?: string;
}

export class CardServiceServer {
  private getSupabase() {
    return createServerClient();
  }

  // Get all cards for a user
  async getUserCards(userId: string) {
    const supabase = this.getSupabase();
    const { data, error } = await supabase
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
    const supabase = this.getSupabase();
    const { data, error } = await supabase
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
    const supabase = this.getSupabase();
    const { data, error } = await supabase
      .from('cards')
      .select('*')
      .eq('stripe_cardholder_id', stripeCardholderId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching card:', error);
      throw new Error('Failed to fetch card');
    }

    return data;
  }

  // Get card by Stripe card ID
  async getCardByStripeCardId(stripeCardId: string) {
    const supabase = this.getSupabase();
    const { data, error } = await supabase
      .from('cards')
      .select('*')
      .eq('stripe_card_id', stripeCardId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching card:', error);
      throw new Error('Failed to fetch card');
    }

    return data;
  }

  // Create a new card record
  async createCard(cardData: CardData) {
    const supabase = this.getSupabase();
    const { data, error } = await supabase
      .from('cards')
      .insert([{
        bank_id: cardData.bank_id,
        user_id: cardData.user_id,
        stripe_card_id: cardData.stripe_card_id,
        stripe_cardholder_id: cardData.stripe_cardholder_id,
        stripe_customer_id: cardData.stripe_customer_id || null,
        brand: cardData.brand || null,
        last4: cardData.last4 || null,
        exp_month: cardData.exp_month || null,
        exp_year: cardData.exp_year || null,
        card_type: cardData.card_type || null,
        funding: cardData.funding || null,
        currency: cardData.currency || null,
        status: cardData.status || 'inactive',
        spending_limit: cardData.spending_limit || 0,
        billing_address: cardData.billing_address || null,
        address_state: cardData.address_state || null,
        address_country: cardData.address_country || null,
        address_city: cardData.address_city || null,
        address_line1: cardData.address_line1 || null,
        address_postal: cardData.address_postal || null,
        cardholder_name: cardData.cardholder_name || null,
        verification_status: cardData.verification_status || 'pending',
        activated_at: cardData.activated_at || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating card:', error);
      throw new Error(`Failed to create card: ${error.message}`);
    }

    return data;
  }

  // Update card details
  async updateCard(cardId: string, updates: Partial<CardData>) {
    const supabase = this.getSupabase();
    
    // Add updated_at timestamp
    const updateData = {
      ...updates,
      updated_at: new Date().toISOString()
    };
    
    const { data, error } = await supabase
      .from('cards')
      .update(updateData)
      .eq('id', cardId)
      .select()
      .single();

    if (error) {
      console.error('Error updating card:', error);
      throw new Error(`Failed to update card: ${error.message}`);
    }

    return data;
  }

  // Update card by Stripe cardholder ID
  async updateCardByStripeId(stripeCardholderId: string, updates: Partial<CardData>) {
    const supabase = this.getSupabase();
    
    const updateData = {
      ...updates,
      updated_at: new Date().toISOString()
    };
    
    const { data, error } = await supabase
      .from('cards')
      .update(updateData)
      .eq('stripe_cardholder_id', stripeCardholderId)
      .select()
      .single();

    if (error) {
      console.error('Error updating card:', error);
      throw new Error(`Failed to update card: ${error.message}`);
    }

    return data;
  }

  // Activate card
  async activateCard(cardId: string) {
    const supabase = this.getSupabase();
    
    const { data, error } = await supabase
      .from('cards')
      .update({
        status: 'active',
        verification_status: 'verified',
        activated_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', cardId)
      .select()
      .single();

    if (error) {
      console.error('Error activating card:', error);
      throw new Error(`Failed to activate card: ${error.message}`);
    }

    return data;
  }

  // Deactivate card
  async deactivateCard(cardId: string) {
    const supabase = this.getSupabase();
    
    const { data, error } = await supabase
      .from('cards')
      .update({
        status: 'inactive',
        updated_at: new Date().toISOString()
      })
      .eq('id', cardId)
      .select()
      .single();

    if (error) {
      console.error('Error deactivating card:', error);
      throw new Error(`Failed to deactivate card: ${error.message}`);
    }

    return data;
  }

  // Block card
  async blockCard(cardId: string) {
    const supabase = this.getSupabase();
    
    const { data, error } = await supabase
      .from('cards')
      .update({
        status: 'blocked',
        updated_at: new Date().toISOString()
      })
      .eq('id', cardId)
      .select()
      .single();

    if (error) {
      console.error('Error blocking card:', error);
      throw new Error(`Failed to block card: ${error.message}`);
    }

    return data;
  }
// lib/services/card.service.server.ts (add this method)

// Get cards by cardholder ID
async getCardsByCardholderId(stripeCardholderId: string) {
  const supabase = this.getSupabase();
  const { data, error } = await supabase
    .from('cards')
    .select('*')
    .eq('stripe_cardholder_id', stripeCardholderId);

  if (error) {
    console.error('Error fetching cards by cardholder:', error);
    throw new Error('Failed to fetch cards');
  }

  return data;
}
  // Save verification attempt
  async saveVerificationAttempt(cardId: string, userId: string, isSuccessful: boolean, errorMessage?: string) {
    const supabase = this.getSupabase();
    const { data, error } = await supabase
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
    const supabase = this.getSupabase();
    const { data, error } = await supabase
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
    const supabase = this.getSupabase();
    const { error } = await supabase
      .from('cards')
      .update({ 
        last_used_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', cardId);

    if (error) {
      console.error('Error updating last used:', error);
      // Non-critical error
    }
  }

  // Get active cards count for user
  async getActiveCardsCount(userId: string) {
    const supabase = this.getSupabase();
    const { count, error } = await supabase
      .from('cards')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'active');

    if (error) {
      console.error('Error counting active cards:', error);
      throw new Error('Failed to count active cards');
    }

    return count || 0;
  }

  // Get cards by status
  async getCardsByStatus(userId: string, status: string) {
    const supabase = this.getSupabase();
    const { data, error } = await supabase
      .from('cards')
      .select('*')
      .eq('user_id', userId)
      .eq('status', status)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching cards by status:', error);
      throw new Error('Failed to fetch cards');
    }

    return data;
  }

  // Delete card (soft delete - deactivate)
  async deleteCard(cardId: string) {
    return this.deactivateCard(cardId);
  }

  // Hard delete card (admin only)
  async hardDeleteCard(cardId: string) {
    const supabase = this.getSupabase();
    const { error } = await supabase
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

export const cardServiceServer = new CardServiceServer();