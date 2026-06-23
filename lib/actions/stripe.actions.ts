"use server";

import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-05-27.dahlia",
});

interface RegisterStripeUserParams {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  address: {
    line1: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  };
}

/**
 * Create Stripe Customer
 */
async function createStripeCustomer(
  userId: string,
  email: string,
  firstName: string,
  lastName: string
) {
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_customer_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (profile?.stripe_customer_id) {
    return profile.stripe_customer_id;
  }

  const customer = await stripe.customers.create({
    email,
    name: `${firstName} ${lastName}`,
    metadata: {
      supabase_user_id: userId,
    },
  });

  const { error } = await supabase
    .from("profiles")
    .upsert({
      user_id: userId,
      email,
      full_name: `${firstName} ${lastName}`,
      stripe_customer_id: customer.id,
    });

  if (error) throw error;

  return customer.id;
}

/**
 * Create Cardholder
 */
async function createStripeCardholder(
  userId: string,
  customerId: string,
  email: string,
  firstName: string,
  lastName: string,
  address: RegisterStripeUserParams["address"]
) {
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_cardholder_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (profile?.stripe_cardholder_id) {
    return profile.stripe_cardholder_id;
  }

  const cardholder = await stripe.issuing.cardholders.create({
    type: "individual",

    name: `${firstName} ${lastName}`,

    email,

    billing: {
      address,
    },

    individual: {
      first_name: firstName,
      last_name: lastName,
    },

    metadata: {
      supabase_user_id: userId,
      stripe_customer_id: customerId,
    },
  });

  const { error } = await supabase
    .from("profiles")
    .update({
      stripe_cardholder_id: cardholder.id,
    })
    .eq("user_id", userId);

  if (error) throw error;

  return cardholder.id;
}

/**
 * Create Virtual Card
 */
async function createVirtualCard(
  userId: string,
  cardholderId: string
) {
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("cards")
    .select("stripe_card_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (existing?.stripe_card_id) {
    return existing.stripe_card_id;
  }

  const card = await stripe.issuing.cards.create({
    cardholder: cardholderId,
    currency: "usd",
    type: "virtual",
  });

  const { error } = await supabase
    .from("cards")
    .insert({
      user_id: userId,
      stripe_card_id: card.id,
      cardholder_id: cardholderId,
      status: card.status,
      type: card.type,
      currency: card.currency,
      brand: card.brand,
      last4: card.last4,
      exp_month: card.exp_month,
      exp_year: card.exp_year,
    });

  if (error) throw error;

  return card.id;
}

/**
 * Main Registration Function
 */
export async function registerStripeUser(
  params: RegisterStripeUserParams
) {
  const customerId = await createStripeCustomer(
    params.userId,
    params.email,
    params.firstName,
    params.lastName
  );

  const cardholderId = await createStripeCardholder(
    params.userId,
    customerId,
    params.email,
    params.firstName,
    params.lastName,
    params.address
  );

  const cardId = await createVirtualCard(
    params.userId,
    cardholderId
  );

  return {
    customerId,
    cardholderId,
    cardId,
  };
}