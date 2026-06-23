"use client";

import { supabase } from "@/lib/supabase/client";

export async function getLoggedInUserClient() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    console.error(error);
    return null;
  }

  return user;
}