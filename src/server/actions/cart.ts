"use server";

import { getImageProps } from "next/image";
import { productHref } from "@/config/site";
import type { CartLine } from "@/lib/cart/cart-reducer";
import { cartQuoter } from "@/lib/cart/quoter";
import { QuoteError } from "@/lib/cart/compute-quote";
import { mergeCartLines, parseAccountCart } from "@/lib/cart/merge";
import type { CartLineMedia, CartQuote, PriceCartResult } from "@/lib/cart/quote";
import { quoteRequestSchema } from "@/lib/cart/schema";
import { supabaseEnv } from "@/lib/env.server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Recalcule le panier côté serveur (§5.8, ADR 003), selon le gabarit des Server Actions (§3.4) :
 * 1. `parse` zod : SKU, quantités et zone seulement (un prix envoyé fait refuser la requête) ;
 * 2. pas d'authentification : un devis est public et ne modifie rien ;
 * 3. calcul par `cartQuoter` (RPC `quote_cart` avec Supabase, catalogue statique sans configuration) ;
 * 4. aucune revalidation ;
 * 5. retour `{ ok: true, data, media }` ou `{ ok: false, code }`, sans détail interne ; `media`
 *    donne l'adresse de la fiche et la vignette de chaque ligne (calculées ici, pas dans le
 *    navigateur).
 *
 * Les prix, le stock et les totaux affichés viennent toujours d'ici, jamais du navigateur.
 */
export async function priceCart(input: unknown): Promise<PriceCartResult> {
  const parsed = quoteRequestSchema.safeParse(input);
  if (!parsed.success) return { ok: false, code: "VS_INVALID" };

  try {
    const data = await cartQuoter.quote(parsed.data.lines, parsed.data.zone);
    return { ok: true, data, media: lineMedia(data) };
  } catch (error) {
    if (error instanceof QuoteError) return { ok: false, code: error.code };
    console.error("priceCart : calcul du panier impossible", error);
    return { ok: false, code: "VS_UNAVAILABLE" };
  }
}

/** Fiche et vignette de chaque ligne : mêmes adresses et même optimiseur que le reste du site. */
function lineMedia(quote: CartQuote): Record<string, CartLineMedia> {
  const media: Record<string, CartLineMedia> = {};
  for (const line of quote.lines) {
    const { image_src: src, image_width: width, image_height: height } = line;
    const image =
      src && width && height
        ? getImageProps({ src, width, height, alt: "", sizes: "64px" }).props
        : null;
    media[line.sku] = {
      href: line.slug ? productHref(line.slug) : null,
      src: image?.src ?? null,
      srcSet: image?.srcSet ?? null,
    };
  }
  return media;
}
export async function syncCart(
  localItems: unknown,
  mode: "merge" | "replace",
  expectedUserId: string | null,
): Promise<
  | { status: "synced"; userId: string; lines: CartLine[] }
  | { status: "anonymous" }
  | { status: "overflow" }
  | { status: "error" }
> {
  if (mode !== "merge" && mode !== "replace") return { status: "error" };
  if (!supabaseEnv.NEXT_PUBLIC_SUPABASE_URL || !supabaseEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
    return { status: "anonymous" };
  }
  const supabase = await createSupabaseServerClient();
  const { data, error: claimsError } = await supabase.auth.getClaims();
  if (claimsError) {
    console.error("Impossible de vérifier le compte pour synchroniser le panier.", claimsError);
    return { status: "error" };
  }
  const userId = data?.claims.sub;
  if (typeof userId !== "string") return { status: "anonymous" };

  const localLines = parseAccountCart(localItems);
  let accountItems: unknown = [];
  if (mode === "merge" || expectedUserId !== userId) {
    const { data, error } = await supabase
      .from("carts")
      .select("items")
      .eq("user_id", userId)
      .maybeSingle();
    if (error) {
      console.error("Impossible de lire le panier du compte.", error);
      return { status: "error" };
    }
    accountItems = data?.items;
  }

  let lines = localLines;
  if (mode === "merge" || expectedUserId !== userId) {
    const result = mergeCartLines(localLines, accountItems);
    if (result.overflow) return { status: "overflow" };
    lines = result.lines;
  }
  const { error } = await supabase.from("carts").upsert({ user_id: userId, items: lines });
  if (error) {
    console.error("Impossible d’enregistrer le panier du compte.", error);
    return { status: "error" };
  }
  return { status: "synced", userId, lines };
}
