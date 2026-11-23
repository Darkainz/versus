import { cache } from "react";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { cookies } from "next/headers";
import { supabaseEnv } from "@/lib/env.server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const getClaims = cache(async () => {
  await connection();
  await cookies();
  if (!supabaseEnv.NEXT_PUBLIC_SUPABASE_URL || !supabaseEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)
    return null;

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error) {
    console.error("Impossible de vérifier la session Supabase.", error);
    return null;
  }
  return data?.claims ?? null;
});

export async function requireUser(redirectTo = "/compte") {
  const claims = await getClaims();
  if (typeof claims?.sub !== "string") {
    redirect(`/connexion?redirect=${encodeURIComponent(redirectTo)}`);
  }
  return { id: claims.sub, email: typeof claims.email === "string" ? claims.email : null };
}

export async function requireAdmin(redirectTo = "/admin") {
  const user = await requireUser(redirectTo);
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();
  if (error) throw new Error("Impossible de vérifier le rôle du compte.", { cause: error });
  if (data?.role !== "admin") notFound();
  return user;
}
