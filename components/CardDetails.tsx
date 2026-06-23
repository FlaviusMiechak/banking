"use client";

import { useEffect, useRef, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";

type CardDetailsProps = {
  stripeCardId: string;
};

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

export default function CardDetails({
  stripeCardId,
}: CardDetailsProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const numberRef = useRef<HTMLDivElement>(null);
  const expiryRef = useRef<HTMLDivElement>(null);
  const cvcRef = useRef<HTMLDivElement>(null);
  const copyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let mounted = true;

    async function initialize() {
      try {
        const stripe = await stripePromise;

        if (!stripe) {
          throw new Error("Stripe failed to initialize.");
        }

        // Create a nonce in the browser
        const nonceResult = await stripe.createEphemeralKeyNonce({
          issuingCard: stripeCardId,
        });

        // Exchange the nonce for an ephemeral key
        const response = await fetch("/api/stripe/ephemeral-key", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            card_id: stripeCardId,
            nonce: nonceResult.nonce,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Unable to retrieve card.");
        }

        const elements = stripe.elements();

        const commonOptions = {
          issuingCard: stripeCardId,
          nonce: nonceResult.nonce,
          ephemeralKeySecret: data.ephemeralKeySecret,
          style: {
            base: {
              fontSize: "16px",
              color: "#111827",
            },
          },
        };

        const number = elements.create(
          "issuingCardNumberDisplay",
          commonOptions
        );

        const expiry = elements.create(
          "issuingCardExpiryDisplay",
          commonOptions
        );

        const cvc = elements.create(
          "issuingCardCvcDisplay",
          commonOptions
        );

        const copy = elements.create(
          "issuingCardCopyButton",
          commonOptions
        );

        if (mounted) {
          number.mount(numberRef.current!);
          expiry.mount(expiryRef.current!);
          cvc.mount(cvcRef.current!);
          copy.mount(copyRef.current!);
          setLoading(false);
        }
      } catch (err: any) {
        if (mounted) {
          setError(err.message);
          setLoading(false);
        }
      }
    }

    initialize();

    return () => {
      mounted = false;
    };
  }, [stripeCardId]);

  if (loading) {
    return (
      <div className="rounded-xl border p-6">
        Loading card details...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-300 bg-red-50 p-6">
        <p className="font-medium text-red-600">
          {error}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 rounded-xl border bg-white p-6 shadow-sm">
      <div>
        <p className="mb-2 text-sm font-medium text-gray-500">
          Card Number
        </p>

        <div
          ref={numberRef}
          className="rounded border p-3"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="mb-2 text-sm font-medium text-gray-500">
            Expiry
          </p>

          <div
            ref={expiryRef}
            className="rounded border p-3"
          />
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-gray-500">
            CVC
          </p>

          <div
            ref={cvcRef}
            className="rounded border p-3"
          />
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-gray-500">
          Copy Card Number
        </p>

        <div ref={copyRef} />
      </div>
    </div>
  );
}