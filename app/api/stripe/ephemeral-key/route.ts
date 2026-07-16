import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
export const dynamic = 'force-dynamic'
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { card_id, nonce } = await req.json();

    if (!card_id || !nonce) {
      return NextResponse.json(
        {
          error: "card_id and nonce are required",
        },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    // Verify ownership
    const { data: card, error } = await admin
      .from("cards")
      .select("id, stripe_card_id, user_id, kyc_status")
      .eq("stripe_card_id", card_id)
      .single();

    if (error || !card) {
      return NextResponse.json(
        { error: "Card not found" },
        { status: 404 }
      );
    }

    if (card.user_id !== user.id) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    // Optional: Require completed verification
    if (card.kyc_status !== "verified") {
      return NextResponse.json(
        {
          error: "Complete verification before revealing card details.",
        },
        { status: 403 }
      );
    }

    const ephemeralKey = await stripe.ephemeralKeys.create(
      {
        nonce,
        issuing_card: card.stripe_card_id,
      },
      {
        // Stripe requires an explicit API version for ephemeral keys.
        apiVersion: "2026-02-25.clover",
      }
    );

    return NextResponse.json({
      ephemeralKeySecret: ephemeralKey.secret,
    });
  } catch (error: any) {
    console.error("Ephemeral key error:", error);

    return NextResponse.json(
      {
        error: error.message,
      },
      { status: 500 }
    );
  }
}