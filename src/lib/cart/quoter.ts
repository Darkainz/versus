import "server-only";
import { isSupabaseConfigured } from "@/lib/supabase/public";
import type { CartQuoter } from "./quote";
import { staticCartQuoter } from "./static-quoter";
import { supabaseCartQuoter } from "./supabase-quoter";

/**
 * Seul point de bascule du calcul du panier (ADR 003). Avec Supabase configuré, la RPC
 * `quote_cart` et la table `delivery_zones` font foi. Le calcul local reste disponible pour le
 * développement sans base locale configurée.
 */
export const cartQuoter: CartQuoter = isSupabaseConfigured ? supabaseCartQuoter : staticCartQuoter;
