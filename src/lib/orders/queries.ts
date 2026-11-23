import "server-only";

import { connection } from "next/server";
import { cookies } from "next/headers";
import { ORDER_NUMBER_PATTERN, orderViewSchema } from "./order-view";
import { isSupabaseConfigured } from "@/lib/supabase/public";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export function orderTokenCookieName(number: string): string | null {
  return ORDER_NUMBER_PATTERN.test(number) ? `vs_ot_${number}` : null;
}

export async function getOrderForViewer(number: string) {
  await connection();
  const cookieName = orderTokenCookieName(number);
  if (!cookieName || !isSupabaseConfigured) return null;

  const token = (await cookies()).get(cookieName)?.value;
  const serverClient = await createSupabaseServerClient();
  const { data, error } = await serverClient.rpc("get_order_for_viewer", {
    p_number: number,
    p_token: token ?? "",
  });
  if (error) {
    throw new Error(`Impossible de lire la commande ${number} : ${error.message}`, {
      cause: error,
    });
  }
  if (data === null) return null;

  const parsed = orderViewSchema.safeParse(data);
  if (!parsed.success) throw new Error("La commande renvoyée par Supabase est invalide.");
  return parsed.data;
}

export async function getOrderToken(number: string): Promise<string | null> {
  const cookieName = orderTokenCookieName(number);
  if (!cookieName) return null;
  return (await cookies()).get(cookieName)?.value ?? null;
}
