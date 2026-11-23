import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { AuthForm } from "@/components/auth/AuthForm";
import { ProfileForm } from "@/components/account/ProfileForm";
import { requireUser } from "@/lib/auth/dal";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Mon profil",
  robots: { index: false, follow: false },
};

async function ProfileContent() {
  const user = await requireUser("/compte/profil");
  const supabase = await createSupabaseServerClient();
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("full_name, phone")
    .eq("id", user.id)
    .maybeSingle();
  if (error) throw new Error("Impossible de charger le profil.", { cause: error });
  if (!profile) throw new Error("Le profil du compte est introuvable.");

  return (
    <>
      <p className="mt-3 text-muted">Adresse e-mail : {user.email ?? "non renseignée"}</p>
      <section className="mt-8 rounded-card border border-line-soft bg-surface p-6">
        <h2 className="text-lg font-semibold">Coordonnées</h2>
        <ProfileForm fullName={profile.full_name} phone={profile.phone} />
      </section>
      <section className="mt-8 rounded-card border border-line-soft bg-surface p-6">
        <h2 className="text-lg font-semibold">Mot de passe</h2>
        <p className="mt-2 text-sm text-muted">Choisissez au moins 8 caractères.</p>
        <AuthForm mode="update-password" />
      </section>
      <Link href="/compte" className="mt-6 inline-flex min-h-11 items-center underline">
        Retour à mon compte
      </Link>
    </>
  );
}

export default function ProfilePage() {
  return (
    <div className="wrap section">
      <h1 className="text-display-h2">Mon profil</h1>
      <Suspense fallback={<p className="mt-6 text-muted">Chargement du profil…</p>}>
        <ProfileContent />
      </Suspense>
    </div>
  );
}
