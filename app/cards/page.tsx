import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function CardsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_cardholder_id")
    .eq("id", user.id)
    .single();

  if (!profile?.stripe_cardholder_id) {
    return (
      <main className="p-8">
        <p className="text-red-500">
          Stripe cardholder not found
        </p>
      </main>
    );
  }

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL}/api/cards`,
    { cache: "no-store" }
  );

  if (!res.ok) {
    return (
      <main className="p-8">
        <p>Failed to load cards</p>
      </main>
    );
  }

  const json = await res.json();
  const cards = json.data || [];

  return (
    <main className="max-w-3xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">My Cards</h1>

      {cards.length === 0 ? (
        <div className="rounded-xl border p-6">
          <p>No cards available.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {cards.map((card: any) => (
            <div key={card.id} className="rounded-xl border p-6">
              <h2 className="text-lg font-semibold">
                Virtual Card
              </h2>

              <p className="text-2xl tracking-widest">
                **** **** **** {card.last4}
              </p>

              <p>Status: {card.status}</p>
              <p>Type: {card.type}</p>
              <p>Currency: {card.currency}</p>

              <a
                href={`/cards/${card.id}`}
                className="inline-block mt-4 bg-green-600 text-white px-4 py-2 rounded"
              >
                Reveal Card
              </a>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}