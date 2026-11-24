import "server-only";

import { isSupabaseConfigured, supabase } from "@/lib/supabase/public";

export type DatabaseStatus = "ok" | "erreur" | "non configurée";

const TIMEOUT_MS = 3000;

/**
 * Interroge la base par `public.ping()` (fonction sans donnée, ouverte à `anon`), avec un délai de
 * 3 s. Ne renvoie jamais le détail de l'erreur : une sonde publique ne doit rien révéler.
 */
export async function checkDatabase(): Promise<DatabaseStatus> {
  if (!isSupabaseConfigured) return "non configurée";
  try {
    const answer = await Promise.race([
      supabase.rpc("ping"),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error("délai")), TIMEOUT_MS)),
    ]);
    return !answer.error && answer.data === true ? "ok" : "erreur";
  } catch {
    return "erreur";
  }
}
