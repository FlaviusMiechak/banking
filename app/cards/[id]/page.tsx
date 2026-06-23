//card/[id]/page.tsx

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function CardDetailsPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  // Get Stripe cardholder
  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_cardholder_id")
    .eq("id", user.id)
    .single();

  if (!profile?.stripe_cardholder_id) {
    return <p>Stripe cardholder not found</p>;
  }

  // Fetch all cards from API
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL}/api/cards`,
    { cache: "no-store" }
  );

  if (!res.ok) {
    return <p>Failed to load cards</p>;
  }

  const cards = await res.json();

  // Find specific card
  const card = cards.find((c: any) => c.id === params.id);

  if (!card) {
    return <p>Card not found</p>;
  }

  return (
    <main className="max-w-2xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">
        Card Details
      </h1>

      <div className="rounded-xl border p-6 space-y-3">
        <p className="text-xl tracking-widest">
          **** **** **** {card.last4}
        </p>

        <p>Status: {card.status}</p>
        <p>Type: {card.type}</p>
        <p>Currency: {card.currency}</p>
        <p>Exp Month: {card.exp_month}</p>
        <p>Exp Year: {card.exp_year}</p>
      </div>
    </main>
  );
}