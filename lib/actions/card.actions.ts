'use server';

import Stripe from 'stripe';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from "@/lib/supabase/admin";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-05-27.dahlia',
});

interface CreateVirtualCardParams {
  bankId: string;
  stripeCardholderId: string;
}

/**
 * Create Stripe virtual card + save to Supabase
 */
export async function createVirtualCard({
  bankId,
  stripeCardholderId,
}: CreateVirtualCardParams) {
  const supabase = createAdminClient();

  try {
    const card = await stripe.issuing.cards.create({
      cardholder: stripeCardholderId,
      currency: "usd",
      type: "virtual",
      status: "active",
    });

    const { data, error } = await supabase
      .from("cards")
      .insert({
        bank_id: bankId,
        stripe_card_id: card.id,
        stripe_cardholder_id: stripeCardholderId,
        last4: card.last4,
        brand: card.brand,
        exp_month: card.exp_month,
        exp_year: card.exp_year,
        status: card.status,
      })
      .select()
      .single();

    if (error) throw error;

    return data;
  } catch (error) {
    console.error("Create virtual card error:", error);
    throw error;
  }
}

/**
 * Get single card by bankId
 */
export async function getCard(bankId: string) {
  const supabase =await createClient();

  const { data, error } = await supabase
    .from('cards')
    .select('*')
    .eq('bank_id', bankId)
    .maybeSingle();

  if (error) {
    console.error(error);
    return null;
  }

  return data;
}

/**
 * Get all cards for a user
 */
export async function getCards(userId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('cards')
    .select(`
      *,
      bank_accounts!inner(user_id)
    `)
    .eq('bank_accounts.user_id', userId);

  if (error) {
    console.error(error);
    return [];
  }

  return data;
}

/**
 * Freeze card
 */
export async function freezeCard(cardId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("cards")
    .update({
      status: "inactive",
    })
    .eq("id", cardId);

  if (error) {
    console.error(error);
    return false;
  }

  return true;
}

/**
 * Delete card
 */
export async function deleteCard(cardId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("cards")
    .delete()
    .eq("id", cardId);

  if (error) {
    console.error(error);
    return false;
  }

  return true;
}
