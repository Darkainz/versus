import type { Metadata } from "next";
import Link from "next/link";
import { AuthForm } from "@/components/auth/AuthForm";

export const metadata: Metadata = {
  title: "Mot de passe oublié",
  robots: { index: false, follow: false },
};

export default function ForgotPasswordPage() {
  return (
    <>
      <h1 className="mt-8 text-2xl font-bold">Mot de passe oublié</h1>
      <p className="mt-2 text-sm text-muted">
        En démonstration locale, le lien de réinitialisation est envoyé dans Mailpit.
      </p>
      <AuthForm mode="forgot-password" />
      <Link href="/connexion" className="mt-4 inline-flex min-h-11 items-center text-sm underline">
        Retour à la connexion
      </Link>
    </>
  );
}
