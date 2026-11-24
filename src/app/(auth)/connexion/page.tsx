import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { AuthForm } from "@/components/auth/AuthForm";

export const metadata: Metadata = { title: "Connexion", robots: { index: false, follow: false } };

async function SignInForm({
  searchParams,
}: {
  searchParams: PageProps<"/connexion">["searchParams"];
}) {
  const query = await searchParams;
  const redirectTo = typeof query.redirect === "string" ? query.redirect : "/compte";
  return (
    <div>
      <AuthForm mode="sign-in" redirectTo={redirectTo} />
      <p className="mt-5 text-sm">
        Nouveau chez VERSUS ?{" "}
        <Link href="/inscription" className="font-semibold underline">
          Créer un compte
        </Link>
      </p>
    </div>
  );
}

export default function SignInPage(props: PageProps<"/connexion">) {
  return (
    <>
      <h1 className="mt-8 text-2xl font-bold">Connexion</h1>
      <p className="mt-2 text-sm text-muted">Connectez-vous pour retrouver votre espace client.</p>
      <Suspense fallback={<p className="mt-6 text-muted">Chargement du formulaire…</p>}>
        <SignInForm searchParams={props.searchParams} />
      </Suspense>
    </>
  );
}
