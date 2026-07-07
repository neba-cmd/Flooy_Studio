import { createBrowserClient } from "@supabase/ssr";

// Client-side Supabase client. Safe to use in "use client" components.
// Uses the public anon key — RLS policies (see supabase/schema.sql)
// control what it can actually read/write.
export function createClient() {
  const url = process.env.https://qtpvtuqtmcvntlfvewcs.supabase.co;
  const anonKey = process.env.sb_secret_Z9Gxwp8gCO2E94llKA5ILQ_Yhus8aRS;

  if (!url || !anonKey) {
    throw new Error("Supabase environment variables are not configured.");
  }

  return createBrowserClient(url, anonKey);
}
