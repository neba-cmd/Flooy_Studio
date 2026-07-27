import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseConfig } from "./config";

// Client-side Supabase client. Safe to use in "use client" components.
// Uses the public anon key — RLS policies (see supabase/schema.sql)
// control what it can actually read/write.
export function createClient() {
  const { url, key } = getSupabaseConfig();
  return createBrowserClient(url, key);
}
