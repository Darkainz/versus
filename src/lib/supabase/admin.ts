import "server-only";

import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { supabaseEnv } from "@/lib/env.server";

export function createSupabaseAdminClient() {
  const url = supabaseEnv.NEXT_PUBLIC_SUPABASE_URL;
  const secretKey = supabaseEnv.SUPABASE_SECRET_KEY;
  if (!url || !secretKey) {
    throw new Error("La clé secrète Supabase est absente.");
  }

  return createClient<Database>(url, secretKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });
}
