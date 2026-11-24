import "server-only";

import { z } from "zod";
import { BRANDS } from "@/lib/brand-themes";
import { supabase } from "@/lib/supabase/public";
import { QuoteError } from "./compute-quote";
import type { CartQuote, CartQuoter, QuoteErrorCode, QuoteItem, QuoteIssue } from "./quote";

const zoneCodeSchema = z.enum(["lome", "maritime", "plateaux", "centrale", "kara", "savanes"]);
const quoteIssueSchema = z.enum([
  "unavailable",
  "insufficient_stock",
  "qty_capped",
  "price_changed",
]);
const visualKindSchema = z.enum(["phone", "watch", "round", "band", "buds"]);

const quoteSchema = z.object({
  lines: z.array(
    z.object({
      sku: z.string(),
      name: z.string(),
      slug: z.string().nullable(),
      variant_label: z.string().nullable(),
      color_hex: z.string().nullable(),
      brand_slug: z.enum(BRANDS).nullable(),
      visual_kind: visualKindSchema.nullable(),
      image_src: z.string().nullable(),
      image_width: z.number().int().positive().nullable(),
      image_height: z.number().int().positive().nullable(),
      qty: z.number().int().positive(),
      stock: z.number().int().nonnegative(),
      price_fcfa: z.number().int().positive().nullable(),
      line_total_fcfa: z.number().int().nonnegative(),
      issues: z.array(quoteIssueSchema),
    }),
  ),
  subtotal_fcfa: z.number().int().nonnegative(),
  delivery_fee_fcfa: z.number().int().nonnegative(),
  total_fcfa: z.number().int().nonnegative(),
  zone_code: zoneCodeSchema.nullable(),
  zone_label: z.string().nullable(),
  eta_label: z.string().nullable(),
  valid: z.boolean(),
});

const deliveryZoneSchema = z.object({
  code: zoneCodeSchema,
  label: z.string(),
  fee_fcfa: z.number().int().nonnegative(),
  free_from_fcfa: z.number().int().positive().nullable(),
  eta_label: z.string(),
});

function parseQuote(data: unknown): CartQuote {
  const parsed = quoteSchema.safeParse(data);
  if (!parsed.success)
    throw new Error("Le devis renvoyé par Supabase ne respecte pas son contrat.");
  return {
    ...parsed.data,
    lines: parsed.data.lines.map((line) => ({
      ...line,
      issues: line.issues as QuoteIssue[],
    })),
  };
}

function rpcError(message: string): QuoteError | null {
  const code = message.trim() as QuoteErrorCode;
  return code === "VS_INVALID" || code === "VS_INVALID_ZONE" ? new QuoteError(code) : null;
}

function rpcItems(items: readonly QuoteItem[]) {
  return items.map(({ sku, qty, price_fcfa }) =>
    price_fcfa === undefined ? { sku, qty } : { sku, qty, price_fcfa },
  );
}

/**
 * Adaptateur du panier pour Supabase : la RPC reste la seule source des prix, stocks et totaux.
 * Son résultat JSON est validé ici avant d'être transmis aux composants du panier.
 */
export const supabaseCartQuoter: CartQuoter = {
  async quote(items, zoneCode) {
    const { data, error } = await supabase.rpc("quote_cart", {
      p_items: rpcItems(items),
      p_zone_code: zoneCode ?? undefined,
    });
    if (error) {
      const knownError = rpcError(error.message);
      if (knownError) throw knownError;
      throw new Error(`Erreur Supabase pendant le calcul du panier : ${error.message}`, {
        cause: error,
      });
    }
    return parseQuote(data);
  },

  async listZones() {
    const { data, error } = await supabase
      .from("delivery_zones")
      .select("code, label, fee_fcfa, free_from_fcfa, eta_label")
      .order("position");
    if (error) throw new Error(`Erreur Supabase pendant la lecture des zones : ${error.message}`);

    const parsed = z.array(deliveryZoneSchema).safeParse(data);
    if (!parsed.success)
      throw new Error("Les zones de livraison renvoyées par Supabase sont invalides.");
    return parsed.data;
  },
};
