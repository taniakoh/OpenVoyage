import { createBrowserClient } from "@supabase/ssr";

import { getSupabaseEnv } from "@/utils/supabase/shared";

export function createClient() {
  const { supabaseUrl, supabasePublishableKey } = getSupabaseEnv();

  return createBrowserClient(supabaseUrl, supabasePublishableKey);
}
