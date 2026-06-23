// lib/actions/register.actions.ts
"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

import {
  createStripeCustomer,
  createStripeCardholder,
} from "@/lib/actions/stripe.actions";

import { createVirtualCard } from "@/lib/actions/card.actions";

interface RegisterParams {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export async function registerUser({
  firstName,
  lastName,
  email,
  password,
}: RegisterParams) {
  try {
    const supabase = await createClient();
    const adminSupabase = createAdminClient();

    // -----------------------------
    // 1. CREATE AUTH USER
    // -----------------------------
    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          firstName,
          lastName,
        },
      },
    });

    if (authError) throw authError;

    const user = data?.user;
    if (!user) throw new Error("Failed to create user.");

    // -----------------------------
    // 2. STRIPE CUSTOMER
    // -----------------------------
    const customer = await createStripeCustomer({
      email,
      firstName,
      lastName,
      supabaseUserId: user.id,
    });

    if (!customer?.id) {
      throw new Error("Failed to create Stripe customer.");
    }

    // -----------------------------
    // 3. STRIPE CARDHOLDER
    // -----------------------------
    const cardholder = await createStripeCardholder({
      customerId: customer.id,
      email,
      firstName,
      lastName,
      supabaseUserId: user.id,
    });

    if (!cardholder?.id) {
      throw new Error("Failed to create Stripe cardholder.");
    }

    // -----------------------------
    // 4. CREATE BANK ACCOUNT
    // -----------------------------
    const accountNumber = `AC${Date.now()}${Math.floor(
      100 + Math.random() * 900
    )}`;

    const { data: bank, error: bankError } = await adminSupabase
      .from("bank_accounts")
      .insert({
        user_id: user.id,
        account_number: accountNumber,

        iban: null,
        bank_name: "Verizon Bank",
        institution_id: null,

        account_name: `${firstName} ${lastName}`,
        official_name: `${firstName} ${lastName}`,

        account_type: "personal",
        subtype: "checking",
        currency: "XAF",

        current_balance: 0,
        available_balance: 0,
        frozen_balance: 0,

        mask: accountNumber.slice(-4),

        status: "active",
        shareable_id: crypto.randomUUID(),

        stripe_cardholder_id: cardholder.id,
      })
      .select()
      .single();

    if (bankError) throw bankError;
    if (!bank) throw new Error("Bank account creation failed.");

    // -----------------------------
    // 5. CREATE VIRTUAL CARD (handles Stripe + DB internally)
    // -----------------------------
    const card = await createVirtualCard({
      bankId: bank.id,
      stripeCardholderId: cardholder.id,
    });

    if (!card?.id) {
      throw new Error("Failed to create virtual card.");
    }

    // -----------------------------
    // SUCCESS RESPONSE
    // -----------------------------
    return {
      success: true,
      userId: user.id,
      customerId: customer.id,
      cardholderId: cardholder.id,
      bankId: bank.id,
      cardId: card.id,
    };
  } catch (error) {
    console.error("REGISTER ERROR:", error);

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Registration failed.",
    };
  }
}