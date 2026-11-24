import type { Metadata } from "next";
import Link from "next/link";
import { AuthForm } from "@/components/auth/AuthForm";

export const metadata: Metadata = {
  title: "Créer un compte",
  robots: { index: false, follow: false },
};

export default function SignUpPage() {
  return (
    <>
      <h1 className="mt-8 text-2xl font-bold">Créer un compte</h1>
      <p className="mt-2 text-sm text-muted">
        Votre compte VERSUS est réservé à cette démonstration.
      </p>
      <AuthForm mode="sign-up" />
      <p className="mt-5 text-sm">
        Vous avez déjà un compte ?{" "}
        <Link href="/connexion" className="font-semibold underline">
          Se connecter
        </Link>
      </p>
    </>
  );
}
