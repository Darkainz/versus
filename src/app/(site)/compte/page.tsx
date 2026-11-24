import type { Metadata } from "next";
import { Suspense } from "react";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { requireUser } from "@/lib/auth/dal";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { signOut } from "@/server/actions/auth";

export const metadata: Metadata = {
  title: "Mon compte",
  robots: { index: false, follow: false },
};

async function AccountOverview() {
  const user = await requireUser("/compte");
  const supabase = await createSupabaseServerClient();
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("full_name, phone")
    .eq("id", user.id)
    .maybeSingle();
  if (error) throw new Error("Impossible de charger le profil.", { cause: error });

  return (
    <div className="mt-8 rounded-card border border-line-soft bg-surface p-6">
      <p className="text-sm text-muted">Connecté avec {user.email ?? "votre compte"}.</p>
      {profile?.full_name ? (
        <p className="mt-2 text-lg font-semibold">Bonjour {profile.full_name}</p>
      ) : (
        <p className="mt-2 text-sm">Complétez votre profil pour enregistrer vos coordonnées.</p>
      )}
      {profile?.phone ? <p className="mt-2 text-sm">Téléphone : {profile.phone}</p> : null}
      <Link
        href="/compte/profil"
        className="mt-5 inline-flex min-h-11 items-center font-semibold underline"
      >
        Modifier mon profil
      </Link>
      <Link
        href="/compte/commandes"
        className="mt-2 inline-flex min-h-11 items-center font-semibold underline"
      >
        Mes commandes
      </Link>
      <Link
        href="/compte/adresses"
        className="mt-2 inline-flex min-h-11 items-center font-semibold underline"
      >
        Mes adresses
      </Link>
      <Link
        href="/compte/donnees"
        className="mt-2 inline-flex min-h-11 items-center font-semibold underline"
      >
        Mes données
      </Link>
      <form action={signOut} className="mt-6">
        <Button type="submit" variant="secondary">
          Se déconnecter
        </Button>
      </form>
    </div>
  );
}

export default function AccountPage() {
  return (
    <div className="wrap section">
      <h1 className="text-display-h2">Mon compte</h1>
      <Suspense fallback={<p className="mt-6 text-muted">Chargement du compte…</p>}>
        <AccountOverview />
      </Suspense>
    </div>
  );
}
