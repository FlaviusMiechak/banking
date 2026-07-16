///import { createClient as createSupabaseClient } from "@supabase/supabase-js";

//const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
//const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
//
// Export both the instance and a function
//export const supabase = createSupabaseClient(supabaseUrl, supabaseAnonKey);

//export const createClient = () => {
  //return createSupabaseClient(supabaseUrl, supabaseAnonKey);
//};

// lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}