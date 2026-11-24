import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { AddressForm } from "@/components/account/AddressForm";
import { AddressDeleteButton } from "@/components/account/AddressDeleteButton";
import { requireUser } from "@/lib/auth/dal";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Mes adresses",
  robots: { index: false, follow: false },
};

async function AddressesContent() {
  const user = await requireUser("/compte/adresses");
  const supabase = await createSupabaseServerClient();
  const [{ data: addresses, error: addressError }, { data: zones, error: zoneError }] =
    await Promise.all([
      supabase
        .from("addresses")
        .select(
          "id, label, recipient_name, phone, zone_code, city, district, landmark, instructions, is_default",
        )
        .eq("user_id", user.id)
        .order("is_default", { ascending: false })
        .order("created_at", { ascending: true }),
      supabase
        .from("delivery_zones")
        .select("code, label")
        .eq("is_active", true)
        .order("position", { ascending: true }),
    ]);
  if (addressError) throw new Error("Impossible de charger les adresses.", { cause: addressError });
  if (zoneError)
    throw new Error("Impossible de charger les zones de livraison.", { cause: zoneError });

  return (
    <>
      <section className="mt-8 rounded-card border border-line-soft bg-surface p-6">
        <h2 className="text-lg font-semibold">Ajouter une adresse</h2>
        <div className="mt-5">
          <AddressForm zones={zones ?? []} />
        </div>
      </section>
      <section className="mt-8 space-y-5">
        <h2 className="text-lg font-semibold">Adresses enregistrées</h2>
        {addresses?.length ? (
          addresses.map((address) => (
            <article
              key={address.id}
              className="rounded-card border border-line-soft bg-surface p-6"
            >
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <h3 className="font-semibold">
                  {address.label}
                  {address.is_default ? " · Par défaut" : ""}
                </h3>
                <AddressDeleteButton id={address.id} />
              </div>
              <AddressForm address={address} zones={zones ?? []} />
            </article>
          ))
        ) : (
          <p className="rounded-card border border-line-soft bg-surface p-6 text-muted">
            Vous n’avez pas encore enregistré d’adresse.
          </p>
        )}
      </section>
      <Link href="/compte" className="mt-6 inline-flex min-h-11 items-center underline">
        Retour à mon compte
      </Link>
    </>
  );
}

export default function AddressesPage() {
  return (
    <div className="wrap section">
      <h1 className="text-display-h2">Mes adresses</h1>
      <Suspense fallback={<p className="mt-6 text-muted">Chargement des adresses…</p>}>
        <AddressesContent />
      </Suspense>
    </div>
  );
}
