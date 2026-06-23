// lib/actions/user.action.ts
"use server";


import { createAdminClient } from "@/lib/supabase/admin";
import Stripe from "stripe";
import { createClient} from "@/lib/supabase/server";
import { getAccount } from "./transaction.actions";
import crypto from "crypto";
import { isBooleanObject } from "util/types";
import { availableParallelism } from "os";

function generateAccountNumber(length = 12): string {
  let accountNumber = "";

  while (accountNumber.length < length) {
    accountNumber += crypto.randomInt(0, 10).toString();
  }

  return accountNumber;
}
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-05-27.dahlia", // ✅ stable Stripe API version
});

// 🔹 Get logged-in user (server-side)
export async function getLoggedInUser() {
  const supabase =await createClient(); // ✅ no await
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error) {
    if (error.code === "refresh_token_not_found") {
      await supabase.auth.signOut({ scope: "local" }).catch(() => null);
      return null;
    }

    console.error("Auth error:", error.message);
    return null;
  }
  return user;
}

// 🔹 Sign-in helper
export async function signIn({ email, password }: { email: string; password: string }) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) throw error;
  return data.user;
}

// 🔹 Sign-up helper with Stripe + profile + bank account
export async function signUp({
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
  const adminSupabase = createAdminClient();

  // 1. Create Supabase user
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        firstName,
        lastName,
      },
    },
  });

  if (error) throw error;

  const user = data.user;

  if (!user) return null;

  // 2. Create Stripe customer
  const customer = await stripe.customers.create({
    email,
    name: `${firstName} ${lastName}`,
    metadata: {
      supabase_user_id: user.id,
    },
  });

  // 3. Create Stripe cardholder
  const cardholder = await stripe.issuing.cardholders.create({
    type: "individual",
    name: `${firstName} ${lastName}`,
    email,

    billing: {
      address: {
        line1: "123 Main Street",
        city: "New York",
        state: "NY",
        postal_code: "10001",
        country: "US",
      },
    },

    individual: {
      first_name: firstName,
      last_name: lastName,
    },

    metadata: {
      supabase_user_id: user.id,
      stripe_customer_id: customer.id,
    },
  });

  // 4. Save profile
  const { error: profileError } = await adminSupabase
    .from("users")
    .upsert({
      id: user.id,

      email,
      first_name: firstName,
      last_name: lastName,

      stripe_customer_id: customer.id,
      stripe_cardholder_id: cardholder.id,
      stripe_cardholder_status: cardholder.status,
      stripe_cardholder_type: cardholder.type,
    });

  if (profileError) throw profileError;

  // 5. Create bank account
  const { data: bank, error: bankError } = await adminSupabase
    .from("bank_accounts")
    .insert({
      user_id: user.id,
      bank_id: crypto.randomUUID(),
      iban:generateAccountNumber(14),
      account_name: `${firstName} ${lastName}`,
      official_name: `${firstName} ${lastName}`,
      account_type: "personal",
      subtype: "checking",
      currency: "usd",
      current_balance: 0,
      available_balance: 0,
      frozen_balance: 0,
      mask: generateAccountNumber(4),
      status: "active",
      stripe_cardholder_id: cardholder.id,
      account_number: generateAccountNumber(),
      account_id: `acc_${crypto.randomUUID()}`,
      access_token: crypto.randomUUID(),
      funding_source_url: `https://funding-source.com/${crypto.randomUUID()}/stripe`,
      shareable_id: "user.bank_id.id",
    })
    .select()
    .single();

  if (bankError) throw bankError;

  // 6. Create Stripe virtual card
  const card = await stripe.issuing.cards.create({
    cardholder: cardholder.id,
    currency: "usd",
    type: "virtual",
  });

  // 7. Save card
  const { error: cardError } = await adminSupabase
    .from("cards")
    .insert({
      bank_id: bank.id,
      user_id: user.id,

      stripe_card_id: card.id,
      stripe_cardholder_id: cardholder.id,

      // Remove this if your cards table doesn't have this column
      stripe_customer_id: customer.id,
      spending_limit:15000,
      
      brand: card.brand,
      last4: card.last4,
      exp_month: card.exp_month,
      exp_year: card.exp_year,
      card_type: card.type,
      funding: card.financial_account ?? null,
      currency: card.currency,
      status: card.status,
      billing_address: cardholder.billing.address,
    });

  if (cardError) throw cardError;

  return user;
}
export async function logout() {
  const supabase =createClient();
  await supabase.auth.signOut();
}