"use client";

import { supabase } from "@/lib/supabase/client";

export default async function getLoggedInUserClient() {
  // Get authenticated user
  const {
    data: { user: authUser },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !authUser) {
    console.error(authError);
    return null;
  }

  // Get corresponding row from public.users
  const { data: user, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", authUser.id) // or .eq("auth_user_id", authUser.id)
    .single();

  if (error) {
    console.error(error);
    return null;
  }

  return user;
}