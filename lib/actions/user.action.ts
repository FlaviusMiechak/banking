"use server";

import Stripe from "stripe";
import crypto from "crypto";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-05-27.dahlia",
});

function generateAccountNumber(length = 12) {
  let num = "";
  while (num.length < length) {
    num += crypto.randomInt(0, 10);
  }
  return num;
}

function generateId(prefix: string) {
  return `${prefix}_${crypto.randomUUID()}`;
}

/* =========================================================
   REGISTER USER
========================================================= */

export async function registerUser({
  firstName,
  lastName,
  email,
  password,
}: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}) {
  const supabase = await createClient();
  const admin = createAdminClient();

  /* 1. Create Auth User */
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { firstName, lastName },
    },
  });

  if (error) throw error;
  if (!data.user) throw new Error("User creation failed");

  const user = data.user;

  /* 2. Create public.users */
  await admin.from("users").insert({
    id: user.id,
    email,
    first_name: firstName,
    last_name: lastName,
  });

  /* 3. Create Stripe Customer */
  const customer = await stripe.customers.create({
    email,
    name: `${firstName} ${lastName}`,
    metadata: {
      supabase_user_id: user.id,
    },
  });

  /* 4. Create bank account */
  const { data: bank, error: bankError } = await admin
    .from("bank_accounts")
    .insert({
      user_id: user.id,
      bank_id: crypto.randomUUID(),
      account_id: generateId("acc"),
      account_number: generateAccountNumber(),
      iban: generateAccountNumber(14),
      account_name: `${firstName} ${lastName}`,
      official_name: `${firstName} ${lastName}`,
      account_type: "personal",
      subtype: "checking",
      currency: "usd",
      current_balance: 0,
      available_balance: 0,
      frozen_balance: 0,
      status: "active",
    })
    .select()
    .single();

  if (bankError) throw bankError;

  /* 5. Store Stripe profile (NO cardholder yet) */
  await admin.from("profiles").insert({
    user_id: user.id,
    stripe_customer_id: customer.id,
    stripe_cardholder_id: null,
    kyc_status: "pending",
  });

  return { user, bank };
}

/* =========================================================
   SUBMIT KYC (Stripe Hosted Verification)
========================================================= */

export async function submitKyc(userId: string) {
  const admin = createAdminClient();

  /* Create Stripe identity verification session */
  const verificationSession =
    await stripe.identity.verificationSessions.create({
      type: "document",
      metadata: {
        user_id: userId,
      },
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/kyc/success`,
    });

  return {
    url: verificationSession.url,
  };
}

/* =========================================================
   CREATE CARDHOLDER (AFTER KYC VERIFIED)
========================================================= */

export async function createCardholder(userId: string) {
  const admin = createAdminClient();

  const { data: profile } = await admin
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (!profile?.stripe_customer_id) {
    throw new Error("Missing Stripe customer");
  }

  const cardholder = await stripe.issuing.cardholders.create({
    type: "individual",
    name: "Verified User",
    email: profile.email,
    billing: {
      address: {
        line1: "Verified Address",
        city: "City",
        state: "State",
        postal_code: "00000",
        country: "US",
      },
    },
    metadata: {
      user_id: userId,
      stripe_customer_id: profile.stripe_customer_id,
    },
  });

  /* Save cardholder */
  await admin
    .from("profiles")
    .update({
      stripe_cardholder_id: cardholder.id,
      kyc_status: "verified",
    })
    .eq("user_id", userId);

  return cardholder;
}

/* =========================================================
   ISSUE CARD (ONLY AFTER CARDHOLDER EXISTS)
========================================================= */

export async function issueCard(userId: string, bankId: string) {
  const admin = createAdminClient();

  const { data: profile } = await admin
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (!profile?.stripe_cardholder_id) {
    throw new Error("Cardholder not created (KYC required)");
  }

  /* Create Stripe card */
  const card = await stripe.issuing.cards.create({
    cardholder: profile.stripe_cardholder_id,
    currency: "usd",
    type: "virtual",
  });

  /* Save card */
  const { data, error } = await admin.from("cards").insert({
    user_id: userId,
    bank_id: bankId,

    stripe_card_id: card.id,
    stripe_cardholder_id: profile.stripe_cardholder_id,
    stripe_customer_id: profile.stripe_customer_id,

    brand: card.brand,
    last4: card.last4,
    exp_month: card.exp_month,
    exp_year: card.exp_year,

    card_type: "virtual",
    status: card.status,
    currency: card.currency,
  });

  if (error) throw error;

  return data;
}

/* =========================================================
   LOGIN
========================================================= */

export async function loginUser({
  email,
  password,
}: {
  email: string;
  password: string;
}) {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;

  return data.user;
}

//getLoggedInUser
export async function getLoggedInUser() {

const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

   if (error || !user) {
    return null;
  }

  // Get user data from your users table
  const { data: userData } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();

  return userData || user;
}





/* =========================================================
   LOGOUT
========================================================= */

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
}