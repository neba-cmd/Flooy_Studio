import { createClient } from "@supabase/supabase-js";
import { getSupabaseConfig } from "./config";

export function createAdminClient() {
  const secretKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!secretKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured");

  const { url } = getSupabaseConfig();
  return createClient(url, secretKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}
