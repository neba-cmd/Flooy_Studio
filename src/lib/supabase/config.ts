export function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!url || !key) {
    throw new Error(
      "Supabase environment variables are not configured. Add NEXT_PUBLIC_SUPABASE_URL and either NEXT_PUBLIC_SUPABASE_ANON_KEY or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in Vercel."
    );
  }

  if (url.endsWith(".supabase.com")) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL should end with .supabase.co, not .supabase.com. Copy the Project URL from Supabase Project Settings > API."
    );
  }

  return { url, key };
}
