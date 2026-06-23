import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { headers } from "next/headers";

import { stripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const body = await req.text();

  const signature = (await headers()).get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing signature" },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message },
      { status: 400 }
    );
  }

  const admin = createAdminClient();

  switch (event.type) {
    case "issuing_card.created":
      await handleCardCreated(
        admin,
        event.data.object as Stripe.Issuing.Card
      );
      break;

    case "issuing_card.updated":
      await handleCardUpdated(
        admin,
        event.data.object as Stripe.Issuing.Card
      );
      break;

    case "issuing_transaction.created":
      await handleTransaction(
        admin,
        event.data.object as Stripe.Issuing.Transaction
      );
      break;

    case "identity.verification_session.verified":
      await handleVerification(
        admin,
        event.data.object as Stripe.Identity.VerificationSession
      );
      break;

    case "identity.verification_session.requires_input":
      await handleVerificationFailed(
        admin,
        event.data.object as Stripe.Identity.VerificationSession
      );
      break;

    default:
      console.log("Unhandled:", event.type);
  }

  return NextResponse.json({ received: true });
}
async function handleCardCreated(
  admin: any,
  card: Stripe.Issuing.Card
) {
  await admin.from("cards").upsert({
    stripe_card_id: card.id,
    stripe_cardholder_id: card.cardholder,
    status: card.status,
    type: card.type,
    currency: card.currency,
    last4: card.last4,
    brand: card.brand,
  });
}
async function handleCardUpdated(
  admin: any,
  card: Stripe.Issuing.Card
) {
  await admin
    .from("cards")
    .update({
      status: card.status,
      replaced_by: card.replaced_by,
      replacement_for: card.replacement_for,
      cancellation_reason: card.cancellation_reason,
    })
    .eq("stripe_card_id", card.id);
}
async function handleTransaction(
  admin: any,
  tx: Stripe.Issuing.Transaction
) {
  await admin.from("transactions").upsert({
    stripe_transaction_id: tx.id,
    card_id: tx.card,
    amount: tx.amount,
    currency: tx.currency,
    merchant: tx.merchant_data?.name,
    status: tx.type,
    created: new Date(tx.created * 1000),
  });
}
async function handleVerification(
  admin: any,
  session: Stripe.Identity.VerificationSession
) {
  await admin
    .from("profiles")
    .update({
      kyc_status: "verified",
      verification_session: session.id,
    })
    .eq("stripe_customer_id", session.metadata?.customer_id);
}
async function handleVerificationFailed(
  admin: any,
  session: Stripe.Identity.VerificationSession
) {
  await admin
    .from("profiles")
    .update({
      kyc_status: "requires_input",
    })
    .eq("stripe_customer_id", session.metadata?.customer_id);
}