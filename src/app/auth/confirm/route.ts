import { NextResponse, type NextRequest } from "next/server";
import { safeRedirect } from "@/lib/auth/safe-redirect";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { siteUrl } from "@/lib/env";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const tokenHash = params.get("token_hash");
  const type = params.get("type");
  if (!tokenHash || (type !== "email" && type !== "recovery")) {
    return NextResponse.redirect(new URL("/connexion?erreur=lien-invalide", siteUrl));
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
  if (error) {
    console.error("La vérification du lien Auth a échoué.", error);
    return NextResponse.redirect(new URL("/connexion?erreur=lien-expire", siteUrl));
  }

  const fallback = type === "recovery" ? "/reinitialiser-mot-de-passe" : "/compte";
  const destination = safeRedirect(params.get("next"), fallback);
  return NextResponse.redirect(new URL(destination, siteUrl));
}
