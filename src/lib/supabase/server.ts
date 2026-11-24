import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/lib/database.types";
import { supabaseEnv } from "@/lib/env.server";

export async function createSupabaseServerClient() {
  const url = supabaseEnv.NEXT_PUBLIC_SUPABASE_URL;
  const key = supabaseEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error("La configuration Supabase côté serveur est absente.");

  const cookieStore = await cookies();
  return createServerClient<Database>(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch (error) {
          console.error(
            "Impossible d'actualiser les cookies Supabase depuis ce contexte serveur.",
            error,
          );
        }
      },
    },
  });
}
