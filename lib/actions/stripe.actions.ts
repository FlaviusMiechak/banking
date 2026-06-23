//lib/actions/stripe.actions.ts
"use server";

import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-05-27.dahlia",
});

interface CreateCardholderParams {
  customerId: string;
  email: string;
  firstName: string;
  lastName: string;
  supabaseUserId: string;
}
interface CreateCustomerParams {
  email: string;
  firstName: string;
  lastName: string;
  supabaseUserId: string;
}

export async function createStripeCustomer({
  email,
  firstName,
  lastName,
  supabaseUserId,
}: CreateCustomerParams) {
  const supabase = await createClient();

  try {
    // Check if customer already exists
    const { data: existing } = await supabase
      .from("users")
      .select("*")
      .eq("user_id", supabaseUserId)
      .maybeSingle();

    if (existing) {
      return existing;
    }

    const customer = await stripe.customers.create({
      email,
      name: `${firstName} ${lastName}`,
      metadata: {
        supabase_user_id: supabaseUserId,
      },
    });

    const { error } = await supabase
      .from("profiles")
      .insert({
        user_id: supabaseUserId,
        stripe_customer_id: customer.id,
        email: customer.email,
        name: customer.name,
      });

    if (error) throw error;

    return customer;
  } catch (error) {
    console.error(error);
    throw error;
  }
}
export async function createStripeCardholder({
  customerId,
  email,
  firstName,
  lastName,
  supabaseUserId,
}: CreateCardholderParams) {
  const supabase = await createClient();

  try {
    const { data: existing } = await supabase
      .from("cards")
      .select("*")
      .eq("user_id", supabaseUserId)
      .maybeSingle();

    if (existing) {
      return existing;
    }

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
        stripe_customer_id: customerId,
        supabase_user_id: supabaseUserId,
      },
    });

    const { error } = await supabase
      .from("profiles")
      .upsert({
        user_id: supabaseUserId,
        stripe_customer_id: customerId,
        stripe_cardholder_id: cardholder.id,
        email,
        full_name: `${firstName} ${lastName}`,
        status: cardholder.status,
        type: cardholder.type,
      });

    if (error) throw error;

    return cardholder;
  } catch (error) {
    console.error(error);
    throw error;
  }
}