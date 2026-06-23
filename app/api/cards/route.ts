// app/api/cards/route.ts

import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-05-27.dahlia",
});

export async function GET() {
  const supabase = await createClient();

  try {
    // 1. Get authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // 2. Get Stripe cardholder from profile
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("stripe_cardholder_id")
      .eq("id", user.id)
      .maybeSingle();

    if (error || !profile) {
      return NextResponse.json(
        { error: "Profile not found" },
        { status: 404 }
      );
    }

    if (!profile.stripe_cardholder_id) {
      return NextResponse.json(
        { error: "Stripe cardholder missing" },
        { status: 400 }
      );
    }

    // 3. Fetch cards from Stripe Issuing
    const cards = await stripe.issuing.cards.list({
      cardholder: profile.stripe_cardholder_id,
      limit: 20,
    });

    // 4. Return clean response
    return NextResponse.json({
      success: true,
      data: cards.data,
    });
  } catch (err) {
    console.error("CARDS API ERROR:", err);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}