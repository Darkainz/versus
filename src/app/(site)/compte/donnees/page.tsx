import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { DeleteAccountForm } from "@/components/account/DeleteAccountForm";
import { requireUser } from "@/lib/auth/dal";

export const metadata: Metadata = {
  title: "Mes données",
  robots: { index: false, follow: false },
};

async function AccountDataContent() {
  await requireUser("/compte/donnees");
  return (
    <>
      <section className="mt-8 rounded-card border border-line-soft bg-surface p-6">
        <h2 className="text-lg font-semibold">Exporter mes données</h2>
        <p className="mt-2 text-sm text-muted">
          Téléchargez une copie JSON de votre profil, de vos adresses, de votre panier et de vos
          commandes.
        </p>
        <a
          href="/compte/donnees/export"
          className="mt-5 inline-flex min-h-11 items-center font-semibold underline"
        >
          Télécharger mes données
        </a>
      </section>
      <section className="mt-8 rounded-card border border-danger/30 bg-surface p-6">
        <h2 className="text-lg font-semibold">Supprimer mon compte</h2>
        <p className="mt-2 text-sm text-muted">
          Cette action est définitive. Les données de compte seront supprimées et les commandes
          conservées à des fins de suivi, après anonymisation.
        </p>
        <DeleteAccountForm />
      </section>
      <Link href="/compte" className="mt-6 inline-flex min-h-11 items-center underline">
        Retour à mon compte
      </Link>
    </>
  );
}

export default function AccountDataPage() {
  return (
    <div className="wrap section">
      <h1 className="text-display-h2">Mes données</h1>
      <Suspense fallback={<p className="mt-6 text-muted">Chargement des données…</p>}>
        <AccountDataContent />
      </Suspense>
    </div>
  );
}
