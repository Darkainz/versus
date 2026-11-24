import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthForm } from "@/components/auth/AuthForm";
import { requireUser } from "@/lib/auth/dal";

export const metadata: Metadata = {
  title: "Réinitialiser le mot de passe",
  robots: { index: false, follow: false },
};

async function ResetPasswordForm() {
  await requireUser("/reinitialiser-mot-de-passe");
  return <AuthForm mode="update-password" />;
}

export default function ResetPasswordPage() {
  return (
    <>
      <h1 className="mt-8 text-2xl font-bold">Choisir un nouveau mot de passe</h1>
      <p className="mt-2 text-sm text-muted">Choisissez au moins 8 caractères.</p>
      <Suspense fallback={<p className="mt-6 text-muted">Vérification du lien…</p>}>
        <ResetPasswordForm />
      </Suspense>
    </>
  );
}
