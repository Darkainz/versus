import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { Price } from "@/components/ui/Price";
import { requireUser } from "@/lib/auth/dal";
import { ORDER_STATUS_LABELS, PAYMENT_STATUS_LABELS } from "@/lib/orders/labels";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Mes commandes",
  robots: { index: false, follow: false },
};

async function OrdersContent() {
  const user = await requireUser("/compte/commandes");
  const supabase = await createSupabaseServerClient();
  const { data: orders, error } = await supabase
    .from("orders")
    .select("number, status, payment_status, total_fcfa, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  if (error) throw new Error("Impossible de charger les commandes du compte.", { cause: error });
  const validOrders = orders.map((order) => {
    if (order.total_fcfa === null) {
      throw new Error("Une commande du compte ne contient pas de total valide.");
    }
    return { ...order, total_fcfa: order.total_fcfa };
  });

  if (validOrders.length === 0) {
    return (
      <p className="mt-8 rounded-card border border-line-soft bg-surface p-6 text-muted">
        Aucune commande n’est encore rattachée à ce compte.
      </p>
    );
  }

  return (
    <ul className="mt-8 grid gap-4">
      {validOrders.map((order) => (
        <li key={order.number} className="rounded-card border border-line-soft bg-surface p-5">
          <Link
            href={`/compte/commandes/${encodeURIComponent(order.number)}`}
            className="font-semibold underline"
          >
            Commande {order.number}
          </Link>
          <p className="mt-2 text-sm text-muted">
            {new Intl.DateTimeFormat("fr-FR", {
              dateStyle: "long",
              timeStyle: "short",
              timeZone: "Africa/Lome",
            }).format(new Date(order.created_at))}
          </p>
          <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-muted">État</dt>
              <dd>{ORDER_STATUS_LABELS[order.status]}</dd>
            </div>
            <div>
              <dt className="text-muted">Paiement</dt>
              <dd>{PAYMENT_STATUS_LABELS[order.payment_status]}</dd>
            </div>
            <div>
              <dt className="text-muted">Total simulé</dt>
              <dd>
                <Price amount={order.total_fcfa} />
              </dd>
            </div>
          </dl>
        </li>
      ))}
    </ul>
  );
}

export default function OrdersPage() {
  return (
    <div className="wrap section">
      <h1 className="text-display-h2">Mes commandes</h1>
      <Suspense fallback={<p className="mt-6 text-muted">Chargement des commandes…</p>}>
        <OrdersContent />
      </Suspense>
      <Link href="/compte" className="mt-6 inline-flex min-h-11 items-center underline">
        Retour à mon compte
      </Link>
    </div>
  );
}
