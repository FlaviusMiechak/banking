"use server";

import { createServerClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe";

/* ---------------- SIGN UP ---------------- */

export async function signUp({
  email,
  password,
  firstName,
  lastName,
}: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}) {
  try {
    const supabase = await createServerClient();

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) throw error;

    const user = data.user;

    // ⚠️ IMPORTANT: user may be null if email confirmation is enabled
    if (!user) {
      return {
        success: true,
        message: "Check your email to confirm your account",
      };
    }

    // Create Stripe customer
    const stripeCustomer = await stripe.customers.create({
      email,
      name: `${firstName} ${lastName}`,
    });

    // Insert profile safely (upsert prevents duplicate crash)
    const { error: profileError } = await supabase.from("users").upsert({
      id: user.id,
      email,
      full_name: `${firstName} ${lastName}`,
      stripe_customer_id: stripeCustomer.id,
    });

    if (profileError) throw profileError;

    return {
      success: true,
      user,
    };
  } catch (error) {
    console.error("SIGNUP ERROR:", error);
    return {
      success: false,
      error,
    };
  }
}

/* ---------------- SIGN IN ---------------- */

export async function signIn({
  email,
  password,
}: {
  email: string;
  password: string;
}) {
  try {
    const supabase = await createServerClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    return {
      success: true,
      user: data.user,
    };
  } catch (error) {
    console.error("SIGNIN ERROR:", error);
    return {
      success: false,
      error,
    };
  }
}

/* ---------------- GET USER ---------------- */

export async function getLoggedInUser() {
  try {
    const supabase = await createServerClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;

    const { data: profile } = await supabase
      .from("users")
      .select("*")
      .eq("id", user.id)
      .maybeSingle(); // ✅ prevents crash

    return {
      id: user.id,
      email: user.email,
      ...profile,
    };
  } catch (error) {
    console.error("GET USER ERROR:", error);
    return null;
  }
}

/* ---------------- LOGOUT ---------------- */

export async function logoutAccount() {
  try {
    const supabase = await createServerClient();

    await supabase.auth.signOut();

    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
}