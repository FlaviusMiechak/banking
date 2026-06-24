"use server";

import Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-05-27.dahlia",
});

export interface CreateVirtualCardParams {
  bankId: string;
  userId: string;
  stripeCardholderId: string;
  stripeCustomerId: string;
}

export const createVirtualCard = async ({
  bankId,
  userId,
  stripeCardholderId,
  stripeCustomerId,
}: CreateVirtualCardParams) => {
  const supabase = createAdminClient();

  // Create Stripe Issuing card
  const card = await stripe.issuing.cards.create({
    cardholder: stripeCardholderId,
    currency: "usd",
    type: "virtual",
  });

  // Save to DB
  const { data, error } = await supabase
    .from("cards")
    .insert({
      bank_id: bankId,
      user_id: userId,
      stripe_card_id: card.id,
      stripe_cardholder_id: stripeCardholderId,
      stripe_customer_id: stripeCustomerId,

      brand: card.brand ?? "visa",
      last4: card.last4 ?? "0000",
      exp_month: card.exp_month ?? 0,
      exp_year: card.exp_year ?? 0,

      card_type: "virtual",
      status: card.status ?? "active",
      currency: card.currency ?? "USD",
    })
    .select()
    .single();

  if (error) throw error;

  return data;
};