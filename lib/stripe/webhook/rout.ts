import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

export async function POST(req: Request) {
  const body = await req.text();

  const signature = headers().get("stripe-signature");

  if (!signature) {
    return new NextResponse("Missing signature", {
      status: 400,
    });
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error(err);

    return new NextResponse("Invalid signature", {
      status: 400,
    });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;

      await prisma.transaction.create({
        data: {
          amount:
            (session.amount_total ?? 0) / 100,

          recipientEmail:
            session.customer_details?.email ??
            "",

          note:
            session.metadata?.note ?? "",

          stripeSessionId:
            session.id,

          stripePaymentId:
            session.payment_intent as string,

          currency:
            session.currency ?? "usd",

          status: "completed",
        },
      });

      break;
    }

    default:
      break;
  }

  return NextResponse.json({
    received: true,
  });
}