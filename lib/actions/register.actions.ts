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

export const registerUser = async ({
  firstName,
  lastName,
  email,
  password,
}: RegisterParams) => {
  try {
    const supabase = await createClient();
    const admin = createAdminClient();

    // 1. AUTH USER
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { firstName, lastName },
      },
    });

    if (error) throw error;

    const user = data.user;
    if (!user) throw new Error("User creation failed");

    // 2. CREATE PUBLIC USERS TABLE
    await admin.from("users").insert({
      id: user.id,
      email,
      full_name: `${firstName} ${lastName}`,
      kyc_status: "pending",
    });

    // 3. CREATE PROFILE
    await admin.from("profiles").insert({
      id: user.id,
      email,
      first_name: firstName,
      last_name: lastName,
    });

    // 4. STRIPE CUSTOMER
    const customer = await createStripeCustomer({
      email,
      firstName,
      lastName,
      userId: user.id,
    });

    await admin
      .from("users")
      .update({ stripe_customer_id: customer.id })
      .eq("id", user.id);

    await admin
      .from("profiles")
      .update({ stripe_customer_id: customer.id })
      .eq("id", user.id);

    // 5. STRIPE CARDHOLDER
    const cardholder = await createStripeCardholder({
      userId: user.id,
      customerId: customer.id,
      email,
      firstName,
      lastName,
      address: {
        line1: "N/A",
        city: "N/A",
        state: "N/A",
        postal_code: "00000",
        country: "US",
      },
    });

    await admin
      .from("profiles")
      .update({ stripe_cardholder_id: cardholder.id })
      .eq("id", user.id);

    // 6. BANK ACCOUNT
    const accountNumber = `AC${Date.now()}${Math.floor(
      100 + Math.random() * 900
    )}`;

    const { data: bank, error: bankError } = await admin
      .from("bank_accounts")
      .insert({
        user_id: user.id,
        account_number: accountNumber,
        bank_name: "Verizon Bank",
        account_name: `${firstName} ${lastName}`,
        official_name: `${firstName} ${lastName}`,
        account_type: "personal",
        subtype: "checking",
        currency: "XAF",
        status: "active",
        mask: accountNumber.slice(-4),
        stripe_cardholder_id: cardholder.id,
      })
      .select()
      .single();

    if (bankError) throw bankError;

    // 7. VIRTUAL CARD
    const card = await createVirtualCard({
      bankId: bank.id,
      userId: user.id,
      stripeCardholderId: cardholder.id,
      stripeCustomerId: customer.id,
    });

    return {
      success: true,
      userId: user.id,
      customerId: customer.id,
      cardholderId: cardholder.id,
      bankId: bank.id,
      cardId: card.id,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Registration failed",
    };
  }
};