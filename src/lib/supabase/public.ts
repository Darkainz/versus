import "server-only";

import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { supabaseEnv } from "@/lib/env.server";

export const isSupabaseConfigured = Boolean(
  supabaseEnv.NEXT_PUBLIC_SUPABASE_URL && supabaseEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
);

const url = supabaseEnv.NEXT_PUBLIC_SUPABASE_URL || "http://127.0.0.1:54321";
const key =
  supabaseEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "sb_publishable_dummy_key_for_tests";

export const supabase = createClient<Database>(url, key, {
  auth: {
    autoRefreshToken: false,
    detectSessionInUrl: false,
    persistSession: false,
  },
});
