import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import CardDetailsClient from "./CardDetailsClient";

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

  // Get the card from Supabase
  const { data: card, error } = await supabase
    .from("cards")
    .select("*")
    .eq("id", params.id)
    .eq("user_id", user.id)
    .single();

  if (error || !card) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Card Not Found</h2>
          <p className="text-gray-600 text-sm mb-4">
            The card you're looking for doesn't exist or you don't have permission to view it.
          </p>
          <div className="bg-gray-50 rounded-lg p-3 text-left text-xs font-mono text-gray-600 mb-6">
            <p><span className="text-gray-400">Card ID:</span> {params.id}</p>
            <p><span className="text-gray-400">User ID:</span> {user.id}</p>
            {error && <p className="text-red-500 mt-1">Error: {error.message}</p>}
          </div>
          <a 
            href="/dashboard" 
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Dashboard
          </a>
        </div>
      </div>
    );
  }

  return <CardDetailsClient card={card} user={user} />;
}