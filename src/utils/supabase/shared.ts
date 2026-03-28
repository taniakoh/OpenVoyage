const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;

const supabasePublishableKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ?? process.env.SUPABASE_ANON_KEY;

export function getSupabaseEnv() {
  if (!supabaseUrl) {
    throw new Error("Missing Supabase URL. Set NEXT_PUBLIC_SUPABASE_URL in your environment.");
  }

  if (!supabasePublishableKey) {
    throw new Error(
      "Missing Supabase publishable key. Set NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY in your environment."
    );
  }

  return {
    supabaseUrl,
    supabasePublishableKey
  };
}
