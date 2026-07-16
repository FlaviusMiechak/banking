import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-05-27.dahlia",
});

// This is your Stripe webhook signing secret (from Stripe Dashboard)
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: Request) {
  try {
    const body = await req.text();
    const signature = req.headers.get("stripe-signature")!;

    // Verify the webhook signature
    // Use a loose any type for event.type comparisons to avoid TypeScript
    // complaining about newer/less-common event types not present in the
    // generated Stripe union type.
    let event: any;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error("Webhook signature verification failed:", err);
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 400 }
      );
    }

    console.log(`Received webhook event: ${event.type}`);

    // Handle the event
    switch (event.type) {
      case "issuing_authorization.created":
        await handleAuthorizationCreated(event.data.object as Stripe.Issuing.Authorization);
        break;
      
      case "issuing_authorization.updated":
        await handleAuthorizationUpdated(event.data.object as Stripe.Issuing.Authorization);
        break;
      
      case "issuing_authorization.requested":
        await handleAuthorizationRequested(event.data.object as Stripe.Issuing.Authorization);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}

// Handle authorization created
async function handleAuthorizationCreated(auth: Stripe.Issuing.Authorization) {
  console.log(`Authorization created: ${auth.id} for card ${auth.card?.id}`);

  const supabase = createClient();

  // Get the card from your database
  const { data: card, error } = await supabase
    .from("cards")
    .select("*")
    .eq("stripe_card_id", auth.card)
    .single();

  if (error || !card) {
    console.error("Card not found:", auth.card);
    return;
  }

  // Check if the card has sufficient balance
  const amount = auth.amount / 100; // Convert from cents
  const availableBalance = card.spending_limit || 0;

  if (availableBalance >= amount) {
    // Approve the authorization
    await stripe.issuing.authorizations.approve(auth.id, {
      metadata: {
        approved_by: "system",
        card_balance: availableBalance.toString(),
      },
    });

    // Update card balance
    await supabase
      .from("cards")
      .update({ spending_limit: availableBalance - amount })
      .eq("id", card.id);

    console.log(`Authorization ${auth.id} approved. New balance: ${availableBalance - amount}`);
  } else {
    // Decline the authorization
    await stripe.issuing.authorizations.decline(auth.id, {
      metadata: {
        declined_reason: "insufficient_balance",
        card_balance: availableBalance.toString(),
        requested_amount: amount.toString(),
      },
    });

    console.log(`Authorization ${auth.id} declined - insufficient balance`);
  }
}

// Handle authorization updated
async function handleAuthorizationUpdated(auth: Stripe.Issuing.Authorization) {
  console.log(`Authorization updated: ${auth.id} - Status: ${auth.status}`);

  const supabase = createClient();

  // Get the card
  const { data: card } = await supabase
    .from("cards")
    .select("*")
    .eq("stripe_card_id", auth.card)
    .single();

  if (!card) return;

  // If authorization was approved but not yet settled, create a pending transaction
  if (auth.status === "pending") {
    await supabase.from("transactions").insert({
      card_id: card.id,
      user_id: card.user_id,
      amount: -auth.amount / 100,
      type: "pending",
      description: auth.merchant_data?.name || "Pending authorization",
      status: "pending",
      stripe_authorization_id: auth.id,
      merchant: auth.merchant_data?.name || "Unknown",
      category: auth.merchant_data?.category || "Uncategorized",
      currency: auth.currency || "usd",
      created_at: new Date().toISOString(),
    });

    console.log(`Pending transaction created for authorization ${auth.id}`);
  }
}

// Handle authorization requested (real-time approval)
async function handleAuthorizationRequested(auth: Stripe.Issuing.Authorization) {
  console.log(`Authorization requested: ${auth.id}`);
  
  // This is the real-time endpoint for approving/declining authorizations
  // You can implement more complex logic here like fraud detection, spending limits, etc.

  const supabase = createClient();

  // Get the card
  const { data: card } = await supabase
    .from("cards")
    .select("*")
    .eq("stripe_card_id", auth.card)
    .single();

  if (!card) {
    // Decline if card not found
    await stripe.issuing.authorizations.decline(auth.id);
    return;
  }

  // You can implement custom logic here:
  // - Check daily spending limit
  // - Check fraud patterns
  // - Check if merchant is approved
  // - Check if card is active
  
  const amount = auth.amount / 100;
  const availableBalance = card.spending_limit || 0;

  // Check if card is active
  if (card.status !== "active") {
    await stripe.issuing.authorizations.decline(auth.id, {
      metadata: {
        declined_reason: "card_inactive",
      },
    });
    return;
  }

  // Check if sufficient balance
  if (availableBalance < amount) {
    await stripe.issuing.authorizations.decline(auth.id, {
      metadata: {
        declined_reason: "insufficient_balance",
      },
    });
    return;
  }

  // Optionally, check if merchant is allowed
  const merchantName = auth.merchant_data?.name?.toLowerCase() || "";
  const blockedMerchants = ["blocked_merchant", "fraudulent_merchant"]; // Your blocklist
  if (blockedMerchants.some(m => merchantName.includes(m))) {
    await stripe.issuing.authorizations.decline(auth.id, {
      metadata: {
        declined_reason: "blocked_merchant",
      },
    });
    return;
  }

  // Auto-approve if all checks pass
  await stripe.issuing.authorizations.approve(auth.id);
  console.log(`Authorization ${auth.id} auto-approved`);
}