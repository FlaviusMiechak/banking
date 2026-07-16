"use server";

import { createClient } from "@/lib/supabase/server";

export async function getLoggedInUser() {
  try {
    const supabase = createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      console.error("Auth error:", error);
      return null;
    }

    // Get user data from your users table
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("id", user.id)
      .single();

    if (userError) {
      console.error("User data error:", userError);
      // Return basic user info if profile doesn't exist
      return {
        id: user.id,
        email: user.email,
        first_name: user.user_metadata?.first_name || 'User',
        last_name: user.user_metadata?.last_name || '',
        kyc_submitted: false,
        kyc_status: 'pending',
      };
    }

    return userData;
  } catch (error) {
    console.error("Error fetching user:", error);
    return null;
  }
}