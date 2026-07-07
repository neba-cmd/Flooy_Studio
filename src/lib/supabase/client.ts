import { createBrowserClient } from "@supabase/ssr";

// Client-side Supabase client. Safe to use in "use client" components.
// Uses the public anon key — RLS policies (see supabase/schema.sql)
// control what it can actually read/write.
export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Supabase environment variables are not configured. Replace the placeholder values in .env.local with your real Supabase URL and anon key."
    );
  }

  return createBrowserClient(url, anonKey);
}
