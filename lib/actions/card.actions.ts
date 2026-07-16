"use server";

import Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerClient } from "../supabaseServer";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-05-27.dahlia",
});

export interface CreateVirtualCardParams {
  bankId: string;
  userId: string;
  stripeCardholderId: string;
  stripeCustomerId: string;
}

export const createVirtualCard = async ({
  bankId,
  userId,
  stripeCardholderId,
  stripeCustomerId,
}: CreateVirtualCardParams) => {
  const supabase = createAdminClient();

  // Create Stripe Issuing card
  const card = await stripe.issuing.cards.create({
    cardholder: stripeCardholderId,
    currency: "usd",
    type: "virtual",
  });

  // Save to DB
  const { data, error } = await supabase
    .from("cards")
    .insert({
      bank_id: bankId,
      user_id: userId,
      stripe_card_id: card.id,
      stripe_cardholder_id: stripeCardholderId,
      stripe_customer_id: stripeCustomerId,
      brand: card.brand ?? "visa",
      last4: card.last4 ?? "0000",
      exp_month: card.exp_month ?? 0,
      exp_year: card.exp_year ?? 0,
      card_type: "virtual",
      status: card.status ?? "active",
      currency: card.currency ?? "USD",
    })
    .select()
    .single();

  if (error) throw error;

  return data;
};

export async function getCards(userId: string) {
  console.log("=== getCards called ===");
  console.log("User ID:", userId);

  try {
    // Try with admin client first (bypasses RLS)
    const adminSupabase = createAdminClient();
    
    const { data: adminData, error: adminError } = await adminSupabase
      .from("cards")
      .select("*")
      .eq("user_id", userId);

    console.log("Admin client query result:", { 
      count: adminData?.length || 0, 
      error: adminError 
    });

    if (!adminError && adminData && adminData.length > 0) {
      console.log("Cards found with admin client:", adminData);
      return adminData;
    }

    // If admin client fails, try with server client
    const supabase = await createServerClient();
    
    const { data, error } = await supabase
      .from("cards")
      .select("*")
      .eq("user_id", userId);

    console.log("Server client query result:", { 
      count: data?.length || 0, 
      error: error 
    });

    if (error) {
      console.error("Error in getCards:", error);
      // If there's an RLS error, try without the user_id filter
      if (error.code === 'PGRST301' || error.message.includes('permission')) {
        console.log("RLS error detected, trying without filter...");
        const { data: allData, error: allError } = await supabase
          .from("cards")
          .select("*")
          .limit(10);
        
        console.log("All cards (no filter):", { 
          count: allData?.length || 0, 
          error: allError 
        });
        
        // Filter manually
        if (allData && !allError) {
          const filtered = allData.filter(card => card.user_id === userId);
          console.log("Manually filtered cards:", filtered);
          return filtered;
        }
      }
      
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("Exception in getCards:", error);
    return [];
  }
}

export async function getAllCards() {
  const adminSupabase = createAdminClient();
  
  const { data, error } = await adminSupabase
    .from("cards")
    .select("*");

  if (error) {
    console.error("Error fetching all cards:", error);
    return [];
  }

  return data || [];
}