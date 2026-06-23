import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export function createAdminClient() {
  if (
    !supabaseUrl ||
    !serviceRoleKey ||
    serviceRoleKey === ""
  ) {
    throw new Error(
      "Missing SUPABASE_SERVICE_ROLE_KEY. Add your Supabase service role key to .env for server-side signup setup."
    );
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
